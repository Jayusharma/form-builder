/**
 * PublishedFormsList Component
 * 
 * A professional interface for displaying and managing published forms that allows users to:
 * - View all published forms in the system
 * - Search and filter published forms
 * - Sort forms by various criteria (newest, oldest, submission count)
 * - View form details including creator, update time, and submission count
 * - Access form actions (view, share, reuse as template)
 * - Track form usage and popularity
 * 
 * @component
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
import { CalendarDays, User, } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { FilterBar, SortOption } from './FilterBar';
// import { ShareButton } from "../ui/share-button";
import { useRouter } from "next/navigation";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { toast } from "@/components/ui/use-toast";
import { FormActionsMenu } from "./FormActionsMenu";
import { useDictionary } from "@/hooks/useDictionary";

/**
 * Form Interface
 * Defines the structure of a published form
 * 
 * @interface
 * @property {string} id - Unique form identifier
 * @property {string} title - Form title
 * @property {string|null} description - Form description
 * @property {Date} updatedAt - Last update timestamp
 * @property {Date} createdAt - Creation timestamp
 * @property {string} userId - Creator's user ID
 * @property {boolean} isPublished - Form publication status
 * @property {Object} user - Form creator information
 * @property {string|null} user.name - Creator's name
 * @property {string|null} user.email - Creator's email
 * @property {Object} _count - Submission statistics
 * @property {number} _count.submissions - Number of form submissions
 * @property {Array} fields - Form field definitions
 * @property {Object} style - Form styling configuration
 */
interface Form {
  id: string;
  title: string;
  description: string | null;
  updatedAt: Date;
  createdAt: Date;
  userId: string;
  isPublished: boolean;
  user: {
    name: string | null;
    email: string | null;
  };
  _count: {
    submissions: number;
  };
  fields: {
    id: string;
    type: string;
    question: string;
    description: string | null;
    required: boolean;
    options: string[];
    order: number;
    gridPosition: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
  style: {
    width: string;
    alignment: string;
    spacing: string;
    borderRadius: string;
    backgroundColor: string;
    textColor: string;
    primaryColor: string;
    borderColor: string;
    fontFamily: string;
    headingFontSize: string;
    bodyFontSize: string;
  };
}

/**
 * FormActions Component
 * Renders form action buttons and menu
 * 
 * @param {Object} props - Component props
 * @param {Form} props.form - The form to render actions for
 * @param {Function} props.onReuseForm - Callback for form reuse
 * @param {Function} props.onFormUpdate - Callback for form updates
 * @returns {JSX.Element} Rendered form actions
 */
function FormActions({ form, onReuseForm, onFormUpdate }: {
  form: Form;
  onReuseForm: (form: Form) => void;
  onFormUpdate: (form: Form) => void;
}) {
  return (
    <FormActionsMenu 
      form={form} 
      onFormUpdate={onFormUpdate}
      onReuseForm={onReuseForm}
    />
  );
}

/**
 * PublishedFormsList Component
 * Main component for displaying published forms
 * 
 * @returns {JSX.Element} Rendered published forms interface
 */
export default function PublishedFormsList() {
  // Router setup
  const router = useRouter();
  const dict = useDictionary();

  // Component state management
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Sort options with translations
  const sortOptions = useMemo(() => [
    { value: "newest" as SortOption, label: dict.publishedForms.sort.newest },
    { value: "oldest" as SortOption, label: dict.publishedForms.sort.oldest },
    { value: "mostSubmissions" as SortOption, label: dict.publishedForms.sort.mostSubmissions },
    { value: "leastSubmissions" as SortOption, label: dict.publishedForms.sort.leastSubmissions },
  ], [dict.publishedForms.sort]);

  /**
   * Handles search query updates
   * Memoized callback to prevent unnecessary re-renders
   * 
   * @param {string} value - New search query
   */
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  /**
   * Handles sort option updates
   * Memoized callback to prevent unnecessary re-renders
   * 
   * @param {SortOption} value - New sort option
   */
  const handleSortChange = useCallback((value: SortOption) => {
    setSortBy(value);
  }, []);

  /**
   * Effect hook for fetching published forms
   * Loads all published forms on component mount
   */
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch('/api/forms/published');
        if (!response.ok) {
          throw new Error(dict.publishedForms.loading.error.fetchFailed);
        }
        const data = await response.json();
        setForms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : dict.publishedForms.loading.error.defaultError);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [dict.publishedForms.loading.error]);

  /**
   * Filters and sorts forms based on search query and sort option
   * Applies search filter and sorting criteria to the forms list
   */
  const filteredAndSortedForms = forms
    .filter((form) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        form.title.toLowerCase().includes(searchLower) ||
        form.description?.toLowerCase().includes(searchLower) ||
        form.user.name?.toLowerCase().includes(searchLower) ||
        form.user.email?.toLowerCase().includes(searchLower) ||
        form.id.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "oldest":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "mostSubmissions":
          return b._count.submissions - a._count.submissions;
        case "leastSubmissions":
          return a._count.submissions - b._count.submissions;
        default:
          return 0;
      }
    });

  /**
   * Handles form reuse
   * Creates a new form based on an existing published form
   * 
   * @param {Form} form - Form to be reused as template
   */
  const handleReuseForm = (form: Form) => {
    const formData = encodeURIComponent(JSON.stringify({
      title: form.title,
      description: form.description,
      fields: form.fields,
      style: form.style
    }));
    router.push(`/admin/forms/create?reuse=${formData}`);
  };

  /**
   * Handles form updates
   * Updates the local state when a form is modified
   * 
   * @param {Form} updatedForm - Updated form data
   */
  const handleFormUpdate = (updatedForm: Form) => {
    setForms(forms.filter(form => form.id !== updatedForm.id));
  };

  const getSubmissionsText = (count: number) => {
    return count === 1 
      ? dict.publishedForms.form.submissions.single.replace("{0}", count.toString())
      : dict.publishedForms.form.submissions.multiple.replace("{0}", count.toString());
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        placeholder={dict.publishedForms.search.placeholder}
      />
      
      {/* Loading State */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        // Error State
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold text-red-600">{dict.publishedForms.loading.error.title}</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      ) : filteredAndSortedForms.length === 0 ? (
        // Empty State
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold text-gray-900">{dict.publishedForms.empty.title}</h2>
          <p className="mt-2 text-gray-600">
            {searchQuery 
              ? dict.publishedForms.empty.noResults
              : dict.publishedForms.empty.noForms}
          </p>
        </div>
      ) : (
        // Forms Grid
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedForms.map((form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow">
              {/* Form Card Header */}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="line-clamp-1">{form.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {form.description || dict.publishedForms.form.noDescription}
                    </CardDescription>
                  </div>
                  <FormActions 
                    form={form} 
                    onReuseForm={handleReuseForm}
                    onFormUpdate={handleFormUpdate}
                  />
                </div>
              </CardHeader>
              {/* Form Card Content */}
              <CardContent>
                <div className="space-y-4">
                  {/* Creator Info */}
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="mr-2 h-4 w-4" />
                    <span>{dict.publishedForms.form.creator.title} {form.user.name || form.user.email}</span>
                  </div>
                  {/* Last Updated Info */}
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span>
                      {dict.publishedForms.form.lastUpdated.replace(
                        "{0}",
                        formatDistanceToNow(new Date(form.updatedAt))
                      )}
                    </span>
                  </div>
                  {/* Submission Count */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-gray-500">
                      {getSubmissionsText(form._count.submissions)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 