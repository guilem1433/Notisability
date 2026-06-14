import { CartLineItem } from "../../types/cart.types";

const PLACEHOLDER_IMAGE = "/images/product-placeholder.png";

interface CartItemProps {
  item: CartLineItem;
  onRemove: (productId: string) => void;
}

export function CartItem({ item, onRemove }: CartItemProps) {
  const formattedPrice = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: item.currency,
    minimumFractionDigits: 0,
  }).format(item.unitPrice);

  return (
    <div className="cart-item">
      <img
        className="cart-item__image"
        src={item.coverImageUrl ?? PLACEHOLDER_IMAGE}
        alt={item.title}
        loading="lazy"
      />

      <div className="cart-item__body">
        <p className="cart-item__title">{item.title}</p>
        <p className="cart-item__price">{formattedPrice}</p>
      </div>

      <button
        type="button"
        className="cart-item__remove"
        onClick={() => onRemove(item.productId)}
        aria-label={`Eliminar ${item.title} del carrito`}
      >
        Eliminar
      </button>
    </div>
  );
}

export default CartItem;
