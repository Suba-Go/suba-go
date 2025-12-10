'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Eye, Package } from 'lucide-react';
import {
  ItemDto,
  ItemStateEnum,
  ShowItemStateEnum,
} from '@suba-go/shared-validation';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { ItemCreateModal } from './item-create-modal';
import { ItemEditModal } from './item-edit-modal';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useAutoFormat } from '@/hooks/use-auto-format';
import Image from 'next/image';
import { useCompanyContextOptional } from '@/contexts/company-context';
import { darkenColor } from '@/utils/color-utils';

interface ItemsDashboardProps {
  subdomain: string;
}

export function ItemsDashboard({ subdomain }: ItemsDashboardProps) {
  const router = useRouter();
  const companyContext = useCompanyContextOptional();
  const primaryColor = companyContext?.company?.principal_color;
  const [items, setItems] = useState<ItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemDto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const { formatNumberWithSeparators } = useAutoFormat();

  const fetchItems = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/items');

      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchItems();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar producto');
      }

      toast({
        title: 'Éxito',
        description: 'Producto eliminado correctamente',
      });

      fetchItems();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el producto',
        variant: 'destructive',
      });
    }
  };

  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        item.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filterState === 'all' || item.state === filterState;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Primero ordenar por estado: EN_SUBASTA > DISPONIBLE > VENDIDO > otros
      const stateOrder = {
        [ItemStateEnum.EN_SUBASTA]: 1,
        [ItemStateEnum.DISPONIBLE]: 2,
        [ItemStateEnum.VENDIDO]: 3,
      };

      const aStateOrder = stateOrder[a.state as keyof typeof stateOrder] || 4;
      const bStateOrder = stateOrder[b.state as keyof typeof stateOrder] || 4;

      if (aStateOrder !== bStateOrder) {
        return aStateOrder - bStateOrder;
      }

      // Si tienen el mismo estado, ordenar por fecha de creación (más nuevos primero)
      return (
        new Date(b.createdAt || '').getTime() -
        new Date(a.createdAt || '').getTime()
      );
    });

  const getStateColor = (state: string) => {
    switch (state) {
      case ItemStateEnum.DISPONIBLE:
        return 'bg-green-100 text-green-800';
      case ItemStateEnum.EN_SUBASTA:
        return 'bg-blue-100 text-blue-800';
      case ItemStateEnum.VENDIDO:
        return 'bg-gray-100 text-gray-800';
      case ItemStateEnum.ELIMINADO:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner className="size-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por patente, marca o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(ShowItemStateEnum).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>
        {!primaryColor ? (
          <div className="flex items-center gap-2">
            <Spinner className="size-4" />
            <span className="text-sm text-gray-500">Cargando...</span>
          </div>
        ) : (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
            style={{
              backgroundColor: primaryColor,
              borderColor: primaryColor,
              color: '#000000',
            }}
            onMouseEnter={(e) => {
              if (primaryColor) {
                e.currentTarget.style.backgroundColor = darkenColor(
                  primaryColor,
                  10
                );
                e.currentTarget.style.color = '#000000';
              }
            }}
            onMouseLeave={(e) => {
              if (primaryColor) {
                e.currentTarget.style.backgroundColor = primaryColor;
                e.currentTarget.style.color = '#000000';
              }
            }}
          >
            <Plus className="h-4 w-4" />
            Crear Producto
          </Button>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            {/* Image Preview */}
            <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100">
              {item.photos ? (
                <>
                  <Image
                    src={item.photos.split(',')[0]?.trim()}
                    alt={`${item.brand} ${item.model}`}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBWODBIODBWNjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik02MCA4MEgxNDBWMTQwSDYwVjgwWiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K';
                    }}
                  />
                  {item.photos.split(',').length > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                      +{item.photos.split(',').length - 1} más
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center text-gray-400">
                    <svg
                      className="w-12 h-12 mx-auto mb-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-xs">Sin imagen</p>
                  </div>
                </div>
              )}
            </div>

            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {item.plate || 'Sin Patente'}
                </CardTitle>
                <Badge className={getStateColor(item.state)}>
                  {item.state}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Marca:</span>{' '}
                  {item.brand || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Modelo:</span>{' '}
                  {item.model || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Año:</span> {item.year || 'N/A'}
                </p>
                {item.kilometraje && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Kilometraje:</span>{' '}
                    {item.kilometraje.toLocaleString()} km
                  </p>
                )}
                {item.basePrice && (
                  <p className="text-sm font-semibold text-black-600">
                    <span className="font-medium">Precio base:</span> $
                    {formatNumberWithSeparators(item.basePrice)}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/items/${item.id}`)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedItem(item);
                    setIsEditModalOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay productos
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterState !== 'all'
              ? 'No se encontraron productos con los filtros aplicados'
              : 'Comienza creando tu primer producto'}
          </p>
          {!searchTerm && filterState === 'all' && (
            <div className="mt-6">
              {primaryColor ? (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  style={{
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: '#000000',
                  }}
                  onMouseEnter={(e) => {
                    if (primaryColor) {
                      e.currentTarget.style.backgroundColor = darkenColor(
                        primaryColor,
                        10
                      );
                      e.currentTarget.style.color = '#000000';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (primaryColor) {
                      e.currentTarget.style.backgroundColor = primaryColor;
                      e.currentTarget.style.color = '#000000';
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Producto
                </Button>
              ) : (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Producto
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ItemCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        subdomain={subdomain}
      />

      <ItemEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchItems();
        }}
        item={selectedItem}
      />
    </div>
  );
}
