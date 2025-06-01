/**
 * FormActionsMenu Component
 * 
 * A dynamic dropdown menu component that provides form management actions including:
 * - Viewing form details
 * - Managing form submissions
 * - Sharing forms
 * - Reusing forms as templates
 * - Controlling form privacy settings
 * 
 * The menu adapts its available actions based on:
 * - Form publication status
 * - User permissions (owner vs admin)
 * - Form submission count
 * 
 * @component
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, ExternalLink, MoreVertical, Recycle, Lock, ListFilter, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { useDictionary } from "@/hooks/useDictionary";

/**
 * Form Interface
 * Defines the structure of a form object
 * 
 * @interface
 * @property {string} id - Unique form identifier
 * @property {string} title - Form title
 * @property {string|null} description - Form description
 * @property {Date} updatedAt - Last update timestamp
 * @property {string} userId - Creator's user ID
 * @property {boolean} isPublished - Form publication status
 * @property {Object} user - Form creator information
 * @property {Object} _count - Submission statistics
 * @property {Array} fields - Form field definitions
 * @property {Object} style - Form styling configuration
 * @property {Array} publicRequest - Public request history
 */
interface Form {
  id: string;
  title: string;
  description: string | null;
  updatedAt: Date;
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
  publicRequest?: {
    id: string;
    accepted: boolean;
  }[];
}

/**
 * FormActionsMenuProps Interface
 * Defines the props for the FormActionsMenu component
 * 
 * @interface
 * @property {Form} form - The form object to manage
 * @property {boolean} [showReuse=true] - Whether to show the reuse option
 * @property {Function} [onFormUpdate] - Callback when form is updated
 */
interface FormActionsMenuProps {
  form: Form;
  showReuse?: boolean;
  onFormUpdate?: (updatedForm: Form) => void;
}

/**
 * FormActionsMenu Component
 * Renders a dropdown menu with form management actions
 * 
 * @param {FormActionsMenuProps} props - Component props
 * @returns {JSX.Element} Rendered dropdown menu with form actions
 */
export function FormActionsMenu({ form, showReuse = true, onFormUpdate }: FormActionsMenuProps) {
  // Router and session setup
  const router = useRouter();
  const { data: session } = useSession();
  const dict = useDictionary();
  
  // Permission checks
  const isOwner = session?.user?.id === form.userId;
  const isSAdmin = session?.user?.role === "SADMIN";
  const canMakePrivate = isOwner || isSAdmin;

  /**
   * Handles form reuse
   * Creates a new form based on an existing one
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
   * Handles making a form private
   * Updates form visibility and notifies user
   */
  const handleMakePrivate = async () => {
    try {
      const response = await fetch(`/api/forms/${form.id}/private`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || dict.formActions.notifications.makePrivate.error.description);
      }

      const updatedForm = await response.json();
      
      if (onFormUpdate) {
        onFormUpdate(updatedForm);
      }

      toast({
        title: dict.formActions.notifications.makePrivate.success.title,
        description: dict.formActions.notifications.makePrivate.success.description,
      });

      if (window.location.pathname.includes('/published')) {
        router.refresh();
      }
    } catch (error) {
      toast({
        title: dict.formActions.notifications.makePrivate.error.title,
        description: error instanceof Error ? error.message : dict.formActions.notifications.makePrivate.error.description,
        variant: "destructive",
      });
    }
  };

  /**
   * Handles navigation to form submissions
   */
  const handleViewSubmissions = () => {
    router.push(`/dashboard?tab=responses&formId=${form.id}`);
  };

  /**
   * Handles requesting to make a form public
   * Creates a public request for the form
   */
  const handleRequestPublic = async () => {
    try {
      const response = await fetch(`/api/forms/${form.id}/request-public`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || dict.formActions.notifications.requestPublic.error.description);
      }

      toast({
        title: dict.formActions.notifications.requestPublic.success.title,
        description: dict.formActions.notifications.requestPublic.success.description,
      });

      if (onFormUpdate) {
        const updatedForm = await response.json();
        onFormUpdate(updatedForm);
      }
    } catch (error) {
      toast({
        title: dict.formActions.notifications.requestPublic.error.title,
        description: error instanceof Error ? error.message : dict.formActions.notifications.requestPublic.error.description,
        variant: "destructive",
      });
    }
  };

  // Check if there's a pending public request
  const hasPendingRequest = form.publicRequest?.some(request => !request.accepted);

  // Render different menu options based on form publication status
  if (!form.isPublished) {
    return (
      <DropdownMenu>
        {/* Unpublished Form Menu */}
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          {/* Request Public Option */}
          {!hasPendingRequest && (
            <DropdownMenuItem asChild>
              <Button
                variant="ghost"
                className="w-full justify-start cursor-pointer"
                onClick={handleRequestPublic}
              >
                <Globe className="h-4 w-4 mr-2" />
                {dict.formActions.menuItems.requestPublic}
              </Button>
            </DropdownMenuItem>
          )}
          
          {/* Show status if request is pending */}
          {hasPendingRequest && (
            <DropdownMenuItem disabled className="text-muted-foreground">
              <Globe className="h-4 w-4 mr-2" />
              {dict.formActions.menuItems.publicRequestPending}
            </DropdownMenuItem>
          )}

          {/* Reuse Option */}
          <DropdownMenuItem asChild>
            <Button
              variant="ghost"
              className="w-full justify-start cursor-pointer"
              onClick={() => handleReuseForm(form)}
            >
              <Recycle className="h-4 w-4 mr-2" />
              {dict.formActions.menuItems.reuseForm}
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Published Form Menu with all available options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {/* View Form Option */}
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            className="w-full justify-start cursor-pointer"
            asChild
          >
            <Link href={`/forms/${form.id}` as `/${string}`}>
              <Eye className="h-4 w-4 mr-2" />
              {dict.formActions.menuItems.viewForm}
            </Link>
          </Button>
        </DropdownMenuItem>

        {/* View Submissions Option */}
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            className="w-full justify-start cursor-pointer"
            onClick={handleViewSubmissions}
          >
            <ListFilter className="h-4 w-4 mr-2" />
            {dict.formActions.menuItems.viewSubmissions.replace("{0}", form._count.submissions.toString())}
          </Button>
        </DropdownMenuItem>

        {/* Share Form Option */}
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            className="w-full justify-start cursor-pointer"
            onClick={() => {
              const shareData = {
                title: dict.formActions.share.title.replace("{0}", form.title),
                text: dict.formActions.share.text.replace("{0}", form.title),
                url: `${window.location.origin}/forms/${form.id}`
              };
              
              if (navigator.share) {
                navigator.share(shareData).catch(console.error);
              } else {
                navigator.clipboard.writeText(shareData.url)
                  .then(() => {
                    toast({
                      title: dict.formActions.share.copied.title,
                      description: dict.formActions.share.copied.description,
                    });
                  })
                  .catch(console.error);
              }
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {dict.formActions.menuItems.shareForm}
          </Button>
        </DropdownMenuItem>

        {/* Reuse Option (if enabled) */}
        {showReuse && (
          <DropdownMenuItem asChild>
            <Button
              variant="ghost"
              className="w-full justify-start cursor-pointer"
              onClick={() => handleReuseForm(form)}
            >
              <Recycle className="h-4 w-4 mr-2" />
              {dict.formActions.menuItems.reuseForm}
            </Button>
          </DropdownMenuItem>
        )}

        {/* Make Private Option (if user has permission) */}
        {canMakePrivate && (
          <DropdownMenuItem asChild>
            <Button
              variant="ghost"
              className="w-full justify-start cursor-pointer"
              onClick={handleMakePrivate}
            >
              <Lock className="h-4 w-4 mr-2" />
              {dict.formActions.menuItems.makePrivate}
            </Button>
          </DropdownMenuItem>
        )}

        {/* Request Public Option (if form is private and no pending request) */}
        {!form.isPublished && !hasPendingRequest && (
          <DropdownMenuItem asChild>
            <Button
              variant="ghost"
              className="w-full justify-start cursor-pointer"
              onClick={handleRequestPublic}
            >
              <Globe className="h-4 w-4 mr-2" />
              {dict.formActions.menuItems.requestPublic}
            </Button>
          </DropdownMenuItem>
        )}

        {/* Show status if request is pending */}
        {!form.isPublished && hasPendingRequest && (
          <DropdownMenuItem disabled className="text-muted-foreground">
            <Globe className="h-4 w-4 mr-2" />
            {dict.formActions.menuItems.publicRequestPending}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 