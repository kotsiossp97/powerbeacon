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
import type { Cluster } from "@/types";

interface DeleteClusterDialogProps {
  cluster: Cluster | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const DeleteClusterDialog = ({
  cluster,
  onOpenChange,
  onConfirm,
}: DeleteClusterDialogProps) => {
  return (
    <AlertDialog open={!!cluster} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Cluster</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{cluster?.name}&quot;? Devices and agents will stay in the system, but they will be detached from this cluster.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};