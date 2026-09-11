/* eslint-disable @next/next/no-img-element */

import { MessageSquareText } from "lucide-react";

import { formatWorkDate } from "@/features/designer-work/designer-work.types";

import type { DesignLatestReview } from "./design-workspace.types";

type ReviewFeedbackProps = { review: DesignLatestReview | null };

export function ReviewFeedback({ review }: ReviewFeedbackProps) {
  if (!review) return <section className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No review submitted yet.</section>;

  const reviewImageUrl = review.imageDeletedAt === null ? review.imageUrl : null;
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div><p className="flex items-center gap-2 font-semibold"><MessageSquareText className="size-4 text-primary" />Review round {review.roundNumber}</p><p className="mt-1 text-sm text-muted-foreground">Submitted {formatWorkDate(review.submittedAt)}{review.approvedAt ? ` · Approved ${formatWorkDate(review.approvedAt)}` : ""}</p></div>
      {review.note && <p className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">{review.note}</p>}
      {reviewImageUrl ? <img alt={`Review round ${review.roundNumber}`} className="max-h-[480px] w-full rounded-lg border border-border object-contain" src={reviewImageUrl} /> : <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">Review image no longer available</p>}
      {review.annotations.length > 0 && <div className="space-y-3 border-t border-border pt-4"><h3 className="text-sm font-semibold">Correction feedback</h3>{review.annotations.map((annotation) => <article className="rounded-lg bg-muted/40 p-3" key={annotation.id}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{annotation.comment}</p></div><p className="mt-1 text-xs text-muted-foreground">{annotation.createdBy.name || "Admin"} · {formatWorkDate(annotation.createdAt)}</p>{annotation.replies.length > 0 && <div className="mt-3 space-y-2 border-l-2 border-border pl-3">{annotation.replies.map((reply) => <div key={reply.id}><p className="text-sm">{reply.message}</p><p className="text-xs text-muted-foreground">{reply.createdBy.name || "Team member"} · {formatWorkDate(reply.createdAt)}</p></div>)}</div>}</article>)}</div>}
    </section>
  );
}
