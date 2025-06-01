'use client';

import { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface DynamicNavigationProps<T extends string> {
  children: (navigate: (path: Route<T>) => void) => React.ReactNode;
}

export function DynamicNavigation<T extends string>({ children }: DynamicNavigationProps<T>) {
  const router = useRouter();

  const navigate = useCallback((path: Route<T>) => {
    router.push(path);
  }, [router]);

  return children(navigate);
} 