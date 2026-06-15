import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

export async function getUserLibrary(userId: string) {
  const items = await prisma.userLibraryItem.findMany({
    where: { userId },
    include: {
      product: {
        select: { id: true, title: true, slug: true, coverImageUrl: true },
      },
    },
    orderBy: { acquiredAt: "desc" },
  });

  return items.map((item) => ({
    id: item.id,
    productId: item.productId,
    product: item.product,
    acquiredAt: item.acquiredAt,
    lastDownloadedAt: item.lastDownloadedAt,
  }));
}

export async function checkAccess(userId: string, productId: string) {
  const item = await prisma.userLibraryItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (!item) {
    return { owned: false };
  }

  return {
    owned: true,
    acquiredAt: item.acquiredAt,
    lastDownloadedAt: item.lastDownloadedAt,
  };
}

export async function getLatestFileForDownload(userId: string, productId: string) {
  const item = await prisma.userLibraryItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (!item) {
    throw new AppError("No tienes acceso a este producto", 403);
  }

  const file = await prisma.productFile.findFirst({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });

  if (!file) {
    throw new AppError("Este producto aún no tiene archivos disponibles", 404);
  }

  await prisma.userLibraryItem.update({
    where: { id: item.id },
    data: { lastDownloadedAt: new Date() },
  });

  return file;
}
