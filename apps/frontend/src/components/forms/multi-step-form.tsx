'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Progress } from '@suba-go/shared-components/components/ui/progress';
import UserForm from './user-form';
import CompanyForm from './company-form';
import {
  CompanyCreateDto,
  CompanyDto,
  TenantCreateDto,
  TenantDto,
  UserCreateDto,
  UserDto,
} from '@suba-go/shared-validation';
import { createCompleteTrpcAction } from '@/domain/trpc-actions/multi-step-form/create-complete-trpc-action';
import { getUserCompanyDomainTrpcAction } from '@/domain/trpc-actions/user/get-user-company-domain-trpc-action';
import { signIn } from 'next-auth/react';

// Cache management for multi-step form
const clearAllFormCache = () => {
  try {
    localStorage.removeItem('multiStepForm_userData');
    localStorage.removeItem('multiStepForm_companyData');
  } catch (error) {
    console.warn('Failed to clear form cache:', error);
  }
};

import FormResult from './form-result';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';

export default function MultiStepForm() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState<UserCreateDto>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [companyData, setCompanyData] = useState<CompanyCreateDto>({
    name: '',
    logo: null,
    principal_color: null,
    principal_color2: null,
    secondary_color: null,
    secondary_color2: null,
    secondary_color3: null,
    tenantId: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [completedData, setCompletedData] = useState<{
    user: UserDto;
    company: CompanyDto;
    tenant: TenantDto;
  } | null>(null);

  const handleUserSubmit = async (data: UserCreateDto) => {
    setUserData(data);
    setCurrentStep(2);
  };

  const handleCompanySubmit = async (data: {
    companyData: CompanyCreateDto;
    tenantData: TenantCreateDto;
  }) => {
    setIsLoading(true);
    try {
      setCompanyData(data.companyData);

      // Make the complete API call with all data
      const result = await createCompleteTrpcAction({
        userData,
        companyData: data.companyData,
        tenantData: data.tenantData,
      });

      if (result.success && result.data) {
        setCompletedData(result.data);

        // Clear all form cache on successful completion
        clearAllFormCache();

        toast({
          title: 'Cuenta creada exitosamente',
          description: 'Iniciando sesión automáticamente...',
          variant: 'default',
        });

        // Auto sign-in the user
        try {
          const signInResult = await signIn('credentials', {
            email: userData.email,
            password: userData.password,
            redirect: false,
          });

          if (signInResult?.ok) {
            // Get user's company domain and redirect
            const domainResult = await getUserCompanyDomainTrpcAction(
              userData.email
            );

            if (domainResult.success && domainResult.data?.domain) {
              toast({
                title: 'Bienvenido a tu empresa',
                description: 'Redirigiendo a tu página personalizada...',
                variant: 'default',
              });

              // Redirect to the user's company domain
              setTimeout(() => {
                if (domainResult.data?.domain) {
                  window.location.href = domainResult.data.domain;
                }
              }, 1500);
            } else {
              // Show success step if domain not found
              setCurrentStep(3);
            }
          } else {
            // Show success step if auto-login fails
            toast({
              title: 'Cuenta creada exitosamente',
              description: 'Puedes iniciar sesión desde la página de login',
              variant: 'default',
            });
            setCurrentStep(3);
          }
        } catch (autoLoginError) {
          console.error('Auto-login failed:', autoLoginError);
          // Show success step if auto-login fails
          toast({
            title: 'Cuenta creada exitosamente',
            description: 'Puedes iniciar sesión desde la página de login',
            variant: 'default',
          });
          setCurrentStep(3);
        }
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      toast({
        title: 'Error al crear cuenta',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <Card className="w-full bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-dark">Paso {currentStep} de 3</CardTitle>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      <CardContent>
        {currentStep === 1 && (
          <UserForm
            onSubmit={handleUserSubmit}
            isLoading={isLoading}
            initialData={userData}
          />
        )}
        {currentStep === 2 && (
          <CompanyForm
            onSubmit={handleCompanySubmit}
            isLoading={isLoading}
            initialData={companyData}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && completedData && (
          <FormResult companyData={completedData.company as CompanyDto} />
        )}
      </CardContent>
    </Card>
  );
}
