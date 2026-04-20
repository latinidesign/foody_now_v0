import * as React from "react"

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rect" | "text" | "circle"
}

const variantStyles: Record<NonNullable<SkeletonProps["variant"]>, string> = {
  rect: "h-full w-full rounded-2xl",
  text: "h-4 rounded-full",
  circle: "h-10 w-10 rounded-full",
}

export function Skeleton({ className, variant = "rect", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-slate-200/80 dark:bg-slate-700/60",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
