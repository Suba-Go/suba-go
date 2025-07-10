import { CompanyDto, TenantDto, UserDto } from '@suba-go/shared-validation';

interface FormResultProps {
  userData: UserDto;
  companyData: CompanyDto;
  tenantData: TenantDto;
}

export default function FormResult({
  userData,
  companyData,
  tenantData,
}: FormResultProps) {
  return (
    <div>
      <h1>FormResult</h1>
      <p>User: {userData.name}</p>
      <p>
        Company: {companyData.name}, {companyData.logo}
      </p>
      <p>
        Tenant: {tenantData.name}, {tenantData.domain}
      </p>
    </div>
  );
}
