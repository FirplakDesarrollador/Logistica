import Link from "next/link";
import { formatDateLong, formatDateTime } from "@/lib/format";
import { ANOMALIA_LABEL, ORIGEN_LABEL, RUTA, type Orden } from "@/lib/razones-incumplimiento-lib/types";

/** Hace visibles los espacios al inicio o al final de un texto original ("DESMONTE DE ORDEN␣"). */
export function textoConEspacios(texto: string): string {
  return texto.replace(/^\s+/, (m) => "␣".repeat(m.length)).replace(/\s+$/, (m) => "␣".repeat(m.length));
}

export function MarcasCalidad({ orden }: { orden: Orden }) {
  if (!orden.anomalias.length) return <span className="modulo-sin-marca">—</span>;
  return <span className="modulo-marcas">{orden.anomalias.map((a) => <span key={a} className="modulo-marca">{ANOMALIA_LABEL[a]}</span>)}</span>;
}

export function CeldaFecha({ orden }: { orden: Orden }) {
  if (orden.fechaProgramada) return <>{formatDateLong(orden.fechaProgramada)}{orden.anomalias.includes("fecha-atipica") ? <small>Año atípico</small> : null}</>;
  if (orden.fechaTexto) return <><span className="modulo-original">“{textoConEspacios(orden.fechaTexto)}”</span><small>Texto, no es fecha</small></>;
  return <span className="modulo-sin-marca">Sin fecha</span>;
}

// Tabla de órdenes (componente de servidor: solo recibe la página visible).
export default function TablaOrdenes({ ordenes }: { ordenes: Orden[] }) {
  return (
    <div className="billing-table-scroll" tabIndex={0} role="region" aria-label="Tabla de órdenes, desplazable horizontalmente">
      <table className="billing-data-table modulo-tabla">
        <thead>
          <tr>
            <th scope="col">No. orden</th>
            <th scope="col">Razón</th>
            <th scope="col">Fecha programada</th>
            <th scope="col">Cambio de fecha</th>
            <th scope="col">Comentario</th>
            <th scope="col">Origen</th>
            <th scope="col">Calidad</th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map((o) => (
            <tr key={o.noOrden}>
              <td>
                <Link className="modulo-orden-link" href={`${RUTA}/registrar?orden=${o.noOrden}`} aria-label={`Editar orden ${o.noOrden}`}>{o.noOrden}</Link>
                {o.filaExcel ? <small>Fila {o.filaExcel} del Excel</small> : <small>Solo en la plataforma</small>}
              </td>
              <td className="modulo-celda-razon">
                <span className="billing-group-cell">{o.razon}</span>
                <small>{o.razon !== o.razonNormalizada ? `Se agrupa como ${o.razonNormalizada} · ` : ""}{o.grupo}</small>
              </td>
              <td><CeldaFecha orden={o} /></td>
              <td>{o.cambioFecha ? <><span className="billing-zone-tag">Sí</span><small>{o.cambioFechaFuente === "comentario" ? "Detectado del comentario" : "Registrado en el formulario"}</small></> : <span className="modulo-sin-marca">No</span>}</td>
              <td className="modulo-celda-comentario">{o.comentario ?? <span className="modulo-sin-marca">—</span>}</td>
              <td>
                <span className={`modulo-origen ${o.origen}`}>{ORIGEN_LABEL[o.origen]}</span>
                {o.actualizado ? <small>{formatDateTime(o.actualizado)}</small> : null}
              </td>
              <td><MarcasCalidad orden={o} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
