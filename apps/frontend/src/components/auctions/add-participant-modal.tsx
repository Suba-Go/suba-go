'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@suba-go/shared-components/components/ui/dialog';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { UserPlus } from 'lucide-react';
import { ParticipantSelector } from './participant-selector';

interface AddParticipantModalProps {
  auctionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingParticipantIds: string[];
}

export function AddParticipantModal({
  auctionId,
  isOpen,
  onClose,
  onSuccess,
  existingParticipantIds,
}: AddParticipantModalProps) {
  const { toast } = useToast();
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedParticipants.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar al menos un participante',
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Register each participant
      const promises = selectedParticipants.map((userId) =>
        fetch(`/api/auctions/${auctionId}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        })
      );

      const responses = await Promise.all(promises);

      // Check if all requests were successful
      const failedResponses = responses.filter((r) => !r.ok);
      if (failedResponses.length > 0) {
        const errorData = await failedResponses[0].json();
        throw new Error(
          errorData.error || 'Error al registrar algunos participantes'
        );
      }

      toast({
        title: 'Éxito',
        description: `${selectedParticipants.length} participante(s) registrado(s) exitosamente`,
        duration: 2000,
      });

      setSelectedParticipants([]);

      // Call onSuccess which will close modal and trigger refresh
      onSuccess();
    } catch (error) {
      console.error('Error registering participants:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudieron registrar los participantes',
        variant: 'destructive',
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedParticipants([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar Participantes
          </DialogTitle>
          <DialogDescription>
            Selecciona los usuarios que deseas registrar en esta subasta
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ParticipantSelector
            selectedParticipants={selectedParticipants}
            onParticipantsChange={setSelectedParticipants}
            existingParticipantIds={existingParticipantIds}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Registrando...'
                : `Registrar ${
                    selectedParticipants.length > 0
                      ? `(${selectedParticipants.length})`
                      : ''
                  }`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
