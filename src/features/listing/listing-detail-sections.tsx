"use client";

import { ExternalLink, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { DesignPreviewLightbox } from "@/features/design-workspace/design-preview-lightbox";
import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";

import { ApprovedPreview } from "./approved-preview";
import { formatListingDate } from "./listing.types";
import type { ListingDetail } from "./listing.types";

export function ReferenceCheck({
  detail,
  workspaceId,
}: {
  detail: ListingDetail;
  workspaceId: string;
}) {
  const [isOriginalPreviewOpen, setIsOriginalPreviewOpen] = useState(false);
  const [isApprovedPreviewOpen, setIsApprovedPreviewOpen] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const title = detail.researchItem.title || `Etsy listing ${detail.researchItem.etsyListingId}`;
  const approvedImageUrl =
    detail.approvedPreview && !detail.approvedPreview.imageDeletedAt
      ? detail.approvedPreview.imageUrl
      : null;

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div>
        <h2 className="font-semibold">Reference Check</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare the original source with the approved design before listing.
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="min-w-0 rounded-lg border border-border bg-muted/10 p-3">
          <h3 className="text-sm font-medium">Original Reference</h3>
          <AuthenticatedReferenceImage
            alt={`${title} original reference`}
            className="h-48 w-full md:h-52"
            containerClassName="mt-3 min-h-48 rounded-md bg-muted/20 p-2 md:min-h-52"
            hasImage
            onOpenImage={(imageUrl) => {
              setOriginalImageUrl(imageUrl);
              setIsOriginalPreviewOpen(true);
            }}
            openImageLabel="Preview original reference"
            researchItemId={detail.researchItem.id}
            workspaceId={workspaceId}
          />
          <Button
            className="mt-3 w-full"
            nativeButton={false}
            render={<a href={detail.researchItem.originalUrl} rel="noopener noreferrer" target="_blank" />}
            size="sm"
            variant="outline"
          >
            <ExternalLink /> View on Etsy
          </Button>
        </article>

        <article className="min-w-0 rounded-lg border border-border bg-muted/10 p-3">
          <h3 className="text-sm font-medium">Approved Design</h3>
          {approvedImageUrl ? (
            <button
              aria-label="Preview approved design"
              className="mt-3 block w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setIsApprovedPreviewOpen(true)}
              type="button"
            >
              <ApprovedPreview
                alt={`${title} approved design`}
                className="h-48 w-full rounded-md md:h-52"
                preview={detail.approvedPreview}
              />
            </button>
          ) : (
            <ApprovedPreview
              alt={`${title} approved design`}
              className="mt-3 h-48 w-full rounded-md md:h-52"
              preview={detail.approvedPreview}
            />
          )}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {approvedImageUrl ? "Preview" : "Preview unavailable"}
          </p>
        </article>
      </div>

      <DesignPreviewLightbox
        imageUrl={originalImageUrl}
        onOpenChange={setIsOriginalPreviewOpen}
        open={isOriginalPreviewOpen}
        title="Original reference"
      />
      <DesignPreviewLightbox
        imageUrl={approvedImageUrl}
        onOpenChange={setIsApprovedPreviewOpen}
        open={isApprovedPreviewOpen}
        title="Approved design"
      />
    </section>
  );
}

export function PeoplePanel({ detail }: { detail: ListingDetail }) {
  return (
    <section className="border-t border-border pt-4">
      <h2 className="font-semibold">People</h2>
      <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
        <PersonRow label="Created by" person={detail.creator} />
        {detail.designer ? (
          <PersonRow label="Designer" person={detail.designer} />
        ) : (
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Designer</dt>
            <dd className="mt-1 text-sm text-muted-foreground">Not assigned</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

export function AssignmentMetadata({ detail }: { detail: ListingDetail }) {
  const { assignedAt, completedAt, startedAt } = detail.listingAssignment;
  const progress = completedAt
    ? `Completed ${formatListingDate(completedAt)}`
    : startedAt
      ? `Started ${formatListingDate(startedAt)}`
      : "Not started";

  return (
    <section className="border-t border-border pt-4" aria-label="Assignment metadata">
      <p className="text-sm text-muted-foreground">
        Assigned {formatListingDate(assignedAt)} · {progress}
      </p>
    </section>
  );
}

function PersonRow({
  label,
  person,
}: {
  label: string;
  person: ListingDetail["creator"];
}) {
  const name = person.name || "Unknown member";

  return (
    <div>
      <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <User className="size-3.5" /> {label}
      </dt>
      <dd className="mt-1 flex min-w-0 items-center gap-2 font-medium">
        <UserAvatar
          email={null}
          name={person.name}
          profileImageUrl={person.profileImageUrl}
          size="xs"
        />
        <span className="truncate">{name}</span>
      </dd>
    </div>
  );
}
