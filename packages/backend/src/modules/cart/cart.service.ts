import { Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors/AppError';

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImageUrl: true,
          price: true,
          currency: true,
          status: true,
          provider: { select: { id: true, fullName: true } },
        },
      },
    },
    orderBy: { addedAt: 'desc' as const },
  },
} satisfies Prisma.CartInclude;

export class CartService {
  async getOrCreateCart(userId: string) {
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: cartInclude,
    });

    return this.withTotals(cart);
  }

  async addItem(userId: string, productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== ProductStatus.PUBLISHED) {
      throw AppError.notFound('Producto no encontrado o no disponible');
    }

    const alreadyOwned = await prisma.userLibraryItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (alreadyOwned) {
      throw AppError.conflict('Ya posee este producto en su biblioteca');
    }

    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { unitPrice: product.price },
      create: { cartId: cart.id, productId, unitPrice: product.price },
    });

    return this.getOrCreateCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw AppError.notFound('Carrito no encontrado');
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return this.getOrCreateCart(userId);
  }

  async clear(userId: string): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  private withTotals<T extends { items: { unitPrice: Prisma.Decimal }[] }>(cart: T) {
    const total = cart.items.reduce((sum, item) => sum.plus(item.unitPrice), new Prisma.Decimal(0));
    return { ...cart, itemsCount: cart.items.length, total };
  }
}

export const cartService = new CartService();
