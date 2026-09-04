#!/usr/bin/env node
/* =============================================================
   MS FÚTBOL SCOUT · Comprobaciones automáticas del código
   -------------------------------------------------------------
   Repasa el código buscando los fallos que ya han costado datos una vez, para que no
   vuelvan a colarse. Se ejecuta solo en cada subida al repositorio, y también a mano:

       node tools/comprobar.js

   No necesita instalar nada: solo Node. Tarda un par de segundos.
   Si algo sale en rojo, el código tiene un problema conocido. No es un aviso menor.
   ============================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const leer = (f) => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const existe = (f) => fs.existsSync(path.join(RAIZ, f));

const FICHEROS_JS = ['app.js', 'auth.js', 'toast.js', 'data-guard.js', 'firebase-config.js',
  'informe-borrador.js', 'calendario-export.js', 'importer_v2.js', 'tools/export-firestore.js'];

const resultados = [];
function comprobar(titulo, fn) {
  try {
    const detalle = fn();
    resultados.push({ titulo, ok: true, detalle: detalle || 'correcto' });
  } catch (e) {
    resultados.push({ titulo, ok: false, detalle: e.message });
  }
}

// ---------------------------------------------------------------------------

comprobar('El código no tiene errores de sintaxis', () => {
  const fallos = [];
  for (const f of FICHEROS_JS) {
    if (!existe(f)) continue;
    try { execFileSync(process.execPath, ['--check', path.join(RAIZ, f)], { stdio: 'pipe' }); }
    catch (e) { fallos.push(f + ': ' + String(e.stderr || e.message).split('\n')[0].slice(0, 90)); }
  }
  if (fallos.length) throw new Error(fallos.join(' | '));
  return FICHEROS_JS.filter(existe).length + ' ficheros correctos';
});

comprobar('No se llama a funciones que no existen', () => {
  const src = leer('app.js');
  const definidas = new Set();
  for (const m of src.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) definidas.add(m[1]);
  for (const m of src.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)) definidas.add(m[1]);
  ['showToast', 'showNotification', 'RSData', 'RSBorrador', 'RSCalendario', 'RSAuth'].forEach(n => definidas.add(n));

  // Nombres que ya han roto la aplicación alguna vez.
  const vigilados = ['closeModal', 'saveSettingsToFirebase', 'saveStateImmediate', 'openFicha',
    'cleanUpAragonGeneratedPlayersFromFirebase', 'populateImporterFederacionesSelect',
    'updateDirectorioDatalists', 'convertCarteleraMatchToLiveReport', 'renderCarteleraJornadasGrid'];
  const lineas = src.split(/\r?\n/);
  const sueltas = [];
  vigilados.forEach((n) => {
    if (definidas.has(n)) return;
    lineas.forEach((linea, i) => {
      const codigo = linea.replace(/\/\/.*$/, '');
      if (!new RegExp('(?<![\\w$.])' + n + '\\s*\\(').test(codigo)) return;
      const ventana = lineas.slice(Math.max(0, i - 3), i + 1).join('\n');
      if (ventana.includes('typeof ' + n)) return;         // protegida
      sueltas.push(n + ' en la línea ' + (i + 1));
    });
  });
  if (sueltas.length) throw new Error('llamadas sin protección: ' + sueltas.join(', '));
  return vigilados.length + ' nombres vigilados, ninguno suelto';
});

comprobar('Los datos que se pintan van escapados', () => {
  const src = leer('app.js');
  const lineas = src.split(/\r?\n/);
  const sinEscapar = [];

  function expresion(linea, i) {
    let k = i + 2, prof = 1, comilla = null;
    while (k < linea.length) {
      const c = linea[k];
      if (comilla) { if (c === '\\') { k += 2; continue; } if (c === comilla) comilla = null; }
      else if (c === '"' || c === "'" || c === '`') comilla = c;
      else if (c === '{') prof++;
      else if (c === '}') { prof--; if (prof === 0) return { expr: linea.slice(i + 2, k), fin: k }; }
      k++;
    }
    return null;
  }
  function atributo(linea, i) {
    const antes = linea.slice(0, i);
    const iC = antes.lastIndexOf('"');
    if (iC === -1) return null;
    if ((antes.slice(0, iC).match(/"/g) || []).length % 2 !== 0) return null;
    const m = antes.slice(0, iC).match(/([a-zA-Z_:][a-zA-Z0-9_:.-]*)\s*=\s*$/);
    return m ? m[1] : null;
  }

  lineas.forEach((linea, n) => {
    if (/querySelector|closest\(|matches\(/.test(linea)) return;   // selectores: no son HTML
    let i = 0;
    while (i < linea.length) {
      const j = linea.indexOf('${', i);
      if (j === -1) break;
      const leido = expresion(linea, j);
      if (!leido) break;
      const attr = atributo(linea, j);
      // `urlSegura` es el escapador de los enlaces: además de escapar, valida el esquema para que
      // un «javascript:» guardado en la base no se ejecute al pulsarlo.
      const seguro = /escapeAttr|escapeHtml|escapeJsAttr|urlSegura|JSON\.stringify|IdStr|Json\b/.test(leido.expr);
      if (attr && !seguro) sinEscapar.push(attr + ' en la línea ' + (n + 1));
      i = leido.fin + 1;
    }
  });
  if (sinEscapar.length) {
    throw new Error(sinEscapar.length + ' sin escapar: ' + sinEscapar.slice(0, 5).join(', ') +
      (sinEscapar.length > 5 ? '…' : ''));
  }
  return 'todas las inserciones en atributos van escapadas';
});

comprobar('Las operaciones de texto aguantan datos con la forma equivocada', () => {
  const src = leer('app.js');
  // La exclusion hacia atras evita contar como pendiente el parentesis de la propia proteccion.
  const re = /(?<!String)\(([^()]*\|\|[^()]*)\)\.(toLowerCase|toUpperCase|trim|normalize|split|includes|startsWith)\(/g;
  // Solo cuentan los valores que vienen de un documento de la base (patron algo.campo): esos
  // pueden llegar con la forma equivocada. Las variables locales las controla el propio codigo.
  const encontrados = [...src.matchAll(re)].filter(m => /[a-zA-Z_$][w$]*.[a-zA-Z_$]/.test(m[1]));
  if (encontrados.length) {
    const lineas = src.slice(0, encontrados[0].index).split(/\r?\n/).length;
    throw new Error(encontrados.length + ' sin blindar, la primera en la línea ' + lineas +
      ': ' + encontrados[0][0].slice(0, 60));
  }
  return 'ninguna operación de texto puede romperse por un dato mal formado';
});

comprobar('La puerta de acceso está conectada', () => {
  const html = leer('index.html');
  const app = leer('app.js');
  const fallos = [];
  if (!html.includes('id="authGate"')) fallos.push('falta la pantalla de acceso en index.html');
  if (!html.includes('firebase-auth-compat')) fallos.push('no se carga el sistema de acceso');
  if (!html.includes('auth.js')) fallos.push('no se carga auth.js');
  if (!/RSAuth\.ready/.test(app)) fallos.push('la app no espera a la sesión antes de leer datos');
  // El orden importa: configuración y acceso ANTES que la aplicación.
  const orden = ['firebase-config.js', 'auth.js', 'app.js'].map(f => html.indexOf('src="' + f));
  if (orden.some(i => i === -1) || orden[0] > orden[1] || orden[1] > orden[2]) {
    fallos.push('el orden de carga de los scripts no es el correcto');
  }
  if (fallos.length) throw new Error(fallos.join(' | '));
  return 'pantalla de acceso, orden de carga y espera de sesión, correctos';
});

comprobar('Las reglas del servidor siguen siendo restrictivas', () => {
  if (!existe('firestore.rules')) throw new Error('falta el fichero de reglas');
  const r = leer('firestore.rules');
  const fallos = [];
  if (/allow\s+(read|write|read,\s*write)\s*:\s*if\s+true/.test(r)) {
    fallos.push('HAY UNA REGLA ABIERTA A TODO EL MUNDO');
  }
  if (!/request\.auth\s*!=\s*null/.test(r)) fallos.push('no se exige sesión iniciada');
  if (!/configuracion\/acceso/.test(r)) fallos.push('falta la lista de personas autorizadas');
  if (fallos.length) throw new Error(fallos.join(' | '));
  return 'sin reglas abiertas; se exige sesión y lista de autorizados';
});

comprobar('No hay credenciales en el repositorio', () => {
  const sospechosos = [];
  const revisar = (dir, prefijo) => {
    for (const f of fs.readdirSync(dir)) {
      const ruta = path.join(dir, f);
      if (fs.statSync(ruta).isDirectory()) continue;
      if (!/\.(js|json|md|html|rules|txt|env)$/i.test(f)) continue;
      if (ruta === __filename) continue;   // este fichero contiene los patrones que busca
      const t = fs.readFileSync(ruta, 'utf8');
      if (/"type"\s*:\s*"service_account"|BEGIN [A-Z ]*PRIVATE KEY|client_secret/.test(t)) {
        sospechosos.push(prefijo + f);
      }
    }
  };
  revisar(RAIZ, '');
  if (existe('tools')) revisar(path.join(RAIZ, 'tools'), 'tools/');
  if (sospechosos.length) throw new Error('credenciales en: ' + sospechosos.join(', '));
  return 'ningún fichero lleva credenciales de servidor';
});

comprobar('La copia de seguridad cubre todas las colecciones', () => {
  if (!existe('tools/export-firestore.js')) throw new Error('falta la herramienta de copias');
  const exportador = require(path.join(RAIZ, 'tools/export-firestore.js'));
  const app = leer('app.js');
  const usadas = new Set();
  for (const re of [/collection\(['"]([^'"]+)['"]\)/g, /fetchCol\(['"]([^'"]+)['"]\)/g, /listenCollection\(['"]([^'"]+)['"]/g]) {
    for (const m of app.matchAll(re)) usadas.add(m[1]);
  }
  const faltan = [...usadas].filter(c => !exportador.COLECCIONES.includes(c));
  if (faltan.length) throw new Error('sin copiar: ' + faltan.join(', '));
  return usadas.size + ' colecciones en uso, todas cubiertas';
});

comprobar('Las funciones que necesita el importador están disponibles', () => {
  const app = leer('app.js');
  const necesarias = ['saveToFirebase', 'escapeAttr', 'escapeJsAttr', 'hideModal'];
  const faltan = necesarias.filter(n => !new RegExp('window\\.' + n + '\\s*=').test(app));
  if (faltan.length) throw new Error('sin publicar: ' + faltan.join(', ') + ' (el importador no guardaría)');
  return necesarias.length + ' funciones publicadas';
});

comprobar('La política de contenido sigue puesta y sin agujeros', () => {
  const html = leer('index.html');
  const m = /<meta http-equiv="Content-Security-Policy" content="([\s\S]*?)">/.exec(html);
  if (!m) throw new Error('falta la política de contenido en index.html');
  const p = m[1].replace(/\s+/g, ' ');
  const exigidas = [/default-src 'self'/, /object-src 'none'/, /base-uri 'self'/, /form-action 'self'/, /connect-src /];
  const faltan = exigidas.filter((re) => !re.test(p));
  if (faltan.length) throw new Error('a la política le faltan ' + faltan.length + ' directivas');
  if (/unsafe-eval/.test(p)) throw new Error('la política permite eval: no debe hacerlo');
  return 'política completa, sin eval permitido';
});

comprobar('No se usa eval en ninguna parte', () => {
  const sospechosas = [];
  for (const f of fs.readdirSync(RAIZ)) {
    if (!/\.(js|html)$/.test(f)) continue;
    const txt = fs.readFileSync(path.join(RAIZ, f), 'utf8');
    txt.split('\n').forEach((linea, i) => {
      if (/^\s*(\/\/|\*|<!--)/.test(linea)) return;
      if (/\beval\s*\(|new\s+Function\s*\(/.test(linea)) sospechosas.push(f + ':' + (i + 1));
    });
  }
  if (sospechosas.length) throw new Error('usa eval en ' + sospechosas.join(', '));
  return 'sin eval ni new Function';
});

comprobar('Las librerías externas están fijadas y verificadas', () => {
  const html = leer('index.html');
  const externos = [...html.matchAll(/<script[^>]*src="(https:\/\/[^"]+)"[^>]*>/g)];
  const problemas = [];
  for (const m of externos) {
    const url = m[1];
    if (/@latest|@\^|@~/.test(url)) problemas.push('sin versión fija: ' + url);
    if (/jsdelivr|unpkg|cdnjs/.test(url)) {
      if (!/@\d+\.\d+|\/\d+\.\d+\.\d+\//.test(url)) problemas.push('sin versión fija: ' + url);
      if (!/integrity="sha\d+-/.test(m[0])) problemas.push('sin integridad: ' + url);
      if (/integrity=/.test(m[0]) && !/crossorigin=/.test(m[0])) problemas.push('integridad sin crossorigin: ' + url);
    }
  }
  if (problemas.length) throw new Error(problemas.join(' | '));
  return externos.length + ' scripts externos, todos fijados';
});

comprobar('Cada fichero propio lleva su marca de versión', () => {
  const html = leer('index.html');
  const propios = [...html.matchAll(/<script src="([a-z0-9_-]+\.js)(\?v=(\d+))?"/g)];
  const sinMarca = propios.filter((m) => !m[3]).map((m) => m[1]);
  if (sinMarca.length) {
    throw new Error('sin marca de versión: ' + sinMarca.join(', ') + ' (el navegador serviría la copia vieja)');
  }
  // Una comprobación que no encuentra nada no comprueba nada: por eso se exige el número de
  // ficheros. Un reemplazo mal hecho que se comiera la comilla de cierre pasaría inadvertido.
  const declarados = (html.match(/<script src="[a-z0-9_-]+.js/g) || []).length;
  if (propios.length !== declarados) {
    throw new Error('hay ' + declarados + ' scripts propios pero solo ' + propios.length +
      ' con el atributo bien cerrado: revisa las comillas en index.html');
  }
  if (propios.length < 6) throw new Error('solo se han encontrado ' + propios.length + ' scripts propios');
  const marcas = new Set(propios.map((m) => m[3]));
  if (marcas.size > 1) throw new Error('marcas distintas entre ficheros: ' + [...marcas].join(', '));
  return propios.length + ' ficheros con la marca ' + [...marcas][0];
});

comprobar('El guardado automático del informe no depende de identificadores', () => {
  const b = leer('informe-borrador.js');
  const app = leer('app.js');
  if (!/function rutaDe/.test(b) || !/function nodoDeRuta/.test(b)) {
    throw new Error('falta el anclaje por ruta: la alineación no se guardaría');
  }
  if (!/claveDe\(/.test(b)) throw new Error('los borradores no se separan por informe');
  if (!/rsInformeEnEdicion/.test(b)) throw new Error('no consulta qué informe se está editando');
  if (!/window\.rsInformeEnEdicion\s*=/.test(app)) throw new Error('app.js no publica el informe en edición');
  return 'anclaje por ruta y clave por informe';
});

// ---------------------------------------------------------------------------

const fallidas = resultados.filter(r => !r.ok);
console.log('\nComprobaciones del código de MS Fútbol Scout\n' + '='.repeat(66));
for (const r of resultados) {
  console.log((r.ok ? '  OK    ' : '  FALLA ') + r.titulo);
  console.log('        ' + r.detalle);
}
console.log('='.repeat(66));
if (fallidas.length) {
  console.log(`${fallidas.length} de ${resultados.length} comprobaciones han fallado.`);
  console.log('Estos fallos ya costaron datos una vez. Conviene arreglarlos antes de seguir.\n');
  process.exit(1);
}
console.log(`Las ${resultados.length} comprobaciones han pasado.\n`);
