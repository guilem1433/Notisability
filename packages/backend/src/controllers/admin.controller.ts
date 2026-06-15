import { Request, Response } from "express";
import * as adminService from "../services/admin.service";
import { param } from "../utils/params";

export async function listUsersHandler(req: Request, res: Response): Promise<void> {
  const { search } = req.query;
  const users = await adminService.listUsers(typeof search === "string" ? search : undefined);
  res.status(200).json(users);
}

export async function listRolesHandler(_req: Request, res: Response): Promise<void> {
  const roles = await adminService.listRoles();
  res.status(200).json(roles);
}

export async function updateUserRoleHandler(req: Request, res: Response): Promise<void> {
  const { roleId } = req.body;
  const user = await adminService.updateUserRole(param(req.params.userId), Number(roleId));
  res.status(200).json(user);
}

export async function listAllProductsHandler(req: Request, res: Response): Promise<void> {
  const { search } = req.query;
  const products = await adminService.listAllProducts(typeof search === "string" ? search : undefined);
  res.status(200).json(products);
}

export async function updateProductStatusHandler(req: Request, res: Response): Promise<void> {
  const { status } = req.body;
  const product = await adminService.updateProductStatus(param(req.params.productId), status);
  res.status(200).json(product);
}
