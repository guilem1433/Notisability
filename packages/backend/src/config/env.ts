import { config } from 'dotenv';

config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  backendUrl: process.env.BACKEND_URL ?? 'http://localhost:4000',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',

  databaseUrl: required('DATABASE_URL'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  },

  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),

  mercadoPago: {
    accessToken: required('MP_ACCESS_TOKEN'),
    webhookSecret: process.env.MP_WEBHOOK_SECRET ?? '',
  },

  files: {
    storagePath: process.env.FILES_STORAGE_PATH ?? './storage/products',
    maxSizeMb: Number(process.env.MAX_FILE_SIZE_MB ?? 200),
  },
};
