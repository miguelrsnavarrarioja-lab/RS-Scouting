/* =============================================================
   MS FÚTBOL SCOUT · Guarda de tamaño de documento
   -------------------------------------------------------------
   Firestore rechaza cualquier documento que pase de 1 MiB. Las fichas guardan la
   foto dentro del propio documento, en base64, así que una foto grande puede
   superar el límite. Cuando eso pasaba, la escritura fallaba, el error se quedaba
   en la consola del navegador y el usuario veía la ficha «guardada»: pérdida de
   datos con aspecto de éxito.

   Este fichero mide el documento ANTES de enviarlo y dice qué campo se ha pasado.
   Se carga antes que app.js. También funciona en Node para los tests.
   ============================================================= */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.RSData = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Firestore cuenta algo más que el JSON (nombres de campo, sobrecarga por documento).
  // Se deja margen: se avisa a partir de 950 KB, no de 1 MiB justo.
  var LIMITE_POR_DEFECTO = 950 * 1024;

  // Si un documento no se puede convertir a JSON (referencias circulares), Firestore tampoco
  // podrá guardarlo. Devolver 0 lo daría por bueno; se devuelve Infinity para que no pase la guarda.
  function bytesDe(valor) {
    var s;
    try { s = JSON.stringify(valor === undefined ? null : valor); } catch (e) { return Infinity; }
    if (typeof s !== 'string') return Infinity;
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length;
    return Buffer.byteLength(s, 'utf8');
  }

  function tamanoDocumento(doc) {
    return bytesDe(doc === null || doc === undefined ? {} : doc);
  }

  /**
   * ¿Cabe el documento? Devuelve además cuál es el campo más pesado, que es el
   * dato que necesita el usuario para saber qué quitar.
   */
  function cabe(doc, limite) {
    var tope = (typeof limite === 'number' && limite > 0) ? limite : LIMITE_POR_DEFECTO;
    var bytes = tamanoDocumento(doc);
    var campoMayor = null, bytesCampoMayor = 0;
    if (doc && typeof doc === 'object' && !Array.isArray(doc)) {
      for (var k in doc) {
        if (!Object.prototype.hasOwnProperty.call(doc, k)) continue;
        var b = bytesDe(doc[k]);
        if (b > bytesCampoMayor) { bytesCampoMayor = b; campoMayor = k; }
      }
    }
    return {
      ok: bytes <= tope, bytes: bytes, limite: tope,
      campoMayor: campoMayor, bytesCampoMayor: bytesCampoMayor,
      medible: isFinite(bytes)
    };
  }

  function kb(bytes) { return Math.round(bytes / 1024); }

  /** Mensaje para el usuario, en su idioma y sin jerga. */
  function motivo(medida) {
    var donde = medida.campoMayor ? ('El campo «' + medida.campoMayor + '» ocupa ' + kb(medida.bytesCampoMayor) + ' KB. ') : '';
    return 'No se ha podido guardar: la ficha ocupa ' + kb(medida.bytes) + ' KB y el máximo son ' +
      kb(medida.limite) + ' KB. ' + donde + 'Prueba con una foto más ligera.';
  }

  return { tamanoDocumento: tamanoDocumento, cabe: cabe, motivo: motivo, LIMITE_POR_DEFECTO: LIMITE_POR_DEFECTO };
});
