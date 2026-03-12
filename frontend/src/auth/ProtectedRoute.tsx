/**
 * Protected route component
 */
import { type ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuthStore } from "@/auth/useAuth";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading, isSetupComplete } = useAuthStore();

  if (loading || isSetupComplete === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSetupComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role hierarchy: superuser > admin > user > viewer
  if (requiredRole && user) {
    const roleHierarchy: Record<UserRole, number> = {
      viewer: 0,
      user: 1,
      admin: 2,
      superuser: 3,
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
