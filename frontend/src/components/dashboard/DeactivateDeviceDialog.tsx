import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Device } from "@/types";

interface DeactivateDeviceDialogProps {
  device: Device | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const DeactivateDeviceDialog = ({
  device,
  onOpenChange,
  onConfirm,
}: DeactivateDeviceDialogProps) => {
  return (
    <AlertDialog open={!!device} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Toggle Device Status</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to{" "}
            {device?.is_active ? "deactivate" : "activate"} &quot;{device?.name}
            &quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {device?.is_active ? "Deactivate" : "Activate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
