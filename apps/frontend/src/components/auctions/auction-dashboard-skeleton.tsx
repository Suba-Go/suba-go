import {
  Card,
  CardContent,
  CardHeader,
} from '@suba-go/shared-components/components/ui/card';

export function AuctionDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions Bar Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>

      {/* Auctions Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse mt-1"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="text-center">
                    <div className="h-4 bg-gray-200 rounded w-12 mx-auto animate-pulse mb-1"></div>
                    <div className="h-5 bg-gray-200 rounded w-8 mx-auto animate-pulse"></div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>

              <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
