import type { FormEvent } from "react";
import type { User, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

interface UserFormData {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
}

interface UserFormDialogProps {
  open: boolean;
  editingUser: User | null;
  formData: UserFormData;
  isSubmitting: boolean;
  isSuperuser: boolean;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (data: UserFormData) => void;
  onSubmit: (event: FormEvent) => void;
}

export const UserFormDialog = ({
  open,
  editingUser,
  formData,
  isSubmitting,
  isSuperuser,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: UserFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {editingUser
              ? "Update user information and permissions."
              : "Add a new user to your system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Username</FieldLabel>
              <FieldContent>
                <Input
                  value={formData.username}
                  onChange={(event) =>
                    onFormDataChange({ ...formData, username: event.target.value })
                  }
                  required
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Full Name</FieldLabel>
              <FieldContent>
                <Input
                  value={formData.full_name}
                  onChange={(event) =>
                    onFormDataChange({ ...formData, full_name: event.target.value })
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Email</FieldLabel>
              <FieldContent>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    onFormDataChange({ ...formData, email: event.target.value })
                  }
                />
              </FieldContent>
            </Field>

            {!editingUser && (
              <Field>
                <FieldLabel>Password</FieldLabel>
                <FieldContent>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(event) =>
                      onFormDataChange({ ...formData, password: event.target.value })
                    }
                    required
                  />
                </FieldContent>
              </Field>
            )}

            <Field>
              <FieldLabel>Role</FieldLabel>
              <FieldContent>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) =>
                    onFormDataChange({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperuser && <SelectItem value="superuser">Superuser</SelectItem>}
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingUser ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
