import apiService from "./api.service";
import { CreateOrderPayload, CreateOrderResponse, Order } from "../types/order.types";
import { CartLineItem } from "../types/cart.types";

class OrderService {
  // Crea una orden a partir de los items del carrito y obtiene la preferencia
  // de pago de Mercado Pago (incluye `initPoint` para redirigir al checkout).
  async createOrderFromCart(items: CartLineItem[]): Promise<CreateOrderResponse> {
    const payload: CreateOrderPayload = {
      items: items.map((item) => ({ productId: item.productId })),
    };

    const { data } = await apiService.post<CreateOrderResponse>("/orders", payload);
    return data;
  }

  async getById(orderId: string): Promise<Order> {
    const { data } = await apiService.get<Order>(`/orders/${orderId}`);
    return data;
  }

  async listMyOrders(): Promise<Order[]> {
    const { data } = await apiService.get<Order[]>("/orders/me");
    return data;
  }
}

export const orderService = new OrderService();
export default orderService;
