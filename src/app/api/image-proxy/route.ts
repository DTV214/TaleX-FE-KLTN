import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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

  // Xác định origin để gửi Referer/Origin header đúng
  const origin = request.headers.get("origin") || request.headers.get("referer") || "https://talex.pro.vn";
  const originUrl = origin.startsWith("http") ? new URL(origin).origin : "https://talex.pro.vn";

  try {
    // Dùng fetch API native (thay vì axios) — nhẹ hơn, tương thích serverless tốt hơn
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        // Giả lập đầy đủ headers của trình duyệt Chrome để CloudFront/WAF không chặn
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": `${originUrl}/`,
        "Origin": originUrl,
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "Sec-Ch-Ua": '"Chromium";v="126", "Google Chrome";v="126", "Not-A.Brand";v="8"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`[image-proxy] CloudFront returned ${response.status} ${response.statusText} for: ${targetUrl.substring(0, 120)}`);
      return new NextResponse(`Upstream error: ${response.status}`, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[image-proxy] Fetch error for ${targetUrl.substring(0, 120)}: ${message}`);
    return new NextResponse(`Internal proxy error: ${message}`, { status: 502 });
  }
}
