# Seguridad de MS Fútbol Scout

## Qué protege

- **Inicio de sesión obligatorio** (`auth.js`): la app no se abre ni se conecta a la base de datos hasta que
  hay una sesión válida con correo y contraseña.
- **Reglas de Firestore** (`firestore.rules`): el servidor rechaza cualquier lectura o escritura que no venga de
  un usuario con sesión **y** cuyo correo esté en la lista blanca. Esto es lo que protege de verdad: aunque
  alguien salte la pantalla de acceso, la base de datos no responde.
- **Sin registro público**: los usuarios se crean a mano en la consola de Firebase. La opción «Permitir
  registro» de Authentication debe estar **desactivada**.

Los datos de `firebase-config.js` (apiKey, projectId…) son públicos por diseño y no dan acceso a nada por sí solos.

## Dar acceso a una persona nueva

1. Consola de Firebase → **Authentication → Users → Add user**: su correo y una contraseña provisional
   cualquiera (no hace falta enviársela).
2. **Firestore → configuracion → acceso → emails**: añade su correo **en minúsculas** al array.
3. Pídele que en la pantalla de acceso escriba su correo y pulse **«¿Has olvidado la contraseña?»**: recibirá un
   enlace para poner su propia contraseña.

Para quitar el acceso: borra su correo de `emails` (efecto inmediato) y desactiva o borra el usuario en Authentication.

## Publicar cambios de reglas

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

Comprobación rápida de que la base está cerrada (debe responder **403**, nunca 404 ni 200):

```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://firestore.googleapis.com/v1/projects/rs-scouting-ee0b3/databases/(default)/documents/configuracion?pageSize=1"
```

## Cerrar sesión

El botón de la cabecera cierra la sesión **y borra la copia local** de los datos en ese navegador. Úsalo siempre en
un dispositivo que no sea tuyo.

## Qué no hacer

- No volver a poner `allow read, write: if true;` en las reglas «para probar»: la base queda abierta a todo internet.
- No compartir contraseñas: cada persona con su usuario.
