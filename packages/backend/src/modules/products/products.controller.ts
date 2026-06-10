import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { productsService, RequesterContext } from './products.service';
import {
  CreateProductDto,
  CreateProductFileDto,
  ListProductsQueryDto,
  UpdateProductDto,
  UpdateProductStatusDto,
} from './products.dto';

function requireUser(req: Request): RequesterContext {
  if (!req.user) throw AppError.unauthorized();
  return { id: req.user.sub, role: req.user.role };
}

export class ProductsController {
  async list(req: Request, res: Response): Promise<void> {
    const requester = req.user ? { id: req.user.sub, role: req.user.role } : undefined;
    const result = await productsService.list(req.query as unknown as ListProductsQueryDto, requester);
    res.status(200).json(result);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const requester = req.user ? { id: req.user.sub, role: req.user.role } : undefined;
    const product = await productsService.getById(req.params.id, requester);
    res.status(200).json(serializeProduct(product));
  }

  async create(req: Request, res: Response): Promise<void> {
    const requester = requireUser(req);
    const product = await productsService.create(requester.id, req.body as CreateProductDto);
    res.status(201).json(product);
  }

  async update(req: Request, res: Response): Promise<void> {
    const requester = requireUser(req);
    const product = await productsService.update(req.params.id, req.body as UpdateProductDto, requester);
    res.status(200).json(product);
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    const requester = requireUser(req);
    const product = await productsService.updateStatus(
      req.params.id,
      req.body as UpdateProductStatusDto,
      requester,
    );
    res.status(200).json(product);
  }

  async remove(req: Request, res: Response): Promise<void> {
    const requester = requireUser(req);
    await productsService.remove(req.params.id, requester);
    res.status(204).send();
  }

  async addFile(req: Request, res: Response): Promise<void> {
    const requester = requireUser(req);
    if (!req.file) {
      throw AppError.badRequest('Debe adjuntar un archivo');
    }
    const file = await productsService.addFile(
      req.params.id,
      req.body as CreateProductFileDto,
      req.file,
      requester,
    );
    res.status(201).json(serializeProductFile(file));
  }

  async listFiles(req: Request, res: Response): Promise<void> {
    const requester = requireUser(req);
    const files = await productsService.listFiles(req.params.id, requester);
    res.status(200).json(files.map(serializeProductFile));
  }

  async removeFile(req: Request, res: Response): Promise<void> {
    const requester = requireUser(req);
    await productsService.removeFile(req.params.id, req.params.fileId, requester);
    res.status(204).send();
  }
}

// BigInt no es serializable por JSON.stringify por defecto.
function serializeProductFile(file: { fileSizeBytes: bigint } & Record<string, unknown>) {
  return { ...file, fileSizeBytes: file.fileSizeBytes.toString() };
}

function serializeProduct<T extends { files?: ({ fileSizeBytes: bigint } & Record<string, unknown>)[] }>(
  product: T,
) {
  if (!product.files) return product;
  return { ...product, files: product.files.map(serializeProductFile) };
}

export const productsController = new ProductsController();
