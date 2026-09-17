"use client";

import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { toast } from "sonner";

import { designerWorkKeys } from "@/features/designer-work/use-designer-work";
import { listingKeys } from "@/features/listing/listing.keys";
import { notificationKeys } from "@/features/notifications/notifications.keys";
import { researchKeys } from "@/features/research/use-research";
import { ApiError } from "@/lib/api";

import {
  abortFinalAssetMultipartUpload,
  completeFinalAssetMultipartUpload,
  initFinalAssetMultipartUpload,
  postDesignAction,
} from "./design-workspace.api";
import {
  getCompletedMultipartBytes,
  MultipartUploadCancelledError,
  uploadPendingMultipartParts,
} from "./final-asset-multipart-upload";
import type {
  MultipartCompleteRequest,
  MultipartInitResponse,
} from "./design-workspace.schemas";

export type FinalAssetUploadPhase = "uploading" | "completing" | "failed";

export type FinalAssetUploadUIState = {
  canCancel: boolean;
  canRetry: boolean;
  completedBytes: number;
  error: string | null;
  fileName: string;
  phase: FinalAssetUploadPhase;
  progressPercent: number;
  researchItemId: string;
  totalBytes: number;
  workspaceId: string;
};

export type FloatingUploadPosition = {
  x: number;
  y: number;
};

type MultipartRetryMode = "complete" | "handoff" | "parts" | null;

type InternalUploadSession = {
  activeController: AbortController | null;
  cancelled: boolean;
  completedParts: Map<number, MultipartCompleteRequest["parts"][number]>;
  file: File;
  multipartUpload: MultipartInitResponse | null;
  queryClient: QueryClient;
  retryMode: MultipartRetryMode;
  researchItemId: string;
  startedAt: number | null;
  workspaceId: string;
};

type FinalAssetUploadStore = {
  activeUpload: FinalAssetUploadUIState | null;
  cancel: () => Promise<void>;
  floatingPosition: FloatingUploadPosition | null;
  reset: () => void;
  retry: (queryClient: QueryClient) => Promise<void>;
  setFloatingPosition: (position: FloatingUploadPosition) => void;
  start: (
    input: { file: File; queryClient: QueryClient; researchItemId: string; workspaceId: string },
  ) => Promise<boolean>;
};

const MULTIPART_SESSION_EXPIRY_MS = 60 * 60 * 1000;

let activeSession: InternalUploadSession | null = null;

const designWorkspaceDetailKey = (workspaceId: string, researchItemId: string) =>
  ["design-workspace", workspaceId, "detail", researchItemId] as const;

class MultipartUploadSessionExpiredError extends Error {
  public constructor() {
    super("The upload session expired.");
    this.name = "MultipartUploadSessionExpiredError";
  }
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Final ZIP upload could not be completed. Please try again.";
};

const isExpiredMultipartSessionError = (error: unknown): boolean =>
  error instanceof ApiError &&
  error.status === 400 &&
  /multipart upload session|expired/i.test(error.message);

const isSessionActive = (session: InternalUploadSession): boolean =>
  activeSession === session && !session.cancelled;

const hasExpiredMultipartSession = (session: InternalUploadSession): boolean =>
  session.startedAt !== null &&
  Date.now() - session.startedAt >= MULTIPART_SESSION_EXPIRY_MS;

const getProgressPercent = (completedBytes: number, totalBytes: number): number =>
  totalBytes > 0 ? Math.min(100, Math.round((completedBytes / totalBytes) * 100)) : 0;

const setUploadState = (
  session: InternalUploadSession,
  next: Omit<FinalAssetUploadUIState, "researchItemId" | "workspaceId">,
) => {
  if (!isSessionActive(session)) return;
  useFinalAssetUploadStore.setState({
    activeUpload: {
      ...next,
      researchItemId: session.researchItemId,
      workspaceId: session.workspaceId,
    },
  });
};

const setProgress = (session: InternalUploadSession): void => {
  const multipartUpload = session.multipartUpload;
  if (!multipartUpload) return;

  const completedBytes = getCompletedMultipartBytes(
    session.file,
    multipartUpload.partSize,
    session.completedParts,
  );
  setUploadState(session, {
    canCancel: true,
    canRetry: false,
    completedBytes,
    error: null,
    fileName: session.file.name,
    phase: "uploading",
    progressPercent: getProgressPercent(completedBytes, session.file.size),
    totalBytes: session.file.size,
  });
};

const invalidateUploadQueries = (session: InternalUploadSession): void => {
  const { queryClient, researchItemId, workspaceId } = session;
  void queryClient.invalidateQueries({
    queryKey: designWorkspaceDetailKey(workspaceId, researchItemId),
  });
  void queryClient.invalidateQueries({ queryKey: designerWorkKeys.queues(workspaceId) });
  void queryClient.invalidateQueries({
    queryKey: researchKeys.detail(workspaceId, researchItemId),
  });
  void queryClient.invalidateQueries({ queryKey: ["dashboard", workspaceId] });
  void queryClient.invalidateQueries({ queryKey: listingKeys.queues(workspaceId) });
  void queryClient.invalidateQueries({ queryKey: notificationKeys.all(workspaceId) });
};

const expireSession = (session: InternalUploadSession): void => {
  if (activeSession === session) activeSession = null;
  useFinalAssetUploadStore.setState({
    activeUpload: {
      canCancel: false,
      canRetry: false,
      completedBytes: 0,
      error: "The upload session expired. Select the ZIP and start again.",
      fileName: session.file.name,
      phase: "failed",
      progressPercent: 0,
      researchItemId: session.researchItemId,
      totalBytes: session.file.size,
      workspaceId: session.workspaceId,
    },
  });
};

const failRecoverably = (
  session: InternalUploadSession,
  error: string,
  retryMode: Exclude<MultipartRetryMode, null>,
): void => {
  session.retryMode = retryMode;
  const multipartUpload = session.multipartUpload;
  const completedBytes = multipartUpload
    ? getCompletedMultipartBytes(session.file, multipartUpload.partSize, session.completedParts)
    : 0;
  setUploadState(session, {
    canCancel: true,
    canRetry: true,
    completedBytes,
    error,
    fileName: session.file.name,
    phase: "failed",
    progressPercent: getProgressPercent(completedBytes, session.file.size),
    totalBytes: session.file.size,
  });
};

const completeDesignHandoff = async (session: InternalUploadSession): Promise<void> => {
  setUploadState(session, {
    canCancel: true,
    canRetry: false,
    completedBytes: session.file.size,
    error: null,
    fileName: session.file.name,
    phase: "completing",
    progressPercent: 100,
    totalBytes: session.file.size,
  });

  try {
    await postDesignAction(session.workspaceId, session.researchItemId, "complete");
    if (!isSessionActive(session)) return;
    invalidateUploadQueries(session);
    activeSession = null;
    useFinalAssetUploadStore.setState({ activeUpload: null });
    toast.success("Final ZIP uploaded and design handed off to listing.");
  } catch (error) {
    if (!isSessionActive(session)) return;
    failRecoverably(
      session,
      error instanceof ApiError && error.status === 401
        ? "Your session has expired. Sign in again, then retry the handoff."
        : "Final ZIP uploaded, but design handoff could not be completed.",
      "handoff",
    );
  }
};

const completeUploadedParts = async (session: InternalUploadSession): Promise<void> => {
  const multipartUpload = session.multipartUpload;
  if (!multipartUpload) throw new Error("No Final ZIP upload is available to complete.");
  if (hasExpiredMultipartSession(session)) {
    expireSession(session);
    throw new MultipartUploadSessionExpiredError();
  }

  setUploadState(session, {
    canCancel: true,
    canRetry: false,
    completedBytes: session.file.size,
    error: null,
    fileName: session.file.name,
    phase: "completing",
    progressPercent: 100,
    totalBytes: session.file.size,
  });

  try {
    await completeFinalAssetMultipartUpload(session.workspaceId, session.researchItemId, {
      parts: [...session.completedParts.values()].sort(
        (firstPart, secondPart) => firstPart.partNumber - secondPart.partNumber,
      ),
      sessionToken: multipartUpload.sessionToken,
    });
    if (!isSessionActive(session)) return;
    session.retryMode = "handoff";
    await completeDesignHandoff(session);
  } catch (error) {
    if (!isSessionActive(session)) return;
    if (isExpiredMultipartSessionError(error) || hasExpiredMultipartSession(session)) {
      expireSession(session);
      return;
    }
    failRecoverably(
      session,
      error instanceof ApiError && error.status === 401
        ? "Your session has expired. Sign in again, then retry finalization."
        : "Upload completed, but finalization failed.",
      "complete",
    );
  }
};

const uploadPendingPartsAndComplete = async (session: InternalUploadSession): Promise<void> => {
  const multipartUpload = session.multipartUpload;
  if (!multipartUpload) throw new Error("No active Final ZIP upload is available.");
  if (hasExpiredMultipartSession(session)) {
    expireSession(session);
    return;
  }

  const controller = new AbortController();
  session.activeController = controller;
  setProgress(session);

  try {
    await uploadPendingMultipartParts({
      completedPartNumbers: new Set(session.completedParts.keys()),
      file: session.file,
      multipartUpload,
      onPartUploaded: (part) => {
        if (!isSessionActive(session)) return;
        session.completedParts.set(part.partNumber, {
          eTag: part.eTag,
          partNumber: part.partNumber,
        });
        setProgress(session);
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (!isSessionActive(session) || error instanceof MultipartUploadCancelledError) return;
    if (hasExpiredMultipartSession(session)) {
      expireSession(session);
      return;
    }
    failRecoverably(session, "Upload paused due to network issue.", "parts");
    return;
  } finally {
    if (session.activeController === controller) session.activeController = null;
  }

  if (isSessionActive(session)) await completeUploadedParts(session);
};

export const useFinalAssetUploadStore = create<FinalAssetUploadStore>((set, get) => ({
  activeUpload: null,
  cancel: async () => {
    const session = activeSession;
    const visibleUpload = get().activeUpload;
    if (!session) {
      set({ activeUpload: null });
      return;
    }

    session.cancelled = true;
    session.activeController?.abort();
    activeSession = null;

    try {
      if (session.multipartUpload) {
        await abortFinalAssetMultipartUpload(session.workspaceId, session.researchItemId, {
          sessionToken: session.multipartUpload.sessionToken,
        });
      }
      set({ activeUpload: null });
      toast.success("Final ZIP upload cancelled.");
    } catch {
      set({
        activeUpload: visibleUpload
          ? {
              ...visibleUpload,
              canCancel: false,
              canRetry: false,
              error: "Upload cancelled locally, but server cleanup failed.",
              phase: "failed",
            }
          : null,
      });
      toast.error("Upload cancelled locally, but server cleanup failed.");
    }
  },
  floatingPosition: null,
  reset: () => {
    if (activeSession) {
      void get().cancel();
      return;
    }
    set({ activeUpload: null });
  },
  retry: async (queryClient) => {
    const session = activeSession;
    if (!session || session.cancelled || !session.retryMode) return;
    session.queryClient = queryClient;

    if (session.retryMode === "handoff") {
      await completeDesignHandoff(session);
      return;
    }
    if (session.retryMode === "complete") {
      await completeUploadedParts(session);
      return;
    }
    await uploadPendingPartsAndComplete(session);
  },
  setFloatingPosition: (floatingPosition) => set({ floatingPosition }),
  start: async ({ file, queryClient, researchItemId, workspaceId }) => {
    const currentUpload = get().activeUpload;
    if (activeSession || currentUpload?.phase === "uploading" || currentUpload?.phase === "completing") {
      toast.error("Another Final ZIP upload is already in progress.");
      return false;
    }

    const session: InternalUploadSession = {
      activeController: null,
      cancelled: false,
      completedParts: new Map(),
      file,
      multipartUpload: null,
      queryClient,
      researchItemId,
      retryMode: null,
      startedAt: null,
      workspaceId,
    };
    activeSession = session;
    setUploadState(session, {
      canCancel: true,
      canRetry: false,
      completedBytes: 0,
      error: null,
      fileName: file.name,
      phase: "uploading",
      progressPercent: 0,
      totalBytes: file.size,
    });

    const controller = new AbortController();
    session.activeController = controller;
    try {
      session.multipartUpload = await initFinalAssetMultipartUpload(
        workspaceId,
        researchItemId,
        { fileName: file.name, fileSize: file.size },
        controller.signal,
      );
    } catch (error) {
      if (activeSession === session) activeSession = null;
      if (!session.cancelled) {
        set({
          activeUpload: {
            canCancel: false,
            canRetry: false,
            completedBytes: 0,
            error: getErrorMessage(error),
            fileName: file.name,
            phase: "failed",
            progressPercent: 0,
            researchItemId,
            totalBytes: file.size,
            workspaceId,
          },
        });
      }
      return false;
    } finally {
      if (session.activeController === controller) session.activeController = null;
    }

    if (!isSessionActive(session)) {
      try {
        await abortFinalAssetMultipartUpload(workspaceId, researchItemId, {
          sessionToken: session.multipartUpload.sessionToken,
        });
      } catch {
        // Cancellation has already been surfaced to the user.
      }
      return false;
    }

    session.startedAt = Date.now();
    session.retryMode = "parts";
    void uploadPendingPartsAndComplete(session);
    return true;
  },
}));

export function useFinalAssetUpload(workspaceId: string, researchItemId: string) {
  const queryClient = useQueryClient();
  const activeUpload = useFinalAssetUploadStore((state) => state.activeUpload);
  const cancel = useFinalAssetUploadStore((state) => state.cancel);
  const reset = useFinalAssetUploadStore((state) => state.reset);
  const retryStore = useFinalAssetUploadStore((state) => state.retry);
  const startStore = useFinalAssetUploadStore((state) => state.start);
  const isCurrentItem =
    activeUpload?.workspaceId === workspaceId &&
    activeUpload.researchItemId === researchItemId;
  const isAnotherItemActive = activeUpload !== null && !isCurrentItem && (
    activeSession !== null ||
    activeUpload.phase === "uploading" ||
    activeUpload.phase === "completing"
  );

  return {
    activeUpload: isCurrentItem ? activeUpload : null,
    cancel: () => (isCurrentItem ? cancel() : Promise.resolve()),
    isAnotherItemActive,
    isCurrentItem,
    reset: () => {
      if (isCurrentItem || activeUpload === null) reset();
    },
    retry: () => (isCurrentItem ? retryStore(queryClient) : Promise.resolve()),
    start: (file: File) => startStore({ file, queryClient, researchItemId, workspaceId }),
  };
}
