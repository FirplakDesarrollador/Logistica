"use client";

import Link from "next/link";
import { CircleAlert, RotateCcw } from "lucide-react";

// Estado de error del módulo (manual 7.8 y 9): qué pasó, qué hacer y "Reintentar".
export default function ErrorModulo({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="modulo-error">
      <div className="billing-alert" role="alert">
        <CircleAlert size={18} aria-hidden="true" />
        <span>No pudimos cargar la información de liberación de órdenes. Intenta de nuevo; si el problema sigue, avisa al administrador de la plataforma.</span>
        <button type="button" onClick={reset}><RotateCcw size={15} aria-hidden="true" /> Reintentar</button>
      </div>
      <Link className="billing-secondary-button" href="/">Volver al inicio</Link>
    </div>
  );
}
