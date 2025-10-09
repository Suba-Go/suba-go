'use client';

import { Car, Calendar, Gauge, FileText, Image } from 'lucide-react';
import { ItemStateEnum } from '@suba-go/shared-validation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@suba-go/shared-components/components/ui/dialog';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Badge } from '@suba-go/shared-components/components/ui/badge';

interface Product {
  id: string;
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  version?: string;
  kilometraje?: number;
  legal_status?: string;
  state: string;
  photos?: string;
  docs?: string;
  createdAt: string;
}

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
}: ProductDetailModalProps) {
  if (!product) return null;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const photoUrls = product.photos
    ? product.photos.split(',').map((url) => url.trim())
    : [];
  const docUrls = product.docs
    ? product.docs.split(',').map((url) => url.trim())
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Detalle del Producto
          </DialogTitle>
          <DialogDescription>
            Información completa del producto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con estado */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">
                {product.plate || 'Sin Patente'}
              </h2>
              <p className="text-gray-600">
                {product.brand} {product.model} {product.year}
              </p>
            </div>
            <Badge className={getStateColor(product.state)}>
              {product.state}
            </Badge>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Car className="h-5 w-5" />
                Información del Vehículo
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Patente:</span>
                  <span>{product.plate || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Marca:</span>
                  <span>{product.brand || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Modelo:</span>
                  <span>{product.model || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Año:</span>
                  <span>{product.year || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Versión:</span>
                  <span>{product.version || 'N/A'}</span>
                </div>
                {product.kilometraje && (
                  <div className="flex justify-between">
                    <span className="font-medium flex items-center gap-1">
                      <Gauge className="h-4 w-4" />
                      Kilometraje:
                    </span>
                    <span>{product.kilometraje.toLocaleString()} km</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información Legal
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Estado Legal:</span>
                  <span>{product.legal_status || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Fecha de Creación:
                  </span>
                  <span>{formatDate(product.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fotos */}
          {photoUrls.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Image className="h-5 w-5" />
                Fotos ({photoUrls.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photoUrls.map((url, index) => (
                  <div
                    key={index}
                    className="aspect-video bg-gray-100 rounded-lg overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center text-gray-400">
                            <div class="text-center">
                              <Image class="h-8 w-8 mx-auto mb-2" />
                              <p class="text-sm">Error al cargar imagen</p>
                            </div>
                          </div>
                        `;
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentos */}
          {docUrls.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos ({docUrls.length})
              </h3>
              <div className="space-y-2">
                {docUrls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="text-sm">Documento {index + 1}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(url, '_blank')}
                    >
                      Ver Documento
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
