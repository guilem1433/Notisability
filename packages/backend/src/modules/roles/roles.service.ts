import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class RolesService {
  async list(): Promise<Role[]> {
    return prisma.role.findMany({ orderBy: { id: 'asc' } });
  }
}

export const rolesService = new RolesService();
