'use client';

import { SafeImage } from '@/components/ui/safe-image';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import { useCompanyContextOptional } from '@/contexts/company-context';
import { darkenColor } from '@/utils/color-utils';

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

  /**
   * Client requirement:
   * - AUCTION_MANAGER/ADMIN must see real bidder names
   * - USER must see only pseudonyms
   */
  showBidderRealNames?: boolean;

  /** Optional navigation between items (used for browsing in pending auctions) */
  onPrevItem?: () => void;
  onNextItem?: () => void;
  hasPrevItem?: boolean;
  hasNextItem?: boolean;

  /** Optional link to full item detail page */
  fullItemHref?: string;
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
  showBidderRealNames = false,
  onPrevItem,
  onNextItem,
  hasPrevItem,
  hasNextItem,
  fullItemHref,
}: AuctionItemDetailModalProps) {
  const router = useRouter();
  const { formatPrice } = useAutoFormat();
  const companyContext = useCompanyContextOptional();
  const primaryColor = companyContext?.company?.principal_color;
  const [photoCarouselApi, setPhotoCarouselApi] = useState<CarouselApi>();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [bidAmount, setBidAmount] = useState(currentHighestBid + bidIncrement);
  const [isMobile, setIsMobile] = useState(false);

  const item = auctionItem.item;

  // Apply primary color to close button when modal opens
  useEffect(() => {
    if (!isOpen || !primaryColor) return;

    let closeButton: HTMLElement | null = null;
    const applyFocusRing = () => {
      if (closeButton && primaryColor) {
        closeButton.style.setProperty('--tw-ring-color', primaryColor);
      }
    };

    const timer = setTimeout(() => {
      // Find the close button in the dialog
      const dialogContent = document.querySelector(
        '[data-state="open"]'
      ) as HTMLElement;
      if (dialogContent) {
        closeButton = dialogContent.querySelector(
          'button[class*="absolute right-4 top-4"]'
        ) as HTMLElement;
        if (closeButton) {
          // Apply primary color to focus ring
          applyFocusRing();
          closeButton.addEventListener('focus', applyFocusRing);
          closeButton.addEventListener('mouseenter', applyFocusRing);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (closeButton) {
        closeButton.removeEventListener('focus', applyFocusRing);
        closeButton.removeEventListener('mouseenter', applyFocusRing);
      }
    };
  }, [isOpen, primaryColor]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  useEffect(() => {
    if (!photoCarouselApi || isMobile) return;

    const carouselNode = photoCarouselApi.rootNode() as HTMLElement;
    if (!carouselNode) return;

    const viewport = photoCarouselApi.containerNode() as HTMLElement;

    if (!viewport) return;

    const preventHorizontalScroll = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 5) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    if (window.matchMedia('(pointer: fine)').matches) {
      carouselNode.addEventListener('wheel', preventHorizontalScroll, {
        passive: false,
      });
      viewport.addEventListener('wheel', preventHorizontalScroll, {
        passive: false,
      });
    }

    return () => {
      carouselNode.removeEventListener('wheel', preventHorizontalScroll);
      viewport.removeEventListener('wheel', preventHorizontalScroll);
    };
  }, [photoCarouselApi, isMobile]);

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

  // Determine winner by highest bid amount (not array order).
  // This prevents cases where multiple clients incorrectly see "Ganando".
  const highestBidderId = (() => {
    // Prefer realtime bidHistory (already normalized by the live view)
    if (Array.isArray(bidHistory) && bidHistory.length > 0) {
      const normalized = bidHistory
        .map((b: any) => {
          const amount = Number((b as any).amount ?? (b as any).offered_price ?? 0);
          const ts =
            Number((b as any).timestamp ?? 0) ||
            ((b as any).bid_time ? new Date((b as any).bid_time).getTime() : 0) ||
            ((b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0);
          return { userId: (b as any).userId, amount, ts };
        })
        .filter((b) => !!b.userId);
      normalized.sort((a, b) => b.amount - a.amount || b.ts - a.ts);
      return normalized[0]?.userId as string | undefined;
    }

    // Fallback to API bids (sort by offered_price)
    const bids = auctionItem.bids || [];
    if (!bids.length) return undefined;
    const sorted = [...bids].sort(
      (a, b) => Number(b.offered_price || 0) - Number(a.offered_price || 0)
    );
    return sorted[0]?.userId as string | undefined;
  })();

  const isUserWinning = !!userId && !!highestBidderId && highestBidderId === userId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            <span className="min-w-0 truncate">
              {item.brand} {item.model} {item.year}
            </span>

            <span className="flex items-center gap-2">
              {fullItemHref && (
                <Button
                  variant="outline"
                  onClick={() => router.push(fullItemHref)}
                  className="hidden sm:inline-flex"
                >
                  Ver ficha
                </Button>
              )}

              {(onPrevItem || onNextItem) && (
                <span className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onPrevItem}
                    disabled={!hasPrevItem}
                    aria-label="Producto anterior"
                    title="Anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onNextItem}
                    disabled={!hasNextItem}
                    aria-label="Siguiente producto"
                    title="Siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </span>
              )}

              {item.plate && (
                <Badge variant="outline" className="text-lg whitespace-nowrap">
                  {item.plate}
                </Badge>
              )}
            </span>
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
                <Carousel
                  className="w-full"
                  setApi={setPhotoCarouselApi}
                  opts={{
                    align: 'start',
                    dragFree: false,
                    containScroll: 'trimSnaps',
                    // Enable drag only on mobile, disable on desktop
                    watchDrag: isMobile,
                    skipSnaps: false,
                  }}
                >
                  <CarouselContent
                    className="-ml-0"
                    style={{
                      // Allow touch scroll on mobile, prevent on desktop
                      touchAction: isMobile ? 'pan-x' : 'pan-y',
                      overscrollBehaviorX: isMobile ? 'auto' : 'none',
                    }}
                  >
                    {photoUrls.map((url: string, index: number) => (
                      <CarouselItem key={index} className="pl-0">
                        <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                          <SafeImage
                            src={url}
                            fill
                            alt={`Foto ${index + 1}`}
                            className="object-contain select-none"
                            draggable={false}
                            style={{
                              pointerEvents: isMobile ? 'auto' : 'none',
                            }}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {/* Show arrows only on desktop/laptop, hide on mobile */}
                  {photoUrls.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2 md:left-4 z-20 hidden md:flex" />
                      <CarouselNext className="right-2 md:right-4 z-20 hidden md:flex" />
                    </>
                  )}
                </Carousel>
                {photoCount > 0 && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
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
                  style={
                    primaryColor
                      ? {
                          borderColor: primaryColor,
                        }
                      : undefined
                  }
                  onFocus={(e) => {
                    if (primaryColor) {
                      e.currentTarget.style.borderColor = primaryColor;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}20`;
                    }
                  }}
                  onBlur={(e) => {
                    if (primaryColor) {
                      e.currentTarget.style.borderColor = '';
                      e.currentTarget.style.boxShadow = '';
                    }
                  }}
                />
                <Button
                  onClick={handlePlaceBid}
                  disabled={bidAmount < currentHighestBid + bidIncrement}
                  className="whitespace-nowrap text-white"
                  style={
                    primaryColor
                      ? {
                          backgroundColor: primaryColor,
                          borderColor: primaryColor,
                        }
                      : undefined
                  }
                  onMouseEnter={(e) => {
                    if (primaryColor) {
                      e.currentTarget.style.backgroundColor = darkenColor(
                        primaryColor,
                        10
                      );
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (primaryColor) {
                      e.currentTarget.style.backgroundColor = primaryColor;
                    }
                  }}
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
                showRealNames={showBidderRealNames}
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
