import { RoleName } from '@prisma/client';
import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(3).max(120).optional(),
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres').max(128),
});
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z.nativeEnum(RoleName).optional(),
  search: z.string().trim().min(1).optional(),
});
export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;

export const adminUpdateUserSchema = z.object({
  fullName: z.string().trim().min(3).max(120).optional(),
  roleId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});
export type AdminUpdateUserDto = z.infer<typeof adminUpdateUserSchema>;

export const userIdParamSchema = z.object({
  id: z.string().uuid('Identificador de usuario invalido'),
});
