import Link from "next/link";
import { ClipboardPen } from "lucide-react";
import EstadoVacio from "@/components/datos/EstadoVacio";
import FiltrosBorrador, { type CampoFiltro } from "@/components/datos/FiltrosBorrador";
import Paginacion from "@/components/datos/Paginacion";
import { construirQuery, paginar, parametro, type ParametrosUrl } from "@/lib/consulta";
import { formatNumber } from "@/lib/format";
import { cargarCatalogo, cargarOrdenes, filtrarOrdenes } from "@/lib/razones-incumplimiento-lib/datos";
import { filtrosAplicados, leerFiltros } from "@/lib/razones-incumplimiento-lib/filtros";
import { ANOMALIA_LABEL, ANOMALIAS, GRUPOS, ORIGEN_LABEL, RUTA, TITULO_MODULO } from "@/lib/razones-incumplimiento-lib/types";
import TablaOrdenes from "@/components/razones-incumplimiento-lib/TablaOrdenes";

export const metadata = { title: `Órdenes · ${TITULO_MODULO} | Logística Firplak` };

export default async function OrdenesPage({ searchParams }: { searchParams: Promise<ParametrosUrl> }) {
  const params = await searchParams;
  const filtros = leerFiltros(params);
  const [{ ordenes }, catalogo] = await Promise.all([cargarOrdenes(), cargarCatalogo()]);
  const filtradas = filtrarOrdenes(ordenes, filtros);
  const pagina = paginar(filtradas, Number(parametro(params, "pagina") || 1), 50);

  const aplicados = filtrosAplicados(filtros);

  const conteoPorRazon = new Map<string, number>();
  for (const o of ordenes) conteoPorRazon.set(o.razonNormalizada, (conteoPorRazon.get(o.razonNormalizada) ?? 0) + 1);

  // Mensaje de vacío específico: distingue una razón que nadie ha usado de una combinación de filtros sin resultados.
  const usosRazon = filtros.razon ? conteoPorRazon.get(filtros.razon) ?? 0 : 0;
  const otrosFiltros = Object.entries(aplicados).some(([nombre, valor]) => nombre !== "razon" && valor);
  const vacio = filtros.razon && usosRazon === 0
    ? { titulo: `Ninguna orden tiene la razón «${filtros.razon}»`, texto: catalogo.razones.includes(filtros.razon) ? "La razón está en el catálogo, pero todavía no se ha usado en ninguna orden. Elige otra razón o quita el filtro." : "Esa razón no está en el catálogo. Elige una razón de la lista." }
    : filtros.razon && otrosFiltros
      ? { titulo: "No hay órdenes con estos filtros", texto: `La razón «${filtros.razon}» tiene ${formatNumber(usosRazon)} ${usosRazon === 1 ? "orden" : "órdenes"}, pero ninguna cumple los demás filtros. Quita alguno para ver resultados.` }
      : { titulo: "No hay órdenes con estos filtros", texto: "Cambia o quita algún filtro para ver resultados." };
  const hrefPagina = (p: number) => `${RUTA}/ordenes${construirQuery({ ...aplicados, pagina: p > 1 ? p : undefined })}`;

  const campos: CampoFiltro[] = [
    { tipo: "busqueda", nombre: "q", etiqueta: "Buscar por número de orden o comentario", placeholder: "Número de orden o texto del comentario" },
    { tipo: "select", nombre: "razon", etiqueta: "Razón", opciones: catalogo.razones.map((r) => ({ valor: r, etiqueta: `${r} (${formatNumber(conteoPorRazon.get(r) ?? 0)})` })) },
    { tipo: "select", nombre: "grupo", etiqueta: "Área responsable", opciones: GRUPOS.map((g) => ({ valor: g, etiqueta: g })) },
    { tipo: "select", nombre: "fecha", etiqueta: "Fecha programada", todas: "Con y sin fecha", opciones: [{ valor: "con", etiqueta: "Con fecha" }, { valor: "sin", etiqueta: "Sin fecha" }] },
    { tipo: "fecha", nombre: "desde", etiqueta: "Programada desde", deshabilitadoSi: { campo: "fecha", valor: "sin" } },
    { tipo: "fecha", nombre: "hasta", etiqueta: "Programada hasta", deshabilitadoSi: { campo: "fecha", valor: "sin" } },
    { tipo: "select", nombre: "cambio", etiqueta: "Cambio de fecha de la OP", todas: "Todos", opciones: [{ valor: "si", etiqueta: "Con cambio de fecha" }, { valor: "no", etiqueta: "Sin cambio de fecha" }] },
    { tipo: "select", nombre: "comentario", etiqueta: "Comentario", todas: "Todos", opciones: [{ valor: "con", etiqueta: "Con comentario" }, { valor: "sin", etiqueta: "Sin comentario" }] },
    { tipo: "select", nombre: "origen", etiqueta: "Origen", todas: "Todos", opciones: (["historico", "nuevo", "editado"] as const).map((o) => ({ valor: o, etiqueta: ORIGEN_LABEL[o] })) },
    { tipo: "select", nombre: "anomalia", etiqueta: "Calidad del registro", opciones: [{ valor: "con", etiqueta: "Con alguna marca" }, ...ANOMALIAS.map((a) => ({ valor: a, etiqueta: ANOMALIA_LABEL[a] }))] },
  ];

  return (
    <>
      <header className="billing-heading-row">
        <div>
          <span className="billing-eyebrow">LIBERACIÓN DE ÓRDENES <span>·</span> ÓRDENES</span>
          <h1>Órdenes</h1>
          <p>Todo el histórico del Excel más lo registrado en la plataforma. Lo más reciente aparece primero. Selecciona un número de orden para editarla.</p>
        </div>
        <div className="billing-heading-actions">
          <Link className="billing-primary-button" href={`${RUTA}/registrar`}><ClipboardPen size={16} aria-hidden="true" /> Registrar orden</Link>
        </div>
      </header>

      <FiltrosBorrador key={JSON.stringify(aplicados)} campos={campos} valores={aplicados} />

      <section className="billing-panel modulo-tabla-panel" aria-labelledby="titulo-tabla-ordenes">
        <div className="billing-table-heading">
          <div>
            <h2 id="titulo-tabla-ordenes">{formatNumber(filtradas.length)} de {formatNumber(ordenes.length)} órdenes</h2>
            <p>{filtradas.length === ordenes.length ? "Sin filtros aplicados." : "Resultado de los filtros aplicados."}</p>
          </div>
        </div>
        {pagina.total === 0 ? (
          <EstadoVacio titulo={vacio.titulo} texto={vacio.texto} accion={<Link className="billing-secondary-button" href={`${RUTA}/ordenes`}>Limpiar filtros</Link>} />
        ) : (
          <>
            <TablaOrdenes ordenes={pagina.filas} />
            <Paginacion pagina={pagina.pagina} paginas={pagina.paginas} total={pagina.total} tamano={pagina.tamano} hrefAnterior={hrefPagina(pagina.pagina - 1)} hrefSiguiente={hrefPagina(pagina.pagina + 1)} unidad="órdenes" />
          </>
        )}
      </section>
    </>
  );
}
