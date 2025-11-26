'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next-nprogress-bar';
import { useState, useEffect } from 'react';
import { updateUserProfileAction } from '@/domain/server-actions/user/update-profile';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { darkenColor } from '@/utils/color-utils';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { validateRUT as validateRUTUtil } from '@suba-go/shared-validation';
import { FormattedInput } from '@/components/ui/formatted-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { useAutoFormat } from '@/hooks/use-auto-format';
import { FileUpload } from '@/components/ui/file-upload';

// functions to validate the form fields
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
  // Basic validation for Chilean phone number
  const phoneRegex = /^(\+56|56)?[2-9]\d{8}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return 'Debes ingresar un teléfono válido (ej: +56 9 1234 5678)';
  }
  return null;
};

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
  company: {
    id: string;
    name: string;
    subtitle?: string;
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
  company,
  hideBackButton,
}: ProfileFormWithUserDataProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { formatRut } = useAutoFormat();
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

  const canEditCompany =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'AUCTION_MANAGER';

  const [companyForm, setCompanyForm] = useState({
    name: company.name ?? '',
    subtitle: company.subtitle ?? '',
    logo: company.logo ?? '',
    background_logo_enabled: company.background_logo_enabled ?? false,
    rut: company.rut ?? '',
    principal_color: company.principal_color ?? '',
    principal_color2: company.principal_color2 ?? '',
    secondary_color: company.secondary_color ?? '',
    secondary_color2: company.secondary_color2 ?? '',
    secondary_color3: company.secondary_color3 ?? '',
  });


  const [brandingStatus, setBrandingStatus] = useState<
    { type: 'idle' | 'saving' | 'error' | 'success'; message?: string }
  >({ type: 'idle' });

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

  // Update company form when company prop changes (e.g., after page reload)
  useEffect(() => {
    setCompanyForm({
      name: company.name ?? '',
      subtitle: company.subtitle ?? '',
      logo: company.logo ?? '',
      background_logo_enabled: company.background_logo_enabled ?? false,
      rut: company.rut ?? '',
      principal_color: company.principal_color ?? '',
      principal_color2: company.principal_color2 ?? '',
      secondary_color: company.secondary_color ?? '',
      secondary_color2: company.secondary_color2 ?? '',
      secondary_color3: company.secondary_color3 ?? '',
    });
  }, [company]);


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

      console.log('Preparing to send update data:', updateData);
      console.log('Original userData:', userData);

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
      {/* warning missing fields */}
      {session?.user && (() => {
        const missing: string[] = [];
        const u = session.user;
        if (!u?.name || u.name.trim().length < 3) missing.push('name');
        if (!u?.phone || u.phone.trim().length === 0) missing.push('phone');
        if (!u?.rut || u.rut.trim().length === 0) missing.push('rut');
        return missing.length > 0 ? (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-900">
            <p className="font-medium">Completa tu perfil para continuar</p>
            <p className="text-sm mt-1">Campos faltantes: {missing.join(', ')}</p>
          </div>
        ) : null;
      })()}
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
              <FormattedInput
                type="email"
                formatType="email"
                value={userData.email}
                onChange={(val) => {
                  const value = (val ?? '').toString();
                  setUserData((prev) => ({ ...prev, email: value }));
                  if (value.trim()) {
                    const err = validateEmail(value);
                    setValidationErrors((prev) => ({ ...prev, email: err || undefined }));
                  } else {
                    setValidationErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
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
              <PhoneInput
                value={userData.phone}
                onChange={(val) => {
                  setUserData((prev) => ({ ...prev, phone: val }));
                  if (val.trim()) {
                    const error = validatePhone(val);
                    setValidationErrors((prev) => ({ ...prev, phone: error || undefined }));
                  } else {
                    setValidationErrors((prev) => ({ ...prev, phone: undefined }));
                  }
                }}
                className={`w-full ${
                  validationErrors.phone
                    ? 'border-red-500 focus-within:ring-red-500'
                    : 'border-blue-300 focus-within:ring-blue-500'
                }`}
                placeholder="9 1234 5678"
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
              <FormattedInput
                formatType="rut"
                value={userData.rut}
                onChange={(val) => {
                  const value = (val ?? '').toString();
                  setUserData((prev) => ({ ...prev, rut: value }));
                  if (value.trim()) {
                    const error = validateRUT(value);
                    setValidationErrors((prev) => ({ ...prev, rut: error || undefined }));
                  } else {
                    setValidationErrors((prev) => ({ ...prev, rut: undefined }));
                  }
                }}
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

      {/* Action buttons */}
      <div className="flex justify-end space-x-4 pt-4">
        {!hideBackButton && (
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Editar
          </Button>
        )}
      </div>

      {/* Company Branding Section */}
      <div className="pt-6 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
          Branding de la Empresa
        </h2>

        {!canEditCompany && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-900 mb-4">
            Solo administradores o managers pueden editar el branding.
          </div>
        )}

        <div className="space-y-6">
          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtítulo / Misión
            </label>
            <textarea
              value={companyForm.subtitle}
              onChange={(e) =>
                setCompanyForm((prev) => ({ ...prev, subtitle: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!canEditCompany}
              placeholder='Ej: "Como Wift, mi misión es..."'
              rows={3}
            />
            <span className="text-xs text-gray-500 mt-1">
              Este texto aparecerá debajo del nombre de tu empresa
            </span>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de la empresa
            </label>
            <div className="flex items-center gap-4">
              {companyForm.logo ? (
                <img
                  src={companyForm.logo}
                  alt="Logo"
                  className="h-12 w-12 object-contain border rounded"
                />
              ) : (
                <div className="h-12 w-12 flex items-center justify-center border rounded text-gray-400">
                  Sin logo
                </div>
              )}
              <div className="flex-1">
                <FileUpload
                  onFilesChange={(urls) => {
                    const url = urls[0];
                    if (!url) return;
                    setCompanyForm((prev) => ({ ...prev, logo: url }));
                    toast({
                      title: 'Logo cargado',
                      description: 'Guarda cambios para aplicar el nuevo logo.',
                    });
                  }}
                  acceptedTypes={['image/*']}
                  maxFiles={1}
                  maxSizeInMB={5}
                  label="Subir logo"
                  description="Arrastra o selecciona una imagen (máx 5MB)"
                  className="max-w-xl"
                />
              </div>
            </div>
          </div>

          {/* Background Logo Toggle */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={companyForm.background_logo_enabled}
                onChange={(e) =>
                  setCompanyForm((prev) => ({
                    ...prev,
                    background_logo_enabled: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={!canEditCompany}
              />
              <span className="text-sm font-medium text-gray-700">
                Mostrar logo como fondo transparente
              </span>
            </label>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color principal
              </label>
              <input
                type="color"
                value={companyForm.principal_color || '#3B82F6'}
                onChange={(e) =>
                  setCompanyForm((prev) => ({
                    ...prev,
                    principal_color: e.target.value,
                  }))
                }
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                disabled={!canEditCompany}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color secundario
              </label>
              <input
                type="color"
                value={companyForm.secondary_color || '#64748B'}
                onChange={(e) =>
                  setCompanyForm((prev) => ({
                    ...prev,
                    secondary_color: e.target.value,
                  }))
                }
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                disabled={!canEditCompany}
              />
            </div>
          </div>

          {/* Optional advanced colors */}
          <details className="bg-gray-50 rounded border p-4">
            <summary className="cursor-pointer text-sm text-gray-700">
              Colores avanzados (opcional)
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color principal 2
                </label>
                <input
                  type="color"
                  value={companyForm.principal_color2 || '#2563EB'}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({
                      ...prev,
                      principal_color2: e.target.value,
                    }))
                  }
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  disabled={!canEditCompany}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color secundario 2
                </label>
                <input
                  type="color"
                  value={companyForm.secondary_color2 || '#0EA5E9'}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({
                      ...prev,
                      secondary_color2: e.target.value,
                    }))
                  }
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  disabled={!canEditCompany}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color secundario 3
                </label>
                <input
                  type="color"
                  value={companyForm.secondary_color3 || '#14B8A6'}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({
                      ...prev,
                      secondary_color3: e.target.value,
                    }))
                  }
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  disabled={!canEditCompany}
                />
              </div>
            </div>
          </details>

          {/* Save branding */}
          <div className="flex items-center gap-3">
            <Button
              onClick={async () => {
                if (!canEditCompany) return;
                setBrandingStatus({ type: 'saving' });
                try {
                  const res = await fetch('/api/company', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      subtitle: companyForm.subtitle,
                      logo: companyForm.logo,
                      background_logo_enabled: companyForm.background_logo_enabled,
                      principal_color: companyForm.principal_color,
                      principal_color2: companyForm.principal_color2,
                      secondary_color: companyForm.secondary_color,
                      secondary_color2: companyForm.secondary_color2,
                      secondary_color3: companyForm.secondary_color3,
                    }),
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(
                      err.error || 'Error al actualizar la empresa'
                    );
                  }
                  const updated = await res.json();
                  // Update local and button color context
                  setBrandingStatus({
                    type: 'success',
                    message: 'Branding actualizado correctamente.',
                  });
                  toast({
                    title: 'Listo',
                    description: 'Branding actualizado correctamente.',
                  });
                  // Reload page after 1 second to show updated changes
                  setTimeout(() => window.location.reload(), 1000);
                } catch (error: any) {
                  setBrandingStatus({
                    type: 'error',
                    message: error?.message || 'Ocurrió un error',
                  });
                  toast({
                    title: 'Error',
                    description:
                      error?.message || 'Error al actualizar la empresa',
                    variant: 'destructive',
                  });
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={!canEditCompany || brandingStatus.type === 'saving'}
            >
              {brandingStatus.type === 'saving'
                ? 'Guardando…'
                : 'Guardar branding'}
            </Button>
            {brandingStatus.type === 'error' && (
              <span className="text-sm text-red-600">{brandingStatus.message}</span>
            )}
            {brandingStatus.type === 'success' && (
              <span className="text-sm text-green-700">{brandingStatus.message}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
