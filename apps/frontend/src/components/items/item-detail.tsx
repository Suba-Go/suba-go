'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Car,
  Calendar,
  Gauge,
  FileText,
  Image as ImageIcon,
  Edit,
  Trash2,
  ArrowLeft,
  Download,
  DollarSign,
  Shield,
  Package,
  Gavel,
} from 'lucide-react';
import Image from 'next/image';
import { ItemDto, ItemStateEnum } from '@suba-go/shared-validation';
import {
  getAuctionBadgeColor,
  getAuctionStatusLabel,
} from '@/lib/auction-badge-colors';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@suba-go/shared-components/components/ui/carousel';
import { ItemEditModal } from '@/components/items/item-edit-modal';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { useAutoFormat } from '@/hooks/use-auto-format';

interface ItemDetailProps {
  itemId: string;
  userRole: string;
}

export function ItemDetail({ itemId, userRole }: ItemDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { formatPrice } = useAutoFormat();
  const [item, setItem] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [photoCarouselApi, setPhotoCarouselApi] = useState<CarouselApi>();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);

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
    const fetchItems = async () => {
      try {
        const response = await fetch(`/api/items/${itemId}`);

        if (!response.ok) {
          throw new Error('Error al cargar el producto');
        }

        const data = await response.json();
        setItem(data);
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

    fetchItems();
  }, [itemId, toast]);

  // Track carousel changes for photo counter
  useEffect(() => {
    if (!photoCarouselApi) {
      return;
    }

    const updatePhotoIndex = () => {
      setCurrentPhotoIndex(photoCarouselApi.selectedScrollSnap());
    };

    setPhotoCount(photoCarouselApi.scrollSnapList().length);
    setCurrentPhotoIndex(photoCarouselApi.selectedScrollSnap());

    photoCarouselApi.on('select', updatePhotoIndex);

    return () => {
      photoCarouselApi.off('select', updatePhotoIndex);
    };
  }, [photoCarouselApi]);

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el producto');
      }

      toast({
        title: 'Éxito',
        description: 'Producto eliminado correctamente',
      });

      router.push('/items');
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
    const fetchItem = async () => {
      try {
        const response = await fetch(`/api/items/${itemId}`);
        if (response.ok) {
          const data = await response.json();
          setItem(data);
        }
      } catch (error) {
        console.error('Error reloading product:', error);
      }
    };
    fetchItem();
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

  const getLegalStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      TRANSFERIBLE: 'Transferible',
      LEASING: 'Leasing',
      POSIBILIDAD_DE_EMBARGO: 'Posibilidad de embargo',
      PRENDA: 'Prenda',
      OTRO: 'Otro',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Producto no encontrado</p>
        <Button
          variant="outline"
          onClick={() => router.push('/items')}
          className="mt-4"
        >
          Volver a Productos
        </Button>
      </div>
    );
  }

  const photoUrls = item.photos
    ? item.photos.split(',').map((url: string) => url.trim())
    : [];
  const docUrls = item.docs
    ? item.docs.split(',').map((url: string) => url.trim())
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
          <Badge className={getStateColor(item.state)}>
            {getStateLabel(item.state)}
          </Badge>
        </div>

        {/* Photos Carousel */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <ImageIcon className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Fotos</h2>
          </div>
          {photoUrls.length > 0 ? (
            <div className="relative">
              <Carousel className="w-full" setApi={setPhotoCarouselApi}>
                <CarouselContent>
                  {photoUrls.map((url: string, index: number) => (
                    <CarouselItem key={index}>
                      <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={url}
                          width={100}
                          height={100}
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
              {/* Image Counter */}
              {photoCount > 0 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {currentPhotoIndex + 1} de {photoCount}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No hay fotos disponibles</p>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {item.brand && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Car className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Marca</p>
                <p className="font-semibold">{item.brand}</p>
              </div>
            </div>
          )}

          {item.model && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Car className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Modelo</p>
                <p className="font-semibold">{item.model}</p>
              </div>
            </div>
          )}

          {item.year && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Año</p>
                <p className="font-semibold">{item.year}</p>
              </div>
            </div>
          )}

          {item.version && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Package className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Versión</p>
                <p className="font-semibold">{item.version}</p>
              </div>
            </div>
          )}

          {item.kilometraje && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Gauge className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Kilometraje</p>
                <p className="font-semibold">
                  {item.kilometraje.toLocaleString()} km
                </p>
              </div>
            </div>
          )}

          {item.legal_status && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Estado Legal</p>
                <p className="font-semibold">
                  {getLegalStatusLabel(item.legal_status)}
                </p>
              </div>
            </div>
          )}

          {isAuctionManager && item.basePrice && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Precio Inicial</p>
                <p className="font-semibold">{formatPrice(item.basePrice)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Documentos</h2>
          </div>
          {docUrls.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {docUrls.map((url: string, index: number) => {
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
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No hay documentos disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* Auction Card - Only for Auction Managers */}
      {isAuctionManager &&
        item.auctionItems &&
        item.auctionItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Subasta Asociada
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.auctionItems.map((auctionItem: any) => (
                <div
                  key={auctionItem.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() =>
                    router.push(`/subastas/${auctionItem.auction.id}`)
                  }
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {auctionItem.auction.title}
                        </h3>
                        {auctionItem.auction.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {auctionItem.auction.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={getAuctionBadgeColor(
                          auctionItem.auction.status
                        )}
                      >
                        {getAuctionStatusLabel(auctionItem.auction.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Inicio</p>
                        <p className="font-medium">
                          {new Date(
                            auctionItem.auction.startTime
                          ).toLocaleString('es-CL')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fin</p>
                        <p className="font-medium">
                          {new Date(auctionItem.auction.endTime).toLocaleString(
                            'es-CL'
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Precio Inicial</p>
                        <p className="font-medium">
                          {formatPrice(auctionItem.startingBid)}
                        </p>
                      </div>
                      {auctionItem.reservePrice && (
                        <div>
                          <p className="text-gray-600">Precio Reserva</p>
                          <p className="font-medium">
                            {formatPrice(auctionItem.reservePrice)}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button variant="outline" className="w-full gap-2">
                      <Gavel className="h-4 w-4" />
                      Ver Subasta
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      {/* Product Edit Modal */}
      {isEditModalOpen && item && (
        <ItemEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          item={item}
        />
      )}
    </div>
  );
}
