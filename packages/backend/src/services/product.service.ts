import { Prisma, ProductStatus, RoleName } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { serializeProduct } from "../utils/serializers";
import { slugify } from "../utils/slugify";

export interface ProductFilters {
  categoryId?: number;
  status?: ProductStatus;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export interface ProductInput {
  categoryId: number;
  title: string;
  description: string;
  price: number;
  currency?: string;
  coverImageUrl?: string;
  status?: ProductStatus;
}

const productInclude = {
  category: true,
} satisfies Prisma.ProductInclude;

async function assertCategoryExists(categoryId: number): Promise<void> {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category) {
    throw new AppError("La categoría especificada no existe", 400);
  }
}

async function uniqueSlugFromTitle(title: string): Promise<string> {
  const base = slugify(title) || "producto";
  let slug = base;
  let suffix = 1;

  while (await prisma.product.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}

export async function listProducts(filters: ProductFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.min(filters.pageSize, 100) : 20;

  const where: Prisma.ProductWhereInput = {
    status: filters.status ?? ProductStatus.PUBLISHED,
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

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map(serializeProduct),
    total,
    page,
    pageSize,
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });

  if (!product) {
    throw new AppError("Producto no encontrado", 404);
  }

  return serializeProduct(product);
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({ where: { slug }, include: productInclude });

  if (!product) {
    throw new AppError("Producto no encontrado", 404);
  }

  return serializeProduct(product);
}

export async function createProduct(providerId: string, input: ProductInput) {
  const { title, description, price, categoryId } = input;

  if (!title || !description || price === undefined || categoryId === undefined) {
    throw new AppError("Título, descripción, precio y categoría son obligatorios", 400);
  }

  if (price <= 0) {
    throw new AppError("El precio debe ser mayor a cero", 400);
  }

  await assertCategoryExists(categoryId);

  const slug = await uniqueSlugFromTitle(title);

  const product = await prisma.product.create({
    data: {
      providerId,
      categoryId,
      title,
      slug,
      description,
      price,
      currency: input.currency ?? "COP",
      coverImageUrl: input.coverImageUrl,
      status: input.status ?? ProductStatus.DRAFT,
    },
    include: productInclude,
  });

  return serializeProduct(product);
}

async function getOwnedProduct(id: string, requesterId: string, requesterRole: RoleName) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new AppError("Producto no encontrado", 404);
  }

  if (product.providerId !== requesterId && requesterRole !== RoleName.ADMIN) {
    throw new AppError("No tienes permisos para modificar este producto", 403);
  }

  return product;
}

export async function updateProduct(
  id: string,
  requesterId: string,
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

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    include: productInclude,
  });

  return serializeProduct(product);
}

export async function deleteProduct(id: string, requesterId: string, requesterRole: RoleName) {
  await getOwnedProduct(id, requesterId, requesterRole);

  await prisma.product.delete({ where: { id } });
}
