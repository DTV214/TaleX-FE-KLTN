import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse(`Failed to fetch image from origin: ${res.statusText}`, { status: res.status });
    }
    
    const blob = await res.blob();
    const headers = new Headers();
    
    const contentType = res.headers.get("content-type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    } else {
      headers.set("Content-Type", "application/octet-stream");
    }
    
    // Cấp quyền CORS cho Canvas để tránh lỗi Tainted Canvas
    headers.set("Access-Control-Allow-Origin", "*");
    
    // Cache ảnh trên trình duyệt
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    
    return new NextResponse(blob, { headers, status: 200 });
  } catch (error: any) {
    return new NextResponse(`Internal proxy error: ${error.message}`, { status: 500 });
  }
}
