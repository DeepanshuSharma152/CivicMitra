import * as React from "react";

import { cn } from "@/lib/utils";

function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert" role="alert" className={cn("relative w-full rounded-md border px-3 py-2 text-sm", className)} {...props} />;
}

export { Alert };
