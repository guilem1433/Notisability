import { useEffect, useState } from "react";
import productsService from "../../services/products.service";
import { Product, ProductFilters } from "../../types/product.types";
import ProductCard from "./ProductCard";

interface ProductListProps {
  filters?: ProductFilters;
  onSelectProduct?: (product: Product) => void;
}

export function ProductList({ filters, onSelectProduct }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await productsService.list(filters);
        if (isMounted) {
          setProducts(result.items);
        }
      } catch {
        if (isMounted) {
          setError("No se pudieron cargar los productos.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  if (loading) {
    return <p className="product-list__status">Cargando productos...</p>;
  }

  if (error) {
    return <p className="product-list__status product-list__status--error">{error}</p>;
  }

  if (products.length === 0) {
    return <p className="product-list__status">No se encontraron productos.</p>;
  }

  return (
    <div className="product-list">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onClick={onSelectProduct} />
      ))}
    </div>
  );
}

export default ProductList;
