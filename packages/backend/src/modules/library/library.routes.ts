import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth';
import { validate } from '../../common/middlewares/validate';
import { libraryController } from './library.controller';
import { libraryProductIdParamSchema, listLibraryQuerySchema } from './library.dto';

export const libraryRouter = Router();

libraryRouter.use(authenticate);

libraryRouter.get('/', validate({ query: listLibraryQuerySchema }), libraryController.list);
libraryRouter.get(
  '/:productId/download',
  validate({ params: libraryProductIdParamSchema }),
  libraryController.download,
);
