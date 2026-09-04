/* =============================================================
   MS FÚTBOL SCOUT · Borrador automático del informe
   -------------------------------------------------------------
   El problema: el editor de informes no es una ventana, es un estado dentro de la
   pestaña Partidos. Si cambias de pestaña y vuelves, la app muestra la lista y el
   editor desaparece. Lo escrito seguía en los campos ocultos, sin forma de volver
   a ello, y si recargabas se perdía. Nada se había guardado todavía.

   Lo que hace este fichero:
     · Guarda lo que hay escrito cada pocos segundos, en el propio dispositivo.
     · Lo guarda también al cambiar de pestaña y al cerrar la página.
     · Al volver a abrir el editor, si hay un borrador te ofrece recuperarlo.
     · Enseña «Borrador guardado a las HH:MM» para que se vea que no se pierde nada.

   Por qué en el dispositivo y no en la nube: guardar en la nube cada pocos segundos
   dejaría informes a medias en la base de datos compartida, crearía registros nuevos
   sin terminar y gastaría cuota. El borrador es una red de seguridad; el botón de
   guardar sigue siendo el que publica el informe de verdad.

   Se carga después de app.js.
   ============================================================= */
(function () {
  'use strict';

  var CLAVE = 'RS_BORRADOR_INFORME_V2';
  var CADA_MS = 4000;          // se comprueba cada 4 segundos
  var CADUCA_DIAS = 7;         // un borrador más viejo que esto ya no se ofrece
  var editor, temporizador = null, ultimaFirma = null;

  function el(id) { return document.getElementById(id); }
  function editorAbierto() {
    editor = editor || el('matchReportEditorState');
    return !!editor && !editor.classList.contains('hidden');
  }

  // Solo 41 de los 195 campos del editor tienen identificador: la alineación entera (dorsales,
  // nombres, posiciones y suplentes) se construye sin él. Por eso cada campo se localiza por su
  // RUTA dentro del editor, y se guarda junto a una firma (tipo, clase, texto de ayuda) que se
  // comprueba al recuperar: si la ruta apunta a otro campo distinto, ese valor se descarta en vez
  // de escribirse en el sitio equivocado.
  function esCampo(n) {
    return n && n.type !== 'file' && n.type !== 'button' && n.type !== 'submit' && n.type !== 'reset';
  }

  function firmaDe(n) {
    // Las clases van TODAS y ordenadas, no solo la primera: los desplegables de posición principal
    // y secundaria son «form-control pos …» y «form-control pos2 …», mismo tipo y sin texto de
    // ayuda. Quedándose con la primera clase los dos tenían la misma firma, y la comprobación que
    // debía impedir escribir en el campo equivocado no podía distinguirlos.
    var clases = (n.className || '').trim().split(/\s+/).filter(Boolean).sort().join('.');
    return [n.tagName, n.type || '', clases, n.placeholder || '', n.name || ''].join('|');
  }

  // El anclaje NO puede ser la posición entre hermanos del DOM: al escribir en el nombre de un
  // jugador la aplicación despliega sugerencias, y esos nodos insertados desplazan los índices.
  // Se ancla al contenedor con identificador más cercano y, dentro de él, a la posición del campo
  // entre los que comparten su misma firma. Las sugerencias no alteran ese orden.
  function raizDe(n) {
    var p = n.parentNode;
    while (p && p !== editor && p.tagName) { if (p.id) return p; p = p.parentNode; }
    return editor;
  }

  function camposDe(raiz) {
    var salida = [], nodos = raiz.querySelectorAll('input, textarea, select');
    for (var i = 0; i < nodos.length; i++) if (esCampo(nodos[i])) salida.push(nodos[i]);
    return salida;
  }

  function rutaDe(n) {
    if (n.id) return '#' + n.id;
    var raiz = raizDe(n);
    if (!raiz) return '';
    var f = firmaDe(n), pos = -1, c = 0, lista = camposDe(raiz);
    for (var i = 0; i < lista.length; i++) {
      if (firmaDe(lista[i]) !== f) continue;
      if (lista[i] === n) { pos = c; break; }
      c++;
    }
    if (pos < 0) return '';
    return (raiz === editor ? '@editor' : '#' + raiz.id) + '::' + f + '::' + pos;
  }

  function nodoDeRuta(ruta) {
    if (!editor || !ruta) return null;
    var corte = ruta.indexOf('::');
    if (corte === -1) return ruta.charAt(0) === '#' ? el(ruta.slice(1)) : null;
    var cabeza = ruta.slice(0, corte);
    var resto = ruta.slice(corte + 2);
    var ultimo = resto.lastIndexOf('::');
    if (ultimo === -1) return null;
    var f = resto.slice(0, ultimo);
    var pos = Number(resto.slice(ultimo + 2));
    if (!isFinite(pos) || pos < 0) return null;
    var raiz = cabeza === '@editor' ? editor : el(cabeza.slice(1));
    if (!raiz) return null;
    var lista = camposDe(raiz), c = 0;
    for (var i = 0; i < lista.length; i++) {
      if (firmaDe(lista[i]) !== f) continue;
      if (c === pos) return lista[i];
      c++;
    }
    return null;
  }

  function valorDe(n) { return (n.type === 'checkbox' || n.type === 'radio') ? !!n.checked : n.value; }

  /** Lee los campos del editor que tienen algo escrito. Los vacíos no se guardan: un borrador
      recupera lo escrito, no impone huecos sobre lo que el usuario ya tenga delante. */
  function leerCampos() {
    if (!editor) return null;
    var campos = {};
    var nodos = editor.querySelectorAll('input, textarea, select');
    for (var i = 0; i < nodos.length; i++) {
      var n = nodos[i];
      if (!esCampo(n)) continue;
      var v = valorDe(n);
      if (v === false || v === null || v === undefined) continue;
      if (typeof v === 'string' && v.trim() === '') continue;
      campos[rutaDe(n)] = { v: v, f: firmaDe(n) };
    }
    return campos;
  }

  function hayAlgoEscrito(campos) {
    for (var k in campos) return true;   // leerCampos ya descarta los vacíos
    return false;
  }

  function idInformeActual() {
    // La app expone el informe que se está editando en window.rsInformeEnEdicion(). Es la única
    // fuente fiable: no hay ningún campo oculto en el formulario con ese dato.
    try {
      if (typeof window.rsInformeEnEdicion === 'function') {
        var id = window.rsInformeEnEdicion();
        if (id) return String(id);
      }
    } catch (e) { /* si la app aún no ha arrancado, es un informe nuevo */ }
    return 'nuevo';
  }

  function guardar(motivo) {
    try {
      if (!editorAbierto()) return false;
      var campos = leerCampos();
      if (!hayAlgoEscrito(campos)) return false;
      var firma = JSON.stringify(campos);
      if (firma === ultimaFirma && motivo === 'periodico') return false;  // nada ha cambiado
      ultimaFirma = firma;
      localStorage.setItem(claveDe(idInformeActual()), JSON.stringify({
        version: 1,
        informe: idInformeActual(),
        guardadoEn: new Date().toISOString(),
        campos: campos
      }));
      pintarEstado(new Date());
      return true;
    } catch (e) {
      // Si el almacenamiento está lleno o bloqueado, no se puede hacer nada más que avisar una vez.
      if (!guardar._avisado) {
        guardar._avisado = true;
        if (typeof window.showToast === 'function') {
          window.showToast('No se puede guardar el borrador en este dispositivo. Guarda el informe a mano.', 'warning', 8000);
        }
        console.warn('Borrador no guardado:', e);
      }
      return false;
    }
  }

  /** Cada informe guarda su propio borrador: abrir uno no puede pisar el de otro. */
  function claveDe(id) { return CLAVE + '::' + (id || 'nuevo'); }

  function leerBorrador(id) {
    try {
      var crudo = localStorage.getItem(claveDe(id || idInformeActual()));
      if (!crudo) return null;
      var d = JSON.parse(crudo);
      if (!d || !d.campos) return null;
      var edad = (Date.now() - new Date(d.guardadoEn).getTime()) / 86400000;
      if (!isFinite(edad) || edad > CADUCA_DIAS) return null;
      return d;
    } catch (e) { return null; }
  }

  function borrar(id) {
    try { localStorage.removeItem(claveDe(id || idInformeActual())); } catch (e) { /* nada */ }
    ultimaFirma = null;
    pintarEstado(null);
  }

  /** Los borradores caducados se retiran solos: si no, el almacenamiento se llenaría con el tiempo. */
  function limpiarCaducados() {
    try {
      var fuera = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf(CLAVE) !== 0) continue;
        var edad = Infinity;
        try { edad = (Date.now() - new Date(JSON.parse(localStorage.getItem(k)).guardadoEn).getTime()) / 86400000; }
        catch (e) { /* ilegible: fuera */ }
        if (!isFinite(edad) || edad > CADUCA_DIAS) fuera.push(k);
      }
      fuera.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } });
    } catch (e) { /* si no hay almacenamiento, no hay nada que limpiar */ }
  }

  /** El aviso de «Borrador guardado a las HH:MM», dentro del propio editor. */
  function pintarEstado(cuando) {
    if (!editor) return;
    var caja = el('rsBorradorEstado');
    if (!caja) {
      caja = document.createElement('div');
      caja.id = 'rsBorradorEstado';
      caja.className = 'rs-borrador-estado';
      caja.setAttribute('aria-live', 'polite');
      editor.insertBefore(caja, editor.firstChild);
    }
    if (!cuando) { caja.textContent = ''; caja.classList.add('hidden'); return; }
    var h = String(cuando.getHours()).padStart(2, '0');
    var m = String(cuando.getMinutes()).padStart(2, '0');
    var s = String(cuando.getSeconds()).padStart(2, '0');
    caja.textContent = 'Borrador guardado a las ' + h + ':' + m + ':' + s + ' en este dispositivo';
    caja.classList.remove('hidden');
  }

  function aplicarCampos(campos) {
    var puestos = 0, descartados = 0;
    for (var ruta in campos) {
      var guardado = campos[ruta];
      if (!guardado || typeof guardado !== 'object') continue;   // formato antiguo: se ignora
      var n = nodoDeRuta(ruta);
      if (!n || !esCampo(n)) { descartados++; continue; }
      if (firmaDe(n) !== guardado.f) { descartados++; continue; } // el formulario ya no es el mismo
      if (n.type === 'checkbox' || n.type === 'radio') n.checked = !!guardado.v;
      else n.value = guardado.v;
      n.dispatchEvent(new Event('input', { bubbles: true }));
      n.dispatchEvent(new Event('change', { bubbles: true }));
      puestos++;
    }
    if (descartados) console.warn('Borrador: ' + descartados + ' campos no encajaban en el formulario actual.');
    return puestos;
  }

  /** Al abrir el editor: si hay borrador, se ofrece recuperarlo. */
  function ofrecerRecuperacion() {
    var d = leerBorrador();
    if (!d) return;
    // Si el editor ya trae lo mismo escrito, no hay nada que ofrecer.
    var actuales = leerCampos();
    if (actuales && JSON.stringify(actuales) === JSON.stringify(d.campos)) { ultimaFirma = JSON.stringify(actuales); return; }

    var cuando = new Date(d.guardadoEn);
    var texto = 'Tienes un informe a medio escribir del ' +
      String(cuando.getDate()).padStart(2, '0') + '/' + String(cuando.getMonth() + 1).padStart(2, '0') +
      ' a las ' + String(cuando.getHours()).padStart(2, '0') + ':' + String(cuando.getMinutes()).padStart(2, '0') +
      '. ¿Quieres recuperarlo?';

    var recuperar = function () {
      var n = aplicarCampos(d.campos);
      if (typeof window.showToast === 'function') {
        window.showToast('Informe recuperado: ' + n + ' campos.', 'success', 5000);
      }
      ultimaFirma = JSON.stringify(leerCampos());
    };

    if (typeof window.showCustomConfirmModal === 'function') {
      window.showCustomConfirmModal('Informe sin terminar', texto, recuperar);
    } else if (window.confirm(texto)) {
      recuperar();
    }
  }

  // --- Arranque -------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    editor = el('matchReportEditorState');
    if (!editor) return;
    limpiarCaducados();

    // 1) Guardado periódico mientras el editor esté abierto.
    temporizador = setInterval(function () { guardar('periodico'); }, CADA_MS);

    // 2) Al cambiar de pestaña se guarda antes de que la vista cambie.
    document.querySelectorAll('.nav-tab').forEach(function (t) {
      t.addEventListener('click', function () { guardar('cambio-de-pestana'); }, true);
    });

    // 3) Al cerrar o recargar la página, y al dejarla en segundo plano en el móvil.
    window.addEventListener('beforeunload', function () { guardar('cierre'); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') guardar('segundo-plano');
    });

    // 4) Cuando el editor pase de oculto a visible, se ofrece la recuperación.
    var visibleAntes = editorAbierto();
    new MutationObserver(function () {
      var ahora = editorAbierto();
      if (ahora && !visibleAntes) setTimeout(ofrecerRecuperacion, 400);
      visibleAntes = ahora;
    }).observe(editor, { attributes: true, attributeFilter: ['class'] });

    if (visibleAntes) setTimeout(ofrecerRecuperacion, 600);
  });

  // Al guardar el informe de verdad, el borrador ya no hace falta.
  window.RSBorrador = {
    guardar: function () { return guardar('manual'); },
    leer: leerBorrador,
    descartar: borrar,
    CLAVE: CLAVE,
    // Para las comprobaciones automáticas: permiten verificar que una ruta guardada
    // vuelve a apuntar al mismo campo.
    _ruta: rutaDe,
    _nodo: nodoDeRuta
  };
})();
