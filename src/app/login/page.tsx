import Image from "next/image";
import { CheckCircle2, Truck } from "lucide-react";
import BrandPeak from "@/components/BrandPeak";
import MicrosoftLogin from "@/app/login/MicrosoftLogin";

const mensajesError: Record<string, string> = {
  dominio: "Solo pueden ingresar cuentas corporativas @firplak.com. Inicia sesión con tu correo de Firplak.",
  missing_code: "No se recibió el código de autenticación. Intenta nuevamente.",
  auth_callback: "No fue posible completar el inicio de sesión. Intenta nuevamente.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/", error } = await searchParams;
  const mensajeError = error ? mensajesError[error] ?? "Ocurrió un error al iniciar sesión. Intenta nuevamente." : "";

  return (
    <main className="login-shell">
      <section className="login-brand-panel">
        <BrandPeak className="brand-peak login-peak" />
        <div className="login-brand-lockup"><Image className="brand-logo" src="/brand/firplak-eslogan-negativo.png" alt="Firplak, inspirando hogares" width={536} height={142} priority /></div>
        <div className="login-brand-content">
          <div className="login-kicker"><Truck size={15} /> LOGÍSTICA FIRPLAK</div>
          <h1>Del Excel con miles de filas<br /><em>a la información al instante.</em></h1>
          <p>Los archivos que hoy se llenan a mano, registrados y consultados en una sola plataforma, sin importar cuánta información acumulen.</p>
          <div className="login-points"><span><CheckCircle2 size={15} /> Busca y filtra en segundos, aunque haya miles de registros</span><span><CheckCircle2 size={15} /> Una sola versión de la información</span></div>
        </div>
        <div className="login-brand-footer">Firplak Colombia <span>·</span> Plataforma interna</div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="login-mobile-mark"><Image className="brand-logo" src="/brand/firplak-eslogan-positivo.png" alt="Firplak, inspirando hogares" width={536} height={142} priority /></div>
          <div className="login-form-kicker">BIENVENIDO</div>
          <h2>Ingresa a Logística</h2>
          <p className="login-description">Usa tu cuenta corporativa de Microsoft 365 para registrar y consultar la información de Logística.</p>
          <MicrosoftLogin next={next} errorInicial={mensajeError} />
          <p className="login-terms">Al continuar, aceptas las políticas internas de uso de la plataforma.</p>
        </div>
      </section>
    </main>
  );
}
