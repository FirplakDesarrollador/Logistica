import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/format";

// Pie de tabla con paginación por URL (manual 7.6: "Página 2 de 14 · 683 registros").
// Componente de servidor: recibe los enlaces ya construidos para conservar los filtros.
export default function Paginacion({ pagina, paginas, total, tamano, hrefAnterior, hrefSiguiente, unidad = "registros" }: {
  pagina: number;
  paginas: number;
  total: number;
  tamano: number;
  hrefAnterior: string;
  hrefSiguiente: string;
  unidad?: string;
}) {
  const desde = total === 0 ? 0 : (pagina - 1) * tamano + 1;
  const hasta = Math.min(total, pagina * tamano);
  return (
    <nav className="billing-table-footer" aria-label="Paginación">
      <span>Página {formatNumber(pagina)} de {formatNumber(paginas)} · {formatNumber(total)} {unidad}{total > 0 ? ` · mostrando ${formatNumber(desde)}–${formatNumber(hasta)}` : ""}</span>
      <div>
        {pagina > 1 ? <Link className="datos-pagina-boton" href={hrefAnterior} aria-label="Página anterior" scroll={false}><ChevronLeft size={18} aria-hidden="true" /></Link> : <span className="datos-pagina-boton" aria-disabled="true"><ChevronLeft size={18} aria-hidden="true" /></span>}
        <strong aria-current="page">{formatNumber(pagina)}</strong>
        {pagina < paginas ? <Link className="datos-pagina-boton" href={hrefSiguiente} aria-label="Página siguiente" scroll={false}><ChevronRight size={18} aria-hidden="true" /></Link> : <span className="datos-pagina-boton" aria-disabled="true"><ChevronRight size={18} aria-hidden="true" /></span>}
      </div>
    </nav>
  );
}
