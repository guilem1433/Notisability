// Tipos basados en los modelos `Role` y `User` del schema.prisma

export enum RoleName {
  ADMIN = "ADMIN",
  PROVIDER = "PROVIDER",
  CUSTOMER = "CUSTOMER",
}

export interface Role {
  id: number;
  name: RoleName;
  description?: string | null;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  roleId: number;
  role?: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: RoleName;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
