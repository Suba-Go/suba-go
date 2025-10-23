'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ItemCreateDto,
  itemCreateSchema,
  ItemStateEnum,
  LegalStatusEnum,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@suba-go/shared-components/components/ui/select';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { FileUpload } from '@/components/ui/file-upload';
import { FormattedInput } from '@/components/ui/formatted-input';
import { useCompany } from '@/hooks/use-company';

interface ItemCreateModal2Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ItemCreateModal2({
  isOpen,
  onClose,
  onSuccess,
}: ItemCreateModal2Props) {
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
    defaultValues: {
      legal_status: 'TRANSFERIBLE' as any,
    },
  });

  const handleClose = () => {
    reset();
    setPhotoUrls([]);
    setDocUrls([]);
    onClose();
  };

  const onSubmit = async (data: ItemCreateDto) => {
    try {
      setIsLoading(true);

      const formData = {
        ...data,
        state: ItemStateEnum.DISPONIBLE,
        photos: photoUrls.join(','),
        docs: docUrls.join(','),
      };

      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el producto');
      }

      toast({
        title: 'Producto creado',
        description: 'El producto se ha creado exitosamente',
      });

      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Error al crear el producto',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const { company } = useCompany();
  const primaryColor = company?.principal_color || '#3B82F6';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Crear Nuevo Producto (Rápido)
          </DialogTitle>
          <DialogDescription>
            Crea un nuevo producto para incluir en la subasta. Solo los campos
            esenciales.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información básica */}
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
              <Label htmlFor="brand">Marca *</Label>
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
              <Label htmlFor="model">Modelo *</Label>
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
              <Label htmlFor="year">Año *</Label>
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
          </div>

          {/* Precio y estado legal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="basePrice">Precio Base (CLP) *</Label>
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

            <div>
              <Label htmlFor="legal_status">Estado Legal</Label>
              <Select
                onValueChange={(value) =>
                  setValue('legal_status', value as any)
                }
                defaultValue="TRANSFERIBLE"
              >
                <SelectTrigger
                  className={errors.legal_status ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Seleccionar estado legal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LegalStatusEnum.TRANSFERIBLE}>
                    Transferible
                  </SelectItem>
                  <SelectItem value={LegalStatusEnum.LEASING}>
                    Leasing
                  </SelectItem>
                  <SelectItem value={LegalStatusEnum.POSIBILIDAD_DE_EMBARGO}>
                    Posibilidad de Embargo
                  </SelectItem>
                  <SelectItem value={LegalStatusEnum.PRENDA}>Prenda</SelectItem>
                  <SelectItem value={LegalStatusEnum.OTRO}>Otro</SelectItem>
                </SelectContent>
              </Select>
              {errors.legal_status && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.legal_status.message}
                </p>
              )}
            </div>
          </div>

          {/* File uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Fotos del Vehículo
              </Label>
              <FileUpload
                acceptedTypes={['image/*']}
                maxFiles={5}
                maxSizeInMB={5}
                onFilesChange={(urls: string[]) => setPhotoUrls(urls)}
                label="Subir fotos"
                description="Arrastra fotos aquí o haz clic para seleccionar"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos: JPG, PNG, WebP (máx. 5MB cada una)
              </p>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos
              </Label>
              <FileUpload
                acceptedTypes={['.pdf', '.doc', '.docx']}
                maxFiles={3}
                maxSizeInMB={10}
                onFilesChange={(urls: string[]) => setDocUrls(urls)}
                label="Subir documentos"
                description="Arrastra documentos aquí o haz clic para seleccionar"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos: PDF, DOC, DOCX (máx. 10MB cada uno)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: primaryColor,
                borderColor: primaryColor,
                color: 'white',
              }}
              className="hover:opacity-90 transition-opacity"
            >
              {isLoading ? 'Creando...' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
