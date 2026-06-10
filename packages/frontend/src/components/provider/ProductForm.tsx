import { FormEvent, useEffect, useState } from "react";
import { AxiosError } from "axios";
import providerService from "../../services/provider.service";
import { Category, CreateProductPayload, Product, ProductStatus } from "../../types/product.types";

interface ProductFormProps {
  productId?: string;
  onSaved?: (product: Product) => void;
}

const initialForm: CreateProductPayload = {
  categoryId: 0,
  title: "",
  description: "",
  price: 0,
  currency: "COP",
  coverImageUrl: "",
  status: ProductStatus.DRAFT,
};

export function ProductForm({ productId, onSaved }: ProductFormProps) {
  const isEditing = Boolean(productId);

  const [form, setForm] = useState<CreateProductPayload>(initialForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para subir una nueva version del archivo digital (`ProductFile`)
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const categoryList = await providerService.listCategories();
        if (!isMounted) {
          return;
        }
        setCategories(categoryList);

        if (productId) {
          const product = await providerService.getMyProductById(productId);
          if (!isMounted) {
            return;
          }
          setForm({
            categoryId: product.categoryId,
            title: product.title,
            description: product.description,
            price: product.price,
            currency: product.currency,
            coverImageUrl: product.coverImageUrl ?? "",
            status: product.status,
          });
        }
      } catch {
        if (isMounted) {
          setError("No se pudo cargar la información del producto.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleChange = (
    field: keyof CreateProductPayload
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      [field]:
        field === "price" || field === "categoryId" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const savedProduct = isEditing
        ? await providerService.updateProduct(productId as string, form)
        : await providerService.createProduct(form);

      onSaved?.(savedProduct);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async () => {
    if (!productId || !versionFile || !version) {
      return;
    }

    setUploading(true);
    setUploadMessage(null);

    try {
      await providerService.uploadProductFile(productId, versionFile, version, changelog || undefined);
      setUploadMessage("Archivo subido correctamente.");
      setVersionFile(null);
      setVersion("");
      setChangelog("");
    } catch {
      setUploadMessage("No se pudo subir el archivo.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <p className="product-form__status">Cargando formulario...</p>;
  }

  return (
    <div className="product-form-page">
      <form className="product-form" onSubmit={handleSubmit}>
        <h2>{isEditing ? "Editar producto" : "Nuevo producto"}</h2>

        <label htmlFor="product-title">Nombre</label>
        <input id="product-title" type="text" value={form.title} onChange={handleChange("title")} required />

        <label htmlFor="product-description">Descripción</label>
        <textarea
          id="product-description"
          value={form.description}
          onChange={handleChange("description")}
          required
          rows={5}
        />

        <label htmlFor="product-price">Precio (COP)</label>
        <input
          id="product-price"
          type="number"
          min={0}
          step="0.01"
          value={form.price}
          onChange={handleChange("price")}
          required
        />

        <label htmlFor="product-category">Categoría</label>
        <select id="product-category" value={form.categoryId} onChange={handleChange("categoryId")} required>
          <option value={0} disabled>
            Selecciona una categoría
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <label htmlFor="product-cover">URL de imagen de portada</label>
        <input
          id="product-cover"
          type="url"
          value={form.coverImageUrl ?? ""}
          onChange={handleChange("coverImageUrl")}
          placeholder="https://..."
        />

        <label htmlFor="product-status">Estado</label>
        <select id="product-status" value={form.status} onChange={handleChange("status")}>
          <option value={ProductStatus.DRAFT}>Borrador</option>
          <option value={ProductStatus.PUBLISHED}>Publicado</option>
          <option value={ProductStatus.ARCHIVED}>Archivado</option>
        </select>

        {error && <p className="product-form__error">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear producto"}
        </button>
      </form>

      {isEditing && (
        <div className="product-form__file-upload">
          <h3>Subir nueva versión del archivo</h3>

          <label htmlFor="product-version">Versión</label>
          <input
            id="product-version"
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0.0"
          />

          <label htmlFor="product-changelog">Changelog (opcional)</label>
          <textarea
            id="product-changelog"
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            rows={3}
          />

          <label htmlFor="product-file">Archivo</label>
          <input
            id="product-file"
            type="file"
            onChange={(e) => setVersionFile(e.target.files?.[0] ?? null)}
          />

          {uploadMessage && <p className="product-form__upload-message">{uploadMessage}</p>}

          <button
            type="button"
            onClick={handleFileUpload}
            disabled={uploading || !versionFile || !version}
          >
            {uploading ? "Subiendo..." : "Subir archivo"}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductForm;
