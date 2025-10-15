import { Spinner } from '@suba-go/shared-components/components/ui/spinner';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner className="size-8" />
      </div>
    </div>
  );
}
