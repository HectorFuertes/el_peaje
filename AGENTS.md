# AGENTS.md

## Proyecto

Este repositorio contiene "El Peaje", un juego de cartas para fiestas.

La aplicación debe estar orientada principalmente a teléfonos móviles y desarrollada como una aplicación web.

## Tecnologías

Usar:

- React
- TypeScript
- Vite
- Oxlint

Evitar añadir dependencias nuevas salvo que sean realmente necesarias.

No añadir backend, base de datos ni servicios externos salvo que se solicite explícitamente.

## Reglas del juego

Las reglas oficiales del juego están definidas en:

`GAME_RULES.md`

Cuando una tarea afecte a la lógica del juego, consultar ese archivo.

No modificar las reglas del juego sin autorización explícita.

## Arquitectura

Mantener separadas:

- La lógica del juego.
- La representación visual.
- El estado de la interfaz.

La lógica principal del juego debe poder probarse sin necesidad de renderizar componentes React.

Preferir funciones pequeñas, nombres claros y tipos TypeScript explícitos para las estructuras importantes.

## Estructura prevista

La lógica del juego debe vivir principalmente dentro de:

`src/game/`

Los componentes visuales deben vivir principalmente dentro de:

`src/components/`

No es obligatorio crear toda esta estructura desde el principio. Crear solo lo necesario para la tarea actual.

## Desarrollo

Priorizar primero:

1. Corrección de las reglas.
2. Tests.
3. Interfaz funcional.
4. Diseño responsive.
5. Animaciones y mejoras visuales.

No implementar funcionalidades futuras si no forman parte de la tarea solicitada.

## Verificación

Después de cambios relevantes:

- Ejecutar los tests relacionados.
- Ejecutar el linter.
- Ejecutar el build cuando corresponda.

No afirmar que una tarea funciona si no se ha comprobado cuando exista una forma razonable de hacerlo.

## Git

No realizar `git push` automáticamente.

No usar `git push --force`.

No modificar la configuración global de Git.

No borrar historial ni commits existentes salvo petición explícita.

## Seguridad

Trabajar únicamente dentro del repositorio salvo que una tarea requiera otra cosa.

No ejecutar comandos destructivos sin necesidad.

No borrar archivos que no estén relacionados con la tarea actual.
