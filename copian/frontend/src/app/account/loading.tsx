import StorefrontShell from "@/components/StorefrontShell";
import { AccountPageSkeleton } from "@/components/Skeleton";

export default function AccountLoading() {
  return (
    <StorefrontShell>
      <AccountPageSkeleton />
    </StorefrontShell>
  );
}
