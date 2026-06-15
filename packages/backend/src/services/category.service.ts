import { prisma } from "../config/prisma";
import { serializeCategory } from "../utils/serializers";

export async function listCategories() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return categories.map(serializeCategory);
}
