// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ALLOWED_EXACT = new Set<string>([
  '/',            // home
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]);

// file requests like .png, .jpg, .css, .js, .svg…
const PUBLIC_FILE = /\.(?:.*)$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow the homepage and public files
  if (ALLOWED_EXACT.has(pathname) || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  // Allow Next internals / static asset pipelines
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/logos') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/fonts')
  ) {
    return NextResponse.next();
  }

  // Everything else -> redirect to home
  const url = req.nextUrl.clone();
  url.pathname = '/';
  url.search = '';
  return NextResponse.redirect(url);
}

// Skip running middleware for static asset paths to save cycles
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
