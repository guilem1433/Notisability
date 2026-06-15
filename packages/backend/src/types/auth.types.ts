import { RoleName } from "@prisma/client";

export interface AccessTokenPayload {
  userId: string;
  roleId: number;
  roleName: RoleName;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}
