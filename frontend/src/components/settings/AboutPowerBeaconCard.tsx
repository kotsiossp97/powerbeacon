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
import { SiGithub } from "@icons-pack/react-simple-icons";
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
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
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
            onClick={() => void onRefresh()}
            disabled={loading}
          >
            <RefreshCw className={loading ? "animate-spin" : undefined} />
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
          <div className="border-border bg-muted/30 rounded-lg border px-4 py-3">
            <p className="text-muted-foreground text-sm">Current version</p>
            <p className="text-foreground mt-1 text-lg font-semibold">
              v{metadata?.current_version || "unknown"}
            </p>
          </div>
          <div className="border-border bg-muted/30 rounded-lg border px-4 py-3">
            <p className="text-muted-foreground text-sm">Latest release</p>
            <p className="text-foreground mt-1 text-lg font-semibold">
              {metadata?.latest_version
                ? `v${metadata.latest_version.replace(/^v/, "")}`
                : "Unavailable"}
            </p>
          </div>
          <div className="border-border bg-muted/30 rounded-lg border px-4 py-3">
            <p className="text-muted-foreground text-sm">Status</p>
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
              className="hover:bg-muted/50 hover:border-primary flex flex-col items-center rounded border p-3 transition-colors"
              href={
                metadata?.repo_url ||
                "https://github.com/kotsiossp97/powerbeacon"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <SiGithub className="text-primary mb-2" />
              <p className="text-muted-foreground text-sm">Repository</p>
            </a>
            <a
              className="hover:bg-muted/50 hover:border-primary flex flex-col items-center rounded border p-3 transition-colors"
              href={
                metadata?.repo_url
                  ? `${metadata?.repo_url}/issues`
                  : "https://github.com/kotsiossp97/powerbeacon/issues"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <Bug className="text-primary mb-2" />
              <p className="text-muted-foreground text-sm">Report Issue</p>
            </a>
            <a
              className="hover:bg-muted/50 hover:border-primary flex flex-col items-center rounded border p-3 transition-colors"
              href={
                metadata?.release_url ||
                `${metadata?.repo_url}/releases` ||
                "https://github.com/kotsiossp97/powerbeacon/releases"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="text-primary mb-2" />
              <p className="text-muted-foreground text-sm">Latest release</p>
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="text-primary" />
            Contributors
          </CardTitle>
          {metadata?.contributors.length ? (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {metadata.contributors.map((contributor) => (
                <a
                  key={contributor.login}
                  href={contributor.html_url || metadata.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border bg-background hover:bg-muted/50 flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors"
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
                    <p className="text-foreground truncate font-medium">
                      @{contributor.login || "unknown"}
                    </p>
                    <p className="text-muted-foreground text-sm">
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
        <p className="text-muted-foreground text-sm">
          Release information is fetched from the public GitHub repository and
          cached by the backend.
        </p>
      </CardFooter>
    </Card>
  );
};
