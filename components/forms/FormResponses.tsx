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
import { FilterBar, SortOption } from "@/components/forms/FilterBar";

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
  adminCode?: {
    adminId: string;
  };
}

/**
 * FormResponsesProps Interface
 * Defines the props for the FormResponses component
 * 
 * @interface
 * @property {("ADMIN" | "MANAGER" | "SADMIN" | "USER")} userRole - User's role for access control
 */
interface FormResponsesProps {
  userRole: "ADMIN" | "MANAGER" | "SADMIN" | "USER";
}

interface RawSubmission extends Omit<FormSubmission, 'responses' | 'createdAt'> {
  responses: Record<string, string | number | boolean | string[] | null>;
  userId: string;
  id: string;
  formId: string;
  createdAt: string; // Raw date string from API
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
  const [submissions, setSubmissions] = useState<RawSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Add sortOptions
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" }
  ];

  // Function to check if a string might be a date
  const isDateQuery = (query: string): boolean => {
    // Check for common date formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, etc.
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY or MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY or MM-DD-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // D/M/YYYY or M/D/YYYY
      /^\d{1,2}-\d{1,2}-\d{4}$/, // D-M-YYYY or M-D-YYYY
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    ];
    return datePatterns.some(pattern => pattern.test(query));
  };

  // Function to normalize date string to ISO format for comparison
  const normalizeDate = (dateStr: string): Date | null => {
    const cleanDate = dateStr.trim();
    
    // Try parsing different date formats
    const formats = [
      // YYYY-MM-DD
      (str: string) => {
        const [year, month, day] = str.split('-').map(Number);
        return new Date(year, month - 1, day);
      },
      // DD/MM/YYYY
      (str: string) => {
        const [day, month, year] = str.split('/').map(Number);
        return new Date(year, month - 1, day);
      },
      // MM/DD/YYYY
      (str: string) => {
        const [month, day, year] = str.split('/').map(Number);
        return new Date(year, month - 1, day);
      },
      // YYYY/MM/DD
      (str: string) => {
        const [year, month, day] = str.split('/').map(Number);
        return new Date(year, month - 1, day);
      }
    ];

    for (const format of formats) {
      try {
        const date = format(cleanDate);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch {
        continue;
      }
    }

    return null;
  };

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
    if (!session?.user?.id) {
      console.error("No user session found");
      setSubmissions([]);
      return;
    }

    try {
      setIsLoadingSubmissions(true);
      
      const response = await fetch(`/api/forms/${formId}/submissions`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || response.statusText || "Failed to fetch submissions");
      }
      
      const data = await response.json();
      
      // Handle the response data structure correctly
      const submissionsData = data.submissions || [];
      if (!Array.isArray(submissionsData)) {
        console.error("Expected array of submissions but got:", typeof submissionsData);
        setSubmissions([]);
        return;
      }

      const formattedSubmissions = submissionsData.map((submission: RawSubmission) => ({
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
  }, [session?.user?.id]);

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
    if (!session?.user?.id) {
      console.error("No user session found");
      setForms([]);
      setIsLoading(false);
      return;
    }
  
    try {
      // For USER role, use the admin-forms endpoint
      const response = await fetch(
        userRole === "USER" 
          ? `/api/users/admin-forms` 
          : "/api/forms"
      );
      
      if (!response.ok) throw new Error("Failed to fetch forms");
      const data = await response.json();
  
      // Debug logging to see what we actually receive
      console.log("API response:", data);
      console.log("Type:", typeof data);
      console.log("Has forms property:", 'forms' in data);
      console.log("data.forms type:", typeof data.forms);
      console.log("Is data.forms array:", Array.isArray(data.forms));
  
      // Handle different response structures
      let formsArray: ExtendedForm[] = [];
      
      if (Array.isArray(data)) {
        // Direct array response
        formsArray = data;
      } else if (data && Array.isArray(data.forms)) {
        // Object with forms property containing array
        formsArray = data.forms;
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Single form object or unexpected structure
        console.warn("Unexpected data structure received:", data);
        // Try to extract forms from various possible structures
        if (data.data && Array.isArray(data.data)) {
          formsArray = data.data;
        } else if (data.results && Array.isArray(data.results)) {
          formsArray = data.results;
        } else {
          // If it's a single form object, wrap it in an array
          formsArray = [data];
        }
      } else {
        console.error("Expected array of forms but got:", typeof data, data);
        setForms([]);
        setIsLoading(false);
        return;
      }
  
      // Ensure we have a valid array
      if (!Array.isArray(formsArray)) {
        console.error("Could not extract forms array from response");
        setForms([]);
        setIsLoading(false);
        return;
      }
  
      let filteredForms = formsArray as ExtendedForm[];
      
      // Filter forms based on user role
      if (userRole === "ADMIN") {
        // ADMIN sees forms they created
        filteredForms = filteredForms.filter(form => form.userId === session.user.id);
      }
      // For USER role, we don't need to filter since the API already returns the correct forms
      // SADMIN and MANAGER see all forms
      
      setForms(filteredForms);
  
      // Select initial form
      if (filteredForms.length > 0) {
        const formIdFromQuery = searchParams.get('formId');
        let formToSelect;
        
        if (formIdFromQuery) {
          formToSelect = filteredForms.find(form => form.id === formIdFromQuery);
        }
        
        if (!formToSelect) {
          formToSelect = filteredForms[0];
        }
  
        setSelectedForm(formToSelect);
        fetchSubmissions(formToSelect.id);
        
        if (formIdFromQuery) {
          setTimeout(() => {
            updateUrlWithoutFormId(searchParams);
          }, 0);
        }
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

  const handleRowClick = (submission: RawSubmission) => {
    const locale = window.location.pathname.split('/')[1] || 'en';
    router.push(`/${locale}/admin/responses/${submission.id}`);
  };

  // Filter and sort submissions
  const filteredSubmissions = submissions.filter(submission => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    
    // Check if the search query might be a date
    if (isDateQuery(query)) {
      const searchDate = normalizeDate(query);
      if (searchDate) {
        const submissionDate = new Date(submission.createdAt);
        // Compare dates (ignoring time)
        return (
          submissionDate.getFullYear() === searchDate.getFullYear() &&
          submissionDate.getMonth() === searchDate.getMonth() &&
          submissionDate.getDate() === searchDate.getDate()
        );
      }
    }

    // Search in submission date
    const submissionDate = new Date(submission.createdAt).toLocaleDateString();
    if (submissionDate.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in all response values
    if (!selectedForm?.fields) return false;
    
    return selectedForm.fields.some(field => {
      // Skip certain field types
      if (['RICH_TEXT', 'SUBMIT', 'SEPARATOR'].includes(field.type)) return false;
      
      const value = submission.responses[field.id];
      if (value === null || value === undefined) return false;
      
      const stringValue = Array.isArray(value) 
        ? value.join(' ') 
        : typeof value === 'object' 
          ? JSON.stringify(value) 
          : String(value);
          
      return stringValue.toLowerCase().includes(query);
    });
  });

  // Sort submissions
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });

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
          {userRole === "USER" 
            ? "No published forms available from your organization"
            : userRole === "ADMIN"
              ? dict.formResponses.noForms.admin
              : dict.formResponses.noForms.manager}
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
                    {userRole === "USER" 
                      ? `${selectedForm?.id === form.id ? submissions.length : 0} responses`
                      : getResponsesText(form._count.submissions)
                    }
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
        ) : sortedSubmissions.length > 0 ? (
          <div className="space-y-6">
            {/* Response Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {dict.formResponses.responses.title.replace("{0}", selectedForm.title)}
              </h2>
              <Badge variant="outline">
                {getResponsesText(sortedSubmissions.length)}
              </Badge>
            </div>

            {/* Add FilterBar */}
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={(value) => setSortBy(value as "newest" | "oldest")}
              sortOptions={sortOptions}
              placeholder="Search responses..."
            />

            {/* Response List */}
            <ScrollArea className="h-[500px] w-full border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    {selectedForm?.fields && selectedForm.fields
                      .filter(field => !['RICH_TEXT', 'SUBMIT', 'SEPARATOR'].includes(field.type))
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((field) => (
                        <TableHead key={field.id} className="whitespace-nowrap">
                          {field.question}
                        </TableHead>
                    ))}
                    <TableHead className="text-right whitespace-nowrap">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSubmissions.map((submission, index) => (
                    <TableRow 
                      key={submission.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(submission)}
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      {selectedForm?.fields && selectedForm.fields
                        .filter(field => !['RICH_TEXT', 'SUBMIT', 'SEPARATOR'].includes(field.type))
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((field) => (
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
                      <TableCell className="text-sm text-muted-foreground text-right whitespace-nowrap">
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
            <p className="text-muted-foreground">
              {userRole === "USER" 
                ? "You haven't submitted any responses to this form yet"
                : dict.formResponses.responses.noResponses}
            </p>
          </div>
        )
      ) : null}
    </div>
  );
} 