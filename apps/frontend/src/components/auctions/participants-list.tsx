'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { Users, UserPlus, Trash2, Mail, Phone, Calendar } from 'lucide-react';
import { AddParticipantModal } from './add-participant-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@suba-go/shared-components/components/ui/dialog';

interface Participant {
  id: string;
  name: string | null;
  email: string;
  public_name: string | null;
  phone: string | null;
  rut: string | null;
  role: string;
  createdAt: string;
}

interface ParticipantsListProps {
  auctionId: string;
  participants: Participant[];
  isManager: boolean;
  onRefresh: () => void;
}

export function ParticipantsList({
  auctionId,
  participants,
  isManager,
  onRefresh,
}: ParticipantsListProps) {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [participantToRemove, setParticipantToRemove] =
    useState<Participant | null>(null);

  // Ensure participants is always an array
  const participantsList = Array.isArray(participants) ? participants : [];
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveParticipant = async () => {
    if (!participantToRemove) return;

    setIsRemoving(true);
    try {
      const response = await fetch(
        `/api/auctions/${auctionId}/register/${participantToRemove.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Error al desregistrar participante');
      }

      toast({
        title: 'Participante desregistrado',
        description: `${
          participantToRemove.public_name || participantToRemove.email
        } ha sido desregistrado de la subasta`,
      });

      onRefresh();
      setParticipantToRemove(null);
    } catch (error) {
      console.error('Error removing participant:', error);
      toast({
        title: 'Error',
        description: 'No se pudo desregistrar al participante',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isManager) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900">Lista de Participantes</h3>
          <p className="text-sm text-gray-600 mt-2">
            Solo los administradores de subasta pueden ver la lista de
            participantes registrados.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participantes Registrados
          </CardTitle>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2"
            size="sm"
          >
            <UserPlus className="h-4 w-4" />
            Agregar Participante
          </Button>
        </CardHeader>
        <CardContent>
          {participantsList.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay participantes registrados
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Agrega participantes para que puedan pujar en esta subasta
              </p>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Agregar Primer Participante
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {participantsList.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {(
                            participant.public_name ||
                            participant.name ||
                            participant.email
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {participant.public_name ||
                            participant.name ||
                            'Sin nombre'}
                        </h4>
                        {participant.rut && (
                          <p className="text-xs text-gray-500">
                            RUT: {participant.rut}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 ml-13">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {participant.email}
                      </div>
                      {participant.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {participant.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Registrado: {formatDate(participant.createdAt)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setParticipantToRemove(participant)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Participant Modal */}
      <AddParticipantModal
        auctionId={auctionId}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={async () => {
          setIsAddModalOpen(false);
          // Force revalidation of participants data
          await onRefresh();
        }}
        existingParticipantIds={participantsList.map((p) => p.id)}
      />

      {/* Remove Confirmation Dialog */}
      <Dialog
        open={!!participantToRemove}
        onOpenChange={(open: boolean) => !open && setParticipantToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Desregistrar participante?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas desregistrar a{' '}
              <strong>
                {participantToRemove?.public_name || participantToRemove?.email}
              </strong>{' '}
              de esta subasta? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setParticipantToRemove(null)}
              disabled={isRemoving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRemoveParticipant}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving ? 'Desregistrando...' : 'Desregistrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
