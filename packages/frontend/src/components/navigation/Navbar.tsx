import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__brand">
        Notisability
      </NavLink>

      <div className="navbar__links">
        <NavLink to="/products" className="navbar__link">
          Catálogo
        </NavLink>

        <NavLink to="/cart" className="navbar__link navbar__link--cart">
          Carrito
          {items.length > 0 && <span className="navbar__cart-badge">{items.length}</span>}
        </NavLink>

        {user && (
          <NavLink to="/library" className="navbar__link">
            Mi biblioteca
          </NavLink>
        )}
      </div>

      <div className="navbar__auth">
        {user ? (
          <>
            <span className="navbar__user">{user.fullName}</span>
            <button type="button" className="navbar__logout" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="navbar__link">
              Iniciar sesión
            </NavLink>
            <NavLink to="/register" className="navbar__link">
              Registrarse
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
