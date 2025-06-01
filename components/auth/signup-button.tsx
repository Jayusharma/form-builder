"use client";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import RegisterComp from "./RegisterComp";

interface SignupButtonProps {
  children: React.ReactNode;
  mode?: "modal" | "redirect";
  locale?: string;
}

export default function SignupButton({
  children,
  mode = "redirect",
  locale = "en",
}: SignupButtonProps) {
  const router = useRouter();
  const onClick = () => {
    router.push(`/${locale}/auth/register` as `/${string}${string}`);
  };

  if (mode === "modal") {
    return (
      <Dialog>
        <DialogTitle className="hidden">Register</DialogTitle>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="p-0 w-auto bg-background border-none">
          <RegisterComp />
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
