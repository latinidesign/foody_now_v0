import { PageSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <PageSkeleton
      subtitle
      action={false}
      layout="list"
      itemCount={8}
      showCardImage={false}
    />
  )
}