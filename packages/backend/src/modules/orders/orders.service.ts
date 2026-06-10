import { DiscountType, OrderStatus, Prisma, RoleName } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors/AppError';
import { CreateOrderDto, ListOrdersQueryDto } from './orders.dto';

const orderInclude = {
  items: true,
  payments: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.OrderInclude;

export interface RequesterContext {
  id: string;
  role: RoleName;
}

export class OrdersService {
  async createFromCart(userId: string, data: CreateOrderDto) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw AppError.badRequest('El carrito esta vacio');
    }

    for (const item of cart.items) {
      if (item.product.status !== 'PUBLISHED') {
        throw AppError.conflict(`El producto "${item.product.title}" ya no esta disponible`);
      }
    }

    const subtotal = cart.items.reduce((sum, item) => sum.plus(item.unitPrice), new Prisma.Decimal(0));

    let discountTotal = new Prisma.Decimal(0);
    if (data.promotionCode) {
      discountTotal = await this.resolveDiscount(data.promotionCode, subtotal);
    }

    const total = subtotal.minus(discountTotal);
    const currency = cart.items[0]?.product.currency ?? 'COP';

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          subtotal,
          discountTotal,
          total,
          currency,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productTitle: item.product.title,
              unitPrice: item.unitPrice,
              quantity: 1,
              subtotal: item.unitPrice,
            })),
          },
        },
        include: orderInclude,
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    return order;
  }

  async getById(id: string, requester: RequesterContext) {
    const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
    if (!order) {
      throw AppError.notFound('Orden no encontrada');
    }

    if (requester.role !== RoleName.ADMIN && order.userId !== requester.id) {
      throw AppError.forbidden('No tiene permisos sobre esta orden');
    }

    return order;
  }

  async list(requester: RequesterContext, query: ListOrdersQueryDto) {
    const where: Prisma.OrderWhereInput = {
      ...(requester.role === RoleName.ADMIN ? {} : { userId: requester.id }),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async cancel(id: string, requester: RequesterContext) {
    const order = await this.getById(id, requester);

    if (order.status !== OrderStatus.PENDING) {
      throw AppError.conflict('Solo se pueden cancelar ordenes pendientes de pago');
    }

    return prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: orderInclude,
    });
  }

  private async resolveDiscount(code: string, subtotal: Prisma.Decimal): Promise<Prisma.Decimal> {
    const now = new Date();
    const promotion = await prisma.promotion.findUnique({ where: { code } });

    if (!promotion || !promotion.isActive || promotion.startDate > now || promotion.endDate < now) {
      throw AppError.badRequest('El codigo de promocion no es valido o ha expirado');
    }

    const discount =
      promotion.discountType === DiscountType.PERCENTAGE
        ? subtotal.mul(promotion.discountValue).div(100)
        : promotion.discountValue;

    return Prisma.Decimal.min(discount, subtotal);
  }
}

export const ordersService = new OrdersService();
