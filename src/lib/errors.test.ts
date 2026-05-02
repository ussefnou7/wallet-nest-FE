import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { getFieldError, getFriendlyErrorMessage, mapApiError } from "@/lib/errors";

function axiosError({
  status,
  data,
  code,
  headers,
}: {
  status?: number;
  data?: unknown;
  code?: string;
  headers?: Record<string, string>;
} = {}) {
  const config = { url: "/wallets", headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError(
    "Request failed",
    code,
    config,
    {},
    status
      ? {
          data,
          status,
          statusText: "Error",
          headers: new AxiosHeaders(headers),
          config,
        }
      : undefined,
  );
}

describe("mapApiError", () => {
  it("maps structured backend errors and keeps the backend trace id", () => {
    const appError = mapApiError(
      axiosError({
        status: 404,
        data: {
          timestamp: "2026-04-25T10:00:00Z",
          status: 404,
          code: "WALLET_NOT_FOUND",
          message: "Wallet was not found",
          path: "/api/v1/wallets/1",
          traceId: "backend-trace",
        },
        headers: { "X-Trace-Id": "header-trace" },
      }),
    );

    expect(appError.code).toBe("WALLET_NOT_FOUND");
    expect(appError.status).toBe(404);
    expect(appError.message).toBe("Wallet was not found");
    expect(appError.traceId).toBe("backend-trace");
    expect(appError.isNetworkError).toBe(false);
  });

  it("uses the backend message for structured 401 login errors", () => {
    const appError = mapApiError(
      axiosError({
        status: 401,
        data: {
          timestamp: "2026-04-25T10:00:00Z",
          status: 401,
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
          path: "/api/v1/auth/login",
          details: {},
          traceId: "login-trace",
        },
      }),
    );

    expect(appError.code).toBe("UNAUTHORIZED");
    expect(appError.message).toBe("Invalid username or password");
    expect(getFriendlyErrorMessage(appError)).toBe("Invalid username or password");
  });

  it("maps timeouts to NETWORK_TIMEOUT", () => {
    const appError = mapApiError(axiosError({ code: "ECONNABORTED" }));

    expect(appError.code).toBe("NETWORK_TIMEOUT");
    expect(appError.isNetworkError).toBe(true);
  });

  it("maps network failures to NETWORK_ERROR", () => {
    const appError = mapApiError(axiosError({ code: AxiosError.ERR_NETWORK }));

    expect(appError.code).toBe("NETWORK_ERROR");
    expect(appError.isNetworkError).toBe(true);
  });

  it("preserves validation details for field-level errors", () => {
    const appError = mapApiError(
      axiosError({
        status: 400,
        data: {
          status: 400,
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: {
            name: "Name is required",
            amount: "Amount must be greater than 0",
          },
        },
      }),
    );

    expect(appError.details).toEqual({
      name: "Name is required",
      amount: "Amount must be greater than 0",
    });
    expect(getFieldError(appError, "amount")).toBe("Amount must be greater than 0");
  });

  it("maps cancelled requests to REQUEST_CANCELLED", () => {
    const appError = mapApiError(new axios.CanceledError("cancelled"));

    expect(appError.code).toBe("REQUEST_CANCELLED");
  });
});
