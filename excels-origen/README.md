# Excels de origen

Deja aquí el Excel original de cada migración, dentro de una carpeta con su slug:

```
excels-origen/<slug>/<archivo>.xlsx
```

Estos archivos **no se versionan** (ver `.gitignore`) y son de solo lectura: nunca se modifican.
El script `npm run excel:perfil -- excels-origen/<slug>/<archivo>.xlsx <slug>` genera el perfil y los datos en `data/<slug>/`.
