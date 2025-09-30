import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/simple-kanzleiablauf-team(.*)',
  '/simple-dashboard(.*)',
  '/simple-kanzleiablauf-v3(.*)',
  '/admin(.*)',
  '/api/dashboard-data(.*)',
  '/api/simple-daily-entry(.*)',
  '/api/simple-goals(.*)',
  '/api/admin(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};