import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth';
import { validate } from '../../common/middlewares/validate';
import { cartController } from './cart.controller';
import { addCartItemSchema, cartItemParamSchema } from './cart.dto';

export const cartRouter = Router();

cartRouter.use(authenticate);

cartRouter.get('/', cartController.getCart);
cartRouter.post('/items', validate({ body: addCartItemSchema }), cartController.addItem);
cartRouter.delete('/items/:productId', validate({ params: cartItemParamSchema }), cartController.removeItem);
cartRouter.delete('/', cartController.clear);
