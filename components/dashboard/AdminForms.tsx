/**
 * AdminForms Component
 * 
 * Displays a list of forms created by the admin that the user is connected to.
 * Users can click on forms to fill them out.
 * Includes search and sort functionality.
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FilterBar, SortOption } from "@/components/forms/FilterBar";

interface Form {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
}

const sortOptions = [
  { value: "newest" as SortOption, label: "Newest First" },
  { value: "oldest" as SortOption, label: "Oldest First" },
];

export default function AdminForms() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch("/api/users/admin-forms");
        if (!response.ok) throw new Error("Failed to fetch forms");
        const data = await response.json();
        setForms(data.forms);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load forms");
        console.error("Failed to fetch forms:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForms();
  }, []);

  // Filter and sort forms
  const filteredForms = useMemo(() => {
    let result = [...forms];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        form =>
          form.title.toLowerCase().includes(query) ||
          (form.description?.toLowerCase().includes(query) ?? false)
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
  }, [forms, searchQuery, sortBy]);

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

  if (forms.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        <p>No forms available from your organization yet.</p>
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
        placeholder="Search forms..."
      />

      {filteredForms.length === 0 ? (
        <div className="text-center text-muted-foreground p-4">
          <p>No forms match your search criteria.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredForms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{form.title}</CardTitle>
                {form.description && (
                  <CardDescription className="line-clamp-2">
                    {form.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(form.createdAt).toLocaleDateString()}
                  </p>
                  <Button
                    onClick={() => router.push(`/forms/${form.id}`)}
                    variant="default"
                  >
                    Fill Form
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