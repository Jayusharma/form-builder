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
import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
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
import { getClientDictionary } from "@/lib/client-dictionary";
import { Locale } from "@/lib/i18n-config";
import { Dictionary } from "@/types/dictionary";

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

  // Get callback URL, locale and OAuth errors from search params
  const searchParams = useSearchParams();
  const { locale } = useParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const UrlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email already in use with different provider!"
      : "";

  // Component state management
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [dict, setDict] = useState<Dictionary | null>(null);

  // Load dictionary
  useEffect(() => {
    getClientDictionary(locale as Locale).then((d) => setDict(d));
  }, [locale]);

  if (!dict) return null;

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
      // Ensure callback URL has locale if it's a relative URL
      let finalCallbackUrl = callbackUrl;
      if (finalCallbackUrl && !finalCallbackUrl.startsWith('http') && !finalCallbackUrl.startsWith('/api')) {
        if (!finalCallbackUrl.startsWith(`/${locale}`)) {
          finalCallbackUrl = `/${locale}${finalCallbackUrl.startsWith('/') ? '' : '/'}${finalCallbackUrl}`;
        }
      }

      login(values, finalCallbackUrl)
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
        });
    });
  };

  return (
    <div className="lg:p-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {dict.auth.login.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dict.auth.login.description}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {showTwoFactor && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dict.auth.login.twoFactorLabel}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={dict.auth.login.twoFactorPlaceholder}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {!showTwoFactor && (
                <>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dict.auth.login.emailLabel}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={dict.auth.login.emailPlaceholder}
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
                        <FormLabel>{dict.auth.login.passwordLabel}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={dict.auth.login.passwordPlaceholder}
                            type="password"
                            disabled={isPending}
                          />
                        </FormControl>
                        <Button
                          variant="link"
                          size="sm"
                          asChild
                          className="flex font-normal px-0 justify-baseline"
                        >
                          <Link href={`/${locale}/auth/reset`}>{dict.auth.login.forgotPassword}</Link>
                        </Button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <FormError message={error || (UrlError && dict.auth.login.oauthError)} />
            <FormSuccess message={success} />
            <Button type="submit" className="w-full" disabled={isPending}>
              {showTwoFactor ? dict.auth.login.confirmButton : dict.auth.login.submitButton}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {dict.auth.login.orContinueWith}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Social />
        </div>
        <BackButton href={`/${locale}/auth/register`} label={dict.auth.login.noAccount} />
      </div>
    </div>
  );
}

export default LoginComp;
