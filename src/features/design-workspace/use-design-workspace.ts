"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { reportDesignIssue } from "@/features/designer-work/designer-work.api";
import type { ReportIssueFormValues } from "@/features/designer-work/designer-work.types";
import { designerWorkKeys } from "@/features/designer-work/use-designer-work";
import { listingKeys } from "@/features/listing/listing.keys";
import { notificationKeys } from "@/features/notifications/notifications.keys";
import { researchKeys } from "@/features/research/use-research";
import { ApiError } from "@/lib/api";

import {
  abortFinalAssetMultipartUpload,
  completeFinalAssetMultipartUpload,
  getDesignDetail,
  initFinalAssetMultipartUpload,
  postDesignAction,
  uploadReview,
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
import { createAnnotationReply } from "@/features/reviews/reviews.api";
import { reviewsKeys } from "@/features/reviews/reviews.keys";

export const designWorkspaceKeys = {
  all: ["design-workspace"] as const,
  detail: (workspaceId: string, researchItemId: string) =>
    ["design-workspace", workspaceId, "detail", researchItemId] as const,
};

export type FinalAssetMultipartUploadState = {
  completedBytes: number;
  completedParts: number;
  error: string | null;
  fileName: string | null;
  partCount: number;
  phase: "idle" | "uploading" | "completing" | "failed" | "success";
  totalBytes: number;
};

type ActiveFinalAssetMultipartUpload = {
  completedParts: Map<number, MultipartCompleteRequest["parts"][number]>;
  file: File;
  multipartUpload: MultipartInitResponse;
  startedAt: number;
};

type MultipartRetryMode = "complete" | "parts" | null;

const MULTIPART_SESSION_EXPIRY_MS = 60 * 60 * 1000;

class MultipartUploadSessionExpiredError extends Error {
  public constructor() {
    super("The upload session expired.");
    this.name = "MultipartUploadSessionExpiredError";
  }
}

const initialMultipartUploadState: FinalAssetMultipartUploadState = {
  completedBytes: 0,
  completedParts: 0,
  error: null,
  fileName: null,
  partCount: 0,
  phase: "idle",
  totalBytes: 0,
};

const getMultipartUploadErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Final ZIP upload could not be completed. Please try again.";
};

const isExpiredMultipartSessionError = (error: unknown): boolean => {
  return (
    error instanceof ApiError &&
    error.status === 400 &&
    /multipart upload session|expired/i.test(error.message)
  );
};

function useFinalAssetMultipartUpload(
  workspaceId: string,
  researchItemId: string,
  onUploaded: () => void,
) {
  const [state, setState] = useState<FinalAssetMultipartUploadState>(
    initialMultipartUploadState,
  );
  const [canRetry, setCanRetry] = useState(false);
  const activeControllerRef = useRef<AbortController | null>(null);
  const activeUploadRef = useRef<ActiveFinalAssetMultipartUpload | null>(null);
  const cancelledRef = useRef(false);
  const isMountedRef = useRef(true);
  const retryModeRef = useRef<MultipartRetryMode>(null);

  const updateState = (nextState: FinalAssetMultipartUploadState) => {
    if (isMountedRef.current) {
      setState(nextState);
    }
  };

  const updateCanRetry = (nextCanRetry: boolean) => {
    if (isMountedRef.current) {
      setCanRetry(nextCanRetry);
    }
  };

  const hasExpiredMultipartSession = (
    activeUpload: ActiveFinalAssetMultipartUpload,
  ): boolean => Date.now() - activeUpload.startedAt >= MULTIPART_SESSION_EXPIRY_MS;

  const expireMultipartSession = (
    activeUpload: ActiveFinalAssetMultipartUpload,
  ) => {
    if (activeUploadRef.current === activeUpload) {
      activeUploadRef.current = null;
    }
    retryModeRef.current = null;
    updateCanRetry(false);
    updateState({
      ...initialMultipartUploadState,
      error: "The upload session expired. Select the ZIP and start again.",
      phase: "failed",
    });
  };

  const updateProgress = (activeUpload: ActiveFinalAssetMultipartUpload) => {
    if (cancelledRef.current) {
      return;
    }

    updateState({
      completedBytes: getCompletedMultipartBytes(
        activeUpload.file,
        activeUpload.multipartUpload.partSize,
        activeUpload.completedParts,
      ),
      completedParts: activeUpload.completedParts.size,
      error: null,
      fileName: activeUpload.file.name,
      partCount: activeUpload.multipartUpload.partCount,
      phase: "uploading",
      totalBytes: activeUpload.file.size,
    });
  };

  const completeUploadedParts = async (): Promise<void> => {
    const activeUpload = activeUploadRef.current;
    if (!activeUpload) {
      throw new Error("No active Final ZIP upload is available to complete.");
    }

    if (hasExpiredMultipartSession(activeUpload)) {
      expireMultipartSession(activeUpload);
      throw new MultipartUploadSessionExpiredError();
    }

    updateState({
      completedBytes: activeUpload.file.size,
      completedParts: activeUpload.completedParts.size,
      error: null,
      fileName: activeUpload.file.name,
      partCount: activeUpload.multipartUpload.partCount,
      phase: "completing",
      totalBytes: activeUpload.file.size,
    });

    try {
      await completeFinalAssetMultipartUpload(workspaceId, researchItemId, {
        parts: [...activeUpload.completedParts.values()].sort(
          (firstPart, secondPart) => firstPart.partNumber - secondPart.partNumber,
        ),
        sessionToken: activeUpload.multipartUpload.sessionToken,
      });
      activeUploadRef.current = null;
      retryModeRef.current = null;
      updateCanRetry(false);
      updateState({
        completedBytes: activeUpload.file.size,
        completedParts: activeUpload.multipartUpload.partCount,
        error: null,
        fileName: activeUpload.file.name,
        partCount: activeUpload.multipartUpload.partCount,
        phase: "success",
        totalBytes: activeUpload.file.size,
      });
      onUploaded();
    } catch (error) {
      if (
        isExpiredMultipartSessionError(error) ||
        hasExpiredMultipartSession(activeUpload)
      ) {
        expireMultipartSession(activeUpload);
      } else {
        retryModeRef.current = "complete";
        updateCanRetry(true);
        updateState({
          completedBytes: activeUpload.file.size,
          completedParts: activeUpload.completedParts.size,
          error: "All ZIP parts uploaded, but finalizing failed. Retry finalization.",
          fileName: activeUpload.file.name,
          partCount: activeUpload.multipartUpload.partCount,
          phase: "failed",
          totalBytes: activeUpload.file.size,
        });
      }
      throw error;
    }
  };

  const uploadPendingPartsAndComplete = async (): Promise<void> => {
    const activeUpload = activeUploadRef.current;
    if (!activeUpload) {
      throw new Error("No active Final ZIP upload is available.");
    }

    if (hasExpiredMultipartSession(activeUpload)) {
      expireMultipartSession(activeUpload);
      throw new MultipartUploadSessionExpiredError();
    }

    const controller = new AbortController();
    activeControllerRef.current = controller;
    cancelledRef.current = false;
    updateProgress(activeUpload);

    try {
      await uploadPendingMultipartParts({
        completedPartNumbers: new Set(activeUpload.completedParts.keys()),
        file: activeUpload.file,
        multipartUpload: activeUpload.multipartUpload,
        onPartUploaded: (part) => {
          activeUpload.completedParts.set(part.partNumber, {
            eTag: part.eTag,
            partNumber: part.partNumber,
          });
          updateProgress(activeUpload);
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (cancelledRef.current || error instanceof MultipartUploadCancelledError) {
        throw new MultipartUploadCancelledError();
      }

      if (hasExpiredMultipartSession(activeUpload)) {
        expireMultipartSession(activeUpload);
        throw new MultipartUploadSessionExpiredError();
      }

      retryModeRef.current = "parts";
      updateCanRetry(true);
      updateState({
        completedBytes: getCompletedMultipartBytes(
          activeUpload.file,
          activeUpload.multipartUpload.partSize,
          activeUpload.completedParts,
        ),
        completedParts: activeUpload.completedParts.size,
        error: "A ZIP part could not be uploaded. Retry to continue this upload.",
        fileName: activeUpload.file.name,
        partCount: activeUpload.multipartUpload.partCount,
        phase: "failed",
        totalBytes: activeUpload.file.size,
      });
      throw error;
    } finally {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
    }

    if (cancelledRef.current) {
      throw new MultipartUploadCancelledError();
    }

    await completeUploadedParts();
  };

  const start = async (file: File): Promise<boolean> => {
    if (activeControllerRef.current || activeUploadRef.current) {
      return false;
    }

    updateCanRetry(false);
    cancelledRef.current = false;
    updateState({
      ...initialMultipartUploadState,
      fileName: file.name,
      phase: "uploading",
      totalBytes: file.size,
    });

    try {
      const initController = new AbortController();
      activeControllerRef.current = initController;
      let multipartUpload: MultipartInitResponse;

      try {
        multipartUpload = await initFinalAssetMultipartUpload(
          workspaceId,
          researchItemId,
          { fileName: file.name, fileSize: file.size },
          initController.signal,
        );
      } finally {
        if (activeControllerRef.current === initController) {
          activeControllerRef.current = null;
        }
      }

      if (cancelledRef.current) {
        void abortFinalAssetMultipartUpload(workspaceId, researchItemId, {
          sessionToken: multipartUpload.sessionToken,
        });
        return false;
      }

      activeUploadRef.current = {
        completedParts: new Map(),
        file,
        multipartUpload,
        startedAt: Date.now(),
      };
      retryModeRef.current = "parts";
      await uploadPendingPartsAndComplete();
      return true;
    } catch (error) {
      if (
        cancelledRef.current ||
        error instanceof MultipartUploadCancelledError ||
        error instanceof MultipartUploadSessionExpiredError
      ) {
        return false;
      }

      if (retryModeRef.current === null) {
        updateState({
          ...initialMultipartUploadState,
          error: getMultipartUploadErrorMessage(error),
          fileName: file.name,
          phase: "failed",
          totalBytes: file.size,
        });
      }
      throw error;
    }
  };

  const retry = async (): Promise<void> => {
    if (retryModeRef.current === "complete") {
      await completeUploadedParts();
      return;
    }

    if (retryModeRef.current === "parts") {
      await uploadPendingPartsAndComplete();
    }
  };

  const cancel = async (): Promise<void> => {
    cancelledRef.current = true;
    activeControllerRef.current?.abort();
    const activeUpload = activeUploadRef.current;
    activeUploadRef.current = null;
    retryModeRef.current = null;
    updateCanRetry(false);

    if (!activeUpload) {
      updateState(initialMultipartUploadState);
      return;
    }

    try {
      await abortFinalAssetMultipartUpload(workspaceId, researchItemId, {
        sessionToken: activeUpload.multipartUpload.sessionToken,
      });
      updateState(initialMultipartUploadState);
    } catch {
      updateState({
        ...initialMultipartUploadState,
        error: "Upload cancelled locally, but server cleanup failed. Select the ZIP and try again.",
        fileName: activeUpload.file.name,
        phase: "failed",
        totalBytes: activeUpload.file.size,
      });
    }
  };

  const reset = () => {
    if (activeUploadRef.current) {
      void cancel();
      return;
    }

    updateCanRetry(false);
    updateState(initialMultipartUploadState);
  };

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cancelledRef.current = true;
      activeControllerRef.current?.abort();
      const activeUpload = activeUploadRef.current;
      if (activeUpload) {
        void abortFinalAssetMultipartUpload(workspaceId, researchItemId, {
          sessionToken: activeUpload.multipartUpload.sessionToken,
        });
      }
    };
  }, [researchItemId, workspaceId]);

  return {
    cancel,
    canRetry,
    reset,
    retry,
    start,
    state,
  };
}

function shouldRetry(error: unknown, failureCount: number): boolean {
  return !(error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) && failureCount < 1;
}

function useDesignInvalidation(workspaceId: string, researchItemId: string) {
  const queryClient = useQueryClient();
  return (includeDashboard = false, includeHandoff = false) => {
    void queryClient.invalidateQueries({ queryKey: designWorkspaceKeys.detail(workspaceId, researchItemId) });
    void queryClient.invalidateQueries({ queryKey: designerWorkKeys.queues(workspaceId) });
    void queryClient.invalidateQueries({ queryKey: researchKeys.detail(workspaceId, researchItemId) });
    if (includeDashboard) void queryClient.invalidateQueries({ queryKey: ["dashboard", workspaceId] });
    if (includeHandoff) {
      void queryClient.invalidateQueries({ queryKey: listingKeys.queues(workspaceId) });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all(workspaceId) });
    }
  };
}

export function useDesignDetail(workspaceId: string, researchItemId: string, enabled: boolean) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0 && researchItemId.length > 0,
    queryFn: () => getDesignDetail(workspaceId, researchItemId),
    queryKey: designWorkspaceKeys.detail(workspaceId, researchItemId),
    retry: (failureCount, error) => shouldRetry(error, failureCount),
    staleTime: 15_000,
  });
}

export function useDesignActions(workspaceId: string, researchItemId: string) {
  const invalidate = useDesignInvalidation(workspaceId, researchItemId);
  const startWork = useMutation({
    mutationFn: () => postDesignAction(workspaceId, researchItemId, "start"),
    onSuccess: () => { invalidate(); },
  });
  const startCorrection = useMutation({
    mutationFn: () => postDesignAction(workspaceId, researchItemId, "start-correction"),
    onSuccess: () => invalidate(true),
  });
  const completeWork = useMutation({
    mutationFn: () => postDesignAction(workspaceId, researchItemId, "complete"),
    onSuccess: () => invalidate(true, true),
  });
  const submitReview = useMutation({
    mutationFn: ({ image, note }: { image: File; note: string }) => uploadReview(workspaceId, researchItemId, image, note),
    onSuccess: () => { invalidate(); },
  });
  const multipartFinalAssetUpload = useFinalAssetMultipartUpload(
    workspaceId,
    researchItemId,
    () => invalidate(),
  );
  const reportIssue = useMutation({
    mutationFn: (values: ReportIssueFormValues) => reportDesignIssue(workspaceId, researchItemId, values),
    onSuccess: () => invalidate(true),
  });

  return {
    completeWork,
    multipartFinalAssetUpload,
    reportIssue,
    startCorrection,
    startWork,
    submitReview,
  };
}

export function useDesignerAnnotationReply(
  workspaceId: string,
  researchItemId: string,
  reviewId?: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      annotationId,
      message,
    }: {
      annotationId: string;
      message: string;
    }) => createAnnotationReply(workspaceId, annotationId, { message }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: designWorkspaceKeys.detail(workspaceId, researchItemId),
      });
      void queryClient.invalidateQueries({
        queryKey: researchKeys.lists(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: researchKeys.detail(workspaceId, researchItemId),
      });
      if (reviewId) {
        void queryClient.invalidateQueries({
          queryKey: reviewsKeys.detail(workspaceId, reviewId),
        });
      } else {
        void queryClient.invalidateQueries({
          queryKey: reviewsKeys.details(workspaceId),
        });
      }
    },
  });
}
