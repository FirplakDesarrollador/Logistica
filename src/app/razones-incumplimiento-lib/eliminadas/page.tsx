import Link from "next/link";
import EstadoVacio from "@/components/datos/EstadoVacio";
import RestaurarOrden from "@/components/razones-incumplimiento-lib/RestaurarOrden";
import { CeldaFecha } from "@/components/razones-incumplimiento-lib/TablaOrdenes";
import { formatDateTime, formatNumber } from "@/lib/format";
import { cargarOrdenes } from "@/lib/razones-incumplimiento-lib/datos";
import { ORIGEN_LABEL, RUTA, TITULO_MODULO } from "@/lib/razones-incumplimiento-lib/types";

export const metadata = { title: `Órdenes eliminadas · ${TITULO_MODULO} | Logística Firplak` };

export default async function EliminadasPage() {
  const { eliminadas } = await cargarOrdenes();

  return (
    <>
      <header className="billing-heading-row">
        <div>
          <span className="billing-eyebrow">LIBERACIÓN DE ÓRDENES <span>·</span> ELIMINADAS</span>
          <h1>Órdenes eliminadas</h1>
          <p>Órdenes que alguien eliminó desde la plataforma. No aparecen en las órdenes ni en los conteos, pero su información se conserva: puedes restaurarlas con sus mismos datos.</p>
        </div>
      </header>

      <section className="billing-panel modulo-tabla-panel" aria-labelledby="titulo-eliminadas">
        <div className="billing-table-heading">
          <div>
            <h2 id="titulo-eliminadas">{formatNumber(eliminadas.length)} {eliminadas.length === 1 ? "orden eliminada" : "órdenes eliminadas"}</h2>
            <p>La más reciente primero.</p>
          </div>
        </div>
        {eliminadas.length === 0 ? (
          <EstadoVacio titulo="No hay órdenes eliminadas" texto="Cuando alguien elimine una orden desde el formulario, aparecerá aquí con su motivo y quién la eliminó." accion={<Link className="billing-secondary-button" href={`${RUTA}/ordenes`}>Ver órdenes</Link>} />
        ) : (
          <div className="billing-table-scroll" tabIndex={0} role="region" aria-label="Órdenes eliminadas, desplazable horizontalmente">
            <table className="billing-data-table modulo-tabla">
              <thead>
                <tr>
                  <th scope="col">No. orden</th>
                  <th scope="col">Razón</th>
                  <th scope="col">Fecha programada</th>
                  <th scope="col">Origen</th>
                  <th scope="col">Motivo</th>
                  <th scope="col">Eliminada</th>
                  <th scope="col"><span className="sr-only">Acción</span></th>
                </tr>
              </thead>
              <tbody>
                {eliminadas.map((e) => (
                  <tr key={e.noOrden}>
                    <td>
                      <strong className="eliminadas-numero">{e.noOrden}</strong>
                      {e.orden?.filaExcel ? <small>Fila {e.orden.filaExcel} del Excel</small> : <small>Solo en la plataforma</small>}
                    </td>
                    <td className="modulo-celda-razon">
                      {e.orden ? <><span className="billing-group-cell">{e.orden.razon}</span><small>{e.orden.grupo}</small></> : <span className="modulo-sin-marca">Sin datos</span>}
                    </td>
                    <td>{e.orden ? <CeldaFecha orden={e.orden} /> : <span className="modulo-sin-marca">—</span>}</td>
                    <td>{e.orden ? <span className={`modulo-origen ${e.orden.origen}`}>{ORIGEN_LABEL[e.orden.origen]}</span> : <span className="modulo-sin-marca">—</span>}</td>
                    <td className="modulo-celda-comentario">{e.motivo ?? <span className="modulo-sin-marca">Sin motivo</span>}</td>
                    <td>{formatDateTime(e.eliminado)}<small>{e.eliminadoPor}</small></td>
                    <td><RestaurarOrden noOrden={e.noOrden} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
