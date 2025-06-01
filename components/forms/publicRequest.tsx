/**
 * PublicRequest Component
 * 
 * A professional interface for managing form publication requests that allows users to:
 * - View and manage form publication requests
 * - Search and filter requests
 * - Sort requests by various criteria (newest, oldest, pending, accepted)
 * - Review form details before approval
 * - Approve or reject form publication requests
 * - Track request status and history
 * 
 * @component
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FilterBar, SortOption } from "./FilterBar";
import { useDictionary } from "@/hooks/useDictionary";

/**
 * Request Interface
 * Defines the structure of a form publication request
 * 
 * @interface
 * @property {string} id - Unique request identifier
 * @property {string} formId - Associated form identifier
 * @property {Object} form - Form details
 * @property {string} form.id - Form identifier
 * @property {string} form.title - Form title
 * @property {string|null} form.description - Form description
 * @property {string} form.userId - Form creator's user ID
 * @property {Date} form.updatedAt - Last update timestamp
 * @property {Object} form.user - Form creator information
 * @property {string|null} form.user.name - Creator's name
 * @property {string|null} form.user.email - Creator's email
 * @property {boolean} accepted - Request approval status
 */
interface Request {
  id: string;
  formId: string;
  form: {
    id: string;
    title: string;
    description: string | null;
    userId: string;
    updatedAt: Date;
    user: {
      name: string | null;
      email: string | null;
    };
  };
  accepted: boolean;
}

/**
 * PublicRequest Component
 * Main component for managing form publication requests
 * 
 * @returns {JSX.Element} Rendered request management interface
 */
export default function PublicRequest() {
  // Router and session setup
  const router = useRouter();
  const { data: session } = useSession();
  const dict = useDictionary();

  // Component state management
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Sort options with translations
  const sortOptions = useMemo(() => [
    { value: "newest" as SortOption, label: dict.publicRequest.sort.newest },
    { value: "oldest" as SortOption, label: dict.publicRequest.sort.oldest },
    { value: "pending" as SortOption, label: dict.publicRequest.sort.pending },
    { value: "accepted" as SortOption, label: dict.publicRequest.sort.accepted },
  ], [dict.publicRequest.sort]);

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
   * Effect hook for fetching requests
   * Loads form requests when user session is available
   */
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch("/api/forms/requests");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || dict.publicRequest.notifications.error.fetchFailed);
        }
        const data = await response.json();
        if (!data.requests) {
          throw new Error(dict.publicRequest.notifications.error.invalidResponse);
        }
        setRequests(data.requests);
      } catch (error) {
        console.error("Error fetching requests:", error);
        toast.error(error instanceof Error ? error.message : dict.publicRequest.notifications.error.loadFailed);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchRequests();
    }
  }, [session, dict.publicRequest.notifications.error]);

  /**
   * Handles request approval or rejection
   * Updates request status and notifies user of the action
   * 
   * @param {string} requestId - ID of the request to process
   * @param {"approve" | "reject"} action - Action to perform on the request
   */
  const handleRequestAction = async (requestId: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/forms/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || dict.publicRequest.notifications.error.actionFailed.replace("{0}", action));
      }

      // Update the local state
      setRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === requestId
            ? { ...request, accepted: action === "approve" }
            : request
        )
      );

      toast.success(dict.publicRequest.notifications.success.actionSuccess.replace("{0}", action));
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      toast.error(error instanceof Error ? error.message : dict.publicRequest.notifications.error.actionFailed.replace("{0}", action));
    }
  };

  /**
   * Filters and sorts requests based on search query and sort option
   * Applies search filter and sorting criteria to the requests list
   */
  const filteredAndSortedRequests = requests
    .filter((request) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        request.form.title.toLowerCase().includes(searchLower) ||
        request.form.description?.toLowerCase().includes(searchLower) ||
        request.form.user.name?.toLowerCase().includes(searchLower) ||
        request.form.user.email?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.form.updatedAt).getTime() - new Date(a.form.updatedAt).getTime();
        case "oldest":
          return new Date(a.form.updatedAt).getTime() - new Date(b.form.updatedAt).getTime();
        case "pending":
          return a.accepted === b.accepted ? 0 : a.accepted ? 1 : -1;
        case "accepted":
          return a.accepted === b.accepted ? 0 : a.accepted ? -1 : 1;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        placeholder={dict.publicRequest.search.placeholder}
      />

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <p>{dict.publicRequest.loading}</p>
        </div>
      ) : filteredAndSortedRequests.length === 0 ? (
        // Empty State
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchQuery 
              ? dict.publicRequest.empty.noResults
              : dict.publicRequest.empty.noRequests}
          </p>
        </div>
      ) : (
        // Requests List
        <ScrollArea className="h-[600px] rounded-md border">
          <div className="space-y-6 p-6">
            {filteredAndSortedRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                {/* Request Card Header */}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.form.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {dict.publicRequest.request.requestedBy.replace(
                          "{0}",
                          request.form.user.name || request.form.user.email || ""
                        )}
                      </p>
                    </div>
                    {/* Request Status Badge */}
                    <Badge
                      variant={
                        !request.accepted
                          ? "default"
                          : "secondary"
                      }
                    >
                      {request.accepted 
                        ? dict.publicRequest.request.status.approved 
                        : dict.publicRequest.request.status.pending}
                    </Badge>
                  </div>
                </CardHeader>
                {/* Request Card Content */}
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {!request.accepted && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/review/${request.formId}` as `/${string}`)}
                          >
                            {dict.publicRequest.request.actions.review}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}