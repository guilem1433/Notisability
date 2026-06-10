import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { paymentsService } from './payments.service';
import { CreatePreferenceDto, WebhookQueryDto } from './payments.dto';

export class PaymentsController {
  async createPreference(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const { orderId } = req.body as CreatePreferenceDto;
    const preference = await paymentsService.createPreference(orderId, {
      id: req.user.sub,
      role: req.user.role,
    });
    res.status(201).json(preference);
  }

  async webhook(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as WebhookQueryDto;
    const dataId = query['data.id'] ?? query.id;

    if (!paymentsService.verifySignature(req.headers, dataId)) {
      res.status(401).json({ error: 'INVALID_SIGNATURE', message: 'Firma de webhook invalida' });
      return;
    }

    await paymentsService.handleWebhook(query);

    // Mercado Pago solo requiere un 200/201 para no reintentar la notificacion.
    res.status(200).json({ received: true });
  }
}

export const paymentsController = new PaymentsController();
