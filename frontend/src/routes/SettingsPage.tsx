/**
 * Settings page
 */
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/auth/useAuth";
import { configApi } from "@/api/config";
import type { OIDCConfig, OIDCConfigPublic } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  OIDCConfigDialog,
  OIDCOverviewCard,
  oidcSchema,
  ProfileCard,
  type OIDCFormData,
} from "@/components/settings";

export const SettingsPage = () => {
  const { user } = useAuthStore();

  const [oidcConfig, setOidcConfig] = useState<OIDCConfigPublic | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      setError(apiError.response?.data?.detail || "Failed to load OIDC settings");
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

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
      setError(apiError.response?.data?.detail || "Failed to update OIDC configuration");
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and system configuration
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
          <span className="ml-3 text-muted-foreground">Loading settings...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProfileCard user={user} />
          <OIDCOverviewCard
            config={oidcConfig}
            isSuperuser={isSuperuser}
            onConfigure={handleOpenConfig}
          />
        </div>
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
