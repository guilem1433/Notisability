import { useState } from "react";
import libraryService from "../../services/library.service";

interface DownloadButtonProps {
  productId: string;
  productTitle: string;
}

export function DownloadButton({ productId, productTitle }: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await libraryService.downloadProductFile(productId, `${productTitle}.zip`);
    } catch {
      setError("No se pudo descargar el archivo. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="download-button">
      <button type="button" onClick={handleDownload} disabled={isLoading}>
        {isLoading ? "Descargando..." : "Descargar"}
      </button>

      {error && <p className="download-button__error">{error}</p>}
    </div>
  );
}

export default DownloadButton;
