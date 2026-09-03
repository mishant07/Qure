import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

/* DESIGN.md: pill radius is the brand action signal; 600 mid-weight; one shadow only on product imagery */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-semibold transition-[transform,background-color,opacity] duration-200 active:scale-[0.95] disabled:pointer-events-none disabled:opacity-40 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-focus",
        secondary:
          "bg-canvas text-primary ring-1 ring-hairline hover:bg-pearl",
        "outline-light":
          "bg-transparent text-white ring-1 ring-white/40 hover:bg-white/10",
        ghost: "bg-transparent text-primary hover:bg-primary/5",
        dark: "bg-ink text-white hover:bg-ink-muted-80",
        pearl: "bg-pearl text-ink-muted-80 ring-1 ring-divider-soft hover:bg-canvas",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        md: "px-[22px] py-[10px] text-[15px] min-h-[44px]",
        lg: "px-7 py-3.5 text-[17px] min-h-[48px]",
        sm: "px-4 py-1.5 text-[13px] min-h-[32px]",
        icon: "size-11",
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