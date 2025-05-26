/**
 * User Edit Page Component
 * 
 * This page provides a detailed interface for super administrators to manage user accounts.
 * It includes:
 * - User profile editing
 * - Role management
 * - Two-factor authentication status
 * - Account deletion
 * - Role-based access control
 */

"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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

/**
 * User Edit Page Props Interface
 * Defines the expected parameters for the page component
 */
interface UserEditPageProps {
    params: Promise<{
      userId: string;
    }>;
  }

/**
 * User Data Interface
 * Defines the structure of user data for editing
 */
interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "USER" | "MANAGER" | "SADMIN";
  isTwoFactorEnabled: boolean;
  createdAt: string;
  adminCodes?: { code: string }[];
}

/**
 * User Edit Page Component
 * Provides a form interface for editing user details and permissions
 * 
 * @param {UserEditPageProps} props - The component props
 * @returns {JSX.Element} The rendered user edit page
 */
export default function UserEditPage({ params }: UserEditPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const { userId } = use(params);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/users/${userId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        const data = await response.json();
        setUserData(data.user);
      } catch (error) {
        setError("Failed to load user data");
        console.error("Failed to fetch user:", error);
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.role === "SADMIN") {
      fetchUserData();
    } else {
      router.push("/");
    }
  }, [userId, router, session, toast]);

  /**
   * Handles form submission for user updates
   * Updates user details including name, role, and 2FA status
   * 
   * @param {React.FormEvent} e - The form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          isTwoFactorEnabled: userData.isTwoFactorEnabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      setSuccess("User updated successfully");
      toast({
        title: "Success",
        description: "User has been updated",
        variant: "default",
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles user account deletion
   * Removes the user account and redirects to user search
   */
  const handleDeleteUser = async () => {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast({
        title: "Success",
        description: "User has been deleted",
        variant: "default",
      });

      // Redirect to users list page
      router.push("/search");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  // Prevent access if user is not a super admin
  if (!session?.user || session.user.role !== "SADMIN") {
    router.push("/");
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state if user not found
  if (!userData) {
    return (
      <div className="container px-4 py-6 md:py-10">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested user could not be found.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/admin/users")}>Back to Users</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 md:py-10">
      {/* User edit form card */}
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl md:text-2xl">Edit User</CardTitle>
          <CardDescription>
            Manage user details and permissions
          </CardDescription>
        </CardHeader>

        {/* User edit form */}
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Name input field */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={userData.name || ""}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                placeholder="User name"
                className="w-full"
              />
            </div>

            {/* Email display field (disabled) */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={userData.email || ""}
                disabled
                type="email"
                className="w-full bg-muted/50"
              />
            </div>

            {/* Role selection dropdown */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={userData.role}
                onValueChange={(value: "ADMIN" | "USER" | "MANAGER" | "SADMIN") => 
                  setUserData({ ...userData, role: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: "USER", label: "User" },
                    { value: "ADMIN", label: "Admin" },
                    { value: "MANAGER", label: "Manager" },
                    { value: "SADMIN", label: "Super Admin" }
                  ].map((role) => (
                    <SelectItem key={`role-${role.value}`} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Created at timestamp (disabled) */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Created At</label>
              <Input
                value={new Date(userData.createdAt).toLocaleString()}
                disabled
                className="w-full bg-muted/50"
              />
            </div>

            {/* Admin Code display (only for admin users) */}
            {userData.role === "ADMIN" && userData.adminCodes?.[0] && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Admin Organization Code</label>
                <div className="flex gap-2">
                  <Input
                    value={userData.adminCodes[0].code}
                    disabled
                    className="w-full bg-muted/50 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(userData.adminCodes![0].code);
                      toast({
                        title: "Copied!",
                        description: "Admin code copied to clipboard",
                      });
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share this code with users who should join your organization
                </p>
              </div>
            )}

            {/* Error message display */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success message display */}
            {success && (
              <div className="flex items-center gap-2 text-emerald-500 text-sm p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </CardContent>

          {/* Form action buttons */}
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
            {/* Delete user dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" disabled={isDeleting} className="w-full sm:w-auto">
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md mx-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user
                    account and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                  <AlertDialogCancel className="w-full sm:w-auto mt-2 sm:mt-0">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                    onClick={handleDeleteUser}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Save and cancel buttons */}
            <div className="flex gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => router.push("/admin/users")}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 sm:flex-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}