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
import { useDictionary } from "@/hooks/useDictionary";
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
  const dict = useDictionary();
  
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
        throw new Error(data.error || dict.review.notifications.accept.error.description);
      }

      toast({
        title: dict.review.notifications.accept.success.title,
        description: dict.review.notifications.accept.success.description,
      });

      router.push('/dashboard?tab=requests');
      router.refresh();
    } catch (error) {
      toast({
        title: dict.review.notifications.accept.error.title,
        description: error instanceof Error ? error.message : dict.review.notifications.accept.error.description,
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
        throw new Error(data.error || dict.review.notifications.reject.error.description);
      }

      toast({
        title: dict.review.notifications.reject.success.title,
        description: dict.review.notifications.reject.success.description,
      });

      router.push('/dashboard?tab=requests');
      router.refresh();
    } catch (error) {
      toast({
        title: dict.review.notifications.reject.error.title,
        description: error instanceof Error ? error.message : dict.review.notifications.reject.error.description,
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
          {dict.review.actions.backToRequests}
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
              {dict.review.actions.rejectRequest}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dict.review.confirmations.reject.title}</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                {dict.review.confirmations.reject.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className="mt-0">{dict.review.actions.cancel}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {dict.review.actions.reject}
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
              {dict.review.actions.acceptRequest}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dict.review.confirmations.accept.title}</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                {dict.review.confirmations.accept.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className="mt-0">{dict.review.actions.cancel}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAccept}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {dict.review.actions.accept}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 