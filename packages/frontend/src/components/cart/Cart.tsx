import { useCart } from "../../context/CartContext";
import CartItemRow from "./CartItem";

interface CartProps {
  onCheckout?: () => void;
}

export function Cart({ onCheckout }: CartProps) {
  const { items, total, currency, removeItem, clear } = useCart();

  const formattedTotal = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(total);

  if (items.length === 0) {
    return <p className="cart__status">Tu carrito está vacío.</p>;
  }

  return (
    <div className="cart">
      <div className="cart__items">
        {items.map((item) => (
          <CartItemRow key={item.productId} item={item} onRemove={removeItem} />
        ))}
      </div>

      <div className="cart__summary">
        <span className="cart__total-label">Total</span>
        <span className="cart__total-value">{formattedTotal}</span>
      </div>

      <div className="cart__actions">
        <button type="button" className="cart__clear" onClick={clear}>
          Vaciar carrito
        </button>
        <button type="button" className="cart__checkout" onClick={onCheckout}>
          Proceder al pago
        </button>
      </div>
    </div>
  );
}

export default Cart;
