import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { AppError } from "@/lib/errors";

function rejectedAdapter(status: number, code: string, message = code) {
  return (config: InternalAxiosRequestConfig) =>
    Promise.reject(
      new AxiosError(
        "Request failed",
        undefined,
        config,
        {},
        {
          data: {
            status,
            code,
            message,
            traceId: "trace-1",
          },
          status,
          statusText: "Error",
          headers: new AxiosHeaders({ "X-Trace-Id": "trace-1" }),
          config,
        },
      ),
    );
}

describe("api interceptor auth handling", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    window.history.replaceState(null, "", "/");
    consoleErrorSpy.mockRestore();
  });

  it("keeps structured 401 login errors as backend messages without redirecting", async () => {
    window.history.replaceState(null, "", "/login");
    localStorage.setItem("token", "token");
    localStorage.setItem("user", JSON.stringify({ username: "user" }));

    await expect(
      api.post("/auth/login", {}, { adapter: rejectedAdapter(401, "UNAUTHORIZED", "Invalid username or password") }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
      message: "Invalid username or password",
      traceId: "trace-1",
    });

    expect(localStorage.getItem("token")).toBe("token");
    expect(localStorage.getItem("user")).toBe(JSON.stringify({ username: "user" }));
    expect(window.location.pathname).toBe("/login");
  });

  it("clears stored auth and rejects with AppError on 401", async () => {
    window.history.replaceState(null, "", "/wallets");
    localStorage.setItem("token", "token");
    localStorage.setItem("user", JSON.stringify({ username: "user" }));

    await expect(
      api.get("/wallets", { adapter: rejectedAdapter(401, "UNAUTHORIZED") }),
    ).rejects.toBeInstanceOf(AppError);

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(window.location.pathname).toBe("/login");
  });

  it("does not clear stored auth on 403", async () => {
    window.history.replaceState(null, "", "/wallets");
    localStorage.setItem("token", "token");
    localStorage.setItem("user", JSON.stringify({ username: "user" }));

    await expect(
      api.get("/wallets", { adapter: rejectedAdapter(403, "FORBIDDEN") }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });

    expect(localStorage.getItem("token")).toBe("token");
    expect(localStorage.getItem("user")).toBe(JSON.stringify({ username: "user" }));
    expect(window.location.pathname).toBe("/wallets");
  });
});
