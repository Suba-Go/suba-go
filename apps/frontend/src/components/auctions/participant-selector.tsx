'use client';

import { useState, useEffect } from 'react';
import { Users, Check, Search } from 'lucide-react';
import { Checkbox } from '@suba-go/shared-components/components/ui/checkbox';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { ScrollArea } from '@suba-go/shared-components/components/ui/scroll-area';

interface User {
  id: string;
  name: string | null;
  email: string;
  public_name: string | null;
  phone: string | null;
  rut: string | null;
  role?: string;
}

interface ParticipantSelectorProps {
  selectedParticipants: string[];
  onParticipantsChange: (participants: string[]) => void;
  existingParticipantIds?: string[];
}

export function ParticipantSelector({
  selectedParticipants,
  onParticipantsChange,
  existingParticipantIds = [],
}: ParticipantSelectorProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      const data = await response.json();

      // Ensure data is an array
      const usersArray = Array.isArray(data) ? data : [];

      // Filter only USER role
      const regularUsers = usersArray.filter(
        (user: User) => user.role === 'USER' || !user.role
      );
      setUsers(regularUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: `No se pudieron cargar los usuarios: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`,
        variant: 'destructive',
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParticipantToggle = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      onParticipantsChange(selectedParticipants.filter((id) => id !== userId));
    } else {
      onParticipantsChange([...selectedParticipants, userId]);
    }
  };

  // Filter out already registered users and apply search
  const filteredUsers = users
    .filter((user) => !existingParticipantIds.includes(user.id))
    .filter((user) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        user.email.toLowerCase().includes(searchLower) ||
        user.name?.toLowerCase().includes(searchLower) ||
        user.public_name?.toLowerCase().includes(searchLower) ||
        user.rut?.toLowerCase().includes(searchLower)
      );
    });

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-center py-8">
          <Spinner className="size-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Participantes seleccionados: {selectedParticipants.length} de{' '}
          {filteredUsers.length} disponibles
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por email, nombre o RUT..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* User List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">
            {searchQuery
              ? 'No se encontraron usuarios'
              : existingParticipantIds.length > 0
              ? 'Todos los usuarios ya están registrados'
              : 'No hay usuarios disponibles'}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-64">
          <div className="space-y-2 pr-4">
            {filteredUsers.map((user) => {
              const isSelected = selectedParticipants.includes(user.id);

              return (
                <div
                  key={user.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleParticipantToggle(user.id)}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {user.public_name || user.name || 'Sin nombre'}
                      </h4>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{user.email}</span>
                      {user.rut && <span>RUT: {user.rut}</span>}
                      {user.phone && <span>Tel: {user.phone}</span>}
                    </div>
                  </div>

                  {isSelected && <Check className="h-5 w-5 text-blue-600" />}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
