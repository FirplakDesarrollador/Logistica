"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { hoyColombia, sumarDias } from "@/lib/consulta";
import { createClient } from "@/lib/supabase/server";
import { buscarOrden, cargarCatalogo } from "@/lib/razones-incumplimiento-lib/datos";
import { leerNoOrden, MAX_COMENTARIO, rangoFechaFormulario, validarFormulario, type DatosFormulario, type ErroresFormulario } from "@/lib/razones-incumplimiento-lib/reglas";
import { MAX_MOTIVO_ELIMINACION, RUTA, TABLAS } from "@/lib/razones-incumplimiento-lib/types";

export type EstadoGuardado = {
  estado: "inicial" | "error" | "ok";
  mensaje: string;
  errores: ErroresFormulario;
  guardado?: { noOrden: number; accion: "registrada" | "actualizada" | "restaurada" };
};

/**
 * Guarda una orden desde el formulario. Si el No. de orden ya existe (en el histórico o en la plataforma),
 * se edita ese registro; el histórico migrado no se modifica: la edición queda en logistica.razones_lib_registros y prevalece.
 */
export async function guardarOrden(_previo: EstadoGuardado, formData: FormData): Promise<EstadoGuardado> {
  const usuario = await getSessionUser();
  if (!usuario) return { estado: "error", mensaje: "Tu sesión expiró. Vuelve a ingresar para guardar la orden.", errores: {} };

  const datos: DatosFormulario = {
    noOrden: String(formData.get("noOrden") ?? ""),
    razon: String(formData.get("razon") ?? ""),
    fechaProgramada: String(formData.get("fechaProgramada") ?? ""),
    cambioFecha: formData.get("cambioFecha") === "on",
    comentario: String(formData.get("comentario") ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_COMENTARIO + 1),
  };

  const catalogo = await cargarCatalogo();
  const errores = validarFormulario(datos, catalogo.razones, rangoFechaFormulario(hoyColombia(), sumarDias));
  if (Object.keys(errores).length) return { estado: "error", mensaje: "Revisa los campos marcados para poder guardar.", errores };

  const noOrden = leerNoOrden(datos.noOrden)!;
  const { orden: existente } = await buscarOrden(noOrden);

  // Upsert por no_orden: si ya existe en la plataforma, se edita. Usuario y fechas los pone la base (trigger).
  const supabase = await createClient();
  const { error } = await supabase.from(TABLAS.registros).upsert(
    { no_orden: noOrden, razon: datos.razon, fecha_programada: datos.fechaProgramada, cambio_fecha: datos.cambioFecha, comentario: datos.comentario || null },
    { onConflict: "no_orden" },
  );
  if (error) {
    console.error("No se pudo guardar la orden", noOrden, error.code, error.message);
    const mensaje = error.code === "23514" ? "La razón elegida no está en el catálogo. Elige una de la lista." : "No pudimos guardar la orden. Intenta de nuevo; si el problema sigue, avisa al administrador de la plataforma.";
    return { estado: "error", mensaje, errores: {} };
  }

  // Guardar una orden que estaba eliminada la restaura (quita la marca de borrado lógico).
  const { data: restaurada, error: errorRestaurar } = await supabase.from(TABLAS.eliminadas).delete().eq("no_orden", noOrden).select("no_orden");
  if (errorRestaurar) console.error("No se pudo quitar la marca de eliminada", noOrden, errorRestaurar.code, errorRestaurar.message);

  revalidatePath(RUTA, "layout");
  const accion = existente ? "actualizada" : restaurada?.length ? "restaurada" : "registrada";
  return { estado: "ok", mensaje: `Orden ${noOrden} ${accion}.`, errores: {}, guardado: { noOrden, accion } };
}

export type EstadoEliminacion = { estado: "inicial" | "error" | "ok"; mensaje: string; noOrden?: number };

/**
 * Elimina una orden (borrado lógico): deja de mostrarse en todas las vistas y conteos. La fila del histórico
 * del Excel y el registro de la plataforma se conservan; quién y cuándo los pone la base. Volver a guardarla la restaura.
 */
export async function eliminarOrden(_previo: EstadoEliminacion, formData: FormData): Promise<EstadoEliminacion> {
  if (!(await getSessionUser())) return { estado: "error", mensaje: "Tu sesión expiró. Vuelve a ingresar para eliminar la orden." };

  const noOrden = leerNoOrden(String(formData.get("noOrden") ?? ""));
  if (noOrden === null) return { estado: "error", mensaje: "El número de orden no es válido." };
  const motivo = String(formData.get("motivo") ?? "").replace(/\s+/g, " ").trim();
  if (motivo.length > MAX_MOTIVO_ELIMINACION) return { estado: "error", mensaje: `El motivo admite máximo ${MAX_MOTIVO_ELIMINACION} caracteres.` };

  const { orden } = await buscarOrden(noOrden);
  if (!orden) return { estado: "error", mensaje: `La orden ${noOrden} no existe o ya fue eliminada.` };

  const supabase = await createClient();
  const { error } = await supabase.from(TABLAS.eliminadas).upsert({ no_orden: noOrden, motivo: motivo || null }, { onConflict: "no_orden" });
  if (error) {
    console.error("No se pudo eliminar la orden", noOrden, error.code, error.message);
    return { estado: "error", mensaje: "No pudimos eliminar la orden. Intenta de nuevo; si el problema sigue, avisa al administrador de la plataforma." };
  }

  revalidatePath(RUTA, "layout");
  return { estado: "ok", mensaje: `Orden ${noOrden} eliminada.`, noOrden };
}

export type EstadoRestauracion = { estado: "inicial" | "error" | "ok"; mensaje: string };

/** Restaura una orden eliminada: quita la marca de borrado lógico y vuelve a aparecer con los datos que tenía. */
export async function restaurarOrden(_previo: EstadoRestauracion, formData: FormData): Promise<EstadoRestauracion> {
  if (!(await getSessionUser())) return { estado: "error", mensaje: "Tu sesión expiró. Vuelve a ingresar para restaurar la orden." };
  const noOrden = leerNoOrden(String(formData.get("noOrden") ?? ""));
  if (noOrden === null) return { estado: "error", mensaje: "El número de orden no es válido." };

  const supabase = await createClient();
  const { data, error } = await supabase.from(TABLAS.eliminadas).delete().eq("no_orden", noOrden).select("no_orden");
  if (error) {
    console.error("No se pudo restaurar la orden", noOrden, error.code, error.message);
    return { estado: "error", mensaje: "No pudimos restaurar la orden. Intenta de nuevo." };
  }
  if (!data?.length) return { estado: "error", mensaje: `La orden ${noOrden} ya no está eliminada.` };

  revalidatePath(RUTA, "layout");
  return { estado: "ok", mensaje: `Orden ${noOrden} restaurada.` };
}
