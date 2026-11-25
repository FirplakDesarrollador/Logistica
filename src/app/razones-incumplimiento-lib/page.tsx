import Link from "next/link";
import { CalendarClock, CalendarX2, CircleCheck, CircleSlash, ClipboardList, ClipboardPen, ListChecks, TriangleAlert } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import GraficoBarras from "@/components/graficos/GraficoBarras";
import { formatNumber, formatMonthYear } from "@/lib/format";
import { cargarOrdenes, resumir } from "@/lib/razones-incumplimiento-lib/datos";
import { RUTA, TITULO_MODULO } from "@/lib/razones-incumplimiento-lib/types";

export const metadata = { title: `${TITULO_MODULO} | Logística Firplak` };

export default async function ResumenPage() {
  const { ordenes } = await cargarOrdenes();
  const r = resumir(ordenes);
  const historicas = r.total - r.nuevos;

  return (
    <>
      <header className="billing-heading-row">
        <div>
          <span className="billing-eyebrow">LIBERACIÓN DE ÓRDENES <span>·</span> RESUMEN</span>
          <h1>{TITULO_MODULO}</h1>
          <p>Por qué se liberó o no cada orden de producción. Incluye todo el histórico del Excel y lo que se registra en la plataforma.</p>
        </div>
        <div className="billing-heading-actions">
          <Link className="billing-secondary-button" href={`${RUTA}/ordenes`}><ListChecks size={16} aria-hidden="true" /> Ver órdenes</Link>
          <Link className="billing-primary-button" href={`${RUTA}/registrar`}><ClipboardPen size={16} aria-hidden="true" /> Registrar orden</Link>
        </div>
      </header>

      <section className="billing-metrics-grid" aria-label="Conteos principales">
        <MetricCard icon={ClipboardList} label="Órdenes registradas" value={formatNumber(r.total)} detail={`${formatNumber(historicas)} del Excel · ${formatNumber(r.nuevos)} ${r.nuevos === 1 ? "nueva" : "nuevas"} · ${formatNumber(r.editados)} ${r.editados === 1 ? "editada" : "editadas"}`} />
        <MetricCard icon={CircleCheck} label="Cumplen" value={formatNumber(r.cumple)} detail="Razón «CUMPLE»: liberadas en su fecha" />
        <MetricCard icon={CalendarClock} label="Cumplen con cambio de fecha" value={formatNumber(r.cumpleConCambio)} detail={`De las que cumplen; ${formatNumber(r.cumpleConCambioDetectado)} detectadas del comentario`} />
        <MetricCard icon={TriangleAlert} label="No cumplen" value={formatNumber(r.noCumplen)} detail="Con una razón distinta de «CUMPLE» y «NO MEDIR»" />
        <MetricCard icon={CircleSlash} label="No medir" value={formatNumber(r.noMedir)} detail="Razón «NO MEDIR» (p. ej. canceladas)" />
        <MetricCard icon={CalendarX2} label="Sin fecha programada" value={formatNumber(r.sinFecha)} detail="Vacías o escritas como texto en el Excel" />
      </section>

      <div className="modulo-graficos">
        <section className="billing-panel">
          <div className="billing-panel-heading">
            <div>
              <span className="billing-panel-kicker">ÁREA RESPONSABLE</span>
              <h2>Órdenes que no cumplen, por área</h2>
            </div>
            <span className="billing-period-caption">{formatNumber(r.noCumplen)} órdenes</span>
          </div>
          <GraficoBarras datos={r.porGrupo} unidad="Órdenes" encabezadoCategoria="Área responsable" />
          <p className="modulo-nota">Agrupación provisional de razones por área, aprobada para análisis. La razón original de cada orden no cambia.</p>
        </section>

        <section className="billing-panel">
          <div className="billing-panel-heading">
            <div>
              <span className="billing-panel-kicker">RAZONES</span>
              <h2>Razones más frecuentes de no cumplimiento</h2>
            </div>
            <span className="billing-period-caption">{formatNumber(r.porRazon.length)} razones usadas</span>
          </div>
          <GraficoBarras datos={r.porRazon} maxBarras={8} unidad="Órdenes" encabezadoCategoria="Razón" />
          <p className="modulo-nota">Las variantes escritas fuera del catálogo se cuentan con su razón equivalente.</p>
        </section>
      </div>

      <section className="billing-panel">
        <div className="billing-panel-heading">
          <div>
            <span className="billing-panel-kicker">EN EL TIEMPO</span>
            <h2>Órdenes por mes de fecha programada</h2>
          </div>
          <span className="billing-period-caption">{r.porMes.length ? `${formatMonthYear(r.porMes[0].etiqueta)} – ${formatMonthYear(r.porMes[r.porMes.length - 1].etiqueta)}` : "Sin fechas"}</span>
        </div>
        <GraficoBarras datos={r.porMes.map((m) => ({ etiqueta: formatMonthYear(m.etiqueta), valor: m.valor }))} orientacion="vertical" unidad="Órdenes" encabezadoCategoria="Mes" />
        <p className="modulo-nota">
          Incluye {formatNumber(r.conFechaEnGrafico)} de {formatNumber(r.total)} órdenes. No incluye {formatNumber(r.sinFecha)} sin fecha programada
          (en el Excel casi todas las que cumplen no la tienen) ni {formatNumber(r.fechaAtipica)} con año atípico. <Link href={`${RUTA}/calidad`}>Ver calidad del registro</Link>.
        </p>
      </section>
    </>
  );
}
