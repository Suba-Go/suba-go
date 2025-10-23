'use client';

import { useState, useEffect } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { Input } from '@suba-go/shared-components/components/ui/input';

interface UsersSearchBarProps {
  onSearch: (email: string) => void;
  placeholder?: string;
  className?: string;
}

export function UsersSearchBar({ 
  onSearch, 
  placeholder = "Buscar por email...", 
  className 
}: UsersSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="email"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
