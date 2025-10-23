'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next-nprogress-bar';
import { useState, useEffect } from 'react';
import { updateUserProfileAction } from '@/domain/server-actions/user/update-profile';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { darkenColor } from '@/utils/color-utils';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';

interface ProfileFormWithUserDataProps {
  company: {
    id: string;
    name: string;
    principal_color?: string;
  };
}

export default function ProfileFormWithUserData({
  company,
}: ProfileFormWithUserDataProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    rut: '',
  });

  useEffect(() => {
    if (session?.user) {
      setUserData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
        rut: session.user.rut || '',
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
        email: session.user.email || '',
        phone: session.user.phone || '',
        rut: session.user.rut || '',
      });
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener la información del usuario',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Llamar a la API para actualizar el perfil
      const result = await updateUserProfileAction(session.user.id, {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        rut: userData.rut,
      });

      if (result.success) {
        // Actualizar la sesión de NextAuth con los nuevos datos
        await update({
          user: {
            ...session.user,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            rut: userData.rut,
          },
        });

        toast({
          title: 'Perfil actualizado',
          description: 'Tus datos se han actualizado correctamente',
          variant: 'default',
        });

        setIsEditing(false);
      } else {
        throw new Error(result.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Error al actualizar el perfil',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange =
    (field: 'name' | 'email' | 'phone' | 'rut') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUserData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
          Información Personal
        </h2>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Spinner className="size-8" />
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={userData.phone}
              onChange={handleInputChange('phone')}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
              placeholder="+56 9 1234 5678"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {userData.phone || 'No especificado'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RUT
          </label>
          {isEditing ? (
            <input
              type="text"
              value={userData.rut}
              onChange={handleInputChange('rut')}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
              placeholder="12.345.678-9"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {userData.rut || 'No especificado'}
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button
          onClick={handleGoBack}
          className="px-4 py-2 text-white rounded-md transition-colors"
          style={{
            backgroundColor: company.principal_color,
            borderColor: company.principal_color,
          }}
          onMouseEnter={(e) => {
            if (company.principal_color) {
              e.currentTarget.style.backgroundColor = darkenColor(
                company.principal_color,
                10
              );
            }
          }}
          onMouseLeave={(e) => {
            if (company.principal_color) {
              e.currentTarget.style.backgroundColor = company.principal_color;
            }
          }}
        >
          Volver
        </Button>

        {isEditing ? (
          <>
            <Button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-500 text-white border border-red-500 rounded-md hover:bg-red-600 transition-colors"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Editar
          </Button>
        )}
      </div>
    </div>
  );
}
