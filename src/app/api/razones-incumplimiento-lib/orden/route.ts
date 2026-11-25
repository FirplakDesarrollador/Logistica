import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { buscarOrden, cargarCatalogo } from "@/lib/razones-incumplimiento-lib/datos";
import { leerNoOrden } from "@/lib/razones-incumplimiento-lib/reglas";
import { aOrdenFormulario } from "@/lib/razones-incumplimiento-lib/formulario";

// Consulta una orden por número para que el formulario cargue sus datos al editarla.
export async function GET(request: NextRequest) {
  if (!(await getSessionUser())) return NextResponse.json({ error: "La sesión expiró." }, { status: 401 });
  const noOrden = leerNoOrden(request.nextUrl.searchParams.get("no") ?? "");
  if (noOrden === null) return NextResponse.json({ error: "Número de orden no válido." }, { status: 400 });
  const [{ orden }, catalogo] = await Promise.all([buscarOrden(noOrden), cargarCatalogo()]);
  return NextResponse.json({ orden: orden ? aOrdenFormulario(orden, catalogo.razones) : null });
}
