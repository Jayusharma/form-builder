/**
 * UserDashboard Component
 * 
 * A dashboard interface for regular users that provides:
 * - View of organization forms
 * - Form submission interface
 * - Submission history
 * - Connected admin information
 * 
 * Features:
 * - Organization Info - Shows connected admin's details
 * - Forms Tab - Lists all available forms from the admin
 * - Submissions Tab - Shows user's form submission history
 * 
 * @component
 */

"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MySubmissions from "./MySubmissions";
import AdminForms from "./AdminForms";

/**
 * UserDashboardProps Interface
 * Defines the props for the UserDashboard component
 * 
 * @interface
 * @property {string} userName - Name of the user
 */
interface UserDashboardProps {
  userName: string;
}

interface AdminInfo {
  name: string | null;
  email: string | null;
}

/**
 * UserDashboard Component
 * Renders a simplified dashboard interface for regular users
 * 
 * @param {UserDashboardProps} props - Component props
 * @returns {JSX.Element} Rendered user dashboard interface
 */
export default function UserDashboard({ userName }: UserDashboardProps) {
  const { data: session } = useSession();
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const response = await fetch("/api/users/admin-info");
        if (!response.ok) throw new Error("Failed to fetch admin info");
        const data = await response.json();
        setAdminInfo(data.admin);
      } catch (error) {
        console.error("Failed to fetch admin info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchAdminInfo();
    }
  }, [session]);

  return (
    <div className="container mx-auto p-6">
      {/* Dashboard Header */}
      <h1 className="text-3xl text-center font-bold mb-6">User Dashboard</h1>

      {/* Organization Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading organization info...</p>
          ) : adminInfo ? (
            <div className="space-y-2">
              <p className="font-medium">{adminInfo.name || "Unnamed Admin"}</p>
              <p className="text-sm text-muted-foreground">{adminInfo.email}</p>
            </div>
          ) : (
            <p className="text-destructive">Failed to load organization info</p>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Forms and Submissions */}
      <Tabs defaultValue="forms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="forms">Available Forms</TabsTrigger>
          <TabsTrigger value="submissions">My Submissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Forms from Your Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminForms />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <MySubmissions />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}