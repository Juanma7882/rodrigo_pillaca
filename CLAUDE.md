# rodrigo_pillaca

## Flujo de trabajo

- **OpenSpec** (spec-driven, artefactos en español): todo cambio no trivial empieza con `/opsx:propose "<idea>"`, se implementa con `/opsx:apply` y se cierra con `/opsx:archive`. Specs vigentes en `openspec/specs/`, cambios en curso en `openspec/changes/`.
- **codebase-memory-mcp**: usar sus herramientas (`search_graph`, `trace_path`, `get_code_snippet`, `get_architecture`) antes que grep para explorar código. Reindexar con `index_repository` tras cambios grandes.
- **engram**: al iniciar sesión, `mem_context`; guardar decisiones, bugs y convenciones con `mem_save`; cerrar con `mem_session_summary`. Proyecto engram: `rodrigo_pillaca`.
