/**
 * AdminDashboard Component
 * 
 * A dashboard interface for administrators that provides:
 * - Form management (create, edit, delete)
 * - Published forms overview
 * - Form response management
 * - Tab-based navigation
 * - Role-specific access control
 * 
 * Features three main sections:
 * 1. My Forms - Personal form management
 * 2. Published Forms - View and manage published forms
 * 3. Form Responses - Track and analyze form submissions
 * 
 * @component
 */

"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PublishedFormsList from "@/components/forms/PublishedFormsList";
import FormResponses from "@/components/forms/FormResponses";
import { MyForms } from "@/components/forms/MyForms";
import { useDictionary } from "@/hooks/useDictionary";

/**
 * AdminDashboardProps Interface
 * Defines the props for the AdminDashboard component
 * 
 * @interface
 * @property {string} userName - Name of the admin user
 */
interface AdminDashboardProps {
  userName: string;
}

/**
 * Valid tab values for the dashboard navigation
 * Defines the available sections in the admin dashboard
 */
const VALID_TABS = ["my-forms", "published", "responses"] as const;
type TabValue = typeof VALID_TABS[number];

/**
 * DashboardContent Component
 * Internal component that renders the dashboard content
 */
function DashboardContent({ userName }: AdminDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dict = useDictionary();
  const currentTab = searchParams.get("tab") as TabValue;

  useEffect(() => {
    if (!currentTab || !VALID_TABS.includes(currentTab)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "my-forms");
      router.replace(`?${params.toString()}`);
    }
  }, [currentTab, router, searchParams]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-3xl font-bold">{dict.dashboard.admin.title}</h1>
        <p className="text-muted-foreground mt-1">
          {dict.dashboard.admin.welcomeBack.replace("{0}", userName)}
        </p>
      </div>

      {/* Tab Navigation */}
      <Tabs 
        value={currentTab || "my-forms"} 
        onValueChange={handleTabChange}
        className="space-y-4 mx-5"
      >
        {/* Tab Triggers */}
        <TabsList className="md:flex-row flex-col w-full justify-center">
          <TabsTrigger value="my-forms">{dict.dashboard.admin.tabs.myForms}</TabsTrigger>
          <TabsTrigger value="published">{dict.dashboard.admin.tabs.published}</TabsTrigger>
          <TabsTrigger value="responses">{dict.dashboard.admin.tabs.responses}</TabsTrigger>
        </TabsList>

        {/* My Forms Tab Content */}
        <TabsContent value="my-forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dict.dashboard.admin.tabs.myForms}</CardTitle>
              <CardDescription>
                {dict.dashboard.admin.descriptions.myForms}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MyForms />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Published Forms Tab Content */}
        <TabsContent value="published" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dict.dashboard.admin.tabs.published}</CardTitle>
              <CardDescription>
                {dict.dashboard.admin.descriptions.published}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PublishedFormsList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Responses Tab Content */}
        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dict.dashboard.admin.tabs.responses}</CardTitle>
              <CardDescription>
                {dict.dashboard.admin.descriptions.responses}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormResponses userRole="ADMIN" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * AdminDashboard Component
 * Wrapper component that provides Suspense boundary
 */
export default function AdminDashboard(props: AdminDashboardProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent {...props} />
    </Suspense>
  );
} 