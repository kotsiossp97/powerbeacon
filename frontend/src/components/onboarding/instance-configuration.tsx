import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Toggle } from "@/components/ui/toggle";
import { CircleCheck, XCircle } from "lucide-react";
import React from "react";
import { ThemeToggle } from "../ui/theme-toggle";

export interface OnboardingInstanceFormData {
  enableOIDC: boolean;
  oidcServerMetadataUrl: string;
  oidcClientId: string;
  oidcClientSecret: string;
}

interface OnboardingInstanceConfigurationProps {
  value: OnboardingInstanceFormData;
  onChange: (value: OnboardingInstanceFormData) => void;
}

const OnboardingInstanceConfiguration: React.FC<
  OnboardingInstanceConfigurationProps
> = ({ value, onChange }) => {
  const showOIDCFields = value.enableOIDC;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md border p-3">
        <Label htmlFor="enable-oidc">Enable OIDC Authentication</Label>
        <Toggle
          id="enable-oidc"
          pressed={value.enableOIDC}
          onPressedChange={(pressed) =>
            onChange({
              ...value,
              enableOIDC: pressed,
            })
          }
          variant={"outline"}
          className="items-center data-[state=on]:bg-success/50 data-[state=on]:border-success bg-destructive/50 border-destructive
          hover:bg-destructive/70 data-[state=on]:hover:bg-success/70
          "
        >
          {value.enableOIDC ? (
            <>
              <CircleCheck /> Enabled
            </>
          ) : (
            <>
              <XCircle /> Disabled
            </>
          )}
        </Toggle>
      </div>

      <div className="space-y-2">
        <Label htmlFor="oidc-server-metadata-url">OIDC Server Metadata URL</Label>
        <div className="mx-20">
          <Input
            id="oidc-server-metadata-url"
            type="url"
            placeholder="https://provider/.well-known/openid-configuration"
            value={value.oidcServerMetadataUrl}
            onChange={(event) =>
              onChange({
                ...value,
                oidcServerMetadataUrl: event.target.value,
              })
            }
            required={showOIDCFields}
            aria-required={showOIDCFields}
            disabled={!showOIDCFields}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="oidc-client-id">OIDC Client ID</Label>
        <div className="mx-20">
          <Input
            id="oidc-client-id"
            type="text"
            placeholder="Enter your OIDC Client ID"
            value={value.oidcClientId}
            onChange={(event) =>
              onChange({
                ...value,
                oidcClientId: event.target.value,
              })
            }
            required={showOIDCFields}
            aria-required={showOIDCFields}
            disabled={!showOIDCFields}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="oidc-client-secret">OIDC Client Secret</Label>
        <div className="mx-20">
          <PasswordInput
            id="oidc-client-secret"
            placeholder="Enter your OIDC Client Secret"
            autoComplete="off"
            value={value.oidcClientSecret}
            onChange={(event) =>
              onChange({
                ...value,
                oidcClientSecret: event.target.value,
              })
            }
            showCopyButton
            required={showOIDCFields}
            aria-required={showOIDCFields}
            disabled={!showOIDCFields}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Theme</Label>
        <div className="mx-20">
          <ThemeToggle className="w-full" />
        </div>
      </div>
    </div>
  );
};

export default OnboardingInstanceConfiguration;
