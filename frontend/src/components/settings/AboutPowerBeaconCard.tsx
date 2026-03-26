import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AppMetadata } from "@/types";
import { SiGithub } from '@icons-pack/react-simple-icons';
import {
  AlertCircle,
  Bug,
  Download,
  GitBranch,
  Globe,
  RefreshCw,
  Users,
} from "lucide-react";
import { DateTime } from "luxon";
interface AboutPowerBeaconCardProps {
  metadata: AppMetadata | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

const getContributorInitials = (login?: string) =>
  login?.slice(0, 2).toUpperCase() || "PB";

const formatCheckedAt = (value?: string) => {
  if (!value) {
    return null;
  }

  const checkedAt = DateTime.fromISO(value);
  if (!checkedAt.isValid) {
    return null;
  }

  const checkedAtRelative = checkedAt.toRelative();
  return checkedAtRelative;
};

export const AboutPowerBeaconCard = ({
  metadata,
  loading,
  error,
  onRefresh,
}: AboutPowerBeaconCardProps) => {
  const checkedAtLabel = formatCheckedAt(metadata?.checked_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitBranch className="text-primary" />
          Version Information
        </CardTitle>
        <CardDescription>
          {checkedAtLabel
            ? `Last checked ${checkedAtLabel}.`
            : "Release status not checked yet."}
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void onRefresh()}
            disabled={loading}
          >
            <RefreshCw
              data-icon="inline-start"
              className={loading ? "animate-spin" : undefined}
            />
            Refresh
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Metadata unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">Current version</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              v{metadata?.current_version || "unknown"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">Latest release</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {metadata?.latest_version
                ? `v${metadata.latest_version.replace(/^v/, "")}`
                : "Unavailable"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant={metadata?.update_available ? "default" : "secondary"}
              >
                {metadata?.update_available ? "Update available" : "Up to date"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="text-primary" />
            Links
          </CardTitle>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              className="flex flex-col items-center border rounded p-3 transition-colors hover:bg-muted/50 hover:border-primary"
              href={
                metadata?.repo_url ||
                "https://github.com/kotsiossp97/powerbeacon"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <SiGithub className="mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Repository</p>
            </a>
            <a
              className="flex flex-col items-center border rounded p-3 transition-colors hover:bg-muted/50 hover:border-primary"
              href={
                metadata?.repo_url
                  ? `${metadata?.repo_url}/issues`
                  : "https://github.com/kotsiossp97/powerbeacon/issues"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <Bug className="mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Report Issue</p>
            </a>
            <a
              className="flex flex-col items-center border rounded p-3 transition-colors hover:bg-muted/50 hover:border-primary"
              href={
                metadata?.release_url ||
                `${metadata?.repo_url}/releases` ||
                "https://github.com/kotsiossp97/powerbeacon/releases"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Latest release</p>
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="text-primary" />
            Contributors
          </CardTitle>
          {metadata?.contributors.length ? (
            <div className="grid gap-3 grid-cols-2 xl:grid-cols-3">
              {metadata.contributors.map((contributor) => (
                <a
                  key={contributor.login}
                  href={contributor.html_url || metadata.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 transition-colors hover:bg-muted/50"
                >
                  <Avatar>
                    <AvatarImage
                      src={contributor.avatar_url}
                      alt={contributor.login || "Contributor avatar"}
                    />
                    <AvatarFallback>
                      {getContributorInitials(contributor.login)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      @{contributor.login || "unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {contributor.contributions} contribution
                      {contributor.contributions === 1 ? "" : "s"}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertTitle>No contributor data</AlertTitle>
              <AlertDescription>
                GitHub contributor data could not be loaded for this instance.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Release information is fetched from the public GitHub repository and
          cached by the backend.
        </p>
      </CardFooter>
    </Card>
  );
};
