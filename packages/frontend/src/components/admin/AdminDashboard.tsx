import { useState } from "react";
import ProductsTable from "./ProductsTable";
import UsersTable from "./UsersTable";

type AdminTab = "users" | "products";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  return (
    <div className="admin-dashboard">
      <h1 className="admin-dashboard__title">Panel de administración</h1>

      <div className="admin-dashboard__tabs">
        <button
          type="button"
          className={`admin-dashboard__tab ${activeTab === "users" ? "admin-dashboard__tab--active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Usuarios
        </button>
        <button
          type="button"
          className={`admin-dashboard__tab ${activeTab === "products" ? "admin-dashboard__tab--active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          Productos globales
        </button>
      </div>

      <div className="admin-dashboard__content">
        {activeTab === "users" ? <UsersTable /> : <ProductsTable />}
      </div>
    </div>
  );
}

export default AdminDashboard;
