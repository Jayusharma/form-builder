/**
 * MyForms Component
 * 
 * A professional form management interface that allows users to:
 * - View and manage their created forms
 * - Create new forms
 * - Search and filter existing forms
 * - Sort forms by various criteria
 * - Reuse existing forms as templates
 * - Track form submissions and publication status
 * - Perform form actions (edit, delete, share, etc.)
 * 
 * @component
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, Copy, ExternalLink, Recycle, MoreVertical, CalendarDays, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { ShareButton } from "@/components/ui/share-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormActionsMenu } from "./FormActionsMenu";
import { FilterBar, SortOption } from "./FilterBar";

/**
 * MyFormsProps Interface
 * Defines the props for the MyForms component
 * 
 * @interface
 * @property {string} [className] - Optional CSS class name for styling
 * @property {string} [userRole] - Optional user role to filter forms
 */
interface MyFormsProps {
  className?: string;
  userRole?: string;
}

/**
 * Form Interface
 * Defines the structure of a form object
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
 * @property {Object} _count - Submission count statistics
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
    role: string;
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
 * Sort options configuration
 * Defines available sorting criteria for forms
 */
const sortOptions = [
  { value: "newest" as SortOption, label: "Newest First" },
  { value: "oldest" as SortOption, label: "Oldest First" },
  { value: "mostSubmissions" as SortOption, label: "Most Submissions" },
  { value: "leastSubmissions" as SortOption, label: "Least Submissions" },
];

/**
 * MyForms Component
 * Main component for managing user's forms
 * 
 * @param {MyFormsProps} props - Component props
 * @returns {JSX.Element} Rendered form management interface
 */
export default function MyForms({ className, userRole }: MyFormsProps) {
  // Router and toast notification setup
  const router = useRouter();
  const { toast } = useToast();

  // Component state management
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

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
   * Effect hook for fetching forms
   * Loads user's forms on component mount
   * Filters forms based on user role if provided
   */
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch("/api/forms");
        if (!response.ok) {
          throw new Error("Failed to fetch forms");
        }
        const data = await response.json();
        
        // Filter forms based on user role
        let filteredForms = data.forms || [];
        if (userRole === "SADMIN") {
          // For super admin, only show forms created by super admins
          filteredForms = filteredForms.filter((form: Form) => 
            form.user.role === "SADMIN"
          );
        }
        
        setForms(filteredForms);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [userRole]);

  /**
   * Handles form reuse
   * Creates a new form based on an existing one
   * 
   * @param {Form} form - Form to be reused
   */
  const handleReuseForm = (form: Form) => {
    // Encode form data for URL transmission
    const formData = encodeURIComponent(JSON.stringify({
      title: form.title,
      description: form.description,
      fields: form.fields,
      style: form.style
    }));
    router.push(`/admin/forms/create?reuse=${formData}`);
  };

  /**
   * Filters and sorts forms based on search query and sort option
   * Applies search filter and sorting criteria to the forms list
   */
  const filteredAndSortedForms = forms
    .filter((form) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        form.title.toLowerCase().includes(searchLower) ||
        form.description?.toLowerCase().includes(searchLower)
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

  return (
    <div className="space-y-6">
      {/* Create Form Button */}
      <div className="flex justify-between items-center">
        <Button onClick={() => router.push("/admin/forms/create")}>
          Create New Form
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        placeholder="Search your forms..."
      />

      {/* Loading State */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      ) : error ? (
        // Error State
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold text-red-600">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      ) : filteredAndSortedForms.length === 0 ? (
        // Empty State
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold text-gray-900">No Forms Found</h2>
          <p className="mt-2 text-gray-600">
            {searchQuery 
              ? "No forms match your search criteria."
              : "You haven't created any forms yet."}
          </p>
          {!searchQuery && (
            <Button
              className="mt-4"
              onClick={() => router.push("/admin/forms/create")}
            >
              Create Your First Form
            </Button>
          )}
        </div>
      ) : (
        // Forms Grid
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedForms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              {/* Form Card Header */}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="line-clamp-1">{form.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {form.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={form.isPublished ? "default" : "secondary"}>
                      {form.isPublished ? "Published" : "Not Published"}
                    </Badge>
                    <FormActionsMenu form={form} />
                  </div>
                </div>
              </CardHeader>

              {/* Form Card Content */}
              <CardContent>
                <div className="space-y-4">
                  {/* Last Updated Info */}
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span>Updated {formatDistanceToNow(new Date(form.updatedAt))} ago</span>
                  </div>
                  {/* Submission Count */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-gray-500">
                      {form._count.submissions} submission{form._count.submissions !== 1 ? 's' : ''}
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
