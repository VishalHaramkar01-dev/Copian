import StorefrontShell from "@/components/StorefrontShell";
import { DistributorsPageSkeleton } from "@/components/Skeleton";

export default function DistributorsLoading() {
  return (
    <StorefrontShell>
      <DistributorsPageSkeleton />
    </StorefrontShell>
  );
}
