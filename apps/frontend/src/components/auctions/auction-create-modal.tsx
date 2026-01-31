'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { apiFetch } from '@/lib/api/api-fetch';
import { ItemSelector } from './item-selector';
import { useCompany } from '@/hooks/use-company';
import { DateInput } from '@/components/ui/date-input';
import { TimeSelector } from '@/components/ui/time-selector';
import { FormattedInput } from '@/components/ui/formatted-input';
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

const getDefaultStartDate = () => {
  const base = new Date();
  base.setDate(base.getDate() + 1);
  base.setHours(0, 0, 0, 0);
  return base;
};

export function AuctionCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: AuctionCreateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isTestAuction, setIsTestAuction] = useState(false);
  const [startDate, setStartDate] = useState<Date>(getDefaultStartDate);
  const [startTimeInput, setStartTimeInput] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [showItemError, setShowItemError] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AuctionCreateDto>({
    resolver: zodResolver(auctionCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      startTime: getDefaultStartDate(),
      endTime: new Date(getDefaultStartDate().getTime() + 30 * 60000),
      bidIncrement: 50000,
      tenantId: '',
      itemIds: [],
      type: AuctionTypeEnum.REAL,
    },
  });

  const { company } = useCompany();
  const primaryColor = company?.principal_color || '#3B82F6';

  // Create dynamic style for focus ring
  const inputFocusStyle = useMemo(
    () =>
      ({
        '--tw-ring-color': primaryColor,
      } as React.CSSProperties),
    [primaryColor]
  );

  useEffect(() => {
    if (company?.tenantId) {
      setValue('tenantId', company.tenantId);
    }
  }, [company?.tenantId, setValue]);

  const durationOptions = useMemo(
    () => [
      { value: 5, label: '5 minutos' },
      { value: 10, label: '10 minutos' },
      { value: 15, label: '15 minutos' },
      { value: 30, label: '30 minutos' },
      { value: 45, label: '45 minutos' },
      { value: 60, label: '1 hora' },
      { value: 120, label: '2 horas' },
      { value: 300, label: '5 horas' },
      { value: 1440, label: '1 dia' },
      { value: 10080, label: '7 dias' },
    ],
    []
  );

  useEffect(() => {
    const [hoursStr, minutesStr] = startTimeInput.split(':');
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return;
    }

    const startDateTime = new Date(startDate);
    startDateTime.setHours(hours, minutes, 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

    setValue('startTime', startDateTime);
    setValue('endTime', endDateTime);
  }, [startDate, startTimeInput, durationMinutes, setValue]);
  const onSubmit = async (data: AuctionCreateDto) => {
    if (!company?.tenantId) {
      toast({
        title: 'Error',
        description: 'No se pudo determinar el tenant actual.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    if (!data.itemIds.length) {
      setShowItemError(true);
      toast({
        title: 'Error',
        description: 'Debe seleccionar al menos un item para la subasta',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setShowItemError(false);

    const now = new Date();
    if (data.startTime <= now) {
      const isToday = data.startTime.toDateString() === now.toDateString();
      toast({
        title: 'Error',
        description: isToday
          ? 'La hora de inicio debe ser posterior a la hora actual'
          : 'La fecha y hora de inicio debe ser futura',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          startTime: data.startTime.toISOString(),
          endTime: data.endTime.toISOString(),
          bidIncrement: data.bidIncrement,
          type: isTestAuction ? AuctionTypeEnum.TEST : data.type,
          tenantId: data.tenantId,
          itemIds: data.itemIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al crear la subasta');
      }

      toast({
        title: 'Exito',
        description: 'Subasta creada correctamente',
        duration: 3000,
      });

      const resetStartDate = getDefaultStartDate();
      reset({
        title: '',
        description: '',
        startTime: resetStartDate,
        endTime: new Date(resetStartDate.getTime() + 30 * 60000),
        bidIncrement: 50000,
        tenantId: company?.tenantId ?? '',
        itemIds: [],
        type: AuctionTypeEnum.REAL,
      });
      setStartDate(resetStartDate);
      setStartTimeInput('10:00');
      setDurationMinutes(30);
      setSelectedItems([]);
      setIsTestAuction(false);
      setShowItemError(false);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo crear la subasta. Intentalo de nuevo.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleClose = () => {
    const resetStartDate = getDefaultStartDate();
    reset({
      title: '',
      description: '',
      startTime: resetStartDate,
      endTime: new Date(resetStartDate.getTime() + 30 * 60000),
      bidIncrement: 50000,
      tenantId: company?.tenantId ?? '',
      itemIds: [],
      type: AuctionTypeEnum.REAL,
    });
    setStartDate(resetStartDate);
    setStartTimeInput('10:00');
    setDurationMinutes(30);
    setSelectedItems([]);
    setIsTestAuction(false);
    setShowItemError(false);
    onClose();
  };

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Only close when the dialog is actually being closed.
        // Prevents accidental closes when focus temporarily leaves the dialog
        // (e.g. when opening a nested file picker in a child dialog).
        if (!open) handleClose();
      }}
    >
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
        onFocusOutside={(e) => {
          // Avoid closing the dialog when the browser opens the native file picker
          // from a nested dialog (Radix can treat that as focus outside).
          e.preventDefault();
        }}
      >
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titulo de la Subasta *</Label>
              <Input
                id="title"
                {...register('title')}
                maxLength={50}
                placeholder="Ej: Subasta de Vehiculos Enero 2024"
                className={
                  errors.title
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'focus-visible:ring-1'
                }
                style={errors.title ? undefined : inputFocusStyle}
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.title.message as string}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descripcion</Label>
              <p className="text-xs text-gray-500 mb-2">(Opcional)</p>
              <Textarea
                id="description"
                {...register('description')}
                maxLength={300}
                placeholder="Describe los detalles de la subasta..."
                rows={3}
                className={
                  errors.description
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'focus-visible:ring-1'
                }
                style={errors.description ? undefined : inputFocusStyle}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.description.message as string}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <div className="h-6 flex items-center mb-2">
                  <Label
                    htmlFor="startDate"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Fecha de Inicio *
                  </Label>
                </div>
                <div className="min-h-[3rem] flex flex-col justify-end">
                  <p className="text-xs mb-2 text-gray-500">
                    Formato: dd/mm/yyyy
                  </p>
                  <DateInput
                    value={startDate}
                    onChange={(date) => date && setStartDate(date)}
                    minDate={today}
                    className="focus-visible:ring-1"
                    style={inputFocusStyle}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="h-6 flex items-center mb-2">
                  <Label
                    htmlFor="startTime"
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Hora de Inicio *
                  </Label>
                </div>
                <div className="min-h-[3rem] flex flex-col justify-end">
                  <p className="text-xs mb-2 text-gray-500">
                    Formato: 24 horas (ej: 14:30)
                  </p>
                  <TimeSelector
                    value={startTimeInput}
                    onChange={setStartTimeInput}
                    style={inputFocusStyle}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <div className="h-6 flex items-center mb-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duracion de la Subasta *
                  </Label>
                </div>
                <div className="min-h-[3rem] flex flex-col justify-end">
                  <select
                    value={durationMinutes}
                    onChange={(event) =>
                      setDurationMinutes(Number(event.target.value))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                    style={inputFocusStyle}
                  >
                    {durationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="h-6 flex items-center mb-2">
                  <Label
                    htmlFor="bidIncrement"
                    className="flex items-center gap-2"
                  >
                    Incremento Minimo de Puja (CLP) *
                  </Label>
                </div>
                <div className="min-h-[3rem] flex flex-col justify-end">
                  <FormattedInput
                    id="bidIncrement"
                    formatType="price"
                    placeholder="Ej: $50.000"
                    className={
                      errors.bidIncrement
                        ? 'border-red-500 focus-visible:ring-red-500'
                        : 'focus-visible:ring-1'
                    }
                    style={errors.bidIncrement ? undefined : inputFocusStyle}
                    onChange={(value) => {
                      const numValue =
                        typeof value === 'number' ? value : Number(value);
                      setValue('bidIncrement', numValue || 0, {
                        shouldValidate: true,
                      });
                    }}
                  />
                  {errors.bidIncrement && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.bidIncrement.message as string}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Tipo de Subasta</Label>
              <p className="text-sm text-gray-600">
                Las subastas de prueba no aparecen en estadisticas
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
                onCheckedChange={(checked) => {
                  setIsTestAuction(checked);
                  setValue(
                    'type',
                    checked ? AuctionTypeEnum.TEST : AuctionTypeEnum.REAL
                  );
                }}
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
                setValue('itemIds', items);
              }}
            />
            {showItemError && selectedItems.length === 0 && (
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
