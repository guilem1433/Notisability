import { Prisma, RoleName } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

export interface ProductFilters {
  categoryId?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export interface ProductInput {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
  fileUrl?: string;
}

const activePromotionWhere = {
  active: true,
  startDate: { lte: new Date() },
  endDate: { gte: new Date() },
};

const publicProductInclude = {
  category: { select: { id: true, name: true } },
  creator: { select: { id: true, name: true } },
  promotions: { where: activePromotionWhere },
} satisfies Prisma.ProductInclude;

function withEffectivePrice<
  T extends { price: Prisma.Decimal; promotions: { discountPercentage: Prisma.Decimal }[] },
>(product: T) {
  const activePromotion = product.promotions[0];
  const price = Number(product.price);
  const effectivePrice = activePromotion
    ? Number((price * (1 - Number(activePromotion.discountPercentage) / 100)).toFixed(2))
    : price;

  return {
    ...product,
    price,
    effectivePrice,
    activePromotion: activePromotion
      ? { discountPercentage: Number(activePromotion.discountPercentage) }
      : null,
  };
}

export async function listProducts(filters: ProductFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;

  const where: Prisma.ProductWhereInput = {
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? {
          price: {
            ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
  };

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (filters.sort === "price_asc") orderBy = { price: "asc" };
  if (filters.sort === "price_desc") orderBy = { price: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: publicProductInclude,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map((item) => {
      const { fileUrl: _fileUrl, ...rest } = item;
      return withEffectivePrice(rest);
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductById(id: number, requesterId?: number, requesterRole?: RoleName) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: publicProductInclude,
  });

  if (!product) {
    throw new AppError("Producto no encontrado", 404);
  }

  const isOwner = requesterId === product.creatorId;
  const isAdmin = requesterRole === RoleName.ADMIN;

  if (!isOwner && !isAdmin) {
    const { fileUrl: _fileUrl, ...rest } = product;
    return withEffectivePrice(rest);
  }

  return withEffectivePrice(product);
}

export async function getProductsForCheckout(ids: number[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: { promotions: { where: activePromotionWhere } },
  });

  if (products.length !== ids.length) {
    throw new AppError("Uno o más productos no existen", 400);
  }

  return products.map((product) => {
    const { promotions, ...rest } = withEffectivePrice(product);
    void promotions;
    return {
      id: rest.id,
      title: rest.title,
      unitPrice: rest.effectivePrice,
    };
  });
}

async function assertCategoryExists(categoryId: number): Promise<void> {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category) {
    throw new AppError("La categoría especificada no existe", 400);
  }
}

export async function createProduct(creatorId: number, input: ProductInput) {
  const { title, description, price, categoryId } = input;

  if (!title || !description || price === undefined || categoryId === undefined) {
    throw new AppError("Título, descripción, precio y categoría son obligatorios", 400);
  }

  if (price <= 0) {
    throw new AppError("El precio debe ser mayor a cero", 400);
  }

  await assertCategoryExists(categoryId);

  return prisma.product.create({
    data: {
      title,
      description,
      price,
      categoryId,
      creatorId,
      imageUrl: input.imageUrl,
      fileUrl: input.fileUrl,
    },
    include: publicProductInclude,
  });
}

async function getOwnedProduct(id: number, requesterId: number, requesterRole: RoleName) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new AppError("Producto no encontrado", 404);
  }

  if (product.creatorId !== requesterId && requesterRole !== RoleName.ADMIN) {
    throw new AppError("No tienes permisos para modificar este producto", 403);
  }

  return product;
}

export async function updateProduct(
  id: number,
  requesterId: number,
  requesterRole: RoleName,
  input: Partial<ProductInput>
) {
  await getOwnedProduct(id, requesterId, requesterRole);

  if (input.price !== undefined && input.price <= 0) {
    throw new AppError("El precio debe ser mayor a cero", 400);
  }

  if (input.categoryId !== undefined) {
    await assertCategoryExists(input.categoryId);
  }

  return prisma.product.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.fileUrl !== undefined ? { fileUrl: input.fileUrl } : {}),
    },
    include: publicProductInclude,
  });
}

export async function deleteProduct(id: number, requesterId: number, requesterRole: RoleName) {
  await getOwnedProduct(id, requesterId, requesterRole);

  await prisma.product.delete({ where: { id } });
}
