import { Router } from 'express';
import { RoleName } from '@prisma/client';
import { authenticate, authorize } from '../../common/middlewares/auth';
import { validate } from '../../common/middlewares/validate';
import { promotionsController } from './promotions.controller';
import {
  assignProductsSchema,
  createPromotionSchema,
  promotionIdParamSchema,
  promotionProductParamSchema,
  updatePromotionSchema,
} from './promotions.dto';

export const promotionsRouter = Router();

// Publico: promociones activas para mostrar descuentos en el catalogo
promotionsRouter.get('/', promotionsController.list);
promotionsRouter.get('/:id', validate({ params: promotionIdParamSchema }), promotionsController.getById);

// Panel administrativo
const adminOnly = [authenticate, authorize(RoleName.ADMIN)];

promotionsRouter.post('/', ...adminOnly, validate({ body: createPromotionSchema }), promotionsController.create);
promotionsRouter.patch(
  '/:id',
  ...adminOnly,
  validate({ params: promotionIdParamSchema, body: updatePromotionSchema }),
  promotionsController.update,
);
promotionsRouter.delete(
  '/:id',
  ...adminOnly,
  validate({ params: promotionIdParamSchema }),
  promotionsController.remove,
);
promotionsRouter.post(
  '/:id/products',
  ...adminOnly,
  validate({ params: promotionIdParamSchema, body: assignProductsSchema }),
  promotionsController.assignProducts,
);
promotionsRouter.delete(
  '/:id/products/:productId',
  ...adminOnly,
  validate({ params: promotionProductParamSchema }),
  promotionsController.removeProduct,
);
