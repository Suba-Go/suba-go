'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { apiFetch } from '@/lib/api/api-fetch';

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
  primaryColor?: string;
}

const USERS_PER_PAGE = 5;

export function ParticipantSelector({
  selectedParticipants,
  onParticipantsChange,
  existingParticipantIds = [],
  primaryColor,
}: ParticipantSelectorProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/users');
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
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleParticipantToggle = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      onParticipantsChange(selectedParticipants.filter((id) => id !== userId));
    } else {
      onParticipantsChange([...selectedParticipants, userId]);
    }
  };

  // Filter out already registered users and apply search
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => !existingParticipantIds.includes(user.id))
      .filter((user) => {
        if (!searchQuery.trim()) return true;
        const searchLower = searchQuery.toLowerCase();
        return (
          user.email.toLowerCase().includes(searchLower) ||
          user.name?.toLowerCase().includes(searchLower) ||
          user.public_name?.toLowerCase().includes(searchLower) ||
          user.rut?.toLowerCase().includes(searchLower)
        );
      });
  }, [users, existingParticipantIds, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    const end = start + USERS_PER_PAGE;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">
            <Spinner className="size-4" />
          </p>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const showPagination = filteredUsers.length > USERS_PER_PAGE;

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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
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
        <>
          <div className="space-y-2">
            {paginatedUsers.map((user) => {
              const isSelected = selectedParticipants.includes(user.id);

              return (
                <div
                  key={user.id}
                  className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-opacity-50'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  style={
                    isSelected && primaryColor
                      ? {
                          backgroundColor: `${primaryColor}15`,
                          borderColor: primaryColor,
                        }
                      : undefined
                  }
                >
                  <Button
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="lg"
                    className="h-10 w-10 sm:h-12 sm:w-12 p-0 flex items-center justify-center shrink-0"
                    style={
                      isSelected && primaryColor
                        ? {
                            backgroundColor: primaryColor,
                            borderColor: primaryColor,
                            color: 'white',
                          }
                        : undefined
                    }
                    onClick={() => handleParticipantToggle(user.id)}
                  >
                    {isSelected ? (
                      <Check className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    ) : (
                      <span className="text-base sm:text-lg font-bold">+</span>
                    )}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs sm:text-sm truncate">
                        {user.public_name || user.name || 'Sin nombre'}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                      <span>{user.email}</span>
                      {user.rut && <span>RUT: {user.rut}</span>}
                      {user.phone && <span>Tel: {user.phone}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {showPagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t">
              <p className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
