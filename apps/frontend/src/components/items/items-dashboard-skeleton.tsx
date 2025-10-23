import {
  Card,
  CardContent,
  CardHeader,
} from '@suba-go/shared-components/components/ui/card';

export function ItemsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Actions Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
          </div>
          <div className="w-40 h-10 bg-gray-200 rounded-md animate-pulse" />
        </div>
        <div className="w-32 h-10 bg-gray-200 rounded-md animate-pulse" />
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="h-6 bg-gray-200 rounded w-24" />
                <div className="h-5 bg-gray-200 rounded w-16" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>

              <div className="flex gap-2 pt-2">
                <div className="h-8 bg-gray-200 rounded flex-1" />
                <div className="h-8 bg-gray-200 rounded w-10" />
                <div className="h-8 bg-gray-200 rounded w-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
