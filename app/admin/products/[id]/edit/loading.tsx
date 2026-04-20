import { PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton
      subtitle={false}
      action
      layout="list"
      itemCount={8}
      showCardImage={false}
    />
  )
}