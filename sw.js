/* MS Fútbol Scout · trabajar sin cobertura
   ---------------------------------------------------------------------------
   Guarda la aplicación en el teléfono para que ABRA aunque no haya red. Los datos ya se apañaban
   solos —Firestore guarda en el móvil lo que escribes y lo sube al recuperar la conexión—, pero el
   programa se descargaba en cada visita: sin cobertura, al abrirla salía la pantalla de error del
   navegador.

   Dos reglas, y el orden importa:

   - La PÁGINA (index.html) se pide siempre a la red primero. Si hay conexión, se ve la versión
     nueva aunque el teléfono tenga guardada la vieja. Solo si la red falla se usa la copia. Así no
     puede pasar lo peor de una caché: quedarse pegado a una versión antigua sin saberlo.
   - Los FICHEROS con número de versión (app.js?v=…) se sirven de la copia guardada, porque cada
     versión es una dirección distinta: cuando se publica una nueva, su dirección cambia y se
     descarga sola. Las versiones viejas se borran al activarse esta.

   Lo que NO se guarda nunca: las llamadas a la base de datos. De eso se encarga Firestore, que
   tiene su propia cola de envío. Guardarlas aquí sería duplicar el trabajo y arriesgar datos.
   --------------------------------------------------------------------------- */

const VERSION = 'ms-scout-v2';
const ESENCIALES = [
  './',
  './index.html',
  './manifest.json',
  './Logo MS.png',
  './Logo MS 2.png',
  // Los ficheros del programa se guardan SIN el número de versión. Al pedirlos, el HTML les añade
  // uno (app.js?v=…) y esa dirección no estaría guardada todavía: por eso, si no se encuentra la
  // dirección exacta, se busca la misma ruta sin el número. Con red siempre gana la versión nueva.
  './app.js', './auth.js', './styles.css', './firebase-config.js', './toast.js',
  './data-guard.js', './importer_v2.js', './informe-borrador.js', './calendario-export.js',
  './sin-cobertura.js'
];

/* Las librerías de terceros van fijadas a una versión concreta, así que se pueden guardar. */
const EXTERNAS = /^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com|www\.gstatic\.com\/firebasejs|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

/* Nunca se guarda: la base de datos y todo lo que sea una llamada de datos en vivo. */
const NUNCA = /firestore\.googleapis\.com|identitytoolkit|securetoken|googleapis\.com\/.*\/documents/;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Una a una: si falta un fichero, no se cae la instalación entera.
    await Promise.all(ESENCIALES.map((u) => cache.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const nombre of await caches.keys()) {
      if (nombre !== VERSION) await caches.delete(nombre);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (NUNCA.test(url.href)) return;                       // la base de datos, a su aire
  if (url.origin !== self.location.origin && !EXTERNAS.test(url.href)) return;

  const esPagina = req.mode === 'navigate' || (req.destination === 'document');

  if (esPagina) {
    // La página: primero la red, y la copia solo como red de seguridad.
    e.respondWith((async () => {
      try {
        const respuesta = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put('./index.html', respuesta.clone()).catch(() => {});
        return respuesta;
      } catch (err) {
        const guardada = await caches.match('./index.html');
        return guardada || new Response(
          '<meta charset="utf-8"><p style="font:16px system-ui;padding:24px">Sin conexión y sin copia guardada todavía. Abre la aplicación una vez con cobertura.</p>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  // El resto: la copia guardada de ESA MISMA versión si está; si no, la red.
  //
  // El orden importa y costó un fallo: la copia sin número de versión (la que se guarda al instalar)
  // NO puede servir como respuesta cuando hay red. Al publicar una versión nueva, el HTML pide
  // `app.js?v=NUEVA`, esa dirección no está guardada, y devolver la copia vieja dejaba la aplicación
  // congelada en el código de ayer —con el HTML nuevo— para siempre, sin que nadie se enterara.
  // Esa copia es exclusivamente el respaldo de cuando NO hay cobertura.
  e.respondWith((async () => {
    const guardada = await caches.match(req);
    if (guardada) return guardada;
    const propio = url.origin === self.location.origin && url.search;
    try {
      const respuesta = await fetch(req);
      if (respuesta && (respuesta.ok || respuesta.type === 'opaque')) {
        const cache = await caches.open(VERSION);
        cache.put(req, respuesta.clone()).catch(() => {});
        // Y sin el número: así, sin cobertura, se abre con lo ÚLTIMO que se llegó a descargar.
        if (propio) cache.put(url.pathname, respuesta.clone()).catch(() => {});
      }
      return respuesta;
    } catch (err) {
      if (propio) {
        const sinVersion = await caches.match(url.pathname);
        if (sinVersion) return sinVersion;              // sin red: es eso o nada
      }
      return new Response('', { status: 504, statusText: 'sin conexión' });
    }
  })());
});
