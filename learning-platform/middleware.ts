import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function isPublicRoute(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/callback')
  )
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT against the Supabase auth server.
  // Do not add logic between createServerClient and getUser() —
  // the cookie refresh cycle must complete uninterrupted.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    // Allow unauthenticated access to module pages when kill switch is on
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith('/modules/')) {
      const moduleId = pathname.split('/')[2];
      if (moduleId) {
        const { data: mod } = await supabase
          .from('modules')
          .select('allow_unauthenticated')
          .eq('id', moduleId)
          .maybeSingle();
        if (mod?.allow_unauthenticated) {
          return response;
        }
      }
    }

    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run on all paths except:
     *   _next/static  — Next.js static assets
     *   _next/image   — Next.js image optimisation
     *   favicon.ico
     *   api/          — API routes authenticate via Bearer token, not cookies
     *   Common static file extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
