/**
 * @file auto-bid-toggle.tsx
 * @description Auto-bid toggle with max price input
 */
'use client';

import { Switch } from '@suba-go/shared-components/components/ui/switch';
import { FormattedInput } from '@/components/ui/formatted-input';
import { Zap } from 'lucide-react';

interface AutoBidToggleProps {
  enabled: boolean;
  maxPrice: number;
  minPrice: number;
  onToggle: () => void;
  onMaxPriceChange: (value: number) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function AutoBidToggle({
  enabled,
  maxPrice,
  minPrice,
  onToggle,
  onMaxPriceChange,
}: AutoBidToggleProps) {
  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-900">
            Puja Automática
          </span>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {enabled && (
        <div className="space-y-2">
          <label className="text-xs text-purple-700">
            Precio Máximo (mínimo: {formatCurrency(minPrice)})
          </label>
          <FormattedInput
            formatType="price"
            value={maxPrice.toString()}
            onChange={(val) => onMaxPriceChange(Number(val) || 0)}
            className="w-full"
            placeholder={formatCurrency(minPrice)}
          />
          <p className="text-xs text-purple-600">
            El sistema pujará automáticamente por ti hasta este monto
          </p>
        </div>
      )}
    </div>
  );
}

