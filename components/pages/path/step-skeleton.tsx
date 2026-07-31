import { Skeleton } from "@/components/ui/skeleton";

export function StepSkeleton() {
  return (
    <div data-testid="step-skeleton" className="space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
