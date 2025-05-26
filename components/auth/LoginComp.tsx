/**
 * Login Component
 * 
 * A client-side component that handles user authentication through email/password
 * and social providers. Features include:
 * - Email/password login form
 * - Two-factor authentication support
 * - Social login integration
 * - Form validation with Zod
 * - Error and success message handling
 * - OAuth callback URL support
 * - Password reset link
 */

"use client";
import type React from "react";
import { useTransition } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { LoginSchema } from "@/schemas";
import { FormError } from "../form-error";
import { FormSuccess } from "../form-success";
import { login } from "@/actions/login";
import { Social } from "@/components/auth/social";
import { BackButton } from "./BackButton";
import Link from "next/link";

/**
 * LoginComp Component
 * 
 * @returns {JSX.Element} A form component for user authentication
 * 
 * State Management:
 * - isPending: Tracks form submission state
 * - error: Stores authentication error messages
 * - success: Stores success messages
 * - showTwoFactor: Controls 2FA input visibility
 * 
 * Form Features:
 * - Email/password validation
 * - Two-factor authentication
 * - Social login options
 * - Password reset link
 * - OAuth error handling
 */
function LoginComp() {
  // Initialize form with validation schema
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      code: "",
    },
  });

  // Get callback URL and OAuth errors from search params
  const SearchParams = useSearchParams();
  const callbackUrl = SearchParams.get("callbackUrl");
  const UrlError =
    SearchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email already in use with different provider!"
      : "";

  // Component state management
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  /**
   * Handles form submission and authentication
   * 
   * @param {z.infer<typeof LoginSchema>} values - Form values from validation
   * 
   * Process:
   * 1. Clears previous error/success messages
   * 2. Initiates login process
   * 3. Handles 2FA if required
   * 4. Updates UI based on response
   * 5. Resets form on success/error
   */
  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      login(values, callbackUrl)
      .then((data) => { 
          if (data?.success) {
            form.reset();
            setSuccess(data.success);
          }
          if (data?.error) {
            form.reset();
            setError(data.error);
          }
          if (data?.twoFactor) {
            setShowTwoFactor(true);
          }
        })
        //fix todo
        // .catch(() => setError("something went wrong"));
    });
  };

  return (
    <div className="lg:p-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to sign in to your account
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="spce-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">

                {showTwoFactor&&(
                  <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Two Factor Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="123456"
                        
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                )}
                {!showTwoFactor &&(
                  <>
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
                          <Button
                            variant="link"
                            size="sm"
                            asChild
                            className="  flex font-normal px-0 justify-baseline "
                          >
                            <Link href="/auth/reset">Forgot Password ?</Link>
                          </Button>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
              <FormSuccess message={success} />
              <FormError message={error || UrlError} />
              <Button type="submit" className="w-full">
                {showTwoFactor?"Confirm":"Login"}
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
        <BackButton href="/auth/register" label="Don't have an account?" />
      </div>
    </div>
  );
}

export default LoginComp;
