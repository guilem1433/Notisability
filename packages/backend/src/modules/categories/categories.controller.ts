import { Request, Response } from 'express';
import { categoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

export class CategoriesController {
  async list(_req: Request, res: Response): Promise<void> {
    const categories = await categoriesService.list();
    res.status(200).json(categories);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const category = await categoriesService.getById(Number(req.params.id));
    res.status(200).json(category);
  }

  async create(req: Request, res: Response): Promise<void> {
    const category = await categoriesService.create(req.body as CreateCategoryDto);
    res.status(201).json(category);
  }

  async update(req: Request, res: Response): Promise<void> {
    const category = await categoriesService.update(Number(req.params.id), req.body as UpdateCategoryDto);
    res.status(200).json(category);
  }

  async remove(req: Request, res: Response): Promise<void> {
    await categoriesService.remove(Number(req.params.id));
    res.status(204).send();
  }
}

export const categoriesController = new CategoriesController();
