import { ClipboardList, type LucideIcon } from "lucide-react";

// Catálogo de módulos: cada Excel migrado se registra aquí (paso 6 del playbook de migración).
// Así aparece en el portal y en el menú lateral. Ver llm-wiki/playbook-migracion.md.
export type EstadoModulo = "en-migracion" | "migrado";

export type Modulo = {
  slug: string;
  titulo: string;
  descripcion: string;
  excelOrigen: string;
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
];

export const estadoLabel: Record<EstadoModulo, string> = {
  "en-migracion": "En migración",
  migrado: "Migrado",
};
