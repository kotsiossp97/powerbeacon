import { configApi } from "@/api/config";
import NumberInputGroup from "@/components/settings/NumberInputGroup";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";
import type { ServiceConfig } from "@/types";
import {
  Activity,
  CircleCheck,
  CircleX,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ServicesConfigCardProps {
  isSuperuser: boolean;
}

export const ServicesConfigCard = ({
  isSuperuser,
}: ServicesConfigCardProps) => {
  const [allConfigs, setAllConfigs] = useState<ServiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfigs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await configApi.getAllServiceConfigs();
        setAllConfigs(response.data);
      } catch (err) {
        console.log("🚀 ~ ServicesConfigCard ~ err:", err);
        const apiError = err as { response?: { data?: { detail?: string } } };
        setError(
          apiError.response?.data?.detail || "Failed to load service settings",
        );
      } finally {
        setLoading(false);
      }
    };

    loadConfigs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const deviceReachConfig = allConfigs.find(
    (c) => c.service_name === "device_reachability",
  );

  const handleUpdateServiceConfig = async (configData: ServiceConfig) => {
    try {
      const resp = await configApi.updateServiceConfig(configData);
      toast.success("Service configuration updated successfully");
      setAllConfigs((prevConfigs) =>
        prevConfigs.map((c) =>
          c.service_name === resp.data.service_name ? resp.data : c,
        ),
      );
    } catch (err) {
      console.log("🚀 ~ handleUpdateServiceConfig ~ err:", err);
      toast.error("Failed to update service configuration");
    }
  };

  return (
    <div className="space-y-2">
      {deviceReachConfig && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Device Reachability Service
                </CardTitle>
                <CardDescription>
                  Configure the service responsible for checking device
                  reachability and online status
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="p-4">
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <FieldDescription>
                    When enabled, the service will periodically check the
                    reachability of devices on the network and update their
                    online status accordingly.
                  </FieldDescription>
                  <Toggle
                    variant={"powerbeacon"}
                    pressed={deviceReachConfig?.config_data?.enabled as boolean}
                    disabled={!isSuperuser}
                    onPressedChange={() => {
                      handleUpdateServiceConfig({
                        ...deviceReachConfig,
                        config_data: {
                          ...deviceReachConfig?.config_data,
                          enabled: !deviceReachConfig?.config_data?.enabled,
                        },
                      });
                    }}
                  >
                    <CircleCheck className="group-data-[state=on]/toggle:inline hidden" />
                    <CircleX className="group-data-[state=off]/toggle:inline hidden" />
                    {deviceReachConfig?.config_data?.enabled
                      ? "Enabled"
                      : "Disabled"}
                  </Toggle>
                </Field>
              </Card>

              <Card className="p-4">
                <Field>
                  <FieldLabel>Update Resolved IP Addresses</FieldLabel>
                  <FieldDescription>
                    When enabled, the service will attempt to resolve and update
                    the IP addresses of devices that are reachable. This can
                    help in identifying devices on the network.
                  </FieldDescription>
                  <Toggle
                    variant={"powerbeacon"}
                    pressed={
                      deviceReachConfig?.config_data
                        ?.update_resolved_ip as boolean
                    }
                    disabled={!isSuperuser}
                    onPressedChange={() => {
                      handleUpdateServiceConfig({
                        ...deviceReachConfig,
                        config_data: {
                          ...deviceReachConfig?.config_data,
                          update_resolved_ip:
                            !deviceReachConfig?.config_data?.update_resolved_ip,
                        },
                      });
                    }}
                  >
                    <CircleCheck className="group-data-[state=on]/toggle:inline hidden" />
                    <CircleX className="group-data-[state=off]/toggle:inline hidden" />
                    {deviceReachConfig?.config_data?.update_resolved_ip
                      ? "Enabled"
                      : "Disabled"}
                  </Toggle>
                </Field>
              </Card>

              <Card className="p-4">
                <Field>
                  <FieldLabel>Check Interval</FieldLabel>
                  <FieldDescription>
                    The interval at which the service checks the reachability of
                    devices. A shorter interval means more frequent checks but
                    may increase network traffic.
                  </FieldDescription>
                  <NumberInputGroup
                    value={
                      (deviceReachConfig?.config_data
                        ?.interval_seconds as number) ?? 60
                    }
                    inputGroupAddons={"seconds"}
                    disabled={!isSuperuser}
                    onSave={(newInterval) => {
                      handleUpdateServiceConfig({
                        ...deviceReachConfig,
                        config_data: {
                          ...deviceReachConfig?.config_data,
                          interval_seconds: newInterval,
                        },
                      });
                    }}
                    max={3600}
                  />
                </Field>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
