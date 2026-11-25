"use client";

import { useActionState, useState } from "react";
import { CircleAlert, LoaderCircle, Trash2 } from "lucide-react";
import Campo from "@/components/formulario/Campo";
import Dialogo from "@/components/formulario/Dialogo";
import { eliminarOrden, type EstadoEliminacion } from "@/app/razones-incumplimiento-lib/acciones";
import { MAX_MOTIVO_ELIMINACION } from "@/lib/razones-incumplimiento-lib/types";

const INICIAL: EstadoEliminacion = { estado: "inicial", mensaje: "" };

// Botón "Eliminar orden" con confirmación. Borrado lógico: la orden deja de verse en la app,
// pero la fila del Excel y el registro se conservan; volver a guardarla la restaura.
export default function EliminarOrden({ noOrden, origen, onEliminada }: {
  noOrden: number;
  origen: "historico" | "nuevo" | "editado";
  onEliminada: (mensaje: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [estado, accion, eliminando] = useActionState(async (previo: EstadoEliminacion, formData: FormData) => {
    const resultado = await eliminarOrden(previo, formData);
    if (resultado.estado === "ok") {
      setAbierto(false);
      onEliminada(resultado.mensaje);
    }
    return resultado;
  }, INICIAL);

  return (
    <>
      <button type="button" className="boton-peligro-secundario" onClick={() => { setMotivo(""); setAbierto(true); }}>
        <Trash2 size={16} aria-hidden="true" /> Eliminar orden
      </button>

      <Dialogo
        abierto={abierto}
        onCerrar={() => { if (!eliminando) setAbierto(false); }}
        titulo={`¿Eliminar la orden ${noOrden}?`}
        tono="peligro"
        descripcion={
          <p>
            La orden dejará de aparecer en las órdenes, el resumen y los conteos.{" "}
            {origen === "nuevo" ? "Se registró en la plataforma" : "Viene del histórico del Excel"}: la información original se conserva como respaldo,
            y si vuelves a registrar este mismo número, la orden se restaura.
          </p>
        }
      >
        <form action={accion} className="dialogo-formulario">
          <input type="hidden" name="noOrden" value={noOrden} />
          <Campo id={`motivo-eliminar-${noOrden}`} etiqueta="Motivo (opcional)" ayuda={`${motivo.length} de ${MAX_MOTIVO_ELIMINACION} caracteres.`}>
            {(props) => <textarea {...props} name="motivo" rows={3} maxLength={MAX_MOTIVO_ELIMINACION} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Por ejemplo: orden duplicada o registrada por error" />}
          </Campo>

          {estado.estado === "error" && <p className="form-error" role="alert"><CircleAlert size={15} aria-hidden="true" /> {estado.mensaje}</p>}

          <div className="dialogo-acciones">
            <button type="button" className="billing-secondary-button" onClick={() => setAbierto(false)} disabled={eliminando} autoFocus>Cancelar</button>
            <button type="submit" className="boton-peligro" disabled={eliminando}>
              {eliminando ? <LoaderCircle size={16} className="billing-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
              {eliminando ? "Eliminando…" : "Sí, eliminar orden"}
            </button>
          </div>
        </form>
      </Dialogo>
    </>
  );
}
