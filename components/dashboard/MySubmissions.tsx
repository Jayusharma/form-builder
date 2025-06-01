/**
 * MySubmissions Component
 * 
 * Displays a list of form submissions made by the user.
 * Includes search and sort functionality.
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FilterBar, SortOption } from "@/components/forms/FilterBar";
import { useDictionary } from "@/hooks/useDictionary";

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

/**
 * MySubmissions Component
 * Renders a grid of form submissions with interactive cards
 * 
 * @returns {JSX.Element} Rendered submissions interface
 */
export default function MySubmissions() {
  const router = useRouter();
  const { locale } = useParams();
  const dict = useDictionary();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const sortOptions = [
    { value: "newest" as SortOption, label: dict.dashboard.mySubmissions.sort.newest },
    { value: "oldest" as SortOption, label: dict.dashboard.mySubmissions.sort.oldest },
  ];

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch("/api/users/submissions");
        if (!response.ok) throw new Error(dict.dashboard.mySubmissions.error.fetchFailed);
        const data = await response.json();
        setSubmissions(data.submissions);
      } catch (error) {
        setError(error instanceof Error ? error.message : dict.dashboard.mySubmissions.error.loadFailed);
        console.error("Failed to fetch submissions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [dict.dashboard.mySubmissions.error]);

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
        <p>{dict.dashboard.mySubmissions.noSubmissions}</p>
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
        placeholder={dict.dashboard.mySubmissions.search.placeholder}
      />

      {filteredSubmissions.length === 0 ? (
        <div className="text-center text-muted-foreground p-4">
          <p>{dict.dashboard.mySubmissions.noResults}</p>
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
                    {dict.dashboard.mySubmissions.submission.submittedOn.replace(
                      "{0}",
                      new Date(submission.createdAt).toLocaleDateString()
                    )}
                  </p>
                  <Button
                    onClick={() => router.push(`/${locale}/submissions/${submission.id}` as `/${string}${string}`)}
                    variant="outline"
                  >
                    {dict.dashboard.mySubmissions.submission.viewButton}
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