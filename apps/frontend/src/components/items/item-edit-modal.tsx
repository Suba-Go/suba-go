'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeImage } from '@/components/ui/safe-image';
import {
  Car,
  X,
  Image as ImageIcon,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
import { apiFetch } from '@/lib/api/api-fetch';
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
  const [photoCarouselIndex, setPhotoCarouselIndex] = useState(0);
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
      setPhotoCarouselIndex(0);
    }
  }, [item, isOpen, reset, setValue]);

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

  /**
   * Sets the current carousel photo as cover.
   * The cover is defined as the first photo in the final `photos` list.
   */
  const setCurrentAsCover = (e?: any) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (allPhotoUrls.length <= 1) return;

    const idx = Math.min(photoCarouselIndex, allPhotoUrls.length - 1);
    if (idx === 0) return;

    // If cover is from existing photos, reorder inside `photoUrls`.
    if (idx < photoUrls.length) {
      setPhotoUrls((prev) => {
        const picked = prev[idx];
        const next = [picked, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
        return next;
      });
      setPhotoCarouselIndex(0);
      return;
    }

    // If cover is from newly uploaded photos, move it to the front of `photoUrls`
    // so it becomes the first element in the final merged list.
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

      const response = await apiFetch(`/api/items/${item.id}`, {
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
        // Only close when the dialog is actually being closed.
        // This avoids accidental closes when Radix fires focus-outside events
        // (e.g. when the native file picker opens).
        if (!open) handleClose(false);
      }}
    >
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onFocusOutside={(e) => {
          // Prevent the dialog from closing when the browser opens the native file picker.
          e.preventDefault();
        }}
      >
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
                inputMode="numeric"
                onKeyDown={(e) => {
                  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
                  if (allowed.includes(e.key)) return;

                  // solo permitir dígitos
                  if (!/^\d$/.test(e.key)) {
                    e.preventDefault();
                    return;
                  }

                  // contar dígitos actuales (sin puntos/espacios)
                  const currentDigits = (e.currentTarget as HTMLInputElement).value.replace(/\D/g, '').length;
                  if (currentDigits >= 7) e.preventDefault(); // 👈 bloquea el 7º dígito
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text');
                  const digits = pasted.replace(/\D/g, '');
                  const currentDigits = (e.currentTarget as HTMLInputElement).value.replace(/\D/g, '');
                  if ((currentDigits + digits).length > 7) {
                    e.preventDefault(); // 👈 bloquea pegado que exceda 6 dígitos
                  }
                }}
                onChange={(value) => {
                  // respaldo: asegura que el valor guardado tampoco supere 6 dígitos
                  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 7);
                  const next = digits ? Number(digits) : 0;
                  setValue('kilometraje', next, { shouldValidate: true, shouldDirty: true });
                }}
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
                  {/* Cover badge */}
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