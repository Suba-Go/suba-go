import { Badge } from '@suba-go/shared-components/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
} from '@suba-go/shared-components/components/ui/card';

export function ItemsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Pro header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-40 rounded-md bg-gray-200 animate-pulse" />
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full">
                <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
              </Badge>
            </div>
          </div>
          <div className="mt-2 h-4 w-80 rounded bg-gray-200 animate-pulse" />
        </div>

        <div className="h-10 w-40 rounded-md bg-gray-200 animate-pulse" />
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-28 rounded-md bg-gray-200 animate-pulse"
            />
          ))}
        </div>
        <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="h-10 w-full sm:w-[360px] rounded-md bg-gray-200 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 w-40 rounded-md bg-gray-200 animate-pulse" />
            <div className="h-10 w-24 rounded-md bg-gray-200 animate-pulse" />
            <div className="h-10 w-24 rounded-md bg-gray-200 animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-28 rounded-md bg-gray-200 animate-pulse" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, index) => (
          <Card key={index} className="animate-pulse overflow-hidden">
            <div className="h-48 bg-gray-200" />
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="h-6 bg-gray-200 rounded w-28" />
                <div className="h-5 bg-gray-200 rounded w-20" />
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
