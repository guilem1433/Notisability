import "dotenv/config";
import path from "path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: required("DATABASE_URL"),
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshSecret: required("JWT_REFRESH_SECRET"),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  },
  backendUrl: process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  mercadoPago: {
    accessToken: required("MP_ACCESS_TOKEN"),
    successUrl: required("MP_SUCCESS_URL"),
    failureUrl: required("MP_FAILURE_URL"),
    pendingUrl: required("MP_PENDING_URL"),
  },
  uploads: {
    dir: process.env.UPLOADS_DIR ?? "uploads",
    absolutePath: path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? "uploads"),
  },
};
