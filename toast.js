/* =============================================================
   MS FÚTBOL SCOUT · Avisos flotantes (toasts)
   -------------------------------------------------------------
   La app llamaba a showToast() en 17 sitios y a showNotification() en 4,
   pero ninguna de las dos existía. Las 12 llamadas que no iban protegidas
   con `typeof` rompían la función en curso: al crear o borrar un jugador
   se lanzaba «showToast is not defined» y la línea siguiente, que
   refrescaba la lista, no llegaba a ejecutarse.

   Este fichero las define. Se carga ANTES que app.js.
   API:  showToast(mensaje, tipo, ms)
         tipo: 'info' | 'success' | 'danger' | 'warning'   (por defecto 'info')
         ms:   duración en milisegundos                    (por defecto 3200)
   showNotification es un alias: la app usa los dos nombres para lo mismo.
   ============================================================= */
(function () {
  'use strict';

  var TIPOS = { info: 1, success: 1, danger: 1, warning: 1, error: 1 };
  var contenedor = null;

  function obtenerContenedor() {
    if (contenedor && document.body.contains(contenedor)) return contenedor;
    contenedor = document.getElementById('rsToastContainer');
    if (!contenedor) {
      contenedor = document.createElement('div');
      contenedor.id = 'rsToastContainer';
      contenedor.className = 'rs-toast-container';
      contenedor.setAttribute('aria-live', 'polite');
      contenedor.setAttribute('aria-atomic', 'false');
      document.body.appendChild(contenedor);
    }
    return contenedor;
  }

  function showToast(mensaje, tipo, ms) {
    try {
      var texto = (mensaje === null || mensaje === undefined) ? '' : String(mensaje);
      if (!texto) return null;
      var clase = TIPOS[tipo] ? (tipo === 'error' ? 'danger' : tipo) : 'info';
      var duracion = (typeof ms === 'number' && ms > 0) ? ms : 3200;

      var el = document.createElement('div');
      el.className = 'rs-toast rs-toast-' + clase;
      el.setAttribute('role', clase === 'danger' ? 'alert' : 'status');
      el.textContent = texto; // textContent, nunca innerHTML: el mensaje puede traer datos del usuario

      var caja = obtenerContenedor();
      caja.appendChild(el);
      // Más de cinco a la vez tapan la app: se retira el más antiguo.
      while (caja.children.length > 5) caja.removeChild(caja.firstChild);

      requestAnimationFrame(function () { el.classList.add('is-visible'); });

      var cerrar = function () {
        if (!el.parentNode) return;
        el.classList.remove('is-visible');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
      };
      var temporizador = setTimeout(cerrar, duracion);
      el.addEventListener('click', function () { clearTimeout(temporizador); cerrar(); });

      return el;
    } catch (e) {
      // Un aviso nunca puede tumbar la operación que lo lanzó.
      console.warn('No se pudo mostrar el aviso:', e, mensaje);
      return null;
    }
  }

  window.showToast = showToast;
  window.showNotification = showToast; // la app usa ambos nombres indistintamente
})();
