'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Car,
  Calendar,
  Gauge,
  FileText,
  Image,
  Edit,
  Trash2,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { ItemStateEnum } from '@suba-go/shared-validation';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@suba-go/shared-components/components/ui/carousel';
import { ProductEditModal } from '@/components/products/product-edit-modal';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';

interface Product {
  id: string;
  name?: string;
  plate?: string;
  description?: string;
  brand?: string;
  model?: string;
  year?: number;
  version?: string;
  mileage?: number;
  kilometraje?: number;
  legal_status?: string;
  state: string;
  basePrice?: number;
  photos?: string;
  docs?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductDetailProps {
  productId: string;
  subdomain: string;
  userRole: string;
  userId: string;
}

export function ProductDetail({
  productId,
  subdomain,
  userRole,
  userId,
}: ProductDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isAuctionManager = userRole === 'AUCTION_MANAGER';

  // Function to download file
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/items/${productId}`);

        if (!response.ok) {
          throw new Error('Error al cargar el producto');
        }

        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar el producto',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId, toast]);

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el producto');
      }

      toast({
        title: 'Éxito',
        description: 'Producto eliminado correctamente',
      });

      router.push('/productos');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el producto',
        variant: 'destructive',
      });
    }
  };

  const handleEditSuccess = () => {
    // Recargar el producto después de editar
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/items/${productId}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        }
      } catch (error) {
        console.error('Error reloading product:', error);
      }
    };
    fetchProduct();
  };

  const getFilenameFromUrl = (url: string): string => {
    try {
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const cleanFilename = filename.replace(/-[a-zA-Z0-9]{6,}\./g, '.');
      return decodeURIComponent(cleanFilename);
    } catch {
      return 'Documento';
    }
  };

  const getStateLabel = (state: string) => {
    const labels: Record<string, string> = {
      [ItemStateEnum.DISPONIBLE]: 'Disponible',
      [ItemStateEnum.EN_SUBASTA]: 'En Subasta',
      [ItemStateEnum.VENDIDO]: 'Vendido',
      [ItemStateEnum.ELIMINADO]: 'Eliminado',
    };
    return labels[state] || state;
  };

  const getStateColor = (state: string) => {
    const colors: Record<string, string> = {
      [ItemStateEnum.DISPONIBLE]: 'bg-green-100 text-green-800',
      [ItemStateEnum.EN_SUBASTA]: 'bg-blue-100 text-blue-800',
      [ItemStateEnum.VENDIDO]: 'bg-gray-100 text-gray-800',
      [ItemStateEnum.ELIMINADO]: 'bg-red-100 text-red-800',
    };
    return colors[state] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Producto no encontrado</p>
        <Button
          variant="outline"
          onClick={() => router.push('/productos')}
          className="mt-4"
        >
          Volver a Productos
        </Button>
      </div>
    );
  }

  const photoUrls = product.photos
    ? product.photos.split(',').map((url) => url.trim())
    : [];
  const docUrls = product.docs
    ? product.docs.split(',').map((url) => url.trim())
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with Back Button and Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        {isAuctionManager && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Title and State */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            {product.description && (
              <p className="text-gray-600 mt-2">{product.description}</p>
            )}
          </div>
          <Badge className={getStateColor(product.state)}>
            {getStateLabel(product.state)}
          </Badge>
        </div>

        {/* Photos Carousel */}
        {photoUrls.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Image className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Fotos</h2>
            </div>
            <Carousel className="w-full">
              <CarouselContent>
                {photoUrls.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-contain"
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

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.brand && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Car className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Marca</p>
                <p className="font-semibold">{product.brand}</p>
              </div>
            </div>
          )}

          {product.model && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Car className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Modelo</p>
                <p className="font-semibold">{product.model}</p>
              </div>
            </div>
          )}

          {product.year && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Año</p>
                <p className="font-semibold">{product.year}</p>
              </div>
            </div>
          )}

          {product.mileage && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Gauge className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Kilometraje</p>
                <p className="font-semibold">
                  {product.mileage.toLocaleString()} km
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Documents */}
        {docUrls.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <FileText className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Documentos</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {docUrls.map((url, index) => {
                const filename = getFilenameFromUrl(url);
                const isPDF = filename.toLowerCase().endsWith('.pdf');

                return (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleDownload(url, filename)}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <FileText
                        className={`h-8 w-8 ${
                          isPDF ? 'text-red-500' : 'text-blue-500'
                        }`}
                      />
                      <p className="text-sm font-medium text-gray-700 truncate w-full">
                        {filename}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Product Edit Modal */}
      {isEditModalOpen && product && (
        <ProductEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          product={product}
        />
      )}
    </div>
  );
}
