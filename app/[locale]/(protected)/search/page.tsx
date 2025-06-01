/**
 * User Search Page Component
 * 
 * This page provides a search interface for super administrators to find users.
 * It includes:
 * - Real-time user search
 * - User listing with details
 * - Role-based access control
 * - Responsive table layout
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDictionary } from "@/hooks/useDictionary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * User Interface
 * Defines the structure of user data displayed in the search results
 */
interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  _count: { forms: string }
  forms: number;
}

/**
 * User Search Page Component
 * Provides a search interface for finding users
 * 
 * @returns {JSX.Element} The rendered search page
 */
export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const dict = useDictionary();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches all users from the API
   * Updates the users state with the results
   */
  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search');
      if (!response.ok) throw new Error(dict.search.errors.fetchFailed);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching all users:", error);
    } finally {
      setLoading(false);
    }
  }, [dict.search.errors.fetchFailed]);

  // Check user role and fetch initial data
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user || session.user.role !== "SADMIN") {
      router.push("/");
    } else {
      fetchAllUsers();
    }
  }, [session, status, router, fetchAllUsers]);

  // Prevent rendering if user is not a super admin
  if (status === "loading") {
    return <p className="text-center">{dict.search.states.loading}</p>;
  }

  if (!session?.user || session.user.role !== "SADMIN") {
    return null;
  }

  /**
   * Handles search input changes
   * Fetches filtered users based on search query
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event
   */
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length === 0) {
      fetchAllUsers();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error(dict.search.errors.searchFailed);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Search error:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId: string) => {
    // Extract locale from the current pathname
    const locale = pathname.split('/')[1];
    router.push(`/${locale}/users/${userId}`);
  };

  return (
    <div className="container mx-auto py-10">
      {/* Search input with icon */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder={dict.search.placeholder}
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && <p className="text-center">{dict.search.states.loading}</p>}

      {/* User results table */}
      {!loading && users.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dict.search.table.headers.name}</TableHead>
              <TableHead>{dict.search.table.headers.email}</TableHead>
              <TableHead>{dict.search.table.headers.role}</TableHead>
              <TableHead>{dict.search.table.headers.forms}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user._count.forms}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Empty state */}
      {!loading && users.length === 0 && (
        <p className="text-center">{dict.search.states.noResults}</p>
      )}
    </div>
  );
}