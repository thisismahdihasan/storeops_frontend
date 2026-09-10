"use client";

import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCurrentSession } from "@/features/auth/use-current-session";
import { useLogout } from "@/features/auth/use-logout";
import { ApiError } from "@/lib/api";

import { useAcceptInvite } from "./use-accept-invite";

type InviteCardProps = {
  token: string;
};

export function InviteCard({ token }: InviteCardProps) {
  const sessionQuery = useCurrentSession();
  const acceptMutation = useAcceptInvite();
  const logoutMutation = useLogout();
  const [acceptedSuccess, setAcceptedSuccess] = useState<string | null>(null);

  const returnPath = `/invite/${encodeURIComponent(token)}`;
  const loginHref = `/login?redirect=${encodeURIComponent(returnPath)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(returnPath)}`;

  if (sessionQuery.isPending) {
    return (
      <div className="surface flex w-full max-w-md flex-col items-center justify-center p-8 text-center" aria-busy="true">
        <Loader2 className="mb-4 size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verifying session…</p>
      </div>
    );
  }

  const currentUser = sessionQuery.data?.data.user;

  // Unauthenticated: Show generic invitation card
  if (!currentUser) {
    return (
      <div className="surface w-full max-w-md space-y-6 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Mail className="size-6" />
        </div>

        <div className="space-y-2">
          <p className="eyebrow">StoreOps Workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            You&apos;ve been invited to join a StoreOps workspace
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Sign in with your existing account or create a new one to accept your invitation and join the workspace.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full"
            nativeButton={false}
            render={<Link href={loginHref} />}
          >
            Sign in to accept
          </Button>
          <Button
            variant="outline"
            className="w-full"
            nativeButton={false}
            render={<Link href={registerHref} />}
          >
            Create an account
          </Button>
        </div>
      </div>
    );
  }

  // Authenticated: Handle acceptance
  const handleAccept = () => {
    acceptMutation.mutate(token, {
      onSuccess: (data) => {
        setAcceptedSuccess(data.data.workspace.name);
      },
    });
  };

  const getErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        return "This invitation belongs to another email address. Please sign in with the correct account.";
      }
      if (error.status === 409) {
        return "This invitation was already accepted or you are already a member of this workspace.";
      }
      if (error.status === 410) {
        return "This invitation has expired. Please request a new invitation from your administrator.";
      }
      if (error.status === 400) {
        return "This invitation link is invalid. Please check the link from your email.";
      }
      return error.message;
    }
    return "Failed to accept invitation. Please try again.";
  };

  if (acceptedSuccess) {
    return (
      <div className="surface w-full max-w-md space-y-6 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-6" />
        </div>

        <div className="space-y-2">
          <p className="eyebrow">Invitation Accepted</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome to {acceptedSuccess}!
          </h1>
          <p className="text-sm text-muted-foreground">
            You are now a member of this workspace.
          </p>
        </div>

        <Button className="w-full" nativeButton={false} render={<Link href="/" />}>
          Go to Workspace
        </Button>
      </div>
    );
  }

  return (
    <div className="surface w-full max-w-md space-y-6 p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Mail className="size-6" />
      </div>

      <div className="space-y-2">
        <p className="eyebrow">StoreOps Workspace</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Accept Workspace Invitation
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          You are signed in as{" "}
          <strong className="font-semibold text-foreground">{currentUser.email}</strong>.
        </p>
      </div>

      {acceptMutation.isError && (
        <div
          className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-left text-sm text-destructive"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-1">
              <p>{getErrorMessage(acceptMutation.error)}</p>
              {acceptMutation.error instanceof ApiError &&
                acceptMutation.error.status === 403 && (
                  <button
                    type="button"
                    onClick={() => logoutMutation.mutate()}
                    className="text-xs font-semibold underline hover:no-underline"
                  >
                    Switch account
                  </button>
                )}
              {acceptMutation.error instanceof ApiError &&
                acceptMutation.error.status === 409 && (
                  <Link
                    href="/"
                    className="block text-xs font-semibold underline hover:no-underline"
                  >
                    Go to Workspace
                  </Link>
                )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Button
          type="button"
          onClick={handleAccept}
          disabled={acceptMutation.isPending}
          className="w-full"
        >
          {acceptMutation.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Accepting invitation…
            </>
          ) : (
            "Accept Invitation"
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Not {currentUser.email}?{" "}
          <button
            type="button"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="text-foreground underline underline-offset-2 hover:opacity-80"
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}
