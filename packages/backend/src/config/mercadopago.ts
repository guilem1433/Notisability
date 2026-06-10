import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { env } from './env';

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: env.mercadoPago.accessToken,
});

export const mpPreference = new Preference(mercadoPagoClient);
export const mpPayment = new Payment(mercadoPagoClient);
