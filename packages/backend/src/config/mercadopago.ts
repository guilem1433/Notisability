import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { env } from "./env";

export const mpClient = new MercadoPagoConfig({
  accessToken: env.mercadoPago.accessToken,
});

export const mpPreference = new Preference(mpClient);
export const mpPayment = new Payment(mpClient);
