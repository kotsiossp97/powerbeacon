import * as z from "zod";
import type { User, UserRole } from "@/types";

export const userFormSchema = z
  .object({
    username: z.string().min(1, "Username is required").max(50, "Username too long"),
    email: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || z.email().safeParse(value).success,
        "Invalid email address",
      ),
    full_name: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional()
      .or(z.literal("")),
    role: z.enum(["superuser", "admin", "user", "viewer"]),
  });

export type UserFormData = z.infer<typeof userFormSchema>;

export const getUserFormDefaults = (user?: User | null): UserFormData => ({
  username: user?.username || "",
  email: user?.email || "",
  full_name: user?.full_name || "",
  password: "",
  role: user?.role || "user",
});

export const mapUserFormToPayload = (
  data: UserFormData,
  isEdit: boolean,
): {
  username: string;
  email?: string;
  full_name?: string;
  password?: string;
  role: UserRole;
} => {
  const payload: {
    username: string;
    email?: string;
    full_name?: string;
    password?: string;
    role: UserRole;
  } = {
    username: data.username,
    role: data.role,
  };

  if (data.email) {
    payload.email = data.email.trim();
  }

  if (data.full_name) {
    payload.full_name = data.full_name;
  }

  if (data.password && (data.password.length > 0 || !isEdit)) {
    payload.password = data.password;
  }

  return payload;
};
