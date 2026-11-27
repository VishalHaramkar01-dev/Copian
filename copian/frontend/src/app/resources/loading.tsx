import StorefrontShell from "@/components/StorefrontShell";
import { ResourcesPageSkeleton } from "@/components/Skeleton";

export default function ResourcesLoading() {
  return (
    <StorefrontShell>
      <ResourcesPageSkeleton />
    </StorefrontShell>
  );
}
