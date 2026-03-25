import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
            sameSite: options?.sameSite ?? 'lax',
            secure: options?.secure ?? true,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
            sameSite: 'lax',
            secure: true,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // If no user yet, try to refresh the session from cookies
  // This fixes the redirect loop after OAuth callback sets the session
  if (!user) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Session exists but not yet validated — validate it
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (refreshedUser) {
        return response;
      }
    }
  }

  // Protected routes (everything under /dashboard)
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard');

  // Auth routes (login/register + OAuth + 2FA)
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/auth/login') ||
    request.nextUrl.pathname.startsWith('/auth/register') ||
    request.nextUrl.pathname.startsWith('/auth/callback') ||
    request.nextUrl.pathname.startsWith('/auth/2fa-enroll') ||
    request.nextUrl.pathname.startsWith('/auth/2fa-verify');

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to sign up (not login)
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/auth/register', request.url));
  }

  // Redirect unauthenticated users from landing page to login
  if (request.nextUrl.pathname === '/' && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return response;
}
