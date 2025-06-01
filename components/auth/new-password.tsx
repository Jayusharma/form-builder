"use client";
import type React from "react";
import { startTransition, useTransition } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useParams } from "next/navigation";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import { NewPasswordSchema } from "@/schemas";
import { FormError } from "../form-error";
import { FormSuccess } from "../form-success";
import { BackButton } from "./BackButton";
import { newPassword } from "@/actions/new-password";
import { useDictionary } from "@/hooks/useDictionary";

function NewPasswordForm() {
  const dict = useDictionary();
  const { locale } = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
    },
  });
  const [isPending] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      newPassword(values, token).then((data) => {
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
            {dict.auth.newPassword.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dict.auth.newPassword.description}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="spce-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dict.auth.newPassword.passwordLabel}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={dict.auth.newPassword.passwordPlaceholder}
                          type="password"
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
                {dict.auth.newPassword.submitButton}
              </Button>
            </div>
          </form>
        </Form>
        <BackButton 
          href={`/${locale}/auth/login` as `/${string}${string}`}
          label={dict.auth.newPassword.backToLogin} 
        />
      </div>
    </div>
  );
}

export default NewPasswordForm;
