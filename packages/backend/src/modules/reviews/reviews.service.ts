import { Prisma, RoleName } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors/AppError';
import { CreateReviewDto, ListReviewsQueryDto, UpdateReviewDto } from './reviews.dto';

const reviewInclude = {
  user: { select: { id: true, fullName: true } },
} satisfies Prisma.ReviewInclude;

export class ReviewsService {
  async list(productId: string, query: ListReviewsQueryDto) {
    const where: Prisma.ReviewWhereInput = { productId };

    const [items, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        include: reviewInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async create(userId: string, productId: string, data: CreateReviewDto) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw AppError.notFound('Producto no encontrado');
    }

    const owned = await prisma.userLibraryItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!owned) {
      throw AppError.forbidden('Solo los usuarios que han adquirido el producto pueden calificarlo');
    }

    const existing = await prisma.review.findUnique({ where: { userId_productId: { userId, productId } } });
    if (existing) {
      throw AppError.conflict('Ya ha calificado este producto. Puede editar su reseña existente');
    }

    const review = await prisma.review.create({
      data: { userId, productId, rating: data.rating, comment: data.comment },
      include: reviewInclude,
    });

    await this.recalculateRating(productId);
    return review;
  }

  async update(userId: string, reviewId: string, data: UpdateReviewDto) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw AppError.notFound('Reseña no encontrada');
    }

    if (review.userId !== userId) {
      throw AppError.forbidden('No puede editar la reseña de otro usuario');
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { rating: data.rating, comment: data.comment },
      include: reviewInclude,
    });

    await this.recalculateRating(review.productId);
    return updated;
  }

  async remove(userId: string, role: RoleName, reviewId: string): Promise<void> {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw AppError.notFound('Reseña no encontrada');
    }

    if (role !== RoleName.ADMIN && review.userId !== userId) {
      throw AppError.forbidden('No puede eliminar la reseña de otro usuario');
    }

    await prisma.review.delete({ where: { id: reviewId } });
    await this.recalculateRating(review.productId);
  }

  private async recalculateRating(productId: string): Promise<void> {
    const aggregate = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: aggregate._avg.rating ?? 0,
        ratingsCount: aggregate._count,
      },
    });
  }
}

export const reviewsService = new ReviewsService();
