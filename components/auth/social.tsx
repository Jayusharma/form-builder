"use client";

import {signIn} from "next-auth/react"
import { Button } from "../ui/button";
import {FcGoogle} from "react-icons/fc";
import {FaGithub} from "react-icons/fa";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { useSearchParams } from "next/navigation";
export const Social = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl")
const onClick = (provider:"google"|"github")=>{
signIn(provider,{
  callbackUrl: callbackUrl||DEFAULT_LOGIN_REDIRECT,
})
}

  return <div className="flex items-center w-full gap-x-2"> 
<Button className=" w-full " size="lg" variant="outline" onClick={()=>onClick("google")}>
    <FcGoogle/>
</Button>
<Button className=" w-full " size="lg" variant="outline" onClick={()=>onClick("github")}>
    <FaGithub/>
</Button>
  </div>;
};
