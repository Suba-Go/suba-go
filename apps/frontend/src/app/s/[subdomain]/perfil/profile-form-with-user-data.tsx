'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface ProfileFormWithUserDataProps {
  company: any; // Tipo de tu empresa
}

export default function ProfileFormWithUserData({ company }: ProfileFormWithUserDataProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    if (session?.user) {
      setUserData({
        name: session.user.name || '',
        email: session.user.email || ''
      });
    }
  }, [session]);

  const handleGoBack = () => {
    router.back();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Restaurar datos originales
    if (session?.user) {
      setUserData({
        name: session.user.name || '',
        email: session.user.email || ''
      });
    }
  };

  const handleSave = async () => {
    // Aquí implementarías la lógica para guardar los cambios
    console.log('Guardando cambios:', userData);
    
    // Por ahora solo simulamos el guardado
    setIsEditing(false);
    
    // TODO: Implementar llamada a API para actualizar perfil
  };

  const handleInputChange = (field: 'name' | 'email') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
          Información Personal
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-400">
              Cargando...
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-400">
              Cargando...
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4 pt-4">
          <div className="px-4 py-2 text-gray-400 border border-gray-200 rounded-md">
            Cargando...
          </div>
          <div className="px-4 py-2 bg-gray-300 text-white rounded-md">
            Cargando...
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
          Información Personal
        </h2>
        <div className="text-center py-8">
          <div className="text-red-600 border border-red-300 rounded-md px-4 py-2 bg-red-50">
            No autenticado
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
        Información Personal
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre
          </label>
          {isEditing ? (
            <input
              type="text"
              value={userData.name}
              onChange={handleInputChange('name')}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
              placeholder="Tu nombre"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {userData.name || 'No especificado'}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          {isEditing ? (
            <input
              type="email"
              value={userData.email}
              onChange={handleInputChange('email')}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
              placeholder="tu@email.com"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {userData.email || 'No especificado'}
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4 pt-4">
        <button 
          onClick={handleGoBack}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Volver
        </button>
        
        {isEditing ? (
          <>
            <button 
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Guardar Cambios
            </button>
          </>
        ) : (
          <button 
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Editar
          </button>
        )}
      </div>
    </div>
  );
}
