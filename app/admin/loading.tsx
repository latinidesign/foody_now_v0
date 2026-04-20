import { PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton
      subtitle={false}
      action={false}
      layout="grid"
      itemCount={4}
      columns="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
      cardLineCount={2}
      showCardImage={false}
    />
  )
}