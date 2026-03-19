/**
 * Onboarding page for creating the first superuser
 */
import logo from "@/assets/banner-900x300.png";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Server,
  Settings,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authApi } from "../api/auth";
import { setupApi } from "../api/setup";
import { useAuthStore } from "../auth/useAuth";
import type { OnboardingAdminFormData } from "../components/onboarding/admin-form";
import OnboardingAdminForm from "../components/onboarding/admin-form";
import OnboardingAgentInstructions from "../components/onboarding/deploy-agent-instructions";
import OnboardingInstanceConfiguration, {
  type OnboardingInstanceFormData,
} from "../components/onboarding/instance-configuration";
import { Progress } from "../components/ui/progress";
import { cn } from "../lib/utils";

const steps = [
  {
    id: 1,
    title: "Create Admin Account",
    description: "Set up your super-user administrator credentials",
    icon: User,
  },
  {
    id: 2,
    title: "Configure Instance",
    description: "Basic settings for your PowerBeacon instance",
    icon: Settings,
  },
  {
    id: 3,
    title: "Deploy Agent",
    description: "Install your first Wake-on-LAN agent",
    icon: Server,
  },
];

interface OnboardingState {
  currentStep: number;
  adminFormValues: Partial<OnboardingAdminFormData>;
  adminFormData?: OnboardingAdminFormData;
  instanceFormData: OnboardingInstanceFormData;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { checkSetup, loadCurrentUser } = useAuthStore();

  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    currentStep: 1,
    adminFormValues: {
      full_name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    adminFormData: undefined,
    instanceFormData: {
      enableOIDC: false,
      oidcServerMetadataUrl: "",
      oidcClientId: "",
      oidcClientSecret: "",
    },
  });

  const onAdminFormChange = useCallback(
    (data: Partial<OnboardingAdminFormData>) => {
      setOnboardingState((prev) => {
        const previous = prev.adminFormValues;
        const didChange =
          previous.full_name !== data.full_name ||
          previous.username !== data.username ||
          previous.email !== data.email ||
          previous.password !== data.password ||
          previous.confirmPassword !== data.confirmPassword;

        if (!didChange) {
          return prev;
        }

        return {
          ...prev,
          adminFormValues: data,
        };
      });
    },
    [],
  );

  const onAdminFormSuccess = useCallback(
    (data: OnboardingAdminFormData | undefined) => {
      setOnboardingState((prev) => {
        if (!data && !prev.adminFormData) {
          return prev;
        }

        if (
          data &&
          prev.adminFormData &&
          prev.adminFormData.full_name === data.full_name &&
          prev.adminFormData.username === data.username &&
          prev.adminFormData.email === data.email &&
          prev.adminFormData.password === data.password &&
          prev.adminFormData.confirmPassword === data.confirmPassword
        ) {
          return prev;
        }

        return {
          ...prev,
          adminFormData: data,
        };
      });
    },
    [],
  );

  const onInstanceFormChange = useCallback(
    (data: OnboardingInstanceFormData) => {
      setOnboardingState((prev) => {
        if (
          prev.instanceFormData.enableOIDC === data.enableOIDC &&
          prev.instanceFormData.oidcServerMetadataUrl ===
            data.oidcServerMetadataUrl &&
          prev.instanceFormData.oidcClientId === data.oidcClientId &&
          prev.instanceFormData.oidcClientSecret === data.oidcClientSecret
        ) {
          return prev;
        }

        return {
          ...prev,
          instanceFormData: data,
        };
      });
    },
    [],
  );

  const progress = (onboardingState.currentStep / steps.length) * 100;

  const handleOnboarding = async () => {
    setIsSubmitting(true);

    // Validations
    const adminFormData = onboardingState.adminFormData;
    if (!adminFormData) {
      setIsSubmitting(false);
      toast.error("Please complete the admin account form before proceeding.");
      return;
    }

    try {
      const setupPayload = {
        username: adminFormData.username,
        password: adminFormData.password,
        full_name: adminFormData.full_name?.trim() || undefined,
        email: adminFormData.email?.trim() || undefined,
        oidc: onboardingState.instanceFormData.enableOIDC
          ? {
              enabled: true,
              server_metadata_url:
                onboardingState.instanceFormData.oidcServerMetadataUrl.trim(),
              client_id: onboardingState.instanceFormData.oidcClientId.trim(),
              client_secret:
                onboardingState.instanceFormData.oidcClientSecret.trim(),
            }
          : {
              enabled: false,
              server_metadata_url:
                onboardingState.instanceFormData.oidcServerMetadataUrl.trim() ||
                undefined,
            },
      };

      // Create first superuser
      await setupApi.initialize(setupPayload);

      // Auto login after creation
      const response = await authApi.login(
        adminFormData.username,
        adminFormData.password,
      );

      // Store token
      localStorage.setItem("access_token", response.data.access_token);

      // Refresh auth state
      await checkSetup();
      await loadCurrentUser();

      // Redirect to main app
      navigate("/dashboard");
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      console.error("Onboarding error:", err);
      toast.error(error.response?.data?.detail || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (onboardingState.currentStep < steps.length) {
      setOnboardingState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    } else {
      // Complete onboarding
      await handleOnboarding();
    }
  };

  const handleBack = () => {
    if (onboardingState.currentStep > 1) {
      setOnboardingState((prev) => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  const canProceed = () => {
    switch (onboardingState.currentStep) {
      case 1:
        return !!onboardingState.adminFormData;
      case 2: {
        const {
          enableOIDC,
          oidcServerMetadataUrl,
          oidcClientId,
          oidcClientSecret,
        } = onboardingState.instanceFormData;

        if (!enableOIDC) {
          return true;
        }

        return Boolean(
          oidcServerMetadataUrl.trim() &&
          oidcClientId.trim() &&
          oidcClientSecret.trim(),
        );
      }
      case 3:
        return true; // No required fields for agent deployment
      default:
        return false;
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-primary to-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.5,
            type: "keyframes",
          }}
          className="flex items-center justify-center gap-3 mb-8 from-primary/20 to-primary/90 bg-radial from-50% border border-primary shadow-xl rounded-lg md:w-lg mx-auto backdrop-blur-3xl"
        >
            <img
              src={logo}
              alt="PowerBeacon Logo"
              className="h-24 sm:h-36 object-contain"
            />
        </motion.div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const isCompleted = onboardingState.currentStep > step.id;
              const isCurrent = onboardingState.currentStep === step.id;
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center",
                    index < steps.length - 1 && "flex-1",
                  )}
                >
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                        isCompleted
                          ? "bg-primary border-primary text-primary-foreground"
                          : isCurrent
                            ? "border-primary text-primary bg-background"
                            : "border-border text-muted-foreground bg-background",
                      )}
                      whileHover={{
                        scale: 1.15,
                      }}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </motion.div>
                    <span
                      className={cn(
                        "text-xs mt-2 font-medium hidden sm:block",
                        isCurrent ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-4",
                        isCompleted ? "bg-primary" : "bg-border",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-card-foreground">
              {steps[onboardingState.currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {steps[onboardingState.currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {onboardingState.currentStep === 1 && (
              <OnboardingAdminForm
                value={onboardingState.adminFormValues}
                onChange={onAdminFormChange}
                onSuccess={onAdminFormSuccess}
              />
            )}

            {onboardingState.currentStep === 2 && (
              <OnboardingInstanceConfiguration
                value={onboardingState.instanceFormData}
                onChange={onInstanceFormChange}
              />
            )}

            {onboardingState.currentStep === 3 && (
              <OnboardingAgentInstructions />
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={onboardingState.currentStep === 1 || isSubmitting}
                size={"lg"}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                size={"lg"}
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : onboardingState.currentStep === steps.length ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Complete Setup
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Button
            variant="link"
            className="px-0 h-auto text-primary hover:text-primary/80"
            onClick={() => navigate("/login", { replace: true })}
          >
            Sign in
          </Button>
        </p>
      </div>
    </main>
  );
}
