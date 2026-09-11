"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { reportIssueFormSchema } from "./designer-work.schemas";
import type { ReportIssueFormValues } from "./designer-work.types";

const ISSUE_REASONS: Array<{ label: string; value: ReportIssueFormValues["reason"] }> = [
  { label: "Reference unclear", value: "REFERENCE_UNCLEAR" },
  { label: "Copyright concern", value: "COPYRIGHT_CONCERN" },
  { label: "Too complex", value: "TOO_COMPLEX" },
  { label: "Image quality", value: "IMAGE_QUALITY" },
  { label: "Other", value: "OTHER" },
];

type ReportIssueDialogProps = {
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ReportIssueFormValues) => void;
  open: boolean;
  workTitle: string;
};

export function ReportIssueDialog({ isSubmitting, onOpenChange, onSubmit, open, workTitle }: ReportIssueDialogProps) {
  const form = useForm<ReportIssueFormValues>({
    defaultValues: { details: "", reason: "REFERENCE_UNCLEAR" },
    resolver: zodResolver(reportIssueFormSchema),
  });
  const details = useWatch({ control: form.control, name: "details" });

  useEffect(() => {
    if (!open) form.reset();
  }, [form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report design issue</DialogTitle>
          <DialogDescription>Report an issue with {workTitle}. This pauses work until an Admin takes action.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="designer-issue-reason">Reason</Label>
            <select aria-invalid={Boolean(form.formState.errors.reason)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring aria-invalid:border-destructive" id="designer-issue-reason" {...form.register("reason")}>
              {ISSUE_REASONS.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
            </select>
            {form.formState.errors.reason && <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="designer-issue-details">Details <span className="text-muted-foreground">(optional)</span></Label>
            <textarea className="min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring" id="designer-issue-details" maxLength={1000} placeholder="Add context that will help the Admin resolve this." {...form.register("details")} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{form.formState.errors.details?.message}</span><span>{details?.length ?? 0}/1000</span>
            </div>
          </div>
          <DialogFooter>
            <Button disabled={isSubmitting} onClick={() => onOpenChange(false)} type="button" variant="outline">Cancel</Button>
            <Button disabled={isSubmitting} type="submit">{isSubmitting && <Loader2 className="size-3.5 animate-spin" />}Report issue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
