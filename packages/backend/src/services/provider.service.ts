import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { serializeProduct, serializeProductFile } from "../utils/serializers";
import { relativeUploadPath } from "../middlewares/upload";

const productInclude = { category: true } satisfies Prisma.ProductInclude;

export async function listMyProducts(providerId: string) {
  const products = await prisma.product.findMany({
    where: { providerId },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });

  return products.map(serializeProduct);
}

export async function getMyProductById(providerId: string, id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });

  if (!product || product.providerId !== providerId) {
    throw new AppError("Producto no encontrado", 404);
  }

  return serializeProduct(product);
}

export async function uploadProductFile(
  providerId: string,
  productId: string,
  file: Express.Multer.File,
  version: string,
  changelog?: string
) {
  if (!version) {
    throw new AppError("La versión del archivo es obligatoria", 400);
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product || product.providerId !== providerId) {
    throw new AppError("Producto no encontrado", 404);
  }

  const existing = await prisma.productFile.findUnique({
    where: { productId_version: { productId, version } },
  });

  if (existing) {
    throw new AppError("Ya existe un archivo con esa versión para este producto", 409);
  }

  const productFile = await prisma.productFile.create({
    data: {
      productId,
      version,
      fileName: file.originalname,
      filePath: relativeUploadPath(file, "files"),
      fileSizeBytes: BigInt(file.size),
      changelog,
    },
  });

  return serializeProductFile(productFile);
}
