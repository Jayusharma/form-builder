"use client";

import { type User } from "next-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@prisma/client";
import { useDictionary } from "@/hooks/useDictionary";

interface ExtendedUser extends User {
  role: UserRole;
  isTwoFactorEnabled: boolean;
  isOAuth?: boolean;
  adminCode?: string | null;
}

interface UserInfoProps {
  user: ExtendedUser | null;
  label: string;
}

export default function UserInfo({ user, label }: UserInfoProps) {
  const [copied, setCopied] = useState(false);
  const dict = useDictionary();

  if (!user) {
    return null;
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(dict.userInfo.notifications.adminCode.copySuccess);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(dict.userInfo.notifications.adminCode.copyError);
    }
  };

  return (
    <Card className="w-[600px] shadow-sm py-10 space-y-5">
      <CardHeader>
        <p className="text-2xl font-semibold text-center">{label}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <p className="text-sm font-medium">{dict.userInfo.fields.id}</p>
          <p className="truncate text-xs max-w-[180px] font-mono p-1 rounded-md">
            {user.id}
          </p>
        </div>
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <p className="text-sm font-medium">{dict.userInfo.fields.name}</p>
          <p className="truncate text-xs max-w-[180px] font-mono p-1 rounded-md">
            {user.name || dict.userInfo.values.notSet}
          </p>
        </div>
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <p className="text-sm font-medium">{dict.userInfo.fields.email}</p>
          <p className="truncate text-xs max-w-[180px] font-mono p-1 rounded-md">
            {user.email || dict.userInfo.values.notSet}
          </p>
        </div>
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <p className="text-sm font-medium">{dict.userInfo.fields.role}</p>
          <p className="truncate text-xs max-w-[180px] font-mono p-1 rounded-md capitalize">
            {user.role?.toLowerCase() || dict.userInfo.values.notSet}
          </p>
        </div>
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <p className="text-sm font-medium">{dict.userInfo.fields.twoFactor}</p>
          <Badge variant={user.isTwoFactorEnabled ? "default" : "destructive"}>
            {user.isTwoFactorEnabled ? dict.userInfo.values.twoFactor.on : dict.userInfo.values.twoFactor.off}
          </Badge>
        </div>
        {user.role === "ADMIN" && user.adminCode && (
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <p className="text-sm font-medium">{dict.userInfo.fields.adminCode}</p>
            <div className="flex items-center gap-2">
              <code className="truncate text-xs max-w-[180px] font-mono p-1 rounded-md bg-muted">
                {user.adminCode}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(user.adminCode!)}
                className="h-8 w-8"
              >
                {copied ? (
                  <CheckCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
