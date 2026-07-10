import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Device } from "@/types";
import { DateTime } from "luxon";

interface OnlinePillProps {
  device: Device;
}

const formatLastChecked = (value?: string) => {
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

export const OnlinePill = ({ device }: OnlinePillProps) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge
          variant="outline"
          className={
            device.is_online
              ? "border-green-500 text-green-500"
              : "border-muted-foreground text-muted-foreground"
          }
        >
          <span
            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${device.is_online ? "bg-green-500" : "bg-muted-foreground"}`}
          />
          {device.is_online ? "Online" : "Offline"}
        </Badge>
        <TooltipContent className="capitalize">
          {device.is_online
            ? `Last checked: ${formatLastChecked(device.last_reachability_check_at) || "N/A"}`
            : `Last online: ${formatLastChecked(device.last_online_at) || "N/A"}`}
        </TooltipContent>
      </TooltipTrigger>
    </Tooltip>
  );
};
