# Skill Registry - finansystem

> Registry de skills disponibles para este proyecto. Se actualiza automáticamente con `sdd-init`.

## Skills Disponibles

| Skill | Descripción | Trigger |
|-------|-------------|---------|
| **sdd-init** | Inicializa SDD en el proyecto | "sdd init", "iniciar sdd" |
| **sdd-onboard** | Guía el workflow completo de SDD | Onboarding de usuario |
| **sdd-propose** | Crea propuesta de cambio | "sdd propose <nombre>" |
| **sdd-spec** | Escribe especificaciones | Fase de especificación |
| **sdd-design** | Crea documento técnico | Fase de diseño |
| **sdd-tasks** | Descompone en tareas | Fase de tasks |
| **sdd-apply** | Implementa el código | Fase de implementación |
| **sdd-verify** | Valida contra specs | Fase de verificación |
| **sdd-archive** | Archive completed change | Fase de archivo |
| **go-testing** | Patrones de testing en Go | Tests en Go |
| **skill-creator** | Crea nuevos skills | Crear skills |
| **skill-registry** | Actualiza este registry | "update skills" |
| **branch-pr** | Flujo de PRs | Crear PR |
| **issue-creation** | Flujo de issues | Crear issue |
| **judgment-day** | Revisión adversaria | "judgment day" |

## Project Conventions

> Por definir - el proyecto aún no tiene código

## Agent Skills

Los skills de mi configuración personal están disponibles automáticamente según el contexto:
- `go-testing` se carga cuando detecto código Go o tests
- `skill-creator` se carga cuando me pedís crear un nuevo skill

## Notas

- Este es un proyecto nuevo (solo tiene PRD)
- Las convenciones de código se definirán al comenzar el desarrollo
- Las testing capabilities se detectarán automáticamente cuando haya código

---

*Generated: 2026-04-28*