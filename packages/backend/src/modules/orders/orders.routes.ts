import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth';
import { validate } from '../../common/middlewares/validate';
import { ordersController } from './orders.controller';
import { createOrderSchema, listOrdersQuerySchema, orderIdParamSchema } from './orders.dto';

export const ordersRouter = Router();

ordersRouter.use(authenticate);

ordersRouter.get('/', validate({ query: listOrdersQuerySchema }), ordersController.list);
ordersRouter.post('/', validate({ body: createOrderSchema }), ordersController.create);
ordersRouter.get('/:id', validate({ params: orderIdParamSchema }), ordersController.getById);
ordersRouter.post('/:id/cancel', validate({ params: orderIdParamSchema }), ordersController.cancel);
