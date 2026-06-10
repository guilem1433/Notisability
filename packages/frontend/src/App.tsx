import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import Navbar from "./components/navigation/Navbar";
import ProductList from "./components/products/ProductList";
import ProductDetail from "./components/products/ProductDetail";
import Cart from "./components/cart/Cart";
import CheckoutButton from "./components/checkout/CheckoutButton";
import PaymentStatus from "./components/checkout/PaymentStatus";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import UserLibrary from "./components/library/UserLibrary";
import ProviderDashboard from "./components/provider/ProviderDashboard";
import ProductForm from "./components/provider/ProductForm";
import AdminDashboard from "./components/admin/AdminDashboard";
import { RoleName } from "./types/auth.types";
import { Product } from "./types/product.types";

function CatalogPage() {
  const navigate = useNavigate();

  const handleSelectProduct = (product: Product) => {
    navigate(`/product/${product.slug}`);
  };

  return <ProductList onSelectProduct={handleSelectProduct} />;
}

function CartPage() {
  return (
    <div className="cart-page">
      <h1>Carrito de compras</h1>
      <Cart />
      <CheckoutButton />
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  return <Login onSuccess={() => navigate("/")} />;
}

function RegisterPage() {
  const navigate = useNavigate();
  return <Register onSuccess={() => navigate("/")} />;
}

function NewProductPage() {
  const navigate = useNavigate();
  return <ProductForm onSaved={() => navigate("/provider/dashboard")} />;
}

function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return <ProductForm productId={id} onSaved={() => navigate("/provider/dashboard")} />;
}

export function App() {
  return (
    <>
      <Navbar />

      <main className="app-content">
        <Routes>
          {/* Rutas publicas */}
          <Route path="/" element={<CatalogPage />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas protegidas: cualquier usuario autenticado */}
          <Route
            path="/checkout/status"
            element={
              <ProtectedRoute>
                <PaymentStatus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <UserLibrary />
              </ProtectedRoute>
            }
          />

          {/* Rutas de proveedor */}
          <Route
            path="/provider/dashboard"
            element={
              <ProtectedRoute allowedRoles={[RoleName.PROVIDER]}>
                <ProviderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/product/new"
            element={
              <ProtectedRoute allowedRoles={[RoleName.PROVIDER]}>
                <NewProductPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/product/edit/:id"
            element={
              <ProtectedRoute allowedRoles={[RoleName.PROVIDER]}>
                <EditProductPage />
              </ProtectedRoute>
            }
          />

          {/* Rutas de administracion */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[RoleName.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<p>No tienes permiso para ver esta página.</p>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
