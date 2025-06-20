import { CustomLink } from '@suba-go/shared-components/components/ui/link';
import { protocol, rootDomain } from '@suba-go/shared-components/lib/utils';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      <CustomLink href={`${protocol}://suba-go.${rootDomain}`}>
        Suba Go
      </CustomLink>
    </div>
  );
}
