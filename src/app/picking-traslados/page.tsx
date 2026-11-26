import Link from "next/link";
import { Construction, House } from "lucide-react";
import BrandPeak from "@/components/BrandPeak";

export const metadata = { title: "Picking y Traslados | Logística Firplak" };

export default function PickingPage() {
  return (
    <>
      <header className="billing-heading-row">
        <div>
          <span className="billing-eyebrow">LOGÍSTICA <span>·</span> PICKING Y TRASLADOS</span>
          <h1>Picking y Traslados</h1>
        </div>
      </header>

      <section className="billing-panel modulo-en-desarrollo" aria-labelledby="titulo-en-desarrollo">
        <BrandPeak className="brand-peak" />
        <Construction size={32} aria-hidden="true" />
        <span className="access-status en-desarrollo">En desarrollo</span>
        <h2 id="titulo-en-desarrollo">Este módulo está en desarrollo</h2>
        <p>Estamos preparando Picking y Traslados. Cuando esté listo, podrás registrar y consultar su información desde aquí.</p>
        <Link className="billing-secondary-button" href="/"><House size={16} aria-hidden="true" /> Volver al inicio</Link>
      </section>
    </>
  );
}
