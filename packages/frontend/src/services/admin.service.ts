import apiService from "./api.service";
import { Role, User } from "../types/auth.types";
import { Product, ProductStatus } from "../types/product.types";

class AdminService {
  // Gestion de usuarios y roles
  async listUsers(search?: string): Promise<User[]> {
    const { data } = await apiService.get<User[]>("/admin/users", {
      params: search ? { search } : undefined,
    });
    return data;
  }

  async listRoles(): Promise<Role[]> {
    const { data } = await apiService.get<Role[]>("/admin/roles");
    return data;
  }

  async updateUserRole(userId: string, roleId: number): Promise<User> {
    const { data } = await apiService.patch<User>(`/admin/users/${userId}/role`, { roleId });
    return data;
  }

  // Moderacion global de productos
  async listAllProducts(search?: string): Promise<Product[]> {
    const { data } = await apiService.get<Product[]>("/admin/products", {
      params: search ? { search } : undefined,
    });
    return data;
  }

  async updateProductStatus(productId: string, status: ProductStatus): Promise<Product> {
    const { data } = await apiService.patch<Product>(`/admin/products/${productId}/status`, {
      status,
    });
    return data;
  }
}

export const adminService = new AdminService();
export default adminService;
