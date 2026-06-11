import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

export interface CategoryInput {
  name: string;
  description?: string;
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getCategoryById(id: number) {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new AppError("Categoría no encontrada", 404);
  }

  return category;
}

export async function createCategory(input: CategoryInput) {
  if (!input.name) {
    throw new AppError("El nombre de la categoría es obligatorio", 400);
  }

  const existing = await prisma.category.findUnique({ where: { name: input.name } });

  if (existing) {
    throw new AppError("Ya existe una categoría con ese nombre", 409);
  }

  return prisma.category.create({
    data: { name: input.name, description: input.description },
  });
}

export async function updateCategory(id: number, input: Partial<CategoryInput>) {
  await getCategoryById(id);

  return prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
  });
}

export async function deleteCategory(id: number) {
  await getCategoryById(id);

  const productsCount = await prisma.product.count({ where: { categoryId: id } });

  if (productsCount > 0) {
    throw new AppError("No se puede eliminar una categoría que tiene productos asociados", 409);
  }

  await prisma.category.delete({ where: { id } });
}
