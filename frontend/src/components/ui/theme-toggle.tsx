import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme-provider";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { type ComponentProps } from "react";
import { cn } from "../../lib/utils";

export const ThemeToggle: React.FC<
  Omit<
    ComponentProps<typeof ToggleGroup>,
    "type" | "value" | "defaultValue" | "onValueChange"
  >
> = ({ className, ...props }) => {
  const { setTheme, theme } = useTheme();

  return (
    <ToggleGroup
      type="single"
      defaultValue="system"
      value={theme}
      onValueChange={(val) => val && setTheme(val as Theme)}
      className={cn("p-0", className)}
      variant={"outline"}
      size={"lg"}
      {...props}
    >
      <ToggleGroupItem value="light" className="grow">
        <Sun className="h-[1.2rem] w-[1.2rem]" /> Light
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" className="grow">
        <Moon className="h-[1.2rem] w-[1.2rem]" /> Dark
      </ToggleGroupItem>
      <ToggleGroupItem value="system" className="grow">
        <Monitor className="h-[1.2rem] w-[1.2rem]  " /> System
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
