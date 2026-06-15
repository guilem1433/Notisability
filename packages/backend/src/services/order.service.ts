import { OrderStatus, PaymentStatus, Prisma, RoleName } from "@prisma/client";
import { prisma } from "../config/prisma";
import { mpPreference, mpPayment } from "../config/mercadopago";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { serializeOrder } from "../utils/serializers";

export interface CreateOrderInput {
  items: { productId: string }[];
}

const orderInclude = { items: true } satisfies Prisma.OrderInclude;

export async function createOrder(userId: string, input: CreateOrderInput) {
  const productIds = (input.items ?? []).map((item) => item.productId);

  if (productIds.length === 0) {
    throw new AppError("Debes indicar al menos un producto para comprar", 400);
  }

  const uniqueProductIds = Array.from(new Set(productIds));

  const alreadyOwned = await prisma.userLibraryItem.findMany({
    where: { userId, productId: { in: uniqueProductIds } },
    select: { productId: true },
  });

  if (alreadyOwned.length > 0) {
    throw new AppError("Ya posees uno o más de los productos seleccionados", 409);
  }

  const products = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds } },
  });

  if (products.length !== uniqueProductIds.length) {
    throw new AppError("Uno o más productos no existen", 400);
  }

  const currency = products[0]?.currency ?? "COP";
  const subtotal = products.reduce((sum, product) => sum + Number(product.price), 0);

  const order = await prisma.order.create({
    data: {
      userId,
      status: OrderStatus.PENDING,
      subtotal,
      discountTotal: 0,
      total: subtotal,
      currency,
      items: {
        create: products.map((product) => ({
          productId: product.id,
          productTitle: product.title,
          unitPrice: product.price,
          quantity: 1,
          subtotal: product.price,
        })),
      },
    },
    include: orderInclude,
  });

  const preferenceResult = await mpPreference.create({
    body: {
      items: products.map((product) => ({
        id: product.id,
        title: product.title,
        quantity: 1,
        unit_price: Number(product.price),
        currency_id: currency,
      })),
      external_reference: order.id,
      back_urls: {
        success: env.mercadoPago.successUrl,
        failure: env.mercadoPago.failureUrl,
        pending: env.mercadoPago.pendingUrl,
      },
      auto_return: "approved",
      notification_url: `${env.backendUrl}/api/orders/webhook`,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      preferenceId: preferenceResult.id,
      amount: order.total,
      currency,
      status: PaymentStatus.PENDING,
    },
  });

  return {
    order: serializeOrder(order),
    preferenceId: preferenceResult.id as string,
    initPoint: (preferenceResult.init_point ?? preferenceResult.sandbox_init_point) as string,
  };
}

export async function getOrderById(orderId: string, requesterId: string, requesterRole: RoleName) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });

  if (!order) {
    throw new AppError("Orden no encontrada", 404);
  }

  if (order.userId !== requesterId && requesterRole !== RoleName.ADMIN) {
    throw new AppError("No tienes permisos para ver esta orden", 403);
  }

  return serializeOrder(order);
}

export async function listMyOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

  return orders.map(serializeOrder);
}

function mapMpStatusToPaymentStatus(mpStatus: string | undefined): PaymentStatus {
  switch (mpStatus) {
    case "approved":
      return PaymentStatus.APPROVED;
    case "in_process":
      return PaymentStatus.IN_PROCESS;
    case "rejected":
      return PaymentStatus.REJECTED;
    case "cancelled":
      return PaymentStatus.CANCELLED;
    case "refunded":
      return PaymentStatus.REFUNDED;
    case "charged_back":
      return PaymentStatus.CHARGED_BACK;
    default:
      return PaymentStatus.PENDING;
  }
}

function mapPaymentStatusToOrderStatus(status: PaymentStatus): OrderStatus {
  switch (status) {
    case PaymentStatus.APPROVED:
      return OrderStatus.PAID;
    case PaymentStatus.REJECTED:
    case PaymentStatus.CANCELLED:
      return OrderStatus.CANCELLED;
    case PaymentStatus.CHARGED_BACK:
    case PaymentStatus.REFUNDED:
      return OrderStatus.REFUNDED;
    default:
      return OrderStatus.PENDING;
  }
}

export interface WebhookInput {
  type?: string;
  topic?: string;
  paymentId?: string;
}

export async function handlePaymentWebhook(input: WebhookInput): Promise<void> {
  const isPaymentNotification = input.type === "payment" || input.topic === "payment";

  if (!isPaymentNotification || !input.paymentId) {
    return;
  }

  const mpPaymentInfo = await mpPayment.get({ id: input.paymentId });
  const orderId = mpPaymentInfo.external_reference;

  if (!orderId) {
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true },
  });

  if (!order) {
    return;
  }

  const newStatus = mapMpStatusToPaymentStatus(mpPaymentInfo.status);
  const payment = order.payments[0];

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        externalPaymentId: String(mpPaymentInfo.id),
        statusDetail: mpPaymentInfo.status_detail,
        rawPayload: mpPaymentInfo as unknown as Prisma.InputJsonValue,
      },
    });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: mapPaymentStatusToOrderStatus(newStatus) },
  });

  if (newStatus === PaymentStatus.APPROVED) {
    for (const item of order.items) {
      await prisma.userLibraryItem.upsert({
        where: { userId_productId: { userId: order.userId, productId: item.productId } },
        update: {},
        create: {
          userId: order.userId,
          productId: item.productId,
          orderId: order.id,
        },
      });
    }
  }
}
