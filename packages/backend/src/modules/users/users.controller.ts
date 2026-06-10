import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { usersService } from './users.service';
import { AdminUpdateUserDto, ChangePasswordDto, ListUsersQueryDto, UpdateProfileDto } from './users.dto';

export class UsersController {
  async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const user = await usersService.getById(req.user.sub);
    res.status(200).json(user);
  }

  async updateMe(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const user = await usersService.updateProfile(req.user.sub, req.body as UpdateProfileDto);
    res.status(200).json(user);
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    await usersService.changePassword(req.user.sub, req.body as ChangePasswordDto);
    res.status(204).send();
  }

  async list(req: Request, res: Response): Promise<void> {
    const result = await usersService.list(req.query as unknown as ListUsersQueryDto);
    res.status(200).json(result);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const user = await usersService.getById(req.params.id);
    res.status(200).json(user);
  }

  async adminUpdate(req: Request, res: Response): Promise<void> {
    const user = await usersService.adminUpdate(req.params.id, req.body as AdminUpdateUserDto);
    res.status(200).json(user);
  }
}

export const usersController = new UsersController();
