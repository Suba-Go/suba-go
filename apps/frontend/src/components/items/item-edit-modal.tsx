'use client';

import { useState, useEffect, useRef } from 'react';
import { SafeImage } from '@/components/ui/safe-image';
import { parsePhotos } from '@/lib/auction-utils';
import { getVehicles } from '@/lib/vehicle-utils';
import {
  Car,
  X,
  Image as ImageIcon,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@suba-go/shared-components/components/ui/dialog';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Label } from '@suba-go/shared-components/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@suba-go/shared-components/components/ui/select';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { apiFetch } from '@/lib/api/api-fetch';
import { FileUpload } from '@/components/ui/file-upload';
import { FormattedInput } from '@/components/ui/formatted-input';
import {
  ItemDto,
  itemEditSchema,
  LegalStatusEnum,
} from '@suba-go/shared-validation';
import Image from 'next/image';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: ItemDto | null;
}

interface VehicleRow {
  _key: number;
  plate: string;
  brand: string;
  model: string;
  year: number | '';
  version: string;
  kilometraje: number | '';
}

const emptyVehicle = (key: number): VehicleRow => ({
  _key: key,
  plate: '',
  brand: '',
  model: '',
  year: '',
  version: '',
  kilometraje: '',
});

export function ItemEditModal({
  isOpen,
  onClose,
  onSuccess,
  item,
}: ItemEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [docUrls, setDocUrls] = useState<string[]>([]);
  const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([]);
  const [newDocUrls, setNewDocUrls] = useState<string[]>([]);
  const [photoCarouselIndex, setPhotoCarouselIndex] = useState(0);

  const keyCounter = useRef(1);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([emptyVehicle(0)]);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [legalStatus, setLegalStatus] = useState<string>(
    LegalStatusEnum.TRANSFERIBLE
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();

  const allPhotoUrls = [...photoUrls, ...newPhotoUrls];

  // Keep carousel index valid when photos change
  useEffect(() => {
    setPhotoCarouselIndex((idx) => {
      if (allPhotoUrls.length === 0) return 0;
      return Math.min(idx, allPhotoUrls.length - 1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrls.length, newPhotoUrls.length]);

  // Extract filename from Vercel Blob URL
  const getFilenameFromUrl = (url: string): string => {
    try {
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const cleanFilename = filename.replace(/-[a-zA-Z0-9]{6,}\./g, '.');
      return decodeURIComponent(cleanFilename);
    } catch {
      return 'Archivo';
    }
  };

  // Load item data when modal opens
  useEffect(() => {
    if (item && isOpen) {
      const loaded = getVehicles(item);
      keyCounter.current = Math.max(loaded.length, 1);
      setVehicles(
        loaded.length > 0
          ? loaded.map((v, i) => ({
              _key: i,
              plate: v.plate || '',
              brand: v.brand || '',
              model: v.model || '',
              year: (v.year as number) || '',
              version: v.version || '',
              kilometraje: (v.kilometraje as number) || '',
            }))
          : [emptyVehicle(0)]
      );
      setBasePrice((item.basePrice as number) || 0);
      setLegalStatus(
        (item.legal_status as string) || LegalStatusEnum.TRANSFERIBLE
      );
      setErrors({});

      // Load existing photos and docs
      if (item.photos) {
        setPhotoUrls(parsePhotos(item.photos));
      } else {
        setPhotoUrls([]);
      }

      if (item.docs) {
        setDocUrls(item.docs.split(',').map((url) => url.trim()));
      } else {
        setDocUrls([]);
      }

      setNewPhotoUrls([]);
      setNewDocUrls([]);
      setPhotoCarouselIndex(0);
    }
  }, [item, isOpen]);

  const updateVehicle = (
    index: number,
    field: keyof Omit<VehicleRow, '_key'>,
    value: string | number | undefined
  ) => {
    setVehicles((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value ?? '' } : v))
    );
  };

  const addVehicle = () =>
    setVehicles((prev) => [...prev, emptyVehicle(keyCounter.current++)]);

  const removeVehicle = (index: number) => {
    setVehicles((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
    );
    setErrors({});
  };

  const errorClass = (key: string) =>
    errors[key] ? 'border-red-500 focus-visible:ring-red-500' : '';

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const goPrevPhoto = (e?: any) => {
    e?.preventDefault();
    e?.stopPropagation();
    setPhotoCarouselIndex((idx) => {
      if (allPhotoUrls.length === 0) return 0;
      return (idx - 1 + allPhotoUrls.length) % allPhotoUrls.length;
    });
  };

  const goNextPhoto = (e?: any) => {
    e?.preventDefault();
    e?.stopPropagation();
    setPhotoCarouselIndex((idx) => {
      if (allPhotoUrls.length === 0) return 0;
      return (idx + 1) % allPhotoUrls.length;
    });
  };

  const setCurrentAsCover = (e?: any) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (allPhotoUrls.length <= 1) return;

    const idx = Math.min(photoCarouselIndex, allPhotoUrls.length - 1);
    if (idx === 0) return;

    if (idx < photoUrls.length) {
      setPhotoUrls((prev) => {
        const picked = prev[idx];
        return [picked, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      });
      setPhotoCarouselIndex(0);
      return;
    }

    const newIdx = idx - photoUrls.length;
    const pickedNew = newPhotoUrls[newIdx];
    if (!pickedNew) return;

    setPhotoUrls((prev) => [pickedNew, ...prev]);
    setNewPhotoUrls((prev) => prev.filter((_, i) => i !== newIdx));
    setPhotoCarouselIndex(0);
  };

  const removeDoc = (index: number) => {
    setDocUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async () => {
    if (!item) return;

    const vehiclesPayload = vehicles.map((v) => ({
      plate: v.plate,
      brand: v.brand,
      model: v.model || undefined,
      year: v.year === '' ? undefined : Number(v.year),
      version: v.version || undefined,
      kilometraje: v.kilometraje === '' ? undefined : Number(v.kilometraje),
    }));

    const parsePayload = {
      vehicles: vehiclesPayload,
      legal_status: legalStatus as LegalStatusEnum,
      basePrice,
    };

    const parsed = itemEditSchema.safeParse(parsePayload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.');
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast({
        title: 'Revisa los datos',
        description: 'Hay campos incompletos o inválidos en el lote.',
        variant: 'destructive',
        duration: 1800,
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const mergedPhotoUrls = [...photoUrls, ...newPhotoUrls];
      const allDocUrls = [...docUrls, ...newDocUrls];

      const requestBody = {
        vehicles: vehiclesPayload,
        legal_status: legalStatus,
        basePrice,
        photos: mergedPhotoUrls.length > 0 ? mergedPhotoUrls.join(', ') : null,
        docs: allDocUrls.length > 0 ? allDocUrls.join(', ') : null,
      };

      const response = await apiFetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'Unknown error' };
        }
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      toast({
        title: 'Éxito',
        description: 'Item actualizado correctamente',
        variant: 'default',
      });

      handleCloseClick();
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Error al actualizar el item',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setVehicles([emptyVehicle(0)]);
      setBasePrice(0);
      setLegalStatus(LegalStatusEnum.TRANSFERIBLE);
      setErrors({});
      setPhotoUrls([]);
      setDocUrls([]);
      setNewPhotoUrls([]);
      setNewDocUrls([]);
      setPhotoCarouselIndex(0);
      onClose();
    }
  };

  const handleCloseClick = () => {
    handleClose(false);
  };

  if (!item) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose(false);
      }}
    >
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onFocusOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Editar Item
          </DialogTitle>
          <DialogDescription>
            Modifica los vehículos y datos del lote
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-6"
        >
          {/* Vehicles */}
          <div className="space-y-4">
            {vehicles.map((vehicle, index) => (
              <div
                key={vehicle._key}
                className="rounded-xl border bg-gray-50/60 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">
                    {vehicles.length > 1 ? `Vehículo ${index + 1}` : 'Vehículo'}
                  </p>
                  {vehicles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVehicle(index)}
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Quitar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Patente (6 caracteres) *</Label>
                    <FormattedInput
                      formatType="plate"
                      placeholder="Ej: ABC123"
                      maxLength={6}
                      value={vehicle.plate}
                      className={errorClass(`vehicles.${index}.plate`)}
                      onChange={(value) =>
                        updateVehicle(index, 'plate', value as string)
                      }
                    />
                    {errors[`vehicles.${index}.plate`] && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors[`vehicles.${index}.plate`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Marca *</Label>
                    <FormattedInput
                      formatType="capitalize"
                      placeholder="Ej: Toyota"
                      value={vehicle.brand}
                      className={errorClass(`vehicles.${index}.brand`)}
                      onChange={(value) =>
                        updateVehicle(index, 'brand', value as string)
                      }
                    />
                    {errors[`vehicles.${index}.brand`] && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors[`vehicles.${index}.brand`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Modelo</Label>
                    <FormattedInput
                      formatType="capitalize"
                      placeholder="Ej: Corolla"
                      value={vehicle.model}
                      onChange={(value) =>
                        updateVehicle(index, 'model', value as string)
                      }
                    />
                  </div>

                  <div>
                    <Label>Año</Label>
                    <FormattedInput
                      formatType="simple-number"
                      placeholder="Ej: 2020"
                      value={vehicle.year}
                      className={errorClass(`vehicles.${index}.year`)}
                      onChange={(value) =>
                        updateVehicle(index, 'year', value as number)
                      }
                    />
                    {errors[`vehicles.${index}.year`] && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors[`vehicles.${index}.year`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Versión</Label>
                    <FormattedInput
                      formatType="capitalize"
                      placeholder="Ej: XEI 1.8"
                      value={vehicle.version}
                      onChange={(value) =>
                        updateVehicle(index, 'version', value as string)
                      }
                    />
                  </div>

                  <div>
                    <Label>Kilometraje</Label>
                    <FormattedInput
                      formatType="number"
                      placeholder="Ej: 50.000"
                      inputMode="numeric"
                      maxLength={7}
                      value={vehicle.kilometraje}
                      onChange={(value) => {
                        const digits = String(value ?? '')
                          .replace(/\D/g, '')
                          .slice(0, 7);
                        updateVehicle(
                          index,
                          'kilometraje',
                          digits ? Number(digits) : ''
                        );
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={addVehicle}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar vehículo
            </Button>
          </div>

          {/* Lot-level fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="basePrice">Precio Base del Lote *</Label>
              <FormattedInput
                id="basePrice"
                formatType="number"
                placeholder="15.000.000"
                value={basePrice || ''}
                onChange={(value) => {
                  const num = typeof value === 'number' ? value : Number(value);
                  setBasePrice(Number.isNaN(num) ? 0 : num);
                }}
                className={errorClass('basePrice')}
              />
              {errors.basePrice && (
                <p className="text-sm text-red-600 mt-1">{errors.basePrice}</p>
              )}
            </div>

            <div>
              <Label htmlFor="legal_status">Estado Legal</Label>
              <Select
                value={legalStatus}
                onValueChange={(value) => setLegalStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado legal" />
                </SelectTrigger>
                <SelectContent className="z-dropdown">
                  <SelectItem value="TRANSFERIBLE">Transferible</SelectItem>
                  <SelectItem value="LEASING">Leasing</SelectItem>
                  <SelectItem value="POSIBILIDAD_DE_EMBARGO">
                    Posibilidad de Embargo
                  </SelectItem>
                  <SelectItem value="PRENDA">Prenda</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Photos Carousel + Cover Selection */}
          {allPhotoUrls.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Foto de presentación
                  </Label>
                  <p className="text-xs text-gray-600">
                    La portada será la imagen que se verá en listados y tarjetas.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={setCurrentAsCover}
                  disabled={allPhotoUrls.length === 0 || photoCarouselIndex === 0}
                >
                  Usar como portada
                </Button>
              </div>

              <div className="rounded-xl border bg-white p-3">
                <div className="relative overflow-hidden rounded-lg bg-gray-50">
                  {photoCarouselIndex === 0 && (
                    <div className="absolute left-2 top-2 z-10 rounded-full bg-black/70 px-2 py-1 text-[11px] font-medium text-white">
                      Portada
                    </div>
                  )}

                  <SafeImage
                    src={allPhotoUrls[photoCarouselIndex]}
                    alt={`Foto ${photoCarouselIndex + 1}`}
                    className="h-[220px] w-full select-none object-contain"
                    draggable={false}
                  />

                  {allPhotoUrls.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goPrevPhoto}
                        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <button
                        type="button"
                        onClick={goNextPhoto}
                        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                        aria-label="Foto siguiente"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {allPhotoUrls.length > 1 && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    {allPhotoUrls.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPhotoCarouselIndex(i);
                        }}
                        className={`h-2.5 w-2.5 rounded-full ${
                          i === photoCarouselIndex ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                        aria-label={`Ir a foto ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Existing Photos */}
          {photoUrls.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Fotos Actuales ({photoUrls.length})
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {photoUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <SafeImage
                        src={url}
                        width={100}
                        height={100}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p
                      className="text-xs text-gray-500 mt-1 truncate"
                      title={getFilenameFromUrl(url)}
                    >
                      {getFilenameFromUrl(url)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Photos Preview (optional) */}
          {newPhotoUrls.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Fotos Nuevas ({newPhotoUrls.length})
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {newPhotoUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={url}
                        width={100}
                        height={100}
                        alt={`Foto nueva ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeNewPhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p
                      className="text-xs text-gray-500 mt-1 truncate"
                      title={getFilenameFromUrl(url)}
                    >
                      {getFilenameFromUrl(url)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Photos */}
          <div>
            <FileUpload
              label="Agregar Nuevas Fotos"
              description="Sube fotos adicionales del producto (máximo 20 archivos)"
              acceptedTypes={['image/*']}
              maxFiles={20}
              maxSizeInMB={5}
              onFilesChange={setNewPhotoUrls}
            />
          </div>

          {/* Existing Documents */}
          {docUrls.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos Actuales ({docUrls.length})
              </Label>
              <div className="space-y-2">
                {docUrls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span
                        className="text-sm truncate"
                        title={getFilenameFromUrl(url)}
                      >
                        {getFilenameFromUrl(url)}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeDoc(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Documents */}
          <div>
            <FileUpload
              label="Agregar Nuevos Documentos"
              description="Sube documentos adicionales (PDF, DOC, etc.)"
              acceptedTypes={['application/pdf', '.doc', '.docx', '.txt']}
              maxFiles={5}
              maxSizeInMB={10}
              onFilesChange={setNewDocUrls}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCloseClick}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Actualizando...' : 'Actualizar Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
