import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { cargarNotas } from "@/lib/razones-incumplimiento-lib/datos";
import { RUTA, TITULO_MODULO } from "@/lib/razones-incumplimiento-lib/types";
import EstadoVacio from "@/components/datos/EstadoVacio";

export const metadata = { title: `Notas de revisión · ${TITULO_MODULO} | Logística Firplak` };

export default async function NotasPage() {
  const notas = await cargarNotas();

  return (
    <>
      <header className="billing-heading-row">
        <div>
          <span className="billing-eyebrow">LIBERACIÓN DE ÓRDENES <span>·</span> NOTAS</span>
          <h1>Notas de revisión</h1>
          <p>Notas de reclasificación que estaban en una hoja oculta del Excel. Se conservan como referencia junto a la razón que hoy tiene cada orden.</p>
        </div>
      </header>

      <section className="billing-panel modulo-tabla-panel" aria-labelledby="titulo-notas">
        <div className="billing-table-heading"><div><h2 id="titulo-notas">{formatNumber(notas.length)} notas</h2></div></div>
        {notas.length === 0 ? (
          <EstadoVacio titulo="No hay notas" texto="El Excel no trae notas de revisión." />
        ) : (
          <div className="billing-table-scroll" tabIndex={0} role="region" aria-label="Notas de revisión, desplazable horizontalmente">
            <table className="billing-data-table modulo-tabla">
              <thead><tr><th scope="col">Orden de producción</th><th scope="col">Nota</th><th scope="col">Razón actual</th></tr></thead>
              <tbody>
                {notas.map((n) => (
                  <tr key={`${n.codigoOP}-${n.filaExcel}`}>
                    <td><Link className="modulo-orden-link" href={`${RUTA}/registrar?orden=${n.codigoOP}`} aria-label={`Ver o editar orden ${n.codigoOP}`}>{n.codigoOP}</Link>{n.filaExcel ? <small>Fila {n.filaExcel} de la hoja de notas</small> : null}</td>
                    <td className="modulo-celda-comentario">{n.nota}</td>
                    <td>{n.razonActual ?? <span className="modulo-sin-marca">La orden no está registrada</span>}</td>
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
