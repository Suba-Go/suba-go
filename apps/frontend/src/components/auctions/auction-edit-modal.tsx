'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, Package } from 'lucide-react';
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
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { Switch } from '@suba-go/shared-components/components/ui/switch';
import { ItemSelector } from './item-selector';
import { useCompany } from '@/hooks/use-company';
import {
  auctionCreateSchema,
  AuctionTypeEnum,
  type AuctionCreateDto,
} from '@suba-go/shared-validation';
import type { AuctionData } from '@/types/auction.types';

interface AuctionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  auction: AuctionData | null;
}

export function AuctionEditModal({
  isOpen,
  onClose,
  onSuccess,
  auction,
}: AuctionEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isTestAuction, setIsTestAuction] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(auctionCreateSchema),
  });

  // Duration options
  const durationOptions = [
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 45, label: '45 minutos' },
    { value: 60, label: '1 hora' },
    { value: 120, label: '2 horas' },
    { value: 300, label: '5 horas' },
  ];

  // Load auction data when modal opens
  useEffect(() => {
    if (auction && isOpen) {
      const startTime = new Date(auction.startTime);
      const endTime = new Date(auction.endTime);
      const durationMinutes = Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      );

      // Extract selected item IDs
      const itemIds =
        auction.items
          ?.map((item) => item.item?.id)
          .filter((id): id is string => Boolean(id)) || [];
      setSelectedItems(itemIds);

      // Set test auction state
      setIsTestAuction(auction.type === AuctionTypeEnum.TEST);

      reset({
        title: auction.title,
        description: auction.description || '',
        startDate: startTime,
        startTime: startTime.toTimeString().slice(0, 5), // HH:MM format
        durationMinutes: durationMinutes,
        selectedItems: itemIds,
        type: (auction.type as AuctionTypeEnum) || AuctionTypeEnum.REAL,
      });
    }
  }, [auction, isOpen, reset]);

  const onSubmit = async (
    data: AuctionCreateDto & { selectedItems: string[] }
  ) => {
    if (!auction) return;

    // Check if auction has already started
    const now = new Date();
    const auctionStart = new Date(auction.startTime);

    if (auctionStart <= now) {
      toast({
        title: 'Error',
        description: 'No se puede editar una subasta que ya ha comenzado',
        variant: 'destructive',
      });
      return;
    }

    // Validar que hay items seleccionados
    if (!data.selectedItems || data.selectedItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar al menos un item para la subasta',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Combinar fecha y hora para crear startTime
      const [hours, minutes] = data.startTime.split(':');
      const startDateTime = new Date(data.startDate);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Calcular endTime basado en la duración
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + data.durationMinutes);

      const requestBody = {
        title: data.title,
        description: data.description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        selectedItems: data.selectedItems,
        type: isTestAuction ? AuctionTypeEnum.TEST : AuctionTypeEnum.REAL,
      };

      const response = await fetch(`/api/auctions/${auction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al actualizar la subasta');
      }

      toast({
        title: 'Éxito',
        description: 'Subasta actualizada correctamente',
        variant: 'default',
      });

      handleCloseClick();
      onSuccess();
    } catch (error) {
      console.error('Error updating auction:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Error al actualizar la subasta',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (open?: boolean) => {
    if (open === false || open === undefined) {
      reset();
      setSelectedItems([]);
      setIsTestAuction(false);
      onClose();
    }
  };

  const handleCloseClick = () => {
    handleClose(false);
  };

  const { company } = useCompany();
  const primaryColor = company?.principal_color || '#3B82F6';

  if (!auction) return null;

  // Check if auction can be edited
  const now = new Date();
  const auctionStart = new Date(auction.startTime);
  const canEdit = auctionStart > now;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editar Subasta
          </DialogTitle>
          <DialogDescription>
            {canEdit
              ? 'Modifica los detalles de la subasta antes de que comience'
              : 'Esta subasta ya ha comenzado y no puede ser editada'}
          </DialogDescription>
        </DialogHeader>

        {!canEdit ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Esta subasta ya ha comenzado y no puede ser modificada.
            </p>
            <Button onClick={handleCloseClick}>Cerrar</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Título de la Subasta *
                </Label>
                <Input
                  id="title"
                  placeholder="Ej: Subasta de Vehículos Enero 2024"
                  {...register('title')}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción opcional de la subasta..."
                  {...register('description')}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha de Inicio *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate', { valueAsDate: true })}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hora de Inicio *
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register('startTime')}
                  className={errors.startTime ? 'border-red-500' : ''}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.startTime.message}
                  </p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div>
              <Label
                htmlFor="durationMinutes"
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Duración *
              </Label>
              <select
                id="durationMinutes"
                {...register('durationMinutes', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.durationMinutes && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.durationMinutes.message}
                </p>
              )}
            </div>

            {/* Auction Type */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Tipo de Subasta</Label>
                <p className="text-sm text-gray-600">
                  Las subastas de prueba no aparecen en estadísticas
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm ${
                    !isTestAuction
                      ? 'font-medium text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  Real
                </span>
                <Switch
                  checked={isTestAuction}
                  onCheckedChange={setIsTestAuction}
                />
                <span
                  className={`text-sm ${
                    isTestAuction
                      ? 'font-medium text-orange-600'
                      : 'text-gray-500'
                  }`}
                >
                  Prueba
                </span>
              </div>
            </div>

            {/* Item Selection */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4" />
                Seleccionar Items *
              </Label>
              <ItemSelector
                selectedItems={selectedItems}
                onItemsChange={(items) => {
                  setSelectedItems(items);
                  setValue('selectedItems', items);
                }}
              />
              {selectedItems.length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Debe seleccionar al menos un item
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseClick}
              >
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
                {isLoading ? 'Actualizando...' : 'Actualizar Subasta'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
