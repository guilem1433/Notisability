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
    <article
      className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      onClick={() => onClick?.(product)}
    >
      <img
        className="aspect-[4/3] w-full bg-surface object-cover"
        src={product.coverImageUrl ?? PLACEHOLDER_IMAGE}
        alt={product.title}
        loading="lazy"
      />

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.category && (
          <span className="w-fit rounded-full bg-surface px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-slate-500">
            {product.category.name}
          </span>
        )}

        <h3 className="line-clamp-2 text-base font-bold text-slate-900">{product.title}</h3>

        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <span aria-label={`Calificación: ${product.averageRating} de 5`}>
            ⭐ {product.averageRating.toFixed(1)}
          </span>
          <span className="text-slate-400">({product.ratingsCount})</span>
        </div>

        <p className="mt-1 text-lg font-extrabold text-primary">{formattedPrice}</p>
      </div>
    </article>
  );
}

export default ProductCard;
