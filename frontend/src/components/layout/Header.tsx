/**
 * Header component
 */
import logoBadge from "@/assets/badge-512.png";
import { useLocalAuth } from "@/auth/localAuth";
import { useAuthStore } from "@/auth/useAuth";
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
import {
  BookOpen,
  BookOpenText,
  Boxes,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Server,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { getUserInitials } from "../users";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Clusters",
    href: "/clusters",
    icon: Boxes,
    permission: "view_devices" as const,
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    permission: "view_users" as const,
  },
  {
    name: "Agents",
    href: "/agents",
    icon: Server,
    permission: "view_agents" as const,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    // permission: "manage_settings" as const,
  },
];

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, hasPermission } = useAuthStore();
  const { logout } = useLocalAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    navigate("/login");
  }

  const handleLogout = async () => {
    await logout();
  };

  const visibleNavItems = navigation.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  return (
    <header className="border-b bg-primary backdrop-blur sticky top-0 z-50 shadow-lg dark:bg-primary/80">
      <div className="flex h-14 items-center px-4 lg:px-6">
        <Link to="/" className="mr-3">
          {/* <div className="h-14 hidden sm:flex items-center">
            <img
              src={logo}
              alt="PowerBeacon"
              className="object-contain h-full"
              loading="lazy"
            />
          </div> */}
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
          className="md:hidden ml-auto mr-2"
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
                    <span className="text-xs text-primary font-medium mt-1 capitalize">
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
                {/* <DropdownMenuSeparator className="my-2" /> */}
                <DropdownMenuItem className="mt-1" asChild>
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
                      href="https://powerbeacon.github.io/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <BookOpen className="h-4 w-4" />
                      PowerBeacon Docs
                    </a>
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuItem className="mt-1" asChild>
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
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border">
          <nav className="flex flex-col p-4 space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-secondary"
                      : "text-muted hover:text-foreground hover:bg-secondary/50",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
            {user && (
              <div className="pt-4 mt-4 border-t border-border">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-accent-foreground text-accent text-xs">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground font-bold">
                      {user?.full_name}
                    </span>
                    <span className="text-xs text-muted">{user?.email}</span>
                  </div>
                </div>
                <ThemeToggle />

                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive mt-2"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
