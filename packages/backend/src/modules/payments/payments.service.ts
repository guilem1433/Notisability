import crypto from 'crypto';
import { OrderStatus, PaymentStatus, Prisma, RoleName } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { mpPayment, mpPreference } from '../../config/mercadopago';
import { env } from '../../config/env';
import { AppError } from '../../common/errors/AppError';
import { WebhookQueryDto } from './payments.dto';

export interface RequesterContext {
  id: string;
  role: RoleName;
}

/**
 * Traduce los estados de pago de Mercado Pago al enum interno.
 * https://www.mercadopago.com.co/developers/es/docs/checkout-api/payment-management/payment-status
 */
function mapMercadoPagoStatus(status: string | undefined): PaymentStatus {
  switch (status) {
    case 'approved':
      return PaymentStatus.APPROVED;
    case 'in_process':
    case 'pending':
      return status === 'pending' ? PaymentStatus.PENDING : PaymentStatus.IN_PROCESS;
    case 'rejected':
      return PaymentStatus.REJECTED;
    case 'cancelled':
      return PaymentStatus.CANCELLED;
    case 'refunded':
      return PaymentStatus.REFUNDED;
    case 'charged_back':
      return PaymentStatus.CHARGED_BACK;
    default:
      return PaymentStatus.PENDING;
  }
}

export class PaymentsService {
  /**
   * Crea (o reutiliza) una preferencia de pago de Checkout Pro para una orden.
   */
  async createPreference(orderId: string, requester: RequesterContext) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });

    if (!order) {
      throw AppError.notFound('Orden no encontrada');
    }

    if (requester.role !== RoleName.ADMIN && order.userId !== requester.id) {
      throw AppError.forbidden('No tiene permisos sobre esta orden');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw AppError.conflict('La orden no esta pendiente de pago');
    }

    const preference = await mpPreference.create({
      body: {
        external_reference: order.id,
        items: order.items.map((item) => ({
          id: item.productId,
          title: item.productTitle,
          quantity: item.quantity,
          unit_price: Number(item.unitPrice),
          currency_id: order.currency,
        })),
        payer: { email: order.user.email },
        back_urls: {
          success: `${env.frontendUrl}/checkout/success?order=${order.id}`,
          failure: `${env.frontendUrl}/checkout/failure?order=${order.id}`,
          pending: `${env.frontendUrl}/checkout/pending?order=${order.id}`,
        },
        auto_return: 'approved',
        notification_url: `${env.backendUrl}/api/payments/webhook`,
        statement_descriptor: 'NOTISABILITY',
      },
    });

    await this.upsertPayment(order.id, {
      preferenceId: preference.id,
      amount: order.total,
      currency: order.currency,
      status: PaymentStatus.PENDING,
    });

    return {
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    };
  }

  /**
   * Valida la firma "x-signature" enviada por Mercado Pago en cada webhook.
   * https://www.mercadopago.com.co/developers/es/docs/checkout-api/additional-content/your-integrations/notifications/webhooks
   */
  verifySignature(headers: Record<string, string | string[] | undefined>, dataId: string | undefined): boolean {
    if (!env.mercadoPago.webhookSecret) {
      // Sin secreto configurado no es posible validar; se permite en entornos de desarrollo.
      return env.nodeEnv !== 'production';
    }

    const signatureHeader = headers['x-signature'];
    const requestId = headers['x-request-id'];
    if (!signatureHeader || !requestId || !dataId) {
      return false;
    }

    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const requestIdValue = Array.isArray(requestId) ? requestId[0] : requestId;

    const parts = Object.fromEntries(
      signature.split(',').map((part) => {
        const [key, value] = part.split('=');
        return [key.trim(), value?.trim()];
      }),
    );

    const ts = parts.ts;
    const hash = parts.v1;
    if (!ts || !hash) {
      return false;
    }

    const manifest = `id:${dataId.toLowerCase()};request-id:${requestIdValue};ts:${ts};`;
    const expected = crypto
      .createHmac('sha256', env.mercadoPago.webhookSecret)
      .update(manifest)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(hash, 'hex'));
  }

  /**
   * Procesa una notificacion de webhook: consulta el estado real del pago en
   * la API de Mercado Pago (nunca se confia en el payload del webhook) y
   * actualiza la orden, el pago y la biblioteca del usuario.
   */
  async handleWebhook(query: WebhookQueryDto): Promise<void> {
    const type = query.type ?? query.topic;
    const paymentId = query['data.id'] ?? query.id;

    if (type !== 'payment' || !paymentId) {
      return;
    }

    const payment = await mpPayment.get({ id: paymentId });

    const orderId = payment.external_reference;
    if (!orderId) {
      return;
    }

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) {
      return;
    }

    const status = mapMercadoPagoStatus(payment.status);

    await this.upsertPayment(order.id, {
      externalPaymentId: String(payment.id),
      status,
      statusDetail: payment.status_detail ?? null,
      amount: payment.transaction_amount ?? order.total,
      currency: payment.currency_id ?? order.currency,
      rawPayload: payment as unknown as Prisma.InputJsonValue,
    });

    if (status === PaymentStatus.APPROVED && order.status !== OrderStatus.PAID) {
      await this.markOrderAsPaid(order.id, order.userId, order.items);
    } else if (
      (status === PaymentStatus.REJECTED || status === PaymentStatus.CANCELLED) &&
      order.status === OrderStatus.PENDING
    ) {
      await prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.FAILED } });
    } else if (status === PaymentStatus.REFUNDED || status === PaymentStatus.CHARGED_BACK) {
      await prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.REFUNDED } });
    }
  }

  /**
   * Marca la orden como pagada y entrega los productos en la biblioteca digital del usuario.
   */
  private async markOrderAsPaid(
    orderId: string,
    userId: string,
    items: { productId: string }[],
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.PAID } });

      for (const item of items) {
        await tx.userLibraryItem.upsert({
          where: { userId_productId: { userId, productId: item.productId } },
          update: {},
          create: { userId, productId: item.productId, orderId },
        });
      }
    });
  }

  /**
   * Cada orden mantiene un unico registro de pago vigente (Mercado Pago no
   * permite mas de una preferencia activa por orden en este flujo).
   */
  private async upsertPayment(orderId: string, data: PaymentUpsertData): Promise<void> {
    const existing = await prisma.payment.findFirst({ where: { orderId }, orderBy: { createdAt: 'desc' } });

    if (existing) {
      await prisma.payment.update({ where: { id: existing.id }, data });
      return;
    }

    await prisma.payment.create({ data: { orderId, ...data } });
  }
}

interface PaymentUpsertData {
  preferenceId?: string;
  externalPaymentId?: string;
  status: PaymentStatus;
  statusDetail?: string | null;
  amount: Prisma.Decimal | number;
  currency?: string;
  rawPayload?: Prisma.InputJsonValue;
}

export const paymentsService = new PaymentsService();
