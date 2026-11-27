import { AdminSkeletonFrame, ReportAnalyticsSkeleton, Skeleton } from "@/components/Skeleton";

export default function AdminReportsLoading() {
  return (
    <AdminSkeletonFrame>
      <div className="flex flex-wrap gap-2 border-b border-light-outline-variant pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-36 rounded" />
        ))}
      </div>
      <ReportAnalyticsSkeleton />
    </AdminSkeletonFrame>
  );
}
