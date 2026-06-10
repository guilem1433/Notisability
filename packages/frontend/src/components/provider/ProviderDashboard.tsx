import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import providerService from "../../services/provider.service";
import { Product, ProductStatus } from "../../types/product.types";

const STATUS_LABELS: Record<ProductStatus, string> = {
  [ProductStatus.DRAFT]: "Borrador",
  [ProductStatus.PUBLISHED]: "Publicado",
  [ProductStatus.ARCHIVED]: "Archivado",
};

export function ProviderDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const myProducts = await providerService.listMyProducts();
        if (isMounted) {
          setProducts(myProducts);
        }
      } catch {
        if (isMounted) {
          setError("No se pudieron cargar tus productos.");
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
  }, []);

  return (
    <div className="provider-dashboard">
      <div className="provider-dashboard__header">
        <h1>Mis productos</h1>
        <Link to="/provider/products/new" className="provider-dashboard__new">
          Nuevo producto
        </Link>
      </div>

      {loading && <p className="provider-dashboard__status">Cargando productos...</p>}
      {error && <p className="provider-dashboard__status provider-dashboard__status--error">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="provider-dashboard__status">Aún no has publicado ningún producto.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <table className="provider-dashboard__table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Estado</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const formattedPrice = new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: product.currency,
                minimumFractionDigits: 0,
              }).format(product.price);

              return (
                <tr key={product.id}>
                  <td>{product.title}</td>
                  <td>
                    <span
                      className={`provider-dashboard__badge provider-dashboard__badge--${product.status.toLowerCase()}`}
                    >
                      {STATUS_LABELS[product.status]}
                    </span>
                  </td>
                  <td>{formattedPrice}</td>
                  <td>
                    <Link to={`/provider/products/${product.id}/edit`}>
                      Editar / Subir versión
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ProviderDashboard;
