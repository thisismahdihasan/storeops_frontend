"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Play } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { completeListingFormSchema } from "./listing.schemas";
import type { CompleteListingFormValues, ListingDetail } from "./listing.types";

type ListingWorkflowPanelProps = {
  detail: ListingDetail;
  isCompleting: boolean;
  isStarting: boolean;
  onComplete: (values: CompleteListingFormValues) => void;
  onStart: () => void;
};

export function ListingWorkflowPanel({
  detail,
  isCompleting,
  isStarting,
  onComplete,
  onStart,
}: ListingWorkflowPanelProps) {
  const form = useForm<CompleteListingFormValues>({
    defaultValues: { etsyListingUrl: "" },
    resolver: zodResolver(completeListingFormSchema),
  });

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <h2 className="font-semibold">Listing workflow</h2>
      {detail.researchItem.status === "READY_FOR_LISTING" ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">
            Start after reviewing the reference, approved design, and final assets.
          </p>
          <Button
            className="w-full"
            disabled={isStarting}
            onClick={onStart}
            type="button"
          >
            {isStarting ? <Loader2 className="animate-spin" /> : <Play />}
            {isStarting ? "Starting…" : "Start Listing"}
          </Button>
        </div>
      ) : (
        <form className="mt-3 space-y-4" onSubmit={form.handleSubmit(onComplete)}>
          <div className="space-y-2">
            <Label htmlFor="etsy-listing-url">Etsy Listing URL</Label>
            <Input
              aria-describedby={
                form.formState.errors.etsyListingUrl
                  ? "etsy-listing-url-help etsy-listing-url-error"
                  : "etsy-listing-url-help"
              }
              aria-invalid={Boolean(form.formState.errors.etsyListingUrl)}
              autoComplete="url"
              id="etsy-listing-url"
              maxLength={2048}
              placeholder="https://www.etsy.com/listing/123456789/..."
              type="url"
              {...form.register("etsyListingUrl")}
            />
            <p className="text-xs text-muted-foreground" id="etsy-listing-url-help">
              Optional. Use an etsy.com URL containing /listing/&lt;numeric-id&gt;.
            </p>
            {form.formState.errors.etsyListingUrl ? (
              <p
                className="text-xs font-medium text-destructive"
                id="etsy-listing-url-error"
                role="alert"
              >
                {form.formState.errors.etsyListingUrl.message}
              </p>
            ) : null}
          </div>
          <Button className="w-full" disabled={isCompleting} type="submit">
            {isCompleting ? <Loader2 className="animate-spin" /> : null}
            {isCompleting ? "Marking listed…" : "Mark Listed"}
          </Button>
        </form>
      )}
    </section>
  );
}
