import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `La ruta ${req.method} ${req.originalUrl} no existe`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Los datos enviados no son validos',
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'CONFLICT',
        message: 'El recurso ya existe (violacion de unicidad)',
        details: err.meta,
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Recurso no encontrado',
      });
      return;
    }
  }

  console.error(err);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Ocurrio un error inesperado en el servidor',
  });
}
