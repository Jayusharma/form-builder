import React from 'react'
import Navbar from "@/components/ui/navbar-component";
import { auth } from "@/auth";

async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="h-full">
      <Navbar 
        role={session?.user?.role}
      />
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </div>
  )
}

export default Layout