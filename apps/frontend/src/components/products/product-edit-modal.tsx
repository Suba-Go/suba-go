'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LegalStatusEnum, ItemStateEnum } from '@suba-go/shared-validation';
import { Car, X, Image as ImageIcon, FileText } from 'lucide-react';
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
import { FileUpload } from '@/components/ui/file-upload';

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
  const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([]);
  const [newDocUrls, setNewDocUrls] = useState<string[]>([]);
  const { toast } = useToast();

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
      console.log('Loading product data into form:', product);
      console.log('Product legal_status:', product.legal_status);

      const formData = {
        plate: product.plate || '',
        brand: product.brand || '',
        model: product.model || '',
        year: product.year || undefined,
        version: product.version || '',
        kilometraje: product.kilometraje || undefined,
        legal_status: product.legal_status as LegalStatusEnum | undefined,
        state: product.state as ItemStateEnum,
        basePrice: product.basePrice || undefined,
        description: product.description || '',
      };

      console.log('Form data to reset:', formData);
      reset(formData);

      // Explicitly set legal_status if it exists
      if (product.legal_status) {
        setValue('legal_status', product.legal_status as LegalStatusEnum, {
          shouldValidate: true,
          shouldDirty: false,
        });
        console.log('Set legal_status to:', product.legal_status);
      }

      // Load existing photos and docs
      if (product.photos) {
        setPhotoUrls(product.photos.split(',').map((url) => url.trim()));
      } else {
        setPhotoUrls([]);
      }
      if (product.docs) {
        setDocUrls(product.docs.split(',').map((url) => url.trim()));
      } else {
        setDocUrls([]);
      }

      // Reset new uploads
      setNewPhotoUrls([]);
      setNewDocUrls([]);
    }
  }, [product, isOpen, reset, setValue]);

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeDoc = (index: number) => {
    setDocUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductEditFormData) => {
    console.log('=== PRODUCT UPDATE STARTED ===');
    console.log('onSubmit called with data:', data);
    console.log('Product:', product);
    console.log('Form errors:', errors);
    console.log('Form is valid:', Object.keys(errors).length === 0);

    if (!product) {
      console.error('No product selected');
      return;
    }

    setIsLoading(true);
    try {
      // Combine existing and new URLs
      const allPhotoUrls = [...photoUrls, ...newPhotoUrls];
      const allDocUrls = [...docUrls, ...newDocUrls];

      console.log('Photo URLs:', {
        existing: photoUrls,
        new: newPhotoUrls,
        all: allPhotoUrls,
      });
      console.log('Doc URLs:', {
        existing: docUrls,
        new: newDocUrls,
        all: allDocUrls,
      });

      const requestBody = {
        ...data,
        photos: allPhotoUrls.length > 0 ? allPhotoUrls.join(', ') : null,
        docs: allDocUrls.length > 0 ? allDocUrls.join(', ') : null,
      };

      console.log('Request body:', requestBody);
      console.log('Updating product with ID:', product.id);
      console.log('API endpoint:', `/api/items/${product.id}`);

      const response = await fetch(`/api/items/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Error al actualizar el producto');
      }

      const result = await response.json();
      console.log('Update successful:', result);
      console.log('=== PRODUCT UPDATE COMPLETED ===');

      toast({
        title: 'Éxito',
        description: 'Producto actualizado correctamente',
        variant: 'default',
      });

      handleCloseClick();
      onSuccess();
    } catch (error) {
      console.error('=== PRODUCT UPDATE FAILED ===');
      console.error('Error updating product:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', error);

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
      setNewPhotoUrls([]);
      setNewDocUrls([]);
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
                      <img
                        src={url}
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

          {/* Upload New Photos */}
          <div>
            <FileUpload
              label="Agregar Nuevas Fotos"
              description="Sube fotos adicionales del producto (máximo 10 archivos)"
              acceptedTypes={['image/*']}
              maxFiles={10}
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
              {isLoading ? 'Actualizando...' : 'Actualizar Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
