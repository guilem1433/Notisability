import { Request, Response } from 'express';
import { authService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto } from './auth.dto';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body as RegisterDto);
    res.status(201).json(result);
  }

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body as LoginDto);
    res.status(200).json(result);
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as RefreshDto;
    const tokens = await authService.refresh(refreshToken);
    res.status(200).json(tokens);
  }

  async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as RefreshDto;
    await authService.logout(refreshToken);
    res.status(204).send();
  }
}

export const authController = new AuthController();
