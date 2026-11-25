import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { esCorreoPermitido } from "@/lib/auth/dominio";

// Toda ruta exige sesión de Supabase (Microsoft 365) con correo @firplak.com, salvo /login y /auth.
// Refresca las cookies de la sesión en cada petición. Las API responden 401 en JSON en lugar de redirigir.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;
  const esRutaAuth = pathname === "/login" || pathname.startsWith("/auth/");
  const esApi = pathname.startsWith("/api/");

  // Sesión válida en Supabase pero de otro dominio (otra app del proyecto Manufactura): se cierra y se avisa.
  if (user && !esCorreoPermitido(user.email)) {
    await supabase.auth.signOut();
    if (esApi) return NextResponse.json({ error: "Solo cuentas @firplak.com." }, { status: 403 });
    const destino = NextResponse.redirect(new URL("/login?error=dominio", request.url));
    response.cookies.getAll().forEach((cookie) => destino.cookies.set(cookie));
    return destino;
  }

  if (!user && !esRutaAuth) {
    if (esApi) return NextResponse.json({ error: "La sesión expiró." }, { status: 401 });
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") return NextResponse.redirect(new URL("/", request.url));

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|brand/).*)"],
};
