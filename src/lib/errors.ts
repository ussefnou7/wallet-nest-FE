import axios, { AxiosError, CanceledError } from "axios";

export type ApiErrorResponse = {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
  details: Record<string, unknown>;
  traceId: string;
};

export class AppError extends Error {
  code: string;
  status?: number;
  details?: Record<string, unknown>;
  traceId?: string;
  isNetworkError: boolean;

  constructor({
    code,
    message,
    status,
    details,
    traceId,
    isNetworkError = false,
  }: {
    code: string;
    message: string;
    status?: number;
    details?: Record<string, unknown>;
    traceId?: string;
    isNetworkError?: boolean;
  }) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.traceId = traceId;
    this.isNetworkError = isNetworkError;
  }
}

const FALLBACK_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  BAD_REQUEST: "The request could not be completed. Please check your input and try again.",
  UNAUTHORIZED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You do not have permission to perform this action.",
  ENTITY_NOT_FOUND: "The requested item could not be found.",
  TENANT_NOT_FOUND: "The selected tenant could not be found.",
  USER_NOT_FOUND: "The selected user could not be found.",
  WALLET_NOT_FOUND: "The selected wallet could not be found.",
  BRANCH_NOT_FOUND: "The selected branch could not be found.",
  TRANSACTION_NOT_FOUND: "The selected transaction could not be found.",
  DUPLICATED_TRANSACTION: "This transaction has already been processed.",
  WALLET_LIMIT_EXCEEDED: "The wallet limit has been reached.",
  INSUFFICIENT_BALANCE: "There is not enough balance to complete this transaction.",
  DATA_CONFLICT: "This change conflicts with existing data. Please refresh and try again.",
  INTERNAL_SERVER_ERROR: "Something went wrong on our side. Please try again later.",
  NETWORK_ERROR: "Unable to reach the server. Please check your connection.",
  NETWORK_TIMEOUT: "The request took too long. Please try again.",
  REQUEST_CANCELLED: "The request was cancelled.",
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.code === "string" ||
    typeof value.message === "string" ||
    typeof value.status === "number" ||
    typeof value.traceId === "string"
  );
}

function getHeader(headers: unknown, headerName: string): string | undefined {
  const normalized = headerName.toLowerCase();
  if (!headers || typeof headers !== "object") return undefined;

  const maybeAxiosHeaders = headers as { get?: (name: string) => unknown };
  const fromGetter = maybeAxiosHeaders.get?.(headerName) ?? maybeAxiosHeaders.get?.(normalized);
  if (typeof fromGetter === "string" && fromGetter.trim()) return fromGetter;

  const value = (headers as Record<string, unknown>)[normalized] ?? (headers as Record<string, unknown>)[headerName];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function fromAxiosError(error: AxiosError): AppError {
  const status = error.response?.status;
  const traceId = getHeader(error.response?.headers, "X-Trace-Id");

  if (error.code === AxiosError.ETIMEDOUT || error.code === "ECONNABORTED") {
    return new AppError({
      code: "NETWORK_TIMEOUT",
      message: FALLBACK_MESSAGES.NETWORK_TIMEOUT,
      status,
      traceId,
      isNetworkError: true,
    });
  }

  if (error instanceof CanceledError || error.code === AxiosError.ERR_CANCELED) {
    return new AppError({
      code: "REQUEST_CANCELLED",
      message: FALLBACK_MESSAGES.REQUEST_CANCELLED,
      status,
      traceId,
      isNetworkError: true,
    });
  }

  if (isApiErrorResponse(error.response?.data)) {
    const data = error.response.data;
    const code = data.code ?? fallbackCodeForStatus(data.status ?? status);
    return new AppError({
      code,
      message: data.message || FALLBACK_MESSAGES[code] || FALLBACK_MESSAGES.UNKNOWN_ERROR,
      status: data.status ?? status,
      details: isRecord(data.details) ? data.details : undefined,
      traceId: data.traceId ?? traceId,
      isNetworkError: false,
    });
  }

  if (!error.response) {
    return new AppError({
      code: "NETWORK_ERROR",
      message: FALLBACK_MESSAGES.NETWORK_ERROR,
      isNetworkError: true,
    });
  }

  const code = fallbackCodeForStatus(status);
  return new AppError({
    code,
    message: FALLBACK_MESSAGES[code] || FALLBACK_MESSAGES.UNKNOWN_ERROR,
    status,
    traceId,
    isNetworkError: false,
  });
}

function fallbackCodeForStatus(status?: number): string {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "ENTITY_NOT_FOUND";
  if (status === 409) return "DATA_CONFLICT";
  if (status && status >= 500) return "INTERNAL_SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

export function mapApiError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (axios.isAxiosError(error)) {
    return fromAxiosError(error);
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new AppError({
      code: "REQUEST_CANCELLED",
      message: FALLBACK_MESSAGES.REQUEST_CANCELLED,
      isNetworkError: true,
    });
  }

  if (error instanceof Error) {
    return new AppError({
      code: "UNKNOWN_ERROR",
      message: FALLBACK_MESSAGES.UNKNOWN_ERROR,
    });
  }

  return new AppError({
    code: "UNKNOWN_ERROR",
    message: FALLBACK_MESSAGES.UNKNOWN_ERROR,
  });
}

export function getFriendlyErrorMessage(error: AppError): string {
  return error.message || FALLBACK_MESSAGES[error.code] || FALLBACK_MESSAGES.UNKNOWN_ERROR;
}

export function getFieldError(error: unknown, fieldName: string): string | undefined {
  const appError = mapApiError(error);
  const value = appError.details?.[fieldName];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string").join(", ") || undefined;
  return undefined;
}
