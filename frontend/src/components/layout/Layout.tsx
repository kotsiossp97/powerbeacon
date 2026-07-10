/**
 * Layout wrapper component
 */
import { Header } from "./Header";
import { Outlet } from "react-router";

export const Layout = () => {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
};
