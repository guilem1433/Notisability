import { NextFunction, Request, Response } from 'express';
import { RoleName } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { AccessTokenPayload, verifyAccessToken } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Token de acceso no proporcionado');
  }

  const token = header.slice('Bearer '.length);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw AppError.unauthorized('Token de acceso invalido o expirado');
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    req.user = verifyAccessToken(token);
  } catch {
    // Token invalido en ruta opcional: se continua sin usuario autenticado.
  }
  next();
}

export function authorize(...allowedRoles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden('Su rol no tiene acceso a este recurso');
    }

    next();
  };
}
