import { Request, Response } from "express";
import * as paymentService from "../services/payment.service";
import { AppError } from "../utils/AppError";

export async function checkoutHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const { productIds } = req.body;

  const result = await paymentService.createCheckout(req.user.userId, { productIds });

  res.status(201).json(result);
}

export async function webhookHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const query = req.query as Record<string, string>;

  const data = body?.data as { id?: string } | undefined;

  const paymentId = data?.id ?? query["data.id"] ?? query.id ?? (body?.id as string | undefined);

  await paymentService.handlePaymentWebhook({
    type: (body?.type as string) ?? query.type,
    topic: query.topic,
    paymentId: paymentId ? String(paymentId) : undefined,
  });

  res.status(200).send("ok");
}
