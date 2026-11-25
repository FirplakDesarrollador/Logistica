import Link from "next/link";
import { CalendarX2, Space, Tags, TextCursorInput } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import EstadoVacio from "@/components/datos/EstadoVacio";
import Paginacion from "@/components/datos/Paginacion";
import { construirQuery, paginar, parametro, type ParametrosUrl } from "@/lib/consulta";
import { formatNumber } from "@/lib/format";
import { cargarOrdenes, filtrarOrdenes, resumir, variantesFueraDeCatalogo } from "@/lib/razones-incumplimiento-lib/datos";
import { leerFiltros } from "@/lib/razones-incumplimiento-lib/filtros";
import { ANOMALIA_LABEL, ANOMALIAS, RUTA, TITULO_MODULO, type Anomalia } from "@/lib/razones-incumplimiento-lib/types";
import { CeldaFecha, MarcasCalidad, textoConEspacios } from "@/components/razones-incumplimiento-lib/TablaOrdenes";

export const metadata = { title: `Calidad del registro · ${TITULO_MODULO} | Logística Firplak` };

const ICONOS: Record<Anomalia, typeof Tags> = { "razon-fuera-catalogo": Tags, "fecha-texto": TextCursorInput, "fecha-atipica": CalendarX2, espacios: Space };
const DETALLE: Record<Anomalia, string> = {
  "razon-fuera-catalogo": "Escritas distinto a la lista (tilde, errata)",
  "fecha-texto": "La celda tiene texto, no una fecha",
  "fecha-atipica": "Fuera del periodo del Excel (mar 2024 – 6 nov 2026)",
  espacios: "Espacios al inicio o al final de un texto",
};

export default async function CalidadPage({ searchParams }: { searchParams: Promise<ParametrosUrl> }) {
  const params = await searchParams;
  const tipo = leerFiltros(params).anomalia;
  const activa: "con" | Anomalia = tipo === "todas" ? "con" : tipo;
  const { ordenes } = await cargarOrdenes();
  const r = resumir(ordenes);
  const variantes = variantesFueraDeCatalogo(ordenes);
  const marcadas = filtrarOrdenes(ordenes, { q: "", razon: "", grupo: "", fecha: "todas", desde: "", hasta: "", cambio: "todos", comentario: "todos", origen: "todos", anomalia: activa });
  const pagina = paginar(marcadas, Number(parametro(params, "pagina") || 1), 50);
  const href = (anomalia: string, p?: number) => `${RUTA}/calidad${construirQuery({ anomalia: anomalia === "con" ? undefined : anomalia, pagina: p && p > 1 ? p : undefined })}`;

  return (
    <>
      <header className="billing-heading-row">
        <div>
          <span className="billing-eyebrow">LIBERACIÓN DE ÓRDENES <span>·</span> CALIDAD DEL REGISTRO</span>
          <h1>Calidad del registro</h1>
          <p>Filas del Excel con datos escritos de forma irregular. Se muestran tal cual, con su valor original: no se corrigieron ni se ocultaron. Los registros nuevos ya no pueden tener estas marcas porque el formulario las impide.</p>
        </div>
      </header>

      <section className="billing-metrics-grid modulo-metricas-4" aria-label="Filas marcadas por tipo">
        {ANOMALIAS.map((a) => <MetricCard key={a} icon={ICONOS[a]} label={ANOMALIA_LABEL[a]} value={formatNumber(r.anomalias[a])} detail={DETALLE[a]} />)}
      </section>

      {variantes.length > 0 && (
        <section className="billing-panel">
          <div className="billing-panel-heading"><div><span className="billing-panel-kicker">RAZONES FUERA DEL CATÁLOGO</span><h2>Cómo se agrupa cada variante</h2></div></div>
          <div className="billing-table-scroll">
            <table className="billing-data-table modulo-tabla-simple">
              <thead><tr><th scope="col">Escrita en el Excel</th><th scope="col">Se agrupa como</th><th scope="col" className="align-right">Filas</th></tr></thead>
              <tbody>{variantes.map((v) => <tr key={v.original}><td><span className="modulo-original">“{textoConEspacios(v.original)}”</span></td><td>{v.normalizada}</td><td className="align-right">{formatNumber(v.filas)}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      )}

      <section className="billing-panel modulo-tabla-panel" aria-labelledby="titulo-marcadas">
        <div className="billing-table-heading">
          <div>
            <h2 id="titulo-marcadas">{formatNumber(marcadas.length)} filas {activa === "con" ? "con alguna marca" : `con «${ANOMALIA_LABEL[activa].toLowerCase()}»`}</h2>
            <p>{formatNumber(r.filasConAnomalia)} de {formatNumber(r.total)} órdenes tienen al menos una marca. Selecciona un número para corregir la orden en el formulario.</p>
          </div>
        </div>
        <nav className="billing-tabs" aria-label="Tipo de marca">
          {(["con", ...ANOMALIAS] as const).map((a) => (
            <Link key={a} href={href(a)} className={`modulo-tab${a === activa ? " active" : ""}`} aria-current={a === activa ? "page" : undefined} scroll={false}>
              {a === "con" ? "Todas" : ANOMALIA_LABEL[a]} <span>{formatNumber(a === "con" ? r.filasConAnomalia : r.anomalias[a])}</span>
            </Link>
          ))}
        </nav>
        {pagina.total === 0 ? (
          <EstadoVacio titulo="No hay filas con esta marca" texto="Elige otro tipo de marca para revisar." />
        ) : (
          <>
            <div className="billing-table-scroll" tabIndex={0} role="region" aria-label="Filas marcadas, desplazable horizontalmente">
              <table className="billing-data-table modulo-tabla">
                <thead><tr><th scope="col">No. orden</th><th scope="col">Marcas</th><th scope="col">Razón (original)</th><th scope="col">Fecha (original)</th><th scope="col">Comentario (original)</th></tr></thead>
                <tbody>
                  {pagina.filas.map((o) => (
                    <tr key={o.noOrden}>
                      <td><Link className="modulo-orden-link" href={`${RUTA}/registrar?orden=${o.noOrden}`} aria-label={`Corregir orden ${o.noOrden}`}>{o.noOrden}</Link><small>Fila {o.filaExcel} del Excel</small></td>
                      <td><MarcasCalidad orden={o} /></td>
                      <td className="modulo-celda-razon"><span className="modulo-original">“{textoConEspacios(o.originales["OBSERVACIONES PLANEACIÓN"] ?? o.razon)}”</span>{o.razon !== o.razonNormalizada ? <small>Se agrupa como {o.razonNormalizada}</small> : null}</td>
                      <td>{o.originales.FECHA ? <span className="modulo-original">“{textoConEspacios(o.originales.FECHA)}”</span> : <CeldaFecha orden={o} />}</td>
                      <td className="modulo-celda-comentario">{o.originales.COMENTARIOS ? <span className="modulo-original">“{textoConEspacios(o.originales.COMENTARIOS)}”</span> : o.comentario ?? <span className="modulo-sin-marca">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacion pagina={pagina.pagina} paginas={pagina.paginas} total={pagina.total} tamano={pagina.tamano} hrefAnterior={href(activa, pagina.pagina - 1)} hrefSiguiente={href(activa, pagina.pagina + 1)} unidad="filas" />
          </>
        )}
      </section>
    </>
  );
}
