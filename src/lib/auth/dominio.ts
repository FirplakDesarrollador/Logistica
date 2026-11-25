// Solo cuentas corporativas. La misma regla está en la base de datos (logistica.es_firplak()),
// así que aunque alguien saltara esta validación, el RLS no le entregaría datos.
export const DOMINIO_PERMITIDO = "firplak.com";

/** Cookie corta con la ruta a la que volver después de Microsoft (la URL de retorno va sin parámetros). */
export const COOKIE_SIGUIENTE = "logistica_siguiente";

export function esCorreoPermitido(email: string | null | undefined): boolean {
  return Boolean(email) && email!.trim().toLowerCase().endsWith(`@${DOMINIO_PERMITIDO}`);
}

export type UsuarioSesion = { email: string; name: string };

export function usuarioDesde(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null): UsuarioSesion | null {
  if (!user || !esCorreoPermitido(user.email)) return null;
  const email = user.email!.trim().toLowerCase();
  const meta = user.user_metadata ?? {};
  const name = (typeof meta.full_name === "string" && meta.full_name) || (typeof meta.name === "string" && meta.name) || email.split("@")[0];
  return { email, name };
}
