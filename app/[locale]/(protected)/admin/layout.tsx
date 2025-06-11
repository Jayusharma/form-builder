'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated and is an admin
     if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [session, status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Shield className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Only render the admin interface if user is authenticated and is an admin
  if (status === 'authenticated' && session?.user?.role === 'ADMIN'||'SADMIN'||'MANAGER') {
    return (
      <div className="min-h-scree bg-white dark:bg-black ">
        <main className="">
          <div className="max-w-7xl mx-auto  sm:px-6 lg:px-8 py-8 bg-white dark:bg-black">
            {/* Admin content */}
            <div className=" rounded-lg shadow">
              {children}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Return null while redirecting
  return null;
}
