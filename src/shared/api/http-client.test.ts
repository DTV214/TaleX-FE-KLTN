import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { httpClient } from "./http-client";

describe("httpClient", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it("uses credentials for API requests", () => {
    expect(httpClient.defaults.withCredentials).toBe(true);
  });

  it("returns a successful 200 response without modifying the payload", async () => {
    server.use(
      http.get("/api/test/success", () => {
        return HttpResponse.json(
          {
            code: 200,
            message: "OK",
            data: {
              id: "success-id",
              name: "TaleX",
            },
          },
          { status: 200 },
        );
      }),
    );

    const response = await httpClient.get("/api/test/success");

    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      code: 200,
      message: "OK",
      data: {
        id: "success-id",
        name: "TaleX",
      },
    });
  });

  it("refreshes token and retries the original request after a 401 response", async () => {
    let protectedRequestCount = 0;
    let refreshRequestCount = 0;

    server.use(
      http.get("/api/test/protected", () => {
        protectedRequestCount += 1;

        if (protectedRequestCount === 1) {
          return HttpResponse.json(
            {
              code: 401,
              message: "Unauthorized",
              data: null,
            },
            { status: 401 },
          );
        }

        return HttpResponse.json(
          {
            code: 200,
            message: "Retried successfully",
            data: {
              authenticated: true,
            },
          },
          { status: 200 },
        );
      }),

      http.post("/api/internal/auth/refresh", () => {
        refreshRequestCount += 1;

        return HttpResponse.json(
          {
            success: true,
          },
          { status: 200 },
        );
      }),
    );

    const response = await httpClient.get("/api/test/protected");

    expect(refreshRequestCount).toBe(1);
    expect(protectedRequestCount).toBe(2);
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      code: 200,
      message: "Retried successfully",
      data: {
        authenticated: true,
      },
    });
  });
});
