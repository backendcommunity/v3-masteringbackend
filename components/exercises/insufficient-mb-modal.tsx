"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InsufficientMbModalProps {
  open: boolean;
  shortfall: number;
  onClose: () => void;
}

export function InsufficientMbModal({
  open,
  shortfall,
  onClose,
}: InsufficientMbModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Not enough MB</DialogTitle>
          <DialogDescription>
            You need {shortfall} more MB to unlock this hint.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
