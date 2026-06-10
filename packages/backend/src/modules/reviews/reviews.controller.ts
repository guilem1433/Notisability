import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { reviewsService } from './reviews.service';
import { CreateReviewDto, ListReviewsQueryDto, UpdateReviewDto } from './reviews.dto';

export class ReviewsController {
  async list(req: Request, res: Response): Promise<void> {
    const result = await reviewsService.list(req.params.productId, req.query as unknown as ListReviewsQueryDto);
    res.status(200).json(result);
  }

  async create(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const review = await reviewsService.create(req.user.sub, req.params.productId, req.body as CreateReviewDto);
    res.status(201).json(review);
  }

  async update(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const review = await reviewsService.update(req.user.sub, req.params.id, req.body as UpdateReviewDto);
    res.status(200).json(review);
  }

  async remove(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    await reviewsService.remove(req.user.sub, req.user.role, req.params.id);
    res.status(204).send();
  }
}

export const reviewsController = new ReviewsController();
