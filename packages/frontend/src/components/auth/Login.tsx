import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import authService from "../../services/auth.service";
import { LoginPayload } from "../../types/auth.types";

interface LoginProps {
  onSuccess?: () => void;
}

export function Login({ onSuccess }: LoginProps) {
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
      await authService.login(form);
      onSuccess?.();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? "No se pudo iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Iniciar sesión</h2>

      <label htmlFor="login-email">Correo electrónico</label>
      <input
        id="login-email"
        type="email"
        value={form.email}
        onChange={handleChange("email")}
        required
        autoComplete="email"
      />

      <label htmlFor="login-password">Contraseña</label>
      <input
        id="login-password"
        type="password"
        value={form.password}
        onChange={handleChange("password")}
        required
        autoComplete="current-password"
        minLength={8}
      />

      {error && <p className="auth-form__error">{error}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}

export default Login;
