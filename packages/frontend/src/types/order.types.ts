// Tipos basados en los modelos `Order`, `OrderItem` y `Payment` del schema.prisma

export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum PaymentStatusEnum {
  PENDING = "PENDING",
  IN_PROCESS = "IN_PROCESS",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
  CHARGED_BACK = "CHARGED_BACK",
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productTitle: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  discountTotal: number;
  total: number;
  currency: string;
  createdAt: string;
  items: OrderItemDto[];
}

export interface CreateOrderItemPayload {
  productId: string;
}

export interface CreateOrderPayload {
  items: CreateOrderItemPayload[];
}

// Respuesta al crear la orden: incluye la orden y la preferencia de pago de Mercado Pago
export interface CreateOrderResponse {
  order: Order;
  preferenceId: string;
  initPoint: string;
}
