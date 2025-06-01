'use client';

import { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useTypedNavigation() {
  const router = useRouter();

  const navigate = useCallback(<T extends string>(path: Route<T>) => {
    router.push(path);
  }, [router]);

  const back = useCallback(() => {
    router.back();
  }, [router]);

  return {
    navigate,
    back
  };
} 