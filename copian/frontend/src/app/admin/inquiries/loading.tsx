import { AdminSkeletonFrame, Skeleton, SplitInspectorSkeleton } from "@/components/Skeleton";

export default function AdminInquiriesLoading() {
  return (
    <AdminSkeletonFrame>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <SplitInspectorSkeleton rows={5} cols={4} />
    </AdminSkeletonFrame>
  );
}
