import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { ordersService } from './orders.service';
import { CreateOrderDto, ListOrdersQueryDto } from './orders.dto';

export class OrdersController {
  async create(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const order = await ordersService.createFromCart(req.user.sub, req.body as CreateOrderDto);
    res.status(201).json(order);
  }

  async getById(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const order = await ordersService.getById(req.params.id, { id: req.user.sub, role: req.user.role });
    res.status(200).json(order);
  }

  async list(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const result = await ordersService.list(
      { id: req.user.sub, role: req.user.role },
      req.query as unknown as ListOrdersQueryDto,
    );
    res.status(200).json(result);
  }

  async cancel(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const order = await ordersService.cancel(req.params.id, { id: req.user.sub, role: req.user.role });
    res.status(200).json(order);
  }
}

export const ordersController = new OrdersController();
