import { ApiError } from "@/lib/api";

type MemberMutationKind = "remove" | "roles";

export function getMemberMutationErrorMessage(
  error: unknown,
  kind: MemberMutationKind,
): string {
  if (!(error instanceof ApiError)) {
    return "Could not update this workspace member. Please try again.";
  }

  if (error.status === 403) {
    return "Your Admin access has changed. Refreshing workspace access.";
  }

  if (error.status === 409) {
    if (error.message.includes("Workspace must retain at least one Admin")) {
      return "Workspace must retain at least one Admin.";
    }
    if (error.message.includes("active design work")) {
      return kind === "remove"
        ? "Reassign active design work before removing this member."
        : "Reassign active design work before removing the Designer role.";
    }
    if (error.message.includes("active listing work")) {
      return kind === "remove"
        ? "Reassign or complete active listing work before removing this member."
        : "Reassign or complete active listing work before removing the Lister role.";
    }
  }

  return error.message;
}
