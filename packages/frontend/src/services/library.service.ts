import apiService from "./api.service";
import { LibraryAccess, LibraryItem } from "../types/library.types";

// Extrae el nombre de archivo de un header Content-Disposition (attachment; filename="...")
function extractFileName(contentDisposition: string | undefined, fallback: string): string {
  if (!contentDisposition) {
    return fallback;
  }

  const match = contentDisposition.match(/filename="?([^"]+)"?/);
  return match?.[1] ?? fallback;
}

class LibraryService {
  async checkAccess(productId: string): Promise<LibraryAccess> {
    try {
      const { data } = await apiService.get<LibraryAccess>(`/library/${productId}/access`);
      return data;
    } catch {
      return { owned: false };
    }
  }

  async listMyLibrary(): Promise<LibraryItem[]> {
    const { data } = await apiService.get<LibraryItem[]>("/library");
    return data;
  }

  // Descarga el archivo digital (`ProductFile`) más reciente de un producto adquirido.
  async downloadProductFile(productId: string, fallbackFileName: string): Promise<void> {
    const response = await apiService.get<Blob>(`/library/${productId}/download`, {
      responseType: "blob",
    });

    const fileName = extractFileName(
      response.headers["content-disposition"] as string | undefined,
      fallbackFileName
    );

    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  }
}

export const libraryService = new LibraryService();
export default libraryService;
