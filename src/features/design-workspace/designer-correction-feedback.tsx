"use client";

import { Ellipsis, MessageSquare, MessageSquareText, Pencil, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCurrentSession } from "@/features/auth/use-current-session";
import { formatWorkDate } from "@/features/designer-work/designer-work.types";
import { ReviewImageCanvas } from "@/features/reviews/review-image-canvas";
import { useDeleteAnnotationReply, useUpdateAnnotationReply } from "@/features/reviews/use-reviews";
import { ApiError } from "@/lib/api";

import { DesignPreviewLightbox } from "./design-preview-lightbox";
import type { DesignWorkspaceReview } from "./design-workspace.types";
import { useDesignerAnnotationReply } from "./use-design-workspace";

type ReviewFeedbackRound = Pick<
  DesignWorkspaceReview,
  | "annotations"
  | "id"
  | "imageDeletedAt"
  | "imageUrl"
  | "note"
  | "roundNumber"
  | "submittedAt"
>;

type DesignerCorrectionFeedbackProps = {
  canReply: boolean;
  onSelectAnnotation: (annotationId: string | null) => void;
  researchItemId: string;
  review: ReviewFeedbackRound;
  selectedAnnotationId: string | null;
  workspaceId: string;
};

function isEdited(createdAt: string, updatedAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  return Number.isFinite(created) && Number.isFinite(updated) && updated > created;
}

export function DesignerCorrectionFeedback({
  canReply,
  onSelectAnnotation,
  researchItemId,
  review,
  selectedAnnotationId,
  workspaceId,
}: DesignerCorrectionFeedbackProps) {
  const sessionQuery = useCurrentSession();
  const currentUserId = sessionQuery.data?.data.user.id;
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [replyTextByAnnotationId, setReplyTextByAnnotationId] = useState<
    Record<string, string>
  >({});
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteReplyTarget, setDeleteReplyTarget] = useState<{
    annotationId: string;
    replyId: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const replyMutation = useDesignerAnnotationReply(
    workspaceId,
    researchItemId,
    review.id,
  );
  const updateReplyMutation = useUpdateAnnotationReply(
    workspaceId,
    review.id,
    researchItemId,
  );
  const deleteReplyMutation = useDeleteAnnotationReply(
    workspaceId,
    review.id,
    researchItemId,
  );

  useEffect(() => {
    if (selectedAnnotationId) {
      const element = document.getElementById(
        `annotation-thread-${selectedAnnotationId}`,
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedAnnotationId]);

  const reviewImageUrl =
    review.imageDeletedAt === null ? review.imageUrl : null;
  const annotations = review.annotations;
  const hasAnnotations = annotations.length > 0;

  async function handleSendReply(annotationId: string) {
    const text = (replyTextByAnnotationId[annotationId] ?? "").trim();
    if (!text) {
      toast.error("Please enter a reply message.");
      return;
    }

    try {
      await replyMutation.mutateAsync({
        annotationId,
        message: text,
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

  async function saveReply(annotationId: string, replyId: string) {
    const message = editText.trim();
    if (!message) return;
    try {
      await updateReplyMutation.mutateAsync({
        annotationId,
        input: { message },
        replyId,
      });
      toast.success("Reply updated.");
      setEditingReplyId(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update reply.");
    }
  }

  async function handleConfirmDeleteReply() {
    if (!deleteReplyTarget) return;
    const target = deleteReplyTarget;
    setIsDeleting(true);
    try {
      await deleteReplyMutation.mutateAsync({
        annotationId: target.annotationId,
        replyId: target.replyId,
      });
      toast.success("Reply deleted.");
      setDeleteReplyTarget(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete reply.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section
      aria-label="Correction feedback"
      className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs"
    >
      {/* Header with Round Context */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Round {review.roundNumber} Preview
            </h2>
            <Badge variant="secondary">Round {review.roundNumber}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted {formatWorkDate(review.submittedAt)} · Read-only proof,
            notes, and annotations from Admin
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <MessageSquare className="size-3.5 text-primary" />
            {annotations.length}{" "}
            {annotations.length === 1 ? "annotation" : "annotations"}
          </span>
        </div>
      </div>

      {/* Designer Submission Note if present */}
      {review.note && (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3.5 text-xs text-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
            <MessageSquareText className="size-3.5 text-primary" />
            Your Submission Note
          </div>
          <p className="mt-1.5 whitespace-pre-wrap leading-relaxed">
            {review.note}
          </p>
        </div>
      )}

      {/* Main Feedback Grid: Image Canvas on Left, Threads on Right */}
      <div
        className={`mt-5 grid gap-6 ${
          hasAnnotations ? "lg:grid-cols-12" : ""
        }`}
      >
        {/* Left Column: Review Image with Numbered Pins */}
        <div
          className={`min-w-0 ${
            hasAnnotations
              ? "lg:col-span-8 xl:col-span-9"
              : "mx-auto w-full max-w-6xl"
          }`}
        >
          <div className="flex flex-col items-center">
            <ReviewImageCanvas
              annotations={annotations}
              imageDeletedAt={review.imageDeletedAt}
              imageUrl={reviewImageUrl}
              isActionable={false}
              onSelectAnnotation={(id) =>
                onSelectAnnotation(id === selectedAnnotationId ? null : id)
              }
              onOpenImage={() => setIsLightboxOpen(true)}
              researchItemId={researchItemId}
              reviewId={review.id}
              roundNumber={review.roundNumber}
              selectedAnnotationId={selectedAnnotationId}
              workspaceId={workspaceId}
            />
          </div>
        </div>

        {/* Right Column: Numbered Annotation Threads */}
        {hasAnnotations && (
          <div className="min-w-0 lg:col-span-4 xl:col-span-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Correction Threads
              </h3>
              <span className="text-xs text-muted-foreground">
                Click a pin or thread to focus
              </span>
            </div>

              <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
                {annotations.map((annotation, index) => {
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
                      id={`annotation-thread-${annotation.id}`}
                      key={annotation.id}
                      onClick={() =>
                        onSelectAnnotation(
                          isSelected ? null : annotation.id,
                        )
                      }
                    >
                      {/* Thread Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white shadow-xs">
                            {markerNumber}
                          </span>
                          <p className="text-xs font-semibold text-foreground">
                            {annotation.createdBy.name || "Admin"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <time className="text-[11px] text-muted-foreground">
                            {formatWorkDate(annotation.createdAt)}
                          </time>
                          {isEdited(annotation.createdAt, annotation.updatedAt) && (
                            <span className="text-[10px] text-muted-foreground">Edited</span>
                          )}
                        </div>
                      </div>

                      {/* Comment Body */}
                      <p className="mt-2 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                        {annotation.comment}
                      </p>

                      {/* Nested Threaded Replies */}
                      {annotation.replies.length > 0 && (
                        <div className="mt-3 space-y-2 border-l-2 border-border/80 pl-3">
                          {annotation.replies.map((reply) => {
                            const canModifyReply =
                              canReply && reply.createdBy.id === currentUserId;
                            const isEditingReply = editingReplyId === reply.id;

                            return (
                            <div className="rounded-lg bg-background/80 p-2 text-xs" key={reply.id}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-foreground">
                                  {reply.createdBy.name || "Team member"}
                                </span>
                                <div className="flex items-center gap-1">
                                  <time className="text-[10px] text-muted-foreground">{formatWorkDate(reply.createdAt)}</time>
                                  {isEdited(reply.createdAt, reply.updatedAt) && <span className="text-[10px] text-muted-foreground">Edited</span>}
                                  {canModifyReply && <DropdownMenu><DropdownMenuTrigger render={<Button aria-label={`Manage reply from ${reply.createdBy.name || "team member"}`} size="icon-xs" variant="ghost" />}><Ellipsis /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setEditingReplyId(reply.id); setEditText(reply.message); }}><Pencil />Edit</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setDeleteReplyTarget({ annotationId: annotation.id, replyId: reply.id })} variant="destructive"><Trash2 />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
                                </div>
                              </div>
                              {isEditingReply ? <div className="mt-1 space-y-2"><textarea aria-label="Edit reply" className="w-full resize-none rounded-lg border border-border bg-background p-2 text-xs text-foreground" disabled={updateReplyMutation.isPending} maxLength={2000} onChange={(event) => setEditText(event.target.value)} rows={2} value={editText} /><div className="flex flex-wrap justify-end gap-1.5"><Button disabled={updateReplyMutation.isPending} onClick={() => setEditingReplyId(null)} size="xs" type="button" variant="ghost">Cancel</Button><Button disabled={updateReplyMutation.isPending || editText.trim().length === 0} onClick={() => void saveReply(annotation.id, reply.id)} size="xs" type="button">{updateReplyMutation.isPending ? "Saving…" : "Save"}</Button></div></div> : <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{reply.message}</p>}
                            </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Designer Reply Action & Inline Composer */}
                      {canReply && (
                        <div className="mt-3 pt-2">
                          {isReplying ? (
                            <div
                              className="space-y-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <textarea
                                aria-label={`Reply to annotation ${markerNumber}`}
                                autoFocus
                                className="w-full resize-none rounded-lg border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
                                disabled={replyMutation.isPending}
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
                                placeholder="Write a reply to Admin…"
                                rows={2}
                                value={currentReplyText}
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">
                                  Ctrl+Enter to send
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    disabled={replyMutation.isPending}
                                    onClick={() => setActiveReplyId(null)}
                                    size="xs"
                                    type="button"
                                    variant="ghost"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    disabled={
                                      replyMutation.isPending ||
                                      currentReplyText.trim().length === 0
                                    }
                                    onClick={() =>
                                      void handleSendReply(annotation.id)
                                    }
                                    size="xs"
                                    type="button"
                                  >
                                    <Send className="size-3" />
                                    {replyMutation.isPending
                                      ? "Sending…"
                                      : "Reply"}
                                  </Button>
                                </div>
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
          </div>
          </div>
        )}
      </div>
      <DesignPreviewLightbox
        imageUrl={reviewImageUrl}
        onOpenChange={setIsLightboxOpen}
        open={isLightboxOpen}
        title={`Round ${review.roundNumber} proof`}
      />
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setDeleteReplyTarget(null);
        }}
        open={deleteReplyTarget !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reply?</AlertDialogTitle>
            <AlertDialogDescription>This reply will be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => void handleConfirmDeleteReply()}
              variant="destructive"
            >
              {isDeleting ? "Confirming…" : "Delete reply"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
