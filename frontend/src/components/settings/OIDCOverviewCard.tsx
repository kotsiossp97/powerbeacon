import { Lock, Settings as SettingsIcon, Shield } from "lucide-react";
import type { OIDCConfigPublic } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface OIDCOverviewCardProps {
  config: OIDCConfigPublic | null;
  isSuperuser: boolean;
  onConfigure: () => void;
}

export const OIDCOverviewCard = ({
  config,
  isSuperuser,
  onConfigure,
}: OIDCOverviewCardProps) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              OIDC Authentication
            </CardTitle>
            <CardDescription>
              Configure single sign-on with an external identity provider
            </CardDescription>
          </div>
          {isSuperuser && (
            <Button onClick={onConfigure} size="sm">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Configure
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between border border-border rounded-lg px-4 py-3 bg-muted/30">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge
            className={
              config?.enabled
                ? "bg-success/20 text-success border-success/30"
                : "bg-muted text-muted-foreground border-border"
            }
          >
            {config?.enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Server Metadata URL</p>
          <p className="text-sm font-mono break-all text-foreground">
            {config?.server_metadata_url || "Not set"}
          </p>
        </div>

        {config?.enabled ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Client ID</p>
              <p className="text-sm font-mono break-all text-foreground">
                {config.client_id || "Not set"}
              </p>
            </div>
          </div>
        ) : (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>OIDC is currently disabled</AlertTitle>
            <AlertDescription>
              Enable OIDC to allow users to sign in through your identity provider.
            </AlertDescription>
          </Alert>
        )}

        {!isSuperuser && (
          <p className="text-sm text-muted-foreground">
            Only superusers can modify authentication settings.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
