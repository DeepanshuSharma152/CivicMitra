import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn("flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[15px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
}

export { Input };
