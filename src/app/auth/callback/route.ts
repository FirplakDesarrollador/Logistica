import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_SIGUIENTE, esCorreoPermitido } from "@/lib/auth/dominio";
import { createClient } from "@/lib/supabase/server";

function rutaSegura(valor: string | undefined) {
  const ruta = valor ? decodeURIComponent(valor) : "";
  return ruta.startsWith("/") && !ruta.startsWith("//") ? ruta : "/";
}

// Regreso de Microsoft 365: canjea el código por la sesión y rechaza correos que no sean @firplak.com.
// La URL registrada en Supabase es exactamente /auth/callback (sin parámetros); la ruta de destino llega en una cookie.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const cookieStore = await cookies();
  const siguiente = rutaSegura(cookieStore.get(COOKIE_SIGUIENTE)?.value);
  cookieStore.delete(COOKIE_SIGUIENTE);

  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", request.url));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("No se pudo completar el inicio de sesión", error.code, error.message);
    return NextResponse.redirect(new URL("/login?error=auth_callback", request.url));
  }

  if (!esCorreoPermitido(data.user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=dominio", request.url));
  }

  return NextResponse.redirect(new URL(siguiente, request.url));
}
