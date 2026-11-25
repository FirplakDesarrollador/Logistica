"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { COOKIE_SIGUIENTE } from "@/lib/auth/dominio";
import { createClient } from "@/lib/supabase/client";

// Inicio de sesión con Microsoft 365 (Supabase Auth, proveedor Azure). Mismo patrón que IndicadoresFirplak.
// El dominio @firplak.com se valida al volver (auth/callback), en el proxy y en el RLS del schema.
export default function MicrosoftLogin({ next, errorInicial }: { next: string; errorInicial: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(errorInicial);

  const ingresar = async () => {
    setCargando(true);
    setError("");
    // La URL de retorno va sin parámetros: Supabase la compara exacta contra su lista de Redirect URLs
    // y, si no coincide, manda al Site URL del proyecto (que es de otra app de Manufactura).
    // La página a la que volver viaja en una cookie corta que lee /auth/callback.
    document.cookie = `${COOKIE_SIGUIENTE}=${encodeURIComponent(next)}; Path=/; Max-Age=600; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { data, error: errorAuth } = await createClient().auth.signInWithOAuth({
      provider: "azure",
      options: { redirectTo, scopes: "email", queryParams: { prompt: "select_account" } },
    });
    if (errorAuth) {
      setCargando(false);
      setError("No pudimos conectar con Microsoft. Intenta de nuevo en unos segundos.");
      return;
    }
    if (data.url) window.location.assign(data.url);
  };

  return (
    <>
      <button className="microsoft-button" type="button" onClick={ingresar} disabled={cargando}>
        <span className="microsoft-logo" aria-hidden="true"><i /><i /><i /><i /></span>
        <span>{cargando ? "Conectando con Microsoft…" : "Continuar con Microsoft 365"}</span>
        {cargando ? <LoaderCircle size={17} className="billing-spin" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
      </button>
      {error && <div className="login-error" role="alert">{error}</div>}
      <div className="login-security"><ShieldCheck size={17} aria-hidden="true" /><span>Autenticación administrada por Microsoft Entra ID.<br />Solo cuentas corporativas @firplak.com.</span></div>
    </>
  );
}
