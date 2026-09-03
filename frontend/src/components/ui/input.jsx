import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-sm border-0 bg-white px-3 py-2 text-[15px] text-ink ring-1 ring-hairline transition-[box-shadow,background-color] duration-200 placeholder:text-ink-muted-48 hover:ring-black/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-40 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[#c62828]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }