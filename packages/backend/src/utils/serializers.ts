import { Category, Order, OrderItem, Product, ProductFile, Role, User } from "@prisma/client";

export function serializeRole(role: Role) {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
  };
}

export function serializeUser(user: User & { role?: Role }) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roleId: user.roleId,
    role: user.role ? serializeRole(user.role) : undefined,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function serializeCategory(category: Category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
  };
}

export function serializeProduct(product: Product & { category?: Category }) {
  return {
    id: product.id,
    providerId: product.providerId,
    categoryId: product.categoryId,
    category: product.category ? serializeCategory(product.category) : undefined,
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    currency: product.currency,
    coverImageUrl: product.coverImageUrl,
    status: product.status,
    averageRating: Number(product.averageRating),
    ratingsCount: product.ratingsCount,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function serializeProductFile(file: ProductFile) {
  return {
    id: file.id,
    productId: file.productId,
    version: file.version,
    fileName: file.fileName,
    fileSizeBytes: Number(file.fileSizeBytes),
    changelog: file.changelog,
    createdAt: file.createdAt,
  };
}

export function serializeOrderItem(item: OrderItem) {
  return {
    id: item.id,
    productId: item.productId,
    productTitle: item.productTitle,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
    subtotal: Number(item.subtotal),
  };
}

export function serializeOrder(order: Order & { items: OrderItem[] }) {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    subtotal: Number(order.subtotal),
    discountTotal: Number(order.discountTotal),
    total: Number(order.total),
    currency: order.currency,
    createdAt: order.createdAt,
    items: order.items.map(serializeOrderItem),
  };
}
