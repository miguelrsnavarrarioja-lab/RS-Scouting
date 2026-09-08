/* MS Fútbol Scout · aviso de conexión y cola de subida
   ---------------------------------------------------------------------------
   Dos cosas, las dos para el trabajo en el campo:

   1. Registra el guardián que deja abrir la aplicación sin cobertura (sw.js).
   2. Dice en pantalla lo que está pasando, que es lo que de verdad tranquiliza: si estás sin
      conexión, si quedan cambios por subir, y cuándo ha subido todo.

   Los datos ya se guardaban solos sin red —Firestore mantiene una cola en el propio teléfono y la
   envía al recuperar la señal—, pero eso ocurría en silencio: no había forma de saber si lo que
   habías escrito en la banda estaba a salvo. Ahora se ve.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  // ---------- 1 · El guardián que permite abrir sin cobertura ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (e) {
        console.warn('No se ha podido preparar el uso sin cobertura:', e && e.message);
      });
    });
  }

  // ---------- 2 · El aviso ----------
  var caja = null;

  function pintar(texto, tono) {
    if (!caja) {
      caja = document.createElement('div');
      caja.id = 'avisoConexion';
      caja.setAttribute('role', 'status');
      caja.setAttribute('aria-live', 'polite');
      caja.style.cssText = [
        'position: fixed', 'left: 50%', 'transform: translateX(-50%)', 'bottom: 16px',
        'z-index: 30000', 'padding: 10px 16px', 'border-radius: 999px',
        'font: 600 13px/1.3 system-ui, -apple-system, sans-serif',
        'box-shadow: 0 6px 20px rgba(15, 23, 42, .18)', 'max-width: calc(100vw - 32px)',
        'text-align: center', 'transition: opacity .2s ease'
      ].join(';');
      document.body.appendChild(caja);
    }
    var colores = {
      sin: ['#fef3c7', '#92400e'],      // ámbar: sin conexión
      subiendo: ['#dbeafe', '#1e40af'], // azul: enviando
      hecho: ['#dcfce7', '#166534']     // verde: todo a salvo
    }[tono] || ['#e2e8f0', '#334155'];
    caja.style.background = colores[0];
    caja.style.color = colores[1];
    caja.textContent = texto;
    caja.style.opacity = '1';
    caja.hidden = false;
  }

  function ocultar() {
    if (!caja) return;
    caja.style.opacity = '0';
    setTimeout(function () { if (caja) caja.hidden = true; }, 250);
  }

  /** ¿Quedan cambios sin subir? Firestore lo sabe; si no puede decirlo, no se inventa nada. */
  function esperarASubirTodo() {
    try {
      var db = window.firebase && window.firebase.firestore && window.firebase.firestore();
      if (db && typeof db.waitForPendingWrites === 'function') return db.waitForPendingWrites();
    } catch (e) { /* se sigue sin ello */ }
    return null;
  }

  function sinConexion() {
    pintar('Sin conexión. Lo que hagas se guarda en el móvil y se subirá solo al recuperar cobertura.', 'sin');
  }

  function conConexion() {
    var espera = esperarASubirTodo();
    if (!espera) { ocultar(); return; }
    pintar('Conexión recuperada. Subiendo lo que quedó pendiente…', 'subiendo');
    espera.then(function () {
      pintar('Listo: todo lo que hiciste sin cobertura está subido.', 'hecho');
      setTimeout(ocultar, 4000);
    }).catch(function () {
      pintar('Conexión recuperada.', 'subiendo');
      setTimeout(ocultar, 3000);
    });
  }

  window.addEventListener('offline', sinConexion);
  window.addEventListener('online', conConexion);

  document.addEventListener('DOMContentLoaded', function () {
    if (!navigator.onLine) sinConexion();
  });

  // ---------- 3 · Que el teclado no tape lo que se está escribiendo ----------
  //
  // En un teléfono, el teclado ocupa más o menos la mitad inferior de la pantalla. Si el campo que
  // se acaba de tocar está en esa mitad, se escribe a ciegas. Medido en el editor de informes: 21
  // de 25 campos quedaban ahí abajo al enfocarlos.
  //
  // Solo actúa en pantallas de móvil y solo si el campo está en la zona baja: si el navegador ya lo
  // ha subido —Safari suele hacerlo—, aquí no se toca nada.
  var ES_CAMPO = /^(INPUT|TEXTAREA|SELECT)$/;
  var HUECO = 'rs-hueco-teclado';
  var quitarHueco = null;

  // Los últimos campos del formulario no se pueden subir: la página ya está en su tope y no queda
  // recorrido. Mientras se escribe se añade espacio al final para que siempre lo haya; se retira al
  // salir del último campo. Medido: sin esto, los dos últimos campos del informe quedaban a 487 y
  // 686 px, de lleno bajo el teclado.
  function abrirHueco() {
    if (quitarHueco) { clearTimeout(quitarHueco); quitarHueco = null; }
    document.body.classList.add(HUECO);
  }

  function cerrarHueco() {
    quitarHueco = setTimeout(function () {
      var a = document.activeElement;
      if (a && ES_CAMPO.test(a.tagName)) return;         // se ha saltado a otro campo: sigue abierto
      document.body.classList.remove(HUECO);
      quitarHueco = null;
    }, 250);
  }

  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (!el || !ES_CAMPO.test(el.tagName)) return;
    if (window.innerWidth > 767) return;                 // en el ordenador no hay teclado que tape
    if (el.type === 'hidden' || el.readOnly) return;
    abrirHueco();                                        // antes de mover: si no, no hay adónde
    // Se espera a que el teclado empiece a subir; si no, se mide la pantalla de antes.
    setTimeout(function () {
      if (document.activeElement !== el) return;
      var caja = el.getBoundingClientRect();
      if (caja.top > window.innerHeight * 0.55) {
        try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        catch (err) { el.scrollIntoView(); }
      }
    }, 180);
  });

  document.addEventListener('focusout', function (e) {
    if (!e.target || !ES_CAMPO.test(e.target.tagName)) return;
    if (window.innerWidth > 767) return;
    cerrarHueco();
  });

  // Para las pruebas: poder mirar el aviso sin depender de los eventos del navegador.
  window.RSConexion = { sinConexion: sinConexion, conConexion: conConexion, ocultar: ocultar };
})();
