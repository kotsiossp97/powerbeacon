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
          className="border-border border-t md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <nav className="flex flex-col space-y-1 p-4">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-card"
                      : "text-muted dark:text-muted-foreground hover:text-foreground hover:bg-card/50",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
            {user && (
              <div className="border-border mt-4 border-t pt-4">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-accent-foreground text-accent text-xs">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">
                      {user?.full_name}
                    </span>
                    <span className="text-xs text-slate-200">
                      {user?.email}
                    </span>
                    <span className="mt-1 w-fit rounded-lg border border-white bg-white/20 px-2 py-0.5 text-xs font-semibold text-white capitalize">
                      {user?.role}
                    </span>
                  </div>
                </div>
                <ThemeToggle className="my-3 w-full" />
                <Separator className="my-4" />
                <Button
                  className="bg-destructive hover:bg-destructive/90 w-full text-white"
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
