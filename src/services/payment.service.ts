import { PaymentStatus, PurchaseStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { mpPreference, mpPayment } from "../config/mercadopago";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { getProductsForCheckout } from "./product.service";

export interface CheckoutInput {
  productIds: number[];
}

export async function createCheckout(userId: number, input: CheckoutInput) {
  const productIds = input.productIds;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new AppError("Debes indicar al menos un producto para comprar", 400);
  }

  const uniqueProductIds = Array.from(new Set(productIds.map((id) => Number(id))));

  const alreadyOwned = await prisma.userLibrary.findMany({
    where: { userId, productId: { in: uniqueProductIds } },
    select: { productId: true },
  });

  if (alreadyOwned.length > 0) {
    throw new AppError("Ya posees uno o más de los productos seleccionados", 409);
  }

  const products = await getProductsForCheckout(uniqueProductIds);

  const total = products.reduce((sum, product) => sum + product.unitPrice, 0);

  const purchase = await prisma.purchase.create({
    data: {
      userId,
      total,
      status: PurchaseStatus.PENDING,
      details: {
        create: products.map((product) => ({
          productId: product.id,
          unitPrice: product.unitPrice,
          quantity: 1,
        })),
      },
      payment: {
        create: {
          amount: total,
          status: PaymentStatus.PENDING,
        },
      },
    },
    include: { details: true, payment: true },
  });

  const preferenceResult = await mpPreference.create({
    body: {
      items: products.map((product) => ({
        id: String(product.id),
        title: product.title,
        quantity: 1,
        unit_price: product.unitPrice,
        currency_id: "ARS",
      })),
      external_reference: String(purchase.id),
      back_urls: {
        success: env.mercadoPago.successUrl,
        failure: env.mercadoPago.failureUrl,
        pending: env.mercadoPago.pendingUrl,
      },
      auto_return: "approved",
      notification_url: `${env.backendUrl}/api/payments/webhook`,
    },
  });

  await prisma.payment.update({
    where: { purchaseId: purchase.id },
    data: { mpPreferenceId: preferenceResult.id },
  });

  return {
    purchaseId: purchase.id,
    total,
    initPoint: preferenceResult.init_point,
    sandboxInitPoint: preferenceResult.sandbox_init_point,
  };
}

function mapMpStatusToPaymentStatus(mpStatus: string | undefined): PaymentStatus {
  switch (mpStatus) {
    case "approved":
      return PaymentStatus.APPROVED;
    case "rejected":
      return PaymentStatus.REJECTED;
    case "cancelled":
      return PaymentStatus.CANCELLED;
    case "refunded":
    case "charged_back":
      return PaymentStatus.REFUNDED;
    default:
      return PaymentStatus.PENDING;
  }
}

function mapPaymentStatusToPurchaseStatus(status: PaymentStatus): PurchaseStatus {
  switch (status) {
    case PaymentStatus.APPROVED:
      return PurchaseStatus.PAID;
    case PaymentStatus.REJECTED:
    case PaymentStatus.CANCELLED:
      return PurchaseStatus.CANCELLED;
    case PaymentStatus.REFUNDED:
      return PurchaseStatus.REFUNDED;
    default:
      return PurchaseStatus.PENDING;
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

  const externalReference = mpPaymentInfo.external_reference;

  if (!externalReference) {
    return;
  }

  const purchaseId = Number(externalReference);

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { details: true, payment: true },
  });

  if (!purchase || !purchase.payment) {
    return;
  }

  const newStatus = mapMpStatusToPaymentStatus(mpPaymentInfo.status);

  await prisma.payment.update({
    where: { id: purchase.payment.id },
    data: {
      status: newStatus,
      mpPaymentId: String(mpPaymentInfo.id),
    },
  });

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { status: mapPaymentStatusToPurchaseStatus(newStatus) },
  });

  if (newStatus === PaymentStatus.APPROVED) {
    for (const detail of purchase.details) {
      await prisma.userLibrary.upsert({
        where: {
          userId_productId: {
            userId: purchase.userId,
            productId: detail.productId,
          },
        },
        update: {},
        create: {
          userId: purchase.userId,
          productId: detail.productId,
          purchaseId: purchase.id,
        },
      });
    }
  }
}
