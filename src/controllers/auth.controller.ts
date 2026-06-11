import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { AppError } from "../utils/AppError";

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const { name, email, password, role } = req.body;

  const result = await authService.register({ name, email, password, role });

  res.status(201).json(result);
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  res.status(200).json(result);
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const user = await authService.getProfile(req.user.userId);

  res.status(200).json({ user });
}
