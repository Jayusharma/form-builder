import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import UserDashboard from "@/components/dashboard/UserDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import SuperAdminDashboard from "@/components/dashboard/SuperAdminDashboard";
import ConnectToAdmin from "@/components/dashboard/ConnectToAdmin";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const userName = session.user.name || session.user.email || 'User';

  // For regular users, check if they're connected to an admin
  if (session.user.role === 'USER') {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { adminCodeId: true }
    });

    // If user is not connected to an admin, show the connect form
    if (!user?.adminCodeId) {
      return <ConnectToAdmin />;
    }
  }

  // Handle different user roles
  switch (session.user.role) {
    case 'SADMIN':
      return <SuperAdminDashboard userName={userName} />;
    case 'ADMIN':
      return <AdminDashboard userName={userName} />;
    case 'MANAGER':
      return <ManagerDashboard userName={userName} />;
    case 'USER':
      return <UserDashboard userName={userName} />;
    default:
      // Fallback to user dashboard for unknown roles
      return redirect("/auth/login");
  }
}
