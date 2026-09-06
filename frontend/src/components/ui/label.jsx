import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "../../lib/utils"

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-caption-strong adaptive-text select-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quantum",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }