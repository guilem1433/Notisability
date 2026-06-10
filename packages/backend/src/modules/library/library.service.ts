import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors/AppError';
import { ListLibraryQueryDto } from './library.dto';

const libraryItemInclude = {
  product: {
    select: {
      id: true,
      title: true,
      slug: true,
      coverImageUrl: true,
      currency: true,
      price: true,
      category: { select: { id: true, name: true } },
      provider: { select: { id: true, fullName: true } },
      files: { orderBy: { createdAt: 'desc' as const }, take: 1 },
    },
  },
} satisfies Prisma.UserLibraryItemInclude;

export class LibraryService {
  async list(userId: string, query: ListLibraryQueryDto) {
    const where: Prisma.UserLibraryItemWhereInput = { userId };

    const [items, total] = await prisma.$transaction([
      prisma.userLibraryItem.findMany({
        where,
        include: libraryItemInclude,
        orderBy: { acquiredAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.userLibraryItem.count({ where }),
    ]);

    return {
      items: items.map(serializeLibraryItem),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  /**
   * Devuelve la ultima version del archivo del producto y registra la
   * descarga, validando que el usuario lo tenga en su biblioteca.
   */
  async resolveDownload(userId: string, productId: string) {
    const item = await prisma.userLibraryItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!item) {
      throw AppError.forbidden('No posee este producto en su biblioteca');
    }

    const file = await prisma.productFile.findFirst({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
    if (!file) {
      throw AppError.notFound('El producto aun no tiene archivos disponibles para descarga');
    }

    await prisma.userLibraryItem.update({
      where: { id: item.id },
      data: { lastDownloadedAt: new Date() },
    });

    return file;
  }
}

function serializeLibraryItem<
  T extends { product: { files: ({ fileSizeBytes: bigint } & Record<string, unknown>)[] } & Record<string, unknown> },
>(item: T) {
  return {
    ...item,
    product: {
      ...item.product,
      files: item.product.files.map((f) => ({ ...f, fileSizeBytes: f.fileSizeBytes.toString() })),
    },
  };
}

export const libraryService = new LibraryService();
