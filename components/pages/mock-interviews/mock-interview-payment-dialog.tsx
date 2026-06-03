import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Lock, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

interface InterviewAccess {
  tier: "free" | "pro" | "enterprise";
  hasAccess: boolean;
  maxSessions: number;
  usedSessions: number;
  remainingSessions: number;
  allowedDurations: number[];
  message?: string;
}

interface PaymentDialogProps {
  onClose: () => void;
  open: boolean;
  onNavigate: (url: string) => void;
}

export function MockInterviewPaymentDialog({
  open,
  onClose,
  onNavigate,
}: PaymentDialogProps) {
  const store = useAppStore();
  const [interviewAccess, setInterviewAccess] =
    useState<InterviewAccess | null>(null);

  const loadInterviewAccess = async () => {
    try {
      const data = await store.getInterviewAccess();
      setInterviewAccess(data);
    } catch (error) {
      console.error("Failed to load interview access");
    }
  };

  useEffect(() => {
    if (open) {
      loadInterviewAccess();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Upgrade Required
          </DialogTitle>
          <DialogDescription>
            {interviewAccess?.tier === "free"
              ? "You've used your free trial interview. Upgrade to unlock more sessions."
              : "You've reached your monthly session limit. Upgrade for more access."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Card className="border-primary">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">Pro Plan</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>4 mock interviews per month</li>
                <li>15 &amp; 30 minute sessions</li>
                <li>AI-powered feedback &amp; reports</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">Enterprise Plan</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Unlimited mock interviews</li>
                <li>15, 30, 45 &amp; 60 minute sessions</li>
                <li>Full access to all features</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onNavigate("/subscription/plans")}>
            <Crown className="h-4 w-4 mr-2" />
            View Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
