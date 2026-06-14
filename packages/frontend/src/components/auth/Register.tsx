import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import authService from "../../services/auth.service";
import { RegisterPayload, RoleName } from "../../types/auth.types";
import Button from "../common/Button";

interface RegisterProps {
  onSuccess?: () => void;
}

const initialForm: RegisterPayload = {
  email: "",
  password: "",
  fullName: "",
  role: RoleName.CUSTOMER,
};

export function Register({ onSuccess }: RegisterProps) {
  const [form, setForm] = useState<RegisterPayload>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange =
    (field: keyof RegisterPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.register(form);
      onSuccess?.();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? "No se pudo completar el registro.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-8 shadow-md"
        onSubmit={handleSubmit}
      >
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Crear cuenta</h2>

        <label htmlFor="register-fullname" className="text-sm font-semibold text-slate-500">
          Nombre completo
        </label>
        <input
          id="register-fullname"
          type="text"
          value={form.fullName}
          onChange={handleChange("fullName")}
          required
          autoComplete="name"
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <label htmlFor="register-email" className="text-sm font-semibold text-slate-500">
          Correo electrónico
        </label>
        <input
          id="register-email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          required
          autoComplete="email"
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <label htmlFor="register-password" className="text-sm font-semibold text-slate-500">
          Contraseña
        </label>
        <input
          id="register-password"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          required
          autoComplete="new-password"
          minLength={8}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <label htmlFor="register-role" className="text-sm font-semibold text-slate-500">
          Tipo de cuenta
        </label>
        <select
          id="register-role"
          value={form.role}
          onChange={handleChange("role")}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value={RoleName.CUSTOMER}>Usuario final</option>
          <option value={RoleName.PROVIDER}>Proveedor de contenido</option>
        </select>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isLoading} className="mt-2 w-full">
          {isLoading ? "Creando cuenta..." : "Registrarse"}
        </Button>
      </form>
    </div>
  );
}

export default Register;
