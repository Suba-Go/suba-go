'use client';

import { useState, useEffect } from 'react';
import {
  Car,
  Calendar,
  Gauge,
  FileText,
  Image as ImageIcon,
  Download,
  DollarSign,
  Shield,
  Package,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@suba-go/shared-components/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@suba-go/shared-components/components/ui/carousel';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { useAutoFormat } from '@/hooks/use-auto-format';
import { ItemBidHistory } from './user-view/item-bid-history';
import {
  AuctionItemWithItmeAndBidsDto,
  BidDto,
  BidWithUserDto,
} from '@suba-go/shared-validation';

interface SimpleBidHistory {
  id: string;
  amount: number;
  userId: string;
  userName?: string;
  timestamp: number;
}

interface AuctionItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionItem: AuctionItemWithItmeAndBidsDto;
  currentHighestBid: number;
  bidIncrement: number;
  onPlaceBid?: (amount: number) => void;
  isUserView?: boolean;
  userId?: string;
  bidHistory?: SimpleBidHistory[] | BidDto[];
  showBidHistory?: boolean;
}

export function AuctionItemDetailModal({
  isOpen,
  onClose,
  auctionItem,
  currentHighestBid,
  bidIncrement,
  onPlaceBid,
  isUserView = false,
  userId,
  bidHistory = [],
  showBidHistory = true,
}: AuctionItemDetailModalProps) {
  const { formatPrice } = useAutoFormat();
  const [photoCarouselApi, setPhotoCarouselApi] = useState<CarouselApi>();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [bidAmount, setBidAmount] = useState(currentHighestBid + bidIncrement);

  const item = auctionItem.item;

  // Update bid amount when currentHighestBid changes
  useEffect(() => {
    setBidAmount(currentHighestBid + bidIncrement);
  }, [currentHighestBid, bidIncrement]);

  // Track carousel changes
  useEffect(() => {
    if (!photoCarouselApi) return;

    setPhotoCount(photoCarouselApi.scrollSnapList().length);
    setCurrentPhotoIndex(photoCarouselApi.selectedScrollSnap());

    photoCarouselApi.on('select', () => {
      setCurrentPhotoIndex(photoCarouselApi.selectedScrollSnap());
    });
  }, [photoCarouselApi]);

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePlaceBid = () => {
    if (onPlaceBid && bidAmount >= currentHighestBid + bidIncrement) {
      onPlaceBid(bidAmount);
    }
  };

  const getLegalStatusLabel = (status?: string) => {
    if (!status) return 'No especificado';
    const labels: Record<string, string> = {
      TRANSFERIBLE: 'Transferible',
      LEASING: 'Leasing',
      POSIBILIDAD_DE_EMBARGO: 'Posibilidad de embargo',
      PRENDA: 'Prenda',
      OTRO: 'Otro',
    };
    return labels[status] || status;
  };

  if (!item) return null;

  const photoUrls = item.photos
    ? item.photos.split(',').map((url: string) => url.trim())
    : [];
  const docUrls = item.docs
    ? item.docs.split(',').map((url: string) => url.trim())
    : [];

  const isUserWinning =
    auctionItem.bids?.[0]?.userId === userId &&
    (auctionItem.bids?.length || 0) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            <span>
              {item.brand} {item.model} {item.year}
            </span>
            {item.plate && (
              <Badge variant="outline" className="text-lg">
                {item.plate}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photos Carousel */}
          {photoUrls.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <ImageIcon className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Fotos</h3>
              </div>
              <div className="relative">
                <Carousel className="w-full" setApi={setPhotoCarouselApi}>
                  <CarouselContent>
                    {photoUrls.map((url: string, index: number) => (
                      <CarouselItem key={index}>
                        <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={url}
                            fill
                            alt={`Foto ${index + 1}`}
                            className="object-contain"
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
                {photoCount > 0 && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {currentPhotoIndex + 1} de {photoCount}
                  </div>
                )}
              </div>
            </div>
          )}

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

            {item.basePrice && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Precio Base</p>
                  <p className="font-semibold">{formatPrice(item.basePrice)}</p>
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
          </div>

          {/* Description */}
          {item.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <FileText className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Descripción</h3>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {item.description}
              </p>
            </div>
          )}

          {/* Documents */}
          {docUrls.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Package className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Documentos</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {docUrls.map((url: string, index: number) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() =>
                      handleDownload(url, `documento-${index + 1}.pdf`)
                    }
                    className="justify-start gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Documento {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Bidding Section - Only for user view */}
          {isUserView && onPlaceBid && (
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Puja Inicial</p>
                  <p className="text-lg font-semibold">
                    {formatPrice(auctionItem.startingBid)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Puja Actual</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPrice(currentHighestBid)}
                  </p>
                </div>
              </div>

              {isUserWinning && (
                <Badge className="bg-green-100 text-green-800 border-green-300 w-full justify-center py-2">
                  ✓ Estás ganando esta puja
                </Badge>
              )}

              <div className="flex gap-2">
                <Input
                  type="text"
                  value={formatPrice(bidAmount)}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    setBidAmount(Number(numericValue) || 0);
                  }}
                  className="text-lg"
                  placeholder={formatPrice(currentHighestBid + bidIncrement)}
                />
                <Button
                  onClick={handlePlaceBid}
                  disabled={bidAmount < currentHighestBid + bidIncrement}
                  className="whitespace-nowrap"
                >
                  Pujar {formatPrice(bidAmount)}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Incremento mínimo: {formatPrice(bidIncrement)}
              </p>
            </div>
          )}

          {/* Bid History Section */}
          {showBidHistory &&
            (bidHistory.length > 0 ||
              (auctionItem.bids && auctionItem.bids.length > 0)) && (
              <ItemBidHistory
                bids={
                  (bidHistory.length > 0
                    ? bidHistory
                    : auctionItem.bids || []) as BidWithUserDto[]
                }
                currentUserId={userId}
                title={
                  bidHistory.length > 0
                    ? 'Historial de Pujas'
                    : 'Pujas Anteriores'
                }
                maxHeight="max-h-96"
              />
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
