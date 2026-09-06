import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-sm border-0 bg-void/60 px-3 py-2 text-sm text-ink ring-1 ring-hairline transition-[box-shadow,background-color] duration-200 placeholder:text-muted hover:ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-quantum focus-visible:ring-offset-0 focus-visible:ring-offset-void disabled:cursor-not-allowed disabled:opacity-40 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-warn",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }