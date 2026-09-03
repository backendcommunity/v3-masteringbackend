"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        // No motion classes at all: no `slide-in-from-*`, no `zoom-*`, no
        // `animate-in`/`fade-*`. This opens like a plain select menu — the panel
        // appears anchored under its trigger, nothing slides, scales or fades.
        // The slide a user reported came from `* { transition: transform }` in
        // app/globals.css tweening Radix's positioning step; see the
        // [data-radix-popper-content-wrapper] rule at the bottom of that file.
        // If this file is regenerated with the shadcn CLI, strip motion again.
        "z-50 w-1/3 rounded-md border overflow-y-auto bg-popover p-4 text-popover-foreground shadow-md outline-none",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
