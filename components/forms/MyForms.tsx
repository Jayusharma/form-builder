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

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useDictionary } from '@/hooks/useDictionary';
import { Route } from 'next';
import { useTypedNavigation } from '@/hooks/useTypedNavigation';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';
import { FormActionsMenu } from '@/components/forms/FormActionsMenu';
import { useSession } from 'next-auth/react';

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
 * MyForms Component
 * Main component for managing user's forms. Shows only forms created by the current user,
 * regardless of their role.
 * 
 * @returns {JSX.Element} Rendered form management interface
 */
export function MyForms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const { navigate } = useTypedNavigation();
  const dict = useDictionary();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        // Always fetch only the current user's forms
        const endpoint = `/api/forms?userId=${session?.user?.id}`;
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to fetch forms');
        const data = await response.json();
        setForms(data);
      } catch (error) {
        console.error('Error fetching forms:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch forms if we have session data
    if (session?.user) {
      fetchForms();
    }
  }, [session]);

  const handleFormUpdate = (updatedForm: Form) => {
    setForms(forms.map(form => 
      form.id === updatedForm.id ? updatedForm : form
    ));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{dict.common.myForms}</CardTitle>
        <Button
          onClick={() => navigate('/admin/forms/create' as Route<'/admin/forms/create'>)}
          size="sm"
        >
          {dict.myForms.actions.createNew}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="h-4 w-[200px] bg-muted animate-pulse rounded" />
                      <div className="h-4 w-[150px] bg-muted animate-pulse rounded mt-2" />
                    </div>
                    <div className="h-6 w-[100px] bg-muted animate-pulse rounded" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 w-[180px] bg-muted animate-pulse rounded" />
                    <div className="h-4 w-[120px] bg-muted animate-pulse rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-10">
            <h2 className="text-2xl font-semibold text-gray-900">{dict.myForms.empty.noForms}</h2>
            <p className="mt-1 text-sm text-gray-500">{dict.myForms.empty.title}</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {forms.map((form) => (
                <Card 
                  key={form.id}
                  className="hover:shadow-md transition-shadow"
                >
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
                        <FormActionsMenu 
                          form={form} 
                          onFormUpdate={handleFormUpdate}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        <span>Updated {formatDistanceToNow(new Date(form.updatedAt), { addSuffix: true })}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-gray-500">
                          {dict.myForms.form.submissions.multiple.replace('{0}', (form._count?.submissions ?? 0).toString())}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
