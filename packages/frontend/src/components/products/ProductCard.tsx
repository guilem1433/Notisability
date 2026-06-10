import { Product } from "../../types/product.types";

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

const PLACEHOLDER_IMAGE = "/images/product-placeholder.png";

export function ProductCard({ product, onClick }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: product.currency,
    minimumFractionDigits: 0,
  }).format(product.price);

  return (
    <article className="product-card" onClick={() => onClick?.(product)}>
      <img
        className="product-card__image"
        src={product.coverImageUrl ?? PLACEHOLDER_IMAGE}
        alt={product.title}
        loading="lazy"
      />

      <div className="product-card__body">
        {product.category && (
          <span className="product-card__category">{product.category.name}</span>
        )}

        <h3 className="product-card__title">{product.title}</h3>

        <div className="product-card__rating">
          <span aria-label={`Calificación: ${product.averageRating} de 5`}>
            ⭐ {product.averageRating.toFixed(1)}
          </span>
          <span className="product-card__rating-count">({product.ratingsCount})</span>
        </div>

        <p className="product-card__price">{formattedPrice}</p>
      </div>
    </article>
  );
}

export default ProductCard;
