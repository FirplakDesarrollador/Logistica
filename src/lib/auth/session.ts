import "server-only";
import { usuarioDesde, type UsuarioSesion } from "@/lib/auth/dominio";
import { createClient } from "@/lib/supabase/server";

/** Usuario de la sesión de Supabase (Microsoft 365), o null si no hay sesión o el correo no es @firplak.com. */
export async function getSessionUser(): Promise<UsuarioSesion | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return usuarioDesde(data.user);
}
