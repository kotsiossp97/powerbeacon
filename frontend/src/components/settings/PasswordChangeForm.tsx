import { usersApi } from "@/api/users";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  PasswordInput,
  PasswordInputStrengthChecker,
} from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type { User, UserUpdatePassword } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw, Save } from "lucide-react";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

interface AccountCredentialsForm {
  user?: User | null;
}

const formSchema = z
  .object({
    full_name: z.string().optional(),

    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .optional(),

    old_password: z.string().optional(),
    new_password: z.string().optional(),
    confirm_password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const passwordFields = [
      data.old_password,
      data.new_password,
      data.confirm_password,
    ];

    const isChangingPassword = passwordFields.some((v) => v && v.length > 0);

    if (!isChangingPassword) {
      return;
    }

    if (!data.old_password || data.old_password.length < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["old_password"],
        message: "Password must be at least 5 characters",
      });
    }

    if (!data.new_password || data.new_password.length < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["new_password"],
        message: "Password must be at least 5 characters",
      });
    }

    if (!data.confirm_password || data.confirm_password.length < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["confirm_password"],
        message: "Password must be at least 5 characters",
      });
    }

    if (data.new_password !== data.confirm_password) {
      ctx.addIssue({
        code: "custom",
        path: ["confirm_password"],
        message: "Passwords do not match",
      });
    }
  });

const passwordChangeSchema = z
  .object({
    old_password: z.string().min(5, "Password must be at least 5 characters"),
    new_password: z.string().min(5, "Password must be at least 5 characters"),
    confirm_password: z
      .string()
      .min(5, "Password must be at least 5 characters"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

const profileUpdateSchema = z.object({
  full_name: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

const AccountCredentialsForm: React.FC<AccountCredentialsForm> = ({ user }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
      full_name: user?.full_name || "",
      username: user?.username || "",
    },
    resetOptions: {},
  });

  if (!user) return null;

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log("🚀 ~ handleSubmit ~ data:", data);
    try {
      setIsSubmitting(true);
      const updatePassword = passwordChangeSchema.safeParse({
        old_password: data.old_password,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      const updateProfile = profileUpdateSchema.safeParse({
        full_name: data.full_name,
        username: data.username,
      });
      if (updatePassword.success) {
        const updateData: UserUpdatePassword = {
          current_password: updatePassword.data.old_password,
          new_password: updatePassword.data.confirm_password,
        };
        const resp = await usersApi.updatePassword(updateData);
        form.resetDefaultValues({
          old_password: "",
          new_password: "",
          confirm_password: "",
          full_name: resp.data.full_name ?? "",
          username: resp.data.username ?? "",
        });
        toast.success("Password updated successfully");
      }

      if (updateProfile.success) {
        const resp = await usersApi.updateMe({
          full_name: updateProfile.data.full_name,
          username: updateProfile.data.username,
        });
        form.resetDefaultValues({
          ...form.getValues(),
          full_name: resp.data.full_name ?? "",
          username: resp.data.username ?? "",
        });
      }
      form.clearErrors();
    } catch (err) {
      const apiError = err as {
        response?: { data?: { message?: string; detail?: string } };
      };
      toast.error(
        apiError.response?.data?.message || "Failed to update password",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Account Credentials</FieldLegend>
            <FieldDescription>
              Update your account credentials here.
            </FieldDescription>
          </FieldSet>
          <div className="gap-4 space-y-4 md:flex">
            <FieldGroup className="flex-1">
              <Controller
                control={form.control}
                name="old_password"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="old-password">Old Password</FieldLabel>
                    <PasswordInput
                      {...field}
                      id="old-password"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="new_password"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                    <PasswordInput
                      {...field}
                      id="new-password"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    >
                      <PasswordInputStrengthChecker />
                    </PasswordInput>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="confirm_password"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <PasswordInput
                      {...field}
                      id="confirm-password"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <Separator orientation="vertical" />
            <FieldGroup className="flex-1">
              <Controller
                control={form.control}
                name="full_name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                    <Input
                      {...field}
                      id="full-name"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="username"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input
                      {...field}
                      id="username"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <Field orientation="horizontal" className="justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner data-icon="inline-start" /> : <Save />}
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
            <Button variant="secondary" onClick={() => form.reset()}>
              <RotateCcw data-icon="inline-start" />
              Reset
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
};

export default AccountCredentialsForm;
