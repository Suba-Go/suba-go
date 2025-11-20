import { getNodeEnv } from '@suba-go/shared-components';

export default function getCompanyUrl(companyNameLowercase: string): string {
  if (typeof window === 'undefined') return '#';

  const nodeEnv = getNodeEnv();

  if (nodeEnv === 'local') {
    // Local: http://{company}.localhost:3000
    return `http://${companyNameLowercase}.localhost:3000/login`;
  } else if (nodeEnv === 'development') {
    // Development: https://{company}.development.subago.cl
    return `https://${companyNameLowercase}.development.subago.cl/login`;
  } else {
    // Production: https://{company}.subago.cl
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'subago.cl';
    return `https://${companyNameLowercase}.${rootDomain}/login`;
  }
}
