import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, ShoppingCart, User as UserIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-semibold transition-colors duration-200 ${
    isActive ? "text-primary" : "text-slate-500 hover:text-primary"
  }`;

export function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between gap-6 border-b border-slate-100 bg-white px-6 py-4">
      <NavLink to="/" className="text-xl font-extrabold tracking-tight text-primary">
        Notisability
      </NavLink>

      <div className="flex flex-1 items-center justify-center gap-6">
        <NavLink to="/products" className={linkClasses}>
          Catálogo
        </NavLink>

        <NavLink to="/cart" className={linkClasses}>
          {({ isActive }) => (
            <span className="relative inline-flex items-center gap-1.5">
              <ShoppingCart size={18} className={isActive ? "text-primary" : "text-slate-500"} />
              Carrito
              {items.length > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                  {items.length}
                </span>
              )}
            </span>
          )}
        </NavLink>

        {user && (
          <NavLink to="/library" className={linkClasses}>
            Mi biblioteca
          </NavLink>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <UserIcon size={18} className="text-slate-400" />
              {user.fullName}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition-colors duration-200 hover:border-red-300 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={linkClasses}>
              Iniciar sesión
            </NavLink>
            <NavLink to="/register" className={linkClasses}>
              Registrarse
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
