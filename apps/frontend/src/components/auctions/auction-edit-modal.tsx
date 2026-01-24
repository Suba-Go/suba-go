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
import { apiFetch } from '@/lib/api/api-fetch';
import { Switch } from '@suba-go/shared-components/components/ui/switch';
import { ItemSelector } from './item-selector';
import { useCompany } from '@/hooks/use-company';
import { DateInput } from '@/components/ui/date-input';
import { TimeInput } from '@/components/ui/time-input';
import {
  auctionCreateSchema,
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
  AuctionTypeEnum,
  type AuctionCreateDto,
} from '@suba-go/shared-validation';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useFetchData } from '@/hooks/use-fetch-data';

interface AuctionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  auction: AuctionDto;
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
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [startTimeInput, setStartTimeInput] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const { toast } = useToast();
  const { company } = useCompany();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AuctionCreateDto>({
    resolver: zodResolver(auctionCreateSchema),
  });

  const {
    data: auctionItems,
    isLoading: isLoadingAuctionItems,
    error: errorAuctionItems,
  } = useFetchData<AuctionItemWithItmeAndBidsDto[]>({
    url: `/api/auction-items/${auction.id}`,
    key: ['auctionItems', auction.id],
    revalidateOnMount: true,
  });

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
    if (company?.tenantId) {
      setValue('tenantId', company.tenantId);
    }
  }, [company?.tenantId, setValue]);

  useEffect(() => {
    if (auction && isOpen) {
      const start = new Date(auction.startTime);
      const end = new Date(auction.endTime);
      const minutes = Math.max(
        15,
        Math.round((end.getTime() - start.getTime()) / 60000)
      );

      const items =
        auctionItems
          ?.map((auctionItem) => auctionItem?.itemId)
          .filter((id): id is string => Boolean(id)) || [];

      setSelectedItems(items);
      setIsTestAuction(auction.type === AuctionTypeEnum.TEST);
      setStartDate(start);
      setStartTimeInput(start.toTimeString().slice(0, 5));
      setDurationMinutes(minutes);

      reset({
        title: auction.title,
        description: auction.description ?? '',
        startTime: start,
        endTime: end,
        bidIncrement: auction.bidIncrement ?? 50000,
        tenantId: company?.tenantId ?? '',
        itemIds: items,
        type: (auction.type as AuctionTypeEnum) ?? AuctionTypeEnum.REAL,
      });
    }
  }, [auction, company?.tenantId, isOpen, reset, auctionItems]);

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
    if (!auction) {
      return;
    }

    const now = new Date();
    const originalStart = new Date(auction.startTime);
    if (originalStart <= now) {
      toast({
        title: 'Error',
        description: 'No se puede editar una subasta que ya ha comenzado',
        variant: 'destructive',
      });
      return;
    }

    if (!data.itemIds.length) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar al menos un item para la subasta',
        variant: 'destructive',
      });
      return;
    }

    if (data.startTime <= now) {
      toast({
        title: 'Error',
        description: 'La fecha y hora de inicio debe ser futura',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch(`/api/auctions/${auction.id}`, {
        method: 'PUT',
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
          selectedItems: data.itemIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al actualizar la subasta');
      }

      toast({
        title: 'Exito',
        description: 'Subasta actualizada correctamente',
      });

      onSuccess();
      handleClose();
    } catch (error) {
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

  const handleClose = () => {
    setIsTestAuction(false);
    setSelectedItems([]);
    setStartTimeInput('10:00');
    setDurationMinutes(30);
    onClose();
  };

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  if (!auction || errorAuctionItems) {
    return null;
  }
  if (isLoadingAuctionItems) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner className="size-4" />
        </div>
      </div>
    );
  }
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editar Subasta
          </DialogTitle>
          <DialogDescription>
            Actualiza la informacion de la subasta seleccionada
          </DialogDescription>
        </DialogHeader>

        {/*
          IMPORTANT:
          This modal contains the ItemSelector, which can open ItemCreateModal.
          ItemCreateModal uses its own <form>. If we keep a <form> here, the DOM
          ends up with nested forms (invalid HTML) and some browsers will submit
          the *outer* form when the user clicks "Crear Producto" (or presses
          Enter), which triggers the auction update at the same time.
          We intentionally avoid an outer <form> and trigger react-hook-form
          submission from the button instead.
        */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titulo de la Subasta *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Ej: Subasta de Vehiculos Enero 2024"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.title.message as string}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe los detalles de la subasta..."
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha de Inicio * (dd/mm/yyyy)
                </Label>
                <DateInput
                  value={startDate}
                  onChange={(date) => date && setStartDate(date)}
                  minDate={today}
                />
              </div>

              <div>
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hora de Inicio * (HH:MM)
                </Label>
                <TimeInput
                  value={startTimeInput}
                  onChange={setStartTimeInput}
                />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duracion de la Subasta *
              </Label>
              <select
                value={durationMinutes}
                onChange={(event) =>
                  setDurationMinutes(Number(event.target.value))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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

          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4" />
              Seleccionar Items *
            </Label>
            <ItemSelector
              selectedItems={selectedItems}
              onItemsChange={(items) => {
                setSelectedItems(items);
                setValue('itemIds', items, { shouldValidate: true });
              }}
            />
            {selectedItems.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Debe seleccionar al menos un item
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleSubmit(onSubmit)}
            >
              {isLoading ? 'Guardando...' : 'Actualizar Subasta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
