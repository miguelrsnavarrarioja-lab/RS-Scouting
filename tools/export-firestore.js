#!/usr/bin/env node
/* =============================================================
   MS FÚTBOL SCOUT · Copia de seguridad de la base de datos
   -------------------------------------------------------------
   Hoy la nube es la ÚNICA copia: la app borra su copia local en cada arranque y las copias
   automáticas de Firebase exigen plan de pago. Si alguien vacía una colección, no hay vuelta atrás.
   Este script descarga todas las colecciones a un fichero JSON fechado.

   Instalación (una vez):
       npm install firebase-admin

   Uso:
       set GOOGLE_APPLICATION_CREDENTIALS=C:\\ruta\\clave-servicio.json
       node tools/export-firestore.js --salida C:\\copias\\rs-scouting --retencion 30
       node tools/export-firestore.js --verificar C:\\copias\\rs-scouting\\rs-scouting-2026-09-03.json
       node tools/export-firestore.js --restaurar <fichero> --coleccion jugadores --dry-run

   La clave de servicio NUNCA va en el repositorio. Se guarda en el servidor, con permisos 600.
   ============================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const COLECCIONES = [
  'jugadores', 'clubes', 'equipos', 'federaciones', 'selecciones', 'convocatorias', 'torneos',
  'staff', 'agencias', 'agentes', 'estadios', 'partidos', 'informes', 'agenda', 'agendaCategories',
  'enlaces', 'cartelera_calendarios', 'notas_categorias', 'notas_fichas', 'configuracion',
  'config'   // segunda coleccion de configuracion, usada en app.js (config/global)
];

// ---------------------------------------------------------------------------
// Partes puras (se prueban sin conexión ni credenciales)
// ---------------------------------------------------------------------------

/** Nombre del fichero de una copia para una fecha dada. */
function nombreDeCopia(fecha) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  const p = (n) => String(n).padStart(2, '0');
  return `rs-scouting-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

/** Convierte los tipos propios de Firestore (fechas, referencias) en algo que cabe en un JSON. */
function aJsonPlano(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor.toDate === 'function') return { _fecha: valor.toDate().toISOString() };
  if (typeof valor === 'object' && valor._latitude !== undefined && valor._longitude !== undefined) {
    return { _lat: valor._latitude, _lon: valor._longitude };
  }
  if (typeof valor.path === 'string' && typeof valor.id === 'string') return { _ref: valor.path };
  if (Array.isArray(valor)) return valor.map(aJsonPlano);
  if (typeof valor === 'object') {
    const salida = {};
    for (const k of Object.keys(valor)) salida[k] = aJsonPlano(valor[k]);
    return salida;
  }
  return valor;
}

/** Qué ficheros sobran al aplicar la retención. Devuelve los que hay que borrar, los más viejos. */
function ficherosAPodar(ficheros, retencion) {
  const copias = ficheros
    .filter((f) => /^rs-scouting-\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();                                   // el nombre lleva la fecha: orden alfabético = cronológico
  if (retencion <= 0 || copias.length <= retencion) return [];
  return copias.slice(0, copias.length - retencion);
}

/** Comprueba que una copia tiene la forma esperada y cuenta los documentos. */
function verificarCopia(contenido) {
  let datos;
  try { datos = typeof contenido === 'string' ? JSON.parse(contenido) : contenido; }
  catch (e) { return { ok: false, motivo: 'el fichero no es un JSON válido: ' + e.message }; }
  if (!datos || typeof datos !== 'object') return { ok: false, motivo: 'contenido vacío' };
  if (!datos.exportadoEn) return { ok: false, motivo: 'falta la fecha de exportación' };
  if (!datos.colecciones || typeof datos.colecciones !== 'object') return { ok: false, motivo: 'faltan las colecciones' };
  const porColeccion = {};
  let total = 0;
  for (const [nombre, docs] of Object.entries(datos.colecciones)) {
    if (!Array.isArray(docs)) return { ok: false, motivo: `la colección ${nombre} no es una lista` };
    porColeccion[nombre] = docs.length;
    total += docs.length;
  }
  return { ok: true, exportadoEn: datos.exportadoEn, total, porColeccion, colecciones: Object.keys(porColeccion).length };
}

// ---------------------------------------------------------------------------
// Ejecución (necesita firebase-admin y la clave de servicio)
// ---------------------------------------------------------------------------

function leerArgumentos(argv) {
  const args = { salida: null, retencion: 30, dryRun: argv.includes('--dry-run') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--salida') args.salida = argv[i + 1];
    if (argv[i] === '--retencion') args.retencion = parseInt(argv[i + 1], 10) || 30;
    if (argv[i] === '--verificar') args.verificar = argv[i + 1];
    if (argv[i] === '--restaurar') args.restaurar = argv[i + 1];
    if (argv[i] === '--coleccion') args.coleccion = argv[i + 1];
  }
  return args;
}

async function exportar(args) {
  // Las copias llevan las fichas completas de los jugadores. Escribirlas dentro del repositorio
  // significaria publicarlas en la siguiente subida, porque el repositorio es publico.
  if (!args.salida) {
    console.error("Falta --salida. Indica una carpeta FUERA del proyecto, por ejemplo C:\copias\rs-scouting");
    process.exit(1);
  }
  {
    const abs = path.resolve(args.salida);
    let d = abs;
    for (let i = 0; i < 8; i++) {
      if (fs.existsSync(path.join(d, ".git"))) {
        console.error("La carpeta indicada esta dentro de un repositorio (" + d + ").");
        console.error("Las copias llevan datos personales: elige una carpeta fuera del proyecto.");
        process.exit(1);
      }
      const p = path.dirname(d);
      if (p === d) break;
      d = p;
    }
  }
  const admin = require('firebase-admin');
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.applicationDefault() });
  const db = admin.firestore();

  const salida = { exportadoEn: new Date().toISOString(), proyecto: process.env.GCLOUD_PROJECT || 'rs-scouting-ee0b3', colecciones: {} };
  for (const nombre of COLECCIONES) {
    const snap = await db.collection(nombre).get();
    salida.colecciones[nombre] = snap.docs.map((d) => ({ _id: d.id, ...aJsonPlano(d.data()) }));
    console.log(`  ${nombre.padEnd(22)} ${String(salida.colecciones[nombre].length).padStart(5)} documentos`);
  }

  fs.mkdirSync(args.salida, { recursive: true });
  const destino = path.join(args.salida, nombreDeCopia(new Date()));
  fs.writeFileSync(destino, JSON.stringify(salida, null, 1));
  const kb = Math.round(fs.statSync(destino).size / 1024);
  console.log(`\nGuardado: ${destino} (${kb} KB)`);

  // Releer para verificar de verdad, no fiarse de que la escritura salió bien.
  const comprobacion = verificarCopia(fs.readFileSync(destino, 'utf8'));
  if (!comprobacion.ok) { console.error('LA COPIA NO ES VÁLIDA:', comprobacion.motivo); process.exit(1); }
  console.log(`Verificada: ${comprobacion.total} documentos en ${comprobacion.colecciones} colecciones`);

  const sobran = ficherosAPodar(fs.readdirSync(args.salida), args.retencion);
  for (const f of sobran) {
    if (args.dryRun) console.log(`  (simulación) se borraría ${f}`);
    else { fs.unlinkSync(path.join(args.salida, f)); console.log(`  borrada copia antigua: ${f}`); }
  }
  if (!sobran.length) console.log(`Retención: ${args.retencion} días, nada que borrar`);
}

async function restaurar(args) {
  if (!args.coleccion) { console.error('Falta --coleccion'); process.exit(1); }
  const datos = JSON.parse(fs.readFileSync(args.restaurar, 'utf8'));
  const docs = (datos.colecciones || {})[args.coleccion];
  if (!Array.isArray(docs)) { console.error(`La copia no contiene la colección ${args.coleccion}`); process.exit(1); }
  console.log(`Restaurar ${docs.length} documentos en '${args.coleccion}' desde ${args.restaurar}`);
  if (args.dryRun) { console.log('(simulación: no se escribe nada). Quita --dry-run para hacerlo de verdad.'); return; }

  const admin = require('firebase-admin');
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.applicationDefault() });
  const db = admin.firestore();
  let hechos = 0;
  for (let i = 0; i < docs.length; i += 400) {
    const lote = db.batch();
    for (const d of docs.slice(i, i + 400)) {
      const { _id, ...resto } = d;
      lote.set(db.collection(args.coleccion).doc(String(_id)), resto, { merge: true });
    }
    await lote.commit();
    hechos += Math.min(400, docs.length - i);
    console.log(`  ${hechos}/${docs.length}`);
  }
  console.log('Restauración terminada.');
}

async function principal() {
  const args = leerArgumentos(process.argv.slice(2));
  if (args.verificar) {
    const r = verificarCopia(fs.readFileSync(args.verificar, 'utf8'));
    if (!r.ok) { console.error('COPIA NO VÁLIDA:', r.motivo); process.exit(1); }
    console.log(`Copia del ${r.exportadoEn}: ${r.total} documentos en ${r.colecciones} colecciones`);
    Object.entries(r.porColeccion).forEach(([k, v]) => console.log(`  ${k.padEnd(22)} ${String(v).padStart(5)}`));
    return;
  }
  if (args.restaurar) return restaurar(args);
  return exportar(args);
}

if (require.main === module) {
  principal().catch((e) => { console.error('Ha fallado:', e && e.message ? e.message : e); process.exit(1); });
}

module.exports = { nombreDeCopia, aJsonPlano, ficherosAPodar, verificarCopia, leerArgumentos, COLECCIONES };
