import { createBrowserClient } from "@supabase/ssr";

// Cliente del navegador: solo para iniciar sesión con Microsoft. Los datos se leen en el servidor.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
