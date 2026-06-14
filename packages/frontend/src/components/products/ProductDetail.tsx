import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import libraryService from "../../services/library.service";
import productsService from "../../services/products.service";
import { LibraryAccess } from "../../types/library.types";
import { Product } from "../../types/product.types";

const PLACEHOLDER_IMAGE = "/images/product-placeholder.png";

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { addItem, isInCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [access, setAccess] = useState<LibraryAccess>({ owned: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      return;
    }

    let isMounted = true;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedProduct = await productsService.getBySlug(slug);
        if (!isMounted) {
          return;
        }
        setProduct(fetchedProduct);

        if (user) {
          const libraryAccess = await libraryService.checkAccess(fetchedProduct.id);
          if (isMounted) {
            setAccess(libraryAccess);
          }
        }
      } catch {
        if (isMounted) {
          setError("No se pudo cargar el producto.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [slug, user]);

  if (loading) {
    return <p className="product-detail__status">Cargando producto...</p>;
  }

  if (error || !product) {
    return (
      <p className="product-detail__status product-detail__status--error">
        {error ?? "Producto no encontrado."}
      </p>
    );
  }

  const formattedPrice = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: product.currency,
    minimumFractionDigits: 0,
  }).format(product.price);

  const renderActionButton = () => {
    if (access.owned) {
      return (
        <a
          className="product-detail__download"
          href={access.downloadUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
        >
          Descargar
        </a>
      );
    }

    if (isInCart(product.id)) {
      return (
        <button type="button" className="product-detail__add-to-cart" disabled>
          Ya está en el carrito
        </button>
      );
    }

    return (
      <button
        type="button"
        className="product-detail__add-to-cart"
        onClick={() => addItem(product)}
      >
        Añadir al carrito
      </button>
    );
  };

  return (
    <article className="product-detail">
      <img
        className="product-detail__image"
        src={product.coverImageUrl ?? PLACEHOLDER_IMAGE}
        alt={product.title}
      />

      <div className="product-detail__info">
        {product.category && (
          <span className="product-detail__category">{product.category.name}</span>
        )}

        <h1 className="product-detail__title">{product.title}</h1>

        <div className="product-detail__rating">
          <span aria-label={`Calificación: ${product.averageRating} de 5`}>
            ⭐ {product.averageRating.toFixed(1)}
          </span>
          <span className="product-detail__rating-count">
            ({product.ratingsCount} reseñas)
          </span>
        </div>

        <p className="product-detail__price">{formattedPrice}</p>

        <p className="product-detail__description">{product.description}</p>

        {renderActionButton()}
      </div>
    </article>
  );
}

export default ProductDetail;
