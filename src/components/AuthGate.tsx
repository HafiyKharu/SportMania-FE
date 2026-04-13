'use client';

import { usePathname, useRouter } from 'next/navigation';
import { isLoggedIn, isAdmin } from '@/lib/auth';
import { useEffect } from 'react';

const PUBLIC_ROUTES = ['/', '/login'];
const PUBLIC_PREFIX_ROUTES = ['/transactions/success/', '/transactions/failed/'];

function isPublicRoute(pathname: string) {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIX_ROUTES.some((routePrefix) => pathname.startsWith(routePrefix));
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isPublicRoute(pathname)) return;

    if (!isLoggedIn()) {
      router.replace('/login');
      return;
    }

    if (!isAdmin()) {
      router.replace('/');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
