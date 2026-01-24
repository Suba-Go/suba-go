'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  itemCreateSchema,
  ItemCreateDto,
  LegalStatusEnum,
  ItemStateEnum,
} from '@suba-go/shared-validation';
import { Car, Upload, FileText } from 'lucide-react';
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

interface ItemCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subdomain?: string;
}

export function ItemCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: ItemCreateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [docUrls, setDocUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const { company } = useCompany();
  const primaryColor = company?.principal_color || '#3B82F6';

  const isUploadingFiles = isUploadingPhotos || isUploadingDocs;

  // Create dynamic style for focus ring and border
  const inputFocusStyle = useMemo(
    () =>
      ({
        '--tw-ring-color': primaryColor,
      } as React.CSSProperties),
    [primaryColor]
  );

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ItemCreateDto>({
    resolver: zodResolver(itemCreateSchema),
    defaultValues: {
      legal_status: LegalStatusEnum.TRANSFERIBLE,
      plate: '',
      brand: '',
      basePrice: 0,
    },
  });

  const onSubmit = async (data: ItemCreateDto) => {
    setIsLoading(true);
    try {
      const submitData = {
        ...data,
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
        description: 'Producto creado correctamente',
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

  const handleClose = () => {
    reset();
    setPhotoUrls([]);
    setDocUrls([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[41.5rem] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Crear Nuevo Producto
          </DialogTitle>
          <DialogDescription>
            Ingresa los detalles del producto que quieres agregar al inventario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plate">Patente (6 caracteres) *</Label>
              <FormattedInput
                id="plate"
                formatType="plate"
                placeholder="Ej: ABC123"
                maxLength={6}
                className={
                  errors.plate
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }
                style={errors.plate ? undefined : inputFocusStyle}
                onChange={(value) => setValue('plate', value as string)}
              />
              {errors.plate && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.plate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="brand">Marca *</Label>
              <FormattedInput
                id="brand"
                formatType="capitalize"
                placeholder="Ej: Toyota"
                className={
                  errors.brand
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }
                style={errors.brand ? undefined : inputFocusStyle}
                onChange={(value) => setValue('brand', value as string)}
              />
              {errors.brand && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.brand.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="model">Modelo</Label>
              <FormattedInput
                id="model"
                formatType="capitalize"
                placeholder="Ej: Corolla"
                className={
                  errors.model
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }
                style={errors.model ? undefined : inputFocusStyle}
                onChange={(value) => setValue('model', value as string)}
              />
              {errors.model && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.model.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="year">Año</Label>
              <FormattedInput
                id="year"
                formatType="simple-number"
                placeholder="Ej: 2020"
                className={
                  errors.year ? 'border-red-500 focus-visible:ring-red-500' : ''
                }
                style={errors.year ? undefined : inputFocusStyle}
                onChange={(value) => setValue('year', value as number)}
              />
              {errors.year && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.year.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="version">Versión</Label>
              <FormattedInput
                id="version"
                formatType="capitalize"
                placeholder="Ej: XEI 1.8"
                className={
                  errors.version
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }
                style={errors.version ? undefined : inputFocusStyle}
                onChange={(value) => setValue('version', value as string)}
              />
              {errors.version && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.version.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="kilometraje">Kilometraje</Label>
              <FormattedInput
                id="kilometraje"
                formatType="number"
                placeholder="Ej: 50.000"
                inputMode="numeric"
                maxLength={7} // 👈 NO deja más de 6 caracteres en el textbox
                className={
                  errors.kilometraje
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }
                style={errors.kilometraje ? undefined : inputFocusStyle}
                onChange={(value) => {
                  // esto queda como respaldo por si pegan con separadores
                  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 7);
                  const next = digits ? Number(digits) : 0;
                  setValue('kilometraje', next, { shouldValidate: true, shouldDirty: true });
                }}
              />
              {errors.kilometraje && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.kilometraje.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="basePrice">Precio Base (CLP) *</Label>
              <FormattedInput
                id="basePrice"
                formatType="price"
                placeholder="Ej: $5.000.000"
                className={
                  errors.basePrice
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }
                style={errors.basePrice ? undefined : inputFocusStyle}
                onChange={(value) => {
                  const numValue =
                    typeof value === 'number' ? value : Number(value);
                  setValue('basePrice', numValue, { shouldValidate: true });
                }}
              />
              {errors.basePrice && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.basePrice.message ||
                    'El precio base debe ser un número positivo'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="legal_status">Estado Legal</Label>
              <select
                id="legal_status"
                onChange={(e) =>
                  setValue('legal_status', e.target.value as LegalStatusEnum)
                }
                className={`w-full px-3 py-2 border rounded-md text-sm bg-transparent ${
                  errors.legal_status ? 'border-red-500' : ''
                }`}
                defaultValue="TRANSFERIBLE"
              >
                {Object.entries(LegalStatusEnum).map(([key, value]) => (
                  <option key={key} value={key}>
                    {(value as string).charAt(0).toUpperCase() +
                      (value as string).slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              {errors.legal_status && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.legal_status.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Upload className="h-4 w-4" />
                Fotos del Vehículo
              </Label>
              <FileUpload
                acceptedTypes={['image/*']}
                maxFiles={10}
                maxSizeInMB={5}
                onFilesChange={setPhotoUrls}
                onUploadStatusChange={setIsUploadingPhotos}
                label="Subir fotos"
                description="Arrastra fotos aquí o haz clic para seleccionar"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos: JPG, PNG, WebP (máx. 5MB cada una)
              </p>
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
            <Button type="button" variant="outline" onClick={handleClose}>
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
                : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
