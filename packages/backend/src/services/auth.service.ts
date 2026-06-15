import crypto from "crypto";
import { RoleName } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { hashPassword, comparePassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { serializeUser } from "../utils/serializers";
import { env } from "../config/env";

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role?: RoleName;
}

export interface LoginInput {
  email: string;
  password: string;
}

const SELF_REGISTERABLE_ROLES: RoleName[] = [RoleName.CUSTOMER, RoleName.PROVIDER];

const userWithRole = { role: true } as const;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function refreshExpiryDate(): Date {
  const match = /^(\d+)([smhd])$/.exec(env.jwt.refreshExpiresIn);
  const amount = match ? Number(match[1]) : 30;
  const unit = match ? match[2] : "d";
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return new Date(Date.now() + amount * (unitMs[unit] ?? unitMs.d));
}

async function issueTokens(userId: string, roleId: number, roleName: RoleName) {
  const accessToken = signAccessToken({ userId, roleId, roleName });

  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: "",
      expiresAt: refreshExpiryDate(),
    },
  });

  const refreshToken = signRefreshToken({ userId, tokenId: refreshTokenRecord.id });

  await prisma.refreshToken.update({
    where: { id: refreshTokenRecord.id },
    data: { tokenHash: hashToken(refreshToken) },
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const { email, password, fullName } = input;

  if (!email || !password || !fullName) {
    throw new AppError("Email, contraseña y nombre completo son obligatorios", 400);
  }

  if (password.length < 6) {
    throw new AppError("La contraseña debe tener al menos 6 caracteres", 400);
  }

  const requestedRole = input.role ?? RoleName.CUSTOMER;

  if (!SELF_REGISTERABLE_ROLES.includes(requestedRole)) {
    throw new AppError("El rol solicitado no es válido para el registro", 400);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new AppError("Ya existe un usuario registrado con ese email", 409);
  }

  const role = await prisma.role.findUnique({ where: { name: requestedRole } });

  if (!role) {
    throw new AppError(
      "El rol solicitado no existe en la base de datos. Ejecuta el seed de roles.",
      500
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      roleId: role.id,
      carts: { create: {} },
    },
    include: userWithRole,
  });

  const { accessToken, refreshToken } = await issueTokens(user.id, role.id, role.name);

  return { user: serializeUser(user), accessToken, refreshToken };
}

export async function login(input: LoginInput) {
  const { email, password } = input;

  if (!email || !password) {
    throw new AppError("Email y contraseña son obligatorios", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: userWithRole,
  });

  if (!user) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Credenciales inválidas", 401);
  }

  if (!user.isActive) {
    throw new AppError("Tu cuenta está desactivada. Contacta al administrador", 403);
  }

  const { accessToken, refreshToken } = await issueTokens(user.id, user.roleId, user.role.name);

  return { user: serializeUser(user), accessToken, refreshToken };
}

export async function refresh(refreshToken: string) {
  if (!refreshToken) {
    throw new AppError("El refresh token es obligatorio", 400);
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Refresh token inválido o expirado", 401);
  }

  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { id: payload.tokenId },
    include: { user: { include: userWithRole } },
  });

  if (
    !tokenRecord ||
    tokenRecord.revokedAt ||
    tokenRecord.expiresAt < new Date() ||
    tokenRecord.tokenHash !== hashToken(refreshToken)
  ) {
    throw new AppError("Refresh token inválido o expirado", 401);
  }

  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { revokedAt: new Date() },
  });

  const { user } = tokenRecord;

  const tokens = await issueTokens(user.id, user.roleId, user.role.name);

  return tokens;
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userWithRole,
  });

  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  return serializeUser(user);
}
