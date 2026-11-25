import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

// Campo de formulario (manual 7.4): etiqueta siempre visible encima, ayuda opcional y error bajo el campo
// con icono y texto que dice cómo corregirlo. El control recibe `id` y `aria-describedby` desde aquí.
export default function Campo({ id, etiqueta, obligatorio, ayuda, error, children }: {
  id: string;
  etiqueta: string;
  obligatorio?: boolean;
  ayuda?: ReactNode;
  error?: string;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
}) {
  const ayudaId = ayuda ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, ayudaId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`form-campo${error ? " con-error" : ""}`}>
      <label htmlFor={id}>{etiqueta}{obligatorio ? <span className="form-obligatorio"> (obligatorio)</span> : null}</label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error && <p className="form-error" id={errorId}><CircleAlert size={15} aria-hidden="true" /> {error}</p>}
      {ayuda && <p className="form-ayuda" id={ayudaId}>{ayuda}</p>}
    </div>
  );
}
