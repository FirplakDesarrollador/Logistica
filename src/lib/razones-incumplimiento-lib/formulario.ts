// Datos que el formulario necesita para editar una orden existente (sin exponer el resto del histórico).
import type { Orden, Origen } from "./types";

export type OrdenFormulario = {
  noOrden: number;
  origen: Origen;
  filaExcel: number | null;
  /** Razón del catálogo propuesta para el selector ("" si no hay equivalente). */
  razon: string;
  /** Razón tal como está guardada, si no coincide exactamente con el catálogo. */
  razonOriginal: string | null;
  fechaProgramada: string;
  /** Texto de la fecha del Excel cuando no es una fecha válida. */
  fechaTexto: string | null;
  cambioFecha: boolean;
  cambioFechaFuente: Orden["cambioFechaFuente"];
  comentario: string;
  actualizado: string | null;
};

export function aOrdenFormulario(orden: Orden, catalogo: readonly string[]): OrdenFormulario {
  const enCatalogo = catalogo.includes(orden.razonNormalizada);
  return {
    noOrden: orden.noOrden,
    origen: orden.origen,
    filaExcel: orden.filaExcel,
    razon: enCatalogo ? orden.razonNormalizada : "",
    razonOriginal: orden.razon !== orden.razonNormalizada || !enCatalogo ? orden.razon : null,
    fechaProgramada: orden.fechaProgramada ?? "",
    fechaTexto: orden.fechaTexto,
    cambioFecha: orden.cambioFecha,
    cambioFechaFuente: orden.cambioFechaFuente,
    comentario: orden.comentario ?? "",
    actualizado: orden.actualizado,
  };
}
