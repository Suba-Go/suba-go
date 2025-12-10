'use client';

import { useSession } from 'next-auth/react';
import { useCompany } from '@/hooks/use-company';
import { UserRolesEnum } from '@suba-go/shared-validation';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import Image from 'next/image';

export function CompanyInformation() {
  const { data: session } = useSession();
  const { company, isLoading, error } = useCompany();

  // Only show for AUCTION_MANAGER
  if (session?.user?.role !== UserRolesEnum.AUCTION_MANAGER) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
          Información de la Empresa
        </h2>
        <div className="flex items-center justify-center py-8">
          <Spinner className="size-4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
          Información de la Empresa
        </h2>
        <div className="text-center py-8">
          <div className="text-red-600 border border-red-300 rounded-md px-4 py-2 bg-red-50">
            Error al cargar la información: {error}
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
          Información de la Empresa
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-600 border border-gray-300 rounded-md px-4 py-2 bg-gray-50">
            No se encontró información de la empresa
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
        Información de la Empresa
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la Empresa
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
            {company.name}
          </div>
        </div>

        {company.logo && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
              <Image
                src={company.logo}
                alt={`Logo de ${company.name}`}
                className="h-16 w-auto object-contain"
              />
            </div>
          </div>
        )}

        {company.principal_color && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Principal
            </label>
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: company.principal_color }}
              ></div>
              <div className="flex-1">
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {company.principal_color}
                </div>
              </div>
            </div>
          </div>
        )}

        {company.principal_color2 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Principal 2
            </label>
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: company.principal_color2 }}
              ></div>
              <div className="flex-1">
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {company.principal_color2}
                </div>
              </div>
            </div>
          </div>
        )}

        {company.secondary_color && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Secundario
            </label>
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: company.secondary_color }}
              ></div>
              <div className="flex-1">
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {company.secondary_color}
                </div>
              </div>
            </div>
          </div>
        )}

        {company.secondary_color2 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Secundario 2
            </label>
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: company.secondary_color2 }}
              ></div>
              <div className="flex-1">
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {company.secondary_color2}
                </div>
              </div>
            </div>
          </div>
        )}

        {company.secondary_color3 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Secundario 3
            </label>
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: company.secondary_color3 }}
              ></div>
              <div className="flex-1">
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {company.secondary_color3}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
