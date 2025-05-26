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

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PublishedFormsList from "@/components/forms/PublishedFormsList";
import FormResponses from "@/components/forms/FormResponses";
import MyForms from "@/components/forms/MyForms";

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
 * AdminDashboard Component
 * Renders the admin dashboard interface with tabbed navigation
 * 
 * @param {AdminDashboardProps} props - Component props
 * @returns {JSX.Element} Rendered admin dashboard interface
 */
export default function AdminDashboard({ userName }: AdminDashboardProps) {
  // Router and search params setup
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") as TabValue;

  /**
   * Validates and sets default tab if needed
   * Ensures a valid tab is always selected
   */
  useEffect(() => {
    if (!currentTab || !VALID_TABS.includes(currentTab)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "my-forms");
      router.replace(`?${params.toString()}`);
    }
  }, [currentTab, router, searchParams]);

  /**
   * Handles tab changes
   * Updates URL with selected tab
   * 
   * @param {string} value - New tab value
   */
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, Admin {userName}
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
          <TabsTrigger value="my-forms">My Forms</TabsTrigger>
          <TabsTrigger value="published">Published Forms</TabsTrigger>
          <TabsTrigger value="responses">My Form Responses</TabsTrigger>
        </TabsList>

        {/* My Forms Tab Content */}
        <TabsContent value="my-forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Forms</CardTitle>
              <CardDescription>
                Create and manage all your forms
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
              <CardTitle>Published Forms</CardTitle>
              <CardDescription>
                View and manage all published forms
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
              <CardTitle>My Form Responses</CardTitle>
              <CardDescription>
                View responses for your forms only
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