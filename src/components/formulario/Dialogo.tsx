"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

// Diálogo modal reutilizable (manual de identidad 7.8 y 13): usa <dialog> nativo, que atrapa el foco,
// se cierra con Esc y devuelve el foco al disparador. Para confirmaciones de acciones destructivas.
export default function Dialogo({ abierto, onCerrar, titulo, descripcion, tono = "normal", children }: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: ReactNode;
  tono?: "normal" | "peligro";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const idDescripcion = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className={`dialogo dialogo-${tono}`}
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDescripcion : undefined}
      onClose={onCerrar}
      onClick={(evento) => { if (evento.target === ref.current) onCerrar(); }}
    >
      <div className="dialogo-cuerpo">
        <header className="dialogo-encabezado">
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="dialogo-cerrar" onClick={onCerrar} aria-label="Cerrar"><X size={18} aria-hidden="true" /></button>
        </header>
        {descripcion && <div id={idDescripcion} className="dialogo-descripcion">{descripcion}</div>}
        {children}
      </div>
    </dialog>
  );
}
