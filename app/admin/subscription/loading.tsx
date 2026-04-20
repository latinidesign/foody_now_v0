import { PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton
      subtitle={false}
      action
      layout="grid"
      itemCount={3}
      columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      cardLineCount={3}
      showCardImage={false}
    />
  )
}