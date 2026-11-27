import StorefrontShell from "@/components/StorefrontShell";
import { CataloguePageSkeleton } from "@/components/Skeleton";

export default function ProductsLoading() {
  return (
    <StorefrontShell>
      <CataloguePageSkeleton />
    </StorefrontShell>
  );
}
