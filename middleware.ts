import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Récupérer la session utilisateur
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  console.log("Middleware - Path:", request.nextUrl.pathname)
  console.log("Middleware - Session exists:", !!session)
  console.log("Middleware - User ID:", session?.user?.id)

  // Si l'utilisateur essaie d'accéder à /chat sans être connecté
  if (request.nextUrl.pathname.startsWith("/chat")) {
    if (!session || error) {
      console.log("Middleware - Redirecting to /auth (no session)")
      const url = request.nextUrl.clone()
      url.pathname = "/auth"
      return NextResponse.redirect(url)
    }
  }

  // Si l'utilisateur est connecté et essaie d'accéder à /auth
  if (request.nextUrl.pathname.startsWith("/auth") && session && !error) {
    console.log("Middleware - Redirecting to /chat (has session)")
    const url = request.nextUrl.clone()
    url.pathname = "/chat"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
