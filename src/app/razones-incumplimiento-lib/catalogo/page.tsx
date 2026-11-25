import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { cargarCatalogo, cargarOrdenes, usoPorRazon } from "@/lib/razones-incumplimiento-lib/datos";
import { grupoRazon } from "@/lib/razones-incumplimiento-lib/reglas";
import { GRUPOS, RUTA, TITULO_MODULO } from "@/lib/razones-incumplimiento-lib/types";

export const metadata = { title: `Catálogo de razones · ${TITULO_MODULO} | Logística Firplak` };

export default async function CatalogoPage() {
  const [catalogo, { ordenes }] = await Promise.all([cargarCatalogo(), cargarOrdenes()]);
  const uso = usoPorRazon(ordenes);
  const filas = catalogo.razones
    .map((razon, indice) => ({ razon, posicion: indice + 1, grupo: grupoRazon(razon), ordenes: uso.get(razon) ?? 0 }))
    .sort((a, b) => GRUPOS.indexOf(a.grupo) - GRUPOS.indexOf(b.grupo) || b.ordenes - a.ordenes);
  const sinUso = filas.filter((f) => f.ordenes === 0).length;

  return (
    <>
      <header className="billing-heading-row">
        <div>
          <span className="billing-eyebrow">LIBERACIÓN DE ÓRDENES <span>·</span> CATÁLOGO</span>
          <h1>Catálogo de razones</h1>
          <p>Las {formatNumber(catalogo.razones.length)} razones de la lista del Excel, con su área responsable y cuántas órdenes la usan. Es la lista que ofrece el formulario.</p>
        </div>
      </header>

      <section className="billing-panel modulo-tabla-panel" aria-labelledby="titulo-catalogo">
        <div className="billing-table-heading">
          <div>
            <h2 id="titulo-catalogo">{formatNumber(catalogo.razones.length)} razones · {formatNumber(sinUso)} sin uso</h2>
            <p>
              Agrupación por área provisional, aprobada para análisis.
              {catalogo.sueltas.map((s) => ` En la hoja del catálogo también aparece «${s.valor}» suelto en la celda ${s.celda}, fuera de la lista.`).join("")}
            </p>
          </div>
        </div>
        <div className="billing-table-scroll" tabIndex={0} role="region" aria-label="Catálogo de razones, desplazable horizontalmente">
          <table className="billing-data-table modulo-tabla-simple">
            <thead><tr><th scope="col">Razón</th><th scope="col">Área responsable</th><th scope="col" className="align-right">Órdenes</th><th scope="col">Uso</th></tr></thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.razon}>
                  <td><span className="billing-group-cell">{f.razon}</span></td>
                  <td>{f.grupo}</td>
                  <td className="align-right">{f.ordenes > 0 ? <Link className="modulo-orden-link" href={`${RUTA}/ordenes?razon=${encodeURIComponent(f.razon)}`} aria-label={`Ver las ${f.ordenes} órdenes con la razón ${f.razon}`}>{formatNumber(f.ordenes)}</Link> : "0"}</td>
                  <td>{f.ordenes === 0 ? <span className="modulo-marca">Sin uso</span> : <span className="modulo-sin-marca">En uso</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
