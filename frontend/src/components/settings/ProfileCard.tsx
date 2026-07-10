import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { User } from "@/types";
import { User as UserIcon } from "lucide-react";

interface ProfileCardProps {
  user?: User | null;
}

export const ProfileCard = ({ user }: ProfileCardProps) => {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="text-primary h-5 w-5" />
          User Profile
        </CardTitle>
        <CardDescription>
          Your account information and access role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Username</p>
          <p className="text-foreground font-medium">{user?.username}</p>
        </div>

        {user?.email && (
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">Email</p>
            <p className="text-foreground font-medium break-all">
              {user.email}
            </p>
          </div>
        )}

        {user?.full_name && (
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">Full Name</p>
            <p className="text-foreground font-medium">{user.full_name}</p>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Role</p>
          <Badge className="bg-primary/20 text-primary border-primary/30 capitalize">
            {user?.role || "unknown"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
