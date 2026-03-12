import { User as UserIcon } from "lucide-react";
import type { User } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProfileCardProps {
  user?: User | null;
}

export const ProfileCard = ({ user }: ProfileCardProps) => {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-primary" />
          User Profile
        </CardTitle>
        <CardDescription>Your account information and access role</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Username</p>
          <p className="font-medium text-foreground">{user?.username}</p>
        </div>

        {user?.email && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium text-foreground break-all">{user.email}</p>
          </div>
        )}

        {user?.full_name && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium text-foreground">{user.full_name}</p>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Role</p>
          <Badge className="bg-primary/20 text-primary border-primary/30 capitalize">
            {user?.role || "unknown"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
