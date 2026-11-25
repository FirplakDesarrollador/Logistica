"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartColors, chartTooltipStyle } from "@/lib/brand";
import { formatNumber } from "@/lib/format";

// Gráfico de barras de una serie (manual, sección 8): navy, rejilla tenue, sin bordes, valores es-CO.
// Si hay más categorías que `maxBarras`, las restantes se agrupan en "Otras". Incluye la tabla de datos
// como alternativa textual (manual 13: "Gráficos con resumen textual o tabla alternativa").
export type DatoBarra = { etiqueta: string; valor: number };

export function agruparOtras(datos: DatoBarra[], maxBarras: number, etiquetaOtras = "Otras"): DatoBarra[] {
  if (datos.length <= maxBarras) return datos;
  const visibles = datos.slice(0, maxBarras - 1);
  const resto = datos.slice(maxBarras - 1).reduce((suma, d) => suma + d.valor, 0);
  return [...visibles, { etiqueta: `${etiquetaOtras} (${datos.length - maxBarras + 1})`, valor: resto }];
}

export default function GraficoBarras({ datos, orientacion = "horizontal", maxBarras, unidad, encabezadoCategoria }: {
  datos: DatoBarra[];
  orientacion?: "horizontal" | "vertical";
  maxBarras?: number;
  /** Nombre del valor en el tooltip y la tabla, p. ej. "Órdenes". */
  unidad: string;
  encabezadoCategoria: string;
}) {
  const filas = maxBarras ? agruparOtras(datos, maxBarras) : datos;
  const horizontal = orientacion === "horizontal";
  const alto = horizontal ? Math.max(160, filas.length * 40 + 24) : undefined;
  const ancho = horizontal ? Math.min(280, Math.max(96, ...filas.map((f) => f.etiqueta.length * 7.4))) : 0;

  return (
    <div className="datos-grafico">
      <div className={horizontal ? "datos-grafico-area" : "billing-chart"} style={alto ? { height: alto } : undefined} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          {horizontal ? (
            <BarChart data={filas} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }}>
              <CartesianGrid horizontal={false} stroke={chartColors.grid} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="etiqueta" width={ancho} tickLine={false} axisLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} interval={0} />
              <Tooltip cursor={{ fill: chartColors.grid, opacity: .4 }} contentStyle={chartTooltipStyle} formatter={(valor) => [formatNumber(Number(valor)), unidad]} />
              <Bar dataKey="valor" fill={chartColors.primary} radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false}>
                <LabelList dataKey="valor" position="right" formatter={(valor) => formatNumber(Number(valor))} style={{ fill: chartColors.primary, fontSize: 12, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={filas} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} stroke={chartColors.grid} />
              <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} minTickGap={12} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} width={48} tickFormatter={(valor) => formatNumber(Number(valor))} />
              <Tooltip cursor={{ fill: chartColors.grid, opacity: .4 }} contentStyle={chartTooltipStyle} formatter={(valor) => [formatNumber(Number(valor)), unidad]} />
              <Bar dataKey="valor" fill={chartColors.primary} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <details className="datos-grafico-tabla">
        <summary>Ver datos en tabla</summary>
        <table>
          <thead><tr><th scope="col">{encabezadoCategoria}</th><th scope="col">{unidad}</th></tr></thead>
          <tbody>{filas.map((f) => <tr key={f.etiqueta}><th scope="row">{f.etiqueta}</th><td>{formatNumber(f.valor)}</td></tr>)}</tbody>
        </table>
      </details>
    </div>
  );
}
