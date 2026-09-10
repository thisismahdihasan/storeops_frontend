export type HttpMethod = "DELETE" | "GET" | "PATCH" | "POST";
export type ApiResponseType = "auto" | "blob" | "json" | "text";

export type ApiRequestOptions = {
  body?: BodyInit;
  headers?: HeadersInit;
  json?: unknown;
  method?: HttpMethod;
  responseType?: ApiResponseType;
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  data?: unknown;
  message?: unknown;
};

export class ApiError extends Error {
  public readonly data?: unknown;
  public readonly status: number;

  public constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return apiBaseUrl;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toSafeErrorMessage(status: number, payload: unknown) {
  if (status >= 500) {
    return "The service could not complete the request. Please try again.";
  }

  if (isRecord(payload) && typeof payload.message === "string") {
    return payload.message;
  }

  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  return "The request could not be completed.";
}

async function readErrorPayload(response: Response): Promise<ApiErrorPayload | null> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    const payload: unknown = await response.json();
    return isRecord(payload) ? payload : null;
  } catch {
    return null;
  }
}

async function readResponse<T>(
  response: Response,
  responseType: ApiResponseType,
): Promise<T | undefined> {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const resolvedType =
    responseType === "auto"
      ? contentType.includes("application/json")
        ? "json"
        : "text"
      : responseType;

  if (resolvedType === "blob") {
    return (await response.blob()) as T;
  }

  if (resolvedType === "text") {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T | undefined> {
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;

  if (options.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.json);
  } else if (options.body !== undefined) {
    body = options.body;
  }

  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      body,
      credentials: "include",
      headers,
      method: options.method ?? "GET",
      signal: options.signal,
    });
  } catch {
    throw new ApiError(0, "Unable to reach the service. Check your connection and try again.");
  }

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw new ApiError(
      response.status,
      toSafeErrorMessage(response.status, payload),
      payload?.data,
    );
  }

  return readResponse<T>(response, options.responseType ?? "auto");
}
