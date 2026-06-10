import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth';
import { RoleName } from '@prisma/client';
import { rolesController } from './roles.controller';

export const rolesRouter = Router();

// Solo el panel administrativo necesita listar los roles disponibles
// (para asignarlos a usuarios).
rolesRouter.get('/', authenticate, authorize(RoleName.ADMIN), rolesController.list);
