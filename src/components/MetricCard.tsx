import type { LucideIcon } from "lucide-react";

// Tarjeta KPI (manual de identidad, 7.5): un dato principal por tarjeta, calculado desde los datos reales del Excel.
export function MetricCard({ label, value, detail, icon: Icon }: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return <article className="billing-metric-card"><div className="billing-metric-icon blue"><Icon size={18} /></div><div className="billing-metric-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}
