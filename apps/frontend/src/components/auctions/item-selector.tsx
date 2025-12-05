'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Car,
  Plus,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { useAvailableItems } from '@/hooks/use-items';
import { ItemCreateModal2 } from './item-create-modal2';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useCompany } from '@/hooks/use-company';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@suba-go/shared-components/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@suba-go/shared-components/components/ui/carousel';
import Image from 'next/image';

interface Item {
  id: string;
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  version?: string;
  kilometraje?: number;
  legal_status?: string;
  state: string;
  basePrice?: number;
  photos?: string;
  docs?: string;
  createdAt: string;
}

interface ItemSelectorProps {
  selectedItems: string[];
  onItemsChange: (items: string[]) => void;
}

const ITEMS_PER_PAGE = 5;

export function ItemSelector({
  selectedItems,
  onItemsChange,
}: ItemSelectorProps) {
  const { items, isLoading, error, refreshItems } = useAvailableItems();
  const { company } = useCompany();
  const primaryColor = company?.principal_color || '#3B82F6';
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<Item | null>(null);
  const [searchPlate, setSearchPlate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  // Filter items by plate search
  const filteredItems = useMemo(() => {
    if (!searchPlate.trim()) return items;
    const searchLower = searchPlate.toLowerCase().trim();
    return items.filter((item) =>
      item.plate?.toLowerCase().includes(searchLower)
    );
  }, [items, searchPlate]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredItems.slice(start, end);
  }, [filteredItems, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchPlate]);

  const photoUrls = previewItem?.photos
    ? previewItem.photos.split(',').map((url) => url.trim())
    : [];

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

  const showPagination = filteredItems.length > ITEMS_PER_PAGE;

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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input
            type="text"
            placeholder="Buscar por patente..."
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value)}
            className="pl-10"
          />
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
          <>
            <div className="space-y-2">
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border transition-colors ${
                    selectedItems.includes(item.id)
                      ? 'border-opacity-50'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  style={
                    selectedItems.includes(item.id)
                      ? {
                          backgroundColor: `${primaryColor}15`,
                          borderColor: primaryColor,
                        }
                      : undefined
                  }
                >
                  <Button
                    type="button"
                    variant={
                      selectedItems.includes(item.id) ? 'default' : 'outline'
                    }
                    size="lg"
                    className="h-10 w-10 sm:h-12 sm:w-12 p-0 flex items-center justify-center shrink-0"
                    style={
                      selectedItems.includes(item.id)
                        ? {
                            backgroundColor: primaryColor,
                            borderColor: primaryColor,
                            color: 'white',
                          }
                        : undefined
                    }
                    onClick={() => handleItemToggle(item.id)}
                  >
                    {selectedItems.includes(item.id) ? (
                      <Check className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    ) : (
                      <span className="text-base sm:text-lg font-bold">+</span>
                    )}
                  </Button>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setPreviewItem(item)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <h4 className="font-medium text-xs sm:text-sm truncate">
                        {item.plate || 'Sin patente'} -{' '}
                        {item.brand || 'Sin marca'} {item.model || ''}
                      </h4>
                      <Badge
                        className={`text-xs w-fit ${getStateColor(item.state)}`}
                      >
                        {item.state}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                      {item.year && <span>Año: {item.year}</span>}
                      {item.kilometraje && (
                        <span>KM: {item.kilometraje.toLocaleString()}</span>
                      )}
                      <span className="font-medium text-gray-700">
                        {formatPrice(item.basePrice)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewItem(item)}
                    className="flex items-center gap-1 shrink-0"
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Ver</span>
                  </Button>
                </div>
              ))}
            </div>

            {showPagination && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t">
                <p className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Item Preview Modal */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              {previewItem?.plate || 'Sin Patente'} - {previewItem?.brand}{' '}
              {previewItem?.model}
            </DialogTitle>
            <DialogDescription>Vista previa del item</DialogDescription>
          </DialogHeader>

          {previewItem && (
            <div className="space-y-4">
              {/* Photos Carousel */}
              {photoUrls.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Fotos</h3>
                  <Carousel className="w-full">
                    <CarouselContent>
                      {photoUrls.map((url: string, index: number) => (
                        <CarouselItem key={index}>
                          <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={url}
                              alt={`Foto ${index + 1}`}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {photoUrls.length > 1 && (
                      <>
                        <CarouselPrevious />
                        <CarouselNext />
                      </>
                    )}
                  </Carousel>
                </div>
              )}

              {/* Item Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Patente:</span>
                  <span className="ml-2">{previewItem.plate || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Marca:</span>
                  <span className="ml-2">{previewItem.brand || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Modelo:</span>
                  <span className="ml-2">{previewItem.model || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Año:</span>
                  <span className="ml-2">{previewItem.year || 'N/A'}</span>
                </div>
                {previewItem.kilometraje && (
                  <div>
                    <span className="font-medium">Kilometraje:</span>
                    <span className="ml-2">
                      {previewItem.kilometraje.toLocaleString()} km
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Precio Base:</span>
                  <span className="ml-2">
                    {formatPrice(previewItem.basePrice ?? undefined)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Estado:</span>
                  <Badge
                    className={`ml-2 text-xs ${getStateColor(
                      previewItem.state
                    )}`}
                  >
                    {previewItem.state}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Estado Legal:</span>
                  <span className="ml-2">
                    {previewItem.legal_status || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Select Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant={
                    selectedItems.includes(previewItem.id)
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() => {
                    handleItemToggle(previewItem.id);
                    setPreviewItem(null);
                  }}
                  className="flex items-center gap-2"
                >
                  {selectedItems.includes(previewItem.id) ? (
                    <>
                      <Check className="h-4 w-4" />
                      Deseleccionar
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Seleccionar Item
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ItemCreateModal2
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
