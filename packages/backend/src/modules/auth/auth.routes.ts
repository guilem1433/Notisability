import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../common/middlewares/validate';
import { loginSchema, refreshSchema, registerSchema } from './auth.dto';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), authController.register);
authRouter.post('/login', validate({ body: loginSchema }), authController.login);
authRouter.post('/refresh', validate({ body: refreshSchema }), authController.refresh);
authRouter.post('/logout', validate({ body: refreshSchema }), authController.logout);
