import { Request, Response } from "express";
import * as libraryService from "../services/library.service";
import { AppError } from "../utils/AppError";
import { absoluteUploadPath } from "../middlewares/upload";
import { param } from "../utils/params";

export async function getLibraryHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const items = await libraryService.getUserLibrary(req.user.userId);

  res.status(200).json(items);
}

export async function checkAccessHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const access = await libraryService.checkAccess(req.user.userId, param(req.params.productId));

  res.status(200).json(access);
}

export async function downloadHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const file = await libraryService.getLatestFileForDownload(req.user.userId, param(req.params.productId));

  res.download(absoluteUploadPath(file.filePath), file.fileName);
}
