/**
 * MySubmissions Component
 * 
 * Displays a list of form submissions made by the user.
 * Includes search and sort functionality.
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FilterBar, SortOption } from "@/components/forms/FilterBar";

/**
 * Submission Interface
 * Defines the structure of a form submission
 * 
 * @interface
 * @property {string} id - Unique submission identifier
 * @property {string} formId - Form identifier
 * @property {Object} form - Associated form information
 * @property {string} form.title - Form title
 * @property {string|null} form.description - Form description
 * @property {string} createdAt - Submission timestamp
 * @property {Record<string, any>} responses - Submitted form responses
 */
interface Submission {
  id: string;
  formId: string;
  form: {
    title: string;
    description: string | null;
  };
  createdAt: string;
  responses: Record<string, any>;
}

const sortOptions = [
  { value: "newest" as SortOption, label: "Newest First" },
  { value: "oldest" as SortOption, label: "Oldest First" },
];

/**
 * MySubmissions Component
 * Renders a grid of form submissions with interactive cards
 * 
 * @returns {JSX.Element} Rendered submissions interface
 */
export default function MySubmissions() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch("/api/users/submissions");
        if (!response.ok) throw new Error("Failed to fetch submissions");
        const data = await response.json();
        setSubmissions(data.submissions);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load submissions");
        console.error("Failed to fetch submissions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let result = [...submissions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        submission =>
          submission.form.title.toLowerCase().includes(query) ||
          (submission.form.description?.toLowerCase().includes(query) ?? false)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
    }

    return result;
  }, [submissions, searchQuery, sortBy]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-4">
        <p>{error}</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        <p>You haven't submitted any forms yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={sortOptions}
        placeholder="Search submissions..."
      />

      {filteredSubmissions.length === 0 ? (
        <div className="text-center text-muted-foreground p-4">
          <p>No submissions match your search criteria.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{submission.form.title}</CardTitle>
                {submission.form.description && (
                  <CardDescription className="line-clamp-2">
                    {submission.form.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Submitted {new Date(submission.createdAt).toLocaleDateString()}
                  </p>
                  <Button
                    onClick={() => router.push(`/submissions/${submission.id}`)}
                    variant="outline"
                  >
                    View Submission
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 