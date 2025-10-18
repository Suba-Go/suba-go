'use client';

import { useState } from 'react';
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@suba-go/shared-components/components/ui/carousel';
import { DocumentPreview } from '@/components/ui/document-preview';

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
  const [selectedDoc, setSelectedDoc] = useState<{
    url: string;
    filename: string;
  } | null>(null);

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

  // Extract filename from Vercel Blob URL
  const getFilenameFromUrl = (url: string): string => {
    try {
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      // Remove random suffix added by Vercel Blob (e.g., "document-abc123.pdf" -> "document.pdf")
      const cleanFilename = filename.replace(/-[a-zA-Z0-9]{6,}\./g, '.');
      return decodeURIComponent(cleanFilename);
    } catch {
      return 'Documento';
    }
  };

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

          {/* Fotos - Carousel */}
          {photoUrls.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Image className="h-5 w-5" />
                Fotos ({photoUrls.length})
              </h3>
              <Carousel className="w-full">
                <CarouselContent>
                  {photoUrls.map((url, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
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
                                  <svg class="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p class="text-sm">Error al cargar imagen</p>
                                </div>
                              </div>
                            `;
                            }
                          }}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}

          {/* Documentos - With Preview */}
          {docUrls.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos ({docUrls.length})
              </h3>
              <Carousel className="w-full">
                <CarouselContent>
                  {docUrls.map((url, index) => (
                    <CarouselItem
                      key={index}
                      className="md:basis-1/2 lg:basis-1/3"
                    >
                      <div className="p-3 border rounded-lg space-y-3">
                        {/* Document Preview */}
                        <div className="aspect-video bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                          {url.toLowerCase().endsWith('.pdf') ? (
                            <div className="text-center">
                              <FileText className="h-12 w-12 mx-auto text-red-500 mb-2" />
                              <p className="text-xs text-gray-500">
                                PDF Document
                              </p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <FileText className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                              <p className="text-xs text-gray-500">Document</p>
                            </div>
                          )}
                        </div>

                        {/* Document Name */}
                        <div className="space-y-2">
                          <p
                            className="text-sm font-medium truncate"
                            title={getFilenameFromUrl(url)}
                          >
                            {getFilenameFromUrl(url)}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              setSelectedDoc({
                                url,
                                filename: getFilenameFromUrl(url),
                              })
                            }
                          >
                            Ver Documento
                          </Button>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
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

      {/* Document Preview Dialog */}
      {selectedDoc && (
        <DocumentPreview
          url={selectedDoc.url}
          filename={selectedDoc.filename}
          open={!!selectedDoc}
          onOpenChange={(open) => !open && setSelectedDoc(null)}
        />
      )}
    </Dialog>
  );
}
