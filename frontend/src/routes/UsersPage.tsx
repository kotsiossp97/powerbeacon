/**
 * Users management page with role-based access control
 */
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { usersApi } from "@/api/users";
import { useAuthStore } from "@/auth/useAuth";
import type { User, UserRole, UserCreate, UserUpdate } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DeleteUserDialog,
  UserFormDialog,
  UsersFilters,
  UsersStats,
  UsersTable,
} from "@/components/users";

interface UserFormData {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
}

const defaultFormData: UserFormData = {
  username: "",
  email: "",
  full_name: "",
  password: "",
  role: "user",
};

export const UsersPage = () => {
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);

  const isSuperuser = currentUser?.role === "superuser";
  const isAdmin = currentUser?.role === "admin";
  const canManageUsers = isSuperuser;

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.list();
      setUsers(response.data.data);
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      setError(apiError.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.is_active).length,
      admins: users.filter(
        (user) => user.role === "admin" || user.role === "superuser",
      ).length,
    };
  }, [users]);

  const handleOpenForm = (userToEdit?: User) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        username: userToEdit.username,
        email: userToEdit.email || "",
        full_name: userToEdit.full_name || "",
        password: "",
        role: userToEdit.role,
      });
    } else {
      setEditingUser(null);
      setFormData(defaultFormData);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUser) {
        const updateData: UserUpdate = {};
        if (formData.username !== editingUser.username) {
          updateData.username = formData.username;
        }
        if (formData.email) {
          updateData.email = formData.email;
        }
        if (formData.full_name) {
          updateData.full_name = formData.full_name;
        }
        if (formData.password) {
          updateData.password = formData.password;
        }
        if (formData.role !== editingUser.role) {
          updateData.role = formData.role;
        }

        await usersApi.update(editingUser.id, updateData);
        toast.success("User updated successfully");
      } else {
        const payload: UserCreate = {
          username: formData.username,
          password: formData.password,
          email: formData.email || undefined,
          full_name: formData.full_name || undefined,
          role: formData.role,
          is_active: true,
        };
        await usersApi.create(payload);
        toast.success("User created successfully");
      }

      setIsFormOpen(false);
      setEditingUser(null);
      setFormData(defaultFormData);
      loadUsers();
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || "Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await usersApi.update(user.id, { is_active: !user.is_active });
      toast.success(
        `${user.username} has been ${!user.is_active ? "activated" : "deactivated"}`,
      );
      loadUsers();
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || "Failed to update user status");
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      await usersApi.delete(deletingUser.id);
      toast.success(`${deletingUser.username} has been deleted`);
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || "Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        {canManageUsers && (
          <Button size="sm" onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">
          {error}
        </div>
      )}

      <UsersStats total={stats.total} active={stats.active} admins={stats.admins} />

      <UsersFilters
        searchQuery={searchQuery}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchQueryChange={setSearchQuery}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <UsersTable
        users={filteredUsers}
        loading={loading}
        searchQuery={searchQuery}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        canManageUsers={canManageUsers}
        isAdmin={isAdmin}
        currentUserId={currentUser?.id}
        onEditUser={handleOpenForm}
        onToggleUserStatus={handleToggleStatus}
        onDeleteUser={setDeletingUser}
      />

      <UserFormDialog
        open={isFormOpen}
        editingUser={editingUser}
        formData={formData}
        isSubmitting={isSubmitting}
        isSuperuser={isSuperuser}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingUser(null);
            setFormData(defaultFormData);
          }
        }}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
      />

      <DeleteUserDialog
        user={deletingUser}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingUser(null);
          }
        }}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
};
