import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  title?: string;
  description?: string;
  /** Label for the confirm button. Defaults to "Bestätigen". */
  confirmLabel?: string;
  /** Variant for the confirm button. Defaults to "destructive". */
  confirmVariant?: "destructive" | "default" | "outline" | "secondary" | "ghost";
  /** When true, shows a spinner and disables both buttons. */
  loading?: boolean;
  onConfirm: () => void;
  trigger?: React.ReactNode;
};

export function ConfirmModal({
  title = "Bist du sicher?",
  description,
  confirmLabel = "Bestätigen",
  confirmVariant = "destructive",
  loading = false,
  onConfirm,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    // Let the caller close the dialog via loading → done cycle,
    // or close immediately if no loading state is used.
    if (!loading) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
