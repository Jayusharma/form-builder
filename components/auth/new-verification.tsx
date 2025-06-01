"use client";

import { Card } from "../ui/card";
import { BackButton } from "./BackButton";
import { BeatLoader } from "react-spinners";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { newVerification } from "@/actions/new-verification";
import { useDictionary } from "@/hooks/useDictionary";

export const NewVerificationForm = () => {
  const dict = useDictionary();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const searchparams = useSearchParams();
  const token = searchparams.get("token");

  const onSubmit = useCallback(() => {
    if (success || error) return;
    if (!token) {
      setError(dict.auth.verification.error.missingToken);
      return;
    }
    newVerification(token)
      .then((data) => {
        setSuccess(data.success);
        setError(data.error);
      })
      .catch(() => {
        setError(dict.auth.verification.error.default);
      });
  }, [token, success, error, dict.auth.verification.error]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <div className="w-full h-screen flex justify-center items-center gap-10">
      <Card className="p-10 gap-10 flex justify-center items-center">
        <p>{dict.auth.verification.loading}</p>
        {!success && !error && <BeatLoader />}

        <FormSuccess message={success} />
        {!success && <FormError message={error} />}
        <BackButton 
          label={dict.auth.verification.backToLogin} 
          href="/auth/login"
        />
      </Card>
    </div>
  );
};
