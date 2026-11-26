import { ArrowRightLeft, ClipboardList, type LucideIcon } from "lucide-react";

// Catálogo de módulos: cada Excel migrado se registra aquí (paso 6 del playbook de migración).
// Así aparece en el portal y en el menú lateral. Ver llm-wiki/playbook-migracion.md.
// "en-desarrollo": el módulo existe en el portal pero todavía no tiene Excel migrado ni funciones.
export type EstadoModulo = "en-desarrollo" | "en-migracion" | "migrado";

export type Modulo = {
  slug: string;
  titulo: string;
  descripcion: string;
  /** Excel del que sale el módulo; vacío mientras está en desarrollo. */
  excelOrigen?: string;
  estado: EstadoModulo;
  href: string;
  icon: LucideIcon;
};

export const modulos: Modulo[] = [
  {
    slug: "razones-incumplimiento-lib",
    titulo: "Razones de incumplimiento de liberación",
    descripcion: "Registra por qué se liberó o no cada orden de producción y consulta más de 40.000 órdenes con filtros, búsqueda y resúmenes.",
    excelOrigen: "Razones incumplimiento lib.xlsx",
    estado: "en-migracion",
    href: "/razones-incumplimiento-lib",
    icon: ClipboardList,
  },
  {
    slug: "picking-traslados",
    titulo: "Picking y Traslados",
    descripcion: "Módulo en desarrollo. Pronto estará disponible en la plataforma.",
    estado: "en-desarrollo",
    href: "/picking-traslados",
    icon: ArrowRightLeft,
  },
];

export const estadoLabel: Record<EstadoModulo, string> = {
  "en-desarrollo": "En desarrollo",
  "en-migracion": "En migración",
  migrado: "Migrado",
};
