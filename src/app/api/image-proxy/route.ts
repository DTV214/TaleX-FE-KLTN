import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = request.url;
  const urlParamIndex = requestUrl.indexOf("?url=");
  let targetUrl: string | null = null;
  
  if (urlParamIndex !== -1) {
    const raw = requestUrl.substring(urlParamIndex + 5);
    try {
      targetUrl = decodeURIComponent(raw);
    } catch {
      targetUrl = raw;
    }
  } else {
    targetUrl = request.nextUrl.searchParams.get("url");
  }

  if (!targetUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      console.error(`[image-proxy] Origin returned status ${res.status}: ${res.statusText}`);
      return new NextResponse(`Failed to fetch image from origin: ${res.statusText}`, { status: res.status });
    }

    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("[image-proxy] Error proxying image:", error);
    return new NextResponse(`Internal proxy error: ${error.message}`, { status: 500 });
  }
}

