"use client";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import RegisterComp from "./RegisterComp";
interface LoginButtonProps {
  children: React.ReactNode;
  mode?: "modal" | "redirect";
}

export default function SignupButton({
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
