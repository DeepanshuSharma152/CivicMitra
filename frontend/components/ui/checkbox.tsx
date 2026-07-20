"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return <CheckboxPrimitive.Root data-slot="checkbox" className={cn("flex size-4 shrink-0 items-center justify-center rounded border border-slate-300 bg-white text-white outline-none transition-colors data-[checked]:border-emerald-700 data-[checked]:bg-emerald-700 focus-visible:ring-3 focus-visible:ring-emerald-100", className)} {...props}><CheckboxPrimitive.Indicator><Check className="size-3" strokeWidth={3} /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root>;
}

export { Checkbox };
