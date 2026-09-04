# Copias de seguridad de MS Fútbol Scout

Hasta ahora la nube era la única copia. La app borra su copia local en cada arranque, y las copias
automáticas de Firebase exigen plan de pago. Si alguien vaciaba una colección, no había vuelta atrás.

Con esto tienes una copia diaria en un fichero, fuera de Firebase.

## Preparación (una sola vez)

1. Instala la librería en la carpeta del proyecto:
   ```
   npm install firebase-admin
   ```
2. Descarga una clave de servicio desde la consola de Firebase, en Configuración del proyecto →
   Cuentas de servicio → Generar nueva clave privada.
   **Esa clave abre la base entera: no la subas nunca a GitHub ni la envíes por correo.** Guárdala en
   el ordenador o servidor que hará las copias, y a ser posible con permisos de solo lectura.
3. Indica dónde está:
   ```
   set GOOGLE_APPLICATION_CREDENTIALS=C:\ruta\a\la\clave.json
   ```

## Hacer una copia

```
node tools/export-firestore.js --salida C:\copias\rs-scouting --retencion 30
```

Escribe un fichero por día, con la fecha en el nombre, y borra los que pasen de treinta días.
Al terminar vuelve a leer el fichero que acaba de escribir y cuenta los documentos: si algo hubiera
salido mal, avisa en vez de dar por buena una copia vacía.

Para automatizarlo a diario, en Windows se programa con el Programador de tareas y en un servidor
Linux con `cron`.

## Ver qué hay dentro de una copia

```
node tools/export-firestore.js --verificar C:\copias\rs-scouting\rs-scouting-2026-09-03.json
```

Muestra la fecha y cuántos documentos hay en cada colección.

## Recuperar datos

Primero en modo simulación, que no escribe nada:

```
node tools/export-firestore.js --restaurar <fichero> --coleccion jugadores --dry-run
```

Si lo que dice es lo que esperas, repite el comando **sin** `--dry-run`.

Se restaura una colección cada vez, a propósito: así una recuperación puntual no arrastra el resto de
la base. La restauración combina, no borra: los documentos que existan se actualizan con los de la
copia, y los que no existan se crean.

## Qué se copia

Las veintiuna colecciones que usa la app: jugadores, clubes, equipos, federaciones, selecciones,
convocatorias, torneos, cuerpo técnico, agencias, agentes, estadios, partidos, informes, agenda y sus
categorías, enlaces, calendarios de la cartelera, notas y las dos de configuración.

Hay una prueba automática que compara esa lista con las colecciones que el código usa de verdad: si
algún día la app añade una colección nueva y nadie la incluye aquí, la prueba lo dice.

## Lo que esto no es

No sustituye a la copia manual desde la propia app (Configuración → Guardar copia en archivo local).
Esa la puedes hacer tú en cualquier momento y no necesita nada instalado.
