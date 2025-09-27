// middleware.ts
import type { NextRequest } from 'next/server';
import { handleSessionOnEdge } from '@frontegg/nextjs/edge';

export const middleware = async (request: NextRequest) => {
  const { pathname, searchParams } = request.nextUrl;

  // Frontegg's handleSessionOnEdge now handles the internal bypass logic.
  // Just pass the request + headers.
  return handleSessionOnEdge({
    request,
    pathname,
    searchParams,
    headers: request.headers,
  });
};

// Only protect the dashboard and settings areas
export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
};
