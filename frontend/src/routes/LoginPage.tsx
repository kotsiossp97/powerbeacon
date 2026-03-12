/**
 * Login page
 */
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { API_BASE_URL } from "@/api/client";
import { useLocalAuth } from "@/auth/localAuth";
import { useAuthStore } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import logo from "@/assets/banner-900x300.png";
const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isSetupComplete, oidcEnabled, loadCurrentUser } =
    useAuthStore();
  const { login, loading, error } = useLocalAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    // Check for token from OAuth callback
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("access_token", token);
      loadCurrentUser().then(() => {
        navigate("/");
      });
      return;
    }

    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate, searchParams, loadCurrentUser]);

  const onSubmit = async (values: LoginFormValues) => {
    await login(values.username, values.password);
  };

  const handleOIDCLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/login/oauth`;
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-primary to-primary-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-xl gap-0 shadow-xl">
        <CardHeader className="flex flex-col items-center gap-1 text-center">
          <img
            src={logo}
            alt="PowerBeacon Logo"
            className="sm:h-48 object-contain"
          />
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <Field data-invalid={!!errors.username}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <FieldContent>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    autoComplete="username"
                    disabled={loading}
                    aria-invalid={!!errors.username}
                    {...register("username")}
                  />
                  <FieldError errors={[errors.username]} />
                </FieldContent>
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  <FieldError errors={[errors.password]} />
                </FieldContent>
              </Field>

              {error && (
                <Field data-invalid>
                  <FieldError className="font-semibold bg-destructive/10 rounded p-2 border-destructive border-2">
                    {error}
                  </FieldError>
                </Field>
              )}
            </FieldGroup>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size={"lg"}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>

        {oidcEnabled && (
          <CardFooter className="flex flex-col gap-4 border-0 bg-card mt-2">
            <div className="flex w-full items-center gap-3  text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>Or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              size={"lg"}
              onClick={handleOIDCLogin}
              className="w-full"
            >
              Sign in with SSO
            </Button>
          </CardFooter>
        )}
        {!isSetupComplete && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            First time here?{" "}
            <Button
              variant="link"
              className="px-0 h-auto text-primary hover:text-primary/80"
              onClick={() => navigate("/onboarding", { replace: true })}
            >
              Set up PowerBeacon
            </Button>
          </p>
        )}
      </Card>
    </main>
  );
};
