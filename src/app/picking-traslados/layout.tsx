import type { ReactNode } from "react";
import { ArrowRightLeft, House } from "lucide-react";
import AppShell, { type NavGroup } from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth/session";

export const RUTA_PICKING = "/picking-traslados";
export const TITULO_PICKING = "Picking y Traslados";

const navegacion: NavGroup[] = [
  { label: "Logística", items: [{ href: "/", label: "Inicio", icon: <House size={17} aria-hidden="true" /> }] },
  { label: TITULO_PICKING, items: [{ href: RUTA_PICKING, label: "Picking y traslados", icon: <ArrowRightLeft size={17} aria-hidden="true" /> }] },
];

// Módulo en desarrollo: mismo shell que los demás módulos; las vistas se agregan cuando se migre su Excel.
export default async function PickingLayout({ children }: { children: ReactNode }) {
  const usuario = await getSessionUser();
  return (
    <AppShell navigation={navegacion} title={TITULO_PICKING} user={{ name: usuario?.name ?? "Usuario Firplak", email: usuario?.email ?? "" }}>
      <div className="modulo-pagina">{children}</div>
    </AppShell>
  );
}
