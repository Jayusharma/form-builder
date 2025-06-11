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

import React, { useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import MySubmissions from "./MySubmissions";
import AdminForms from "./AdminForms";
import { useDictionary } from "@/hooks/useDictionary";
import { useRouter, useSearchParams } from "next/navigation";
import FormResponses from "../forms/FormResponses";

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
 * Valid tab values for the dashboard navigation
 */
const VALID_TABS = ["forms", "submissions"] as const;
type TabValue = typeof VALID_TABS[number];

/**
 * DashboardContent Component
 * Internal component that renders the dashboard content
 */
function DashboardContent({ userName }: UserDashboardProps) {
  const { data: session } = useSession();
  const [adminInfo, setAdminInfo] = React.useState<AdminInfo | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const dict = useDictionary();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") as TabValue;

  useEffect(() => {
    if (!currentTab || !VALID_TABS.includes(currentTab)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "forms");
      router.replace(`?${params.toString()}`);
    }
  }, [currentTab, router, searchParams]);

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

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-3xl font-bold">{dict.dashboard.user.title}</h1>
        <p className="text-muted-foreground mt-1">
          {dict.dashboard.user.welcomeBack.replace("{0}", userName)}
        </p>
      </div>

      {/* Organization Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{dict.dashboard.user.organization.title}</CardTitle>
          <CardDescription>{dict.dashboard.user.organization.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">{dict.dashboard.user.organization.loading}</p>
          ) : adminInfo ? (
            <div className="space-y-2">
              <p className="font-medium">{adminInfo.name || dict.dashboard.user.organization.unnamedAdmin}</p>
              <p className="text-sm text-muted-foreground">{adminInfo.email}</p>
            </div>
          ) : (
            <p className="text-destructive">{dict.dashboard.user.organization.error}</p>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Forms and Submissions */}
      <Tabs 
        value={currentTab || "forms"} 
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="forms">{dict.dashboard.user.tabs.forms}</TabsTrigger>
          <TabsTrigger value="submissions">{dict.dashboard.user.tabs.submissions}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dict.dashboard.user.tabs.forms}</CardTitle>
              <CardDescription>{dict.dashboard.user.descriptions.forms}</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminForms />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dict.dashboard.user.tabs.submissions}</CardTitle>
              <CardDescription>{dict.dashboard.user.descriptions.submissions}</CardDescription>
            </CardHeader>
            <CardContent>
            <FormResponses userRole="USER" />
              {/* <MySubmissions /> */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * UserDashboard Component
 * Wrapper component that provides Suspense boundary
 */
export default function UserDashboard(props: UserDashboardProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent {...props} />
    </Suspense>
  );
}