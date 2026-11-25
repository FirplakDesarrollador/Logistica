"use client";

import { type FormEvent, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";

// Barra de filtros genérica para listas paginadas en el servidor (manual 7.4 y skill crear-modulo, paso 4):
// los cambios quedan en borrador hasta "Aplicar filtros" o Enter; "Limpiar" restablece todo; los filtros
// aplicados se muestran como chips eliminables. Los valores viajan en la URL (searchParams), así el servidor
// filtra y pagina y el navegador solo recibe la página visible.

export type OpcionFiltro = { valor: string; etiqueta: string };
export type CampoFiltro =
  | { tipo: "busqueda"; nombre: string; etiqueta: string; placeholder?: string }
  | { tipo: "select"; nombre: string; etiqueta: string; opciones: OpcionFiltro[]; todas?: string; deshabilitadoSi?: { campo: string; valor: string } }
  | { tipo: "fecha"; nombre: string; etiqueta: string; deshabilitadoSi?: { campo: string; valor: string } };

export default function FiltrosBorrador({ campos, valores, titulo = "Filtros", parametrosFijos = {} }: {
  campos: CampoFiltro[];
  /** Valores aplicados (los que vienen en la URL). */
  valores: Record<string, string>;
  titulo?: string;
  /** Parámetros que se conservan siempre (p. ej. una pestaña). */
  parametrosFijos?: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [borrador, setBorrador] = useState<Record<string, string>>(() => Object.fromEntries(campos.map((c) => [c.nombre, valores[c.nombre] ?? ""])));
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();

  const busqueda = campos.find((c) => c.tipo === "busqueda");
  const avanzados = campos.filter((c) => c.tipo !== "busqueda");
  const deshabilitado = (campo: CampoFiltro, estado: Record<string, string>) => "deshabilitadoSi" in campo && campo.deshabilitadoSi ? estado[campo.deshabilitadoSi.campo] === campo.deshabilitadoSi.valor : false;

  const navegar = (estado: Record<string, string>) => {
    const query = new URLSearchParams(parametrosFijos);
    for (const campo of campos) {
      const valor = estado[campo.nombre]?.trim();
      if (valor && !deshabilitado(campo, estado)) query.set(campo.nombre, valor);
    }
    const texto = query.toString();
    startTransition(() => router.push(texto ? `${pathname}?${texto}` : pathname, { scroll: false }));
  };

  const aplicar = (evento: FormEvent) => { evento.preventDefault(); navegar(borrador); };
  const limpiar = () => { const vacio = Object.fromEntries(campos.map((c) => [c.nombre, ""])); setBorrador(vacio); navegar(vacio); };
  const quitar = (nombre: string) => { const estado = { ...valores, [nombre]: "" }; setBorrador((actual) => ({ ...actual, [nombre]: "" })); navegar(estado); };

  const etiquetaValor = (campo: CampoFiltro, valor: string) => campo.tipo === "select" ? campo.opciones.find((o) => o.valor === valor)?.etiqueta ?? valor : campo.tipo === "fecha" ? valor.split("-").reverse().join("/") : `“${valor}”`;
  const aplicados = campos.filter((c) => valores[c.nombre]);
  const cambiosSinAplicar = campos.some((c) => (borrador[c.nombre] ?? "") !== (valores[c.nombre] ?? ""));

  return (
    <form className="billing-filterbar datos-filtros" onSubmit={aplicar} role="search" aria-label={titulo}>
      <div className="datos-filtros-fila">
        {busqueda && (
          <label className="billing-search datos-filtros-busqueda">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">{busqueda.etiqueta}</span>
            <input type="search" name={busqueda.nombre} value={borrador[busqueda.nombre] ?? ""} placeholder={busqueda.tipo === "busqueda" ? busqueda.placeholder : undefined} onChange={(e) => setBorrador({ ...borrador, [busqueda.nombre]: e.target.value })} />
          </label>
        )}
        <div className="datos-filtros-acciones">
          <button type="button" className="billing-secondary-button datos-filtros-toggle" aria-expanded={abierto} aria-controls="datos-filtros-avanzados" onClick={() => setAbierto(!abierto)}>
            <SlidersHorizontal size={16} aria-hidden="true" /> {titulo}{aplicados.length ? ` (${aplicados.length})` : ""}
          </button>
          <button type="button" className="billing-reset-button" onClick={limpiar} disabled={pendiente}>Limpiar</button>
          <button type="submit" className="billing-primary-button" disabled={pendiente}>
            {pendiente ? <LoaderCircle size={16} className="billing-spin" aria-hidden="true" /> : null}
            {pendiente ? "Aplicando…" : "Aplicar filtros"}
          </button>
        </div>
      </div>

      <div id="datos-filtros-avanzados" className="billing-advanced-filters datos-filtros-avanzados" data-abierto={abierto}>
        {avanzados.map((campo) => {
          const off = deshabilitado(campo, borrador);
          return (
            <label key={campo.nombre} className="billing-advanced-filter">
              <span>{campo.etiqueta}</span>
              {campo.tipo === "select" ? (
                <select name={campo.nombre} value={borrador[campo.nombre] ?? ""} disabled={off} onChange={(e) => setBorrador({ ...borrador, [campo.nombre]: e.target.value })}>
                  <option value="">{campo.todas ?? "Todas"}</option>
                  {campo.opciones.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                </select>
              ) : (
                <input type="date" name={campo.nombre} value={borrador[campo.nombre] ?? ""} disabled={off} onChange={(e) => setBorrador({ ...borrador, [campo.nombre]: e.target.value })} />
              )}
            </label>
          );
        })}
      </div>

      {(aplicados.length > 0 || cambiosSinAplicar) && (
        <div className="datos-filtros-chips" aria-live="polite">
          {aplicados.map((campo) => (
            <button key={campo.nombre} type="button" className="datos-chip" onClick={() => quitar(campo.nombre)} aria-label={`Quitar filtro ${campo.etiqueta}: ${etiquetaValor(campo, valores[campo.nombre])}`}>
              <span>{campo.etiqueta}: <strong>{etiquetaValor(campo, valores[campo.nombre])}</strong></span>
              <X size={14} aria-hidden="true" />
            </button>
          ))}
          {cambiosSinAplicar && <small className="datos-filtros-aviso">Tienes cambios sin aplicar.</small>}
        </div>
      )}
    </form>
  );
}
