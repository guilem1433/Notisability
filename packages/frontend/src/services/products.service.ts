import apiService from "./api.service";
import {
  CreateProductPayload,
  PaginatedResult,
  Product,
  ProductFilters,
  UpdateProductPayload,
} from "../types/product.types";

class ProductsService {
  async list(filters: ProductFilters = {}): Promise<PaginatedResult<Product>> {
    const { data } = await apiService.get<PaginatedResult<Product>>("/products", {
      params: filters,
    });
    return data;
  }

  async getById(id: string): Promise<Product> {
    const { data } = await apiService.get<Product>(`/products/${id}`);
    return data;
  }

  async getBySlug(slug: string): Promise<Product> {
    const { data } = await apiService.get<Product>(`/products/slug/${slug}`);
    return data;
  }

  async create(payload: CreateProductPayload): Promise<Product> {
    const { data } = await apiService.post<Product>("/products", payload);
    return data;
  }

  async update(id: string, payload: UpdateProductPayload): Promise<Product> {
    const { data } = await apiService.patch<Product>(`/products/${id}`, payload);
    return data;
  }

  async remove(id: string): Promise<void> {
    await apiService.delete<void>(`/products/${id}`);
  }
}

export const productsService = new ProductsService();
export default productsService;
