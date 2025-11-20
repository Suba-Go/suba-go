/**
 * @file bid-input.tsx
 * @description Bid input component with formatted currency
 */
'use client';

import { Button } from '@suba-go/shared-components/components/ui/button';
import { FormattedInput } from '@/components/ui/formatted-input';
import { Gavel, Clock } from 'lucide-react';

interface BidInputProps {
  value: string;
  minBid: number;
  isPending: boolean;
  isDisabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function BidInput({
  value,
  minBid,
  isPending,
  isDisabled,
  onChange,
  onSubmit,
}: BidInputProps) {
  const numericValue = Number(value) || 0;
  const isValidBid = numericValue >= minBid;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Tu Puja (mínimo: {formatCurrency(minBid)})
      </label>
      <div className="flex gap-2">
        <FormattedInput
          formatType="price"
          value={value}
          onChange={(val) => onChange(val?.toString() || '0')}
          disabled={isPending || isDisabled}
          className="flex-1"
          placeholder={formatCurrency(minBid)}
        />
        <Button
          onClick={onSubmit}
          disabled={isPending || isDisabled || !isValidBid}
          className="min-w-[120px]"
        >
          {isPending ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Pujando...
            </>
          ) : (
            <>
              <Gavel className="h-4 w-4 mr-2" />
              Pujar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
