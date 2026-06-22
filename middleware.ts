import { NextResponse } from "next/server";
import type { NextRequest } from "next/server"; // Chỗ này đổi từ 'next/request' thành 'next/server'

export function middleware(request: NextRequest) {
  // 1. Lấy thẻ làm việc (token) từ Cookie ra kiểm tra
  const token = request.cookies.get("sb-access-token")?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith("/login");

  // 2. Nếu người dùng CHƯA đăng nhập mà cố tình vào các trang quản trị, xưởng cán, admin...
  if (!token && !isLoginPage) {
    // Bế họ quay xe thẳng về trang Đăng nhập
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Nếu người dùng ĐÃ đăng nhập rồi mà vẫn cố vào lại trang /login
  if (token && isLoginPage) {
    // Đẩy họ vào trang chủ luôn chứ không cho đăng nhập nữa
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Cấu hình danh sách các đường dẫn cần được người bảo vệ này canh gác
export const config = {
  matcher: [
    /*
     * Áp dụng bảo mật cho tất cả các trang, NGOẠI TRỪ:
     * - api (các cổng gọi dữ liệu ngầm)
     * - _next/static, _next/image (các file hệ thống của Next.js)
     * - favicon.ico, các file ảnh trong thư mục public
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)",
  ],
};