import { Request, Response } from "express";
import * as orderService from "../services/order.service";
import { AppError } from "../utils/AppError";
import { param } from "../utils/params";

export async function createOrderHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const { items } = req.body;

  const result = await orderService.createOrder(req.user.userId, { items });

  res.status(201).json(result);
}

export async function getOrderHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const order = await orderService.getOrderById(param(req.params.id), req.user.userId, req.user.roleName);

  res.status(200).json(order);
}

export async function listMyOrdersHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const orders = await orderService.listMyOrders(req.user.userId);

  res.status(200).json(orders);
}

export async function webhookHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const query = req.query as Record<string, string>;

  const data = body?.data as { id?: string } | undefined;

  const paymentId = data?.id ?? query["data.id"] ?? query.id ?? (body?.id as string | undefined);

  await orderService.handlePaymentWebhook({
    type: (body?.type as string) ?? query.type,
    topic: query.topic,
    paymentId: paymentId ? String(paymentId) : undefined,
  });

  res.status(200).send("ok");
}
