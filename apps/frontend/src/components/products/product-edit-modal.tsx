'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LegalStatusEnum, ItemStateEnum } from '@suba-go/shared-validation';
import { Car } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@suba-go/shared-components/components/ui/dialog';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Textarea } from '@suba-go/shared-components/components/ui/textarea';
import { Label } from '@suba-go/shared-components/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@suba-go/shared-components/components/ui/select';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';

const productEditSchema = z.object({
  plate: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().positive().optional(),
  version: z.string().optional(),
  kilometraje: z.number().int().positive().optional(),
  legal_status: z.nativeEnum(LegalStatusEnum).optional(),
  state: z.nativeEnum(ItemStateEnum),
  basePrice: z.number().positive().optional(),
  description: z.string().optional(),
});

type ProductEditFormData = z.infer<typeof productEditSchema>;

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
  basePrice?: number;
  description?: string;
  photos?: string;
  docs?: string;
}

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
}

export function ProductEditModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: ProductEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [docUrls, setDocUrls] = useState<string[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProductEditFormData>({
    resolver: zodResolver(productEditSchema),
  });

  // Load product data when modal opens
  useEffect(() => {
    if (product && isOpen) {
      reset({
        plate: product.plate || '',
        brand: product.brand || '',
        model: product.model || '',
        year: product.year || undefined,
        version: product.version || '',
        kilometraje: product.kilometraje || undefined,
        legal_status: (product.legal_status as LegalStatusEnum) || undefined,
        state: product.state as ItemStateEnum,
        basePrice: product.basePrice || undefined,
        description: product.description || '',
      });

      // Load existing photos and docs
      if (product.photos) {
        setPhotoUrls(product.photos.split(',').map((url) => url.trim()));
      }
      if (product.docs) {
        setDocUrls(product.docs.split(',').map((url) => url.trim()));
      }
    }
  }, [product, isOpen, reset]);

  const onSubmit = async (data: ProductEditFormData) => {
    if (!product) return;

    setIsLoading(true);
    try {
      const requestBody = {
        ...data,
        photos: photoUrls.length > 0 ? photoUrls.join(', ') : null,
        docs: docUrls.length > 0 ? docUrls.join(', ') : null,
      };

      const response = await fetch(`/api/items/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al actualizar el producto');
      }

      toast({
        title: 'Éxito',
        description: 'Producto actualizado correctamente',
        variant: 'default',
      });

      handleCloseClick();
      onSuccess();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Error al actualizar el producto',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      reset();
      setPhotoUrls([]);
      setDocUrls([]);
      onClose();
    }
  };

  const handleCloseClick = () => {
    handleClose(false);
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Editar Producto
          </DialogTitle>
          <DialogDescription>
            Modifica los detalles del producto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plate">Placa</Label>
              <Input
                id="plate"
                placeholder="ABC123"
                {...register('plate')}
                className={errors.plate ? 'border-red-500' : ''}
              />
              {errors.plate && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.plate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                placeholder="Toyota"
                {...register('brand')}
                className={errors.brand ? 'border-red-500' : ''}
              />
              {errors.brand && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.brand.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                placeholder="Corolla"
                {...register('model')}
                className={errors.model ? 'border-red-500' : ''}
              />
              {errors.model && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.model.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                placeholder="2020"
                {...register('year', { valueAsNumber: true })}
                className={errors.year ? 'border-red-500' : ''}
              />
              {errors.year && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.year.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="version">Versión</Label>
              <Input
                id="version"
                placeholder="XEI 1.8"
                {...register('version')}
                className={errors.version ? 'border-red-500' : ''}
              />
              {errors.version && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.version.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="kilometraje">Kilometraje</Label>
              <Input
                id="kilometraje"
                type="number"
                placeholder="50000"
                {...register('kilometraje', { valueAsNumber: true })}
                className={errors.kilometraje ? 'border-red-500' : ''}
              />
              {errors.kilometraje && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.kilometraje.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="basePrice">Precio Base</Label>
              <Input
                id="basePrice"
                type="number"
                placeholder="15000000"
                {...register('basePrice', { valueAsNumber: true })}
                className={errors.basePrice ? 'border-red-500' : ''}
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
                value={watch('legal_status') || product?.legal_status || ''}
                onValueChange={(value) =>
                  setValue('legal_status', value as LegalStatusEnum)
                }
              >
                <SelectTrigger
                  className={errors.legal_status ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Seleccionar estado legal" />
                </SelectTrigger>
                <SelectContent className="z-dropdown">
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

          {/* Description */}
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Descripción detallada del vehículo..."
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCloseClick}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Actualizando...' : 'Actualizar Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
