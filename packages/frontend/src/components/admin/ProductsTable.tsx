import { useEffect, useState } from "react";
import adminService from "../../services/admin.service";
import { Product, ProductStatus } from "../../types/product.types";

const STATUS_LABELS: Record<ProductStatus, string> = {
  [ProductStatus.DRAFT]: "Borrador",
  [ProductStatus.PUBLISHED]: "Publicado",
  [ProductStatus.ARCHIVED]: "Suspendido",
};

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const productList = await adminService.listAllProducts();
        if (isMounted) {
          setProducts(productList);
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

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChange = async (productId: string, status: ProductStatus) => {
    setUpdatingProductId(productId);

    try {
      const updatedProduct = await adminService.updateProductStatus(productId, status);
      setProducts((prev) =>
        prev.map((product) => (product.id === productId ? updatedProduct : product))
      );
    } catch {
      setError("No se pudo actualizar el estado del producto.");
    } finally {
      setUpdatingProductId(null);
    }
  };

  const filteredProducts = products.filter((product) => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return true;
    }
    return product.title.toLowerCase().includes(term);
  });

  if (loading) {
    return <p className="admin-table__status">Cargando productos...</p>;
  }

  return (
    <div className="admin-table">
      <input
        type="search"
        className="admin-table__search"
        placeholder="Buscar producto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <p className="admin-table__status admin-table__status--error">{error}</p>}

      <table className="admin-table__table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => {
            const formattedPrice = new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: product.currency,
              minimumFractionDigits: 0,
            }).format(product.price);

            return (
              <tr key={product.id}>
                <td>{product.title}</td>
                <td>{product.category?.name ?? "—"}</td>
                <td>{formattedPrice}</td>
                <td>
                  <select
                    value={product.status}
                    disabled={updatingProductId === product.id}
                    onChange={(e) =>
                      handleStatusChange(product.id, e.target.value as ProductStatus)
                    }
                  >
                    <option value={ProductStatus.DRAFT}>{STATUS_LABELS[ProductStatus.DRAFT]}</option>
                    <option value={ProductStatus.PUBLISHED}>
                      {STATUS_LABELS[ProductStatus.PUBLISHED]}
                    </option>
                    <option value={ProductStatus.ARCHIVED}>
                      {STATUS_LABELS[ProductStatus.ARCHIVED]}
                    </option>
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filteredProducts.length === 0 && (
        <p className="admin-table__status">No se encontraron productos.</p>
      )}
    </div>
  );
}

export default ProductsTable;
