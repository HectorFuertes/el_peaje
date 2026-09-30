# El Peaje — Reglas del juego

## 1. Baraja

El juego utiliza inicialmente una baraja española de 40 cartas.

Palos:
- Oros
- Copas
- Espadas
- Bastos

Valores:
- As = 1
- 2 = 2
- 3 = 3
- 4 = 4
- 5 = 5
- 6 = 6
- 7 = 7
- Sota = 10
- Caballo = 11
- Rey = 12

No se utilizan ochos ni nueves.

## 2. Preparación

Al comenzar una partida se baraja el mazo y se colocan cinco cartas, de izquierda a derecha, formando cinco posiciones.

Las posiciones 1, 2, 4 y 5 se muestran boca arriba.

La posición 3 permanece boca abajo y es la carta central o "peaje".

Las cartas restantes forman el mazo de robo.

Cada posición visible funciona como un montón. Las nuevas cartas que se roban para esa posición se colocan encima de las anteriores y se convierten en su nueva carta de referencia.

## 3. Jugadores y turnos

Antes de empezar puede introducirse una lista de jugadores.

Se mantiene un jugador activo.

Cuando un jugador acierta una pregunta, el turno pasa al siguiente jugador.

Cuando un jugador falla una pregunta, ese mismo jugador continúa jugando después de aplicar la penalización y el retroceso correspondiente.

Al llegar al último jugador de la lista, el siguiente turno vuelve al primero.

Cruzar el peaje de la posición 3 no constituye una pregunta y, por tanto, no provoca por sí mismo un cambio adicional de jugador.

## 4. Posición 1 — Mayor o menor

Se muestra la carta superior del montón 1.

El jugador debe elegir si la siguiente carta será:

- Mayor
- Menor

Después de elegir se pulsa "Sacar carta" y se roba una carta del mazo.

La carta robada se coloca encima del montón 1 y pasa a ser la nueva carta visible de referencia.

Si la predicción es correcta:
- Se avanza a la posición 2.
- El turno pasa al siguiente jugador.

Si la predicción es incorrecta:
- Se muestra "¡Bebes x1!".
- Se permanece en la posición 1.
- El mismo jugador continúa.

Si la carta tiene exactamente el mismo valor que la anterior:
- No se considera acierto ni fallo.
- La carta se coloca igualmente sobre el montón.
- Se vuelve a sacar otra carta.
- El jugador y la posición no cambian.

## 5. Posición 2 — Mayor o menor

Funciona igual que la posición 1.

Si la predicción es correcta:
- El turno pasa al siguiente jugador.
- Se cruza la posición 3 o peaje.
- Se muestra "¡Bebes x1!" por cruzar el peaje.
- Se continúa en la posición 4.

Si la predicción es incorrecta:
- Se muestra "¡Bebes x1!".
- Se vuelve a la posición 1.
- El mismo jugador continúa.

Si sale una carta del mismo valor:
- No se considera acierto ni fallo.
- Se coloca sobre el montón.
- Se roba otra carta.
- El jugador y la posición no cambian.

## 6. Posición 3 — El peaje

La tercera carta permanece boca abajo durante la partida.

No se realiza ninguna pregunta en esta posición.

Siempre que el recorrido atraviesa esta posición se muestra:

"¡Bebes x1!"

Después se continúa automáticamente hacia la posición 4.

La carta central no se revela hasta el final del juego.

## 7. Posición 4 — Par o impar

Se muestra la carta superior del montón 4.

El jugador debe elegir:

- Par
- Impar

Después se roba una nueva carta y se coloca encima del montón 4.

Para determinar si una carta es par o impar se utiliza su valor numérico:

- As = 1 → impar
- Sota = 10 → par
- Caballo = 11 → impar
- Rey = 12 → par

Si el jugador acierta:
- Se avanza a la posición 5.
- El turno pasa al siguiente jugador.

Si falla:
- Se paga el peaje y además se penaliza el fallo.
- Se muestra "¡Bebes x2!".
- Se vuelve a la posición 2.
- El mismo jugador continúa.

## 8. Posición 5 — Palo

Se muestra la carta superior del montón 5.

El jugador debe predecir el palo de la siguiente carta:

- Oros
- Copas
- Espadas
- Bastos

Después se roba una carta y se coloca encima del montón 5.

Si el jugador falla:
- Se muestra "¡Bebes x1!".
- Se vuelve a la posición 4.
- El mismo jugador continúa.

Si el jugador acierta:
- Se supera la posición 5.
- El turno pasa al siguiente jugador.
- Se pasa a la pregunta final.

## 9. Pregunta final — Carta central

El jugador debe adivinar exactamente cuál es la carta central que permanece boca abajo.

Debe indicar tanto:

- Valor.
- Palo.

Por ejemplo:

"7 de Copas"

Después de realizar la elección se da la vuelta a la carta central.

Si coincide exactamente con la respuesta:
- Se muestra que el grupo ha ganado.

Si no coincide:
- Se muestra que el grupo ha perdido.

En ambos casos la partida termina y aparece la opción:

"Volver a jugar"

## 10. Agotamiento del mazo

Las cartas robadas no regresan inmediatamente al mazo.

Cada nueva carta permanece encima del montón correspondiente.

Si el mazo de robo se queda sin cartas:

- Se conserva la carta central boca abajo.
- Se conserva la carta superior actual de los montones 1, 2, 4 y 5.
- Todas las cartas que hayan quedado debajo de esas cartas superiores se recogen.
- Las cartas recogidas se barajan.
- Esas cartas forman un nuevo mazo de robo.

La posición actual, el jugador actual y el estado de la partida no cambian durante este proceso.

## 11. Flujo de interacción

Las respuestas y el robo de cartas deben ser acciones separadas.

Ejemplo:

1. El jugador pulsa "Mayor".
2. La elección queda registrada.
3. Aparece o se habilita el botón "Sacar carta".
4. El jugador pulsa "Sacar carta".
5. Se revela la nueva carta.
6. Se determina el resultado.
7. Se muestra la penalización o se avanza a la siguiente posición.

La primera versión del juego debe priorizar que las reglas funcionen correctamente antes de añadir animaciones, sonidos o diseño avanzado.
