import { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        error: "Ya existe un registro con esos datos únicos",
        details: err.meta,
      });
      return;
    }

    if (err.code === "P2025") {
      res.status(404).json({
        error: "Registro no encontrado",
      });
      return;
    }

    res.status(400).json({
      error: "Error en la solicitud a la base de datos",
      code: err.code,
    });
    return;
  }

  if (err instanceof MulterError) {
    res.status(400).json({
      error: `Error al subir el archivo: ${err.message}`,
    });
    return;
  }

  console.error(err);

  res.status(500).json({
    error: "Error interno del servidor",
    ...(env.nodeEnv === "development" && err instanceof Error
      ? { message: err.message, stack: err.stack }
      : {}),
  });
};
