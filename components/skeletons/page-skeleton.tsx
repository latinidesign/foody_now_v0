import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface PageSkeletonProps {
  subtitle?: boolean
  action?: boolean
  layout?: "grid" | "list"
  itemCount?: number
  columns?: string
  cardLineCount?: number
  showCardImage?: boolean
}

interface PageHeaderSkeletonProps {
  subtitle?: boolean
  action?: boolean
}

export function PageHeaderSkeleton({ subtitle = true, action = true }: PageHeaderSkeletonProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-3">
        <Skeleton className="h-10 w-64 max-w-full" />
        {subtitle && <Skeleton className="h-4 w-44 max-w-full" />}
      </div>
      {action && (
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-20" />
        </div>
      )}
    </div>
  )
}

interface CardSkeletonProps {
  showImage?: boolean
  lineCount?: number
}

export function CardSkeleton({ showImage = true, lineCount = 3 }: CardSkeletonProps) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-border bg-card/70 p-6 shadow-sm">
      <div className="space-y-5">
        {showImage && <Skeleton className="h-44 w-full" />}
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: lineCount }).map((_, index) => (
            <Skeleton
              key={index}
              variant="text"
              className={cn("w-full", index === lineCount - 1 ? "w-5/6" : "w-full")}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-16" />
        </div>
      </div>
    </article>
  )
}

interface CardListSkeletonProps {
  count?: number
  columns?: string
  showImage?: boolean
  lineCount?: number
}

export function CardListSkeleton({
  count = 6,
  columns = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  showImage = true,
  lineCount = 3,
}: CardListSkeletonProps) {
  return (
    <div className={cn("grid gap-4", columns)}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} showImage={showImage} lineCount={lineCount} />
      ))}
    </div>
  )
}

interface ListSkeletonProps {
  rows?: number
}

export function ListSkeleton({ rows = 5 }: ListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex flex-col gap-4 rounded-[1.75rem] border border-border bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton variant="text" className="w-36" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton({
  subtitle = true,
  action = true,
  layout = "grid",
  itemCount = 6,
  columns = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  cardLineCount = 3,
  showCardImage = true,
}: PageSkeletonProps) {
  return (
    <div className="space-y-10 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeaderSkeleton subtitle={subtitle} action={action} />
      {layout === "list" ? (
        <ListSkeleton rows={itemCount} />
      ) : (
        <CardListSkeleton
          count={itemCount}
          columns={columns}
          showImage={showCardImage}
          lineCount={cardLineCount}
        />
      )}
    </div>
  )
}
