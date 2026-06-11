import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

// Next.js 16 renamed the `middleware` file convention to `proxy`.
// Convex Auth's handler keeps the session cookie fresh on every request.
export default convexAuthNextjsMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
