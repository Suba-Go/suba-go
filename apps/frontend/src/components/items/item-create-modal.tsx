'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  itemCreateSchema,
  ItemCreateDto,
  LegalStatusEnum,
} from '@suba-go/shared-validation';
import { Car } from 'lucide-react';
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
import { FileUpload } from '@/components/ui/file-upload';
import { FormattedInput } from '@/components/ui/formatted-input';

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
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [docUrls, setDocUrls] = useState<string[]>([]);
  const { toast } = useToast();

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ItemCreateDto>({
    resolver: zodResolver(itemCreateSchema),
  });

  const onSubmit = async (data: ItemCreateDto) => {
    setIsLoading(true);
    try {
      // Prepare data with file URLs and convert enum key to Prisma enum value
      const submitData = {
        ...data,
        // Convert enum key to Prisma enum key (they are the same)
        legal_status: data.legal_status || undefined,
        photos: photoUrls.length > 0 ? photoUrls.join(',') : undefined,
        docs: docUrls.length > 0 ? docUrls.join(',') : undefined,
      };

      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Error al crear el producto');
      }

      toast({
        title: 'Éxito',
        description: 'Producto creado correctamente',
      });

      reset();
      setPhotoUrls([]);
      setDocUrls([]);
      onSuccess();
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el producto. Inténtalo de nuevo.',
        variant: 'destructive',
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Crear Nuevo Producto
          </DialogTitle>
          <DialogDescription>
            Ingresa los detalles del producto que quieres agregar al inventario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Información Básica</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plate">Patente (6 caracteres)</Label>
                <FormattedInput
                  id="plate"
                  formatType="plate"
                  placeholder="Ej: ABC123"
                  maxLength={6}
                  className={errors.plate ? 'border-red-500' : ''}
                  onChange={(value) => setValue('plate', value as string)}
                />
                {errors.plate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.plate.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="brand">Marca</Label>
                <FormattedInput
                  id="brand"
                  formatType="capitalize"
                  placeholder="Ej: Toyota"
                  className={errors.brand ? 'border-red-500' : ''}
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
                  className={errors.model ? 'border-red-500' : ''}
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
                  className={errors.year ? 'border-red-500' : ''}
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
                  className={errors.version ? 'border-red-500' : ''}
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
                  className={errors.kilometraje ? 'border-red-500' : ''}
                  onChange={(value) => setValue('kilometraje', value as number)}
                />
                {errors.kilometraje && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.kilometraje.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="legal_status">Estado Legal</Label>
              <select
                id="legal_status"
                onChange={(e) =>
                  setValue('legal_status', e.target.value as any)
                }
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.legal_status ? 'border-red-500' : 'border-gray-300'
                }`}
                defaultValue=""
              >
                <option value="">Seleccionar estado legal</option>
                {Object.entries(LegalStatusEnum).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value as LegalStatusEnum}
                  </option>
                ))}
              </select>
              {errors.legal_status && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.legal_status.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="basePrice">Precio Base (CLP)</Label>
              <FormattedInput
                id="basePrice"
                formatType="price"
                placeholder="Ej: $5.000.000"
                className={errors.basePrice ? 'border-red-500' : ''}
                onChange={(value) => setValue('basePrice', value as number)}
              />
              {errors.basePrice && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.basePrice.message}
                </p>
              )}
            </div>
          </div>

          {/* Files */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Archivos</h3>

            <FileUpload
              label="Fotos del Producto"
              description="Sube fotos del producto (máximo 10 archivos)"
              acceptedTypes={['image/*']}
              maxFiles={10}
              maxSizeInMB={5}
              onFilesChange={setPhotoUrls}
            />

            <FileUpload
              label="Documentos"
              description="Sube documentos relacionados (PDF, DOC, etc.)"
              acceptedTypes={['application/pdf', '.doc', '.docx', '.txt']}
              maxFiles={5}
              maxSizeInMB={10}
              onFilesChange={setDocUrls}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
