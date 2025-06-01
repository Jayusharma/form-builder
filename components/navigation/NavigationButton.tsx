'use client';

import { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Button, ButtonProps } from '@/components/ui/button';

interface NavigationButtonProps<T extends string> extends ButtonProps {
  href: Route<T>;
}

export function NavigationButton<T extends string>({ href, ...props }: NavigationButtonProps<T>) {
  const router = useRouter();

  return (
    <Button
      {...props}
      onClick={() => router.push(href)}
    />
  );
} 