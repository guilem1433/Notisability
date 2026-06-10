import fs from 'fs/promises';
import path from 'path';
import slugify from 'slugify';
import { Prisma, ProductStatus, RoleName } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors/AppError';
import { env } from '../../config/env';
import {
  CreateProductDto,
  CreateProductFileDto,
  ListProductsQueryDto,
  UpdateProductDto,
  UpdateProductStatusDto,
} from './products.dto';

export interface RequesterContext {
  id: string;
  role: RoleName;
}

const productListInclude = {
  category: { select: { id: true, name: true, slug: true } },
  provider: { select: { id: true, fullName: true } },
} satisfies Prisma.ProductInclude;

const productDetailInclude = {
  ...productListInclude,
  files: { orderBy: { createdAt: 'desc' as const } },
  productPromotions: {
    where: {
      promotion: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    },
    include: { promotion: true },
  },
} satisfies Prisma.ProductInclude;

function buildOrderBy(sort: ListProductsQueryDto['sort']): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case 'price_asc':
      return { price: 'asc' };
    case 'price_desc':
      return { price: 'desc' };
    case 'rating':
      return { averageRating: 'desc' };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

export class ProductsService {
  async list(query: ListProductsQueryDto, requester?: RequesterContext) {
    const where: Prisma.ProductWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.providerId ? { providerId: query.providerId } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    this.applyVisibilityScope(where, query.status, requester);

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: productListInclude,
        orderBy: buildOrderBy(query.sort),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  /**
   * Restringe la visibilidad del catalogo: los usuarios anonimos y los
   * clientes solo ven productos PUBLISHED. Proveedores y administradores
   * pueden ver estados adicionales segun el filtro solicitado.
   */
  private applyVisibilityScope(
    where: Prisma.ProductWhereInput,
    requestedStatus: ProductStatus | undefined,
    requester?: RequesterContext,
  ): void {
    if (!requester || requester.role === RoleName.CUSTOMER) {
      where.status = ProductStatus.PUBLISHED;
      return;
    }

    if (requester.role === RoleName.ADMIN) {
      if (requestedStatus) where.status = requestedStatus;
      return;
    }

    // PROVIDER: ve publicados de todos + todos los propios.
    if (requestedStatus) {
      where.status = requestedStatus;
      where.providerId = where.providerId ?? requester.id;
      return;
    }

    where.OR = [
      ...(where.OR as Prisma.ProductWhereInput[] | undefined ?? []),
      { status: ProductStatus.PUBLISHED },
      { providerId: requester.id },
    ];
  }

  async getById(id: string, requester?: RequesterContext) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: productDetailInclude,
    });

    if (!product) {
      throw AppError.notFound('Producto no encontrado');
    }

    if (product.status !== ProductStatus.PUBLISHED) {
      const isOwner = requester?.id === product.providerId;
      const isAdmin = requester?.role === RoleName.ADMIN;
      if (!isOwner && !isAdmin) {
        throw AppError.notFound('Producto no encontrado');
      }
    }

    return product;
  }

  async create(providerId: string, data: CreateProductDto) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw AppError.badRequest('La categoria especificada no existe');
    }

    const slug = await this.generateUniqueSlug(data.title);

    return prisma.product.create({
      data: {
        providerId,
        categoryId: data.categoryId,
        title: data.title,
        slug,
        description: data.description,
        price: data.price,
        currency: data.currency,
        coverImageUrl: data.coverImageUrl,
        status: ProductStatus.DRAFT,
      },
      include: productListInclude,
    });
  }

  async update(id: string, data: UpdateProductDto, requester: RequesterContext) {
    const product = await this.findOwnedProduct(id, requester);

    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        throw AppError.badRequest('La categoria especificada no existe');
      }
    }

    const slug = data.title && data.title !== product.title ? await this.generateUniqueSlug(data.title) : undefined;

    return prisma.product.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        description: data.description,
        price: data.price,
        currency: data.currency,
        categoryId: data.categoryId,
        coverImageUrl: data.coverImageUrl,
      },
      include: productListInclude,
    });
  }

  async updateStatus(id: string, data: UpdateProductStatusDto, requester: RequesterContext) {
    await this.findOwnedProduct(id, requester);

    return prisma.product.update({
      where: { id },
      data: { status: data.status },
      include: productListInclude,
    });
  }

  async remove(id: string, requester: RequesterContext): Promise<void> {
    const product = await this.findOwnedProduct(id, requester);

    const purchases = await prisma.orderItem.count({ where: { productId: id } });
    if (purchases > 0) {
      // Se conserva el historial de compras: el producto se archiva en lugar de borrarse.
      await prisma.product.update({ where: { id }, data: { status: ProductStatus.ARCHIVED } });
      return;
    }

    await this.deleteProductFiles(product.id);
    await prisma.product.delete({ where: { id } });
  }

  // ------------------------------------------------------------------
  // Archivos / versiones del producto (sistema de actualizaciones)
  // ------------------------------------------------------------------

  async addFile(
    productId: string,
    data: CreateProductFileDto,
    file: Express.Multer.File,
    requester: RequesterContext,
  ) {
    await this.findOwnedProduct(productId, requester);

    const existing = await prisma.productFile.findUnique({
      where: { productId_version: { productId, version: data.version } },
    });
    if (existing) {
      await fs.unlink(file.path).catch(() => undefined);
      throw AppError.conflict(`Ya existe la version ${data.version} para este producto`);
    }

    return prisma.productFile.create({
      data: {
        productId,
        version: data.version,
        changelog: data.changelog,
        fileName: file.originalname,
        filePath: file.path,
        fileSizeBytes: BigInt(file.size),
      },
    });
  }

  async listFiles(productId: string, requester: RequesterContext) {
    await this.findOwnedProduct(productId, requester);
    return prisma.productFile.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } });
  }

  async removeFile(productId: string, fileId: string, requester: RequesterContext): Promise<void> {
    await this.findOwnedProduct(productId, requester);

    const file = await prisma.productFile.findUnique({ where: { id: fileId } });
    if (!file || file.productId !== productId) {
      throw AppError.notFound('Archivo no encontrado');
    }

    await fs.unlink(file.filePath).catch(() => undefined);
    await prisma.productFile.delete({ where: { id: fileId } });
  }

  async getLatestFile(productId: string) {
    const file = await prisma.productFile.findFirst({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
    if (!file) {
      throw AppError.notFound('El producto aun no tiene archivos disponibles para descarga');
    }
    return file;
  }

  // ------------------------------------------------------------------
  // Helpers internos
  // ------------------------------------------------------------------

  private async findOwnedProduct(id: string, requester: RequesterContext) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw AppError.notFound('Producto no encontrado');
    }

    if (requester.role !== RoleName.ADMIN && product.providerId !== requester.id) {
      throw AppError.forbidden('No tiene permisos sobre este producto');
    }

    return product;
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title, { lower: true, strict: true });
    let slug = base;
    let suffix = 1;

    while (await prisma.product.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }

    return slug;
  }

  private async deleteProductFiles(productId: string): Promise<void> {
    const files = await prisma.productFile.findMany({ where: { productId } });
    await Promise.all(files.map((f) => fs.unlink(f.filePath).catch(() => undefined)));

    const dir = path.join(env.files.storagePath, productId);
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export const productsService = new ProductsService();
