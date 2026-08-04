import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/health", () => {
    return HttpResponse.json({
      success: true,
      message: "MSW is ready",
      data: null,
    });
  }),
];
