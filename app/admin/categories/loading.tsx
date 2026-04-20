import { PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton
      subtitle
      action
      layout="list"
      itemCount={5}
      showCardImage={false}
    />
  )
}