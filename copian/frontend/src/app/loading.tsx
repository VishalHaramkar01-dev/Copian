import StorefrontShell from "@/components/StorefrontShell";
import { HomePageSkeleton } from "@/components/Skeleton";

export default function HomeLoading() {
  return (
    <StorefrontShell showUtilityBar showSearchInHeader fullFooter>
      <HomePageSkeleton />
    </StorefrontShell>
  );
}
