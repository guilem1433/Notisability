import { useState } from "react";
import { AxiosError } from "axios";
import { useCart } from "../../context/CartContext";
import orderService from "../../services/order.service";

export function CheckoutButton() {
  const { items, clear } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (items.length === 0) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const { initPoint } = await orderService.createOrderFromCart(items);
      clear();
      window.location.href = initPoint;
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? "No se pudo iniciar el pago.");
      setIsLoading(false);
    }
  };

  return (
    <div className="checkout-button">
      <button
        type="button"
        className="checkout-button__action"
        onClick={handleCheckout}
        disabled={items.length === 0 || isLoading}
      >
        {isLoading ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
      </button>

      {error && <p className="checkout-button__error">{error}</p>}
    </div>
  );
}

export default CheckoutButton;
