import { Request, Response } from "express";
import * as libraryService from "../services/library.service";
import { AppError } from "../utils/AppError";

export async function getLibraryHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const library = await libraryService.getUserLibrary(req.user.userId);

  res.status(200).json({ library });
}
