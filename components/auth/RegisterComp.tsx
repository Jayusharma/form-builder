/**
 * Registration Component
 * 
 * A client-side component that handles new user registration through email/password
 * and social providers. Features include:
 * - User registration form
 * - Form validation with Zod
 * - Social registration integration
 * - Error and success message handling
 * - Password requirements validation
 * - OAuth account linking
 */

"use client";
import type React from "react";
import { useTransition } from "react";
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
import { RegisterSchema } from "@/schemas";
import { FormError } from "../form-error";
import { FormSuccess } from "../form-success";
import { register } from "@/actions/register";
import { Social } from "@/components/auth/social";
import { BackButton } from "./BackButton";

/**
 * RegisterComp Component
 * 
 * @returns {JSX.Element} A form component for user registration
 * 
 * State Management:
 * - isPending: Tracks form submission state
 * - error: Stores registration error messages
 * - success: Stores success messages
 * 
 * Form Features:
 * - Name, email, and password validation
 * - Social registration options
 * - Form state management
 * - Error handling
 * - Success feedback
 */
function RegisterComp() {
  // Initialize form with validation schema
  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  // Component state management
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  /**
   * Handles form submission and user registration
   * 
   * @param {z.infer<typeof RegisterSchema>} values - Form values from validation
   * 
   * Process:
   * 1. Clears previous error/success messages
   * 2. Initiates registration process
   * 3. Updates UI based on response
   * 4. Handles validation errors
   * 5. Provides user feedback
   */
  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      register(values).then((data) => {
        setError(data.error);
        setSuccess(data.success);
      });
    });
  };

  return (
    <div className="lg:p-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to register a new account
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="spce-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="jitendra Singh"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500"/>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="example@gmail.com"
                          type="email"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500"/>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="******"
                          type="Password"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500"/>
                    </FormItem>
                  )}
                />
              </div>
              <FormSuccess message={success} />
              <FormError message={error} />
              <Button type="submit" className="w-full">
                Create an account
              </Button>
            </div>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Social />
        </div>
        <BackButton href="/auth/login" label="Already have an account ?" />
      </div>
    </div>
  );
}

export default RegisterComp;
