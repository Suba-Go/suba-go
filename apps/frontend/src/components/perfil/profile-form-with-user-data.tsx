'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { updateUserProfileAction } from '@/domain/server-actions/user/update-profile';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { validateRUT as validateRUTUtil } from '@suba-go/shared-validation';
import { FormattedInput } from '@/components/ui/formatted-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { useAutoFormat } from '@/hooks/use-auto-format';
import { useCompany, lightenColor } from '@/hooks/use-company';

// functions to validate the form fields
// TODO: validaciones rtaspasar a helper reutilizable
const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'El email es obligatorio';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Debes ingresar un email válido';
  return null;
};

const validateName = (name: string): string | null => {
  const normalized = name.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'El nombre completo es obligatorio';

  // Must contain at least 2 words (e.g., nombre + apellido)
  const parts = normalized.split(' ').filter(Boolean);
  if (parts.length < 2) {
    return 'Debes ingresar tu nombre completo (nombre y apellido)';
  }

  // Avoid very short words like "A B"
  if (parts.some((p) => p.length < 2)) {
    return 'Debes ingresar tu nombre completo (nombre y apellido)';
  }

  return null;
};

const validatePhone = (phone: string): string | null => {
  if (!phone.trim()) return 'El teléfono es obligatorio';
  // Basic validation for Chilean phone number
  const phoneRegex = /^(\+56|56)?[2-9]\d{8}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return 'Debes ingresar un teléfono válido (ej: +56 9 1234 5678)';
  }
  return null;
};

// TODO: opcion de rut con 1.234.567-8 usuarios mas antiguos
const validateRUT = (rut: string): string | null => {
  if (!rut.trim()) return 'El RUT es obligatorio';

  // Validation rut format and validate the rut
  const rutRegex = /^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9kK]$/;
  if (!rutRegex.test(rut)) {
    return 'Debes ingresar un RUT válido con guión (ej: 12.345.678-9)';
  }

  // Validate the rut digit verifier
  const isValid = validateRUTUtil(rut);
  if (!isValid) return 'El RUT no es válido';

  return null;
};

interface ProfileFormWithUserDataProps {
  company?: {
    id: string;
    name: string;
    logo?: string;
    background_logo_enabled?: boolean;
    principal_color?: string;
    principal_color2?: string;
    secondary_color?: string;
    secondary_color2?: string;
    secondary_color3?: string;
    rut?: string;
  };
  hideBackButton?: boolean;
}

export default function ProfileFormWithUserData({
  company: companyProp,
  hideBackButton,
}: ProfileFormWithUserDataProps) {
  const { company: companyFromHook } = useCompany();
  // Use company from hook if available (more up-to-date), otherwise fallback to prop
  const company = companyFromHook || companyProp;
  const primaryColor = company?.principal_color;
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { formatRut } = useAutoFormat();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generate styles for inputs based on primary color
  const getInputStyles = () => {
    if (!primaryColor) {
      return {
        className: 'bg-gray-50 border-gray-300 focus:ring-gray-500',
        style: {} as React.CSSProperties,
      };
    }
    // Create a very light version of the primary color (95% lighter) for background
    const lightBgColor = lightenColor(primaryColor, 95);
    // Create a lighter version of the primary color (70% lighter) for border
    const lightBorderColor = lightenColor(primaryColor, 70);
    return {
      className: '',
      style: {
        backgroundColor: lightBgColor,
        borderColor: lightBorderColor,
        '--tw-ring-color': primaryColor,
      } as React.CSSProperties,
    };
  };

  const inputStyles = getInputStyles();
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
    // Restore original data
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

    // Validate all fields before sending
    const errors: { [key: string]: string } = {};

    // Validate required fields
    const nameError = validateName(userData.name);
    if (nameError) errors.name = nameError;

    const emailError = validateEmail(userData.email);
    if (emailError) errors.email = emailError;

    const phoneError = validatePhone(userData.phone);
    if (phoneError) errors.phone = phoneError;

    const rutError = validateRUT(userData.rut);
    if (rutError) errors.rut = rutError;

    // If there are validation errors, show them and do not continue
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: 'Error de validación',
        description: 'Por favor corrige los errores en el formulario',
        variant: 'destructive',
      });
      return;
    }

    // Clean validation errors if everything is ok
    setValidationErrors({});
    setIsLoading(true);

    try {
      // Prepare the data to send - all fields are required
      const updateData = {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        phone: userData.phone.trim(),
        //  Rut saved formatted
        rut: formatRut(userData.rut.trim()),
      };
      // Call the API to update the profile
      const result = await updateUserProfileAction(session.user.id, updateData);

      if (result.success) {
        // Update the NextAuth session with the new data
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

        // if is onboarding, redirect to home
        if (hideBackButton) {
          router.replace('/');
        }
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

        // If it is an internal server error, show a more specific message
        if (error.message.includes('Internal server error')) {
          errorMessage =
            'Error interno del servidor. Por favor verifica que todos los datos estén correctos e intenta nuevamente.';
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

      // Validate in real time only if the field has content
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
        // If the field is empty, clean the error
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
            <Spinner className="size-4" />
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
      {/* warning missing fields */}
      {session?.user &&
        (() => {
          const missing: string[] = [];
          const u = session.user;
          if (!u?.name || u.name.trim().length < 3) missing.push('name');
          if (!u?.phone || u.phone.trim().length === 0) missing.push('phone');
          if (!u?.rut || u.rut.trim().length === 0) missing.push('rut');
          return missing.length > 0 ? (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-900">
              <p className="font-medium">Completa tu perfil para continuar</p>
              <p className="text-sm mt-1">
                Campos faltantes: {missing.join(', ')}
              </p>
            </div>
          ) : null;
        })()}
      <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
        Información Personal
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          {isEditing ? (
            <div>
              <input
                type="text"
                value={userData.name}
                onChange={handleInputChange('name')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  validationErrors.name
                    ? 'border-red-500 focus:ring-red-500'
                    : inputStyles.className
                }`}
                style={validationErrors.name ? {} : inputStyles.style}
                placeholder="Ingresa tu nombre completo"
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.name}
                </p>
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
              <FormattedInput
                type="email"
                formatType="email"
                value={userData.email}
                onChange={(val) => {
                  const value = (val ?? '').toString();
                  setUserData((prev) => ({ ...prev, email: value }));
                  if (value.trim()) {
                    const err = validateEmail(value);
                    setValidationErrors((prev) => ({
                      ...prev,
                      email: err || undefined,
                    }));
                  } else {
                    setValidationErrors((prev) => ({
                      ...prev,
                      email: undefined,
                    }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  validationErrors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : inputStyles.className
                }`}
                style={validationErrors.email ? {} : inputStyles.style}
                placeholder="tu@email.com"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.email}
                </p>
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
              <PhoneInput
                value={userData.phone}
                onChange={(val) => {
                  setUserData((prev) => ({ ...prev, phone: val }));
                  if (val.trim()) {
                    const error = validatePhone(val);
                    setValidationErrors((prev) => ({
                      ...prev,
                      phone: error || undefined,
                    }));
                  } else {
                    setValidationErrors((prev) => ({
                      ...prev,
                      phone: undefined,
                    }));
                  }
                }}
                className={`w-full ${
                  validationErrors.phone
                    ? 'border-red-500 focus:ring-red-500'
                    : inputStyles.className
                }`}
                style={validationErrors.phone ? {} : inputStyles.style}
                placeholder="9 1234 5678"
              />
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.phone}
                </p>
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
              <FormattedInput
                formatType="rut"
                value={userData.rut}
                onChange={(val) => {
                  const value = (val ?? '').toString();
                  setUserData((prev) => ({ ...prev, rut: value }));
                  if (value.trim()) {
                    const error = validateRUT(value);
                    setValidationErrors((prev) => ({
                      ...prev,
                      rut: error || undefined,
                    }));
                  } else {
                    setValidationErrors((prev) => ({
                      ...prev,
                      rut: undefined,
                    }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  validationErrors.rut
                    ? 'border-red-500 focus:ring-red-500'
                    : inputStyles.className
                }`}
                style={validationErrors.rut ? {} : inputStyles.style}
                placeholder="12.345.678-9"
              />
              {validationErrors.rut && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.rut}
                </p>
              )}
            </div>
          ) : (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {userData.rut || 'No especificado'}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-4 pt-4">
        {!hideBackButton && (
          <Button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 transition-colors"
          >
            Volver
          </Button>
        )}

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
            className={`px-4 py-2 text-white rounded-md hover:bg-${primaryColor}/90 transition-colors`}
            style={primaryColor ? { backgroundColor: primaryColor } : {}}
          >
            Editar
          </Button>
        )}
      </div>
    </div>
  );
}
