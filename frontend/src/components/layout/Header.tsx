/**
 * Header component
 */
import logoBadge from "@/assets/badge-512.png";
import { useLocalAuth } from "@/auth/localAuth";
import { useAuthStore } from "@/auth/useAuth";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { useVisibleNavigationLinks } from "@/routes/navlinks";
import {
  BookOpen,
  BookOpenText,
  ChevronDown,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { getUserInitials } from "../users";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useLocalAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    navigate("/login");
  }

  const handleLogout = async () => {
    await logout();
  };

  const visibleNavItems = useVisibleNavigationLinks();

  return (
    <header className="border-b bg-primary backdrop-blur sticky top-0 z-50 shadow-lg dark:bg-primary/80">
      <div className="flex h-14 items-center px-4 lg:px-6">
        <Link to="/" className="mr-3">
          <div className="h-14">
            <img
              src={logoBadge}
              alt="PowerBeacon"
              className="object-contain h-full"
              loading="lazy"
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleNavItems?.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/dashboard" &&
                location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-card"
                    : "text-muted dark:text-muted-foreground hover:text-foreground hover:bg-card/50",
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden ml-auto mr-2 text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {/* User Menu */}
        {user && (
          <div className="ml-auto hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 py-5"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-accent-foreground text-accent text-xs">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-60 p-3">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-foreground text-lg">
                      {user?.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {user?.email}
                    </span>
                    <span className="text-xs bg-primary/20 w-fit px-2 py-0.5 rounded-lg border border-primary text-primary font-semibold mt-1 capitalize">
                      {user?.role}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild>
                  <div className="flex items-center justify-center">
                    <ThemeToggle />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="mt-1 mb-2" asChild>
                  <Button
                    variant={"destructive"}
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-3" />
                <DropdownMenuItem asChild>
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      className="gap-2"
                      href="https://kotsiossp97.github.io/powerbeacon"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <BookOpen className="h-4 w-4" />
                      PowerBeacon Docs
                    </a>
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuItem className="mt-2" asChild>
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      className="gap-2"
                      href="/api/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <BookOpenText className="h-4 w-4" />
                      API Documentation
                    </a>
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
    </header>
  );
};
