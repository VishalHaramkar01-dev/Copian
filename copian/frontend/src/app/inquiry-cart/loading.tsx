import StorefrontShell from "@/components/StorefrontShell";
import { InquiryCartPageSkeleton } from "@/components/Skeleton";

export default function InquiryCartLoading() {
  return (
    <StorefrontShell>
      <InquiryCartPageSkeleton />
    </StorefrontShell>
  );
}
