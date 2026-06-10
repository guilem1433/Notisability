import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors/AppError';
import { comparePassword, hashPassword } from '../../common/utils/password';
import {
  AdminUpdateUserDto,
  ChangePasswordDto,
  ListUsersQueryDto,
  UpdateProfileDto,
} from './users.dto';

const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

export class UsersService {
  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: publicUserSelect });
    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }
    return user;
  }

  async updateProfile(id: string, data: UpdateProfileDto) {
    const user = await prisma.user.update({
      where: { id },
      data: { fullName: data.fullName },
      select: publicUserSelect,
    });
    return user;
  }

  async changePassword(id: string, data: ChangePasswordDto): Promise<void> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });

    const valid = await comparePassword(data.currentPassword, user.passwordHash);
    if (!valid) {
      throw AppError.badRequest('La contraseña actual es incorrecta');
    }

    const passwordHash = await hashPassword(data.newPassword);
    await prisma.user.update({ where: { id }, data: { passwordHash } });

    // Invalida todas las sesiones activas tras un cambio de contraseña.
    await prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async list(query: ListUsersQueryDto) {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: { name: query.role } } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: publicUserSelect,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async adminUpdate(id: string, data: AdminUpdateUserDto) {
    if (data.roleId) {
      const role = await prisma.role.findUnique({ where: { id: data.roleId } });
      if (!role) {
        throw AppError.badRequest('El rol especificado no existe');
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        roleId: data.roleId,
        isActive: data.isActive,
      },
      select: publicUserSelect,
    });

    if (data.isActive === false) {
      await prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return user;
  }
}

export const usersService = new UsersService();
