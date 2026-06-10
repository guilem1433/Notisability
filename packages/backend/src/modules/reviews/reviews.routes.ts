import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth';
import { validate } from '../../common/middlewares/validate';
import { reviewsController } from './reviews.controller';
import {
  createReviewSchema,
  listReviewsQuerySchema,
  reviewIdParamSchema,
  reviewProductIdParamSchema,
  updateReviewSchema,
} from './reviews.dto';

export const reviewsRouter = Router();

// Listado publico de reseñas de un producto
reviewsRouter.get(
  '/products/:productId',
  validate({ params: reviewProductIdParamSchema, query: listReviewsQuerySchema }),
  reviewsController.list,
);

// Crear reseña: requiere haber adquirido el producto
reviewsRouter.post(
  '/products/:productId',
  authenticate,
  validate({ params: reviewProductIdParamSchema, body: createReviewSchema }),
  reviewsController.create,
);

reviewsRouter.patch(
  '/:id',
  authenticate,
  validate({ params: reviewIdParamSchema, body: updateReviewSchema }),
  reviewsController.update,
);

reviewsRouter.delete(
  '/:id',
  authenticate,
  validate({ params: reviewIdParamSchema }),
  reviewsController.remove,
);
