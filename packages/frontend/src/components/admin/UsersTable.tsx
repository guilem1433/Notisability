import { useEffect, useState } from "react";
import adminService from "../../services/admin.service";
import { Role, User } from "../../types/auth.types";

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [userList, roleList] = await Promise.all([
          adminService.listUsers(),
          adminService.listRoles(),
        ]);

        if (isMounted) {
          setUsers(userList);
          setRoles(roleList);
        }
      } catch {
        if (isMounted) {
          setError("No se pudieron cargar los usuarios.");
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
  }, []);

  const handleRoleChange = async (userId: string, roleId: number) => {
    setUpdatingUserId(userId);

    try {
      const updatedUser = await adminService.updateUserRole(userId, roleId);
      setUsers((prev) => prev.map((user) => (user.id === userId ? updatedUser : user)));
    } catch {
      setError("No se pudo actualizar el rol del usuario.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return true;
    }
    return user.fullName.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
  });

  if (loading) {
    return <p className="admin-table__status">Cargando usuarios...</p>;
  }

  return (
    <div className="admin-table">
      <input
        type="search"
        className="admin-table__search"
        placeholder="Buscar por nombre o correo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <p className="admin-table__status admin-table__status--error">{error}</p>}

      <table className="admin-table__table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Estado</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.fullName}</td>
              <td>{user.email}</td>
              <td>{user.isActive ? "Activo" : "Inactivo"}</td>
              <td>
                <select
                  value={user.roleId}
                  disabled={updatingUserId === user.id}
                  onChange={(e) => handleRoleChange(user.id, Number(e.target.value))}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredUsers.length === 0 && (
        <p className="admin-table__status">No se encontraron usuarios.</p>
      )}
    </div>
  );
}

export default UsersTable;
