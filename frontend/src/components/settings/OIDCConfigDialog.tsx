import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Toggle } from "@/components/ui/toggle";
import { Loader2, TriangleAlert } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { OIDCFormData } from "./oidcForm";

interface OIDCConfigDialogProps {
  open: boolean;
  form: UseFormReturn<OIDCFormData>;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OIDCFormData) => void;
}

export const OIDCConfigDialog = ({
  open,
  form,
  saving,
  onOpenChange,
  onSubmit,
}: OIDCConfigDialogProps) => {
  const isEnabled = form.watch("enabled");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl pb-0">
        <DialogHeader>
          <DialogTitle>Configure OIDC</DialogTitle>
          <DialogDescription>
            Update your OpenID Connect provider and client credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="-mx-4 no-scrollbar max-h-[80svh] overflow-y-auto px-4">
            <FieldGroup>
              <Field>
                <FieldLabel>OIDC Status</FieldLabel>
                <FieldContent>
                  <div className="flex items-center gap-3">
                    <Toggle
                      pressed={isEnabled}
                      onPressedChange={(pressed) =>
                        form.setValue("enabled", pressed)
                      }
                      variant="outline"
                      className="min-w-20"
                    >
                      {isEnabled ? "Enabled" : "Disabled"}
                    </Toggle>
                    <span className="text-sm text-muted-foreground">
                      Toggle to enable or disable OIDC login
                    </span>
                  </div>
                </FieldContent>
              </Field>

              <Field
                data-invalid={
                  !!form.formState.errors.server_metadata_url || undefined
                }
              >
                <FieldLabel>Server Metadata URL</FieldLabel>
                <FieldContent>
                  <Input
                    {...form.register("server_metadata_url")}
                    placeholder="https://provider/.well-known/openid-configuration"
                    aria-invalid={!!form.formState.errors.server_metadata_url}
                  />
                </FieldContent>
                <FieldError>
                  {form.formState.errors.server_metadata_url?.message}
                </FieldError>
              </Field>

              <Field
                data-invalid={!!form.formState.errors.client_id || undefined}
              >
                <FieldLabel>Client ID</FieldLabel>
                <FieldContent>
                  <Input
                    {...form.register("client_id")}
                    placeholder="powerbeacon-web"
                    aria-invalid={!!form.formState.errors.client_id}
                    disabled={!isEnabled}
                  />
                </FieldContent>
                <FieldError>
                  {form.formState.errors.client_id?.message}
                </FieldError>
              </Field>

              <Field
                data-invalid={
                  !!form.formState.errors.client_secret || undefined
                }
              >
                <FieldLabel>Client Secret</FieldLabel>
                <FieldContent>
                  <PasswordInput
                    placeholder="Leave empty to keep current secret"
                    aria-invalid={!!form.formState.errors.client_secret}
                    disabled={!isEnabled}
                    {...form.register("client_secret")}
                  />
                </FieldContent>
                <FieldDescription>
                  Leave empty if you want to keep the existing secret.
                </FieldDescription>
                <FieldError>
                  {form.formState.errors.client_secret?.message}
                </FieldError>
              </Field>
            </FieldGroup>

            <Alert>
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Configuration persistence</AlertTitle>
              <AlertDescription>
                These changes may require matching environment updates for
                persistent deployments.
              </AlertDescription>
            </Alert>

            <DialogFooter className="mb-0 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Configuration
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
