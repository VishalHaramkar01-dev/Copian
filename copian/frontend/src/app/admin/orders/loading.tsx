import { AdminSkeletonFrame, SplitInspectorSkeleton } from "@/components/Skeleton";

export default function AdminOrdersLoading() {
  return (
    <AdminSkeletonFrame>
      <SplitInspectorSkeleton rows={5} cols={5} />
    </AdminSkeletonFrame>
  );
}
