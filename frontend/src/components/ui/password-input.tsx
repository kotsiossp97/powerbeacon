import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Copy, EyeIcon, EyeOffIcon } from "lucide-react";
import {
  useState,
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
  type ChangeEvent,
  useEffect,
  useDeferredValue,
  useMemo,
} from "react";
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { motion, AnimatePresence } from "motion/react";

const PasswordInputContext = createContext<{ password: string } | null>(null);

export function PasswordInput({
  children,
  onChange,
  value,
  defaultValue,
  showCopyButton = false,
  ...props
}: Omit<ComponentProps<typeof Input>, "type"> & {
  children?: ReactNode;
  showCopyButton?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState(defaultValue ?? "");
  const [copied, setCopied] = useState(false);

  const Icon = showPassword ? EyeOffIcon : EyeIcon;
  const currentValue = value ?? password;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    onChange?.(e);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PasswordInputContext value={{ password: currentValue.toString() }}>
      <div className="space-y-3">
        <InputGroup>
          <InputGroupInput
            {...props}
            value={value}
            defaultValue={defaultValue}
            type={showPassword ? "text" : "password"}
            onChange={handleChange}
          />

          <InputGroupAddon align="inline-end">
            <AnimatePresence>
              {showCopyButton && showPassword && (
                <motion.div exit={{opacity: 0}}>
                  <InputGroupButton size="sm" onClick={handleCopy}>
                    <span className="relative size-3.5">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: copied ? 0 : 1,
                          opacity: copied ? 0 : 1,
                          rotate: copied ? 90 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                        className=""
                      >
                        <Copy className="absolute inset-0" />
                      </motion.div>
                      <motion.div
                        initial={false}
                        animate={{
                          scale: copied ? 1 : 0,
                          opacity: copied ? 1 : 0,
                          rotate: copied ? 0 : -90,
                        }}
                        transition={{ duration: 0.2 }}
                        className=""
                      >
                        <Check className="absolute inset-0" />
                      </motion.div>
                    </span>
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </InputGroupButton>
                </motion.div>
              )}
            </AnimatePresence>
            <InputGroupButton
              size="icon-xs"
              onClick={() => setShowPassword((p) => !p)}
            >
              <Icon className="size-4.5" />
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {children}
      </div>
    </PasswordInputContext>
  );
}

export function PasswordInputStrengthChecker() {
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [errorLoadingOptions, setErrorLoadingOptions] = useState(false);

  const { password } = usePasswordInput();
  const deferredPassword = useDeferredValue(password);
  const strengthResult = useMemo(() => {
    if (!optionsLoaded || deferredPassword.length === 0) {
      return { score: 0, feedback: { warning: undefined } } as const;
    }

    return zxcvbn(deferredPassword);
  }, [optionsLoaded, deferredPassword]);

  useEffect(() => {
    Promise.all([
      import("@zxcvbn-ts/language-common"),
      import("@zxcvbn-ts/language-en"),
    ])
      .then(([common, english]) => {
        zxcvbnOptions.setOptions({
          translations: english.translations,
          graphs: common.adjacencyGraphs,
          maxLength: 50,
          dictionary: {
            ...common.dictionary,
            ...english.dictionary,
          },
        });
        setOptionsLoaded(true);
      })
      .catch(() => setErrorLoadingOptions(true));
  }, []);

  function getLabel() {
    if (deferredPassword.length === 0) return "Password strength";
    if (!optionsLoaded) return "Loading strength checker";

    const score = strengthResult.score;
    switch (score) {
      case 0:
      case 1:
        return "Very weak";
      case 2:
        return "Weak";
      case 3:
        return "Strong";
      case 4:
        return "Very strong";
      default:
        throw new Error(`Invalid score: ${score satisfies never}`);
    }
  }

  const label = getLabel();

  if (errorLoadingOptions) return null;

  return (
    <div className="space-y-0.5">
      <div
        role="progressbar"
        aria-label="Password Strength"
        aria-valuenow={strengthResult.score}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuetext={label}
        className="flex gap-1"
      >
        {Array.from({ length: 4 }).map((_, i) => {
          const color =
            strengthResult.score >= 3 ? "bg-primary" : "bg-destructive";

          return (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full",
                strengthResult.score > i ? color : "bg-secondary",
              )}
            />
          );
        })}
      </div>
      <div className="flex justify-end text-sm text-muted-foreground">
        {strengthResult.feedback.warning == null ? (
          label
        ) : (
          <Tooltip>
            <TooltipTrigger className="underline underline-offset-1" asChild>
              <span>{label}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-base">
              {strengthResult.feedback.warning}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

const usePasswordInput = () => {
  const context = useContext(PasswordInputContext);
  if (context == null) {
    throw new Error(
      "usePasswordInput must be used within a PasswordInputContext",
    );
  }
  return context;
};
