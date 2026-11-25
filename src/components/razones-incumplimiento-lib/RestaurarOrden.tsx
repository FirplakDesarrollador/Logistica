"use client";

import { useActionState } from "react";
import { CircleAlert, LoaderCircle, RotateCcw } from "lucide-react";
import { restaurarOrden, type EstadoRestauracion } from "@/app/razones-incumplimiento-lib/acciones";

const INICIAL: EstadoRestauracion = { estado: "inicial", mensaje: "" };

// Restaurar no destruye nada (la orden vuelve con sus datos), así que no pide confirmación.
// Al terminar, la página se revalida y la fila sale de la lista.
export default function RestaurarOrden({ noOrden }: { noOrden: number }) {
  const [estado, accion, restaurando] = useActionState(restaurarOrden, INICIAL);
  return (
    <form action={accion} className="eliminadas-accion">
      <input type="hidden" name="noOrden" value={noOrden} />
      <button type="submit" className="billing-secondary-button small" disabled={restaurando} aria-label={`Restaurar orden ${noOrden}`}>
        {restaurando ? <LoaderCircle size={15} className="billing-spin" aria-hidden="true" /> : <RotateCcw size={15} aria-hidden="true" />}
        {restaurando ? "Restaurando…" : "Restaurar"}
      </button>
      {estado.estado === "error" && <span className="form-error" role="alert"><CircleAlert size={14} aria-hidden="true" /> {estado.mensaje}</span>}
    </form>
  );
}
