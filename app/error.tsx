'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const handleReLogin = async () => {
    await signOut({ 
      redirect: true,
      callbackUrl: '/auth/login'
    });
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-[400px] border-0 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Server Error</CardTitle>
          <CardDescription>
            Something went wrong with the server. Please try to re-login or go back to the previous page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-4">
          <Button 
            variant="default" 
            onClick={handleReLogin}
          >
            Re-login
          </Button>
          <Button 
            variant="outline" 
            onClick={handleGoBack}
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 