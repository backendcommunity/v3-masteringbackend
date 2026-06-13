"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Play, 
  BookOpen, 
  Code 
} from "lucide-react";
import { Video } from "@/lib/data";

interface NextContentOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  nextItem: Video | null | undefined;
  onContinue: () => void;
}

export function NextContentOverlay({
  isOpen,
  onClose,
  nextItem,
  onContinue,
}: NextContentOverlayProps) {
  const [autoRedirectCount, setAutoRedirectCount] = useState(3);

  useEffect(() => {
    if (!isOpen || !nextItem) return;

    // Auto-redirect timer
    const timer = setInterval(() => {
      setAutoRedirectCount((prev) => {
        if (prev <= 1) {
          onContinue();
          onClose();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      setAutoRedirectCount(3);
    };
  }, [isOpen, nextItem, onContinue, onClose]);

  if (!nextItem) return null;

  const getIcon = () => {
    switch (nextItem?.type?.toLowerCase()) {
      case "video":
        return <Play className="w-12 h-12 text-primary" />;
      case "quiz":
        return <CheckCircle2 className="w-12 h-12 text-orange-500" />;
      case "exercise":
        return <Code className="w-12 h-12 text-green-500" />;
      case "article":
        return <BookOpen className="w-12 h-12 text-purple-500" />;
      default:
        return <Play className="w-12 h-12 text-primary" />;
    }
  };

  const getTypeLabel = () => {
    const type = nextItem?.type?.toLowerCase() || "content";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-center">Great Progress! 🎉</DialogTitle>

        <div className="flex flex-col items-center gap-4 py-6">
          {/* Icon */}
          <div className="flex justify-center">{getIcon()}</div>

          {/* Next Item Info */}
          <div className="text-center space-y-2 w-full">
            <p className="text-sm text-muted-foreground">
              Next {getTypeLabel()}
            </p>
            <h3 className="text-xl font-semibold">{nextItem?.title}</h3>
            {nextItem?.description && (
              <p className="text-sm text-muted-foreground">
                {nextItem.description}
              </p>
            )}
          </div>

          {/* Auto-redirect info */}
          <div className="text-center space-y-2 w-full bg-muted p-3 rounded">
            <p className="text-xs text-muted-foreground">
              Continuing in {autoRedirectCount} seconds...
            </p>
            <div className="flex gap-2">
              <Button
                onClick={onContinue}
                className="flex-1"
                size="sm"
              >
                Continue Now
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
              >
                Skip
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
