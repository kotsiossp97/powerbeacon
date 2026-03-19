import { Button } from "@/components/ui/button";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getUserFormDefaults,
  userFormSchema,
  type UserFormData,
} from "@/components/users/userForm";
import type { User } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

interface UserFormDialogProps {
  open: boolean;
  editingUser: User | null;
  isSubmitting: boolean;
  isSuperuser: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => void;
}

export const UserFormDialog = ({
  open,
  editingUser,
  isSubmitting,
  isSuperuser,
  onOpenChange,
  onSubmit,
}: UserFormDialogProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: getUserFormDefaults(),
  });

  const isCreating = !editingUser;

  useEffect(() => {
    if (open) {
      reset(getUserFormDefaults(editingUser));
    }
  }, [open, editingUser, reset]);

  const handleFormSubmit = async (data: UserFormData) => {
    // For creation, password is required
    if (isCreating && !data.password) {
      return;
    }
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg pb-0">
        <DialogHeader>
          <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {editingUser
              ? "Update user information and permissions."
              : "Add a new user to your system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="-mx-4 no-scrollbar max-h-[80svh] overflow-y-auto px-4">
            <FieldGroup>
              <Field data-invalid={!!errors.username}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <FieldContent>
                  <Input
                    id="username"
                    placeholder="Enter a username"
                    autoComplete="username"
                    aria-invalid={!!errors.username}
                    {...register("username")}
                  />
                  <FieldError errors={[errors.username]} />
                </FieldContent>
              </Field>

              <Field data-invalid={!!errors.full_name}>
                <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                <FieldContent>
                  <Input
                    id="full_name"
                    placeholder="Enter user's full name"
                    autoComplete="name"
                    aria-invalid={!!errors.full_name}
                    {...register("full_name")}
                  />
                  <FieldError errors={[errors.full_name]} />
                </FieldContent>
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <FieldContent>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  <FieldError errors={[errors.email]} />
                </FieldContent>
              </Field>

              {isCreating && (
                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <FieldContent>
                    <PasswordInput
                      id="password"
                      autoComplete="new-password"
                      placeholder="Enter a password"
                      aria-invalid={!!errors.password}
                      {...register("password")}
                    />
                    <FieldError errors={[errors.password]} />
                  </FieldContent>
                </Field>
              )}

              {editingUser && (
                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">
                    New Password (optional)
                  </FieldLabel>
                  <FieldContent>
                    <PasswordInput
                      id="password"
                      autoComplete="new-password"
                      placeholder="Leave blank to keep current password"
                      aria-invalid={!!errors.password}
                      {...register("password")}
                    />
                    <FieldError errors={[errors.password]} />
                  </FieldContent>
                </Field>
              )}

              <Field data-invalid={!!errors.role}>
                <FieldLabel>Role</FieldLabel>
                <FieldContent>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {isSuperuser && (
                            <SelectItem value="superuser">Superuser</SelectItem>
                          )}
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[errors.role]} />
                </FieldContent>
              </Field>
            </FieldGroup>

            <DialogFooter className="mb-0 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingUser ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
