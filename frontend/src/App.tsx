/**
 * Main App component with routing
 */
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { useAuthStore } from "@/auth/useAuth";
import "@/index.css";
import { AgentsPage } from "@/routes/AgentsPage";
import ClusterDetailPage from "@/routes/ClusterDetailPage";
import ClustersPage from "@/routes/ClustersPage";
import { LoginPage } from "@/routes/LoginPage";
import OnboardingPage from "@/routes/OnboardingPage";
import { SettingsPage } from "@/routes/SettingsPage";
import { UsersPage } from "@/routes/UsersPage";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Layout } from "./components/layout/Layout";
import DashboardPage from "./routes/DashboardPage";

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
          <Route path="/clusters" element={<ClustersPage />} />
          <Route path="/clusters/:clusterId" element={<ClusterDetailPage />} />
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
