/**
 * ManagerDashboard Component
 * 
 * A dashboard interface for managers that provides:
 * - Published forms overview
 * - Form response management
 * - Tab-based navigation
 * - Role-specific access control
 * 
 * Features two main sections:
 * 1. Published Forms - View and manage published forms
 * 2. Form Responses - Track and analyze form submissions
 * 
 * Note: My Forms section is currently disabled for managers
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
import { useDictionary } from "@/hooks/useDictionary";

/**
 * ManagerDashboardProps Interface
 * Defines the props for the ManagerDashboard component
 * 
 * @interface
 * @property {string} userName - Name of the manager user
 */
interface ManagerDashboardProps {
  userName: string;
}

/**
 * Valid tab values for the dashboard navigation
 * Defines the available sections in the manager dashboard
 * Note: 'my-forms' and 'team' are defined but currently disabled
 */
const VALID_TABS = ["my-forms", "published", "responses", "team"] as const;
type TabValue = typeof VALID_TABS[number];

/**
 * ManagerDashboard Component
 * Renders the manager dashboard interface with tabbed navigation
 * 
 * @param {ManagerDashboardProps} props - Component props
 * @returns {JSX.Element} Rendered manager dashboard interface
 */
export default function ManagerDashboard({ userName }: ManagerDashboardProps) {
  // Router and search params setup
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") as TabValue;
  const dict = useDictionary();

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
        <h1 className="text-3xl font-bold">{dict.dashboard.manager.title}</h1>
        <p className="text-muted-foreground mt-1">
          {dict.dashboard.manager.welcomeBack.replace("{0}", userName)}
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
          {/* My Forms tab is currently disabled */}
          {/* <TabsTrigger value="my-forms">{dict.dashboard.manager.tabs.myForms}</TabsTrigger> */}
          <TabsTrigger value="published">{dict.dashboard.manager.tabs.published}</TabsTrigger>
          <TabsTrigger value="responses">{dict.dashboard.manager.tabs.responses}</TabsTrigger>
        </TabsList>

        {/* My Forms Tab Content (currently disabled) */}
        {/* <TabsContent value="my-forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dict.dashboard.manager.tabs.myForms}</CardTitle>
              <CardDescription>
                {dict.dashboard.manager.descriptions.myForms}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MyForms />
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Published Forms Tab Content */}
        <TabsContent value="published" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dict.dashboard.manager.tabs.published}</CardTitle>
              <CardDescription>
                {dict.dashboard.manager.descriptions.published}
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
              <CardTitle>{dict.dashboard.manager.tabs.responses}</CardTitle>
              <CardDescription>
                {dict.dashboard.manager.descriptions.responses}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormResponses userRole="MANAGER" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 