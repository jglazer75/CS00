import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Auth callback route for PKCE flow.
 *
 * Supabase redirects here after an invite or password-reset email is clicked.
 * The URL contains a `code` query param which is exchanged for a session via
 * PKCE — this exchange can only succeed in a real browser (the code verifier
 * is stored in the browser's localStorage), so email security scanners that
 * pre-fetch links cannot consume the token.
 *
 * After exchange:
 *   - invite / recovery → redirect to /login so the user can set their password
 *   - everything else   → redirect to / (already signed in)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const type = searchParams.get('type'); // 'invite' | 'recovery' | null

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL('/login', origin);
    loginUrl.hash = `error=access_denied&error_code=${error.status ?? 'unknown'}&error_description=${encodeURIComponent(error.message)}`;
    return NextResponse.redirect(loginUrl);
  }

  // Invite and recovery flows: send to /login so the password-set form appears.
  // The user already has a valid session at this point; the login page detects
  // type=invite/recovery in the hash and shows the "Set your password" form.
  if (type === 'invite' || type === 'recovery') {
    const loginUrl = new URL('/login', origin);
    loginUrl.hash = `type=${type}`;
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
