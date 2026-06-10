import { Request, Response } from 'express';
import { rolesService } from './roles.service';

export class RolesController {
  async list(_req: Request, res: Response): Promise<void> {
    const roles = await rolesService.list();
    res.status(200).json(roles);
  }
}

export const rolesController = new RolesController();
