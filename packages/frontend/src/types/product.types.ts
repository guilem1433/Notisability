// Tipos basados en los modelos `Product` y `Category` del schema.prisma

export enum ProductStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Product {
  id: string;
  providerId: string;
  categoryId: number;
  category?: Category;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  coverImageUrl?: string | null;
  status: ProductStatus;
  averageRating: number;
  ratingsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  categoryId?: number;
  status?: ProductStatus;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateProductPayload {
  categoryId: number;
  title: string;
  description: string;
  price: number;
  currency?: string;
  coverImageUrl?: string;
  status?: ProductStatus;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

// Basado en el modelo `ProductFile` del schema.prisma
export interface ProductFile {
  id: string;
  productId: string;
  version: string;
  fileName: string;
  fileSizeBytes: number;
  changelog?: string | null;
  createdAt: string;
}
