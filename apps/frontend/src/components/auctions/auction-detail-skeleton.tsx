import {
  Card,
  CardContent,
  CardHeader,
} from '@suba-go/shared-components/components/ui/card';

export function AuctionDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
      </div>

      {/* Status Card Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
