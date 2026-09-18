"use client";

import { flushSync } from "react-dom";

import { useDownloadActivityStore } from "./download-activity-store";
import { downloadListingAsset } from "./listing.api";

const MINIMUM_VISIBLE_STARTING_MS = 700;

type ListingDownloadLaunchOptions = {
  assetId: string;
  fileName: string | null;
  researchItemId: string;
  workspaceId: string;
  beforeBrowserDownload?: () => Promise<unknown>;
};

export class ListingDownloadLaunchError extends Error {
  readonly stage: "before-browser-download" | "browser-download";
  readonly originalError: unknown;

  constructor(stage: ListingDownloadLaunchError["stage"], originalError: unknown) {
    super(stage === "before-browser-download" ? "Unable to start listing." : "Unable to download package.");
    this.name = "ListingDownloadLaunchError";
    this.stage = stage;
    this.originalError = originalError;
  }
}

// Every Final ZIP launch begins, hands off to the native browser download, and settles here.
export async function launchListingDownload({
  assetId,
  beforeBrowserDownload,
  fileName,
  researchItemId,
  workspaceId,
}: ListingDownloadLaunchOptions): Promise<boolean> {
  let accepted = false;
  const startedAt = performance.now();
  // Direct launches must commit this state before the synchronous native anchor click.
  flushSync(() => {
    accepted = useDownloadActivityStore.getState().beginStarting({
      assetId,
      fileName,
      researchItemId,
      workspaceId,
    });
  });
  if (!accepted) return false;

  if (beforeBrowserDownload) {
    try {
      await beforeBrowserDownload();
    } catch (error) {
      useDownloadActivityStore.getState().markFailedToStart(assetId);
      throw new ListingDownloadLaunchError("before-browser-download", error);
    }
  }

  try {
    downloadListingAsset(workspaceId, assetId, fileName ?? undefined);
  } catch (error) {
    useDownloadActivityStore.getState().markFailedToStart(assetId);
    throw new ListingDownloadLaunchError("browser-download", error);
  }

  // The native launch remains immediate; only the presentation waits for the shared
  // minimum-visible starting interval.
  const remainingStartingMs = Math.max(0, MINIMUM_VISIBLE_STARTING_MS - (performance.now() - startedAt));
  setTimeout(() => {
    useDownloadActivityStore.getState().markBrowserDownloadStarted(assetId);
  }, remainingStartingMs);

  return true;
}
