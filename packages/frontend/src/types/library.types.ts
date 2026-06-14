// Tipos basados en el modelo `UserLibraryItem` (y `Product`/`ProductFile`) del schema.prisma

export interface LibraryAccess {
  owned: boolean;
  acquiredAt?: string | null;
  lastDownloadedAt?: string | null;
  downloadUrl?: string | null;
}

export interface LibraryProductSummary {
  id: string;
  title: string;
  slug: string;
  coverImageUrl?: string | null;
}

export interface LibraryItem {
  id: string;
  productId: string;
  product: LibraryProductSummary;
  acquiredAt: string;
  lastDownloadedAt?: string | null;
}
