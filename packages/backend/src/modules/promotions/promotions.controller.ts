import { Request, Response } from 'express';
import { promotionsService } from './promotions.service';
import { AssignProductsDto, CreatePromotionDto, UpdatePromotionDto } from './promotions.dto';

export class PromotionsController {
  async list(req: Request, res: Response): Promise<void> {
    const onlyActive = req.query.active === 'true';
    const promotions = onlyActive ? await promotionsService.listActive() : await promotionsService.list();
    res.status(200).json(promotions);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const promotion = await promotionsService.getById(req.params.id);
    res.status(200).json(promotion);
  }

  async create(req: Request, res: Response): Promise<void> {
    const promotion = await promotionsService.create(req.body as CreatePromotionDto);
    res.status(201).json(promotion);
  }

  async update(req: Request, res: Response): Promise<void> {
    const promotion = await promotionsService.update(req.params.id, req.body as UpdatePromotionDto);
    res.status(200).json(promotion);
  }

  async remove(req: Request, res: Response): Promise<void> {
    await promotionsService.remove(req.params.id);
    res.status(204).send();
  }

  async assignProducts(req: Request, res: Response): Promise<void> {
    const promotion = await promotionsService.assignProducts(req.params.id, req.body as AssignProductsDto);
    res.status(200).json(promotion);
  }

  async removeProduct(req: Request, res: Response): Promise<void> {
    await promotionsService.removeProduct(req.params.id, req.params.productId);
    res.status(204).send();
  }
}

export const promotionsController = new PromotionsController();
