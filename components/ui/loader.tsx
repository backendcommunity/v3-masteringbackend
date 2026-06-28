// components/RingLoader.tsx

import { ReactNode } from "react";
import { BrandLogo } from "../brand-logo";
import { Skeleton } from "./skeleton";

export const Loader = ({
  isLoader = true,
  isFull = true,
  size = "w-28 h-28",
  color = "border-primary",
  thickness = "border-4",
  label,
}: {
  isLoader?: boolean;
  size?: string;
  color?: string;
  isFull?: boolean;
  thickness?: string;
  // Optional progress content rendered beneath the ring (e.g. staged boot
  // status). Backward-compatible — omit it and the loader is unchanged.
  label?: ReactNode;
}) => {
  return (
    <div>
      {isLoader && (
        <div
          className={`flex flex-col gap-5 justify-center items-center ${
            isFull ? "h-screen" : ""
          }`}
        >
          <div className={`relative ${isFull ? "w-28 h-28" : "w-12 h-12"}`}>
            {/* Spinning Ring */}
            <div
              className={`${thickness} ${color} absolute inset-0  border-t-transparent rounded-full animate-spin`}
            />

            {/* Centered Logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <BrandLogo size="sm" showText={false} variant="default" />
            </div>
          </div>

          {label && (
            <div role="status" aria-live="polite" className="text-center">
              {label}
            </div>
          )}
        </div>
      )}

      {!isLoader && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-4 p-4 border rounded-lg shadow-sm animate-pulse"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
