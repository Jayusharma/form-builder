"use client";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import LoginComp from "./LoginComp";
import { DialogTitle } from "@radix-ui/react-dialog";
interface LoginButtonProps {
  children: React.ReactNode;
  mode?: "modal" | "redirect";
}

export default function LoginButton({
  children,
  mode = "redirect",
}: LoginButtonProps) {
  const router = useRouter();
  const onClick = () => {
    router.push("/auth/login");
  };
  if (mode === "modal") {
    return (
      <Dialog>
        <DialogTitle className="hidden">Login</DialogTitle>
        <DialogTrigger asChild >{children}</DialogTrigger>
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
