import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors/AppError';
import { AssignProductsDto, CreatePromotionDto, UpdatePromotionDto } from './promotions.dto';

const promotionInclude = {
  productPromotions: {
    include: {
      product: { select: { id: true, title: true, slug: true, price: true, currency: true } },
    },
  },
} satisfies Prisma.PromotionInclude;

export class PromotionsService {
  async list() {
    return prisma.promotion.findMany({
      include: promotionInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listActive() {
    const now = new Date();
    return prisma.promotion.findMany({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      include: promotionInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const promotion = await prisma.promotion.findUnique({ where: { id }, include: promotionInclude });
    if (!promotion) {
      throw AppError.notFound('Promocion no encontrada');
    }
    return promotion;
  }

  async create(data: CreatePromotionDto) {
    if (data.code) {
      const existing = await prisma.promotion.findUnique({ where: { code: data.code } });
      if (existing) {
        throw AppError.conflict('Ya existe una promocion con ese codigo');
      }
    }

    return prisma.promotion.create({
      data: {
        name: data.name,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        code: data.code,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
      },
      include: promotionInclude,
    });
  }

  async update(id: string, data: UpdatePromotionDto) {
    await this.getById(id);

    if (data.code) {
      const existing = await prisma.promotion.findUnique({ where: { code: data.code } });
      if (existing && existing.id !== id) {
        throw AppError.conflict('Ya existe una promocion con ese codigo');
      }
    }

    return prisma.promotion.update({
      where: { id },
      data,
      include: promotionInclude,
    });
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await prisma.promotion.delete({ where: { id } });
  }

  async assignProducts(id: string, data: AssignProductsDto) {
    await this.getById(id);

    const products = await prisma.product.findMany({ where: { id: { in: data.productIds } } });
    if (products.length !== data.productIds.length) {
      throw AppError.badRequest('Uno o mas productos especificados no existen');
    }

    await prisma.productPromotion.createMany({
      data: data.productIds.map((productId) => ({ promotionId: id, productId })),
      skipDuplicates: true,
    });

    return this.getById(id);
  }

  async removeProduct(id: string, productId: string): Promise<void> {
    await this.getById(id);
    await prisma.productPromotion.deleteMany({ where: { promotionId: id, productId } });
  }
}

export const promotionsService = new PromotionsService();
