/**
 * Password Reset Form Component
 * 
 * A client-side component that handles password reset requests through email.
 * Features include:
 * - Email-based password reset
 * - Form validation with Zod
 * - Error and success message handling
 * - Loading state management
 * - Back to login navigation
 * - Responsive design
 */

"use client";
import type React from "react";
import { startTransition, useTransition } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import { ResetSchema } from "@/schemas";
import { FormError } from "../form-error";
import { FormSuccess } from "../form-success";
import { BackButton } from "./BackButton";
import { reset } from "@/actions/reset";

/**
 * ResetForm Component
 * 
 * @returns {JSX.Element} A form component for password reset requests
 * 
 * State Management:
 * - isPending: Tracks form submission state
 * - error: Stores reset request error messages
 * - success: Stores success messages
 * 
 * Form Features:
 * - Email validation
 * - Form state management
 * - Error handling
 * - Success feedback
 * - Loading states
 * - Back navigation
 */
function ResetForm() {
  // Initialize form with validation schema
  const form = useForm<z.infer<typeof ResetSchema>>({
    resolver: zodResolver(ResetSchema),
    defaultValues: {
      email: "",
    },
  });

  // Component state management
  const [isPending] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  /**
   * Handles form submission and password reset request
   * 
   * @param {z.infer<typeof ResetSchema>} values - Form values from validation
   * 
   * Process:
   * 1. Clears previous error/success messages
   * 2. Initiates password reset process
   * 3. Updates UI based on response
   * 4. Handles validation errors
   * 5. Provides user feedback
   * 
   * Note: The reset link will be sent to the provided email address
   * if the account exists in the system
   */
  const onSubmit = (values: z.infer<typeof ResetSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      reset(values).then((data) => {
        if (data) {
          setError(data.error);
          setSuccess(data.success);
        }
      });
    });
  };

  return (
    <div className="lg:p-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Forgot your password ?
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to sign in to your account
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="spce-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="example@gmail.com"
                          type="email"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
              <FormSuccess message={success} />
              <FormError message={error} />
              <Button type="submit" className="w-full">
                Send reset link 
              </Button>
            </div>
          </form>
        </Form>
        <BackButton href="/auth/login" label="Back to login" />
      </div>
    </div>
  );
}

export default ResetForm;
