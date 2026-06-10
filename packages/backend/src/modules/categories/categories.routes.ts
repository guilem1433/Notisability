import { Router } from 'express';
import { RoleName } from '@prisma/client';
import { authenticate, authorize } from '../../common/middlewares/auth';
import { validate } from '../../common/middlewares/validate';
import { categoriesController } from './categories.controller';
import { categoryIdParamSchema, createCategorySchema, updateCategorySchema } from './categories.dto';

export const categoriesRouter = Router();

// Publico: catalogo de categorias para filtros
categoriesRouter.get('/', categoriesController.list);
categoriesRouter.get('/:id', validate({ params: categoryIdParamSchema }), categoriesController.getById);

// Panel administrativo
categoriesRouter.post(
  '/',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ body: createCategorySchema }),
  categoriesController.create,
);
categoriesRouter.patch(
  '/:id',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: categoryIdParamSchema, body: updateCategorySchema }),
  categoriesController.update,
);
categoriesRouter.delete(
  '/:id',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: categoryIdParamSchema }),
  categoriesController.remove,
);
