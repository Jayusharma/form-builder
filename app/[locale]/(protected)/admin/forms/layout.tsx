"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { redirect } from "next/navigation";

export default function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (status === "loading") return;

    // Check if user is authenticated
    if (!session?.user) {
      redirect("/auth/signin");
      return;
    }

    // Check user role
    const userRole = session.user.role;
    if (userRole === "USER" || userRole === "MANAGER") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      redirect("/dashboard");
      return;
    }
  }, [session, status, router, toast]);

  // Show nothing while checking authentication
  if (status === "loading") {
    return null;
  }

  // Only render children if user is authenticated and has proper role
  if (session?.user && !["USER", "MANAGER"].includes(session.user.role)) {
    return <>{children}</>;
  }

  // Return null for unauthorized users (they will be redirected)
  return null;
}
