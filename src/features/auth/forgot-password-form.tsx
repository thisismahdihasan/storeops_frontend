"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  forgotPasswordRequestSchema,
} from "./auth.schemas";
import type {
  ForgotPasswordRequestInput,
} from "./auth.types";
import {
  useRequestPasswordReset,
  useResetPassword,
  useVerifyPasswordReset,
} from "./use-forgot-password";

type FlowStep = "email" | "otp" | "password" | "success";

const newPasswordFormSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirm password is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type NewPasswordFormInput = z.infer<typeof newPasswordFormSchema>;

export function ForgotPasswordForm() {
  const [step, setStep] = useState<FlowStep>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const requestMutation = useRequestPasswordReset();
  const verifyMutation = useVerifyPasswordReset();
  const resetMutation = useResetPassword();

  // 60-second countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus the first OTP input when entering the OTP step
  useEffect(() => {
    if (step === "otp") {
      const firstInput = otpInputRefs.current[0];
      if (firstInput) {
        firstInput.focus();
      }
    }
  }, [step]);

  // ==========================================
  // STEP 1: EMAIL FORM
  // ==========================================
  const emailForm = useForm<ForgotPasswordRequestInput>({
    defaultValues: { email: "" },
    resolver: zodResolver(forgotPasswordRequestSchema),
  });

  const onEmailSubmit = async (values: ForgotPasswordRequestInput) => {
    const normalizedEmail = values.email.trim().toLowerCase();
    try {
      await requestMutation.mutateAsync({ email: normalizedEmail });
      setEmail(normalizedEmail);
      setCountdown(60);
      setStep("otp");
      setOtpError(null);
      setOtpDigits(["", "", "", "", "", ""]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to request verification code.";
      toast.error(message);
    }
  };

  // ==========================================
  // STEP 2: OTP HANDLING
  // ==========================================
  const handleOtpDigitChange = (index: number, value: string) => {
    setOtpError(null);
    const cleaned = value.replace(/\D/g, "");

    // Handle single digit input
    if (cleaned.length <= 1) {
      const updated = [...otpDigits];
      updated[index] = cleaned;
      setOtpDigits(updated);

      if (cleaned.length === 1 && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
      return;
    }

    // Handle paste in an individual box
    const pastedDigits = cleaned.slice(0, 6).split("");
    const updated = [...otpDigits];
    pastedDigits.forEach((digit, i) => {
      if (index + i < 6) {
        updated[index + i] = digit;
      }
    });
    setOtpDigits(updated);

    const nextIndex = Math.min(index + pastedDigits.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setOtpError(null);
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasteData) return;

    const digits = pasteData.slice(0, 6).split("");
    const updated = ["", "", "", "", "", ""];
    digits.forEach((digit, i) => {
      updated[i] = digit;
    });
    setOtpDigits(updated);

    const focusIndex = Math.min(digits.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  const onVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpDigits.join("");
    if (fullCode.length !== 6) {
      setOtpError("Please enter all 6 digits of your verification code.");
      return;
    }

    try {
      const response = await verifyMutation.mutateAsync({
        code: fullCode,
        email,
      });

      // Keep resetToken strictly in component memory
      setResetToken(response.data.resetToken);
      setStep("password");
      setOtpError(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Invalid or expired verification code.";
      setOtpError(message);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || requestMutation.isPending) return;
    try {
      await requestMutation.mutateAsync({ email });
      setCountdown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError(null);
      otpInputRefs.current[0]?.focus();
      toast.success("A new verification code has been dispatched.");
    } catch {
      toast.error("Failed to resend verification code. Please try again.");
    }
  };

  // ==========================================
  // STEP 3: NEW PASSWORD FORM
  // ==========================================
  const passwordForm = useForm<NewPasswordFormInput>({
    defaultValues: { confirmPassword: "", password: "" },
    resolver: zodResolver(newPasswordFormSchema),
  });

  const onPasswordSubmit = async (values: NewPasswordFormInput) => {
    if (!resetToken) {
      toast.error("Verification session expired. Please start over.");
      setStep("email");
      return;
    }

    try {
      await resetMutation.mutateAsync({
        confirmPassword: values.confirmPassword,
        email,
        password: values.password,
        resetToken,
      });

      // Wipe reset token from memory and advance to success
      setResetToken(null);
      setStep("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reset password.";

      if (message.toLowerCase().includes("session is invalid or expired")) {
        toast.error("Your reset session has expired. Please verify your email again.");
        setResetToken(null);
        setStep("otp");
        setOtpError("Verification expired. Please request a new code.");
        return;
      }

      toast.error(message);
    }
  };

  // ==========================================
  // RENDER: SUCCESS STATE
  // ==========================================
  if (step === "success") {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Password reset successfully
          </h2>
          <p className="text-sm text-muted-foreground">
            Your password has been updated. Please sign in with your new password to access your workspaces.
          </p>
        </div>

        <Link href="/login" className="block w-full">
          <Button className="w-full">
            Back to Sign in
          </Button>
        </Link>
      </div>
    );
  }

  // ==========================================
  // RENDER: STEP PROGRESS INDICATOR
  // ==========================================
  const stepIndex = step === "email" ? 1 : step === "otp" ? 2 : 3;

  const STEPS = [
    { label: "Email", number: 1 },
    { label: "Verify", number: 2 },
    { label: "Password", number: 3 },
  ] as const;

  return (
    <div className="w-full space-y-6">
      {/* Labeled 3-Step Progress Indicator */}
      <nav aria-label="Password recovery progress" className="w-full px-1">
        <ol className="flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const isCompleted = stepIndex > s.number;
            const isCurrent = stepIndex === s.number;

            return (
              <li
                key={s.number}
                className="relative flex flex-1 flex-col items-center"
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Horizontal connector line to previous step */}
                {idx > 0 && (
                  <div
                    className={`absolute -left-1/2 right-1/2 top-3.5 h-[2px] -translate-y-1/2 transition-colors duration-300 ${
                      isCompleted || isCurrent ? "bg-primary" : "bg-muted"
                    }`}
                    aria-hidden="true"
                  />
                )}

                {/* Step badge */}
                <div
                  className={`relative z-10 flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 ${
                    isCompleted
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-xs"
                      : "border border-border bg-muted/60 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check
                      className="size-3.5 stroke-[2.5]"
                      aria-hidden="true"
                    />
                  ) : (
                    <span>{s.number}</span>
                  )}
                  <span className="sr-only">
                    {isCompleted
                      ? `Step ${s.number}: ${s.label} (Completed)`
                      : isCurrent
                      ? `Step ${s.number}: ${s.label} (Current)`
                      : `Step ${s.number}: ${s.label}`}
                  </span>
                </div>

                {/* Step label */}
                <span
                  className={`mt-1.5 text-[11px] font-medium tracking-tight sm:text-xs transition-colors ${
                    isCurrent
                      ? "font-semibold text-foreground"
                      : isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* STEP 1: EMAIL */}
      {step === "email" && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Forgot your password?
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter the email associated with your StoreOps account.
            </p>
          </div>

          {requestMutation.isError && (
            <div
              className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {requestMutation.error.message ||
                "Failed to send verification code. Please try again."}
            </div>
          )}

          <form
            className="space-y-4"
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@storeops.com"
                  disabled={requestMutation.isPending}
                  aria-invalid={!!emailForm.formState.errors.email}
                  className="pl-9"
                  {...emailForm.register("email")}
                />
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              {emailForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending code…
                </>
              ) : (
                "Send verification code"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}

      {/* STEP 2: OTP */}
      {step === "otp" && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Check your email
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit verification code sent to{" "}
              <strong className="font-medium text-foreground">{email}</strong>.
            </p>
          </div>

          {otpError && (
            <div
              className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {otpError}
            </div>
          )}

          <form className="space-y-5" onSubmit={onVerifyOtpSubmit}>
            <div className="space-y-2">
              <Label className="block text-center text-xs text-muted-foreground">
                Verification code
              </Label>
              <div
                className="flex items-center justify-center gap-2"
                onPaste={handleOtpPaste}
              >
                {otpDigits.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      otpInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleOtpDigitChange(index, e.target.value)
                    }
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    disabled={verifyMutation.isPending}
                    aria-label={`Digit ${index + 1} of verification code`}
                    className="size-11 sm:size-12 p-0 text-center font-mono text-lg font-bold sm:text-xl"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                otpDigits.some((d) => !d) || verifyMutation.isPending
              }
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify code"
              )}
            </Button>
          </form>

          {/* Resend Controls */}
          <div className="flex flex-col items-center gap-2 text-center text-sm">
            <span className="text-xs text-muted-foreground">
              Didn&apos;t receive a code?
            </span>
            {countdown > 0 ? (
              <span className="text-xs text-muted-foreground">
                Resend code in <span className="font-semibold text-foreground">{countdown}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={requestMutation.isPending}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
              >
                {requestMutation.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RotateCw className="size-3" />
                )}
                Resend code
              </button>
            )}
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtpDigits(["", "", "", "", "", ""]);
                setOtpError(null);
              }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              <ArrowLeft className="size-3" />
              Use a different email
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: NEW PASSWORD */}
      {step === "password" && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Create a new password
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter and confirm your new secure password.
            </p>
          </div>

          {resetMutation.isError && (
            <div
              className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {resetMutation.error.message ||
                "Failed to reset password. Please try again."}
            </div>
          )}

          <form
            className="space-y-4"
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          >
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  disabled={resetMutation.isPending}
                  aria-invalid={!!passwordForm.formState.errors.password}
                  className="pr-10"
                  {...passwordForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-hidden"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {passwordForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  disabled={resetMutation.isPending}
                  aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                  className="pr-10"
                  {...passwordForm.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-hidden"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Resetting password…
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 size-4" />
                  Reset password
                </>
              )}
            </Button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setStep("otp");
              }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              <ArrowLeft className="size-3" />
              Back to verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
