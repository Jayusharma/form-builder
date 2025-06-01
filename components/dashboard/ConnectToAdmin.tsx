/**
 * ConnectToAdmin Component
 * 
 * This component allows users to connect to an admin organization by entering an admin code.
 * It provides:
 * - Input field for admin code
 * - Validation and error handling
 * - Success feedback
 * - Automatic redirect after successful connection
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useDictionary } from "@/hooks/useDictionary";

export default function ConnectToAdmin() {
  const router = useRouter();
  const { toast } = useToast();
  const dict = useDictionary();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users/connect-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || dict.dashboard.connectToAdmin.error.failedToConnect);
      }

      toast({
        title: dict.dashboard.connectToAdmin.success.title,
        description: dict.dashboard.connectToAdmin.success.description,
      });

      // Refresh the page to update the session and show dashboard
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : dict.dashboard.connectToAdmin.error.defaultMessage;
      setError(errorMessage);
      toast({
        title: dict.dashboard.connectToAdmin.error.title,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{dict.dashboard.connectToAdmin.title}</CardTitle>
          <CardDescription>
            {dict.dashboard.connectToAdmin.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder={dict.dashboard.connectToAdmin.placeholder}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono text-center tracking-wider"
                maxLength={8}
                required
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !code.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {dict.dashboard.connectToAdmin.connecting}
                </>
              ) : (
                dict.dashboard.connectToAdmin.connect
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 