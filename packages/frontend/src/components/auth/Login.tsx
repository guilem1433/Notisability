import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import { useAuth } from "../../context/AuthContext";
import { LoginPayload } from "../../types/auth.types";
import Button from "../common/Button";

interface LoginProps {
  onSuccess?: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const { login } = useAuth();
  const [form, setForm] = useState<LoginPayload>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof LoginPayload) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(form);
      onSuccess?.();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? "No se pudo iniciar sesión.");
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
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Iniciar sesión</h2>

        <label htmlFor="login-email" className="text-sm font-semibold text-slate-500">
          Correo electrónico
        </label>
        <input
          id="login-email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          required
          autoComplete="email"
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <label htmlFor="login-password" className="text-sm font-semibold text-slate-500">
          Contraseña
        </label>
        <input
          id="login-password"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          required
          autoComplete="current-password"
          minLength={8}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isLoading} className="mt-2 w-full">
          {isLoading ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>
    </div>
  );
}

export default Login;
