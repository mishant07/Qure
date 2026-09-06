import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

/* Pill radius = brand action signal; 500 weight; quantum teal focus ring */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-medium transition-[background-color,opacity] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quantum [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-quantum text-void hover:bg-quantum-dim",
        secondary: "bg-classical text-quantum hover:bg-classical-muted",
        outline: "bg-transparent text-ink ring-1 ring-hairline hover:bg-glass",
        ghost: "bg-transparent text-quantum hover:bg-quantum/5",
        link: "text-quantum underline-offset-4 hover:underline rounded-none",
      },
      size: {
        md: "px-5 py-2.5 text-sm min-h-[40px]",
        lg: "px-6 py-3 text-base min-h-[44px]",
        sm: "px-3 py-1.5 text-xs min-h-[32px]",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = "Button"

export { Button, buttonVariants }