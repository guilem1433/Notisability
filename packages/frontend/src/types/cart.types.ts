// Tipo de item de carrito basado en el modelo `CartItem` del schema.prisma
// (sin `quantity`: la unicidad [cartId, productId] indica una licencia por producto)

export interface CartLineItem {
  productId: string;
  title: string;
  unitPrice: number;
  currency: string;
  coverImageUrl?: string | null;
}
