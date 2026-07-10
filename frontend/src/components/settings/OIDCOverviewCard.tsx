import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OIDCConfigPublic } from "@/types";
import { Lock, Settings as SettingsIcon, Shield } from "lucide-react";

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
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Shield className="text-primary" />
          OIDC Authentication
        </CardTitle>
        <CardDescription>
          Configure single sign-on with an external identity provider
        </CardDescription>
        {isSuperuser && (
          <CardAction>
            <Button onClick={onConfigure}>
              <SettingsIcon />
              Configure
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-border bg-muted/30 flex items-center justify-between rounded-lg border px-4 py-3">
          <span className="text-muted-foreground text-sm">Status</span>
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
          <p className="text-muted-foreground text-sm">Server Metadata URL</p>
          <p className="text-foreground font-mono text-sm break-all">
            {config?.server_metadata_url || "Not set"}
          </p>
        </div>

        {config?.enabled ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Client ID</p>
              <p className="text-foreground font-mono text-sm break-all">
                {config.client_id || "Not set"}
              </p>
            </div>
          </div>
        ) : (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>OIDC is currently disabled</AlertTitle>
            <AlertDescription>
              Enable OIDC to allow users to sign in through your identity
              provider.
            </AlertDescription>
          </Alert>
        )}

        {!isSuperuser && (
          <p className="text-muted-foreground text-sm">
            Only superusers can modify authentication settings.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
