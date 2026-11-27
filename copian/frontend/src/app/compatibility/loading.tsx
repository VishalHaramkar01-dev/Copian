import StorefrontShell from "@/components/StorefrontShell";
import { CompatibilitySkeleton } from "@/components/Skeleton";

export default function CompatibilityLoading() {
  return (
    <StorefrontShell>
      <CompatibilitySkeleton />
    </StorefrontShell>
  );
}
