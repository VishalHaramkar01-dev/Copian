import StorefrontShell from "@/components/StorefrontShell";
import { CategoryDetailSkeleton } from "@/components/Skeleton";

export default function CategoryLoading() {
  return (
    <StorefrontShell>
      <CategoryDetailSkeleton />
    </StorefrontShell>
  );
}
