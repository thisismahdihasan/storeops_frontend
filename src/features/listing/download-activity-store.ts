"use client";

import { create } from "zustand";

export type DownloadPhase = "starting" | "downloading-in-browser" | "failed-to-start";

export type DownloadActivity = {
  workspaceId: string;
  researchItemId: string;
  assetId: string;
  fileName: string | null;
  phase: DownloadPhase;
  launchGuarded: boolean;
  launchOrder: number;
};

type DownloadInput = Omit<DownloadActivity, "phase" | "launchGuarded" | "launchOrder">;

type DownloadActivityStore = {
  activities: Record<string, DownloadActivity>;
  beginStarting: (input: DownloadInput) => boolean;
  markBrowserDownloadStarted: (assetId: string) => void;
  markFailedToStart: (assetId: string) => void;
  dismiss: (assetId: string) => void;
};

export const useDownloadActivityStore = create<DownloadActivityStore>((set, get) => {
  // Re-launching an existing Record key does not change its insertion order.
  let launchOrder = 0;
  const settleLaunch = (assetId: string, phase: Exclude<DownloadPhase, "starting">) => {
    const current = get().activities[assetId];
    if (!current || current.phase !== "starting") return;
    const activity = { ...current, phase };
    set((state) => ({ activities: { ...state.activities, [assetId]: activity } }));

    // A click guard only: this timer says nothing about browser transfer duration.
    setTimeout(() => {
      if (get().activities[assetId] !== activity) return;
      set((state) => ({
        activities: { ...state.activities, [assetId]: { ...activity, launchGuarded: false } },
      }));
    }, 1000);

    if (phase === "downloading-in-browser") {
      // Expire the launch notification only; native transfer completion is unknown.
      setTimeout(() => {
        const latest = get().activities[assetId];
        if (latest?.launchOrder === activity.launchOrder && latest.phase === phase) {
          get().dismiss(assetId);
        }
      }, 6000);
    }
  };

  return {
    activities: {},
    beginStarting: (input) => {
      const current = get().activities[input.assetId];
      if (current?.launchGuarded || current?.phase === "starting") return false;
      set((state) => ({
        activities: {
          ...state.activities,
          [input.assetId]: {
            ...input,
            fileName: input.fileName ?? current?.fileName ?? null,
            phase: "starting",
            launchGuarded: true,
            launchOrder: ++launchOrder,
          },
        },
      }));
      return true;
    },
    // This phase records handoff, never completion or observed browser progress.
    markBrowserDownloadStarted: (assetId) => settleLaunch(assetId, "downloading-in-browser"),
    markFailedToStart: (assetId) => settleLaunch(assetId, "failed-to-start"),
    dismiss: (assetId) => {
      const current = get().activities[assetId];
      if (!current || current.launchGuarded || current.phase === "starting") return;
      set((state) => {
        const activities = { ...state.activities };
        delete activities[assetId];
        return { activities };
      });
    },
  };
});
