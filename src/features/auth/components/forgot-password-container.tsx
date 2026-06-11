"use client";

import { useState } from "react";
import { ForgotPasswordForm } from "./forgot-password-form";
import { ResetPasswordForm } from "./reset-password-form";

type ForgotPasswordStep = "request" | "reset";

export function ForgotPasswordContainer() {
  const [step, setStep] = useState<ForgotPasswordStep>("request");
  const [verificationToken, setVerificationToken] = useState("");
  const [accountEmail, setAccountEmail] = useState("");

  const handleEmailSuccess = ({
    token,
    email,
  }: {
    token: string;
    email: string;
  }) => {
    setVerificationToken(token);
    setAccountEmail(email);
    setStep("reset");
  };

  const handleBackToEmail = () => {
    setVerificationToken("");
    setStep("request");
  };

  return (
    <div className="w-full max-w-md">
      {step === "request" ? (
        <ForgotPasswordForm
          initialEmail={accountEmail}
          onSuccess={handleEmailSuccess}
        />
      ) : (
        <ResetPasswordForm
          accountEmail={accountEmail}
          verificationToken={verificationToken}
          onBack={handleBackToEmail}
        />
      )}
    </div>
  );
}
