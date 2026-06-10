import { Router } from 'express';
import { RoleName } from '@prisma/client';
import { authenticate, authorize, optionalAuthenticate } from '../../common/middlewares/auth';
import { validate } from '../../common/middlewares/validate';
import { productsController } from './products.controller';
import { productFileUpload } from './products.upload';
import {
  createProductFileSchema,
  createProductSchema,
  listProductsQuerySchema,
  productFileParamSchema,
  productIdParamSchema,
  updateProductSchema,
  updateProductStatusSchema,
} from './products.dto';

export const productsRouter = Router();

const providerOrAdmin = authorize(RoleName.PROVIDER, RoleName.ADMIN);

// Catalogo publico (con filtros y busqueda)
productsRouter.get(
  '/',
  optionalAuthenticate,
  validate({ query: listProductsQuerySchema }),
  productsController.list,
);
productsRouter.get(
  '/:id',
  optionalAuthenticate,
  validate({ params: productIdParamSchema }),
  productsController.getById,
);

// Gestion de productos (proveedores y administradores)
productsRouter.post(
  '/',
  authenticate,
  providerOrAdmin,
  validate({ body: createProductSchema }),
  productsController.create,
);
productsRouter.patch(
  '/:id',
  authenticate,
  providerOrAdmin,
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  productsController.update,
);
productsRouter.patch(
  '/:id/status',
  authenticate,
  providerOrAdmin,
  validate({ params: productIdParamSchema, body: updateProductStatusSchema }),
  productsController.updateStatus,
);
productsRouter.delete(
  '/:id',
  authenticate,
  providerOrAdmin,
  validate({ params: productIdParamSchema }),
  productsController.remove,
);

// Sistema de actualizaciones de productos (versiones de archivos descargables)
productsRouter.get(
  '/:id/files',
  authenticate,
  providerOrAdmin,
  validate({ params: productIdParamSchema }),
  productsController.listFiles,
);
productsRouter.post(
  '/:id/files',
  authenticate,
  providerOrAdmin,
  validate({ params: productIdParamSchema }),
  productFileUpload.single('file'),
  validate({ body: createProductFileSchema }),
  productsController.addFile,
);
productsRouter.delete(
  '/:id/files/:fileId',
  authenticate,
  providerOrAdmin,
  validate({ params: productFileParamSchema }),
  productsController.removeFile,
);
