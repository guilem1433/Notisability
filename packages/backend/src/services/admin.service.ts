import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { serializeProduct, serializeUser, serializeRole } from "../utils/serializers";

const userInclude = { role: true } satisfies Prisma.UserInclude;
const productInclude = { category: true } satisfies Prisma.ProductInclude;

export async function listUsers(search?: string) {
  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { fullName: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    include: userInclude,
    orderBy: { createdAt: "desc" },
  });

  return users.map(serializeUser);
}

export async function listRoles() {
  const roles = await prisma.role.findMany({ orderBy: { id: "asc" } });
  return roles.map(serializeRole);
}

export async function updateUserRole(userId: string, roleId: number) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });

  if (!role) {
    throw new AppError("El rol especificado no existe", 400);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { roleId },
    include: userInclude,
  });

  return serializeUser(user);
}

export async function listAllProducts(search?: string) {
  const where: Prisma.ProductWhereInput = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const products = await prisma.product.findMany({
    where,
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });

  return products.map(serializeProduct);
}

export async function updateProductStatus(productId: string, status: ProductStatus) {
  const product = await prisma.product.update({
    where: { id: productId },
    data: { status },
    include: productInclude,
  });

  return serializeProduct(product);
}
