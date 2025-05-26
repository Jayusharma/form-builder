"use client";

import { Card } from "../ui/card";
import { BackButton } from "./BackButton";
import { BeatLoader } from "react-spinners";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect,useState

 } from "react";
 import { FormError } from "@/components/form-error";
 import { FormSuccess } from "@/components/form-success";
import { newVerification } from "@/actions/new-verification";
export const NewVerificationForm = () => {

  const [error,setError]=useState<string|undefined>();      
  const [success,setSuccess]=useState<string|undefined>();      
  const searchparams = useSearchParams();
  const token = searchparams.get("token");
  const onSubmit = useCallback(() => {
        if(success||error) return
   if(!token) {
        setError("Missing token")
        return
   }
   newVerification(token)
   .then((data)=>{
        setSuccess(data.success);
        setError(data.error); 
   })
   .catch(()=>{
        setError("Something went wrong!")
   })
  }, [token,success,error]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);
  return (
    <div className="w-full h-screen flex justify-center items-center gap-10">
      <Card className="p-10 gap-10 flex justify-center items-center">
        <p>confirming your verification</p>
        {!success && !error &&(<BeatLoader />)}
        
        <FormSuccess message={success}/>
        {!success&&
        <FormError message={error}/>
        }
        <BackButton label="back to login" href="/auth/login"></BackButton>
      </Card>
    </div>
  );
};
