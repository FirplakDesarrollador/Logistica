import type { ReactNode } from "react";
import { ArchiveRestore, BookOpenText, ClipboardPen, House, LayoutDashboard, ListChecks, ShieldAlert, StickyNote } from "lucide-react";
import AppShell, { type NavGroup } from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth/session";
import { RUTA } from "@/lib/razones-incumplimiento-lib/types";

import { TITULO_MODULO } from "@/lib/razones-incumplimiento-lib/types";

const navegacion: NavGroup[] = [
  { label: "Logística", items: [{ href: "/", label: "Inicio", icon: <House size={17} aria-hidden="true" /> }] },
  {
    label: "Liberación de órdenes",
    items: [
      { href: RUTA, label: "Resumen", icon: <LayoutDashboard size={17} aria-hidden="true" /> },
      { href: `${RUTA}/registrar`, label: "Registrar orden", icon: <ClipboardPen size={17} aria-hidden="true" /> },
      { href: `${RUTA}/ordenes`, label: "Órdenes", icon: <ListChecks size={17} aria-hidden="true" /> },
      { href: `${RUTA}/calidad`, label: "Calidad del registro", icon: <ShieldAlert size={17} aria-hidden="true" /> },
      { href: `${RUTA}/catalogo`, label: "Catálogo de razones", icon: <BookOpenText size={17} aria-hidden="true" /> },
      { href: `${RUTA}/notas`, label: "Notas de revisión", icon: <StickyNote size={17} aria-hidden="true" /> },
      { href: `${RUTA}/eliminadas`, label: "Órdenes eliminadas", icon: <ArchiveRestore size={17} aria-hidden="true" /> },
    ],
  },
];

// Layout del módulo: el shell (menú lateral y migas) envuelve todas las vistas, incluido el estado de carga.
export default async function ModuloLayout({ children }: { children: ReactNode }) {
  const usuario = await getSessionUser();
  return (
    <AppShell navigation={navegacion} title={TITULO_MODULO} user={{ name: usuario?.name ?? "Usuario Firplak", email: usuario?.email ?? "" }}>
      <div className="modulo-pagina">{children}</div>
    </AppShell>
  );
}
