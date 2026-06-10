import slugify from 'slugify';
import { Category } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors/AppError';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

export class CategoriesService {
  async list(): Promise<Category[]> {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async getById(id: number): Promise<Category> {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw AppError.notFound('Categoria no encontrada');
    }
    return category;
  }

  async create(data: CreateCategoryDto): Promise<Category> {
    const slug = slugify(data.name, { lower: true, strict: true });

    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: data.name }, { slug }] },
    });
    if (existing) {
      throw AppError.conflict('Ya existe una categoria con ese nombre');
    }

    return prisma.category.create({
      data: { name: data.name, slug, description: data.description },
    });
  }

  async update(id: number, data: UpdateCategoryDto): Promise<Category> {
    await this.getById(id);

    const slug = data.name ? slugify(data.name, { lower: true, strict: true }) : undefined;

    return prisma.category.update({
      where: { id },
      data: { name: data.name, slug, description: data.description },
    });
  }

  async remove(id: number): Promise<void> {
    await this.getById(id);

    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      throw AppError.conflict('No se puede eliminar una categoria que tiene productos asociados');
    }

    await prisma.category.delete({ where: { id } });
  }
}

export const categoriesService = new CategoriesService();
