import { Link, useSearchParams } from "react-router-dom";

// Lee los parametros que Mercado Pago agrega a la URL de retorno
// (back_urls): status, payment_id, preference_id, entre otros.
type MpStatus = "approved" | "pending" | "in_process" | "rejected" | "failure" | string;

const STATUS_CONTENT: Record<string, { title: string; message: string; className: string }> = {
  approved: {
    title: "¡Pago aprobado!",
    message: "Tu compra fue procesada con éxito. Ya puedes ver tus productos en tu biblioteca.",
    className: "payment-status--approved",
  },
  pending: {
    title: "Pago pendiente",
    message: "Tu pago está siendo procesado. Te notificaremos cuando se confirme.",
    className: "payment-status--pending",
  },
  in_process: {
    title: "Pago en revisión",
    message: "Mercado Pago está revisando tu pago. Esto puede tardar unos minutos.",
    className: "payment-status--pending",
  },
  rejected: {
    title: "Pago rechazado",
    message: "Tu pago no pudo ser procesado. Intenta nuevamente con otro medio de pago.",
    className: "payment-status--rejected",
  },
  failure: {
    title: "Pago rechazado",
    message: "Tu pago no pudo ser procesado. Intenta nuevamente con otro medio de pago.",
    className: "payment-status--rejected",
  },
};

const DEFAULT_CONTENT = {
  title: "Estado del pago desconocido",
  message: "No pudimos determinar el estado de tu pago. Revisa tu historial de órdenes.",
  className: "payment-status--unknown",
};

export function PaymentStatus() {
  const [searchParams] = useSearchParams();

  const status = (searchParams.get("status") ?? searchParams.get("collection_status")) as MpStatus;
  const paymentId = searchParams.get("payment_id") ?? searchParams.get("collection_id");
  const preferenceId = searchParams.get("preference_id");

  const content = STATUS_CONTENT[status ?? ""] ?? DEFAULT_CONTENT;

  return (
    <div className={`payment-status ${content.className}`}>
      <h1 className="payment-status__title">{content.title}</h1>
      <p className="payment-status__message">{content.message}</p>

      <dl className="payment-status__details">
        {paymentId && (
          <>
            <dt>ID de pago</dt>
            <dd>{paymentId}</dd>
          </>
        )}
        {preferenceId && (
          <>
            <dt>Preferencia</dt>
            <dd>{preferenceId}</dd>
          </>
        )}
      </dl>

      <div className="payment-status__actions">
        <Link to="/library">Ir a mi biblioteca</Link>
        <Link to="/products">Seguir comprando</Link>
      </div>
    </div>
  );
}

export default PaymentStatus;
