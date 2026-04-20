import { PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton
      subtitle
      action
      layout="grid"
      itemCount={6}
      columns="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
      cardLineCount={3}
      showCardImage
    />
  )
}