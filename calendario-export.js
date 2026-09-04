/* =============================================================
   MS FÚTBOL SCOUT · Exportar la agenda al calendario del móvil
   -------------------------------------------------------------
   Genera un archivo de calendario estándar (.ics) con las tareas de la agenda y los
   partidos que tengas marcados. Al abrirlo en el iPhone o el iPad, se ofrecen para
   añadir al calendario de Apple con su aviso. También vale para Google Calendar y
   Outlook, que entienden el mismo formato.

   Es una FOTO del momento: si luego cambias una tarea, hay que volver a exportar.
   La versión que se actualiza sola necesitaría un servidor propio.

   Se carga después de app.js.
   ============================================================= */
(function () {
  'use strict';

  var PROD = '-//Marketing Espana//MS Futbol Scout//ES';

  /** El formato exige escapar la barra, la coma, el punto y coma y los saltos de línea. */
  function esc(texto) {
    return String(texto === null || texto === undefined ? '' : texto)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  /** Las líneas no pueden pasar de 75 octetos: se parten con un espacio al principio. */
  /* El formato mide las lineas en OCTETOS, no en caracteres: una n con virgulilla ocupa dos y una
     emoji cuatro. Contando caracteres, un titulo con acentos generaba lineas de 78 octetos y algunos
     lectores de calendario descartan el evento entero. Se corta por octetos y siempre en frontera de
     caracter, para no partir por la mitad una letra acentuada. */
  function octetos(t) {
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(t).length;
    return unescape(encodeURIComponent(t)).length;
  }

  function cuantoCabe(t, maximo) {
    var usados = 0, i = 0;
    while (i < t.length) {
      var salto = (t.codePointAt(i) > 0xFFFF) ? 2 : 1;   // los pares suplentes van juntos
      var o = octetos(t.substr(i, salto));
      if (usados + o > maximo) break;
      usados += o;
      i += salto;
    }
    return i;
  }

  function plegar(linea) {
    if (octetos(linea) <= 75) return linea;
    var corte = cuantoCabe(linea, 75);
    if (corte === 0) return linea;                       // no deberia pasar; mejor no romper nada
    var trozos = [linea.slice(0, corte)];
    var resto = linea.slice(corte);
    while (resto) {
      var c = cuantoCabe(resto, 74);                     // 74: el espacio de continuacion cuenta
      if (c === 0) { trozos.push(' ' + resto); break; }
      trozos.push(' ' + resto.slice(0, c));
      resto = resto.slice(c);
    }
    return trozos.join('\r\n');
  }

  function dosDigitos(n) { return String(n).padStart(2, '0'); }

  /** «2026-09-05» + «17:30» → «20260905T173000». Sin zona: se interpreta como hora local. */
  function aFechaHora(fecha, hora) {
    if (!fecha) return null;
    var f = String(fecha).trim();
    var partes = f.includes('/') ? f.split('/') : f.split('-');
    var a, m, d;
    if (partes.length !== 3) return null;
    if (partes[0].length === 4) { a = partes[0]; m = partes[1]; d = partes[2]; }
    else { d = partes[0]; m = partes[1]; a = partes[2]; }
    if (String(a).length === 2) a = '20' + a;
    var hh = '09', mm = '00';
    if (hora && String(hora).includes(':')) {
      var h = String(hora).trim().split(':');
      hh = dosDigitos(parseInt(h[0], 10) || 0);
      mm = dosDigitos(parseInt(h[1], 10) || 0);
    }
    if (!/^\d{4}$/.test(String(a)) || isNaN(parseInt(m, 10)) || isNaN(parseInt(d, 10))) return null;
    return a + dosDigitos(parseInt(m, 10)) + dosDigitos(parseInt(d, 10)) + 'T' + hh + mm + '00';
  }

  function ahoraUTC() {
    var d = new Date();
    return d.getUTCFullYear() + dosDigitos(d.getUTCMonth() + 1) + dosDigitos(d.getUTCDate()) + 'T' +
      dosDigitos(d.getUTCHours()) + dosDigitos(d.getUTCMinutes()) + dosDigitos(d.getUTCSeconds()) + 'Z';
  }

  /** Suma minutos a un «AAAAMMDDTHHMMSS». */
  function sumarMinutos(marca, minutos) {
    var d = new Date(
      +marca.slice(0, 4), +marca.slice(4, 6) - 1, +marca.slice(6, 8),
      +marca.slice(9, 11), +marca.slice(11, 13), 0
    );
    d.setMinutes(d.getMinutes() + minutos);
    return d.getFullYear() + dosDigitos(d.getMonth() + 1) + dosDigitos(d.getDate()) + 'T' +
      dosDigitos(d.getHours()) + dosDigitos(d.getMinutes()) + '00';
  }

  function evento(op) {
    var lineas = [
      'BEGIN:VEVENT',
      'UID:' + esc(op.uid),
      'DTSTAMP:' + ahoraUTC(),
      'DTSTART:' + op.inicio,
      'DTEND:' + op.fin,
      plegar('SUMMARY:' + esc(op.titulo))
    ];
    if (op.lugar) lineas.push(plegar('LOCATION:' + esc(op.lugar)));
    if (op.descripcion) lineas.push(plegar('DESCRIPTION:' + esc(op.descripcion)));
    if (op.aviso !== 0) {
      lineas.push('BEGIN:VALARM', 'ACTION:DISPLAY',
        plegar('DESCRIPTION:' + esc(op.titulo)),
        'TRIGGER:-PT' + (op.aviso || 60) + 'M', 'END:VALARM');
    }
    lineas.push('END:VEVENT');
    return lineas;
  }

  /** Construye el calendario completo. Devuelve el texto y cuántos eventos lleva. */
  function construir(opciones) {
    opciones = opciones || {};
    var estado = (typeof window.state === 'object' && window.state) ? window.state : {};
    var avisoMin = typeof opciones.avisoMinutos === 'number' ? opciones.avisoMinutos : 60;
    var incluirHechas = !!opciones.incluirCompletadas;

    var lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:' + PROD, 'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH', 'X-WR-CALNAME:MS Futbol Scout'];
    var n = 0, sinFecha = 0;

    // --- Tareas y eventos de la agenda ---
    (estado.agenda || []).forEach(function (t) {
      if (!t) return;
      if (!incluirHechas && (t.completada || t.estado === 'done')) return;
      var inicio = aFechaHora(t.fecha, t.hora);
      if (!inicio) { sinFecha++; return; }
      var fin = t.horaFin ? aFechaHora(t.fecha, t.horaFin) : null;
      if (!fin || fin <= inicio) fin = sumarMinutos(inicio, 60);
      var etiqueta = (t.tipo === 'evento') ? 'Evento' : 'Tarea';
      lineas = lineas.concat(evento({
        uid: 'agenda-' + (t.id || n) + '@ms-futbol-scout',
        inicio: inicio, fin: fin,
        titulo: etiqueta + ': ' + (t.titulo || 'Sin titulo'),
        descripcion: [t.descripcion, t.prioridad ? 'Prioridad: ' + t.prioridad : ''].filter(Boolean).join('\n'),
        aviso: avisoMin
      }));
      n++;
    });

    // --- Partidos de los calendarios de la cartelera ---
    var calendarios = (estado.cartelera && estado.cartelera.calendarios) || [];
    calendarios.forEach(function (cal) {
      (cal.partidos || []).forEach(function (m, i) {
        if (!m) return;
        var inicio = aFechaHora(m.fecha, m.hora);
        if (!inicio) { sinFecha++; return; }
        lineas = lineas.concat(evento({
          uid: 'partido-' + (cal.id || 'cal') + '-' + i + '@ms-futbol-scout',
          inicio: inicio, fin: sumarMinutos(inicio, 110),
          titulo: (m.local || '?') + ' - ' + (m.visitante || '?'),
          lugar: m.estadio || '',
          descripcion: [m.competicion, m.categoria, cal.nombre].filter(Boolean).join(' · '),
          aviso: avisoMin
        }));
        n++;
      });
    });

    lineas.push('END:VCALENDAR');
    return { texto: lineas.join('\r\n') + '\r\n', eventos: n, sinFecha: sinFecha };
  }

  /** Genera el archivo y lo descarga. */
  function exportar(opciones) {
    try {
      var r = construir(opciones);
      if (r.eventos === 0) {
        if (typeof window.showToast === 'function') {
          window.showToast('No hay tareas ni partidos con fecha para exportar.', 'warning', 6000);
        }
        return r;
      }
      var hoy = new Date();
      var nombre = 'ms-futbol-scout-' + hoy.getFullYear() + dosDigitos(hoy.getMonth() + 1) + dosDigitos(hoy.getDate()) + '.ics';
      var blob = new Blob([r.texto], { type: 'text/calendar;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = nombre;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);

      if (typeof window.showToast === 'function') {
        var extra = r.sinFecha ? ' (' + r.sinFecha + ' sin fecha, no se han incluido)' : '';
        window.showToast('Calendario exportado: ' + r.eventos + ' eventos' + extra +
          '. Ábrelo en el móvil para añadirlo al calendario.', 'success', 8000);
      }
      return r;
    } catch (e) {
      console.error('Error al exportar el calendario:', e);
      if (typeof window.showToast === 'function') {
        window.showToast('No se ha podido generar el calendario.', 'danger', 6000);
      }
      return null;
    }
  }

  // El botón se coloca junto al de copia de seguridad, en Configuración.
  document.addEventListener('DOMContentLoaded', function () {
    var ancla = document.getElementById('btnExportBackup');
    if (!ancla || document.getElementById('btnExportCalendario')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = ancla.className;
    btn.id = 'btnExportCalendario';
    btn.innerHTML = '<i data-lucide="calendar-plus"></i> 📅 Enviar agenda al calendario del móvil';
    btn.addEventListener('click', function () { exportar({ avisoMinutos: 60 }); });
    ancla.parentNode.insertBefore(btn, ancla.nextSibling);
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  });

  window.RSCalendario = { construir: construir, exportar: exportar, aFechaHora: aFechaHora, esc: esc };
})();
