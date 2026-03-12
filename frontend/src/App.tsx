/**
 * Main App component with routing
 */
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useAuthStore } from "@/auth/useAuth";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { LoginPage } from "@/routes/LoginPage";
import { UsersPage } from "@/routes/UsersPage";
import { SettingsPage } from "@/routes/SettingsPage";
import { AgentsPage } from "@/routes/AgentsPage";
import OnboardingPage from "@/routes/OnboardingPage";
import "@/index.css";
import DashboardPage from "./routes/DashboardPage";
import { Layout } from "./components/layout/Layout";

function App() {
  // const isSetupComplete = false;
  const {
    isAuthenticated,
    isSetupComplete,
    loading,
    checkSetup,
    loadCurrentUser,
    loadAuthConfig,
  } = useAuthStore();

  useEffect(() => {
    const initialize = async () => {
      await checkSetup();
      await loadAuthConfig();
      await loadCurrentUser();
    };
    initialize();
  }, [checkSetup, loadCurrentUser, loadAuthConfig]);

  if (loading || isSetupComplete === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-muted-foreground">Initializing...</div>
      </div>
    );
  }

  // // If setup is not complete, show onboarding
  // if (!isSetupComplete) {
  //   return (
  //     <BrowserRouter>
  //       <Routes>
  //         <Route path="*" element={<OnboardingPage />} />
  //       </Routes>
  //     </BrowserRouter>
  //   );
  // }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
        />

        <Route
          path="/onboarding"
          element={isSetupComplete ? <Navigate to="/" /> : <OnboardingPage />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
