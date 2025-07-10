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

  // Protection des routes /admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    console.log("Middleware - Accessing admin route:", request.nextUrl.pathname)
    if (!session || error) {
      console.log("Middleware - Admin: No session, redirecting to /auth")
      const url = request.nextUrl.clone()
      url.pathname = "/auth" // ou "/" si vous préférez une redirection plus discrète
      return NextResponse.redirect(url)
    }

    // Récupérer le profil utilisateur pour vérifier le rôle
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (profileError) {
        console.error("Middleware - Admin: Error fetching profile:", profileError.message)
        throw profileError; // Propage l'erreur pour la redirection générale
      }

      console.log("Middleware - Admin: User profile fetched, role:", userProfile?.role)

      if (!userProfile || userProfile.role !== "admin") {
        console.log("Middleware - Admin: Not an admin, redirecting to /")
        const url = request.nextUrl.clone()
        url.pathname = "/" // Rediriger vers la page d'accueil
        return NextResponse.redirect(url)
      }
      console.log("Middleware - Admin: Access granted")
    } catch (e) {
      console.error("Middleware - Admin: Exception during role check, redirecting to /", e)
      const url = request.nextUrl.clone()
      url.pathname = "/" // Fallback redirect
      return NextResponse.redirect(url)
    }
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
     * - images (public images, y compris placeholder.svg)
     * - api (API routes)
     * - manifest.json (PWA manifest)
     * - sw.js (Service Worker)
     * Les extensions de fichiers statiques sont déjà gérées par la regex `.*\\.(?:svg|png|jpg|jpeg|gif|webp)$`
     * On ajoute ici les chemins spécifiques /admin, /chat, /auth pour que le middleware les traite.
     * Les autres chemins (comme la page d'accueil "/") seront également concernés par le middleware
     * à moins d'être explicitement exclus si nécessaire (par exemple, si la page d'accueil est publique).
     * La regex actuelle attrape tout ce qui n'est pas un asset statique connu.
     * Modification pour une approche plus explicite : ne faire correspondre que les chemins d'application.
     */
    // Ancien matcher: "/((?!_next/static|_next/image|favicon\\.ico|images/.*|api/.*|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    '/chat/:path*',
    '/auth/:path*',
    '/admin/:path*',
    // Ajoutez '/' si la page d'accueil nécessite une logique de middleware.
    // Pour l'instant, on la laisse être servie statiquement sans middleware si possible.
  ],
}
