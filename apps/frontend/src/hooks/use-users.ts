'use client';

import { useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  rut: string | null;
  public_name: string | null;
  role: 'ADMIN' | 'USER' | 'AUCTION_MANAGER';
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
  };
  tenant?: {
    id: string;
    name: string;
    domain: string;
  };
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users/company');
      
      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }
      
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const filterUsersByEmail = (email: string) => {
    if (!email.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(email.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users: filteredUsers,
    allUsers: users,
    loading,
    error,
    refetch: fetchUsers,
    filterByEmail: filterUsersByEmail,
  };
}
