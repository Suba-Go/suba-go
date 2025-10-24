'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, DollarSign, Package } from 'lucide-react';
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
import { DateInput } from '@/components/ui/date-input';
import { TimeInput } from '@/components/ui/time-input';
import {
  auctionCreateSchema,
  AuctionTypeEnum,
  type AuctionCreateDto,
} from '@suba-go/shared-validation';

interface AuctionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuctionCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: AuctionCreateModalProps) {
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
    control,
  } = useForm({
    resolver: zodResolver(auctionCreateSchema),
    defaultValues: {
      bidIncrement: 50000,
      durationMinutes: 30,
      selectedItems: [],
      startDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      startTime: '10:00',
      type: AuctionTypeEnum.REAL,
    },
  });

  // Opciones predefinidas para la duración
  const durationOptions = [
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 45, label: '45 minutos' },
    { value: 60, label: '1 hora' },
    { value: 120, label: '2 horas' },
    { value: 300, label: '5 horas' },
  ];

  const onSubmit = async (
    data: AuctionCreateDto & { selectedItems: string[] }
  ) => {
    // Validar que hay items seleccionados
    if (!data.selectedItems || data.selectedItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar al menos un item para la subasta',
        variant: 'destructive',
      });
      return;
    }

    // Validar que la fecha y hora de inicio sea futura
    const [hours, minutes] = data.startTime.split(':');
    const startDateTime = new Date(data.startDate);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const now = new Date();

    // Allow same-day auctions if the time is in the future
    if (startDateTime <= now) {
      const isToday = startDateTime.toDateString() === now.toDateString();
      const errorMessage = isToday
        ? 'La hora de inicio debe ser posterior a la hora actual'
        : 'La fecha y hora de inicio debe ser futura';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Combinar fecha y hora para crear startTime

      // Calcular endTime basado en la duración
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + data.durationMinutes);

      const requestBody = {
        title: data.title,
        description: data.description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        bidIncrement: data.bidIncrement,
        selectedItems: data.selectedItems,
        type: isTestAuction ? AuctionTypeEnum.TEST : AuctionTypeEnum.REAL,
      };

      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al crear la subasta');
      }

      toast({
        title: 'Éxito',
        description: 'Subasta creada correctamente',
      });

      reset();
      setSelectedItems([]);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo crear la subasta. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedItems([]);
    onClose();
  };

  // Set minimum date to today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { company } = useCompany();
  const primaryColor = company?.principal_color || '#3B82F6';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Crear Nueva Subasta
          </DialogTitle>
          <DialogDescription>
            Configura los detalles de tu nueva subasta y selecciona los items a
            incluir
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título de la Subasta *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Ej: Subasta de Vehículos Enero 2024"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe los detalles de la subasta..."
                rows={3}
              />
            </div>
          </div>

          {/* Timing */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha de Inicio * (dd/mm/yyyy)
                </Label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DateInput
                      value={field.value}
                      onChange={field.onChange}
                      minDate={today}
                      error={!!errors.startDate}
                    />
                  )}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.startDate.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Formato: día/mes/año
                </p>
              </div>

              <div>
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hora de Inicio * (HH:MM)
                </Label>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <TimeInput
                      value={field.value}
                      onChange={field.onChange}
                      error={!!errors.startTime}
                    />
                  )}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.startTime.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Formato: 24 horas (ej: 14:30)
                </p>
              </div>
            </div>

            <div>
              <Label
                htmlFor="durationMinutes"
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Duración de la Subasta *
              </Label>
              <div className="flex gap-2 items-center justify-between grid grid-cols-2">
                <select
                  {...register('durationMinutes', { valueAsNumber: true })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                {/* Bid Increment */}
                <div>
                  <Label
                    htmlFor="bidIncrement"
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Incremento Mínimo de Puja (CLP) *
                  </Label>
                  <Input
                    id="bidIncrement"
                    type="number"
                    {...register('bidIncrement', { valueAsNumber: true })}
                    placeholder="50000"
                    min="1000"
                    step="1000"
                    className={errors.bidIncrement ? 'border-red-500' : ''}
                  />
                  {errors.bidIncrement && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.bidIncrement.message}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Los participantes deberán pujar en incrementos de este monto
                  </p>
                </div>
              </div>
            </div>
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
              {isLoading ? 'Creando...' : 'Crear Subasta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
