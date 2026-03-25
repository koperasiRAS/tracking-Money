import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !user) {
      // Code exchange failed — redirect to login with specific error
      const errorParam = error?.message ? `code_exchange_failed:${encodeURIComponent(error.message)}` : "no_user";
      return NextResponse.redirect(
        new URL(`/auth/login?error=${errorParam}`, origin)
      );
    }

    // User authenticated successfully — check 2FA enrollment
    const { data: factors } = await supabase.auth.mfa.listFactors();

    const hasTotp = factors?.all?.some(
      (f) => f.factor_type === "totp" && f.status === "verified"
    );

    if (hasTotp) {
      // User has 2FA enrolled — redirect to verify page
      const session = await supabase.auth.getSession();
      if (session.data.session) {
        // Set a cookie to indicate 2FA pending verification
        const response = NextResponse.redirect(
          new URL("/auth/2fa-verify", origin)
        );
        response.cookies.set(
          "mfa_pending",
          "true",
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 10, // 10 minutes
            path: "/",
          }
        );
        return response;
      }
    }

    // No 2FA enrolled — redirect to enroll page
    return NextResponse.redirect(new URL("/auth/2fa-enroll", origin));
  }

  // No code provided
  return NextResponse.redirect(new URL("/auth/login?error=missing_code", origin));
}
