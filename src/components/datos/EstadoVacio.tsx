import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import BrandPeak from "@/components/BrandPeak";

// Estado vacío (manual 7.8): pico de marca de agua, título breve, explicación y una acción.
export default function EstadoVacio({ titulo, texto, accion }: { titulo: string; texto: string; accion?: ReactNode }) {
  return (
    <div className="datos-vacio">
      <BrandPeak className="brand-peak" />
      <SearchX size={26} aria-hidden="true" />
      <strong>{titulo}</strong>
      <span>{texto}</span>
      {accion}
    </div>
  );
}
