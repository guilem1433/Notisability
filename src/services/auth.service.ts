import { RoleName } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: RoleName;
}

export interface LoginInput {
  email: string;
  password: string;
}

const SELF_REGISTERABLE_ROLES: RoleName[] = [RoleName.USER, RoleName.DEVELOPER];

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
};

export async function register(input: RegisterInput) {
  const { name, email, password } = input;

  if (!name || !email || !password) {
    throw new AppError("Nombre, email y contraseña son obligatorios", 400);
  }

  if (password.length < 6) {
    throw new AppError("La contraseña debe tener al menos 6 caracteres", 400);
  }

  const requestedRole = input.role ?? RoleName.USER;

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

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      roleId: role.id,
    },
    select: userPublicSelect,
  });

  const token = signToken({ userId: user.id, roleId: role.id, roleName: role.name });

  return { user, token };
}

export async function login(input: LoginInput) {
  const { email, password } = input;

  if (!email || !password) {
    throw new AppError("Email y contraseña son obligatorios", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const token = signToken({ userId: user.id, roleId: user.roleId, roleName: user.role.name });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      role: { id: user.role.id, name: user.role.name },
    },
    token,
  };
}

export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userPublicSelect,
  });

  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  return user;
}
