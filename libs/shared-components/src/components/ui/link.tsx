'use client';
import { useRouter } from 'next-nprogress-bar';
import Link, { LinkProps } from 'next/link';
import { ReactNode, MouseEvent } from 'react';

interface CustomLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
}

export function CustomLink({
  href,
  children,
  className,
  ...props
}: CustomLinkProps) {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push(href as string);
  };

  return (
    <Link href={href} {...props} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
