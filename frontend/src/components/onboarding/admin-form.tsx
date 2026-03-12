import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput, PasswordInputStrengthChecker } from "@/components/ui/password-input";

const formSchema = z
  .object({
    full_name: z.string().optional(),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || z.email().safeParse(value).success,
        "Invalid email address",
      ),
    password: z.string().min(5, "Password must be at least 5 characters"),
    confirmPassword: z
      .string()
      .min(5, "Confirm Password must be at least 5 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type OnboardingAdminFormData = z.infer<typeof formSchema>;

interface OnboardingAdminFormProps {
  value?: Partial<OnboardingAdminFormData>;
  onChange?: (data: Partial<OnboardingAdminFormData>) => void;
  onSuccess?: (data: OnboardingAdminFormData | undefined) => void;
}

const OnboardingAdminForm: React.FC<OnboardingAdminFormProps> = ({
  value,
  onChange,
  onSuccess,
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useForm<OnboardingAdminFormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      full_name: value?.full_name ?? "",
      username: value?.username ?? "",
      email: value?.email ?? "",
      password: value?.password ?? "",
      confirmPassword: value?.confirmPassword ?? "",
    },
  });

  const values = useWatch({ control });

  useEffect(() => {
    const parsed = formSchema.safeParse(values);
    onChange?.(values ?? {});
    onSuccess?.(parsed.success ? parsed.data : undefined);
  }, [values, onChange, onSuccess]);

  return (
    <form className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={!!errors.full_name}>
          <FieldLabel htmlFor="adminFullname">Full Name</FieldLabel>
          <FieldContent>
            <Input
              id="adminFullname"
              type="text"
              placeholder="Enter a name"
              autoComplete="adminFullname"
              aria-invalid={!!errors.full_name}
              {...register("full_name")}
            />
            <FieldError errors={[errors.full_name]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.username}>
          <FieldLabel htmlFor="adminUsername">Username</FieldLabel>
          <FieldContent>
            <Input
              id="adminUsername"
              type="text"
              placeholder="Enter username"
              autoComplete="adminUsername"
              aria-invalid={!!errors.username}
              {...register("username")}
            />
            <FieldError errors={[errors.username]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="adminEmail">Email (optional)</FieldLabel>
          <FieldContent>
            <Input
              id="adminEmail"
              type="email"
              placeholder="Enter email address"
              autoComplete="adminEmail"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError errors={[errors.email]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="adminPassword">Password</FieldLabel>
          <FieldContent>
            <PasswordInput
              id="adminPassword"
              placeholder="Enter password"
              autoComplete="adminPassword"
              aria-invalid={!!errors.password}
              {...register("password")}
            >
              <PasswordInputStrengthChecker />
            </PasswordInput>
            <FieldError errors={[errors.password]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="adminConfirmPassword">
            Confirm Password
          </FieldLabel>
          <FieldContent>
            <PasswordInput
              id="adminConfirmPassword"
              placeholder="Confirm password"
              autoComplete="adminConfirmPassword"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </FieldContent>
        </Field>
      </FieldGroup>
    </form>
  );
};

export default OnboardingAdminForm;
