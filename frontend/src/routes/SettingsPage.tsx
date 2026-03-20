/**
 * Settings page
 */
import { configApi } from "@/api/config";
import { useAuthStore } from "@/auth/useAuth";
import {
  AboutPowerBeaconCard,
  OIDCConfigDialog,
  OIDCOverviewCard,
  oidcSchema,
  ProfileCard,
  type OIDCFormData,
} from "@/components/settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppMetadataStore } from "@/lib/useAppMetadata";
import type { OIDCConfig, OIDCConfigPublic } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Info,
  Loader2,
  Shield,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const settingsSections = [
  {
    id: "profile",
    title: "Profile",
    description: "Account identity and access role.",
    icon: UserRound,
  },
  {
    id: "authentication",
    title: "Authentication",
    description: "Single sign-on and OIDC behavior.",
    icon: Shield,
  },
  {
    id: "about",
    title: "About",
    description: "Version status, releases, and contributors.",
    icon: Info,
  },
];

export const SettingsPage = () => {
  const { user } = useAuthStore();
  const metadata = useAppMetadataStore((state) => state.metadata);
  const metadataError = useAppMetadataStore((state) => state.error);
  const metadataLoading = useAppMetadataStore((state) => state.loading);
  const loadAppMetadata = useAppMetadataStore((state) => state.loadMetadata);

  const [oidcConfig, setOidcConfig] = useState<OIDCConfigPublic | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(settingsSections[0].id);

  const isSuperuser = user?.role === "superuser";

  const form = useForm<OIDCFormData>({
    resolver: zodResolver(oidcSchema),
    defaultValues: {
      enabled: false,
      server_metadata_url: "",
      client_id: "",
      client_secret: "",
    },
  });

  const loadConfig = useCallback(async () => {
    setError(null);

    try {
      const response = await configApi.getOIDC();
      setOidcConfig(response.data);
      form.reset({
        enabled: response.data.enabled,
        server_metadata_url: response.data.server_metadata_url || "",
        client_id: response.data.client_id || "",
        client_secret: "",
      });
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      setError(
        apiError.response?.data?.detail || "Failed to load OIDC settings",
      );
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (!metadata) {
      void loadAppMetadata();
    }
  }, [loadAppMetadata, metadata]);

  const handleSave = async (data: OIDCFormData) => {
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const payload: OIDCConfig = {
        enabled: data.enabled,
        server_metadata_url: data.server_metadata_url?.trim() || undefined,
        client_id: data.client_id?.trim() || undefined,
        client_secret: data.client_secret?.trim() || undefined,
      };

      await configApi.updateOIDC(payload);
      setSuccess("OIDC configuration updated successfully");
      setIsConfigOpen(false);
      toast.success("Settings updated");
      await loadConfig();
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      setError(
        apiError.response?.data?.detail ||
          "Failed to update OIDC configuration",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenConfig = () => {
    setError(null);
    setSuccess(null);
    form.reset({
      enabled: oidcConfig?.enabled || false,
      server_metadata_url: oidcConfig?.server_metadata_url || "",
      client_id: oidcConfig?.client_id || "",
      client_secret: "",
    });
    setIsConfigOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure your PowerBeacon instance
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle>Configuration saved</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">
            Loading settings...
          </span>
        </div>
      ) : (
        <Tabs
          value={activeSection}
          onValueChange={setActiveSection}
          orientation="vertical"
          className="flex flex-col gap-6 lg:flex-row"
        >
          <Card className="overflow-hidden lg:w-[290px] h-fit p-0">
            <CardHeader className="border-b p-4 bg-muted/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle>Workspace Settings</CardTitle>
                </div>
                {metadata?.update_available ? (
                  <Badge>Update ready</Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-3">
              <TabsList
                variant="line"
                className="w-full items-stretch  gap-1 bg-transparent p-0"
              >
                {settingsSections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="min-h-20 flex-col items-start gap-1.5 rounded-xl px-3 py-3 text-left whitespace-normal"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-foreground">
                        <section.icon data-icon="inline-start" />
                        <span>{section.title}</span>
                      </span>
                      {section.id === "about" && metadata?.update_available ? (
                        <Badge variant="secondary">New</Badge>
                      ) : null}
                    </div>
                    <span className="text-left text-xs text-muted-foreground">
                      {section.description}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </CardContent>
          </Card>

          <div className="min-w-0 flex-1">
            <TabsContent value="profile" className="mt-0 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Profile
                </h2>
              </div>
              <ProfileCard user={user} />
            </TabsContent>

            <TabsContent
              value="authentication"
              className="mt-0 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Authentication
                </h2>
              </div>
              <OIDCOverviewCard
                config={oidcConfig}
                isSuperuser={isSuperuser}
                onConfigure={handleOpenConfig}
              />
            </TabsContent>

            <TabsContent value="about" className="mt-0 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    About
                  </h2>
                  {metadata?.update_available ? (
                    <Badge>v{metadata.latest_version?.replace(/^v/, "")}</Badge>
                  ) : null}
                </div>
              </div>
              <AboutPowerBeaconCard
                metadata={metadata}
                loading={metadataLoading}
                error={metadataError}
                onRefresh={() => loadAppMetadata(true)}
              />
            </TabsContent>
          </div>
        </Tabs>
      )}

      <OIDCConfigDialog
        open={isConfigOpen}
        form={form}
        saving={saving}
        onOpenChange={setIsConfigOpen}
        onSubmit={handleSave}
      />
    </div>
  );
};
