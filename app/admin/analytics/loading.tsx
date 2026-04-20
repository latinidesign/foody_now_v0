import { PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton
      subtitle={false}
      action={false}
      layout="grid"
      itemCount={6}
      columns="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
      cardLineCount={4}
      showCardImage={false}
    />
  )
}