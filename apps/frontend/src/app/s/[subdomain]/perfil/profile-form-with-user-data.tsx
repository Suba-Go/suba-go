'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next-nprogress-bar';
import { useState, useEffect } from 'react';
import { updateUserProfileAction } from '@/domain/server-actions/user/update-profile';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { darkenColor } from '@/utils/color-utils';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';

// Funciones de validación
const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'El email es obligatorio';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Debes ingresar un email válido';
  return null;
};

const validateName = (name: string): string | null => {
  if (!name.trim()) return 'El nombre es obligatorio';
  if (name.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
  return null;
};

const validatePhone = (phone: string): string | null => {
  if (!phone.trim()) return 'El teléfono es obligatorio';
  // Validación básica de teléfono chileno
  const phoneRegex = /^(\+56|56)?[2-9]\d{8}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return 'Debes ingresar un teléfono válido (ej: +56 9 1234 5678)';
  }
  return null;
};

const validateRUT = (rut: string): string | null => {
  if (!rut.trim()) return 'El RUT es obligatorio';
  
  // Validación básica: solo verificar que tenga el formato XX.XXX.XXX-X
  const rutRegex = /^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9kK]$/;
  if (!rutRegex.test(rut)) {
    return 'Debes ingresar un RUT válido con guión (ej: 12.345.678-9)';
  }
  
  return null;
};

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
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    rut?: string;
  }>({});

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
    setValidationErrors({});
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

    // Validar todos los campos antes de enviar
    const errors: { [key: string]: string } = {};
    
    // Validar campos obligatorios
    const nameError = validateName(userData.name);
    if (nameError) errors.name = nameError;
    
    const emailError = validateEmail(userData.email);
    if (emailError) errors.email = emailError;
    
    const phoneError = validatePhone(userData.phone);
    if (phoneError) errors.phone = phoneError;
    
    const rutError = validateRUT(userData.rut);
    if (rutError) errors.rut = rutError;

    // Si hay errores de validación, mostrarlos y no continuar
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: 'Error de validación',
        description: 'Por favor corrige los errores en el formulario',
        variant: 'destructive',
      });
      return;
    }

    // Limpiar errores de validación si todo está bien
    setValidationErrors({});
    setIsLoading(true);

    try {
      // Preparar los datos para enviar - todos los campos son obligatorios
      const updateData = {
        name: userData.name.trim(),
        email: userData.email.trim(),
        phone: userData.phone.trim(),
        rut: userData.rut.trim(),
      };

      console.log('Preparing to send update data:', updateData);
      console.log('Original userData:', userData);

      // Llamar a la API para actualizar el perfil
      const result = await updateUserProfileAction(session.user.id, updateData);

      if (result.success) {
        // Actualizar la sesión de NextAuth con los nuevos datos
        await update({
          user: {
            ...session.user,
            name: updateData.name,
            email: updateData.email,
            phone: updateData.phone,
            rut: updateData.rut,
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
      console.error('Update data sent:', {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        rut: userData.rut,
      });
      
      let errorMessage = 'Error al actualizar el perfil';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Si es un error interno del servidor, mostrar un mensaje más específico
        if (error.message.includes('Internal server error')) {
          errorMessage = 'Error interno del servidor. Por favor verifica que todos los datos estén correctos e intenta nuevamente.';
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange =
    (field: 'name' | 'email' | 'phone' | 'rut') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setUserData((prev) => ({
        ...prev,
        [field]: value,
      }));
      
      // Validar en tiempo real solo si el campo tiene contenido
      if (value.trim()) {
        let error: string | null = null;
        
        switch (field) {
          case 'name':
            error = validateName(value);
            break;
          case 'email':
            error = validateEmail(value);
            break;
          case 'phone':
            error = validatePhone(value);
            break;
          case 'rut':
            error = validateRUT(value);
            break;
        }
        
        setValidationErrors((prev) => ({
          ...prev,
          [field]: error || undefined,
        }));
      } else {
        // Si el campo está vacío, limpiar el error
        setValidationErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
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
            Nombre <span className="text-red-500">*</span>
          </label>
          {isEditing ? (
            <div>
              <input
                type="text"
                value={userData.name}
                onChange={handleInputChange('name')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-blue-50 ${
                  validationErrors.name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-blue-300 focus:ring-blue-500'
                }`}
                placeholder="Tu nombre"
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>
          ) : (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {userData.name || 'No especificado'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          {isEditing ? (
            <div>
              <input
                type="email"
                value={userData.email}
                onChange={handleInputChange('email')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-blue-50 ${
                  validationErrors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-blue-300 focus:ring-blue-500'
                }`}
                placeholder="tu@email.com"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
          ) : (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {userData.email || 'No especificado'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono <span className="text-red-500">*</span>
          </label>
          {isEditing ? (
            <div>
              <input
                type="tel"
                value={userData.phone}
                onChange={handleInputChange('phone')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-blue-50 ${
                  validationErrors.phone
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-blue-300 focus:ring-blue-500'
                }`}
                placeholder="+56 9 1234 5678"
              />
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
              )}
            </div>
          ) : (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {userData.phone || 'No especificado'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RUT <span className="text-red-500">*</span>
          </label>
          {isEditing ? (
            <div>
              <input
                type="text"
                value={userData.rut}
                onChange={handleInputChange('rut')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-blue-50 ${
                  validationErrors.rut
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-blue-300 focus:ring-blue-500'
                }`}
                placeholder="12.345.678-9"
              />
              {validationErrors.rut && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.rut}</p>
              )}
            </div>
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
