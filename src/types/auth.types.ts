import { RoleName } from "@prisma/client";

export interface JwtPayload {
  userId: number;
  roleId: number;
  roleName: RoleName;
}

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: RoleName;
}
