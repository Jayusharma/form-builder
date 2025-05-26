/**
 * ReviewActions Component
 * 
 * A component that provides form request review actions including:
 * - Accepting form publication requests
 * - Rejecting form publication requests
 * - Navigation back to requests list
 * - Confirmation dialogs for actions
 * - Loading states during processing
 * 
 * Used in the form review interface to manage form publication requests
 * 
 * @component
 */

'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
 * ReviewActionsProps Interface
 * Defines the props for the ReviewActions component
 * 
 * @interface
 * @property {string} formId - ID of the form being reviewed
 * @property {string} requestId - ID of the publication request
 */
interface ReviewActionsProps {
  formId: string;
  requestId: string;
}

/**
 * ReviewActions Component
 * Renders action buttons for reviewing form publication requests
 * 
 * @param {ReviewActionsProps} props - Component props
 * @returns {JSX.Element} Rendered review actions interface
 */
export function ReviewActions({ formId, requestId }: ReviewActionsProps) {
  // Router and toast setup
  const router = useRouter();
  const { toast } = useToast();
  
  // Loading state management
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handles accepting a form publication request
   * Updates request status and notifies user
   */
  const handleAccept = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/requests/${requestId}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept request');
      }

      toast({
        title: "Request accepted",
        description: "The form has been published successfully.",
      });

      router.push('/dashboard?tab=requests');
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles rejecting a form publication request
   * Updates request status and notifies user
   */
  const handleReject = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/requests/${requestId}/reject`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject request');
      }

      toast({
        title: "Request rejected",
        description: "The request has been rejected successfully.",
      });

      router.push('/dashboard?tab=requests');
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Back Navigation */}
      <Link href="/dashboard?tab=requests">
        <Button 
          variant="ghost" 
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Requests
        </Button>
      </Link>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {/* Reject Request Dialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive"
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Reject Request
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to reject this request?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. The form request will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Accept Request Dialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="default"
              disabled={isProcessing}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              Accept Request
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to accept this request?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will publish the form and make it available to the public. The request will be removed from the pending requests.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAccept}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Accept
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 