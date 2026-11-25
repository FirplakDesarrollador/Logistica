import Image from "next/image";
import Link from "next/link";
import { FileSpreadsheet, LayoutGrid, LogOut, Route, ShieldCheck, Truck } from "lucide-react";
import BrandPeak from "@/components/BrandPeak";
import { logout } from "@/app/actions";
import { getSessionUser } from "@/lib/auth/session";
import { estadoLabel, modulos } from "@/lib/modulos";

const pasos = [
  { titulo: "Recibir el Excel", detalle: "Se toma el archivo tal como lo usa el equipo hoy, sin cambiarlo." },
  { titulo: "Entender la información", detalle: "Se identifican hojas, columnas, cálculos y quién usa cada dato." },
  { titulo: "Validar con el área", detalle: "El responsable confirma las reglas antes de construir." },
  { titulo: "Construir el módulo", detalle: "Un formulario para registrar y vistas para consultar todo el volumen con filtros." },
  { titulo: "Conciliar cifras", detalle: "Los totales de la plataforma cuadran con el Excel." },
  { titulo: "Retirar el Excel", detalle: "El equipo trabaja en la plataforma; el archivo queda de respaldo." },
];

function initialsFrom(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : (words[0] ?? "").slice(0, 2)).toUpperCase() || "FP";
}

export default async function PortalPage() {
  const user = await getSessionUser();
  const name = user?.name ?? "Usuario Firplak";

  return (
    <div className="portal-shell">
      <header className="portal-header">
        <div className="portal-brand">
          <div className="portal-brand-lockup"><Image className="brand-logo" src="/brand/firplak-wordmark-positivo.png" alt="Firplak" width={536} height={82} priority /></div>
          <span className="portal-brand-subtitle">Logística</span>
        </div>
        <div className="portal-welcome"><span>Hola,</span><strong>{name}</strong><small>{user?.email}</small></div>
        <span className="portal-avatar" aria-hidden="true">{initialsFrom(name)}</span>
        <form action={logout}><button className="portal-logout" type="submit"><LogOut size={15} /> Cerrar sesión</button></form>
      </header>

      <main className="portal-content">
        <section className="portal-intro">
          <BrandPeak className="brand-peak portal-peak" />
          <div>
            <span className="portal-eyebrow"><Truck size={14} /> LOGÍSTICA FIRPLAK</span>
            <h1>Toda tu información, fácil de encontrar.</h1>
            <p>Registra y consulta en segundos lo que hoy se acumula, fila por fila, en Excel llenados a mano.</p>
          </div>
        </section>

        <section>
          <div className="portal-section-heading">
            <span className="portal-section-kicker"><LayoutGrid size={14} /> MÓDULOS</span>
            <h2>Información disponible</h2>
          </div>
          {modulos.length === 0 ? (
            <div className="portal-empty">
              <BrandPeak className="brand-peak" />
              <FileSpreadsheet size={28} aria-hidden="true" />
              <h3>Aún no hay módulos publicados</h3>
              <p>El primer módulo aparecerá aquí cuando se migre el primer Excel de Logística.</p>
            </div>
          ) : (
            <div className="access-grid">
              {modulos.map(({ slug, titulo, descripcion, estado, href, icon: Icon }) => (
                <Link key={slug} className="access-card" href={href}>
                  <span className="access-icon"><Icon /></span>
                  <span className="access-card-copy">
                    <span className="access-type">MÓDULO</span>
                    <h2>{titulo}</h2>
                    <p>{descripcion}</p>
                    <span className={`access-status ${estado}`}>{estadoLabel[estado]}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="portal-section-heading">
            <span className="portal-section-kicker"><Route size={14} /> CÓMO MIGRAMOS</span>
            <h2>De cada Excel a un módulo, en seis pasos</h2>
          </div>
          <ol className="roadmap">
            {pasos.map((paso) => <li key={paso.titulo}><strong>{paso.titulo}</strong><span>{paso.detalle}</span></li>)}
          </ol>
        </section>

        <footer className="portal-footer">
          <span><ShieldCheck size={14} /> Versión de demostración · Datos tomados de los Excel del área</span>
          <span>Firplak Colombia</span>
        </footer>
      </main>
    </div>
  );
}
