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
  UserSafeDto,
} from '@suba-go/shared-validation';
import { createUserServerAction } from '@/domain/server-actions/user/create-user-server-action';
import { createCompanyServerAction } from '@/domain/server-actions/companies/create-company-server-action';
import { createTenantServerAction } from '@/domain/server-actions/tenant/create-tenant-server-action';
import { connectUserToCompanyAndTenantServerAction } from '@/domain/server-actions/user/connect-user-to-company-and-tenant-server-action';
import FormResult from './form-result';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';

export default function MultiStepForm() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(2);
  const [userData, setUserData] = useState<UserCreateDto>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [createdUser, setCreatedUser] = useState<UserSafeDto | null>(null);
  const [tenantData, setTenantData] = useState<TenantCreateDto>({
    name: '',
    subdomain: '',
  });
  const [companyData, setCompanyData] = useState<CompanyCreateDto>({
    name: '',
    logo: null,
    principal_color: null,
    principal_color2: null,
    secondary_color: null,
    secondary_color2: null,
    secondary_color3: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleUserSubmit = async (data: UserCreateDto) => {
    setIsLoading(true);
    try {
      const result = await createUserServerAction(data);
      if (result.success) {
        setCreatedUser(result.data as UserSafeDto);
        setUserData(data);
        setCurrentStep(2);
      } else {
        toast({
          title: 'Error al crear usuario',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error al crear usuario',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySubmit = async (data: {
    companyData: CompanyCreateDto;
    tenantData: TenantCreateDto;
  }) => {
    setIsLoading(true);
    try {
      // Crear empresa
      const companyResult = await createCompanyServerAction(data.companyData);
      if (!companyResult.success) {
        throw new Error(companyResult.error);
      }
      setCompanyData(companyResult.data as CompanyDto);

      // Crear tenant
      const tenantResult = await createTenantServerAction(data.tenantData);
      if (!tenantResult.success) {
        throw new Error(tenantResult.error);
      }
      const tenant = {
        ...tenantResult.data,
        domain: `https://${data.tenantData.subdomain}.subago.com`,
        name: data.tenantData.name,
        subdomain: data.tenantData.subdomain,
      };
      setTenantData(tenant);

      // Conectar usuario con empresa
      if (createdUser) {
        const connectionResult =
          await connectUserToCompanyAndTenantServerAction(
            tenantResult.data as TenantDto,
            createdUser,
            companyResult.data as CompanyDto
          );

        if (connectionResult.success) {
          toast({
            title: 'Empresa creada exitosamente',
            variant: 'default',
          });
          setCurrentStep(3);
        } else {
          throw new Error(connectionResult.error);
        }
      } else {
        throw new Error('No se pudo obtener la información del usuario creado');
      }
    } catch (error) {
      toast({
        title: 'Error al crear empresa',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (currentStep / 2) * 100;

  return (
    <Card className="w-full bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-dark">Paso {currentStep} de 2</CardTitle>
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
        {currentStep === 3 && createdUser && (
          <FormResult
            userData={createdUser as UserDto}
            companyData={companyData as CompanyDto}
            tenantData={tenantData as unknown as TenantDto}
          />
        )}
      </CardContent>
    </Card>
  );
}
