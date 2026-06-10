import crypto from 'crypto';
import { RoleName } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors/AppError';
import { comparePassword, hashPassword } from '../../common/utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../common/utils/jwt';
import { env } from '../../config/env';
import { LoginDto, RegisterDto } from './auth.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: RoleName;
  };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshExpiryDate(): Date {
  const ms = parseDurationToMs(env.jwt.refreshExpires);
  return new Date(Date.now() + ms);
}

function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * unitMs[unit];
}

export class AuthService {
  async register(data: RegisterDto): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw AppError.conflict('Ya existe una cuenta registrada con este correo');
    }

    const customerRole = await prisma.role.findUnique({ where: { name: RoleName.CUSTOMER } });
    if (!customerRole) {
      throw new AppError('El rol CUSTOMER no esta configurado. Ejecute el seed de la base de datos.', 500);
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        passwordHash,
        roleId: customerRole.id,
        cart: { create: {} },
      },
      include: { role: true },
    });

    return this.issueTokens(user.id, user.role.name, {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role.name,
    });
  }

  async login(data: LoginDto): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Credenciales invalidas');
    }

    const validPassword = await comparePassword(data.password, user.passwordHash);
    if (!validPassword) {
      throw AppError.unauthorized('Credenciales invalidas');
    }

    return this.issueTokens(user.id, user.role.name, {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role.name,
    });
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized('Refresh token invalido o expirado');
    }

    const stored = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });
    if (!stored || stored.revokedAt || stored.userId !== payload.sub) {
      throw AppError.unauthorized('Refresh token invalido o revocado');
    }

    if (stored.tokenHash !== hashToken(refreshToken)) {
      throw AppError.unauthorized('Refresh token invalido');
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw AppError.unauthorized('Refresh token expirado');
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId }, include: { role: true } });
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Usuario no encontrado o inactivo');
    }

    // Rotacion: se revoca el token usado y se emite un par nuevo.
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.role.name);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return;
    }

    await prisma.refreshToken.updateMany({
      where: { id: payload.tokenId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(
    userId: string,
    role: RoleName,
    user?: AuthResult['user'],
  ): Promise<AuthResult> {
    const accessToken = signAccessToken({ sub: userId, role });

    const tokenRecord = await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: '',
        expiresAt: refreshExpiryDate(),
      },
    });

    const refreshToken = signRefreshToken({ sub: userId, tokenId: tokenRecord.id });

    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { tokenHash: hashToken(refreshToken) },
    });

    let resolvedUser: AuthResult['user'];
    if (user) {
      resolvedUser = user;
    } else {
      const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { role: true } });
      resolvedUser = {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role.name,
      };
    }

    return { accessToken, refreshToken, user: resolvedUser };
  }
}

export const authService = new AuthService();
