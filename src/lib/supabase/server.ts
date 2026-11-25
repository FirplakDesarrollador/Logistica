import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Proyecto Supabase "Manufactura" (Firplak SA). Todo lo de la app vive en el schema `logistica`.
// Las consultas usan la sesión del usuario: el RLS del schema exige correo @firplak.com.
// Ver supabase/migrations/ y llm-wiki/decisiones/ADR-002-supabase-manufactura.md.
export const SCHEMA = "logistica";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    db: { schema: SCHEMA },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Los Server Components no siempre pueden escribir cookies; el proxy las refresca.
        }
      },
    },
  });
}
