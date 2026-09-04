/* =============================================================
   MS FÚTBOL SCOUT · Puerta de acceso (Firebase Authentication)
   -------------------------------------------------------------
   - Muestra la pantalla de acceso hasta que hay una sesión válida.
   - Solo entran usuarios creados en la consola de Firebase (no hay
     registro público) y autorizados en las reglas de Firestore.
   - Expone window.RSAuth = { ready, user, signOut } para que app.js
     no arranque las escuchas de Firestore sin sesión iniciada.
   - Se carga DESPUÉS de firebase-config.js y ANTES de app.js.

   Esta pantalla es la parte visible; la protección real de los datos
   está en firestore.rules (el servidor rechaza cualquier petición
   sin sesión autorizada, aunque alguien salte esta pantalla).

   PUESTA EN MARCHA SIN CORTES
   La puerta solo se cierra cuando el acceso está ACTIVADO en el
   proyecto: existe el documento `configuracion/puerta` con el campo
   `activada: true`, o bien las reglas del servidor ya exigen sesión.
   Mientras no sea así, la aplicación entra como siempre y muestra un
   aviso discreto. Así el código se puede publicar antes de crear las
   cuentas, sin dejar a nadie fuera, y la puerta se cierra sola en
   cuanto se completa la activación. Ver RUNBOOK de despliegue.
   ============================================================= */
(function () {
  'use strict';

  const MENSAJES = {
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/missing-password': 'Escribe la contraseña.',
    'auth/user-not-found': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
    'auth/user-disabled': 'Este usuario está desactivado. Habla con el administrador de la app.',
    'auth/too-many-requests': 'Demasiados intentos seguidos. Espera unos minutos o restablece la contraseña.',
    'auth/network-request-failed': 'Sin conexión. Comprueba internet e inténtalo de nuevo.',
    'auth/configuration-not-found': 'El acceso todavía no está activado en Firebase (Authentication → Email/Contraseña).',
    'auth/operation-not-allowed': 'El acceso por correo y contraseña no está activado en Firebase.'
  };

  // Marca local: una vez vista la puerta activada, un fallo de red ya no la vuelve a abrir.
  const MARCA_ACTIVADA = 'rs_puerta_vista_activada';

  function mensajeDe(err) {
    const code = err && err.code;
    return MENSAJES[code] || ('No se ha podido iniciar sesión (' + (code || 'error desconocido') + ').');
  }

  const $ = (id) => document.getElementById(id);

  let readyResolve;
  const ready = new Promise((resolve) => { readyResolve = resolve; });
  const RSAuth = { ready: ready, user: null, signOut: null, modo: null };
  window.RSAuth = RSAuth;

  function mostrarPuerta(visible, estado) {
    const gate = $('authGate');
    if (!gate) return;
    gate.classList.toggle('hidden', !visible);
    if (estado) gate.dataset.state = estado;
    document.body.classList.toggle('rs-auth-pending', visible);
  }

  function pintarAviso(texto, tipo) {
    const box = $('authGateMsg');
    if (!box) return;
    box.textContent = texto || '';
    box.classList.remove('is-error', 'is-info');
    if (texto) box.classList.add(tipo === 'info' ? 'is-info' : 'is-error');
    box.classList.toggle('hidden', !texto);
  }

  function pintarUsuario(user) {
    const chip = $('headerUserEmail');
    if (chip) chip.textContent = user ? (user.email || '') : '';
    const btn = $('btnHeaderLogout');
    if (btn) btn.classList.toggle('hidden', !user);
  }

  // Aviso discreto en la cabecera mientras el acceso no esté activado.
  function pintarTransitoria() {
    const chip = $('headerUserEmail');
    if (chip) {
      chip.textContent = 'Acceso sin contraseña · pendiente de activar';
      chip.title = 'La aplicación entra sin contraseña hasta que se active el acceso por usuario.';
    }
    const btn = $('btnHeaderLogout');
    if (btn) btn.classList.add('hidden');
  }

  function ocupado(estado) {
    const btn = $('btnAuthLogin');
    if (!btn) return;
    btn.disabled = estado;
    btn.textContent = estado ? 'Entrando…' : 'Entrar';
  }

  function cuandoElDomEsteListo(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // --- ¿Está activado el acceso? ---------------------------------------------------------
  // Se pregunta por la API REST de Firestore, no por el SDK: el SDK no puede usarse antes de
  // que app.js active la persistencia local (fallaría con «failed-precondition»), y esto tiene
  // que decidirse antes de que arranque nada.
  //   200 con activada:true → activada · 200 sin ese campo o 404 → transitoria
  //   401/403 (las reglas ya exigen sesión) → activada
  //   sin respuesta → lo último que se vio; si nunca se vio activada, transitoria
  function comprobarPuerta(config) {
    const vistaActivada = (function () { try { return localStorage.getItem(MARCA_ACTIVADA) === '1'; } catch (e) { return false; } })();
    if (!config || !config.projectId || !config.apiKey || typeof fetch !== 'function') {
      return Promise.resolve(vistaActivada ? 'activada' : 'transitoria');
    }
    // Se usa batchGet y no una lectura directa: un documento que no existe responde 200 con
    // «missing» en vez de 404, y así no queda un error rojo en la consola en cada carga mientras
    // el acceso no esté activado.
    const base = 'projects/' + config.projectId + '/databases/(default)';
    const url = 'https://firestore.googleapis.com/v1/' + base + '/documents:batchGet?key=' + encodeURIComponent(config.apiKey);
    const cuerpo = JSON.stringify({ documents: [base + '/documents/configuracion/puerta'] });
    const controlador = (typeof AbortController === 'function') ? new AbortController() : null;
    const temporizador = controlador ? setTimeout(function () { controlador.abort(); }, 6000) : null;

    return fetch(url, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: cuerpo,
      signal: controlador ? controlador.signal : undefined })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) return 'activada';
        if (!r.ok) return vistaActivada ? 'activada' : 'transitoria';
        return r.json().then(function (lista) {
          const primero = (Array.isArray(lista) && lista[0]) || {};
          if (!primero.found) return 'transitoria';                       // «missing»: aún no existe
          const campos = primero.found.fields || {};
          const activada = campos.activada && campos.activada.booleanValue === true;
          return activada ? 'activada' : 'transitoria';
        }).catch(function () { return vistaActivada ? 'activada' : 'transitoria'; });
      })
      .catch(function () { return vistaActivada ? 'activada' : 'transitoria'; })
      .then(function (modo) {
        if (temporizador) clearTimeout(temporizador);
        if (modo === 'activada') { try { localStorage.setItem(MARCA_ACTIVADA, '1'); } catch (e) { /* nada */ } }
        return modo;
      });
  }

  // --- Sin SDK de Auth ------------------------------------------------------------------
  // Con la puerta activada no hay forma de proteger los datos y se queda cerrada. Mientras esté
  // en transitoria, la aplicación entra igual que antes de existir esta pantalla.
  if (typeof firebase === 'undefined' || typeof firebase.auth !== 'function') {
    comprobarPuerta(window.RS_FIREBASE_CONFIG).then(function (modo) {
      RSAuth.modo = modo;
      cuandoElDomEsteListo(function () {
        if (modo === 'transitoria') {
          mostrarPuerta(false);
          pintarTransitoria();
          readyResolve(null);
          return;
        }
        mostrarPuerta(true, 'login');
        pintarAviso('No se ha podido cargar el sistema de acceso. Recarga la página con conexión a internet.', 'error');
      });
    });
    return;
  }

  if (!firebase.apps.length) {
    if (!window.RS_FIREBASE_CONFIG) {
      cuandoElDomEsteListo(() => {
        mostrarPuerta(true, 'login');
        pintarAviso('Falta firebase-config.js: no se puede conectar con el proyecto.', 'error');
      });
      return;
    }
    firebase.initializeApp(window.RS_FIREBASE_CONFIG);
  }

  const auth = firebase.auth();
  auth.languageCode = 'es'; // correos de restablecimiento en español

  // Borra a mano las bases de IndexedDB de Firebase. Último recurso cuando clearPersistence() no puede.
  async function borrarBasesFirebase() {
    if (typeof indexedDB === 'undefined') return false;
    // Firefox y Safari antiguo no ofrecen indexedDB.databases(). Sin ella no hay forma de saber
    // qué bases existen, así que no se puede AFIRMAR que se ha limpiado: se devuelve false.
    if (typeof indexedDB.databases !== 'function') return false;
    try {
      const bases = (await indexedDB.databases()) || [];
      const nuestras = bases.filter(b => b.name && (b.name.indexOf('firestore') === 0 || b.name.indexOf('firebase') === 0));
      await Promise.all(nuestras.map(b => new Promise(res => {
        const p = indexedDB.deleteDatabase(b.name);
        p.onsuccess = p.onerror = p.onblocked = res;
      })));
      return nuestras.length > 0;   // si no había ninguna que borrar, no se afirma haber limpiado
    } catch (e) {
      console.warn('No se pudieron borrar las bases locales:', e);
      return false;
    }
  }

  RSAuth.signOut = async function () {
    try { await auth.signOut(); } catch (e) { console.warn('Error al cerrar sesión:', e); }

    // Vaciar la caché local de Firestore: en un dispositivo compartido no deben quedar datos.
    // clearPersistence() falla con 'failed-precondition' si hay OTRA pestaña con la app abierta
    // (la persistencia va con synchronizeTabs), así que el fallo NO puede pasar desapercibido.
    let limpio = false;
    try {
      if (typeof firebase.firestore === 'function') {
        const db = firebase.firestore();
        await db.terminate();
        await db.clearPersistence();
        limpio = true;
      } else {
        limpio = true; // sin Firestore no hay caché que borrar
      }
    } catch (e) { console.warn('No se pudo vaciar la caché local de Firestore:', e); }

    if (!limpio) limpio = await borrarBasesFirebase();

    // El borrador del informe vive en el almacenamiento del navegador y sobrevive siete días.
    // En un dispositivo compartido, el siguiente en entrar vería el informe a medio escribir del
    // anterior, con datos de un menor. Se retira siempre, incluso si lo demás no se pudo limpiar.
    try {
      if (window.RSBorrador && typeof window.RSBorrador.descartar === 'function') window.RSBorrador.descartar();
    } catch (e) { /* nada que hacer */ }
    try { localStorage.removeItem('rs_scouting_collapsed_groups'); } catch (e) { /* nada que hacer */ }

    if (!limpio) {
      pintarAviso('Se ha cerrado la sesión, pero NO se han podido borrar los datos guardados en este dispositivo. Cierra las demás pestañas de la app y vuelve a pulsar «Cerrar sesión».', 'error');
      mostrarPuerta(true, 'login');
      return; // no se recarga: el usuario tiene que actuar
    }
    window.location.reload();
  };

  // El estado de la sesión y el modo de la puerta llegan por caminos distintos y en cualquier
  // orden; la decisión de cerrar la puerta espera a tener los dos.
  const puertaLista = comprobarPuerta(window.RS_FIREBASE_CONFIG).then(function (modo) {
    RSAuth.modo = modo;
    return modo;
  });

  let huboSesion = false;
  auth.onAuthStateChanged((user) => {
    RSAuth.user = user || null;
    if (user) {
      huboSesion = true;
      pintarUsuario(user);
      mostrarPuerta(false);
      pintarAviso('');
      readyResolve(user);
      return;
    }
    puertaLista.then(function (modo) {
      if (modo === 'transitoria') {
        // Acceso aún no activado: se entra como siempre, con el aviso en la cabecera.
        cuandoElDomEsteListo(function () { mostrarPuerta(false); pintarTransitoria(); });
        readyResolve(null);
        return;
      }
      pintarUsuario(null);
      if (huboSesion) {
        // La sesión se ha perdido con la app abierta (cierre en otra pestaña, usuario desactivado,
        // token revocado). Tapar con el overlay no basta: los datos siguen en el DOM y en memoria,
        // así que hay que recargar. Pero recargar de golpe se lleva por delante lo que el usuario
        // tuviera a medias, así que primero se avisa y se le dan unos segundos.
        if (typeof window.showToast === 'function') {
          window.showToast('Se ha cerrado tu sesión. La app se va a recargar: vuelve a entrar para seguir trabajando.', 'danger', 6000);
        }
        mostrarPuerta(true, 'login');
        setTimeout(function () { window.location.reload(); }, 5000);
      } else {
        mostrarPuerta(true, 'login');
      }
    });
  });

  cuandoElDomEsteListo(() => {
    const form = $('authGateForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        pintarAviso('');
        const email = ($('authEmail').value || '').trim().toLowerCase();
        const pass = $('authPassword').value || '';
        if (!email || !pass) { pintarAviso('Escribe tu correo y tu contraseña.', 'error'); return; }
        ocupado(true);
        try {
          await auth.signInWithEmailAndPassword(email, pass);
          // onAuthStateChanged abre la app
        } catch (err) {
          console.warn('Inicio de sesión rechazado:', err && err.code);
          pintarAviso(mensajeDe(err), 'error');
        } finally {
          ocupado(false);
        }
      });
    }

    const forgot = $('btnAuthForgot');
    if (forgot) {
      forgot.addEventListener('click', async () => {
        const email = ($('authEmail').value || '').trim().toLowerCase();
        if (!email) { pintarAviso('Escribe tu correo y vuelve a pulsar «¿Has olvidado la contraseña?».', 'error'); return; }
        try {
          await auth.sendPasswordResetEmail(email);
        } catch (err) {
          // NUNCA revelar si la cuenta existe: 'auth/user-not-found' aquí convertiría esta pantalla
          // en un buscador de correos dados de alta. Solo se muestran errores que no dicen nada.
          const codigo = err && err.code;
          if (codigo === 'auth/invalid-email' || codigo === 'auth/too-many-requests' ||
              codigo === 'auth/network-request-failed' || codigo === 'auth/configuration-not-found' ||
              codigo === 'auth/operation-not-allowed') {
            pintarAviso(mensajeDe(err), 'error');
            return;
          }
          console.warn('Restablecer contraseña:', codigo);
        }
        // Mismo mensaje exista o no la cuenta.
        pintarAviso('Si el correo existe, recibirás un enlace para restablecer la contraseña.', 'info');
      });
    }

    const logout = $('btnHeaderLogout');
    if (logout) logout.addEventListener('click', () => RSAuth.signOut());
  });
})();
