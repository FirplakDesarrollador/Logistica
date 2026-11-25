# Logística Firplak

Demo para migrar los Excel que Logística actualiza a mano a una plataforma web rápida, con la identidad visual Firplak.

## Ejecutar

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env.local` y completa los valores. Abre [http://localhost:3020](http://localhost:3020) e ingresa con tu cuenta de Microsoft 365 (solo correos @firplak.com).

Datos en Supabase, proyecto Manufactura, schema `logistica`: ver [ADR-002](llm-wiki/decisiones/ADR-002-supabase-manufactura.md). Para cargar el histórico de un Excel: `node scripts/cargar-supabase.mjs <slug>`.

## Migrar un Excel

1. Copia el archivo en `excels-origen/<slug>/`.
2. Pide al agente `migrador-excel` que lo migre (o sigue la skill `migrar-excel`).
3. El primer paso es: `npm run excel:perfil -- excels-origen/<slug>/<archivo>.xlsx <slug>`.

El proceso y lo aprendido en cada migración viven en [`llm-wiki/`](llm-wiki/index.md).
