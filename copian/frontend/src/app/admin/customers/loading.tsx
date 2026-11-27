import { AdminSkeletonFrame, Skeleton, SplitInspectorSkeleton } from "@/components/Skeleton";

export default function AdminCustomersLoading() {
  return (
    <AdminSkeletonFrame>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 flex-1 min-w-[200px] rounded" />
        <Skeleton className="h-10 w-44 rounded" />
      </div>
      <SplitInspectorSkeleton rows={5} cols={4} />
    </AdminSkeletonFrame>
  );
}
