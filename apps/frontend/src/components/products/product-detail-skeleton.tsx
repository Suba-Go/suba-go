export function ProductDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-gray-200 rounded" />
          <div className="h-10 w-24 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Title and Badge */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-8 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
          </div>
          <div className="h-6 w-24 bg-gray-200 rounded-full" />
        </div>

        {/* Photos Carousel */}
        <div className="aspect-video bg-gray-200 rounded-lg" />

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-6 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        {/* Documents */}
        <div className="space-y-3">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

