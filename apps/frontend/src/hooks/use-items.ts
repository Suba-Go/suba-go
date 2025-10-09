'use client';

import { useState, useEffect } from 'react';

interface Item {
  id: string;
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  version?: string;
  kilometraje?: number;
  legal_status?: string;
  state: string;
  basePrice?: number;
  photos?: string;
  docs?: string;
  createdAt: string;
}

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/items');
      
      if (!response.ok) {
        throw new Error('Error al cargar los items');
      }
      
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshItems = () => {
    fetchItems();
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    isLoading,
    error,
    refreshItems,
  };
}

export function useAvailableItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/items/available');
      
      if (!response.ok) {
        throw new Error('Error al cargar los items disponibles');
      }
      
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshItems = () => {
    fetchAvailableItems();
  };

  useEffect(() => {
    fetchAvailableItems();
  }, []);

  return {
    items,
    isLoading,
    error,
    refreshItems,
  };
}
