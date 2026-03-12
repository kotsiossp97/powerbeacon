import {
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
} from "lucide-react";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserInitials, roleConfig, statusConfig } from "./constants";

interface UsersTableProps {
  users: User[];
  loading: boolean;
  searchQuery: string;
  roleFilter: string;
  statusFilter: string;
  canManageUsers: boolean;
  isAdmin: boolean;
  currentUserId?: string;
  onEditUser: (user: User) => void;
  onToggleUserStatus: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

export const UsersTable = ({
  users,
  loading,
  searchQuery,
  roleFilter,
  statusFilter,
  canManageUsers,
  isAdmin,
  currentUserId,
  onEditUser,
  onToggleUserStatus,
  onDeleteUser,
}: UsersTableProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12.5"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                    ? "No users found matching your filters"
                    : "No users yet"}
                </p>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const roleInfo = roleConfig[user.role];
              const RoleIcon = roleInfo.icon;
              const statusInfo = statusConfig[user.is_active ? "active" : "inactive"];

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">
                          {user.full_name || user.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email || user.username}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleInfo.className}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {roleInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusInfo.className}>
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {(canManageUsers || (isAdmin && user.role !== "superuser")) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onToggleUserStatus(user)}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            {user.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          {canManageUsers && user.id !== currentUserId && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDeleteUser(user)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
