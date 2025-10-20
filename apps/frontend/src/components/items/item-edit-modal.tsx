'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  ItemDto,
  ItemEditDto,
  itemEditSchema,
} from '@suba-go/shared-validation';
import Image from 'next/image';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: ItemDto | null;
}

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
  } = useForm<ItemEditDto>({
    resolver: zodResolver(itemEditSchema),
  });

  // Load item data when modal opens
  useEffect(() => {
    if (item && isOpen) {
      const formData: ItemEditDto = {
        plate: item.plate || '',
        brand: item.brand || '',
        model: item.model || '',
        year: item.year || undefined,
        version: item.version || '',
        kilometraje: item.kilometraje || undefined,
        legal_status: item.legal_status as any,
        basePrice: item.basePrice || undefined,
      };

      reset(formData);

      // Explicitly set legal_status if it exists
      if (item.legal_status) {
        setValue('legal_status', item.legal_status as any, {
          shouldValidate: true,
          shouldDirty: false,
        });
      }

      // Load existing photos and docs
      if (item.photos) {
        const photos = item.photos.split(',').map((url) => url.trim());
        setPhotoUrls(photos);
      } else {
        setPhotoUrls([]);
      }

      if (item.docs) {
        const docs = item.docs.split(',').map((url) => url.trim());
        setDocUrls(docs);
      } else {
        setDocUrls([]);
      }

      // Reset new uploads
      setNewPhotoUrls([]);
      setNewDocUrls([]);
    }
  }, [item, isOpen, reset, setValue]);

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeDoc = (index: number) => {
    setDocUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ItemEditDto) => {
    if (!item) {
      return;
    }
    setIsLoading(true);

    try {
      // Combine existing and new URLs
      const allPhotoUrls = [...photoUrls, ...newPhotoUrls];
      const allDocUrls = [...docUrls, ...newDocUrls];

      const requestBody = {
        ...data,
        photos: allPhotoUrls.length > 0 ? allPhotoUrls.join(', ') : null,
        docs: allDocUrls.length > 0 ? allDocUrls.join(', ') : null,
      };

      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('\n❌ Response NOT OK - Attempting to parse error...');
        let errorData;
        try {
          errorData = await response.json();
          console.error(
            '❌ Error Response Data:',
            JSON.stringify(errorData, null, 2)
          );
        } catch (parseError) {
          console.error('❌ Could not parse error response as JSON');
          console.error('❌ Parse error:', parseError);
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

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Editar Item
          </DialogTitle>
          <DialogDescription>Modifica los detalles del item</DialogDescription>
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
              <FormattedInput
                id="kilometraje"
                formatType="number"
                placeholder="50.000"
                value={watch('kilometraje')}
                onChange={(value) => setValue('kilometraje', value as number)}
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
              <FormattedInput
                id="basePrice"
                formatType="number"
                placeholder="15.000.000"
                value={watch('basePrice')}
                onChange={(value) => setValue('basePrice', value as number)}
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
                value={watch('legal_status') || item?.legal_status || ''}
                onValueChange={(value) =>
                  setValue('legal_status', value as any)
                }
              >
                <SelectTrigger
                  className={errors.legal_status ? 'border-red-500' : ''}
                >
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
              {errors.legal_status && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.legal_status.message}
                </p>
              )}
            </div>
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
                      <Image
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
              {isLoading ? 'Actualizando...' : 'Actualizar Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
