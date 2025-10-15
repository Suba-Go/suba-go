'use client';

import { useState } from 'react';
import { Car, Plus, Check } from 'lucide-react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { Checkbox } from '@suba-go/shared-components/components/ui/checkbox';
import { useAvailableItems } from '@/hooks/use-items';
import { ProductCreateModal2 } from './product-create-modal2';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';

interface ItemSelectorProps {
  selectedItems: string[];
  onItemsChange: (items: string[]) => void;
}

export function ItemSelector({
  selectedItems,
  onItemsChange,
}: ItemSelectorProps) {
  const { items, isLoading, error, refreshItems } = useAvailableItems();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleItemToggle = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onItemsChange(selectedItems.filter((id) => id !== itemId));
    } else {
      onItemsChange([...selectedItems, itemId]);
    }
  };

  const handleCreateSuccess = () => {
    refreshItems();
    setIsCreateModalOpen(false);
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Sin precio';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'DISPONIBLE':
        return 'bg-green-100 text-green-800';
      case 'EN_SUBASTA':
        return 'bg-blue-100 text-blue-800';
      case 'VENDIDO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">
            {' '}
            <Spinner className="size-4" />
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Nuevo Item
          </Button>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-4 bg-red-50">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-red-600">Error: {error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Nuevo Item
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refreshItems}
          className="w-full"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Items seleccionados: {selectedItems.length} de {items.length}{' '}
            disponibles
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Nuevo Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No hay items disponibles</p>
            <p className="text-sm text-gray-500">
              Crea tu primer item para poder incluirlo en subastas
            </p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  selectedItems.includes(item.id)
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={() => handleItemToggle(item.id)}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">
                      {item.plate || 'Sin patente'} -{' '}
                      {item.brand || 'Sin marca'} {item.model || ''}
                    </h4>
                    <Badge className={`text-xs ${getStateColor(item.state)}`}>
                      {item.state}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {item.year && <span>Año: {item.year}</span>}
                    {item.kilometraje && (
                      <span>KM: {item.kilometraje.toLocaleString()}</span>
                    )}
                    <span className="font-medium text-gray-700">
                      {formatPrice(item.basePrice)}
                    </span>
                  </div>
                </div>

                {selectedItems.includes(item.id) && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ProductCreateModal2
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
