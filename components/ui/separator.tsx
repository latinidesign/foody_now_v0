import * as React from "react"

import { cn } from "@/lib/utils"

type Orientation = "horizontal" | "vertical"

type SeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: Orientation
}

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorProps) {
  const isVertical = orientation === "vertical"

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        isVertical ? "h-full w-px" : "h-px w-full",
        className
      )}
      {...props}
    />
  )
}
