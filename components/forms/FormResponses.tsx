/**
 * FormResponses Component
 * 
 * A professional form response management interface that allows users to:
 * - View and manage form submissions
 * - Filter forms based on user roles (ADMIN, MANAGER, SADMIN)
 * - Browse through form responses chronologically
 * - Navigate to detailed response views
 * - Track submission counts and timestamps
 * 
 * @component
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormSubmission } from "@/lib/schemas/form";
import { useDictionary } from "@/hooks/useDictionary";

/**
 * ExtendedForm Interface
 * Extends the base Form type with additional properties for response management
 * 
 * @interface
 * @extends {Form}
 * @property {string} userId - ID of the form creator
 * @property {FormSubmission[]} submissions - Array of form submissions
 */
interface ExtendedForm extends Form {
  userId: string;
  submissions: FormSubmission[];
}

/**
 * FormResponsesProps Interface
 * Defines the props for the FormResponses component
 * 
 * @interface
 * @property {("ADMIN" | "MANAGER" | "SADMIN")} userRole - User's role for access control
 */
interface FormResponsesProps {
  userRole: "ADMIN" | "MANAGER" | "SADMIN";
}

/**
 * FormResponses Component
 * Manages and displays form submissions with role-based access control
 * 
 * @param {FormResponsesProps} props - Component props
 * @returns {JSX.Element} Rendered form responses interface
 */
export default function FormResponses({ userRole }: FormResponsesProps) {
  // Router and session management
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const dict = useDictionary();

  // Component state management
  const [forms, setForms] = useState<ExtendedForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<ExtendedForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Updates the URL by removing the formId parameter
   * Maintains other query parameters (like tab) while cleaning up the URL
   */
  const updateUrlWithoutFormId = () => {
    const tab = searchParams.get('tab');
    const newUrl = tab ? `${pathname}?tab=${tab}` : pathname;
    router.push(newUrl as `/${string}`, { scroll: false });
  };

  /**
   * Handles form selection from the dropdown
   * Updates the selected form and cleans up the URL
   * 
   * @param {string} formId - ID of the selected form
   */
  const handleFormSelect = (formId: string) => {
    const form = forms.find((f) => f.id === formId);
    if (form) {
      setSelectedForm(form);
      updateUrlWithoutFormId();
    }
  };

  /**
   * Effect hook for fetching and filtering forms
   * Handles role-based form access and initial form selection
   */
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch("/api/forms");
        if (!response.ok) throw new Error("Failed to fetch forms");
        const data = await response.json();
        
        // Apply role-based filtering
        let filteredForms = data.forms as ExtendedForm[];
        
        if (userRole === "ADMIN") {
          // ADMIN can only see their own forms
          filteredForms = data.forms.filter((form: ExtendedForm) => form.userId === session?.user?.id);
        } else if (userRole === "MANAGER" || userRole === "SADMIN") {
          // MANAGER and SADMIN can see all forms
          filteredForms = data.forms;
        }
        
        setForms(filteredForms);

        // Handle form selection from URL or default to first form
        const formIdFromQuery = searchParams.get('formId');
        
        if (formIdFromQuery) {
          const formToSelect = filteredForms.find(form => form.id === formIdFromQuery);
          if (formToSelect) {
            setSelectedForm(formToSelect);
            // Clean up URL after selection
            setTimeout(() => {
              updateUrlWithoutFormId();
            }, 0);
          } else if (filteredForms.length > 0) {
            setSelectedForm(filteredForms[0]);
          }
        } else if (filteredForms.length > 0) {
          setSelectedForm(filteredForms[0]);
        }
      } catch (error) {
        console.error("Error fetching forms:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchForms();
    }
  }, [session, userRole]);

  /**
   * Effect hook for URL cleanup
   * Removes formId from URL on component unmount or tab change
   */
  useEffect(() => {
    const handleRouteChange = () => {
      if (searchParams.has('formId')) {
        updateUrlWithoutFormId();
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      if (searchParams.has('formId')) {
        updateUrlWithoutFormId();
      }
    };
  }, [searchParams]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p>{dict.formResponses.loading}</p>
      </div>
    );
  }

  // Empty state handling
  if (forms.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {userRole === "ADMIN" 
            ? dict.formResponses.noForms.admin
            : userRole === "MANAGER" || userRole === "SADMIN"
              ? dict.formResponses.noForms.manager
              : dict.formResponses.noForms.default}
        </p>
      </div>
    );
  }

  const getResponsesText = (count: number) => {
    return count === 1 
      ? dict.formResponses.select.responses.replace("{0}", count.toString())
      : dict.formResponses.select.responses_plural.replace("{0}", count.toString());
  };

  return (
    <div className="space-y-6">
      {/* Form Selection Dropdown */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedForm?.id}
          onValueChange={handleFormSelect}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder={dict.formResponses.select.placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            <ScrollArea className="h-full">
              {forms.map((form) => (
                <SelectItem 
                  key={form.id} 
                  value={form.id} 
                  className="flex items-center gap-2 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <span className="block truncate max-w-[200px]">{form.title}</span>
                  </div>
                  <Badge variant="secondary" className="shrink-0 ml-2">
                    {getResponsesText(form.submissions.length)}
                  </Badge>
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      {/* Form Responses Display */}
      {selectedForm ? (
        selectedForm.submissions.length > 0 ? (
          <div className="space-y-6">
            {/* Response Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {dict.formResponses.responses.title.replace("{0}", selectedForm.title)}
              </h2>
              <Badge variant="outline">
                {getResponsesText(selectedForm.submissions.length)}
              </Badge>
            </div>

            {/* Response List */}
            <ScrollArea className="h-[600px] rounded-md border">
              <div className="space-y-6 p-6">
                {selectedForm.submissions.map((submission, index) => (
                  <Card 
                    key={submission.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/admin/responses/${submission.id}` as `/${string}`)}
                  >
                    {/* Submission Header */}
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {dict.formResponses.responses.responseNumber.replace(
                            "{0}",
                            (selectedForm.submissions.length - index).toString()
                          )}
                        </CardTitle>
                        <div className="text-sm text-gray-500">
                          {dict.formResponses.responses.timeAgo.replace(
                            "{0}",
                            formatDistanceToNow(new Date(submission.createdAt))
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {/* Submission Content */}
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(submission.responses).map(([fieldId, response]) => {
                          const field = selectedForm.fields.find(f => f.id === fieldId);
                          return field ? (
                            <div key={fieldId} className="grid grid-cols-2 gap-2">
                              <div className="font-medium">{field.question}:</div>
                              <div>{response as string}</div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          // No responses state
          <div className="text-center py-8">
            <p className="text-muted-foreground">{dict.formResponses.responses.noResponses}</p>
          </div>
        )
      ) : null}
    </div>
  );
} 