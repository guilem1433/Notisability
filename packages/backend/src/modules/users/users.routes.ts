import { Router } from 'express';
import { RoleName } from '@prisma/client';
import { authenticate, authorize } from '../../common/middlewares/auth';
import { validate } from '../../common/middlewares/validate';
import { usersController } from './users.controller';
import {
  adminUpdateUserSchema,
  changePasswordSchema,
  listUsersQuerySchema,
  updateProfileSchema,
  userIdParamSchema,
} from './users.dto';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, usersController.getMe);
usersRouter.patch('/me', authenticate, validate({ body: updateProfileSchema }), usersController.updateMe);
usersRouter.post(
  '/me/password',
  authenticate,
  validate({ body: changePasswordSchema }),
  usersController.changePassword,
);

// Panel administrativo
usersRouter.get(
  '/',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ query: listUsersQuerySchema }),
  usersController.list,
);
usersRouter.get(
  '/:id',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: userIdParamSchema }),
  usersController.getById,
);
usersRouter.patch(
  '/:id',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: userIdParamSchema, body: adminUpdateUserSchema }),
  usersController.adminUpdate,
);
