'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import {
  Users,
  UserPlus,
  UserMinus,
  Mail,
  Phone,
  Calendar,
  Wifi,
} from 'lucide-react';
import { AddParticipantModal } from './add-participant-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@suba-go/shared-components/components/ui/dialog';
import {
  AuctionDto,
  AuctionStatusEnum,
  UserSafeDto,
} from '@suba-go/shared-validation';
import { darkenColor } from '@/utils/color-utils';

interface ParticipantsListProps {
  auction: AuctionDto;
  participants: UserSafeDto[];
  isManager: boolean;
  onRefresh: () => void;
  primaryColor?: string;
}

export function ParticipantsList({
  auction,
  participants,
  isManager,
  onRefresh,
  primaryColor,
}: ParticipantsListProps) {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [participantToRemove, setParticipantToRemove] =
    useState<UserSafeDto | null>(null);

  // Ensure participants is always an array
  const participantsList = Array.isArray(participants) ? participants : [];
  const [isRemoving, setIsRemoving] = useState(false);
  const [connectedUserIds, setConnectedUserIds] = useState<Set<string>>(
    new Set()
  );

  // Fetch connected users every 5 seconds
  useEffect(() => {
    if (!isManager) return;

    const fetchConnectedUsers = async () => {
      try {
        const response = await fetch(
          `/api/auctions/${auction.id}/connected-users`
        );
        if (response.ok) {
          const data = await response.json();
          const userIds = new Set<string>(
            data.connected?.map((u: { userId: string }) => u.userId) || []
          );
          setConnectedUserIds(userIds);
        }
      } catch (error) {
        console.error('Error fetching connected users:', error);
      }
    };

    // Initial fetch
    fetchConnectedUsers();

    // Poll every 5 seconds
    const interval = setInterval(fetchConnectedUsers, 4000);

    return () => clearInterval(interval);
  }, [auction.id, isManager]);

  const handleRemoveParticipant = async () => {
    if (!participantToRemove) return;

    setIsRemoving(true);
    try {
      const response = await fetch(
        `/api/auctions/${auction.id}/register/${participantToRemove.id}`,
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

  const formatDate = (dateString: Date) => {
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
            style={
              primaryColor
                ? {
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: '#ffffff',
                  }
                : undefined
            }
            onMouseEnter={(e) => {
              if (primaryColor) {
                e.currentTarget.style.backgroundColor = darkenColor(
                  primaryColor,
                  10
                );
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (primaryColor) {
                e.currentTarget.style.backgroundColor = primaryColor;
                e.currentTarget.style.color = '#ffffff';
              }
            }}
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
                className="gap-2"
                style={
                  primaryColor
                    ? {
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        color: '#ffffff',
                      }
                    : undefined
                }
                onMouseEnter={(e) => {
                  if (primaryColor) {
                    e.currentTarget.style.backgroundColor = darkenColor(
                      primaryColor,
                      10
                    );
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (primaryColor) {
                    e.currentTarget.style.backgroundColor = primaryColor;
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
              >
                <UserPlus className="h-4 w-4" />
                Agregar Primer Participante
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {participantsList.map((participant) => {
                const isOnline = connectedUserIds.has(participant.id);
                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center relative">
                          <span className="text-blue-600 font-semibold text-sm">
                            {(participant.name || participant.email)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                          {/* Online status indicator */}
                          {isOnline && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">
                              {participant.name || 'Sin nombre'}
                            </h4>
                            {isOnline && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-50 text-green-700 border-green-300"
                              >
                                <Wifi className="h-3 w-3 mr-1" />
                                En línea
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {participant.public_name}
                          </p>
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
                          Registrado:{' '}
                          {formatDate(participant.createdAt || new Date(''))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setParticipantToRemove(participant)}
                        title="Desregistrar de la subasta"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Participant Modal */}
      <AddParticipantModal
        auction={auction}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={async () => {
          setIsAddModalOpen(false);
          // Force revalidation of participants data
          await onRefresh();
        }}
        existingParticipantIds={participantsList.map((p) => p.id)}
        primaryColor={primaryColor}
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
