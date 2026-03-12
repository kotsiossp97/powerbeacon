/**
 * Layout wrapper component
 */
import { Header } from "./Header";
import { Outlet } from "react-router";

export const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 mx-auto px-5">
        <Outlet />
      </main>
    </div>
  );
};
