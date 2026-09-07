'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  itemCreateSchema,
  LegalStatusEnum,
  ItemStateEnum,
} from '@suba-go/shared-validation';
import {
  Car,
  Upload,
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
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { apiFetch } from '@/lib/api/api-fetch';
import { FileUpload } from '@/components/ui/file-upload';
import { FormattedInput } from '@/components/ui/formatted-input';
import { useCompany } from '@/hooks/use-company';
import { SafeImage } from '@/components/ui/safe-image';

interface ItemCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subdomain?: string;
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

export function ItemCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: ItemCreateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoCarouselIndex, setPhotoCarouselIndex] = useState(0);
  const [docUrls, setDocUrls] = useState<string[]>([]);

  // Vehicles of the lot (at least one). Managed in local state so we can
  // add/remove rows; price and legal status are shared by the whole lot.
  const keyCounter = useRef(1);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([emptyVehicle(0)]);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [legalStatus, setLegalStatus] = useState<LegalStatusEnum>(
    LegalStatusEnum.TRANSFERIBLE
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const { company } = useCompany();
  const primaryColor = company?.principal_color || '#3B82F6';

  const isUploadingFiles = isUploadingPhotos || isUploadingDocs;

  // Keep carousel index valid when photos change
  useEffect(() => {
    setPhotoCarouselIndex((idx) => {
      if (photoUrls.length === 0) return 0;
      return Math.min(idx, photoUrls.length - 1);
    });
  }, [photoUrls.length]);

  // Create dynamic style for focus ring and border
  const inputFocusStyle = useMemo(
    () =>
      ({
        '--tw-ring-color': primaryColor,
      } as React.CSSProperties),
    [primaryColor]
  );

  const errorClass = (key: string) =>
    errors[key] ? 'border-red-500 focus-visible:ring-red-500' : '';

  const updateVehicle = (
    index: number,
    field: keyof Omit<VehicleRow, '_key'>,
    value: string | number | undefined
  ) => {
    setVehicles((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value ?? '' } : v))
    );
  };

  const addVehicle = () => {
    setVehicles((prev) => [...prev, emptyVehicle(keyCounter.current++)]);
  };

  const removeVehicle = (index: number) => {
    setVehicles((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
    );
    // Drop any stale errors for removed rows
    setErrors({});
  };

  const resetForm = () => {
    keyCounter.current = 1;
    setVehicles([emptyVehicle(0)]);
    setBasePrice(0);
    setLegalStatus(LegalStatusEnum.TRANSFERIBLE);
    setErrors({});
    setPhotoUrls([]);
    setPhotoCarouselIndex(0);
    setDocUrls([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const onSubmit = async () => {
    // Build a validation payload matching the shared item create schema.
    const parsePayload = {
      vehicles: vehicles.map((v) => ({
        plate: v.plate,
        brand: v.brand,
        model: v.model || undefined,
        year: v.year === '' ? undefined : Number(v.year),
        version: v.version || undefined,
        kilometraje: v.kilometraje === '' ? undefined : Number(v.kilometraje),
      })),
      legal_status: legalStatus,
      basePrice,
      photos: photoUrls,
    };

    const parsed = itemCreateSchema.safeParse(parsePayload);
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
      const submitData = {
        vehicles: parsePayload.vehicles,
        legal_status: legalStatus,
        basePrice,
        state: ItemStateEnum.DISPONIBLE,
        photos: photoUrls.length > 0 ? photoUrls.join(',') : undefined,
        docs: docUrls.length > 0 ? docUrls.join(',') : undefined,
      };

      const response = await apiFetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el producto');
      }

      toast({
        title: 'Éxito',
        description:
          vehicles.length > 1
            ? `Lote de ${vehicles.length} vehículos creado correctamente`
            : 'Producto creado correctamente',
        variant: 'default',
        duration: 1000,
      });

      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo crear el producto.',
        variant: 'destructive',
        duration: 1500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goPrevPhoto = (e?: any) => {
    e?.preventDefault();
    e?.stopPropagation();
    setPhotoCarouselIndex((idx) => {
      if (photoUrls.length === 0) return 0;
      return (idx - 1 + photoUrls.length) % photoUrls.length;
    });
  };

  const goNextPhoto = (e?: any) => {
    e?.preventDefault();
    e?.stopPropagation();
    setPhotoCarouselIndex((idx) => {
      if (photoUrls.length === 0) return 0;
      return (idx + 1) % photoUrls.length;
    });
  };

  const setCurrentAsCover = (e?: any) => {
    e?.preventDefault();
    e?.stopPropagation();
    setPhotoUrls((prev) => {
      if (prev.length <= 1) return prev;
      const idx = Math.min(photoCarouselIndex, prev.length - 1);
      if (idx === 0) return prev;
      const next = [prev[idx], ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      return next;
    });
    setPhotoCarouselIndex(0);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (isUploadingFiles) return;
          handleClose();
        }
      }}
    >
      <DialogContent
        className="max-w-[41.5rem] max-h-[90vh] overflow-y-auto bg-white"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onFocusOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isUploadingFiles) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Crear Nuevo Producto
          </DialogTitle>
          <DialogDescription>
            Ingresa uno o más vehículos. Si agregas varios, se crea un lote con
            un único precio.
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
                    {vehicles.length > 1
                      ? `Vehículo ${index + 1}`
                      : 'Vehículo'}
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
                      style={
                        errors[`vehicles.${index}.plate`]
                          ? undefined
                          : inputFocusStyle
                      }
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
                      style={
                        errors[`vehicles.${index}.brand`]
                          ? undefined
                          : inputFocusStyle
                      }
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
                      style={inputFocusStyle}
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
                      style={
                        errors[`vehicles.${index}.year`]
                          ? undefined
                          : inputFocusStyle
                      }
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
                      style={inputFocusStyle}
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
                      className={errorClass(`vehicles.${index}.kilometraje`)}
                      style={
                        errors[`vehicles.${index}.kilometraje`]
                          ? undefined
                          : inputFocusStyle
                      }
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
                    {errors[`vehicles.${index}.kilometraje`] && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors[`vehicles.${index}.kilometraje`]}
                      </p>
                    )}
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
              <Label htmlFor="basePrice">
                Precio Base del Lote (CLP) *
              </Label>
              <FormattedInput
                id="basePrice"
                formatType="price"
                placeholder="Ej: $5.000.000"
                value={basePrice || ''}
                className={errorClass('basePrice')}
                style={errors.basePrice ? undefined : inputFocusStyle}
                onChange={(value) => {
                  const numValue =
                    typeof value === 'number' ? value : Number(value);
                  setBasePrice(Number.isNaN(numValue) ? 0 : numValue);
                }}
              />
              {errors.basePrice && (
                <p className="text-sm text-red-600 mt-1">{errors.basePrice}</p>
              )}
            </div>

            <div>
              <Label htmlFor="legal_status">Estado Legal</Label>
              <select
                id="legal_status"
                value={legalStatus}
                onChange={(e) =>
                  setLegalStatus(e.target.value as LegalStatusEnum)
                }
                className="w-full px-3 py-2 border rounded-md text-sm bg-transparent"
              >
                {Object.entries(LegalStatusEnum).map(([key, value]) => (
                  <option key={key} value={key}>
                    {(value as string).charAt(0).toUpperCase() +
                      (value as string).slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Upload className="h-4 w-4" />
                Fotos del Lote
              </Label>
              <FileUpload
                acceptedTypes={['image/*']}
                maxFiles={20}
                maxSizeInMB={5}
                onFilesChange={setPhotoUrls}
                onUploadStatusChange={setIsUploadingPhotos}
                label="Subir fotos"
                description="Arrastra fotos aquí o haz clic para seleccionar"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos: JPG, PNG, WebP (máx. 5MB cada una)
              </p>

              {photoUrls.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Foto de presentación
                      </p>
                      <p className="text-xs text-gray-600">
                        La portada será la imagen que se verá en listados y
                        tarjetas.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={setCurrentAsCover}
                      disabled={
                        photoUrls.length === 0 || photoCarouselIndex === 0
                      }
                    >
                      Usar como portada
                    </Button>
                  </div>

                  <div className="mt-3 rounded-xl border bg-white p-3">
                    <div className="relative overflow-hidden rounded-lg bg-gray-50">
                      {photoCarouselIndex === 0 && (
                        <div className="absolute left-2 top-2 z-10 rounded-full bg-black/70 px-2 py-1 text-[11px] font-medium text-white">
                          Portada
                        </div>
                      )}

                      <SafeImage
                        src={photoUrls[photoCarouselIndex]}
                        alt={`Foto ${photoCarouselIndex + 1}`}
                        className="h-[220px] w-full select-none object-contain"
                        draggable={false}
                      />

                      {photoUrls.length > 1 && (
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

                    {photoUrls.length > 1 && (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        {photoUrls.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPhotoCarouselIndex(i);
                            }}
                            className={`h-2.5 w-2.5 rounded-full ${
                              i === photoCarouselIndex
                                ? 'bg-blue-500'
                                : 'bg-gray-300'
                            }`}
                            aria-label={`Ir a foto ${i + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Documentos
              </Label>
              <FileUpload
                acceptedTypes={['application/pdf', '.doc', '.docx']}
                maxFiles={5}
                maxSizeInMB={10}
                onFilesChange={setDocUrls}
                onUploadStatusChange={setIsUploadingDocs}
                label="Subir documentos"
                description="Arrastra documentos aquí o haz clic para seleccionar"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos: PDF, DOC, DOCX (máx. 10MB cada uno)
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploadingFiles}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploadingFiles}
              style={{
                backgroundColor: primaryColor,
                borderColor: primaryColor,
                color: 'white',
                opacity: isLoading || isUploadingFiles ? 0.7 : 1,
              }}
              className="hover:opacity-90 transition-opacity"
            >
              {isLoading
                ? 'Creando...'
                : isUploadingFiles
                ? 'Subiendo archivos...'
                : vehicles.length > 1
                ? 'Crear Lote'
                : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
