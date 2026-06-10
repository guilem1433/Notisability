import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { libraryService } from './library.service';
import { ListLibraryQueryDto } from './library.dto';

export class LibraryController {
  async list(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const result = await libraryService.list(req.user.sub, req.query as unknown as ListLibraryQueryDto);
    res.status(200).json(result);
  }

  async download(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const file = await libraryService.resolveDownload(req.user.sub, req.params.productId);
    res.download(file.filePath, file.fileName);
  }
}

export const libraryController = new LibraryController();
