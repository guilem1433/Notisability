import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import authService from "../../services/auth.service";
import { RegisterPayload, RoleName } from "../../types/auth.types";

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
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Crear cuenta</h2>

      <label htmlFor="register-fullname">Nombre completo</label>
      <input
        id="register-fullname"
        type="text"
        value={form.fullName}
        onChange={handleChange("fullName")}
        required
        autoComplete="name"
      />

      <label htmlFor="register-email">Correo electrónico</label>
      <input
        id="register-email"
        type="email"
        value={form.email}
        onChange={handleChange("email")}
        required
        autoComplete="email"
      />

      <label htmlFor="register-password">Contraseña</label>
      <input
        id="register-password"
        type="password"
        value={form.password}
        onChange={handleChange("password")}
        required
        autoComplete="new-password"
        minLength={8}
      />

      <label htmlFor="register-role">Tipo de cuenta</label>
      <select id="register-role" value={form.role} onChange={handleChange("role")}>
        <option value={RoleName.CUSTOMER}>Usuario final</option>
        <option value={RoleName.PROVIDER}>Proveedor de contenido</option>
      </select>

      {error && <p className="auth-form__error">{error}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creando cuenta..." : "Registrarse"}
      </button>
    </form>
  );
}

export default Register;
