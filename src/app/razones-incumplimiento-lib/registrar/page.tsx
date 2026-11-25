import { hoyColombia, parametro, sumarDias, type ParametrosUrl } from "@/lib/consulta";
import { buscarOrden, cargarCatalogo } from "@/lib/razones-incumplimiento-lib/datos";
import { aOrdenFormulario } from "@/lib/razones-incumplimiento-lib/formulario";
import { leerNoOrden, rangoFechaFormulario } from "@/lib/razones-incumplimiento-lib/reglas";
import { TITULO_MODULO } from "@/lib/razones-incumplimiento-lib/types";
import RegistroForm from "@/components/razones-incumplimiento-lib/RegistroForm";

export const metadata = { title: `Registrar orden · ${TITULO_MODULO} | Logística Firplak` };

export default async function RegistrarPage({ searchParams }: { searchParams: Promise<ParametrosUrl> }) {
  const params = await searchParams;
  const catalogo = await cargarCatalogo();
  const noInicial = leerNoOrden(parametro(params, "orden"));
  const inicial = noInicial ? (await buscarOrden(noInicial)).orden : null;

  return (
    <>
      <header className="billing-heading-row">
        <div>
          <span className="billing-eyebrow">LIBERACIÓN DE ÓRDENES <span>·</span> REGISTRO</span>
          <h1>Registrar orden</h1>
          <p>Escribe el número de la orden. Si ya existe (en el histórico del Excel o en la plataforma), se cargan sus datos y al guardar se actualiza; si no, se crea un registro nuevo.</p>
        </div>
      </header>
      <RegistroForm
        key={noInicial ?? "nueva"}
        razones={catalogo.razones}
        rango={rangoFechaFormulario(hoyColombia(), sumarDias)}
        inicial={inicial ? aOrdenFormulario(inicial, catalogo.razones) : null}
        noBuscado={noInicial}
      />
    </>
  );
}
