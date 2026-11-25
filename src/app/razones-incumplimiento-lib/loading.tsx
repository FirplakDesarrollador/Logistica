// Estado de carga del módulo (manual 7.8): skeleton con la forma final de encabezado, tarjetas y tabla.
export default function Cargando() {
  return (
    <div className="modulo-cargando" role="status" aria-label="Cargando la información">
      <span className="billing-skeleton modulo-sk-titulo" />
      <div className="modulo-sk-tarjetas">{Array.from({ length: 3 }, (_, i) => <span key={i} className="billing-skeleton modulo-sk-tarjeta" />)}</div>
      <span className="billing-skeleton modulo-sk-panel" />
    </div>
  );
}
