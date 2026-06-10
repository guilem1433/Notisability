import apiService from "./api.service";
import {
  Category,
  CreateProductPayload,
  Product,
  ProductFile,
  UpdateProductPayload,
} from "../types/product.types";

class ProviderService {
  // Productos publicados por el proveedor autenticado
  async listMyProducts(): Promise<Product[]> {
    const { data } = await apiService.get<Product[]>("/provider/products");
    return data;
  }

  async getMyProductById(id: string): Promise<Product> {
    const { data } = await apiService.get<Product>(`/provider/products/${id}`);
    return data;
  }

  async createProduct(payload: CreateProductPayload): Promise<Product> {
    const { data } = await apiService.post<Product>("/provider/products", payload);
    return data;
  }

  async updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
    const { data } = await apiService.patch<Product>(`/provider/products/${id}`, payload);
    return data;
  }

  // Sube una nueva version del archivo digital del producto (multipart/form-data)
  async uploadProductFile(
    productId: string,
    file: File,
    version: string,
    changelog?: string
  ): Promise<ProductFile> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("version", version);
    if (changelog) {
      formData.append("changelog", changelog);
    }

    const { data } = await apiService.post<ProductFile>(
      `/provider/products/${productId}/files`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return data;
  }

  async listCategories(): Promise<Category[]> {
    const { data } = await apiService.get<Category[]>("/categories");
    return data;
  }
}

export const providerService = new ProviderService();
export default providerService;
