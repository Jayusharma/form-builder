/**
 * SuperAdminDashboard Component
 * 
 * A comprehensive dashboard interface for super administrators that provides:
 * - Complete form management
 * - Published forms oversight
 * - Form publication request management
 * - Global form response access
 * - System-wide controls
 * - Tab-based navigation
 * 
 * Features five main sections:
 * 1. My Forms - Personal form management
 * 2. Published Forms - Global form oversight
 * 3. Form Requests - Publication request management
 * 4. All Responses - Global response access
 * 5. System - System-wide controls (reserved for future use)
 * 
 * @component
 */

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PublishedFormsList from "@/components/forms/PublishedFormsList";
import PublicRequest from "@/components/forms/publicRequest";
import FormResponses from "@/components/forms/FormResponses";
import MyForms from "@/components/forms/MyForms";

/**
 * SuperAdminDashboardProps Interface
 * Defines the props for the SuperAdminDashboard component
 * 
 * @interface
 * @property {string} userName - Name of the super admin user
 */
interface SuperAdminDashboardProps {
  userName: string;
}

/**
 * Valid tab values for the dashboard navigation
 * Defines the available sections in the super admin dashboard
 * Note: 'system' tab is defined but not yet implemented
 */
const VALID_TABS = ["my-forms", "published", "requests", "responses", "system"] as const;
type TabValue = typeof VALID_TABS[number];

/**
 * SuperAdminDashboard Component
 * Renders the super admin dashboard interface with tabbed navigation
 * 
 * @param {SuperAdminDashboardProps} props - Component props
 * @returns {JSX.Element} Rendered super admin dashboard interface
 */
export default function SuperAdminDashboard({ userName }: SuperAdminDashboardProps) {
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
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, Super Admin {userName}
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
          <TabsTrigger value="requests">Form Requests</TabsTrigger>
          <TabsTrigger value="responses">All Responses</TabsTrigger>
        </TabsList>

        {/* My Forms Tab Content */}
        <TabsContent value="my-forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Forms</CardTitle>
              <CardDescription>
                Create and manage your forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MyForms userRole="SADMIN" />
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

        {/* Form Requests Tab Content */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Publication Requests</CardTitle>
              <CardDescription>
                Review and manage all form publication requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PublicRequest />
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Responses Tab Content */}
        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Form Responses</CardTitle>
              <CardDescription>
                View and manage responses for all forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormResponses userRole="SADMIN" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 