import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { cartService } from './cart.service';
import { AddCartItemDto } from './cart.dto';

export class CartController {
  async getCart(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const cart = await cartService.getOrCreateCart(req.user.sub);
    res.status(200).json(cart);
  }

  async addItem(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const { productId } = req.body as AddCartItemDto;
    const cart = await cartService.addItem(req.user.sub, productId);
    res.status(200).json(cart);
  }

  async removeItem(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const cart = await cartService.removeItem(req.user.sub, req.params.productId);
    res.status(200).json(cart);
  }

  async clear(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    await cartService.clear(req.user.sub);
    res.status(204).send();
  }
}

export const cartController = new CartController();
