import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const maxDuration = 300; // 5 minutes (for Vercel deployment)

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("accessToken")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    
    // Đọc toàn bộ Form Data từ request của trình duyệt
    const formData = await req.formData();

    // Dùng Axios để gửi lại Form Data đó sang Java Backend kèm theo Header Authorization
    const response = await axios.post(`${backendUrl}/api/v1/admin/watermark/extract`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 300000, // 5 minutes
      validateStatus: () => true // Không throw exception nếu status != 2xx
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error("Lỗi proxy tại Next.js:", error.message);
    return NextResponse.json(
      { message: "Internal Proxy Error", error: error.message },
      { status: 500 }
    );
  }
}
