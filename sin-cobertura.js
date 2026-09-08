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

  // Para las pruebas: poder mirar el aviso sin depender de los eventos del navegador.
  window.RSConexion = { sinConexion: sinConexion, conConexion: conConexion, ocultar: ocultar };
})();
