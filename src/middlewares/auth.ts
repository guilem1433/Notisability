import { NextFunction, Request, Response } from "express";
import { RoleName } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("No se proporcionó un token de autenticación", 401);
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw new AppError("Token inválido o expirado", 401);
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length);

    try {
      req.user = verifyToken(token);
    } catch {
      // Token inválido o expirado: se ignora y se continúa como invitado
    }
  }

  next();
}

export function authorize(...allowedRoles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError("No autenticado", 401);
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      throw new AppError("No tienes permisos para realizar esta acción", 403);
    }

    next();
  };
}
