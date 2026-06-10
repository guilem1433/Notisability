import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(120),
  email: z.string().trim().toLowerCase().email('Correo electronico invalido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo electronico invalido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'El refresh token es requerido'),
});
export type RefreshDto = z.infer<typeof refreshSchema>;
