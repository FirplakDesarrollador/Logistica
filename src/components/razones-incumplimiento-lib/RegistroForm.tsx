"use client";

import { type FormEvent, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, FilePlus2, Info, LoaderCircle, PencilLine, RotateCcw, Save } from "lucide-react";
import Campo from "@/components/formulario/Campo";
import { guardarOrden, type EstadoGuardado } from "@/app/razones-incumplimiento-lib/acciones";
import { formatDateLong, formatDateTime } from "@/lib/format";
import type { OrdenFormulario } from "@/lib/razones-incumplimiento-lib/formulario";
import { leerNoOrden, MAX_COMENTARIO, validarFormulario, type DatosFormulario, type ErroresFormulario } from "@/lib/razones-incumplimiento-lib/reglas";
import { RUTA } from "@/lib/razones-incumplimiento-lib/types";
import EliminarOrden from "@/components/razones-incumplimiento-lib/EliminarOrden";

type Busqueda = "inactiva" | "buscando" | "nueva" | "existente" | "error";

const VACIO: DatosFormulario = { noOrden: "", razon: "", fechaProgramada: "", cambioFecha: false, comentario: "" };
const ESTADO_INICIAL: EstadoGuardado = { estado: "inicial", mensaje: "", errores: {} };

const desdeOrden = (orden: OrdenFormulario): DatosFormulario => ({ noOrden: String(orden.noOrden), razon: orden.razon, fechaProgramada: orden.fechaProgramada, cambioFecha: orden.cambioFecha, comentario: orden.comentario });

export default function RegistroForm({ razones, rango, inicial, noBuscado }: {
  razones: string[];
  rango: { minima: string; maxima: string };
  inicial: OrdenFormulario | null;
  noBuscado: number | null;
}) {
  const [valores, setValores] = useState<DatosFormulario>(inicial ? desdeOrden(inicial) : { ...VACIO, noOrden: noBuscado ? String(noBuscado) : "" });
  const [existente, setExistente] = useState<OrdenFormulario | null>(inicial);
  const [busqueda, setBusqueda] = useState<Busqueda>(inicial ? "existente" : noBuscado ? "nueva" : "inactiva");
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [avisoEliminada, setAvisoEliminada] = useState("");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const consultaActual = useRef(0);
  const campoOrden = useRef<HTMLInputElement>(null);
  // true mientras los campos muestran datos cargados de una orden existente (para limpiarlos si cambia el número).
  const datosCargados = useRef(Boolean(inicial));

  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current); }, []);

  const reiniciar = () => {
    consultaActual.current++;
    datosCargados.current = false;
    setValores(VACIO);
    setExistente(null);
    setBusqueda("inactiva");
    setErrores({});
    campoOrden.current?.focus();
  };

  const [estado, accion, guardando] = useActionState(async (previo: EstadoGuardado, formData: FormData) => {
    const resultado = await guardarOrden(previo, formData);
    setErrores(resultado.errores);
    if (resultado.estado === "ok") { setAvisoEliminada(""); reiniciar(); }
    return resultado;
  }, ESTADO_INICIAL);

  const alEliminar = (mensaje: string) => { setAvisoEliminada(mensaje); reiniciar(); };

  const consultar = (texto: string) => {
    if (temporizador.current) clearTimeout(temporizador.current);
    const numero = leerNoOrden(texto);
    const id = ++consultaActual.current;
    if (numero === null) {
      setBusqueda("inactiva");
      setExistente(null);
      if (datosCargados.current) { datosCargados.current = false; setValores((v) => ({ ...VACIO, noOrden: v.noOrden })); }
      return;
    }
    setBusqueda("buscando");
    temporizador.current = setTimeout(async () => {
      try {
        const respuesta = await fetch(`/api/razones-incumplimiento-lib/orden?no=${numero}`, { cache: "no-store" });
        if (!respuesta.ok) throw new Error(String(respuesta.status));
        const { orden } = (await respuesta.json()) as { orden: OrdenFormulario | null };
        if (id !== consultaActual.current) return;
        if (orden) {
          datosCargados.current = true;
          setExistente(orden);
          setValores(desdeOrden(orden));
          setBusqueda("existente");
        } else {
          setBusqueda("nueva");
          setExistente(null);
          if (datosCargados.current) { datosCargados.current = false; setValores({ ...VACIO, noOrden: String(numero) }); }
        }
      } catch {
        if (id === consultaActual.current) setBusqueda("error");
      }
    }, 350);
  };

  const cambiar = <K extends keyof DatosFormulario>(campo: K, valor: DatosFormulario[K]) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const alEnviar = (evento: FormEvent<HTMLFormElement>) => {
    const encontrados = validarFormulario({ ...valores, comentario: valores.comentario.trim() }, razones, rango);
    if (Object.keys(encontrados).length) {
      evento.preventDefault();
      setErrores(encontrados);
      const primero = (["noOrden", "razon", "fechaProgramada", "comentario"] as const).find((c) => encontrados[c]);
      if (primero) document.getElementById(`campo-${primero}`)?.focus();
    }
  };

  const editando = busqueda === "existente" && existente;
  const mostrarExito = estado.estado === "ok" && busqueda === "inactiva" && !valores.noOrden && !avisoEliminada;

  return (
    <div className="registro">
      {avisoEliminada && busqueda === "inactiva" && !valores.noOrden && (
        <div className="form-aviso exito" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span><strong>{avisoEliminada}</strong> Ya no aparece en las órdenes ni en los conteos. Si fue un error, puedes restaurarla desde Órdenes eliminadas.</span>
          <Link href={`${RUTA}/eliminadas`}>Ver órdenes eliminadas</Link>
        </div>
      )}
      {mostrarExito && estado.guardado && (
        <div className="form-aviso exito" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span><strong>{estado.mensaje}</strong> Ya aparece en la tabla de órdenes. Puedes registrar la siguiente.</span>
          <Link href={`${RUTA}/ordenes?q=${estado.guardado.noOrden}`}>Ver en órdenes</Link>
        </div>
      )}
      {estado.estado === "error" && !Object.keys(estado.errores).length && (
        <div className="form-aviso error" role="alert"><CircleAlert size={18} aria-hidden="true" /><span>{estado.mensaje}</span></div>
      )}

      <form className="billing-panel form-registro" action={accion} onSubmit={alEnviar} noValidate>
        <div className="form-grid">
          <Campo id="campo-noOrden" etiqueta="No. de orden" obligatorio error={errores.noOrden} ayuda="Solo dígitos. Si la orden ya existe, se cargan sus datos para editarla.">
            {(props) => (
              <input {...props} ref={campoOrden} name="noOrden" inputMode="numeric" autoComplete="off" maxLength={10} value={valores.noOrden}
                onChange={(e) => { const texto = e.target.value.replace(/\D/g, ""); cambiar("noOrden", texto); consultar(texto); }} />
            )}
          </Campo>

          <div className="form-estado-orden" aria-live="polite">
            {busqueda === "buscando" && <span className="form-chip"><LoaderCircle size={15} className="billing-spin" aria-hidden="true" /> Buscando la orden…</span>}
            {busqueda === "nueva" && <span className="form-chip nueva"><FilePlus2 size={15} aria-hidden="true" /> Orden nueva: se creará un registro</span>}
            {busqueda === "error" && <span className="form-chip error"><CircleAlert size={15} aria-hidden="true" /> No pudimos consultar la orden. Puedes guardar igual; si existe, se actualizará.</span>}
            {editando && <span className="form-chip editando"><PencilLine size={15} aria-hidden="true" /> Editando una orden existente</span>}
          </div>
        </div>

        {editando && (
          <div className="form-aviso info">
            <Info size={18} aria-hidden="true" />
            <span>
              <strong>Estás editando la orden {existente.noOrden}.</strong>{" "}
              {existente.origen === "historico"
                ? `Viene del histórico del Excel (fila ${existente.filaExcel}). Al guardar, tu edición es la que se muestra; la fila original del Excel se conserva.`
                : `Está registrada en la plataforma${existente.actualizado ? ` (última actualización: ${formatDateTime(existente.actualizado)})` : ""}${existente.filaExcel ? `; viene de la fila ${existente.filaExcel} del Excel` : ""}.`}
            </span>
          </div>
        )}

        <div className="form-grid">
          <Campo id="campo-razon" etiqueta="Razón" obligatorio error={errores.razon}
            ayuda={editando && existente.razonOriginal ? (existente.razon ? <>En el Excel está escrita «{existente.razonOriginal}», que no está en el catálogo. Se propone «{existente.razon}».</> : <>En el Excel está escrita «{existente.razonOriginal}». Selecciona la razón del catálogo.</>) : "Solo razones del catálogo."}>
            {(props) => (
              <select {...props} name="razon" value={valores.razon} onChange={(e) => cambiar("razon", e.target.value)}>
                <option value="">Selecciona una razón</option>
                {razones.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
          </Campo>

          <Campo id="campo-fechaProgramada" etiqueta="Fecha programada" obligatorio error={errores.fechaProgramada}
            ayuda={editando && existente.fechaTexto ? <>En el Excel la fecha aparece como «{existente.fechaTexto}», que no es una fecha. Selecciónala.</> : editando && !existente.fechaProgramada ? "Esta orden no tiene fecha programada en el Excel. Selecciónala para guardar." : `Entre el ${formatDateLong(rango.minima)} y el ${formatDateLong(rango.maxima)}.`}>
            {(props) => <input {...props} type="date" name="fechaProgramada" min={rango.minima} max={rango.maxima} value={valores.fechaProgramada} onChange={(e) => cambiar("fechaProgramada", e.target.value)} />}
          </Campo>
        </div>

        <label className="form-casilla">
          <input type="checkbox" name="cambioFecha" checked={valores.cambioFecha} onChange={(e) => cambiar("cambioFecha", e.target.checked)} />
          <span>
            <strong>¿Se cambió la fecha de la OP?</strong>
            <small>{editando && existente.cambioFechaFuente === "comentario" && valores.cambioFecha ? "Marcada porque el comentario del Excel indica un cambio de fecha." : "Márcala si la orden se liberó en una fecha nueva después de reprogramarse."}</small>
          </span>
        </label>

        <Campo id="campo-comentario" etiqueta="Comentario" error={errores.comentario} ayuda={`${valores.comentario.length} de ${MAX_COMENTARIO} caracteres.`}>
          {(props) => <textarea {...props} name="comentario" rows={3} maxLength={MAX_COMENTARIO} value={valores.comentario} onChange={(e) => cambiar("comentario", e.target.value)} />}
        </Campo>

        {Object.values(errores).some(Boolean) && <p className="form-error" role="alert"><CircleAlert size={15} aria-hidden="true" /> Revisa los campos marcados para poder guardar.</p>}

        <div className="form-acciones">
          <button type="button" className="billing-secondary-button" onClick={reiniciar} disabled={guardando}><RotateCcw size={16} aria-hidden="true" /> Limpiar formulario</button>
          <button type="submit" className="billing-primary-button" disabled={guardando || busqueda === "buscando"}>
            {guardando ? <LoaderCircle size={16} className="billing-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Guardar orden"}
          </button>
        </div>
      </form>

      {editando && (
        <div className="registro-eliminar">
          <span>¿Esta orden no debería estar registrada? Puedes eliminarla; la información original se conserva como respaldo.</span>
          <EliminarOrden noOrden={existente.noOrden} origen={existente.origen} onEliminada={alEliminar} />
        </div>
      )}
    </div>
  );
}
