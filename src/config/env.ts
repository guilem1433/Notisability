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
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  },
  backendUrl: process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
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
