import type {
  MultipartCompleteRequest,
  MultipartInitResponse,
} from "./design-workspace.schemas";

const MAX_PART_UPLOAD_ATTEMPTS = 4;
const PART_UPLOAD_CONCURRENCY = 3;
const RETRY_DELAYS_MS = [500, 1500, 3000] as const;

export type MultipartUploadProgressPart = MultipartCompleteRequest["parts"][number];

export type UploadedMultipartPart = MultipartUploadProgressPart & {
  uploadedBytes: number;
};

export type MultipartPartErrorKind =
  | "cancelled"
  | "network"
  | "http_retryable"
  | "http_non_retryable"
  | "missing_etag";

export type MultipartPartErrorDetails = {
  kind: MultipartPartErrorKind;
  partNumber: number;
  status?: number;
};

export class MultipartUploadCancelledError extends Error {
  public constructor() {
    super("Final ZIP upload was cancelled.");
    this.name = "MultipartUploadCancelledError";
  }
}

export class MultipartPartUploadError extends Error {
  public readonly kind: MultipartPartErrorKind;
  public readonly partNumber: number;
  public readonly status?: number;

  public constructor(message: string, details: MultipartPartErrorDetails) {
    super(message);
    this.name = "MultipartPartUploadError";
    this.kind = details.kind;
    this.partNumber = details.partNumber;
    this.status = details.status;
  }
}

export const isPartUploadErrorRetryable = (error: unknown): boolean => {
  if (error instanceof MultipartPartUploadError) {
    return (
      error.kind === "network" ||
      error.kind === "http_retryable" ||
      error.kind === "missing_etag"
    );
  }
  return false;
};

const throwIfAborted = (signal: AbortSignal): void => {
  if (signal.aborted) {
    throw new MultipartUploadCancelledError();
  }
};

const waitForRetry = (delayMs: number, signal: AbortSignal): Promise<void> => {
  if (signal.aborted) {
    return Promise.reject(new MultipartUploadCancelledError());
  }

  return new Promise((resolve, reject) => {
    let timeoutId: number | null = null;
    const onAbort = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      reject(new MultipartUploadCancelledError());
    };

    timeoutId = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);

    signal.addEventListener("abort", onAbort, { once: true });
  });
};

const getPartByteLength = (
  file: File,
  partNumber: number,
  partSize: number,
): number => {
  const start = (partNumber - 1) * partSize;
  return Math.max(0, Math.min(start + partSize, file.size) - start);
};

const uploadPartOnce = async (
  file: File,
  part: MultipartInitResponse["parts"][number],
  partSize: number,
  signal: AbortSignal,
): Promise<UploadedMultipartPart> => {
  throwIfAborted(signal);

  const start = (part.partNumber - 1) * partSize;
  const end = Math.min(start + partSize, file.size);
  let response: Response;

  try {
    response = await fetch(part.uploadUrl, {
      body: file.slice(start, end),
      credentials: "omit",
      method: "PUT",
      signal,
    });
  } catch (error) {
    if (signal.aborted || error instanceof MultipartUploadCancelledError) {
      throw new MultipartUploadCancelledError();
    }

    throw new MultipartPartUploadError(
      `Part ${part.partNumber} upload failed due to a network issue.`,
      {
        kind: "network",
        partNumber: part.partNumber,
      },
    );
  }

  if (!response.ok) {
    const isRetryable =
      response.status === 408 ||
      response.status === 429 ||
      response.status >= 500;

    throw new MultipartPartUploadError(
      isRetryable
        ? `Part ${part.partNumber} upload failed with a retryable storage response.`
        : `Part ${part.partNumber} upload could not continue.`,
      {
        kind: isRetryable ? "http_retryable" : "http_non_retryable",
        partNumber: part.partNumber,
        status: response.status,
      },
    );
  }

  const eTag = response.headers.get("ETag");
  if (!eTag || eTag.trim().length === 0) {
    throw new MultipartPartUploadError(
      `Part ${part.partNumber} upload response is missing an ETag verification header.`,
      {
        kind: "missing_etag",
        partNumber: part.partNumber,
        status: response.status,
      },
    );
  }

  return {
    eTag,
    partNumber: part.partNumber,
    uploadedBytes: end - start,
  };
};

const uploadPartWithRetry = async (
  file: File,
  part: MultipartInitResponse["parts"][number],
  partSize: number,
  signal: AbortSignal,
): Promise<UploadedMultipartPart> => {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_PART_UPLOAD_ATTEMPTS; attempt += 1) {
    try {
      return await uploadPartOnce(file, part, partSize, signal);
    } catch (error) {
      if (signal.aborted || error instanceof MultipartUploadCancelledError) {
        throw new MultipartUploadCancelledError();
      }

      lastError = error;

      if (!isPartUploadErrorRetryable(error)) {
        throw error;
      }

      const retryDelay = RETRY_DELAYS_MS[attempt];
      if (retryDelay !== undefined) {
        await waitForRetry(retryDelay, signal);
      }
    }
  }

  if (lastError instanceof MultipartPartUploadError) {
    throw lastError;
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new MultipartPartUploadError(
    `Part ${part.partNumber} could not be uploaded.`,
    {
      kind: "network",
      partNumber: part.partNumber,
    },
  );
};

type UploadMultipartPartsInput = {
  completedPartNumbers: ReadonlySet<number>;
  file: File;
  multipartUpload: MultipartInitResponse;
  onPartUploaded: (part: UploadedMultipartPart) => void;
  signal: AbortSignal;
};

// Uploads only pending parts with a bounded worker pool, retaining successful part results for retry.
export const uploadPendingMultipartParts = async ({
  completedPartNumbers,
  file,
  multipartUpload,
  onPartUploaded,
  signal,
}: UploadMultipartPartsInput): Promise<UploadedMultipartPart[]> => {
  const pendingParts = multipartUpload.parts
    .filter((part) => !completedPartNumbers.has(part.partNumber))
    .sort((firstPart, secondPart) => firstPart.partNumber - secondPart.partNumber);
  const uploadedParts: UploadedMultipartPart[] = [];
  let nextPartIndex = 0;
  let shouldStop = false;

  const worker = async (): Promise<void> => {
    while (!shouldStop && !signal.aborted) {
      const part = pendingParts[nextPartIndex];
      nextPartIndex += 1;

      if (!part) {
        return;
      }

      try {
        const uploadedPart = await uploadPartWithRetry(
          file,
          part,
          multipartUpload.partSize,
          signal,
        );
        uploadedParts.push(uploadedPart);
        onPartUploaded(uploadedPart);
      } catch (error) {
        shouldStop = true;
        throw error;
      }
    }

    throwIfAborted(signal);
  };

  const workerCount = Math.min(PART_UPLOAD_CONCURRENCY, pendingParts.length);
  const workerResults = await Promise.allSettled(
    Array.from({ length: workerCount }, () => worker()),
  );
  const failedWorker = workerResults.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  if (failedWorker) {
    throw failedWorker.reason;
  }

  return uploadedParts;
};

export const getCompletedMultipartBytes = (
  file: File,
  partSize: number,
  completedParts: ReadonlyMap<number, MultipartUploadProgressPart>,
): number => {
  return [...completedParts.keys()].reduce(
    (total, partNumber) => total + getPartByteLength(file, partNumber, partSize),
    0,
  );
};
