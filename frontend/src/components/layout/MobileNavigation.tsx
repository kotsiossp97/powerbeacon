import { useLocalAuth } from "@/auth/localAuth";
import { useAuthStore } from "@/auth/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getUserInitials } from "@/components/users";
import { cn } from "@/lib/utils";
import { useVisibleNavigationLinks } from "@/routes/navlinks";
import { LogOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { Link, useLocation } from "react-router";

interface MobileNavigationProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { logout } = useLocalAuth();
  const visibleNavItems = useVisibleNavigationLinks();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AnimatePresence mode="wait" initial={false} custom={mobileMenuOpen}>
      {mobileMenuOpen && (
        <motion.div
          className="md:hidden border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
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
                      ? "bg-card"
                      : "text-muted dark:text-muted-foreground hover:text-foreground hover:bg-card/50",
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
                    <span className="text-sm text-white font-bold">
                      {user?.full_name}
                    </span>
                    <span className="text-xs text-slate-200">
                      {user?.email}
                    </span>
                    <span className="text-xs bg-white/20 w-fit px-2 py-0.5 rounded-lg border border-white text-white font-semibold mt-1 capitalize">
                      {user?.role}
                    </span>
                  </div>
                </div>
                <ThemeToggle className="w-full my-3" />
                <Separator className="my-4" />
                <Button
                  className="w-full bg-destructive text-white hover:bg-destructive/90"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            )}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileNavigation;
