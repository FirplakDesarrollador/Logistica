"use client";

import { Fragment, type ReactNode, useEffect, useState } from "react";
import { ChevronRight, Home, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import BrandPeak from "@/components/BrandPeak";
import { logout } from "@/app/actions";

// `icon` es un elemento ya creado (p. ej. <House size={17} aria-hidden="true" />): un layout de servidor
// puede pasarlo a este componente cliente; una referencia a la función del icono no se puede serializar.
export type NavItem = { href: string; label: string; icon: ReactNode };
export type NavGroup = { label: string; items: NavItem[] };

function initialsFrom(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : (words[0] ?? "").slice(0, 2)).toUpperCase() || "FP";
}

// Estructura común de los módulos: barra lateral navy, barra superior con migas y contenido.
// Mismo patrón y clases que DashboardShell de IndicadoresFirplak (estilos en app/styles/shell.css).
export default function AppShell({ navigation, activeHref, title, user, children }: {
  navigation: NavGroup[];
  /** Si no se indica, se toma la ruta actual (útil cuando el shell vive en un layout). */
  activeHref?: string;
  title: string;
  user: { name: string; email: string };
  children: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const currentHref = activeHref ?? pathname;

  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setIsSidebarOpen(false); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  return <main className="billing-shell">
    <div className={`billing-sidebar-backdrop ${isSidebarOpen ? "visible" : ""}`} onClick={() => setIsSidebarOpen(false)} />
    <aside className={`billing-sidebar ${isSidebarOpen ? "open" : ""}`}>
      <BrandPeak className="brand-peak billing-sidebar-peak" />
      <div className="billing-brand-row"><Image className="brand-logo" src="/brand/firplak-wordmark-negativo.png" alt="Firplak" width={536} height={82} priority /><button className="billing-close-menu" onClick={() => setIsSidebarOpen(false)} aria-label="Cerrar menú"><X size={18} /></button></div>
      <nav className="billing-nav" aria-label="Navegación de Logística">{navigation.map((group, groupIndex) => <Fragment key={group.label}><span className={`billing-nav-label ${groupIndex > 0 ? "billing-nav-label-spaced" : ""}`}>{group.label}</span>{group.items.map(({ href, label, icon }) => <Link key={href} className={`billing-nav-item ${href === currentHref ? "active" : ""}`} href={href} aria-current={href === currentHref ? "page" : undefined} onClick={() => setIsSidebarOpen(false)}>{icon} {label}</Link>)}</Fragment>)}</nav>
      <div className="billing-sidebar-bottom"><div className="billing-profile"><div className="user-menu user-menu-sidebar"><div className="user-menu-identity"><span className="billing-avatar" aria-hidden="true">{initialsFrom(user.name)}</span><span className="user-menu-text"><strong title={user.name}>{user.name}</strong><span title={user.email}>{user.email}</span></span></div></div><form action={logout}><button className="billing-signout" type="submit" aria-label="Cerrar sesión"><LogOut size={15} /></button></form></div></div>
    </aside>

    <section className="billing-main"><header className="billing-topbar"><div className="billing-breadcrumbs"><button className="billing-mobile-menu" onClick={() => setIsSidebarOpen(true)} aria-label="Abrir menú"><Menu size={19} /></button><Home size={14} /><ChevronRight size={14} /><Link className="billing-breadcrumb-link" href="/">Logística</Link><ChevronRight size={14} /><strong>{title}</strong></div></header>
      <div className="billing-content">{children}</div></section>
  </main>;
}
