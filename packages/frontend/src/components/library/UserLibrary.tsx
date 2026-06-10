import { useEffect, useState } from "react";
import libraryService from "../../services/library.service";
import { LibraryItem } from "../../types/library.types";
import DownloadButton from "./DownloadButton";

const PLACEHOLDER_IMAGE = "/images/product-placeholder.png";

export function UserLibrary() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLibrary = async () => {
      setLoading(true);
      setError(null);

      try {
        const libraryItems = await libraryService.listMyLibrary();
        if (isMounted) {
          setItems(libraryItems);
        }
      } catch {
        if (isMounted) {
          setError("No se pudo cargar tu biblioteca.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchLibrary();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <p className="user-library__status">Cargando tu biblioteca...</p>;
  }

  if (error) {
    return <p className="user-library__status user-library__status--error">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="user-library__status">Aún no has adquirido ningún producto.</p>;
  }

  return (
    <div className="user-library">
      <h1 className="user-library__title">Mi biblioteca</h1>

      <div className="user-library__list">
        {items.map((item) => {
          const acquiredDate = new Intl.DateTimeFormat("es-CO", {
            dateStyle: "medium",
          }).format(new Date(item.acquiredAt));

          return (
            <div className="user-library__item" key={item.id}>
              <img
                className="user-library__image"
                src={item.product.coverImageUrl ?? PLACEHOLDER_IMAGE}
                alt={item.product.title}
                loading="lazy"
              />

              <div className="user-library__info">
                <p className="user-library__product-title">{item.product.title}</p>
                <p className="user-library__acquired-at">Adquirido el {acquiredDate}</p>
              </div>

              <DownloadButton productId={item.productId} productTitle={item.product.title} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default UserLibrary;
