import { Skeleton } from "@/components/ui/skeleton"

export default function BulkOpsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-[200px] w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    </div>
  )
}
