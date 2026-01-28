import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = process.env.ADMIN_TOKEN;

  // If no token is configured, allow all admin access (local-only mode).
  if (!token) return NextResponse.next();

  const provided =
    req.headers.get("x-admin-token") ?? req.cookies.get("admin_token")?.value;
  if (provided === token) return NextResponse.next();

  return new NextResponse("Unauthorized", { status: 401 });
}

export const config = {
  matcher: ["/admin/:path*"],
};
