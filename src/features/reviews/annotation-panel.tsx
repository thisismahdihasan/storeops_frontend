"use client";

import { CheckCircle2, MessageSquare, MessageSquareText, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

import type { ReviewHistoryItem } from "./reviews.types";
import { useCreateAnnotationReply } from "./use-reviews";

type AnnotationPanelProps = {
  isActionable: boolean;
  onSelectAnnotation: (annotationId: string) => void;
  researchItemId?: string;
  reviewId: string;
  selectedAnnotationId?: string | null;
  selectedReview: ReviewHistoryItem;
  workspaceId: string;
};

function formatDateTime(value: string | null): string {
  if (!value) return "Unknown";
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function AnnotationPanel({
  isActionable,
  onSelectAnnotation,
  researchItemId,
  reviewId,
  selectedAnnotationId,
  selectedReview,
  workspaceId,
}: AnnotationPanelProps) {
  const [replyTextByAnnotationId, setReplyTextByAnnotationId] = useState<
    Record<string, string>
  >({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const createReplyMutation = useCreateAnnotationReply(
    workspaceId,
    reviewId,
    researchItemId,
  );

  async function handleSendReply(annotationId: string) {
    const text = (replyTextByAnnotationId[annotationId] ?? "").trim();
    if (!text) {
      toast.error("Please enter a reply message.");
      return;
    }

    try {
      await createReplyMutation.mutateAsync({
        annotationId,
        input: { message: text },
      });
      toast.success("Reply added.");
      setReplyTextByAnnotationId((prev) => ({ ...prev, [annotationId]: "" }));
      setActiveReplyId(null);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to post reply.";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-5">
      {/* Designer Submission Note */}
      {selectedReview.note && (
        <section
          aria-label="Designer note"
          className="rounded-xl border border-border bg-card p-4 shadow-xs"
        >
          <div className="flex items-center gap-2 font-medium text-foreground">
            <MessageSquareText className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Designer Note</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {selectedReview.note}
          </p>
        </section>
      )}

      {/* Approval Metadata (if present on historical round) */}
      {selectedReview.approvedAt && (
        <section
          aria-label="Approval details"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-950 dark:text-emerald-200 shadow-xs"
        >
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold">Approved Submission</h3>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Approved on{" "}
            <span className="font-medium text-foreground">
              {formatDateTime(selectedReview.approvedAt)}
            </span>
            {selectedReview.approvedById && (
              <>
                {" "}
                by reviewer ID:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground font-mono">
                  {selectedReview.approvedById}
                </code>
              </>
            )}
          </p>
        </section>
      )}

      {/* Annotations & Correction Threads */}
      <section
        aria-label="Correction feedback"
        className="rounded-xl border border-border bg-card p-4 shadow-xs"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Annotations & Threads
            </h3>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {selectedReview.annotations.length}
          </span>
        </div>

        {selectedReview.annotations.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-muted-foreground">
              No annotations on this round yet.
            </p>
            {isActionable && (
              <p className="mt-1 text-xs text-primary/90">
                Click anywhere on the image to add a correction note.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {selectedReview.annotations.map((annotation, index) => {
              const isSelected = selectedAnnotationId === annotation.id;
              const markerNumber = index + 1;
              const isReplying = activeReplyId === annotation.id;
              const currentReplyText =
                replyTextByAnnotationId[annotation.id] ?? "";

              return (
                <article
                  className={`rounded-xl border p-3.5 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs"
                      : "border-border bg-muted/20 hover:border-border/80"
                  }`}
                  key={annotation.id}
                  onClick={() => onSelectAnnotation(annotation.id)}
                >
                  {/* Annotation Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white shadow-xs">
                        {markerNumber}
                      </span>
                      <p className="text-xs font-semibold text-foreground">
                        {annotation.createdBy.name || "Admin"}
                      </p>
                    </div>
                    <time className="text-[11px] text-muted-foreground">
                      {formatDateTime(annotation.createdAt)}
                    </time>
                  </div>

                  {/* Comment Text */}
                  <p className="mt-2 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                    {annotation.comment}
                  </p>

                  {/* Threaded Replies */}
                  {annotation.replies.length > 0 && (
                    <div className="mt-3 space-y-2 border-l-2 border-border/80 pl-3">
                      {annotation.replies.map((reply) => (
                        <div
                          className="rounded-lg bg-background/80 p-2 text-xs"
                          key={reply.id}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground">
                              {reply.createdBy.name || "Team member"}
                            </span>
                            <time className="text-[10px] text-muted-foreground">
                              {formatDateTime(reply.createdAt)}
                            </time>
                          </div>
                          <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                            {reply.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Action for Admin */}
                  {isActionable && (
                    <div className="mt-3 pt-2">
                      {isReplying ? (
                        <div
                          className="space-y-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <textarea
                            autoFocus
                            className="w-full resize-none rounded-lg border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
                            disabled={createReplyMutation.isPending}
                            maxLength={2000}
                            onChange={(e) =>
                              setReplyTextByAnnotationId((prev) => ({
                                ...prev,
                                [annotation.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                (e.metaKey || e.ctrlKey)
                              ) {
                                e.preventDefault();
                                void handleSendReply(annotation.id);
                              }
                            }}
                            placeholder="Write a reply…"
                            rows={2}
                            value={currentReplyText}
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              disabled={createReplyMutation.isPending}
                              onClick={() => setActiveReplyId(null)}
                              size="xs"
                              type="button"
                              variant="ghost"
                            >
                              Cancel
                            </Button>
                            <Button
                              disabled={
                                createReplyMutation.isPending ||
                                currentReplyText.trim().length === 0
                              }
                              onClick={() => void handleSendReply(annotation.id)}
                              size="xs"
                              type="button"
                            >
                              <Send className="size-3" />
                              {createReplyMutation.isPending
                                ? "Sending…"
                                : "Reply"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="text-[11px] font-medium text-primary hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReplyId(annotation.id);
                          }}
                          type="button"
                        >
                          Reply to thread
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
