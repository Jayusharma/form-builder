"use client";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import LoginComp from "./LoginComp";
import { DialogTitle } from "@radix-ui/react-dialog";

interface LoginButtonProps {
  children: React.ReactNode;
  mode?: "modal" | "redirect";
  locale?: string;
}

export default function LoginButton({
  children,
  mode = "redirect",
  locale = "en",
}: LoginButtonProps) {
  const router = useRouter();
  const onClick = () => {
    router.push(`/${locale}/auth/login` as `/${string}${string}`);
  };

  if (mode === "modal") {
    return (
      <Dialog>
        <DialogTitle className="hidden">Login</DialogTitle>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="p-0 w-auto bg-background border-none">
          <LoginComp />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div onClick={onClick} className="cursor-pointer">
      {children}
    </div>
  );
}
