import { AdminSkeletonFrame, CmsFormSkeleton, Skeleton } from "@/components/Skeleton";

export default function AdminWebsiteSeoLoading() {
  return (
    <AdminSkeletonFrame>
      <div className="flex gap-2 border-b border-light-outline-variant pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-36 rounded" />
        ))}
      </div>
      <CmsFormSkeleton />
    </AdminSkeletonFrame>
  );
}
