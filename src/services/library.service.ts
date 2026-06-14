import { prisma } from "../config/prisma";

export async function getUserLibrary(userId: number) {
  const entries = await prisma.userLibrary.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          fileUrl: true,
          category: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { acquiredAt: "desc" },
  });

  return entries.map((entry) => ({
    acquiredAt: entry.acquiredAt,
    product: entry.product,
  }));
}
