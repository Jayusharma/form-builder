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

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormSubmission } from "@/lib/schemas/form";
import { useDictionary } from "@/hooks/useDictionary";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";

/**
 * ExtendedForm Interface
 * Extends the base Form type with additional properties for response management
 * 
 * @interface
 * @extends {Form}
 * @property {string} userId - ID of the form creator
 * @property {Object} _count - Submission count statistics
 */
interface ExtendedForm extends Form {
  userId: string;
  _count: {
    submissions: number;
  };
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

interface RawSubmission extends Omit<FormSubmission, 'responses'> {
  responses: Record<string, string | number | boolean | string[] | null>;
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
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  /**
   * Updates the URL by removing the formId parameter
   * Maintains other query parameters (like tab) while cleaning up the URL
   */
  const updateUrlWithoutFormId = useCallback((params: URLSearchParams) => {
    const tab = params.get('tab');
    const newUrl = tab ? `${pathname}?tab=${tab}` : pathname;
    router.push(newUrl as `/${string}`, { scroll: false });
  }, [pathname, router]);

  /**
   * Fetches submissions for a selected form
   */
  const fetchSubmissions = useCallback(async (formId: string) => {
    try {
      setIsLoadingSubmissions(true);
      const response = await fetch(`/api/forms/${formId}/submissions`);
      if (!response.ok) throw new Error("Failed to fetch submissions");
      const data = await response.json();
      
      // Ensure submissions are properly formatted
      const formattedSubmissions = data.submissions.map((submission: RawSubmission) => ({
        ...submission,
        responses: submission.responses || {},
        createdAt: new Date(submission.createdAt).toISOString()
      }));
      
      setSubmissions(formattedSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setSubmissions([]);
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, []);

  /**
   * Handles form selection from the dropdown
   */
  const handleFormSelect = useCallback((formId: string) => {
    const form = forms.find((f) => f.id === formId);
    if (form) {
      setSelectedForm(form);
      fetchSubmissions(formId);
      updateUrlWithoutFormId(searchParams);
    }
  }, [forms, fetchSubmissions, searchParams, updateUrlWithoutFormId]);

  /**
   * Effect hook for fetching and filtering forms
   */
  const fetchForms = useCallback(async () => {
    try {
      const response = await fetch("/api/forms");
      if (!response.ok) throw new Error("Failed to fetch forms");
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error("Expected array of forms but got:", typeof data);
        setForms([]);
        setIsLoading(false);
        return;
      }

      let filteredForms = data as ExtendedForm[];
      
      // Filter forms based on user role
      if (userRole === "ADMIN" && session?.user?.id) {
        filteredForms = filteredForms.filter((form: ExtendedForm) => form.userId === session.user.id);
      } else if (userRole === "SADMIN") {
        // SADMIN sees all forms
        filteredForms = data;
      }
      
      setForms(filteredForms);

      const formIdFromQuery = searchParams.get('formId');
      
      if (formIdFromQuery) {
        const formToSelect = filteredForms.find(form => form.id === formIdFromQuery);
        if (formToSelect) {
          setSelectedForm(formToSelect);
          fetchSubmissions(formToSelect.id);
          setTimeout(() => {
            updateUrlWithoutFormId(searchParams);
          }, 0);
        } else if (filteredForms.length > 0) {
          setSelectedForm(filteredForms[0]);
          fetchSubmissions(filteredForms[0].id);
        }
      } else if (filteredForms.length > 0) {
        setSelectedForm(filteredForms[0]);
        fetchSubmissions(filteredForms[0].id);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
      setForms([]);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, userRole, searchParams, updateUrlWithoutFormId, fetchSubmissions]);

  useEffect(() => {
    if (session?.user) {
      fetchForms();
    }
  }, [session, userRole, fetchForms]);

  useEffect(() => {
    if (selectedForm) {
      fetchSubmissions(selectedForm.id);
    }
  }, [selectedForm, fetchSubmissions]);

  useEffect(() => {
    const handleRouteChange = () => {
      if (searchParams.has('formId')) {
        updateUrlWithoutFormId(searchParams);
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      if (searchParams.has('formId')) {
        updateUrlWithoutFormId(searchParams);
      }
    };
  }, [searchParams, updateUrlWithoutFormId]);

  const handleRowClick = (submission: FormSubmission) => {
    const locale = window.location.pathname.split('/')[1] || 'en';
    router.push(`/${locale}/admin/responses/${submission.id}`);
  };

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
                    {getResponsesText(form._count.submissions)}
                  </Badge>
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      {/* Form Responses Display */}
      {selectedForm ? (
        isLoadingSubmissions ? (
          <div className="flex items-center justify-center h-32">
            <p>{dict.formResponses.loading}</p>
          </div>
        ) : submissions.length > 0 ? (
          <div className="space-y-6">
            {/* Response Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {dict.formResponses.responses.title.replace("{0}", selectedForm.title)}
              </h2>
              <Badge variant="outline">
                {getResponsesText(submissions.length)}
              </Badge>
            </div>

            {/* Response List */}
            <ScrollArea className="h-[500px] w-full border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    {selectedForm?.fields.map((field) => (
                      <TableHead key={field.id}>{field.question}</TableHead>
                    ))}
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission, index) => (
                    <TableRow 
                      key={submission.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(submission)}
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      {selectedForm?.fields.map((field) => (
                        <TableCell key={field.id} className="text-sm text-muted-foreground">
                          {(() => {
                            const value = submission.responses[field.id];
                            if (value === null || value === undefined) return '-';
                            if (Array.isArray(value)) return value.join(', ');
                            if (typeof value === 'object' && value !== null) {
                              return JSON.stringify(value);
                            }
                            return String(value);
                          })()}
                        </TableCell>
                      ))}
                      <TableCell className="text-sm text-muted-foreground text-right">
                        {new Date(submission.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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