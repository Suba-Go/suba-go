import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "../../lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string
    showValuePoint?: boolean
  }
>(({ className, value, indicatorClassName, showValuePoint, ...props }, ref) => {
  const isTransformStrategy = !showValuePoint;

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full rounded-full bg-primary/20",
        !showValuePoint && "overflow-hidden",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all",
          showValuePoint && "w-auto flex-none relative rounded-full",
          indicatorClassName
        )}
        style={{ 
          transform: isTransformStrategy ? `translateX(-${100 - (value || 0)}%)` : undefined,
          width: !isTransformStrategy ? `${value || 0}%` : undefined
        }}
      >
        {showValuePoint && (
          <div 
            className={cn(
              "absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-white shadow-sm",
              indicatorClassName // Apply same color class as indicator
            )}
          />
        )}
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
