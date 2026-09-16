"use client";

import { CheckCircle2, Ellipsis, MessageSquare, MessageSquareText, Pencil, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCurrentSession } from "@/features/auth/use-current-session";
import type { ResearchStatus } from "@/features/research/research.types";
import { ApiError } from "@/lib/api";

import type { ReviewHistoryItem } from "./reviews.types";
import { useCreateAnnotationReply, useDeleteAnnotationReply, useDeleteReviewAnnotation, useUpdateAnnotationReply, useUpdateReviewAnnotation } from "./use-reviews";

type AnnotationPanelProps = {
  canReply?: boolean;
  hoveredAnnotationId?: string | null;
  isActionable: boolean;
  isLatestRound: boolean;
  onHoverAnnotation?: (annotationId: string | null) => void;
  onSelectAnnotation: (annotationId: string) => void;
  researchItemId?: string;
  researchItemStatus: ResearchStatus;
  reviewId: string;
  selectedAnnotationId?: string | null;
  selectedReview: ReviewHistoryItem;
  workspaceId: string;
};

function formatDateTime(value: string | null): string {
  if (!value) return "Unknown";
  try { return new Intl.DateTimeFormat(undefined, { day: "numeric", hour: "2-digit", minute: "2-digit", month: "short", year: "numeric" }).format(new Date(value)); } catch { return value; }
}

function isEdited(createdAt: string, updatedAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  return Number.isFinite(created) && Number.isFinite(updated) && updated > created;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function AnnotationPanel({ canReply, hoveredAnnotationId, isActionable, isLatestRound, onHoverAnnotation, onSelectAnnotation, researchItemId, researchItemStatus, reviewId, selectedAnnotationId, selectedReview, workspaceId }: AnnotationPanelProps) {
  const sessionQuery = useCurrentSession();
  const currentUserId = sessionQuery.data?.data.user.id;
  const allowReply = canReply ?? isActionable;
  const repliesAreMutable = isLatestRound && ["DESIGN_REVIEW", "CORRECTION_NEEDED", "DESIGN_IN_PROGRESS"].includes(researchItemStatus);
  const [replyTextByAnnotationId, setReplyTextByAnnotationId] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "annotation"; annotationId: string } | { kind: "reply"; annotationId: string; replyId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const createReplyMutation = useCreateAnnotationReply(workspaceId, reviewId, researchItemId);
  const updateAnnotationMutation = useUpdateReviewAnnotation(workspaceId, reviewId, researchItemId);
  const deleteAnnotationMutation = useDeleteReviewAnnotation(workspaceId, reviewId, researchItemId);
  const updateReplyMutation = useUpdateAnnotationReply(workspaceId, reviewId, researchItemId);
  const deleteReplyMutation = useDeleteAnnotationReply(workspaceId, reviewId, researchItemId);

  async function handleSendReply(annotationId: string) {
    const text = (replyTextByAnnotationId[annotationId] ?? "").trim();
    if (!text) { toast.error("Please enter a reply message."); return; }
    try { await createReplyMutation.mutateAsync({ annotationId, input: { message: text } }); toast.success("Reply added."); setReplyTextByAnnotationId((previous) => ({ ...previous, [annotationId]: "" })); setActiveReplyId(null); }
    catch (error) { toast.error(errorMessage(error, "Failed to post reply.")); }
  }

  async function saveAnnotation(annotationId: string) {
    const comment = editText.trim();
    if (!comment) return;
    try { await updateAnnotationMutation.mutateAsync({ annotationId, input: { comment } }); toast.success("Annotation updated."); setEditingAnnotationId(null); }
    catch (error) { toast.error(errorMessage(error, "Failed to update annotation.")); }
  }

  async function saveReply(annotationId: string, replyId: string) {
    const message = editText.trim();
    if (!message) return;
    try { await updateReplyMutation.mutateAsync({ annotationId, replyId, input: { message } }); toast.success("Reply updated."); setEditingReplyId(null); }
    catch (error) { toast.error(errorMessage(error, "Failed to update reply.")); }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setIsDeleting(true);
    try {
      if (target.kind === "annotation") {
        await deleteAnnotationMutation.mutateAsync(target.annotationId);
        toast.success("Annotation deleted.");
      } else {
        await deleteReplyMutation.mutateAsync({ annotationId: target.annotationId, replyId: target.replyId });
        toast.success("Reply deleted.");
      }
      setDeleteTarget(null);
    } catch (error) {
      toast.error(errorMessage(error, target.kind === "annotation" ? "Failed to delete annotation." : "Failed to delete reply."));
    } finally {
      setIsDeleting(false);
    }
  }

  return <div className="space-y-5">
    {selectedReview.note && <section aria-label="Designer note" className="rounded-xl border border-border bg-card p-4 shadow-xs"><div className="flex items-center gap-2 font-medium text-foreground"><MessageSquareText className="size-4 text-primary" /><h3 className="text-sm font-semibold">Designer Note</h3></div><p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{selectedReview.note}</p></section>}
    {selectedReview.approvedAt && <section aria-label="Approval details" className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-950 shadow-xs dark:text-emerald-200"><div className="flex items-center gap-2 font-medium"><CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /><h3 className="text-sm font-semibold">Approved Submission</h3></div><p className="mt-2 text-xs text-muted-foreground">Approved on <span className="font-medium text-foreground">{formatDateTime(selectedReview.approvedAt)}</span>{selectedReview.approvedById && <> by reviewer ID: <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground font-mono">{selectedReview.approvedById}</code></>}</p></section>}
    <section aria-label="Correction feedback" className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-border pb-3"><div className="flex items-center gap-2"><MessageSquare className="size-4 text-primary" /><h3 className="text-sm font-semibold text-foreground">Annotations & Threads</h3></div><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{selectedReview.annotations.length}</span></div>
      {selectedReview.annotations.length === 0 ? <div className="py-8 text-center"><p className="text-xs text-muted-foreground">No annotations on this round yet.</p>{isActionable && <p className="mt-1 text-xs text-primary/90">Click anywhere on the image to add a correction note.</p>}</div> : <div className="mt-4 space-y-4">{selectedReview.annotations.map((annotation, index) => {
        const isSelected = selectedAnnotationId === annotation.id;
        const canEditAnnotation = annotation.createdBy.id === currentUserId && isLatestRound && researchItemStatus === "DESIGN_REVIEW";
        const canDeleteAnnotation = canEditAnnotation && annotation.replies.length === 0;
        const isEditingAnnotation = editingAnnotationId === annotation.id;
        return <article className={`rounded-xl border p-3.5 transition-all ${isSelected ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30 shadow-xs" : hoveredAnnotationId === annotation.id ? "border-amber-400 bg-amber-500/5" : "border-border bg-muted/20 hover:border-border/80"}`} id={`annotation-thread-${annotation.id}`} key={annotation.id} onMouseEnter={() => onHoverAnnotation?.(annotation.id)} onMouseLeave={() => onHoverAnnotation?.(null)}>
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1"><button aria-pressed={isSelected} className="flex items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-amber-500" onBlur={() => onHoverAnnotation?.(null)} onClick={() => onSelectAnnotation(annotation.id)} onFocus={() => onHoverAnnotation?.(annotation.id)} type="button"><span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white shadow-xs">{index + 1}</span><span className="text-xs font-semibold text-foreground">Annotation {index + 1} · {annotation.createdBy.name || "Admin"}</span></button><div className="ml-auto flex shrink-0 items-center">{canEditAnnotation || canDeleteAnnotation ? <DropdownMenu><DropdownMenuTrigger render={<Button aria-label={`Manage annotation ${index + 1}`} onClick={(event) => event.stopPropagation()} size="icon-xs" variant="ghost" />}><Ellipsis /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setEditingReplyId(null); setEditingAnnotationId(annotation.id); setEditText(annotation.comment); }}><Pencil />Edit</DropdownMenuItem>{canDeleteAnnotation && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setDeleteTarget({ kind: "annotation", annotationId: annotation.id })} variant="destructive"><Trash2 />Delete</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu> : null}</div></div>
          {isEditingAnnotation ? <div className="mt-2 space-y-2"><textarea aria-label={`Edit annotation ${index + 1}`} className="w-full resize-none rounded-lg border border-border bg-background p-2 text-xs text-foreground" disabled={updateAnnotationMutation.isPending} maxLength={2000} onChange={(event) => setEditText(event.target.value)} rows={3} value={editText} /><div className="flex flex-wrap justify-end gap-1.5"><Button disabled={updateAnnotationMutation.isPending} onClick={() => setEditingAnnotationId(null)} size="xs" type="button" variant="ghost">Cancel</Button><Button disabled={updateAnnotationMutation.isPending || editText.trim().length === 0} onClick={() => void saveAnnotation(annotation.id)} size="xs" type="button">{updateAnnotationMutation.isPending ? "Saving…" : "Save"}</Button></div></div> : <p className="mt-2 text-xs leading-relaxed text-foreground whitespace-pre-wrap">{annotation.comment}</p>}
          {annotation.replies.length > 0 && <div className="mt-3 space-y-2 border-l-2 border-border/80 pl-3">{annotation.replies.map((reply) => { const canModifyReply = reply.createdBy.id === currentUserId && repliesAreMutable; const isEditingReply = editingReplyId === reply.id; return <div className="rounded-lg bg-background/80 p-2 text-xs" key={reply.id}><div className="flex items-center justify-between gap-2"><span className="font-medium text-foreground">{reply.createdBy.name || "Team member"}</span><div className="flex items-center gap-1"><time className="text-[10px] text-muted-foreground">{formatDateTime(reply.createdAt)}</time>{isEdited(reply.createdAt, reply.updatedAt) && <span className="text-[10px] text-muted-foreground">Edited</span>}{canModifyReply && <DropdownMenu><DropdownMenuTrigger render={<Button aria-label={`Manage reply from ${reply.createdBy.name || "team member"}`} size="icon-xs" variant="ghost" />}><Ellipsis /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setEditingAnnotationId(null); setEditingReplyId(reply.id); setEditText(reply.message); }}><Pencil />Edit</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setDeleteTarget({ kind: "reply", annotationId: annotation.id, replyId: reply.id })} variant="destructive"><Trash2 />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</div></div>{isEditingReply ? <div className="mt-1 space-y-2"><textarea aria-label="Edit reply" className="w-full resize-none rounded-lg border border-border bg-background p-2 text-xs text-foreground" disabled={updateReplyMutation.isPending} maxLength={2000} onChange={(event) => setEditText(event.target.value)} rows={2} value={editText} /><div className="flex flex-wrap justify-end gap-1.5"><Button disabled={updateReplyMutation.isPending} onClick={() => setEditingReplyId(null)} size="xs" type="button" variant="ghost">Cancel</Button><Button disabled={updateReplyMutation.isPending || editText.trim().length === 0} onClick={() => void saveReply(annotation.id, reply.id)} size="xs" type="button">{updateReplyMutation.isPending ? "Saving…" : "Save"}</Button></div></div> : <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{reply.message}</p>}</div>; })}</div>}
          {allowReply && activeReplyId === annotation.id && <div className="mt-3 space-y-2"><textarea aria-label={`Reply to annotation ${index + 1}`} autoFocus className="w-full resize-none rounded-lg border border-border bg-background p-2 text-xs text-foreground" disabled={createReplyMutation.isPending} maxLength={2000} onChange={(event) => setReplyTextByAnnotationId((previous) => ({ ...previous, [annotation.id]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); void handleSendReply(annotation.id); } }} placeholder="Write a reply…" rows={2} value={replyTextByAnnotationId[annotation.id] ?? ""} /><div className="flex flex-wrap justify-end gap-1.5"><Button disabled={createReplyMutation.isPending} onClick={() => setActiveReplyId(null)} size="xs" type="button" variant="ghost">Cancel</Button><Button disabled={createReplyMutation.isPending || !(replyTextByAnnotationId[annotation.id] ?? "").trim()} onClick={() => void handleSendReply(annotation.id)} size="xs" type="button"><Send className="size-3" />{createReplyMutation.isPending ? "Sending…" : "Reply"}</Button></div></div>}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">{allowReply && activeReplyId !== annotation.id && <button className="text-[11px] font-medium text-primary hover:underline" onClick={() => setActiveReplyId(annotation.id)} type="button">Reply to thread</button>}<div className="ml-auto flex items-center gap-1.5">{isEdited(annotation.createdAt, annotation.updatedAt) && <span className="text-[10px] text-muted-foreground">Edited ·</span>}<time className="text-[11px] text-muted-foreground">{formatDateTime(annotation.createdAt)}</time></div></div>
        </article>;
      })}</div>}
      </section>
      <AlertDialog onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} open={deleteTarget !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.kind === "annotation" ? "Delete annotation?" : "Delete reply?"}</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget?.kind === "annotation" ? "This annotation will be deleted." : "This reply will be deleted."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={() => void handleConfirmDelete()} variant="destructive">
              {isDeleting ? "Confirming…" : deleteTarget?.kind === "annotation" ? "Delete annotation" : "Delete reply"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}
