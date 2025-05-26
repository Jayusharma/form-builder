"use client";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SettingsSchema } from "@/schemas";
import { settings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSuccess } from "@/components/form-success";
import { FormError } from "@/components/form-error";
import { Checkbox } from "@/components/ui/checkbox";
const Page = () => {
  const user = useCurrentUser();
  const [isPending, startTransition] = useTransition();
  const { update } = useSession();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      name: user?.name|| undefined,
      email: user?.email || undefined,
      password: undefined,
      Newpassword: undefined,
      isTwoFactorEnabled:user?.isTwoFactorEnabled ||undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    setError(undefined);
    setSuccess(undefined);

    // Only include fields that have been changed
    // const formData = {
    //   name: values.name,
    //   email: values.email,
    //   ...(values.password &&
    //     values.Newpassword && {
    //       password: values.password,
    //       Newpassword: values.Newpassword,
    //     }),
    // };

    // // Check if any changes were made
    // if (Object.keys(formData).length === 0) {
    //   setError("No changes made");
    //   return;
    // }

    startTransition(() => {
      settings(values )
        .then((data) => {
          if (data.error) {
            setError(data.error);
          }
          if (data.success) {
            update();
            setSuccess(data.success);
            // Reset password fields after successful update
            form.reset({
              ...form.getValues(),
              password: "",
              Newpassword: "",
            });
          }
        })
        .catch(() => setError("Something went wrong!"));
    });
  };

  return (
    <div className="flex justify-center items-center mt-20">

    
    <Card className="w-[600px] p-10">
      <CardHeader>
        <p className="text-2xl font-semibold text-center">Settings</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="john doe "
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {user?.isOAuth ===false &&(

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
                        type="password"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Newpassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="******"
                        type="password"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                
              />
              {/* <FormField
                control={form.control}
                name="isTwoFactorEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                   <div className="space-y-0.5">
                    <FormLabel>
                      Two Factor Authentication
                    </FormLabel>
                    <FormDescription>Enable two factor Authentication for your account</FormDescription>
                   </div>
                   <FormControl>
                    <Checkbox disabled={isPending} checked={field.value} onCheckedChange={field.onChange}/>
                   </FormControl>
                  </FormItem>
                )}
                
              /> */}
             </>  )}
            </div>
            <FormError message={error} />
            <FormSuccess message={success} />
            <Button type="submit" disabled={isPending}>
              Save
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
    </div>
  );
};

export default Page;
