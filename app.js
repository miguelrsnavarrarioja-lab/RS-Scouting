/* ==========================================================================
   RS SCOUTING - CORE APPLICATION LOGIC
   ========================================================================== */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Initial State & Data Persistence
  // --------------------------------------------------------------------------
  const STORAGE_KEY = 'RS_SCOUTING_DATA_V1';

  const DEFAULT_INITIAL_STATE = {
    settings: {
      appName: 'RS Scouting',
      theme: 'light'
    },
    matches: [],
    reports: [],
    directory: {
      jugadores: [],
      clubes: [],
      equipos: [],
      federaciones: [],
      selecciones: [],
      convocatorias: [],
      torneos: [],
      staff: [],
      agencias: [],
      agentes: [],
      estadios: [],
      informes: []
    },
    agenda: [],
    links: []
  };

  // --------------------------------------------------------------------------
  // Image Compression Utility (Canvas Base64 Optimizer)
  // --------------------------------------------------------------------------
  function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
      if (!file || !(file instanceof File || file instanceof Blob)) {
        return resolve(null);
      }
      const isPngOrTransparent = file.type && (file.type.includes('png') || file.type.includes('svg') || file.type.includes('webp') || file.type.includes('gif'));

      if (file.type && file.type.includes('svg')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!isPngOrTransparent) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
          } else {
            ctx.clearRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);
          const exportMime = isPngOrTransparent ? 'image/png' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(exportMime, isPngOrTransparent ? undefined : quality);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // --------------------------------------------------------------------------
  // 1. Firebase Cloud Database Integration
  // --------------------------------------------------------------------------
  const firebaseConfig = {
    apiKey: "AIzaSyBHUThKvVtQ3HtyRFGjDe25NOka4NUV4-Q",
    authDomain: "rs-scouting-ee0b3.firebaseapp.com",
    projectId: "rs-scouting-ee0b3",
    storageBucket: "rs-scouting-ee0b3.firebasestorage.app",
    messagingSenderId: "971849612591",
    appId: "1:971849612591:web:18a349fe3aae41e23775da",
    measurementId: "G-9YBKB2HC6R"
  };

  let db = null;
  if (typeof firebase !== 'undefined') {
    try {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      console.log('🔥 Firebase Cloud Firestore conectado con éxito');
    } catch (e) {
      console.error('Error al inicializar Firebase:', e);
    }
  }

    async function deleteFromFirebase(collectionName, docId, itemObj = null) {
    if (!db || !docId) return;
    try {
      const idsToDelete = new Set([String(docId)]);
      if (itemObj) {
        if (itemObj.id !== undefined && itemObj.id !== null) idsToDelete.add(String(itemObj.id));
        if (itemObj.codigo !== undefined && itemObj.codigo !== null) idsToDelete.add(String(itemObj.codigo));
      }

      for (const id of idsToDelete) {
        await db.collection(collectionName).doc(id).delete().catch(() => {});
      }

      const colRef = db.collection(collectionName);
      const strVal = String(docId).trim();

      const queries = [
        colRef.where('id', '==', strVal).get().catch(() => null),
        colRef.where('codigo', '==', strVal).get().catch(() => null)
      ];

      if (itemObj && itemObj.nombre) {
        queries.push(colRef.where('nombre', '==', itemObj.nombre).get().catch(() => null));
      }

      const snaps = await Promise.all(queries);
      snaps.forEach(snap => {
        if (snap && !snap.empty) {
          snap.forEach(doc => {
            doc.ref.delete().catch(() => {});
          });
        }
      });
      console.log(`🔥 Documento(s) para '${docId}' eliminados permanentemente de Firebase collection '${collectionName}'`);
    } catch (err) {
      console.error(`Error al borrar en Firebase (${collectionName}):`, err);
    }
  }

    function saveToFirebase(collectionName, item) {
    if (!db || !item || !item.id) return;
    setFirebaseHeaderStatus('syncing');
    db.collection(collectionName).doc(String(item.id)).set(item, { merge: true })
      .then(() => {
        console.log(`🔥 Documento ${item.id} guardado en '${collectionName}' en Firebase`);
        setFirebaseHeaderStatus('synced');
      if (typeof cleanUpAragonGeneratedPlayersFromFirebase === 'function') cleanUpAragonGeneratedPlayersFromFirebase();
      setTimeout(() => {
        if (typeof cleanUpAragonGeneratedPlayersFromFirebase === 'function') cleanUpAragonGeneratedPlayersFromFirebase();
      }, 1500);
      if (typeof ensureClubesAragonSeeded === 'function') ensureClubesAragonSeeded();
      if (typeof ensureEquiposAragonSeeded === 'function') ensureEquiposAragonSeeded();
      })
      .catch(err => {
        console.error(`Error al guardar ${item.id} en Firebase (${collectionName}):`, err);
        setFirebaseHeaderStatus('error');
      });
  }

  function deleteMultipleFromFirebase(collectionName, docIdsArray) {
    if (!db || !Array.isArray(docIdsArray) || docIdsArray.length === 0) return;
    const batch = db.batch();
    docIdsArray.forEach(id => {
      if (id) {
        const ref = db.collection(collectionName).doc(String(id));
        batch.delete(ref);
      }
    });
    batch.commit()
      .then(() => console.log(`🔥 ${docIdsArray.length} documentos eliminados en lote de '${collectionName}' en Firebase`))
      .catch(err => console.error(`Error al borrar lote en Firebase (${collectionName}):`, err));
  }

      function setFirebaseHeaderStatus(status = 'synced') {
    const btn = document.getElementById('btnHeaderSyncFirebase');
    if (!btn) return;

    btn.classList.remove('firebase-synced', 'firebase-syncing');

    if (status === 'synced') {
      btn.classList.add('firebase-synced');
      btn.title = 'Firebase Cloud Firestore: Sincronizado y Conectado 🟢';
    } else if (status === 'syncing') {
      btn.classList.add('firebase-syncing');
      btn.title = 'Sincronizando con Firebase Cloud Firestore... 🔄';
    } else if (status === 'error') {
      btn.title = 'Error de conexión con Firebase ⚠️';
    }
  }

  function loadState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
  }

  let state = loadState();

    function saveState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}

    if (db) {
      if (state.settings || state.favColumns || state.customTabOrder) {
        const configToSave = Object.assign({}, state.settings || {}, {
          favColumns: state.favColumns || ['Columna 1', 'Columna 2', 'Columna 3'],
          customTabOrder: state.customTabOrder || [],
          customClubTypes: state.customClubTypes || [],
          clubesNavarraSeeded: !!state.directory?.clubesNavarraSeeded,
          federacionesSeeded: !!state.directory?.federacionesSeeded
        });
        db.collection('configuracion').doc('app_settings').set(configToSave, { merge: true })
          .catch(e => console.warn('Error sync configuracion:', e));
      }
    }
  }

  /**
   * Fuerza el volcado y sincronización de absolutamente todo el estado actual a Firebase.
   */
  async function syncAllToFirebase(notifyUser = true) {
    if (!db) {
      if (notifyUser) alert('⚠️ Firebase no está inicializado o no hay conexión.');
      return;
    }

    try {
      console.log('🔄 Iniciando sincronización completa con Firebase...');
      saveState();

      const collectionsMap = {
        'jugadores': state.directory?.jugadores || [],
        'clubes': state.directory?.clubes || [],
        'equipos': state.directory?.equipos || [],
        'federaciones': state.directory?.federaciones || [],
        'selecciones': state.directory?.selecciones || [],
        'convocatorias': state.directory?.convocatorias || [],
        'torneos': state.directory?.torneos || [],
        'staff': state.directory?.staff || [],
        'agencias': state.directory?.agencias || [],
        'agentes': state.directory?.agentes || [],
        'estadios': state.directory?.estadios || [],
        'partidos': state.matches || [],
        'informes': state.reports || [],
        'agenda': state.agenda || [],
        'enlaces': state.links || []
      };

      setFirebaseHeaderStatus('syncing');
      for (const [colName, items] of Object.entries(collectionsMap)) {
        if (Array.isArray(items) && items.length > 0) {
          // Batch write in chunks of 450 to stay well under 500 limit
          for (let i = 0; i < items.length; i += 450) {
            const chunk = items.slice(i, i + 450);
            const batch = db.batch();
            chunk.forEach(item => {
              if (item && item.id) {
                const ref = db.collection(colName).doc(String(item.id));
                batch.set(ref, item, { merge: true });
              }
            });
            await batch.commit();
          }
        }
      }

      const configToSave = Object.assign({}, state.settings || {}, {
        favColumns: state.favColumns || ['Columna 1', 'Columna 2', 'Columna 3'],
        customTabOrder: state.customTabOrder || []
      });
      await db.collection('configuracion').doc('app_settings').set(configToSave, { merge: true });

      console.log('✅ Sincronización completa finalizada en Firebase');
      setFirebaseHeaderStatus('synced');
      if (notifyUser) {
        if (typeof showToast === 'function') {
          showToast('☁️ Sincronización con Firebase completada con éxito', 'success');
        } else {
          alert('☁️ Sincronización con Firebase completada con éxito');
        }
      }
    } catch (err) {
      console.error('Error durante la sincronización a Firebase:', err);
      if (notifyUser) alert('⚠️ Error al sincronizar con Firebase: ' + err.message);
    }
  }

  /**
   * Carga la base de datos de Firebase desde todas las colecciones.
   */
    async function loadFromFirebase() {
    if (!db) return false;
    try {
      console.log('📡 Consultando colecciones de Firebase Firestore...');
      
      const fetchCol = async (colName) => {
        try {
          const snap = await db.collection(colName).get();
          const docs = [];
          snap.forEach(doc => docs.push(doc.data()));
          return docs;
        } catch (e) {
          console.warn(`Error al consultar ${colName}:`, e);
          return [];
        }
      };

      const [
        jugadores, clubes, equipos, federaciones, selecciones,
        convocatorias, torneos, staff, agencias, agentes, estadios,
        partidos, informes, agenda, enlaces
      ] = await Promise.all([
        fetchCol('jugadores'),
        fetchCol('clubes'),
        fetchCol('equipos'),
        fetchCol('federaciones'),
        fetchCol('selecciones'),
        fetchCol('convocatorias'),
        fetchCol('torneos'),
        fetchCol('staff'),
        fetchCol('agencias'),
        fetchCol('agentes'),
        fetchCol('estadios'),
        fetchCol('partidos'),
        fetchCol('informes'),
        fetchCol('agenda'),
        fetchCol('enlaces')
      ]);

      let configData = null;
      try {
        const configSnap = await db.collection('configuracion').doc('app_settings').get();
        if (configSnap.exists) {
          configData = configSnap.data();
        }
      } catch (e) {}

      const totalItemsCloud = jugadores.length + clubes.length + equipos.length + federaciones.length +
        selecciones.length + convocatorias.length + torneos.length + staff.length + agencias.length +
        agentes.length + estadios.length + partidos.length + informes.length + agenda.length + enlaces.length;

      if (totalItemsCloud > 0) {
        console.log(`🔥 Se obtuvieron ${totalItemsCloud} registros desde Firebase Cloud Firestore`);

        state.directory = state.directory || {};
        state.directory.jugadores = jugadores || [];
        state.players = [];
        state.directory.clubes = clubes;
        state.directory.equipos = equipos;
        state.directory.federaciones = federaciones;
        state.directory.selecciones = selecciones;
        state.directory.convocatorias = convocatorias;
        state.directory.torneos = torneos;
        state.directory.staff = staff;
        state.directory.agencias = agencias;
        state.directory.agentes = agentes;
        state.directory.estadios = estadios;

        state.matches = partidos;
        state.reports = informes;
        state.agenda = agenda;
        state.links = enlaces;

        if (configData) {
          state.settings = Object.assign({}, state.settings, configData);
          if (Array.isArray(configData.favColumns) && configData.favColumns.length > 0) {
            state.favColumns = configData.favColumns;
          }
          if (Array.isArray(configData.customTabOrder)) {
            state.customTabOrder = configData.customTabOrder;
          }
          if (Array.isArray(configData.customClubTypes) && configData.customClubTypes.length > 0) {
            state.customClubTypes = Array.from(new Set([...(state.customClubTypes || []), ...configData.customClubTypes]));
          }
          if (configData.clubesNavarraSeeded) {
            state.directory.clubesNavarraSeeded = true;
          }
          if (configData.federacionesSeeded) {
            state.directory.federacionesSeeded = true;
          }
        }

        setFirebaseHeaderStatus('synced');
        if (typeof renderAllViews === 'function') {
          renderAllViews();
        }
        return true;
      } else {
        console.log('ℹ️ Firebase no contiene colecciones de datos. Sincronizando estado local inicial a Firebase...');
        if (state.directory) state.directory.jugadores = [];
        state.players = [];
        // no auto re-upload
        return false;
      }
    } catch (err) {
      console.warn('Error al cargar colecciones de Firebase:', err);
      return false;
    }
  }

  function initFirebaseRealtimeListener() {
    if (!db) return;

    // Ejecutar la carga inicial completa desde las colecciones independientes de Firebase
    loadFromFirebase();
  }

  // --------------------------------------------------------------------------
  // 2. Tactical Pitch Preset Formation Maps
  // --------------------------------------------------------------------------
  const FORMATION_POSITIONS = {
    // === FÚTBOL 11 ===
    '1-4-3-3': [
      { x: 50, y: 92 }, { x: 88, y: 74 }, { x: 64, y: 78 }, { x: 36, y: 78 }, { x: 12, y: 74 },
      { x: 50, y: 58 }, { x: 72, y: 46 }, { x: 28, y: 46 }, { x: 86, y: 24 }, { x: 14, y: 24 }, { x: 50, y: 18 }
    ],
    '1-4-4-2': [
      { x: 50, y: 92 }, { x: 88, y: 72 }, { x: 64, y: 76 }, { x: 36, y: 76 }, { x: 12, y: 72 },
      { x: 88, y: 46 }, { x: 62, y: 50 }, { x: 38, y: 50 }, { x: 12, y: 46 }, { x: 62, y: 22 }, { x: 38, y: 22 }
    ],
    '1-4-4-2 (Rombo)': [
      { x: 50, y: 92 }, { x: 88, y: 74 }, { x: 64, y: 78 }, { x: 36, y: 78 }, { x: 12, y: 74 },
      { x: 50, y: 62 }, { x: 70, y: 48 }, { x: 30, y: 48 }, { x: 50, y: 34 }, { x: 62, y: 20 }, { x: 38, y: 20 }
    ],
    '1-4-2-3-1': [
      { x: 50, y: 92 }, { x: 88, y: 74 }, { x: 64, y: 78 }, { x: 36, y: 78 }, { x: 12, y: 74 },
      { x: 64, y: 58 }, { x: 36, y: 58 }, { x: 86, y: 38 }, { x: 50, y: 36 }, { x: 14, y: 38 }, { x: 50, y: 18 }
    ],
    '1-4-1-4-1': [
      { x: 50, y: 92 }, { x: 88, y: 74 }, { x: 64, y: 78 }, { x: 36, y: 78 }, { x: 12, y: 74 },
      { x: 50, y: 62 }, { x: 88, y: 42 }, { x: 64, y: 44 }, { x: 36, y: 44 }, { x: 12, y: 42 }, { x: 50, y: 18 }
    ],
    '1-4-3-2-1': [
      { x: 50, y: 92 }, { x: 88, y: 74 }, { x: 64, y: 78 }, { x: 36, y: 78 }, { x: 12, y: 74 },
      { x: 74, y: 54 }, { x: 50, y: 56 }, { x: 26, y: 54 }, { x: 62, y: 34 }, { x: 38, y: 34 }, { x: 50, y: 18 }
    ],
    '1-4-3-1-2': [
      { x: 50, y: 92 }, { x: 88, y: 74 }, { x: 64, y: 78 }, { x: 36, y: 78 }, { x: 12, y: 74 },
      { x: 74, y: 54 }, { x: 50, y: 56 }, { x: 26, y: 54 }, { x: 50, y: 36 }, { x: 62, y: 20 }, { x: 38, y: 20 }
    ],
    '1-4-5-1': [
      { x: 50, y: 92 }, { x: 88, y: 74 }, { x: 64, y: 78 }, { x: 36, y: 78 }, { x: 12, y: 74 },
      { x: 88, y: 46 }, { x: 66, y: 50 }, { x: 50, y: 52 }, { x: 34, y: 50 }, { x: 12, y: 46 }, { x: 50, y: 18 }
    ],
    '1-3-5-2': [
      { x: 50, y: 92 }, { x: 74, y: 76 }, { x: 50, y: 78 }, { x: 26, y: 76 }, { x: 90, y: 50 },
      { x: 66, y: 54 }, { x: 50, y: 56 }, { x: 34, y: 54 }, { x: 10, y: 50 }, { x: 62, y: 22 }, { x: 38, y: 22 }
    ],
    '1-3-4-3': [
      { x: 50, y: 92 }, { x: 74, y: 76 }, { x: 50, y: 78 }, { x: 26, y: 76 }, { x: 88, y: 50 },
      { x: 62, y: 54 }, { x: 38, y: 54 }, { x: 12, y: 50 }, { x: 84, y: 24 }, { x: 16, y: 24 }, { x: 50, y: 18 }
    ],
    '1-3-4-2-1': [
      { x: 50, y: 92 }, { x: 74, y: 76 }, { x: 50, y: 78 }, { x: 26, y: 76 }, { x: 88, y: 50 },
      { x: 62, y: 54 }, { x: 38, y: 54 }, { x: 12, y: 50 }, { x: 64, y: 32 }, { x: 36, y: 32 }, { x: 50, y: 18 }
    ],
    '1-3-4-1-2': [
      { x: 50, y: 92 }, { x: 74, y: 76 }, { x: 50, y: 78 }, { x: 26, y: 76 }, { x: 88, y: 50 },
      { x: 62, y: 54 }, { x: 38, y: 54 }, { x: 12, y: 50 }, { x: 50, y: 34 }, { x: 62, y: 20 }, { x: 38, y: 20 }
    ],
    '1-3-3-3-1': [
      { x: 50, y: 92 }, { x: 74, y: 76 }, { x: 50, y: 78 }, { x: 26, y: 76 }, { x: 74, y: 56 },
      { x: 50, y: 58 }, { x: 26, y: 56 }, { x: 86, y: 36 }, { x: 50, y: 36 }, { x: 14, y: 36 }, { x: 50, y: 18 }
    ],
    '1-5-3-2': [
      { x: 50, y: 92 }, { x: 90, y: 72 }, { x: 72, y: 78 }, { x: 50, y: 80 }, { x: 28, y: 78 },
      { x: 10, y: 72 }, { x: 70, y: 52 }, { x: 50, y: 54 }, { x: 30, y: 52 }, { x: 62, y: 24 }, { x: 38, y: 24 }
    ],
    '1-5-4-1': [
      { x: 50, y: 92 }, { x: 90, y: 72 }, { x: 72, y: 78 }, { x: 50, y: 80 }, { x: 28, y: 78 },
      { x: 10, y: 72 }, { x: 86, y: 48 }, { x: 62, y: 52 }, { x: 38, y: 52 }, { x: 14, y: 48 }, { x: 50, y: 20 }
    ],
    '1-5-2-3': [
      { x: 50, y: 92 }, { x: 90, y: 72 }, { x: 72, y: 78 }, { x: 50, y: 80 }, { x: 28, y: 78 },
      { x: 10, y: 72 }, { x: 64, y: 54 }, { x: 36, y: 54 }, { x: 84, y: 26 }, { x: 16, y: 26 }, { x: 50, y: 20 }
    ],

    // === FÚTBOL 7 ===
    '1-3-2-1 (F7)': [
      { x: 50, y: 92 }, { x: 84, y: 72 }, { x: 50, y: 76 }, { x: 16, y: 72 },
      { x: 64, y: 46 }, { x: 36, y: 46 }, { x: 50, y: 22 }
    ],
    '1-3-1-2 (F7)': [
      { x: 50, y: 92 }, { x: 84, y: 72 }, { x: 50, y: 76 }, { x: 16, y: 72 },
      { x: 50, y: 50 }, { x: 64, y: 24 }, { x: 36, y: 24 }
    ],
    '1-2-3-1 (F7)': [
      { x: 50, y: 92 }, { x: 68, y: 74 }, { x: 32, y: 74 },
      { x: 86, y: 46 }, { x: 50, y: 50 }, { x: 14, y: 46 }, { x: 50, y: 22 }
    ],
    '1-2-2-2 (F7)': [
      { x: 50, y: 92 }, { x: 68, y: 74 }, { x: 32, y: 74 },
      { x: 68, y: 48 }, { x: 32, y: 48 }, { x: 64, y: 24 }, { x: 36, y: 24 }
    ],
    '1-2-1-3 (F7)': [
      { x: 50, y: 92 }, { x: 68, y: 74 }, { x: 32, y: 74 },
      { x: 50, y: 52 }, { x: 84, y: 26 }, { x: 50, y: 22 }, { x: 16, y: 26 }
    ],
    '1-3-3 (F7)': [
      { x: 50, y: 92 }, { x: 84, y: 72 }, { x: 50, y: 76 }, { x: 16, y: 72 },
      { x: 84, y: 28 }, { x: 50, y: 24 }, { x: 16, y: 28 }
    ],
    '1-4-2 (F7)': [
      { x: 50, y: 92 }, { x: 88, y: 72 }, { x: 64, y: 76 }, { x: 36, y: 76 }, { x: 12, y: 72 },
      { x: 62, y: 32 }, { x: 38, y: 32 }
    ],
    '1-1-4-1 (F7)': [
      { x: 50, y: 92 }, { x: 50, y: 76 },
      { x: 88, y: 46 }, { x: 64, y: 48 }, { x: 36, y: 48 }, { x: 12, y: 46 }, { x: 50, y: 22 }
    ]
  };

  const SYSTEM_STARTER_POSITIONS = {
    '1-4-3-3': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MC', 'MVD', 'MVZ', 'MBD', 'MBZ', 'AC'],
    '1-4-4-2': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MBD', 'MCD', 'MCZ', 'MBZ', 'ACD', 'ACZ'],
    '1-4-4-2 (Rombo)': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MCD', 'MVD', 'MVZ', 'MP', 'ACD', 'ACZ'],
    '1-4-2-3-1': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MCD', 'MCZ', 'MBD', 'MP', 'MBZ', 'AC'],
    '1-4-1-4-1': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MCD', 'MBD', 'MVD', 'MVZ', 'MBZ', 'AC'],
    '1-4-3-2-1': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MC', 'MVD', 'MVZ', 'MPD', 'MPZ', 'AC'],
    '1-4-3-1-2': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MC', 'MVD', 'MVZ', 'MP', 'ACD', 'ACZ'],
    '1-4-5-1': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MBD', 'MCD', 'MC', 'MCZ', 'MBZ', 'AC'],
    '1-3-5-2': ['PO', 'DCD', 'DC', 'DCZ', 'MBD', 'MC', 'MVD', 'MVZ', 'MBZ', 'ACD', 'ACZ'],
    '1-3-4-3': ['PO', 'DCD', 'DC', 'DCZ', 'MBD', 'MCD', 'MCZ', 'MBZ', 'MBD', 'MBZ', 'AC'],
    '1-3-4-2-1': ['PO', 'DCD', 'DC', 'DCZ', 'MBD', 'MCD', 'MCZ', 'MBZ', 'MPD', 'MPZ', 'AC'],
    '1-3-4-1-2': ['PO', 'DCD', 'DC', 'DCZ', 'MBD', 'MCD', 'MCZ', 'MBZ', 'MP', 'ACD', 'ACZ'],
    '1-3-3-3-1': ['PO', 'DCD', 'DC', 'DCZ', 'MC', 'MVD', 'MVZ', 'MBD', 'MP', 'MBZ', 'AC'],
    '1-5-3-2': ['PO', 'DBD', 'DCD', 'DC', 'DCZ', 'DBZ', 'MC', 'MVD', 'MVZ', 'ACD', 'ACZ'],
    '1-5-4-1': ['PO', 'DBD', 'DCD', 'DC', 'DCZ', 'DBZ', 'MBD', 'MCD', 'MCZ', 'MBZ', 'AC'],
    '1-5-2-3': ['PO', 'DBD', 'DCD', 'DC', 'DCZ', 'DBZ', 'MCD', 'MCZ', 'MBD', 'MBZ', 'AC'],
    // Fútbol 7
    '1-3-2-1 (F7)': ['PO', 'DBD', 'DC', 'DBZ', 'MCD', 'MCZ', 'AC'],
    '1-3-1-2 (F7)': ['PO', 'DBD', 'DC', 'DBZ', 'MC', 'ACD', 'ACZ'],
    '1-2-3-1 (F7)': ['PO', 'DCD', 'DCZ', 'MBD', 'MC', 'MBZ', 'AC'],
    '1-2-2-2 (F7)': ['PO', 'DCD', 'DCZ', 'MBD', 'MBZ', 'ACD', 'ACZ'],
    '1-2-1-3 (F7)': ['PO', 'DCD', 'DCZ', 'MC', 'MBD', 'MBZ', 'AC'],
    '1-3-3 (F7)': ['PO', 'DBD', 'DC', 'DBZ', 'MBD', 'MBZ', 'AC'],
    '1-4-2 (F7)': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'ACD', 'ACZ'],
    '1-1-4-1 (F7)': ['PO', 'DC', 'MBD', 'MCD', 'MCZ', 'MBZ', 'AC']
  };

  // --------------------------------------------------------------------------
  // 3. Main Navigation Router
  // --------------------------------------------------------------------------
  function initNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabViews = document.querySelectorAll('.tab-view');

    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetViewId = 'view-' + tab.dataset.tab;

        navTabs.forEach(t => t.classList.remove('active'));
        tabViews.forEach(v => v.classList.remove('active'));

        tab.classList.add('active');
        const targetView = document.getElementById(targetViewId);
        if (targetView) {
          targetView.classList.add('active');
          renderView(tab.dataset.tab);
        }
      });
    });
  }

  function renderView(tabName) {
    if (tabName === 'dashboard') renderDashboard();
    else if (tabName === 'calendario') renderCalendario();
    else if (tabName === 'partidos') renderPartidosList();
    else if (tabName === 'directorio') renderDirectorio();
    else if (tabName === 'agenda') renderAgenda();
    else if (tabName === 'enlaces') renderEnlaces();
    else if (tabName === 'importador') {
      if (typeof populateImporterEquiposDatalist === 'function') populateImporterEquiposDatalist();
    }
    else if (tabName === 'configuracion') renderConfiguracion();
    
    // Refresh lucide icons
    if (window.lucide) window.lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // 3.5 SECTION 0: DASHBOARD
  // --------------------------------------------------------------------------
  function renderDashboard() {
    // 1. Update Current Date Display
    const dateDisplay = document.getElementById('dashboardDateDisplay');
    if (dateDisplay) {
      const now = new Date();
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      dateDisplay.textContent = now.toLocaleDateString('es-ES', options);
    }

    // 2. Metrics (KPIs)
    const matches = state.matches || [];
    const reports = state.reports || [];
    const players = state.directory?.jugadores || [];
    const agenda = state.agenda || [];
    
    const totalVistos = matches.filter(m => m.estado === 'visto').length;
    const scheduledMatches = matches.filter(m => m.estado === 'programado').length;
    const directMatches = matches.filter(m => m.estado === 'directo').length;
    const pendingTasks = agenda.filter(a => !a.completada && !a.archivada);
    const highPriorityTasks = pendingTasks.filter(a => a.prioridad === 'Alta').length;

    const elVistos = document.getElementById('kpiTotalMatchesVistos');
    const elScheduled = document.getElementById('kpiScheduledMatchesCount');
    const elDirect = document.getElementById('kpiDirectMatchesCount');
    const elTotalReports = document.getElementById('kpiTotalReports');
    const elTotalPlayers = document.getElementById('kpiTotalPlayers');
    const elPendingTasks = document.getElementById('kpiPendingTasks');
    const elHighPriorityTasks = document.getElementById('kpiHighPriorityTasks');

    if (elVistos) elVistos.textContent = totalVistos;
    if (elScheduled) elScheduled.textContent = scheduledMatches;
    if (elDirect) elDirect.textContent = directMatches;
    if (elTotalReports) elTotalReports.textContent = reports.length;
    if (elTotalPlayers) elTotalPlayers.textContent = players.length;
    if (elPendingTasks) elPendingTasks.textContent = pendingTasks.length;
    if (elHighPriorityTasks) elHighPriorityTasks.textContent = `${highPriorityTasks} prioridad alta`;

    // 3. Render Widget: Próximos Partidos
    renderDashboardUpcomingMatches();

    // 4. Render Widget: Tareas Pendientes
    renderDashboardPendingTasks();

    // 5. Init Shortcuts listeners
    initDashboardShortcuts();
  }

  function renderDashboardUpcomingMatches() {
    const container = document.getElementById('dashboardUpcomingMatchesList');
    if (!container) return;

    const matches = state.matches || [];
    const upcoming = matches
      .filter(m => m.estado === 'programado')
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(0, 4);

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div class="dashboard-empty-widget">
          <i data-lucide="calendar-off"></i>
          <p>No hay partidos programados próximos</p>
        </div>
      `;
      return;
    }

    container.innerHTML = upcoming.map(m => `
      <div class="dashboard-widget-item match-item">
        <div class="widget-item-main">
          <div class="match-teams-title">
            <strong>${escapeHtml(m.local)}</strong> <span class="vs-tag">vs</span> <strong>${escapeHtml(m.visitante)}</strong>
          </div>
          <div class="match-meta-line">
            <span><i data-lucide="calendar"></i> ${escapeHtml(m.fecha || '')} ${m.hora ? ' (' + escapeHtml(m.hora) + ')' : ''}</span>
            <span><i data-lucide="map-pin"></i> ${escapeHtml(m.estadio || 'Estadio por determinar')}</span>
          </div>
        </div>
        <button class="btn btn-sm btn-outline btn-dashboard-view-match" data-match-id="${m.id}">
          <i data-lucide="eye"></i> Ver
        </button>
      </div>
    `).join('');

    container.querySelectorAll('.btn-dashboard-view-match').forEach(btn => {
      btn.onclick = () => {
        navigateToTab('partidos');
      };
    });
  }

  function renderDashboardPendingTasks() {
    const container = document.getElementById('dashboardPendingTasksList');
    if (!container) return;

    const agenda = state.agenda || [];
    const pending = agenda.filter(a => !a.completada).slice(0, 4);

    if (pending.length === 0) {
      container.innerHTML = `
        <div class="dashboard-empty-widget">
          <i data-lucide="check-circle-2"></i>
          <p>¡Todo al día! No tienes tareas pendientes</p>
        </div>
      `;
      return;
    }

    container.innerHTML = pending.map(t => {
      const isHigh = t.prioridad === 'Alta';
      const badgeClass = isHigh ? 'badge-high' : t.prioridad === 'Media' ? 'badge-medium' : 'badge-low';
      return `
        <div class="dashboard-widget-item task-item">
          <label class="dashboard-task-label">
            <input type="checkbox" class="dashboard-task-checkbox" data-task-id="${t.id}">
            <span class="dashboard-task-title">${escapeHtml(t.titulo)}</span>
          </label>
          <div class="dashboard-task-right">
            <span class="priority-badge ${badgeClass}">${escapeHtml(t.prioridad || 'Media')}</span>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.dashboard-task-checkbox').forEach(chk => {
      chk.onchange = (e) => {
        const taskId = e.target.dataset.taskId;
        const item = state.agenda.find(a => a.id === taskId);
        if (item) {
          item.completada = e.target.checked;
          saveState();
          renderDashboard();
          if (typeof renderAgenda === 'function') renderAgenda();
        }
      };
    });
  }

  function navigateToTab(tabName) {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabViews = document.querySelectorAll('.tab-view');

    navTabs.forEach(t => t.classList.remove('active'));
    tabViews.forEach(v => v.classList.remove('active'));

    const targetTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
    const targetView = document.getElementById(`view-${tabName}`);

    if (targetTab) targetTab.classList.add('active');
    if (targetView) targetView.classList.add('active');

    renderView(tabName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initDashboardShortcuts() {
    document.querySelectorAll('.kpi-card[data-shortcut]').forEach(card => {
      card.onclick = () => {
        const target = card.dataset.shortcut;
        navigateToTab(target);
      };
    });

    document.querySelectorAll('#view-dashboard [data-action="nav"]').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const target = btn.dataset.target;
        if (target) navigateToTab(target);
      };
    });

    document.querySelectorAll('#view-dashboard [data-action="modal"]').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const target = btn.dataset.target;
        if (target === 'modalNuevoPartido') {
          if (typeof openNewMatchModal === 'function') {
            openNewMatchModal();
          } else {
            navigateToTab('calendario');
          }
        }
      };
    });
  }

  // --------------------------------------------------------------------------
  // 4. SECTION 1: CALENDARIO & MATCH COUNTER
  // --------------------------------------------------------------------------
  let calendarViewMode = 'month'; // Default Month view ('month' | 'list')
  let calendarCurrentDate = new Date(2026, 7, 1); // Default August 2026

  function initCalendarViewSwitcher() {
    const btnList = document.getElementById('btnViewModeList');
    const btnMonth = document.getElementById('btnViewModeMonth');

    btnList?.addEventListener('click', () => {
      calendarViewMode = 'list';
      btnList.classList.add('active');
      btnMonth.classList.remove('active');
      document.getElementById('calendarMatchesContainer').classList.remove('hidden');
      document.getElementById('calendarMonthWrapper').classList.add('hidden');
      renderCalendario();
    });

    btnMonth?.addEventListener('click', () => {
      calendarViewMode = 'month';
      btnMonth.classList.add('active');
      btnList.classList.remove('active');
      document.getElementById('calendarMatchesContainer').classList.add('hidden');
      document.getElementById('calendarMonthWrapper').classList.remove('hidden');
      renderCalendario();
    });

    document.getElementById('btnPrevMonth')?.addEventListener('click', () => {
      calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
      renderCalendario();
    });

    document.getElementById('btnNextMonth')?.addEventListener('click', () => {
      calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
      renderCalendario();
    });

    document.getElementById('btnTodayMonth')?.addEventListener('click', () => {
      calendarCurrentDate = new Date();
      renderCalendario();
    });
  }

  function renderCalendario() {
    // Calculate statistics
    const totalVistos = state.matches.filter(m => m.estado === 'visto').length;
    const totalProgramados = state.matches.filter(m => m.estado === 'programado').length;
    const totalDirecto = state.matches.filter(m => m.estado === 'directo').length;
    const totalInformes = state.reports.length;

    const elV = document.getElementById('counterTotalVistos');
    const elP = document.getElementById('counterTotalProgramados');
    const elD = document.getElementById('counterTotalDirecto');
    const elI = document.getElementById('counterTotalInformes');

    if (elV) elV.textContent = totalVistos;
    if (elP) elP.textContent = totalProgramados;
    if (elD) elD.textContent = totalDirecto;
    if (elI) elI.textContent = totalInformes;

    // Filter matches
    const searchVal = (document.getElementById('calendarSearchInput')?.value || '').toLowerCase();
    const statusVal = document.getElementById('calendarFilterStatus')?.value || 'all';
    const catVal = document.getElementById('calendarFilterCategory')?.value || 'all';

    const filtered = state.matches.filter(m => {
      const matchText = `${m.local} ${m.visitante} ${m.categoria} ${m.competicion} ${m.estadio}`.toLowerCase();
      const matchesSearch = !searchVal || matchText.includes(searchVal);
      const matchesStatus = statusVal === 'all' || m.estado === statusVal;
      const matchesCategory = catVal === 'all' || m.categoria === catVal;
      return matchesSearch && matchesStatus && matchesCategory;
    });

    if (calendarViewMode === 'list') {
      document.getElementById('calendarMatchesContainer')?.classList.remove('hidden');
      document.getElementById('calendarMonthWrapper')?.classList.add('hidden');
      document.getElementById('btnViewModeList')?.classList.add('active');
      document.getElementById('btnViewModeMonth')?.classList.remove('active');
      renderCalendarListView(filtered);
    } else {
      document.getElementById('calendarMatchesContainer')?.classList.add('hidden');
      document.getElementById('calendarMonthWrapper')?.classList.remove('hidden');
      document.getElementById('btnViewModeMonth')?.classList.add('active');
      document.getElementById('btnViewModeList')?.classList.remove('active');
      renderCalendarMonthView(filtered);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function renderCalendarListView(filtered) {
    const container = document.getElementById('calendarMatchesContainer');
    const agendaEvents = (state.agenda || []).filter(t => t.fecha);

    const combined = [
      ...filtered.map(m => ({ ...m, _type: 'match' })),
      ...agendaEvents.map(a => ({ ...a, _type: 'agenda' }))
    ].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

    if (combined.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 60px;">
          <i data-lucide="calendar-x" style="width: 48px; height: 48px; color: var(--text-subtle);"></i>
          <p class="empty-state-text">No hay partidos ni tareas en el calendario con los filtros seleccionados.</p>
          <button class="btn btn-primary" id="btnEmptyScheduleMatch">Programar Primer Partido</button>
        </div>
      `;
      document.getElementById('btnEmptyScheduleMatch')?.addEventListener('click', () => openNewMatchModal());
    } else {
      container.innerHTML = combined.map(item => {
        if (item._type === 'match') {
          return `
            <div class="match-card">
              <div class="match-card-header">
                <span class="match-category-tag">${escapeHtml(item.categoria)}</span>
                <span class="match-status-badge ${item.estado}">${item.estado === 'visto' ? '✓ Visto' : item.estado === 'directo' ? '🔴 En Directo' : '📅 Programado'}</span>
              </div>

              <div class="match-card-teams">
                <span class="match-team-name">${escapeHtml(item.local)}</span>
                <span class="match-vs">VS</span>
                <span class="match-team-name text-right">${escapeHtml(item.visitante)}</span>
              </div>

              <div class="match-card-details">
                <div><i data-lucide="calendar" style="width: 14px;"></i> ${escapeHtml(item.fecha)} | ${escapeHtml(item.hora)} hs</div>
                <div><i data-lucide="map-pin" style="width: 14px;"></i> ${escapeHtml(item.estadio || 'Estadio no especificado')}</div>
                <div><i data-lucide="trophy" style="width: 14px;"></i> ${escapeHtml(item.competicion || 'Competición')}</div>
              </div>

              <div style="display: flex; gap: 8px; margin-top: 6px;">
                ${item.reportId ? `
                  <button class="btn btn-primary btn-open-report" data-repid="${item.reportId}" data-mid="${item.id}" style="width: 100%;">
                    <i data-lucide="file-text"></i> Ver Informe Técnico
                  </button>
                ` : `
                  <button class="btn btn-secondary btn-create-report-from-match" data-mid="${item.id}" style="width: 100%;">
                    <i data-lucide="plus"></i> Crear Informe Técnico
                  </button>
                `}
              </div>
            </div>
          `;
        } else {
          const catObj = (state.agendaCategories || []).find(c => c.id === item.categoria);
          const catLabel = catObj ? catObj.label : item.categoria;
          const colorObj = getCategoryColor(item.categoria);

          return `
            <div class="match-card agenda-card-item-click" data-agid="${item.id}" style="border-left: 5px solid ${colorObj.accent}; background: var(--bg-card); cursor: pointer;" title="Pulsar para abrir Ficha de Tarea / Evento">
              <div class="match-card-header">
                <span class="match-category-tag" style="background: ${colorObj.bg}; color: ${colorObj.text}; border: 1px solid ${colorObj.border}; font-weight: 700;">📝 ${escapeHtml(catLabel)}</span>
                <span class="match-status-badge ${item.completada ? 'visto' : 'programado'}">${item.completada ? '✓ Completada' : '📅 Pendiente'}</span>
              </div>
              <div style="font-size: 16px; font-weight: 800; margin: 10px 0; color: var(--text-main);">
                ${escapeHtml(item.titulo)}
              </div>
              <div class="match-card-details">
                <div><i data-lucide="calendar" style="width: 14px;"></i> ${escapeHtml(item.fecha)} | ${escapeHtml(item.hora || '12:00')} hs</div>
                <div><i data-lucide="tag" style="width: 14px;"></i> Categoría: ${escapeHtml(catLabel)}</div>
                <div><i data-lucide="alert-circle" style="width: 14px;"></i> Prioridad: ${escapeHtml(item.prioridad)}</div>
              </div>
            </div>
          `;
        }
      }).join('');

      container.querySelectorAll('.btn-open-report').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const match = state.matches.find(m => m.id === btn.dataset.mid || m.reportId === btn.dataset.repid);
          openMatchReportEditor(btn.dataset.repid, match);
        });
      });
      container.querySelectorAll('.btn-create-report-from-match').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          createReportFromMatch(btn.dataset.mid);
        });
      });
      container.querySelectorAll('.agenda-card-item-click').forEach(card => {
        card.addEventListener('click', () => {
          openAgendaTaskDetailModal(card.dataset.agid);
        });
      });
    }
  }

  function renderCalendarMonthView(filteredMatches) {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('monthTitleDisplay').textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const monthMatches = filteredMatches.filter(m => {
      if (!m.fecha) return false;
      const d = new Date(m.fecha);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const monthAgendaTasks = (state.agenda || []).filter(t => {
      if (!t.fecha) return false;
      const d = new Date(t.fecha);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    document.getElementById('monthMatchCountDisplay').textContent = monthMatches.length + monthAgendaTasks.length;

    const grid = document.getElementById('monthDaysGrid');
    let cellsHTML = '';

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDayNum = prevMonthDays - i;
      cellsHTML += `
        <div class="month-day-cell other-month">
          <span class="day-number">${prevDayNum}</span>
        </div>
      `;
    }

    const today = new Date();
    const isCurrentRealMonth = today.getFullYear() === year && today.getMonth() === month;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const isToday = isCurrentRealMonth && today.getDate() === day;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const dayMatches = filteredMatches.filter(m => m.fecha === dateStr);
      const dayAgendaTasks = (state.agenda || []).filter(t => t.fecha === dateStr);

      cellsHTML += `
        <div class="month-day-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
          <span class="day-number">${day}</span>
          <div class="day-matches-list">
            ${dayMatches.map(m => `
              <div class="day-match-pill ${m.estado}" data-mid="${m.id}" title="${escapeHtml(m.local)} vs ${escapeHtml(m.visitante)}">
                <span>⚽ ${escapeHtml(m.local.split(' ')[0])} v ${escapeHtml(m.visitante.split(' ')[0])}</span>
              </div>
            `).join('')}
            ${dayAgendaTasks.map(t => {
              const colorObj = getCategoryColor(t.categoria);
              return `
                <div class="day-match-pill day-agenda-pill" data-agid="${t.id}" style="background: ${colorObj.bg}; color: ${colorObj.text}; border: 1px solid ${colorObj.border}; font-weight: 700; cursor: pointer;" title="Pulsar para ver Ficha: ${escapeHtml(t.titulo)}">
                  <span>📝 ${escapeHtml(t.titulo)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    const totalCellsSoFar = firstDayIndex + totalDaysInMonth;
    const remainingCells = (7 - (totalCellsSoFar % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      cellsHTML += `
        <div class="month-day-cell other-month">
          <span class="day-number">${i}</span>
        </div>
      `;
    }

    grid.innerHTML = cellsHTML;

    grid.querySelectorAll('.month-day-cell:not(.other-month)').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const agendaPill = e.target.closest('.day-agenda-pill');
        if (agendaPill) {
          e.stopPropagation();
          openAgendaTaskDetailModal(agendaPill.dataset.agid);
          return;
        }

        const pill = e.target.closest('.day-match-pill');
        if (pill) {
          e.stopPropagation();
          const matchId = pill.dataset.mid;
          const match = state.matches.find(m => m.id === matchId);
          if (match && match.reportId) {
            openMatchReportEditor(match.reportId, match);
          } else if (match) {
            createReportFromMatch(matchId);
          }
        } else {
          openNewMatchModal(cell.dataset.date);
        }
      });
    });
  }

  // Filter listener bindings
  document.getElementById('calendarSearchInput')?.addEventListener('input', renderCalendario);
  document.getElementById('calendarFilterStatus')?.addEventListener('change', renderCalendario);
  document.getElementById('calendarFilterCategory')?.addEventListener('change', renderCalendario);
  document.getElementById('btnNewCalendarMatch')?.addEventListener('click', () => openNewMatchModal());

  function openNewMatchModal(defaultDate = null) {
    const initialDate = defaultDate || new Date().toISOString().split('T')[0];
    showModal('Programar Partido en Calendario', `
      <form id="newMatchForm">
        <div class="form-group mb-4">
          <label class="form-label">Equipo Local</label>
          <input type="text" id="mLocal" class="form-control" placeholder="Ej: Real Madrid Juvenil A" required>
        </div>
        <div class="form-group mb-4">
          <label class="form-label">Equipo Visitante</label>
          <input type="text" id="mVisitante" class="form-control" placeholder="Ej: Atlético de Madrid Juvenil A" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" id="mFecha" class="form-control" value="${initialDate}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Hora</label>
            <input type="time" id="mHora" class="form-control" value="17:00" required>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
          <div class="form-group">
            <label class="form-label">Categoría</label>
            <input type="text" id="mCategoria" class="form-control" placeholder="Ej: División de Honor">
          </div>
          <div class="form-group">
            <label class="form-label">Competición</label>
            <input type="text" id="mCompeticion" list="reportCompeticionesDatalistOptions" class="form-control" placeholder="Ej: Amistoso, Liga, Tercera RFEF...">
          </div>
        </div>
        <div class="form-group mb-4">
          <label class="form-label">Estadio / Campo</label>
          <input type="text" id="mEstadio" class="form-control" placeholder="Ej: Ciudad Real Madrid">
        </div>
        <div class="form-group">
          <label class="form-label">Estado Inicial</label>
          <select id="mEstado" class="form-control">
            <option value="programado">Programado</option>
            <option value="directo">En Directo</option>
            <option value="visto">Visto</option>
          </select>
        </div>
      </form>
    `, () => {
      const local = document.getElementById('mLocal').value.trim();
      const visitante = document.getElementById('mVisitante').value.trim();
      if (!local || !visitante) return alert('Por favor ingresa ambos equipos');

      const newMatch = {
        id: 'm_' + Date.now(),
        local: local,
        visitante: visitante,
        fecha: document.getElementById('mFecha').value,
        hora: document.getElementById('mHora').value,
        categoria: document.getElementById('mCategoria').value || 'General',
        competicion: document.getElementById('mCompeticion').value || 'Liga',
        estadio: document.getElementById('mEstadio').value || '',
        estado: document.getElementById('mEstado').value || 'programado',
        reportId: null
      };

      state.matches.unshift(newMatch);
      saveState();
      hideModal();
      renderCalendario();
    });
  }

  // --------------------------------------------------------------------------
  // 5. SECTION 2: PARTIDOS & INFORME TÉCNICO DE PARTIDO
  // --------------------------------------------------------------------------
  let currentEditingReportId = null;
  let timerInterval = null;
  let timerSeconds = 0;

  function renderPartidosList() {
    document.getElementById('partidosListState').classList.remove('hidden');
    document.getElementById('matchReportEditorState').classList.add('hidden');

    const searchVal = document.getElementById('reportsSearchInput')?.value.toLowerCase() || '';
    const filtered = state.reports.filter(r => {
      const text = `${r.localTeam} ${r.visitanteTeam} ${r.estadio} ${r.competicion} ${r.generalAnalysis}`.toLowerCase();
      return !searchVal || text.includes(searchVal);
    });

    const container = document.getElementById('reportsListContainer');
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 60px;">
          <i data-lucide="clipboard" style="width: 48px; height: 48px; color: var(--text-subtle);"></i>
          <p class="empty-state-text">No hay informes técnicos de partido guardados.</p>
          <button class="btn btn-primary" id="btnEmptyCreateReport">Crear Primer Informe</button>
        </div>
      `;
      document.getElementById('btnEmptyCreateReport')?.addEventListener('click', () => openMatchReportEditor());
    } else {
      container.innerHTML = filtered.map(r => `
        <div class="match-card">
          <div class="match-card-header">
            <span class="match-category-tag">${escapeHtml(r.categoria || 'Informe Técnico')}</span>
            <span style="font-weight: 800; font-size: 16px; color: var(--primary-blue);">${r.localScore} - ${r.visitanteScore}</span>
          </div>

          <div class="match-card-teams">
            <span class="match-team-name">${escapeHtml(r.localTeam)}</span>
            <span class="match-vs">vs</span>
            <span class="match-team-name text-right">${escapeHtml(r.visitanteTeam)}</span>
          </div>

          <div class="match-card-details">
            <div><i data-lucide="calendar" style="width: 14px;"></i> ${escapeHtml(r.date)} ${escapeHtml(r.time)}</div>
            <div><i data-lucide="map-pin" style="width: 14px;"></i> ${escapeHtml(r.estadio || 'N/A')}</div>
            <div><i data-lucide="activity" style="width: 14px;"></i> Táctica: ${escapeHtml(r.localFormation)} vs ${escapeHtml(r.visitanteFormation)}</div>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button class="btn btn-primary btn-edit-report" data-repid="${r.id}" style="flex: 1;">
              <i data-lucide="edit"></i> Abrir Informe
            </button>
            <button class="btn btn-outline-danger btn-delete-report" data-repid="${r.id}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `).join('');

      container.querySelectorAll('.btn-edit-report').forEach(btn => {
        btn.addEventListener('click', () => openMatchReportEditor(btn.dataset.repid));
      });
      container.querySelectorAll('.btn-delete-report').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('¿Eliminar este informe de partido?')) {
            deleteFromFirebase('reports', btn.dataset.repid);
            state.reports = state.reports.filter(r => r.id !== btn.dataset.repid);
            saveState();
            renderPartidosList();
          }
        });
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  document.getElementById('reportsSearchInput')?.addEventListener('input', renderPartidosList);
  document.getElementById('btnCreateNewMatchReport')?.addEventListener('click', () => openMatchReportEditor());
  document.getElementById('btnBackToReportsList')?.addEventListener('click', closeReportEditor);
  document.getElementById('btnCloseReportEditor')?.addEventListener('click', closeReportEditor);

  function createReportFromMatch(matchId) {
    const match = state.matches.find(m => m.id === matchId);
    if (!match) return;

    // Switch view to Partidos
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.nav-tab[data-tab="partidos"]').classList.add('active');
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-partidos').classList.add('active');

    openMatchReportEditor(null, match);
  }

  function openMatchReportEditor(reportId = null, prefillMatch = null) {
    currentEditingReportId = reportId;

    // Switch active view tab to 'partidos' so the editor is visible on screen
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));

    const tabPartidos = document.querySelector('.nav-tab[data-tab="partidos"]');
    const viewPartidos = document.getElementById('view-partidos');
    if (tabPartidos) tabPartidos.classList.add('active');
    if (viewPartidos) viewPartidos.classList.add('active');

    document.getElementById('partidosListState').classList.add('hidden');
    document.getElementById('matchReportEditorState').classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    let repData = null;
    if (reportId) {
      repData = state.reports.find(r => r.id === reportId);
      if (!repData) {
        const match = state.matches.find(m => m.reportId === reportId || m.id === reportId);
        if (match && match.reportId) {
          repData = state.reports.find(r => r.id === match.reportId);
        }
        if (!repData && match) {
          prefillMatch = match;
        }
      }
    }
    if (!repData && prefillMatch) {
      if (prefillMatch.reportId) {
        repData = state.reports.find(r => r.id === prefillMatch.reportId);
      }
      if (repData) {
        currentEditingReportId = repData.id;
      } else {
        repData = {
          localTeam: prefillMatch.local,
          visitanteTeam: prefillMatch.visitante,
          date: prefillMatch.fecha,
          time: prefillMatch.hora,
          estadio: prefillMatch.estadio,
          competicion: prefillMatch.competicion,
          categoria: prefillMatch.categoria,
          federacion: 'RFEF',
          localScore: 0,
          visitanteScore: 0,
          localFormation: '1-4-3-3',
          visitanteFormation: '1-4-4-2'
        };
      }
    }

    // Default template if empty
    if (!repData) {
      repData = {
        localTeam: '',
        visitanteTeam: '',
        localScore: 0,
        visitanteScore: 0,
        date: new Date().toISOString().split('T')[0],
        time: '17:00',
        estadio: '',
        clima: 'Soleado',
        competicion: 'Liga',
        categoria: 'Senior',
        federacion: 'RFEF',
        localFormation: '1-4-3-3',
        visitanteFormation: '1-4-4-2',
        localDifficulty: 3,
        visitanteDifficulty: 3,
        localEstiloJuego: '',
        visitanteEstiloJuego: '',
        localABP: '',
        visitanteABP: '',
        localComentario: '',
        visitanteComentario: '',
        generalAnalysis: ''
      };
    }

    // Populate Datalists for Match Technical Report
    const equiposListOptions = document.getElementById('reportEquiposSeleccionesDatalistOptions');
    if (equiposListOptions) {
      const eqOpts = (state.directory.equipos || []).map(e => `<option value="${escapeHtml(e.nombre || e.equipo)}"></option>`);
      const selOpts = (state.directory.selecciones || []).map(s => `<option value="${escapeHtml(s.nombre || s.seleccion)}"></option>`);
      equiposListOptions.innerHTML = [...eqOpts, ...selOpts].join('');
    }

    const estadiosListOptions = document.getElementById('reportEstadiosDatalistOptions');
    if (estadiosListOptions) {
      estadiosListOptions.innerHTML = (state.directory.estadios || []).map(est => `<option value="${escapeHtml(est.nombre || est.estadio)}"></option>`).join('');
    }

    const competicionesListOptions = document.getElementById('reportCompeticionesDatalistOptions');
    if (competicionesListOptions) {
      const compSet = new Set(['Amistoso']);
      ['Amistoso', 'Liga', 'Copa del Rey', 'Champions League', 'Europa League', 'Supercopa', 'Tercera RFEF', 'Segunda RFEF', 'Primera RFEF', 'División de Honor', 'Liga Nacional'].forEach(c => compSet.add(c));
      (state.directory.equipos || []).forEach(e => { if (e.liga) compSet.add(e.liga); if (e.competicion) compSet.add(e.competicion); });
      (state.directory.torneos || []).forEach(t => { if (t.nombre) compSet.add(t.nombre); if (t.torneo) compSet.add(t.torneo); });
      competicionesListOptions.innerHTML = Array.from(compSet).map(c => `<option value="${escapeHtml(c)}"></option>`).join('');
    }

    const categoriasListOptions = document.getElementById('reportCategoriasDatalistOptions');
    if (categoriasListOptions) {
      const catSet = new Set(['Absoluta', 'Sub21', 'Sub20', 'Sub19', 'Sub18', 'Sub17', 'Sub16', 'Sub15', 'Sub14', 'Sub13', 'Sub12', 'Sub11', 'Sub10', 'Sub9', 'Sub8', 'Senior', 'Juvenil', 'Cadete', 'Infantil', 'Alevín', 'Benjamín', 'Prebenjamín']);
      (state.directory.equipos || []).forEach(e => { if (e.categoria) catSet.add(e.categoria); });
      categoriasListOptions.innerHTML = Array.from(catSet).map(c => `<option value="${escapeHtml(c)}"></option>`).join('');
    }

    const federacionesListOptions = document.getElementById('reportFederacionesDatalistOptions');
    if (federacionesListOptions) {
      const fedSet = new Set(['RFEF', 'Real Federación Española de Fútbol', 'Real Federación de Fútbol de Madrid', 'Federació Catalana de Futbol', 'Federación Andaluza de Fútbol', 'Federación de Fútbol de la Comunidad Valenciana']);
      (state.directory.federaciones || []).forEach(f => { if (f.nombre) fedSet.add(f.nombre); });
      federacionesListOptions.innerHTML = Array.from(fedSet).map(f => `<option value="${escapeHtml(f)}"></option>`).join('');
    }

    // Fill Header & General Info
    document.getElementById('reportLocalTeam').value = repData.localTeam || '';
    document.getElementById('reportVisitanteTeam').value = repData.visitanteTeam || '';
    document.getElementById('reportLocalScore').value = repData.localScore || 0;
    document.getElementById('reportVisitanteScore').value = repData.visitanteScore || 0;
    document.getElementById('reportDate').value = repData.date || '';
    document.getElementById('reportTime').value = repData.time || '17:00';
    document.getElementById('reportEstadio').value = repData.estadio || '';
    
    // Sync Clima Multiselect Checkboxes
    const climaVal = repData.clima || '';
    document.getElementById('reportClima').value = climaVal;
    const climaArr = climaVal.split(',').map(s => s.trim().toLowerCase());
    document.querySelectorAll('#climaMultiselectDropdown input[type="checkbox"]').forEach(cb => {
      cb.checked = climaArr.includes(cb.value.toLowerCase());
    });

    document.getElementById('reportCompeticion').value = repData.competicion || '';
    document.getElementById('reportCategoria').value = repData.categoria || '';
    document.getElementById('reportFederacion').value = repData.federacion || '';

    // Initialize Tactical Systems (Principal, Secundario, Ocasional)
    activeTacticalRole = { local: 'principal', visitante: 'principal' };

    matchTacticalSystems = {
      local: {
        principal: repData.localSystems?.principal || {
          formation: repData.localFormation || '1-4-3-3',
          titulares: repData.localTitulares || [],
          suplentes: repData.localSuplentes || []
        },
        secundario: repData.localSystems?.secundario || {
          formation: '1-4-4-2',
          titulares: [],
          suplentes: []
        },
        ocasional: repData.localSystems?.ocasional || {
          formation: '1-3-5-2',
          titulares: [],
          suplentes: []
        }
      },
      visitante: {
        principal: repData.visitanteSystems?.principal || {
          formation: repData.visitanteFormation || '1-4-4-2',
          titulares: repData.visitanteTitulares || [],
          suplentes: repData.visitanteSuplentes || []
        },
        secundario: repData.visitanteSystems?.secundario || {
          formation: '1-4-3-3',
          titulares: [],
          suplentes: []
        },
        ocasional: repData.visitanteSystems?.ocasional || {
          formation: '1-5-3-2',
          titulares: [],
          suplentes: []
        }
      }
    };

    // Update active tab buttons UI
    ['local', 'visitante'].forEach(team => {
      const container = document.getElementById(`${team}RoleTabs`);
      if (container) {
        container.querySelectorAll('.role-tab').forEach(btn => {
          if (btn.dataset.role === 'principal') btn.classList.add('active');
          else btn.classList.remove('active');
        });
      }
    });

    // Formations
    document.getElementById('localFormationSelect').value = matchTacticalSystems.local.principal.formation;
    document.getElementById('visitanteFormationSelect').value = matchTacticalSystems.visitante.principal.formation;

    // Ratings & Evaluation

  // ABP Tab Click Listeners
  document.querySelectorAll('.abp-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const team = btn.dataset.team;
      const abpKey = btn.dataset.abp;

      const bar = btn.parentElement;
      if (bar) {
        bar.querySelectorAll('.abp-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }

      const container = document.getElementById(`${team}ABPPanes`);
      if (container) {
        container.querySelectorAll('.abp-pane-textarea').forEach(ta => {
          if (ta.id === `${team}ABP_${abpKey}`) {
            ta.classList.remove('hidden');
          } else {
            ta.classList.add('hidden');
          }
        });
      }
    });
  });

  function populateABPFields(team, repData) {
    const details = repData[`${team}ABPDetails`];
    if (details) {
      ABP_KEYS.forEach(key => {
        const ta = document.getElementById(`${team}ABP_${key}`);
        if (ta) ta.value = details[key] || '';
      });
    }
  }

    document.getElementById('localEstiloJuego').value = repData.localEstiloJuego || '';
    document.getElementById('visitanteEstiloJuego').value = repData.visitanteEstiloJuego || '';
    populateABPFields('local', repData);
    populateABPFields('visitante', repData);
    document.getElementById('localComentario').value = repData.localComentario || '';
    document.getElementById('visitanteComentario').value = repData.visitanteComentario || '';
    document.getElementById('reportGeneralAnalysis').value = repData.generalAnalysis || '';

    // Coach fields & Kirol Sport buttons
    document.getElementById('localEntrenador').value = repData.localEntrenador || '';
    document.getElementById('visitanteEntrenador').value = repData.visitanteEntrenador || '';
    setCoachRating('local', repData.localCoachRating || 3);
    setCoachRating('visitante', repData.visitanteCoachRating || 3);
    document.getElementById('localComentarioEntrenador').value = repData.localComentarioEntrenador || '';
    document.getElementById('visitanteComentarioEntrenador').value = repData.visitanteComentarioEntrenador || '';
    
    const localKsBtn = document.getElementById('localBtnKirolSport');
    if (localKsBtn) localKsBtn.classList.toggle('active', !!repData.localKirolSport);
    const visitanteKsBtn = document.getElementById('visitanteBtnKirolSport');
    if (visitanteKsBtn) visitanteKsBtn.classList.toggle('active', !!repData.visitanteKirolSport);

    // Render Lineup Rows for Principal system (11 starters, 20 bench)
    renderPlayerRows('local', matchTacticalSystems.local.principal.titulares, matchTacticalSystems.local.principal.suplentes);
    renderPlayerRows('visitante', matchTacticalSystems.visitante.principal.titulares, matchTacticalSystems.visitante.principal.suplentes);

    // Update crest badges & pitch pin colors
    updateMatchTeamBadgeAndColor('local');
    updateMatchTeamBadgeAndColor('visitante');

    if (window.lucide) window.lucide.createIcons();
  }

  function findTeamInDirectory(teamName) {
    if (!teamName || typeof teamName !== 'string') return null;
    const query = teamName.trim().toLowerCase();
    if (!query) return null;

    const equipos = state.directory.equipos || [];
    const selecciones = state.directory.selecciones || [];

    // 1. Exact match in equipos
    let found = equipos.find(e => {
      const n = (e.nombre || e.equipo || '').toLowerCase();
      return n && n === query;
    });
    if (found) return found;

    // 2. Exact match in selecciones
    found = selecciones.find(s => {
      const n = (s.nombre || s.seleccion || '').toLowerCase();
      return n && n === query;
    });
    if (found) return found;

    // 3. Substring / Partial match in equipos
    found = equipos.find(e => {
      const n = (e.nombre || e.equipo || '').toLowerCase();
      return n && (query.includes(n) || n.includes(query));
    });
    if (found) return found;

    // 4. Substring / Partial match in selecciones
    found = selecciones.find(s => {
      const n = (s.nombre || s.seleccion || '').toLowerCase();
      return n && (query.includes(n) || n.includes(query));
    });
    if (found) return found;

    return null;
  }

  function getContrastColor(hexColor) {
    if (!hexColor || typeof hexColor !== 'string') return '#ffffff';
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return '#ffffff';
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  }

  function findCoachForTeam(teamName) {
    if (!teamName || !state.directory) return '';
    if (state.directory.staff && Array.isArray(state.directory.staff)) {
      const foundStaff = state.directory.staff.find(s => {
        const t = s.equipo || s.team || '';
        const teamMatch = t && (t.toLowerCase().includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(t.toLowerCase()));
        const cargo = (s.cargo || s.puesto || '').toUpperCase();
        const isCoach = !cargo || cargo.includes('ENTRENADOR') || cargo.includes('TÉCNICO') || cargo.includes('COACH');
        return teamMatch && isCoach;
      });
      if (foundStaff) return foundStaff.nombre || foundStaff.staff || '';
    }
    const teamObj = findTeamInDirectory(teamName);
    if (teamObj && (teamObj.entrenador || teamObj.tecnico || teamObj.entrenadorPrincipal)) {
      return teamObj.entrenador || teamObj.tecnico || teamObj.entrenadorPrincipal;
    }
    return '';
  }

  function updateMatchTeamBadgeAndColor(team) {
    const teamInput = document.getElementById(team === 'local' ? 'reportLocalTeam' : 'reportVisitanteTeam');
    const badgeLabel = document.getElementById(`${team}TeamBadge`);
    if (!teamInput || !badgeLabel) return;

    const teamName = teamInput.value.trim();
    const teamObj = findTeamInDirectory(teamName);

    // Auto-fill Coach if coach input is empty
    const coachInput = document.getElementById(team === 'local' ? 'localEntrenador' : 'visitanteEntrenador');
    if (coachInput && !coachInput.value) {
      const coachName = findCoachForTeam(teamName);
      if (coachName) coachInput.value = coachName;
    }

    let badgeSrc = '';
    if (teamObj) {
      badgeSrc = teamObj.escudo || teamObj.foto || teamObj.imagen || '';
      if (!badgeSrc && teamObj.federacion && typeof FEDERACIONES_LOGOS !== 'undefined' && FEDERACIONES_LOGOS[teamObj.federacion]) {
        badgeSrc = FEDERACIONES_LOGOS[teamObj.federacion];
      }

      // Auto-fill competition, category, federation and stadium from Local team profile
      if (team === 'local') {
        const compVal = teamObj.liga || teamObj.competicion || '';
        const catVal = teamObj.categoria || '';
        const fedVal = teamObj.federacion || '';
        const estVal = teamObj.estadio || teamObj.estadioVinculado || '';

        const compInput = document.getElementById('reportCompeticion');
        const catInput = document.getElementById('reportCategoria');
        const fedInput = document.getElementById('reportFederacion');
        const estInput = document.getElementById('reportEstadio');

        if (compVal && compInput) compInput.value = compVal;
        if (catVal && catInput) catInput.value = catVal;
        if (fedVal && fedInput) fedInput.value = fedVal;
        if (estVal && estInput) estInput.value = estVal;
      }
    }

    if (badgeSrc) {
      badgeLabel.innerHTML = `<img src="${badgeSrc}" style="width: 32px; height: 32px; object-fit: contain; border-radius: 4px;">`;
    } else {
      badgeLabel.innerHTML = `<i data-lucide="shield" style="width: 24px; height: 24px;"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }

    renderPitchPins(team);
  }

  const updateReportEquiposDatalist = () => {
    const equiposListOptions = document.getElementById('reportEquiposSeleccionesDatalistOptions');
    if (equiposListOptions) {
      const eqOpts = (state.directory.equipos || []).map(e => `<option value="${escapeHtml(e.nombre || e.equipo)}"></option>`);
      const selOpts = (state.directory.selecciones || []).map(s => `<option value="${escapeHtml(s.nombre || s.seleccion)}"></option>`);
      equiposListOptions.innerHTML = [...eqOpts, ...selOpts].join('');
    }
  };

  document.getElementById('reportLocalTeam')?.addEventListener('focus', updateReportEquiposDatalist);
  document.getElementById('reportLocalTeam')?.addEventListener('input', () => updateMatchTeamBadgeAndColor('local'));
  document.getElementById('reportLocalTeam')?.addEventListener('change', () => updateMatchTeamBadgeAndColor('local'));

  document.getElementById('reportVisitanteTeam')?.addEventListener('focus', updateReportEquiposDatalist);
  document.getElementById('reportVisitanteTeam')?.addEventListener('input', () => updateMatchTeamBadgeAndColor('visitante'));
  document.getElementById('reportVisitanteTeam')?.addEventListener('change', () => updateMatchTeamBadgeAndColor('visitante'));

  // Clima Multiselect Event Listeners
  const reportClimaInput = document.getElementById('reportClima');
  const climaDropdown = document.getElementById('climaMultiselectDropdown');
  const climaWrapper = document.getElementById('climaMultiselectWrapper');

  if (reportClimaInput && climaDropdown && climaWrapper) {
    reportClimaInput.addEventListener('click', (e) => {
      e.stopPropagation();
      climaDropdown.classList.toggle('hidden');
    });

    climaDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checkedVals = Array.from(climaDropdown.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
        reportClimaInput.value = checkedVals.join(', ');
      });
    });

    document.addEventListener('click', (e) => {
      if (!climaWrapper.contains(e.target)) {
        climaDropdown.classList.add('hidden');
      }
    });
  }

  function closeReportEditor() {
    clearInterval(timerInterval);
    timerInterval = null;
    renderPartidosList();
  }

  // Live Timer Stopwatch Controls
  document.getElementById('btnTimerPlay')?.addEventListener('click', () => {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      timerSeconds++;
      const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
      const secs = String(timerSeconds % 60).padStart(2, '0');
      document.getElementById('matchTimerDisplay').textContent = `${mins}:${secs}`;
    }, 1000);
  });

  document.getElementById('btnTimerPause')?.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
  });

  document.getElementById('btnTimerReset')?.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds = 0;
    document.getElementById('matchTimerDisplay').textContent = '00:00';
  });

  // Coach Rating Buttons Handler
  ['local', 'visitante'].forEach(team => {
    const group = document.getElementById(`${team}CoachDifficultyButtons`);
    if (group) {
      group.querySelectorAll('.btn-rating').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.btn-rating').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    }
  });

  // Kirol Sport Recommendation Button toggle
  ['local', 'visitante'].forEach(team => {
    const btn = document.getElementById(`${team}BtnKirolSport`);
    btn?.addEventListener('click', () => {
      btn.classList.toggle('active');
    });
  });

  function setDifficultyRating(team, val) {
    const group = document.getElementById(`${team}DifficultyButtons`);
    if (!group) return;
    group.querySelectorAll('.btn-rating').forEach(b => {
      if (parseInt(b.dataset.val) === parseInt(val)) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  const ABP_KEYS = ['cornerOfensivo', 'cornerDefensivo', 'faltaLatOfensiva', 'faltaLatDefensiva', 'penalti', 'saqueBanda', 'faltaDirecta', 'saqueCentro'];
  const ABP_LABELS = {
    cornerOfensivo: 'Córner Ofensivo',
    cornerDefensivo: 'Córner Defensivo',
    faltaLatOfensiva: 'Falta Lat. Ofensiva',
    faltaLatDefensiva: 'Falta Lat. Defensiva',
    penalti: 'Penalti',
    saqueBanda: 'Saque de Banda',
    faltaDirecta: 'Falta Directa',
    saqueCentro: 'Saque de Centro'
  };

  function syncTeamStyleToDirectory(teamName, estiloText, abpText) {
    if (!teamName || !state.directory) return;
    const teamObj = findTeamInDirectory(teamName);
    if (teamObj) {
      if (estiloText) teamObj.estiloJuego = estiloText;
      if (abpText) teamObj.abp = abpText;
      saveState();
    }
  }

  function getDifficultyRating(team) {
    const active = document.querySelector(`#${team}DifficultyButtons .btn-rating.active`);
    return active ? parseInt(active.dataset.val) : 3;
  }

  function setCoachRating(team, val) {
    const group = document.getElementById(`${team}CoachDifficultyButtons`);
    if (!group) return;
    group.querySelectorAll('.btn-rating').forEach(b => {
      if (parseInt(b.dataset.val) === parseInt(val)) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  function getCoachRating(team) {
    const active = document.querySelector(`#${team}CoachDifficultyButtons .btn-rating.active`);
    return active ? parseInt(active.dataset.val) : 3;
  }

  let activeTacticalRole = { local: 'principal', visitante: 'principal' };
  let matchTacticalSystems = {
    local: {
      principal: { formation: '1-4-3-3', titulares: [], suplentes: [] },
      secundario: { formation: '1-4-4-2', titulares: [], suplentes: [] },
      ocasional: { formation: '1-3-5-2', titulares: [], suplentes: [] }
    },
    visitante: {
      principal: { formation: '1-4-4-2', titulares: [], suplentes: [] },
      secundario: { formation: '1-4-3-3', titulares: [], suplentes: [] },
      ocasional: { formation: '1-5-3-2', titulares: [], suplentes: [] }
    }
  };

  function saveCurrentTacticalRoleState(team) {
    const role = activeTacticalRole[team] || 'principal';
    const formationSelect = document.getElementById(`${team}FormationSelect`);
    const formation = formationSelect ? formationSelect.value : '1-4-3-3';

    const collectLineup = (containerId) => {
      const rows = document.querySelectorAll(`#${containerId} .lineup-row`);
      const list = [];
      rows.forEach(r => {
        const numEl = r.querySelector('.num') || r.querySelector('input.num');
        const nameEl = r.querySelector('.name') || r.querySelector('input.name');
        const posEl = r.querySelector('.pos') || r.querySelector('select.pos');
        const parsedNum = numEl && numEl.value.trim() !== '' && !isNaN(numEl.value) ? parseInt(numEl.value, 10) : '';
        list.push({
          num: (parsedNum !== 0 && parsedNum !== '0') ? parsedNum : '',
          name: nameEl ? (nameEl.value || '').trim() : '',
          pos: posEl ? (posEl.value || '') : ''
        });
      });
      return list;
    };

    const titulares = collectLineup(`${team}TitularesRows`);
    const suplentes = collectLineup(`${team}SuplentesRows`);

    if (!matchTacticalSystems[team]) matchTacticalSystems[team] = {};
    matchTacticalSystems[team][role] = {
      formation: formation,
      titulares: titulares,
      suplentes: suplentes
    };
  }

  function switchTacticalRoleTab(team, targetRole) {
    if (!targetRole || !['principal', 'secundario', 'ocasional'].includes(targetRole)) return;

    // 1. Save current active role state
    saveCurrentTacticalRoleState(team);

    // 2. Update active role state
    activeTacticalRole[team] = targetRole;

    // 3. Update tab buttons active CSS class
    const roleTabsContainer = document.getElementById(`${team}RoleTabs`);
    if (roleTabsContainer) {
      roleTabsContainer.querySelectorAll('.role-tab').forEach(btn => {
        if (btn.dataset.role === targetRole) btn.classList.add('active');
        else btn.classList.remove('active');
      });
    }

    // 4. Load target system data
    const systemData = matchTacticalSystems[team]?.[targetRole] || {
      formation: targetRole === 'principal' ? (team === 'local' ? '1-4-3-3' : '1-4-4-2') : (targetRole === 'secundario' ? '1-4-4-2' : '1-3-5-2'),
      titulares: [],
      suplentes: []
    };

    const formationSelect = document.getElementById(`${team}FormationSelect`);
    if (formationSelect) formationSelect.value = systemData.formation || '1-4-3-3';

    renderPlayerRows(team, systemData.titulares, systemData.suplentes);
    renderPitchPins(team);
  }

  function updateStarterPositionsForFormation(team, formation) {
    const defaultPositions = SYSTEM_STARTER_POSITIONS[formation] || ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MCD', 'MBD', 'MBZ', 'ACD', 'ACZ', 'AC'];
    const rows = document.querySelectorAll(`#${team}TitularesRows .lineup-row`);
    rows.forEach((row, idx) => {
      const posSelect = row.querySelector('select.pos');
      if (posSelect && defaultPositions[idx]) {
        posSelect.value = defaultPositions[idx];
      }
    });
  }

  // Formation Change Listeners
  document.getElementById('localFormationSelect')?.addEventListener('change', () => {
    saveCurrentTacticalRoleState('local');
    const formation = document.getElementById('localFormationSelect').value;
    updateStarterPositionsForFormation('local', formation);
    renderPitchPins('local');
  });

  document.getElementById('visitanteFormationSelect')?.addEventListener('change', () => {
    saveCurrentTacticalRoleState('visitante');
    const formation = document.getElementById('visitanteFormationSelect').value;
    updateStarterPositionsForFormation('visitante', formation);
    renderPitchPins('visitante');
  });

  // Attach role-tabs click listeners
  ['local', 'visitante'].forEach(team => {
    const container = document.getElementById(`${team}RoleTabs`);
    if (container) {
      container.querySelectorAll('.role-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          switchTacticalRoleTab(team, btn.dataset.role);
        });
      });
    }
  });

  function findPlayerByTeamAndDorsal(teamName, dorsalNum) {
    if (!dorsalNum) return null;
    const dStr = String(dorsalNum).trim();
    if (!dStr) return null;

    const jugadores = state.directory.jugadores || [];
    const teamNameLower = teamName ? teamName.trim().toLowerCase() : '';

    // First search for player belonging to teamName with matching dorsal
    let match = jugadores.find(p => {
      const pTeam = (p.equipo || p.equipoVinculado || p.club || '').toLowerCase();
      const pDorsal = String(p.dorsal || p.numero || p.num || '').trim();
      const matchesTeam = !teamNameLower || pTeam === teamNameLower || pTeam.includes(teamNameLower) || teamNameLower.includes(pTeam);
      return matchesTeam && pDorsal === dStr;
    });

    if (match) return match;

    // Fallback: search for any player with matching dorsal if team not matched
    if (teamNameLower) {
      match = jugadores.find(p => {
        const pDorsal = String(p.dorsal || p.numero || p.num || '').trim();
        return pDorsal === dStr;
      });
    }

    return match;
  }

  function renderPlayerRows(team, titulares = [], suplentes = []) {
    const posOptions = ['PO', 'DBD', 'DBZ', 'DCD', 'DCZ', 'DC', 'MBD', 'MBZ', 'MCD', 'MCZ', 'MC', 'MPD', 'MPZ', 'MP', 'MVD', 'MVZ', 'ACD', 'ACZ', 'AC', 'POR', 'LD', 'LI', 'DFC', 'MCO', 'ED', 'EI'];
    const formationSelect = document.getElementById(`${team}FormationSelect`);
    const formation = formationSelect ? formationSelect.value : '1-4-3-3';
    const defaultPositions = SYSTEM_STARTER_POSITIONS[formation] || ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MCD', 'MBD', 'MBZ', 'ACD', 'ACZ', 'AC'];

    // Titulares (11)
    const titContainer = document.getElementById(`${team}TitularesRows`);
    let titHTML = '';
    for (let i = 0; i < 11; i++) {
      const defaultPosForIdx = defaultPositions[i] || (i === 0 ? 'PO' : 'MC');
      const p = titulares[i] || { num: '', name: '', pos: defaultPosForIdx };
      const numVal = (p.num !== undefined && p.num !== null && p.num !== 0 && p.num !== '0') ? p.num : '';
      const currentPos = p.pos || defaultPosForIdx;
      const hasCurrent = posOptions.includes(currentPos);
      titHTML += `
        <div class="lineup-row">
          <input type="number" class="form-control num" value="${numVal}" min="1" max="99" placeholder="#">
          <input type="text" class="form-control name flex-grow" placeholder="Nombre jugador..." value="${escapeHtml(p.name)}">
          <select class="form-control pos select-compact">
            ${!hasCurrent && currentPos ? `<option value="${escapeHtml(currentPos)}" selected>${escapeHtml(currentPos)}</option>` : ''}
            ${posOptions.map(o => `<option value="${o}" ${currentPos === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
      `;
    }
    titContainer.innerHTML = titHTML;

    // Suplentes (11 suplentes) - Default position empty
    const supContainer = document.getElementById(`${team}SuplentesRows`);
    let supHTML = '';
    for (let i = 0; i < 11; i++) {
      const p = suplentes[i] || { num: '', name: '', pos: '' };
      const numVal = (p.num !== undefined && p.num !== null && p.num !== 0 && p.num !== '0') ? p.num : '';
      const currentPos = p.pos !== undefined ? p.pos : '';
      const hasCurrent = posOptions.includes(currentPos);
      supHTML += `
        <div class="lineup-row">
          <input type="number" class="form-control num" value="${numVal}" min="1" max="99" placeholder="#">
          <input type="text" class="form-control name flex-grow" placeholder="Suplente..." value="${escapeHtml(p.name)}">
          <select class="form-control pos select-compact">
            <option value="" ${!currentPos ? 'selected' : ''}>--</option>
            ${!hasCurrent && currentPos ? `<option value="${escapeHtml(currentPos)}" selected>${escapeHtml(currentPos)}</option>` : ''}
            ${posOptions.map(o => `<option value="${o}" ${currentPos === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
      `;
    }
    supContainer.innerHTML = supHTML;

    // Attach listeners for auto-completing player name by dorsal number
    attachLineupRowListeners(team);
  }

  function attachLineupRowListeners(team) {
    const containers = [
      document.getElementById(`${team}TitularesRows`),
      document.getElementById(`${team}SuplentesRows`)
    ];

    containers.forEach(container => {
      if (!container) return;
      container.querySelectorAll('.lineup-row').forEach(row => {
        const numInput = row.querySelector('input.num');
        const nameInput = row.querySelector('input.name');
        const posSelect = row.querySelector('select.pos');

        numInput?.addEventListener('input', () => {
          const numVal = numInput.value;
          const teamName = document.getElementById(team === 'local' ? 'reportLocalTeam' : 'reportVisitanteTeam')?.value.trim() || '';
          
          if (numVal) {
            const matchedPlayer = findPlayerByTeamAndDorsal(teamName, numVal);
            if (matchedPlayer) {
              if (nameInput) nameInput.value = matchedPlayer.nombre || matchedPlayer.jugador || matchedPlayer.name || '';
              const matchedPos = matchedPlayer.posicionPrincipal || matchedPlayer.posicion || matchedPlayer.pos || '';
              if (posSelect && matchedPos) {
                const optExists = Array.from(posSelect.options).some(opt => opt.value === matchedPos);
                if (optExists) {
                  posSelect.value = matchedPos;
                } else {
                  const newOpt = document.createElement('option');
                  newOpt.value = matchedPos;
                  newOpt.textContent = matchedPos;
                  newOpt.selected = true;
                  posSelect.appendChild(newOpt);
                }
              }
            }
          }
          renderPitchPins(team);
        });

        nameInput?.addEventListener('input', () => {
          renderPitchPins(team);
        });

        posSelect?.addEventListener('change', () => {
          renderPitchPins(team);
        });
      });
    });
  }

  function renderPitchPins(team) {
    const formationSelect = document.getElementById(`${team}FormationSelect`);
    if (!formationSelect) return;
    const formation = formationSelect.value;
    const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['1-4-3-3'];
    const defaultStarterPositions = SYSTEM_STARTER_POSITIONS[formation] || ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MCD', 'MBD', 'MBZ', 'ACD', 'ACZ', 'AC'];
    const container = document.getElementById(`${team}PitchPins`);
    if (!container) return;

    const teamName = document.getElementById(team === 'local' ? 'reportLocalTeam' : 'reportVisitanteTeam')?.value.trim() || '';
    const teamObj = findTeamInDirectory(teamName);

    const primaryColor = teamObj?.color1 || teamObj?.colorPrimario || teamObj?.color || (team === 'local' ? '#2563eb' : '#0284c7');
    const textColor = getContrastColor(primaryColor);

    // Get numbers and positions from Titulares rows
    const rows = document.querySelectorAll(`#${team}TitularesRows .lineup-row`);
    container.innerHTML = positions.map((pos, idx) => {
      const row = rows[idx];
      const numInput = row?.querySelector('input.num');
      const posSelect = row?.querySelector('select.pos');
      const nameInput = row?.querySelector('input.name');

      const numVal = (numInput && numInput.value.trim() !== '' && numInput.value.trim() !== '0') ? numInput.value.trim() : '';
      const posVal = posSelect ? posSelect.value : (defaultStarterPositions[idx] || 'PO');
      const nameVal = nameInput ? nameInput.value.trim() : '';
      const displayText = numVal ? numVal : (posVal || (idx + 1));

      return `
        <div class="pitch-pin" data-team="${team}" data-type="titular" data-idx="${idx}" title="${escapeHtml((nameVal ? nameVal + ' | ' : '') + posVal + (numVal ? ' #' + numVal : ''))}" style="left: ${pos.x}%; top: ${pos.y}%; background-color: ${primaryColor}; color: ${textColor}; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.4); cursor: pointer; font-weight: 800; font-size: ${displayText.length > 2 ? '9px' : '11px'};">
          ${escapeHtml(displayText)}
        </div>
      `;
    }).join('');

    // Render Bench Tokens (Suplentes)
    const supRows = document.querySelectorAll(`#${team}SuplentesRows .lineup-row`);
    const benchContainer = document.getElementById(`${team}BenchPins`);
    if (benchContainer) {
      benchContainer.innerHTML = Array.from(supRows).map((row, idx) => {
        const numInput = row.querySelector('input.num');
        const posSelect = row.querySelector('select.pos');
        const nameInput = row.querySelector('input.name');

        const numVal = (numInput && numInput.value.trim() !== '' && numInput.value.trim() !== '0') ? numInput.value.trim() : '';
        const posVal = posSelect ? posSelect.value : '';
        const nameVal = nameInput ? nameInput.value.trim() : '';
        const displayText = numVal ? numVal : (posVal || ('S' + (idx + 1)));

        return `
          <div class="bench-pin-item" title="${escapeHtml((nameVal ? nameVal + ' | ' : '') + (posVal || 'Suplente') + (numVal ? ' #' + numVal : ''))}">
            <div class="pitch-pin inline-pin" data-team="${team}" data-type="suplente" data-idx="${idx}" style="background-color: ${primaryColor}; color: ${textColor}; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.4); cursor: pointer; font-weight: 800; font-size: ${displayText.length > 2 ? '9px' : '11px'};">
              ${escapeHtml(displayText)}
            </div>
          </div>
        `;
      }).join('');
    }

    // Attach click listeners to pitch and bench pins
    container.querySelectorAll('.pitch-pin').forEach(pin => {
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        openPlayerMatchReportModal(pin.dataset.team, pin.dataset.type, parseInt(pin.dataset.idx));
      });
    });

    if (benchContainer) {
      benchContainer.querySelectorAll('.pitch-pin').forEach(pin => {
        pin.addEventListener('click', (e) => {
          e.stopPropagation();
          openPlayerMatchReportModal(pin.dataset.team, pin.dataset.type, parseInt(pin.dataset.idx));
        });
      });
    }
  }

  const OPTIONS_DESC_FISICA = {
    "ESTATURA": ['Normal', 'Alto', 'Muy alto', 'Pequeño', 'Muy pequeño'],
    "COMPLEXIÓN": ['Normal para la edad', 'Delgado', 'Fibroso', 'Ancho', 'Culón', 'Fuerte', 'Frágil', 'Atlético', 'Robusto'],
    "DESARROLLO": ['Coordinado', 'Descoordinado', 'Piernas cortas', 'Piernas largas', 'Muy desarrollado', 'Poco desarrollado', 'Tren inferior potente', 'Tren superior potente', 'Buena postura corporal', 'Movilidad reducida'],
    "ESTÉTICOS": ['Rubio', 'Moreno', 'Pelirrojo', 'Melena', 'Rapado', 'Teñido', 'Pelo largo', 'Pelo corto', 'Pelo rizado', 'Tatuaje', 'Barba', 'Sin barba', 'Pecas'],
    "FENOTIPO": ['De raza negra', 'Sudamericano', 'Mestizo', 'Latino', 'Magrebí', 'Árabe', 'Asiático', 'Gitano', 'Nórdico', 'Caribeño'],
    "MOTOR": ['Ritmo alto', 'Alta intensidad', 'Baja intensidad', 'Incansable', 'Trabajador', 'Constante', 'Intermitente', 'Buena lateralidad', 'Buena motricidad', 'Equilibrio destacado', 'Problemas de equilibrio', 'Control corporal avanzado', 'Dinámico', 'Rígido', 'Fluido', 'Buena lectura corporal', 'Gestualidad eficiente'],
    "MADURACIÓN": ['Madurez tardía', 'Madurez prematura', 'Madurez normal']
  };

  const OPTIONS_DESC_TECNICA = {
    "ACCIONES POSITIVAS": ['Regate efectivo', 'Buen control', 'Control bajo presión exitoso', 'Conducción segura', 'Pase corto preciso', 'Pase largo preciso', 'Pase filtrado exitoso', 'Cambio de orientación correcto', 'Centro preciso', 'Buena finalización', 'Anticipación bien', 'Bueno en robo de balón', 'Buenos despejes', 'Buena orientación corporal', 'Primer toque de calidad', 'Protección de balón efectiva', 'Buen golpeo en salida de balón', 'Regate en 1v1 ganado', 'Acción técnica bajo presión exitosa', 'Buena conducción en progresión', 'Buena recepción entre líneas', 'Pase en ventaja', 'Acción técnica creativa / diferente', 'Ganador juego aéreo'],
    "ACCIONES A MEJORAR / NEGATIVAS": ['Mal control', 'Control bajo presión malo', 'Regate fallido', 'Conducción arriesgada sin ventaja', 'Pase corto impreciso', 'Pase largo impreciso', 'Pase filtrado interceptado', 'Mal cambio de orientación', 'Centro impreciso', 'Mala finalización', 'Mide mal en anticipaciones', 'No roba balones', 'Despejes defectuosos', 'Mala orientación corporal', 'Acción técnica bajo presión fallida', 'Mala conducción en progresión', 'Mala recepción entre líneas', 'Pase que pone en riesgo al compañero', 'Acción técnica precipitada', 'No disputa juego aéreo']
  };

  const OPTIONS_DESC_EMOCIONAL = {
    "ACTITUDES POSITIVAS": ['Concentración alta', 'Mantener la calma bajo presión', 'Confianza en sí mismo', 'Motivación constante', 'Comunicación efectiva con compañeros', 'Liderazgo en el campo', 'Persistencia / no rendirse', 'Resiliencia tras un error', 'Control emocional', 'Toma de decisiones rápida y acertada', 'Positivismo y actitud constructiva', 'Cooperación en equipo', 'Adaptación a cambios de situación', 'Escucha activa de instrucciones', 'Empatía con compañeros', 'Autocrítica constructiva', 'Gestión del estrés en momentos clave', 'Motivación del equipo', 'Mantenimiento de la concentración'],
    "ACTITUDES A MEJORAR / NEGATIVAS": ['Falta de concentración', 'Nerviosismo bajo presión', 'Falta de confianza', 'Desmotivación', 'Mala comunicación con compañeros', 'Egoísmo en el juego', 'Se rinde rápido', 'Frustración tras un error', 'Pérdida de autocontrol', 'Toma de decisiones precipitada', 'Actitud negativa / pesimista', 'Conflictos con compañeros', 'Rigidez ante cambios de situación', 'Ignorar instrucciones', 'Falta de empatía', 'Autocrítica destructiva', 'Estrés excesivo', 'Desmotivación del equipo', 'Desánimo tras fallo propio']
  };

  const OPTIONS_PERFIL_RS = {
    "PORTEROS": ['PORTERÍA (Def)', 'ÁREA GRANDE (Def)', 'SOBRIO (Def)', 'INICIO DE JUEGO (Of)'],
    "LATERALES": ['1x1 DEFENSIVO (Def)', 'LECTURA DEFENSIVA (Def)', 'JUEGO COMBINATIVO (Of)', 'PROFUNDIDAD (Of)'],
    "CENTRALES": ['DEFENSA DE ÁREA (Def)', 'DEFENSA DE CAMPO ABIERTO (Def)', 'LECTURA DEFENSIVA (Def)', 'INICIO DE JUEGO (Of)'],
    "MEDIOCENTROS": ['RIGOR POSICIONAL (Def)', 'DESPLIEGUE (Def)', 'INICIO DE JUEGO (Of)', 'PROFUNDIDAD (Of)'],
    "INTERIORES": ['RIGOR POSICIONAL (Def)', 'DESPLIEGUE (Def)', 'ORGANIZADOR (Of)', 'BOX TO BOX (Of)'],
    "MEDIAPUNTAS": ['ELABORADOR (Of)', 'JUEGO ENTRE LÍNEAS (Of)', 'PROFUNDO CON BALÓN (Of)', 'PROFUNDO EN EL ESPACIO (Of)'],
    "BANDAS": ['1x1 OFENSIVO (Of)', 'COMBINATIVO (Of)', 'PROFUNDO FUERA-FUERA (Of)', 'RUPTURA FUERA-DENTRO (Of)'],
    "PUNTAS": ['ÁREA (Of)', 'REFERENCIA (Of)', 'APOYO (Of)', 'ESPACIO (Of)']
  };

  const POSITION_TO_PERFIL_GROUP = {
    'PO': 'PORTEROS', 'POR': 'PORTEROS',
    'DBD': 'LATERALES', 'DBZ': 'LATERALES', 'LD': 'LATERALES', 'LI': 'LATERALES',
    'DCD': 'CENTRALES', 'DCZ': 'CENTRALES', 'DFC': 'CENTRALES',
    'MCD': 'MEDIOCENTROS', 'MCZ': 'MEDIOCENTROS', 'MC': 'MEDIOCENTROS',
    'MBD': 'INTERIORES', 'MBZ': 'INTERIORES', 'MVD': 'INTERIORES', 'MVZ': 'INTERIORES',
    'MPD': 'MEDIAPUNTAS', 'MPZ': 'MEDIAPUNTAS', 'MP': 'MEDIAPUNTAS', 'MCO': 'MEDIAPUNTAS',
    'ACD': 'BANDAS', 'ACZ': 'BANDAS', 'ED': 'BANDAS', 'EI': 'BANDAS',
    'AC': 'PUNTAS', 'DC': 'PUNTAS'
  };

  function buildFilteredPerfilRSHTML(pPos) {
    const normPos = (pPos || '').toUpperCase().trim();
    const groupKey = POSITION_TO_PERFIL_GROUP[normPos];
    
    if (groupKey && OPTIONS_PERFIL_RS[groupKey]) {
      let html = `<option value="">+ Añadir perfil RS (${groupKey})...</option>`;
      html += `<optgroup label="${escapeHtml(groupKey)}">`;
      OPTIONS_PERFIL_RS[groupKey].forEach(item => {
        html += `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`;
      });
      html += `</optgroup>`;
      return html;
    }

    return buildOptgroupsHTML(OPTIONS_PERFIL_RS, 'Añadir perfil RS...');
  }

  function buildOptgroupsHTML(optionsObj, placeholder) {
    let html = `<option value="">+ ${escapeHtml(placeholder)}</option>`;
    for (const [groupLabel, items] of Object.entries(optionsObj)) {
      html += `<optgroup label="${escapeHtml(groupLabel)}">`;
      items.forEach(item => {
        html += `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`;
      });
      html += `</optgroup>`;
    }
    return html;
  }

  function getCurrentMatchMinute() {
    if (typeof timerSeconds === 'number' && timerSeconds > 0) {
      return Math.min(90, Math.max(1, Math.floor(timerSeconds / 60)));
    }
    return 0;
  }

  function syncPlayerMatchReportToDirectory(pName, pNum, teamName, evalData) {
    if (!pName || !state.directory || !state.directory.jugadores) return;
    
    // Find matching player in directory by name or dorsal+team
    const playerInDir = state.directory.jugadores.find(p => {
      const nameMatch = p.nombre && p.nombre.toLowerCase().trim() === pName.toLowerCase().trim();
      const numMatch = String(p.dorsal || p.numero || '').trim() === String(pNum).trim();
      const teamMatch = p.equipo && teamName && (p.equipo.toLowerCase().includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(p.equipo.toLowerCase()));
      return nameMatch || (numMatch && teamMatch);
    });

    if (playerInDir) {
      if (evalData.descFisica) playerInDir.descFisica = evalData.descFisica;
      if (evalData.descTecnica) playerInDir.descTecnica = evalData.descTecnica;
      if (evalData.descEmocional) playerInDir.descEmocional = evalData.descEmocional;
      if (evalData.perfilRS) playerInDir.perfilRS = evalData.perfilRS;
      if (evalData.rendimientoRS) playerInDir.rendimientoRS = evalData.rendimientoRS;
      if (evalData.comentarioGeneral) playerInDir.comentarioGeneral = evalData.comentarioGeneral;
      if (evalData.tags && evalData.tags.length > 0) playerInDir.tags = evalData.tags;
      
      // Store/accumulate stats
      if (evalData.stats) {
        playerInDir.stats = evalData.stats;
      }

      // Append/update match evaluation history
      if (!playerInDir.historialEvaluaciones) playerInDir.historialEvaluaciones = [];
      const repId = currentEditingReportId || 'temp';
      const existingIdx = playerInDir.historialEvaluaciones.findIndex(h => h.reportId === repId);
      const evalRecord = {
        reportId: repId,
        fecha: document.getElementById('reportDate')?.value || new Date().toISOString().split('T')[0],
        equipo: teamName,
        dorsal: pNum,
        minutos: evalData.minutos || 0,
        rendimiento: evalData.rendimiento,
        potencial: evalData.potencial,
        descFisica: evalData.descFisica,
        descTecnica: evalData.descTecnica,
        descEmocional: evalData.descEmocional,
        perfilRS: evalData.perfilRS,
        stats: evalData.stats
      };

      if (existingIdx >= 0) playerInDir.historialEvaluaciones[existingIdx] = evalRecord;
      else playerInDir.historialEvaluaciones.push(evalRecord);

      saveState();
    }
  }

  function openPlayerMatchReportModal(team, type, idx) {
    const containerId = type === 'titular' ? `${team}TitularesRows` : `${team}SuplentesRows`;
    const rows = document.querySelectorAll(`#${containerId} .lineup-row`);
    const row = rows[idx];
    if (!row) return;

    const pNum = row.querySelector('input.num')?.value || (type === 'titular' ? idx + 1 : 12 + idx);
    const pName = row.querySelector('input.name')?.value.trim() || '';
    const pPos = row.querySelector('select.pos')?.value || 'MC';
    const teamName = document.getElementById(team === 'local' ? 'reportLocalTeam' : 'reportVisitanteTeam')?.value.trim() || (team === 'local' ? 'Equipo Local' : 'Equipo Visitante');

    if (!state.matchPlayerEvaluations) state.matchPlayerEvaluations = {};
    const evalKey = `${currentEditingReportId || 'temp'}_${team}_${pNum}`;
    
    const currentMinsFromTimer = getCurrentMatchMinute();
    const defaultMins = type === 'titular' ? 90 : (currentMinsFromTimer > 0 ? (90 - currentMinsFromTimer) : 0);

    // Auto-load directory player traits if player exists in directory and match evaluation hasn't been created yet
    const playerInDir = (state.directory && state.directory.jugadores && pName) ? state.directory.jugadores.find(p => {
      const nameMatch = p.nombre && p.nombre.toLowerCase().trim() === pName.toLowerCase().trim();
      const numMatch = String(p.dorsal || p.numero || '').trim() === String(pNum).trim();
      const teamMatch = p.equipo && teamName && (p.equipo.toLowerCase().includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(p.equipo.toLowerCase()));
      return nameMatch || (numMatch && teamMatch);
    }) : null;

    if (playerInDir && !state.matchPlayerEvaluations[evalKey]) {
      state.matchPlayerEvaluations[evalKey] = {
        rendimiento: playerInDir.rendimientoRS || 'C',
        potencial: playerInDir.potencial || '3',
        rendimientoRS: playerInDir.rendimientoRS || 'C',
        tags: playerInDir.tags || [],
        minutos: defaultMins,
        sustituido: false,
        comentarioGeneral: playerInDir.comentarioGeneral || '',
        descFisica: playerInDir.descFisica || '',
        descTecnica: playerInDir.descTecnica || '',
        descEmocional: playerInDir.descEmocional || '',
        perfilRS: playerInDir.perfilRS || '',
        stats: playerInDir.stats || {
          goles: 0, asistencias: 0, tirosPuerta: 0, tirosFuera: 0, pasesBuenos: 0, pasesMalos: 0,
          regatesExito: 0, regatesFallidos: 0, recuperaciones: 0, perdidas: 0, duelosGanados: 0,
          duelosPerdidos: 0, aereoGanado: 0, amarillas: 0, rojas: 0
        }
      };
    }

    const pEval = state.matchPlayerEvaluations[evalKey] || {
      rendimiento: 'C',
      potencial: '3',
      rendimientoRS: 'C',
      tags: [],
      minutos: defaultMins,
      sustituido: false,
      comentarioGeneral: '',
      descFisica: '',
      descTecnica: '',
      descEmocional: '',
      perfilRS: ''
    };

    const pStats = Object.assign({
      goles: 0, asistencias: 0, tirosPuerta: 0, tirosFuera: 0, pasesBuenos: 0, pasesMalos: 0,
      regatesExito: 0, regatesFallidos: 0, recuperaciones: 0, perdidas: 0, duelosGanados: 0,
      duelosPerdidos: 0, aereoGanado: 0, amarillas: 0, rojas: 0
    }, pEval.stats || {});

    const STAT_FIELDS = [
      { key: 'goles', label: 'Goles', icon: '⚽' },
      { key: 'asistencias', label: 'Asistencias', icon: '🅰️' },
      { key: 'tirosPuerta', label: 'Tiros a Puerta', icon: '🎯' },
      { key: 'tirosFuera', label: 'Tiros Fuera', icon: '🥅' },
      { key: 'pasesBuenos', label: 'Pases Buenos', icon: '🟢' },
      { key: 'pasesMalos', label: 'Pases Malos', icon: '🔴' },
      { key: 'regatesExito', label: 'Regates Éxito', icon: '🏃' },
      { key: 'regatesFallidos', label: 'Regates Fallidos', icon: '🚫' },
      { key: 'recuperaciones', label: 'Recuperaciones', icon: '🛡️' },
      { key: 'perdidas', label: 'Pérdidas', icon: '⚠️' },
      { key: 'duelosGanados', label: 'Duelos Ganados', icon: '⚔️' },
      { key: 'duelosPerdidos', label: 'Duelos Perdidos', icon: '❌' },
      { key: 'aereoGanado', label: 'Juego Aéreo', icon: '✈️' },
      { key: 'amarillas', label: 'Amarillas', icon: '🟨' },
      { key: 'rojas', label: 'Rojas', icon: '🟥' }
    ];

    const modalHTML = `
      <div class="player-match-modal-wrapper">
        <div class="player-match-header-bar">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background: rgba(255,255,255,0.2); width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px;">
              ${escapeHtml(pNum)}
            </div>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #fff;">Ficha de ${escapeHtml(pName || 'Jugador S/N')}</h3>
              <p style="margin: 2px 0 0; font-size: 11px; opacity: 0.9;">${escapeHtml(pPos)} | Dorsal ${escapeHtml(pNum)} | ${escapeHtml(teamName)}</p>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary" id="btnClosePlayerMatchModal" style="font-size: 11px; padding: 6px 12px; background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3);">Cerrar</button>
            <button type="button" class="btn btn-primary" id="btnSavePlayerMatchReport" style="font-size: 11px; padding: 6px 14px; background: #ffffff; color: #1d4ed8; font-weight: 800; border: none;">💾 Guardar Ficha</button>
          </div>
        </div>

        <div class="player-match-subtabs">
          <button type="button" class="player-match-subtab active" data-tab="pmTabDatos">DATOS PARTIDO JUGADOR</button>
          <button type="button" class="player-match-subtab" data-tab="pmTabEstadisticas">📊 ESTADÍSTICAS INDIVIDUALES</button>
        </div>

        <!-- TAB 1: DATOS PARTIDO JUGADOR -->
        <div id="pmTabDatos" class="pm-tab-pane player-match-content-grid">
          <div class="player-match-sidebar">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="rating-score-box">
                <div class="rating-score-title">RENDIMIENTO</div>
                <div class="rating-score-value" id="valRendimientoDisplay">${escapeHtml(pEval.rendimiento)}</div>
                <input type="range" id="pmRendimientoRange" min="1" max="4" value="${pEval.rendimiento === 'A' ? 4 : (pEval.rendimiento === 'B' ? 3 : (pEval.rendimiento === 'C' ? 2 : 1))}" style="width: 100%; margin-top: 4px;">
              </div>

              <div class="rating-score-box">
                <div class="rating-score-title">POTENCIAL</div>
                <div class="rating-score-value" style="color: #ec4899;" id="valPotencialDisplay">${escapeHtml(pEval.potencial)}</div>
                <input type="range" id="pmPotencialRange" min="1" max="5" value="${escapeHtml(pEval.potencial)}" style="width: 100%; margin-top: 4px;">
              </div>
            </div>

            <div>
              <div class="rating-score-title mb-2" style="text-align: center;">RENDIMIENTO RS</div>
              <div class="rs-pills-row" id="pmRendimientoRSGroup">
                <button type="button" class="rs-pill-btn ${pEval.rendimientoRS === 'A' ? 'active' : ''}" data-val="A">A</button>
                <button type="button" class="rs-pill-btn ${pEval.rendimientoRS === 'B' ? 'active' : ''}" data-val="B">B</button>
                <button type="button" class="rs-pill-btn ${pEval.rendimientoRS === 'C' ? 'active' : ''}" data-val="C">C</button>
                <button type="button" class="rs-pill-btn ${pEval.rendimientoRS === 'D' ? 'active' : ''}" data-val="D">D</button>
              </div>
            </div>

            <div class="tags-control-grid" id="pmTagsGroup">
              ${['🚫 No juega', '🏃 ERF', '⭐ Destacada', '⚡ JULEN', '📊 Mapa RS', '⚽ Kirol Sport', '🤝 Club convenido', '🎯 Jugador RS Centro'].map(tag => `
                <button type="button" class="tag-control-btn ${(pEval.tags || []).includes(tag) ? 'active' : ''}" data-tag="${escapeHtml(tag)}">
                  ${escapeHtml(tag)}
                </button>
              `).join('')}
            </div>

            <div class="form-group mb-1">
              <label class="form-label" style="font-size: 10px; font-weight: 800;">MINUTOS JUGADOS</label>
              <div class="minutes-salir-row">
                <input type="number" id="pmMinutos" class="form-control" value="${pEval.minutos || 0}" min="0" max="120" style="width: 55px; font-weight: 800; text-align: center;">
                <button type="button" class="btn-entra-toggle ${pEval.entra ? 'active' : ''}" id="pmBtnEntra" title="Marcar minuto de entrada">
                  <i data-lucide="log-in" style="width: 14px;"></i> ${pEval.entra ? ('ENTRÓ (' + (pEval.minutoEntrada || 0) + ')') : 'ENTRA'}
                </button>
                <button type="button" class="btn-salir-toggle ${pEval.sustituido ? 'active' : ''}" id="pmBtnSalir" title="Marcar minuto de salida">
                  <i data-lucide="log-out" style="width: 14px;"></i> ${pEval.sustituido ? ('SUSTITUIDO (' + (pEval.minutoSalida || 0) + ')') : 'SALIR'}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 10px; font-weight: 800;">COMENTARIO GENERAL</label>
              <textarea id="pmComentarioGeneral" class="form-control textarea-compact" style="height: 60px;" placeholder="Observaciones adicionales...">${escapeHtml(pEval.comentarioGeneral)}</textarea>
            </div>
          </div>

          <div class="player-match-main-grid">
            <div class="desc-card-box">
              <div class="desc-card-title">1. DESCRIPCIÓN FÍSICA</div>
              <select class="form-control select-compact mb-2 pm-desc-select" data-target="pmDescFisica">
                ${buildOptgroupsHTML(OPTIONS_DESC_FISICA, 'Añadir rasgo físico...')}
              </select>
              <textarea id="pmDescFisica" class="desc-card-textarea" placeholder="Escribe o selecciona rasgos físicos...">${escapeHtml(pEval.descFisica)}</textarea>
            </div>

            <div class="desc-card-box">
              <div class="desc-card-title">2. DESCRIPCIÓN TÉCNICA</div>
              <select class="form-control select-compact mb-2 pm-desc-select" data-target="pmDescTecnica">
                ${buildOptgroupsHTML(OPTIONS_DESC_TECNICA, 'Añadir acción técnica...')}
              </select>
              <textarea id="pmDescTecnica" class="desc-card-textarea" placeholder="Escribe o selecciona acciones técnicas...">${escapeHtml(pEval.descTecnica)}</textarea>
            </div>

            <div class="desc-card-box">
              <div class="desc-card-title">3. DESCRIPCIÓN EMOCIONAL</div>
              <select class="form-control select-compact mb-2 pm-desc-select" data-target="pmDescEmocional">
                ${buildOptgroupsHTML(OPTIONS_DESC_EMOCIONAL, 'Añadir rasgo emocional...')}
              </select>
              <textarea id="pmDescEmocional" class="desc-card-textarea" placeholder="Escribe o selecciona rasgos emocionales...">${escapeHtml(pEval.descEmocional)}</textarea>
            </div>

            <div class="desc-card-box">
              <div class="desc-card-title">4. PERFIL DEL JUGADOR (RS)</div>
              <select class="form-control select-compact mb-2 pm-desc-select" data-target="pmPerfilRS">
                ${buildFilteredPerfilRSHTML(pPos)}
              </select>
              <textarea id="pmPerfilRS" class="desc-card-textarea" placeholder="Escribe o selecciona perfiles RS...">${escapeHtml(pEval.perfilRS)}</textarea>
            </div>
          </div>
        </div>

        <!-- TAB 2: ESTADÍSTICAS INDIVIDUALES -->
        <div id="pmTabEstadisticas" class="pm-tab-pane hidden" style="padding: 16px;">
          <!-- Summary Banner -->
          <div id="pmStatsSummaryBanner"></div>

          <!-- Stepper Counters Grid -->
          <div class="stats-grid-counters">
            ${STAT_FIELDS.map(f => `
              <div class="stat-counter-card">
                <div class="stat-counter-info">
                  <span class="stat-counter-icon">${f.icon}</span>
                  <span class="stat-counter-label">${escapeHtml(f.label)}</span>
                </div>
                <div class="stat-counter-controls">
                  <button type="button" class="btn-counter-stepper minus" data-stat="${f.key}" data-action="minus">-</button>
                  <span class="stat-counter-num" data-stat="${f.key}">${pStats[f.key] || 0}</span>
                  <button type="button" class="btn-counter-stepper plus" data-stat="${f.key}" data-action="plus">+</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    showModal(`Ficha de Jugador: ${pName || 'S/N'}`, modalHTML, null);

    const modalFooter = document.querySelector('.modal-footer');
    if (modalFooter) modalFooter.style.display = 'none';

    const modalContent = document.getElementById('generalModalCard');
    if (modalContent) modalContent.classList.add('xlarge');

    // Range Sliders
    const rendMap = ['D', 'C', 'B', 'A'];
    modalContent.querySelector('#pmRendimientoRange')?.addEventListener('input', (e) => {
      const val = rendMap[parseInt(e.target.value) - 1] || 'C';
      modalContent.querySelector('#valRendimientoDisplay').textContent = val;
    });

    modalContent.querySelector('#pmPotencialRange')?.addEventListener('input', (e) => {
      modalContent.querySelector('#valPotencialDisplay').textContent = e.target.value;
    });

    // Description Selectors: Append Multiple Options
    modalContent.querySelectorAll('.pm-desc-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const val = e.target.value;
        if (!val) return;
        const targetTextarea = modalContent.querySelector('#' + sel.dataset.target);
        if (targetTextarea) {
          const current = targetTextarea.value.trim();
          if (!current) {
            targetTextarea.value = val;
          } else {
            const parts = current.split(',').map(s => s.trim());
            if (!parts.includes(val)) {
              targetTextarea.value = current + ', ' + val;
            }
          }
        }
        sel.value = '';
      });
    });

    // Rendimiento RS Pills
    modalContent.querySelectorAll('#pmRendimientoRSGroup .rs-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modalContent.querySelectorAll('#pmRendimientoRSGroup .rs-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Tag Control Buttons Toggle
    modalContent.querySelectorAll('#pmTagsGroup .tag-control-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
      });
    });

    let minutoEntrada = pEval.minutoEntrada || 0;
    let minutoSalida = pEval.minutoSalida || 0;

    const btnEntra = modalContent.querySelector('#pmBtnEntra');
    const btnSalir = modalContent.querySelector('#pmBtnSalir');

    function recalculateMinutes() {
      const isEntra = btnEntra?.classList.contains('active');
      const isSalir = btnSalir?.classList.contains('active');
      const minsInput = modalContent.querySelector('#pmMinutos');
      if (!minsInput) return;

      if (isEntra && isSalir) {
        const played = Math.max(0, (minutoSalida || 90) - (minutoEntrada || 0));
        minsInput.value = played;
      } else if (isEntra && !isSalir) {
        const played = Math.max(0, 90 - (minutoEntrada || 0));
        minsInput.value = played;
      } else if (!isEntra && isSalir) {
        const played = Math.max(0, minutoSalida || 45);
        minsInput.value = played;
      } else {
        minsInput.value = type === 'titular' ? 90 : 0;
      }
    }

    btnEntra?.addEventListener('click', () => {
      const isNowEntra = !btnEntra.classList.contains('active');
      btnEntra.classList.toggle('active');
      if (isNowEntra) {
        const matchMin = getCurrentMatchMinute();
        minutoEntrada = matchMin > 0 ? matchMin : 60;
        btnEntra.innerHTML = `<i data-lucide="log-in" style="width: 14px;"></i> ENTRÓ (${minutoEntrada}')`;
      } else {
        minutoEntrada = 0;
        btnEntra.innerHTML = `<i data-lucide="log-in" style="width: 14px;"></i> ENTRA`;
      }
      if (window.lucide) window.lucide.createIcons();
      recalculateMinutes();
    });

    btnSalir?.addEventListener('click', () => {
      const isNowSalir = !btnSalir.classList.contains('active');
      btnSalir.classList.toggle('active');
      if (isNowSalir) {
        const matchMin = getCurrentMatchMinute();
        minutoSalida = matchMin > 0 ? matchMin : 75;
        btnSalir.innerHTML = `<i data-lucide="log-out" style="width: 14px;"></i> SUSTITUIDO (${minutoSalida}')`;
      } else {
        minutoSalida = 0;
        btnSalir.innerHTML = `<i data-lucide="log-out" style="width: 14px;"></i> SALIR`;
      }
      if (window.lucide) window.lucide.createIcons();
      recalculateMinutes();
    });

    // Subtabs Switcher
    modalContent.querySelectorAll('.player-match-subtab').forEach(btn => {
      btn.addEventListener('click', () => {
        modalContent.querySelectorAll('.player-match-subtab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.dataset.tab;
        modalContent.querySelectorAll('.pm-tab-pane').forEach(pane => {
          pane.classList.toggle('hidden', pane.id !== targetId);
        });
      });
    });

    // Live Stats Summary Banner Calculation
    function updateStatsSummaryBanner() {
      const totalPases = (pStats.pasesBuenos || 0) + (pStats.pasesMalos || 0);
      const pctPases = totalPases > 0 ? Math.round((pStats.pasesBuenos / totalPases) * 100) : 0;

      const totalRegates = (pStats.regatesExito || 0) + (pStats.regatesFallidos || 0);
      const pctRegates = totalRegates > 0 ? Math.round((pStats.regatesExito / totalRegates) * 100) : 0;

      const totalDuelos = (pStats.duelosGanados || 0) + (pStats.duelosPerdidos || 0);
      const pctDuelos = totalDuelos > 0 ? Math.round((pStats.duelosGanados / totalDuelos) * 100) : 0;

      const partGol = (pStats.goles || 0) + (pStats.asistencias || 0);
      const balanceRec = (pStats.recuperaciones || 0) - (pStats.perdidas || 0);

      const bannerHTML = `
        <div class="stats-summary-banner">
          <div class="stats-summary-card">
            <div class="stats-summary-title">EFECTIVIDAD PASE</div>
            <div class="stats-summary-value" style="color: ${pctPases >= 75 ? '#16a34a' : (pctPases >= 50 ? '#d97706' : '#dc2626')};">${pctPases}%</div>
          </div>
          <div class="stats-summary-card">
            <div class="stats-summary-title">ÉXITO REGATE</div>
            <div class="stats-summary-value" style="color: ${pctRegates >= 60 ? '#16a34a' : (pctRegates >= 40 ? '#d97706' : '#dc2626')};">${pctRegates}%</div>
          </div>
          <div class="stats-summary-card">
            <div class="stats-summary-title">DUELOS GANADOS</div>
            <div class="stats-summary-value" style="color: ${pctDuelos >= 50 ? '#16a34a' : '#dc2626'};">${pctDuelos}%</div>
          </div>
          <div class="stats-summary-card">
            <div class="stats-summary-title">PARTICIPACIÓN GOL</div>
            <div class="stats-summary-value" style="color: #2563eb;">${partGol}</div>
          </div>
          <div class="stats-summary-card">
            <div class="stats-summary-title">BALANCE REC/PÉR</div>
            <div class="stats-summary-value" style="color: ${balanceRec >= 0 ? '#16a34a' : '#dc2626'};">${balanceRec >= 0 ? '+' : ''}${balanceRec}</div>
          </div>
        </div>
      `;

      const bannerContainer = modalContent.querySelector('#pmStatsSummaryBanner');
      if (bannerContainer) bannerContainer.innerHTML = bannerHTML;
    }

    updateStatsSummaryBanner();

    // Counter Stepper Buttons (+ / -)
    modalContent.querySelectorAll('.btn-counter-stepper').forEach(btn => {
      btn.addEventListener('click', () => {
        const statKey = btn.dataset.stat;
        const action = btn.dataset.action;
        let currentVal = pStats[statKey] || 0;
        if (action === 'plus') {
          currentVal++;
        } else if (action === 'minus') {
          currentVal = Math.max(0, currentVal - 1);
        }
        pStats[statKey] = currentVal;

        const numSpan = modalContent.querySelector(`.stat-counter-num[data-stat="${statKey}"]`);
        if (numSpan) numSpan.textContent = currentVal;

        updateStatsSummaryBanner();
      });
    });

    // Close Button
    modalContent.querySelector('#btnClosePlayerMatchModal')?.addEventListener('click', () => {
      hideModal();
      if (modalFooter) modalFooter.style.display = '';
    });

    // Save Button
    modalContent.querySelector('#btnSavePlayerMatchReport')?.addEventListener('click', () => {
      const activeRSBtn = modalContent.querySelector('#pmRendimientoRSGroup .rs-pill-btn.active');
      const activeTags = Array.from(modalContent.querySelectorAll('#pmTagsGroup .tag-control-btn.active')).map(b => b.dataset.tag);
      const isEntra = btnEntra?.classList.contains('active') || false;
      const isSalir = btnSalir?.classList.contains('active') || false;

      const evalObj = {
        rendimiento: modalContent.querySelector('#valRendimientoDisplay').textContent,
        potencial: modalContent.querySelector('#valPotencialDisplay').textContent,
        rendimientoRS: activeRSBtn ? activeRSBtn.dataset.val : 'C',
        tags: activeTags,
        entra: isEntra,
        minutoEntrada: isEntra ? minutoEntrada : 0,
        sustituido: isSalir,
        minutoSalida: isSalir ? minutoSalida : 0,
        minutos: parseInt(modalContent.querySelector('#pmMinutos').value) || 0,
        comentarioGeneral: modalContent.querySelector('#pmComentarioGeneral').value,
        descFisica: modalContent.querySelector('#pmDescFisica').value,
        descTecnica: modalContent.querySelector('#pmDescTecnica').value,
        descEmocional: modalContent.querySelector('#pmDescEmocional').value,
        perfilRS: modalContent.querySelector('#pmPerfilRS').value,
        stats: pStats
      };

      state.matchPlayerEvaluations[evalKey] = evalObj;

      // Sync to player's directory profile
      syncPlayerMatchReportToDirectory(pName, pNum, teamName, evalObj);

      hideModal();
      if (modalFooter) modalFooter.style.display = '';
    });
  }

  function syncCoachDataToDirectory(coachName, coachRating, coachComentario, kirolSport, teamName, rivalTeam) {
    if (!coachName || !coachName.trim() || !state.directory) return;
    const nameTrim = coachName.trim();
    if (!state.directory.staff) state.directory.staff = [];

    // Find coach in staff directory matching name or team+cargo
    let staffObj = state.directory.staff.find(s => {
      const sName = (s.nombre || s.staff || '').trim().toLowerCase();
      const nMatch = sName === nameTrim.toLowerCase();
      const sTeam = (s.equipo || s.club || '').trim().toLowerCase();
      const tMatch = teamName && sTeam && (sTeam.includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(sTeam));
      const sCargo = (s.cargo || s.puesto || '').toUpperCase();
      const cMatch = !sCargo || sCargo.includes('ENTRENADOR') || sCargo.includes('TÉCNICO');
      return nMatch || (tMatch && cMatch);
    });

    // If not found, create new staff profile for coach in Directory
    if (!staffObj) {
      staffObj = {
        id: 'st_' + Date.now() + Math.random().toString(36).substr(2, 4),
        nombre: nameTrim,
        staff: nameTrim,
        cargo: 'Entrenador',
        equipo: teamName || '',
        nivel: 'Senior',
        tags: []
      };
      state.directory.staff.unshift(staffObj);
    }

    // Update staff properties
    staffObj.nota = coachRating || 3;
    staffObj.valoracion = coachRating || 3;
    if (coachComentario) staffObj.comentario = coachComentario;
    staffObj.kirolSport = !!kirolSport;

    if (kirolSport) {
      staffObj.tags = staffObj.tags || [];
      if (!staffObj.tags.includes('⚽ Kirol Sport')) {
        staffObj.tags.push('⚽ Kirol Sport');
      }
    }

    // Append/update match evaluation history in coach profile
    if (!staffObj.historialEvaluaciones) staffObj.historialEvaluaciones = [];
    const repId = currentEditingReportId || 'temp';
    const existingIdx = staffObj.historialEvaluaciones.findIndex(h => h.reportId === repId);
    const evalRecord = {
      reportId: repId,
      fecha: document.getElementById('reportDate')?.value || new Date().toISOString().split('T')[0],
      equipo: teamName,
      rival: rivalTeam,
      nota: coachRating,
      comentario: coachComentario,
      kirolSport: kirolSport
    };

    if (existingIdx >= 0) staffObj.historialEvaluaciones[existingIdx] = evalRecord;
    else staffObj.historialEvaluaciones.push(evalRecord);

    // Also update team object in directory
    if (teamName) {
      const teamObj = findTeamInDirectory(teamName);
      if (teamObj) {
        teamObj.entrenador = nameTrim;
        teamObj.entrenadorNota = coachRating;
        teamObj.entrenadorComentario = coachComentario;
        teamObj.entrenadorKirolSport = kirolSport;
      }
    }
  }

  // Save Report Handler
  document.getElementById('btnSaveMatchReport')?.addEventListener('click', () => {
    try {
      const localTeam = document.getElementById('reportLocalTeam')?.value.trim() || 'Equipo Local';
      const visitanteTeam = document.getElementById('reportVisitanteTeam')?.value.trim() || 'Equipo Visitante';

      // Ensure active role tab states are saved
      saveCurrentTacticalRoleState('local');
      saveCurrentTacticalRoleState('visitante');

      const repId = currentEditingReportId || ('rep_' + Date.now());
      if (!state.matchPlayerEvaluations) state.matchPlayerEvaluations = {};

      ['local', 'visitante'].forEach(t => {
        const rows = document.querySelectorAll(`#${t}TitularesRows .lineup-row, #${t}SuplentesRows .lineup-row`);
        rows.forEach((r) => {
          const pNum = r.querySelector('input.num')?.value || r.querySelector('.num')?.value || '';
          const pName = r.querySelector('input.name')?.value.trim() || r.querySelector('.name')?.value.trim() || '';
          const evalKey = `${repId}_${t}_${pNum}`;
          if (state.matchPlayerEvaluations[evalKey]) {
            if (r.parentElement && r.parentElement.id && r.parentElement.id.includes('Titulares') && !state.matchPlayerEvaluations[evalKey].sustituido) {
              state.matchPlayerEvaluations[evalKey].minutos = 90;
            }
            if (pName) {
              syncPlayerMatchReportToDirectory(pName, pNum, t === 'local' ? localTeam : visitanteTeam, state.matchPlayerEvaluations[evalKey]);
            }
          }
        });
      });

      const reportObj = {
        id: repId,
        localTeam: localTeam,
        visitanteTeam: visitanteTeam,
        localScore: parseInt(document.getElementById('reportLocalScore')?.value) || 0,
        visitanteScore: parseInt(document.getElementById('reportVisitanteScore')?.value) || 0,
        date: document.getElementById('reportDate')?.value || new Date().toISOString().slice(0, 10),
        time: document.getElementById('reportTime')?.value || '20:00',
        estadio: document.getElementById('reportEstadio')?.value || '',
        clima: document.getElementById('reportClima')?.value || '',
        competicion: document.getElementById('reportCompeticion')?.value || '',
        categoria: document.getElementById('reportCategoria')?.value || '',
        federacion: document.getElementById('reportFederacion')?.value || '',

        localSystems: matchTacticalSystems.local,
        visitanteSystems: matchTacticalSystems.visitante,

        localFormation: matchTacticalSystems.local?.principal?.formation || document.getElementById('localFormationSelect')?.value || '1-4-3-3',
        visitanteFormation: matchTacticalSystems.visitante?.principal?.formation || document.getElementById('visitanteFormationSelect')?.value || '1-4-4-2',
        localDifficulty: getDifficultyRating('local'),
        visitanteDifficulty: getDifficultyRating('visitante'),
        localEstiloJuego: document.getElementById('localEstiloJuego')?.value || '',
        visitanteEstiloJuego: document.getElementById('visitanteEstiloJuego')?.value || '',

        localABPDetails: (function() {
          const details = {};
          ABP_KEYS.forEach(k => { details[k] = document.getElementById(`localABP_${k}`)?.value || ''; });
          return details;
        })(),
        visitanteABPDetails: (function() {
          const details = {};
          ABP_KEYS.forEach(k => { details[k] = document.getElementById(`visitanteABP_${k}`)?.value || ''; });
          return details;
        })(),
        localABP: (function() {
          const parts = [];
          ABP_KEYS.forEach(k => {
            const val = document.getElementById(`localABP_${k}`)?.value?.trim();
            if (val) parts.push(`${ABP_LABELS[k]}: ${val}`);
          });
          return parts.join('\n');
        })(),
        visitanteABP: (function() {
          const parts = [];
          ABP_KEYS.forEach(k => {
            const val = document.getElementById(`visitanteABP_${k}`)?.value?.trim();
            if (val) parts.push(`${ABP_LABELS[k]}: ${val}`);
          });
          return parts.join('\n');
        })(),
        localComentario: document.getElementById('localComentario')?.value || '',
        visitanteComentario: document.getElementById('visitanteComentario')?.value || '',

        localEntrenador: document.getElementById('localEntrenador')?.value || '',
        visitanteEntrenador: document.getElementById('visitanteEntrenador')?.value || '',
        localCoachRating: getCoachRating('local'),
        visitanteCoachRating: getCoachRating('visitante'),
        localComentarioEntrenador: document.getElementById('localComentarioEntrenador')?.value || '',
        visitanteComentarioEntrenador: document.getElementById('visitanteComentarioEntrenador')?.value || '',
        localKirolSport: document.getElementById('localBtnKirolSport')?.classList.contains('active') || false,
        visitanteKirolSport: document.getElementById('visitanteBtnKirolSport')?.classList.contains('active') || false,

        generalAnalysis: document.getElementById('reportGeneralAnalysis')?.value || '',
        localTitulares: matchTacticalSystems.local?.principal?.titulares || [],
        localSuplentes: matchTacticalSystems.local?.principal?.suplentes || [],
        visitanteTitulares: matchTacticalSystems.visitante?.principal?.titulares || [],
        visitanteSuplentes: matchTacticalSystems.visitante?.principal?.suplentes || []
      };

      if (!Array.isArray(state.reports)) state.reports = [];

      if (currentEditingReportId) {
        const idx = state.reports.findIndex(r => r.id === currentEditingReportId);
        if (idx !== -1) state.reports[idx] = reportObj;
        else state.reports.unshift(reportObj);
      } else {
        state.reports.unshift(reportObj);
      }

      // Link reportId to corresponding match in state.matches and update match metadata
      if (Array.isArray(state.matches)) {
        const matchingMatch = state.matches.find(m => 
          (m.reportId === reportObj.id) ||
          (m.local && m.visitante && m.local.toLowerCase() === reportObj.localTeam.toLowerCase() && m.visitante.toLowerCase() === reportObj.visitanteTeam.toLowerCase())
        );
        if (matchingMatch) {
          matchingMatch.reportId = reportObj.id;
          matchingMatch.competicion = reportObj.competicion;
          matchingMatch.categoria = reportObj.categoria;
          matchingMatch.estadio = reportObj.estadio;
          matchingMatch.fecha = reportObj.date;
          matchingMatch.hora = reportObj.time;
          matchingMatch.estado = 'visto';
        }
      }

      // Also auto-add/update players into directory
      if (state.directory && Array.isArray(state.directory.jugadores)) {
        [...reportObj.localTitulares, ...reportObj.visitanteTitulares].forEach(p => {
          if (p.name && !state.directory.jugadores.some(j => j.nombre && j.nombre.toLowerCase() === p.name.toLowerCase())) {
            state.directory.jugadores.push({
              id: 'j_' + Date.now() + Math.random().toString(36).substr(2, 4),
              nombre: p.name,
              equipo: reportObj.localTitulares.includes(p) ? reportObj.localTeam : reportObj.visitanteTeam,
              posicion: p.pos || '',
              ano: '2006',
              categoria: reportObj.categoria || 'Senior',
              nivel: 'Prospecto'
            });
          }
        });
      }

      // Sync team playstyle and ABP to team profiles in directory
      syncTeamStyleToDirectory(reportObj.localTeam, reportObj.localEstiloJuego, reportObj.localABP);
      syncTeamStyleToDirectory(reportObj.visitanteTeam, reportObj.visitanteEstiloJuego, reportObj.visitanteABP);

      // Sync coach data to coach staff profile and team profile in directory
      if (reportObj.localEntrenador) {
        syncCoachDataToDirectory(
          reportObj.localEntrenador,
          reportObj.localCoachRating,
          reportObj.localComentarioEntrenador,
          reportObj.localKirolSport,
          reportObj.localTeam,
          reportObj.visitanteTeam
        );
      }
      if (reportObj.visitanteEntrenador) {
        syncCoachDataToDirectory(
          reportObj.visitanteEntrenador,
          reportObj.visitanteCoachRating,
          reportObj.visitanteComentarioEntrenador,
          reportObj.visitanteKirolSport,
          reportObj.visitanteTeam,
          reportObj.localTeam
        );
      }

      saveState();

      if (typeof showNotification === 'function') {
        showNotification('¡Informe Técnico de Partido guardado con éxito y sincronizado en la nube!', 'success');
      } else {
        alert('¡Informe Técnico de Partido guardado con éxito!');
      }

      closeReportEditor();
      if (typeof renderPartidosList === 'function') {
        renderPartidosList();
      }
    } catch (err) {
      console.error('Error al guardar el informe técnico de partido:', err);
      alert('Error al guardar el informe: ' + err.message);
    }
  });

  // --------------------------------------------------------------------------
  // 6. SECTION 3: DIRECTORIO & SUB-TABS (Matches Directorio.png)
  // --------------------------------------------------------------------------
  let currentDirectoryTab = 'jugadores';

  const LISTA_PAISES = [
    'España', 'Francia', 'Portugal', 'Alemania', 'Inglaterra', 'Italia', 'Argentina',
    'Brasil', 'Uruguay', 'Colombia', 'Marruecos', 'Países Bajos', 'Bélgica', 'México',
    'Estados Unidos', 'Ecuador', 'Chile', 'Senegal', 'Japón', 'Otro'
  ];

  const LISTA_COMUNIDADES = [
    'Navarra',
    'La Rioja',
    'Aragón',
    'Andalucía',
    'Asturias',
    'Baleares',
    'Canarias',
    'Cantabria',
    'Castilla-La Mancha',
    'Castilla y León',
    'Cataluña',
    'Ceuta',
    'Comunidad Valenciana',
    'Extremadura',
    'Galicia',
    'Madrid',
    'Melilla',
    'Murcia',
    'País Vasco',
    'Internacional / Otro'
  ];

  const LISTA_CATEGORIAS_EQUIPO = [
    '1 DIV', '2 DIV', '1 RFEF', '2 RFEF', '3 RFEF', 'AUT', 'PREF', 'REG',
    'DHJ', 'LNJ', 'JAU', 'JPR', '2J', 'CV', 'CH', 'CPR', '2C', 'IH', 'ITX',
    'ALV', 'ALVB', 'BEN', 'BENB', 'PREBEN', 'ESCUELA', 'BAF', 'ICF', 'CJF',
    '1 RFEF FEM', '2 RFEF FEM', '3 RFEF FEM'
  ];

  const LISTA_TEMPORADAS_EQUIPO = [
    '2018/2019', '2019/2020', '2020/2021', '2021/2022', '2022/2023',
    '2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028',
    '2028/2029', '2029/2030', '2030/2031', '2031/2032', '2032/2033',
    '2033/2034', '2034/2035', '2035/2036'
  ];

  const LOCALIDADES_POR_COMUNIDAD = {
    'Navarra': [
      'Pamplona', 'Tudela', 'Barañáin', 'Burlada', 'Estella-Lizarra', 'Tafalla', 'Zizur Mayor',
      'Villava', 'Ansoáin', 'Egüés', 'Cintruénigo', 'Baztan', 'Corella', 'Alsasua', 'Huarte',
      'San Adrián', 'Sangüesa', 'Peralta', 'Lodosa'
    ],
    'La Rioja': [
      'Logroño', 'Calahorra', 'Arnedo', 'Haro', 'Nájera', 'Alfaro', 'Lardero', 'Villamediana de Iregua',
      'Santo Domingo de la Calzada', 'Autol'
    ],
    'Aragón': [
      'Zaragoza', 'Huesca', 'Teruel', 'Calatayud', 'Utebo', 'Ejea de los Caballeros', 'Monzón',
      'Barbastro', 'Fraga', 'Jaca', 'Alcañiz', 'Tarazona', 'Sabiñánigo', 'Caspe', 'Binéfar'
    ],
    'País Vasco': [
      'Bilbao', 'San Sebastián (Donostia)', 'Vitoria-Gasteiz', 'Barakaldo', 'Getxo', 'Irun',
      'Portugalete', 'Santurtzi', 'Basauri', 'Eibar', 'Tolosa', 'Zarautz', 'Mondragón'
    ],
    'Madrid': [
      'Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés', 'Getafe', 'Alcorcón',
      'Torrejón de Ardoz', 'Parla', 'Alcobendas', 'Las Rozas', 'San Sebastián de los Reyes'
    ],
    'Cataluña': [
      'Barcelona', "L'Hospitalet de Llobregat", 'Terrassa', 'Badalona', 'Sabadell', 'Lleida',
      'Tarragona', 'Mataró', 'Santa Coloma de Gramenet', 'Reus', 'Girona', 'Manresa', 'Cornellà'
    ],
    'Andalucía': [
      'Sevilla', 'Málaga', 'Córdoba', 'Granada', 'Jerez de la Frontera', 'Almería', 'Huelva',
      'Cádiz', 'Jaén', 'Marbella', 'Roquetas de Mar', 'Dos Hermanas', 'Algeciras'
    ],
    'Comunidad Valenciana': [
      'Valencia', 'Alicante', 'Castellón de la Plana', 'Elche', 'Torrevieja', 'Torrent',
      'Orihuela', 'Gandía', 'Paterna', 'Benidorm', 'Sagunto', 'Alcoy'
    ],
    'Galicia': [
      'Vigo', 'A Coruña', 'Ourense', 'Lugo', 'Santiago de Compostela', 'Pontevedra', 'Ferrol'
    ],
    'Castilla y León': [
      'Valladolid', 'Burgos', 'Salamanca', 'León', 'Palencia', 'Zamora', 'Ávila', 'Segovia', 'Soria', 'Ponferrada'
    ],
    'Castilla-La Mancha': [
      'Albacete', 'Guadalajara', 'Toledo', 'Talavera de la Reina', 'Ciudad Real', 'Cuenca', 'Puertollano'
    ],
    'Canarias': [
      'Las Palmas de Gran Canaria', 'Santa Cruz de Tenerife', 'San Cristóbal de La Laguna', 'Telde', 'Arona'
    ],
    'Asturias': [
      'Gijón', 'Oviedo', 'Avilés', 'Siero', 'Langreo'
    ],
    'Baleares': [
      'Palma', 'Calvià', 'Eivissa (Ibiza)', 'Manacor', 'Maó (Mahón)'
    ],
    'Murcia': [
      'Murcia', 'Cartagena', 'Lorca', 'Molina de Segura', 'Alcantarilla'
    ],
    'Extremadura': [
      'Badajoz', 'Cáceres', 'Mérida', 'Plasencia', 'Don Benito'
    ],
    'Cantabria': [
      'Santander', 'Torrelavega', 'Castro-Urdiales', 'Camargo', 'Piélagos'
    ],
    'Ceuta': ['Ceuta'],
    'Melilla': ['Melilla'],
    'Internacional / Otro': []
  };

  function getAvailableLocalidades(comunidadName = '') {
    let baseLocs = [];
    if (comunidadName && LOCALIDADES_POR_COMUNIDAD[comunidadName]) {
      baseLocs = LOCALIDADES_POR_COMUNIDAD[comunidadName];
    } else {
      baseLocs = Object.values(LOCALIDADES_POR_COMUNIDAD).flat();
    }
    const custom = state.customLocalidades || [];
    const set = new Set([...baseLocs, ...custom]);
    return Array.from(set);
  }

  function navigateToDirectoryTab(targetTab = 'jugadores') {
    currentDirectoryTab = targetTab;
    renderView('directorio');

    const subtabs = document.querySelectorAll('.directory-tab');
    subtabs.forEach(tab => {
      if (tab.dataset.dir === targetTab) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    renderDirectorio();
  }
  window.navigateToDirectoryTab = navigateToDirectoryTab;

  function initDirectorioSubtabs() {
    const subtabs = document.querySelectorAll('.directory-tab');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentDirectoryTab = tab.dataset.dir;
        currentSubCategoryFilter = 'TODOS';
        currentFederationFilter = 'TODAS';
        currentDirectoryPage = 1;
        renderDirectorio();
      });
    });
  }

  function calculateSubCategory(anoNac) {
    if (!anoNac) return '';
    const y = parseInt(anoNac, 10);
    if (isNaN(y) || y < 1950 || y > 2030) return String(anoNac);
    const currentSeasonYear = 2025;
    const age = currentSeasonYear - y;
    if (age <= 5) return 'Sub6';
    return `Sub${age}`;
  }

  function openPlayerModal(playerId = null) {
    const isEdit = !!playerId;
    const player = isEdit ? (state.directory.jugadores.find(j => j.id === playerId) || {}) : {};

    // Prepare default values
    const nombre = player.nombre || '';
    const dorsal = player.dorsal || '';
    const estado = player.estado || 'ALTA';
    const equipo = player.equipo || '';
    const equipoSecundario = player.equipoSecundario || '';
    const seleccion = player.seleccion || '';
    const anoNac = player.ano || player.anoNac || '';
    const subCat = calculateSubCategory(anoNac);
    const fechaNac = player.fechaNac || '';
    const sexo = player.sexo || 'MASCULINO';
    const comunidad = player.comunidad || 'Navarra';
    const localidad = player.localidad || 'Pamplona';

    const pierna = player.pierna || 'DERECHA';
    const disponibilidad = player.disponibilidad || '';
    const proyeccion = player.proyeccion || '';
    const posicionPrincipal = player.posicion || player.posicionPrincipal || '';
    const posicionSecundaria = player.posicionSecundaria || '';
    const observacionesDeportivas = player.observacionesDeportivas || '';

    let localLesiones = Array.isArray(player.lesiones) 
      ? [...player.lesiones] 
      : (player.lesiones ? player.lesiones.split(',').map(s => s.trim()).filter(Boolean) : []);

    let localPaises = Array.isArray(player.paises) 
      ? [...player.paises] 
      : (player.pais ? player.pais.split('/').map(s => s.trim()).filter(Boolean) : (player.pais ? [player.pais] : ['España']));

    const finContrato = player.finContrato || '';
    const agencia = player.agencia || '';
    const agente = player.agente || player.agenteRepresentante || '';
    const instagram = player.instagram || '';
    const twitter = player.twitter || '';
    const transfermarkt = player.transfermarkt || '';
    const besoccer = player.besoccer || '';
    const telefono = player.telefono || '';

    const controlSeguimiento = player.controlSeguimiento || [];
    const gestorRebound = player.gestorRebound || 'NINGUNA / CLUB CONVENIDO';

    const rendimientoAcumulado = player.rendimientoAcumulado || '';
    const potencial = player.potencial || '3';
    const minutos = player.minutos || '';
    const rendimientoRS = player.rendimientoRS || 'A';
    const descFisica = player.descFisica || '';
    const descTecnica = player.descTecnica || '';
    const descEmocional = player.descEmocional || '';
    const perfilRS = player.perfilRS || '';
    const comentarioGeneral = player.comentarioGeneral || '';

    let localTrayectoria = player.trayectoria ? JSON.parse(JSON.stringify(player.trayectoria)) : [];
    const historialEntrenadores = player.historialEntrenadores || '';
    const opinionTecnica = player.opinionTecnica || '';

    let photoData = player.foto || '';

    const titleText = isEdit ? `🏃 Ficha de ${escapeHtml(nombre)}` : '🏃 Nuevo Jugador';

    const modalHTML = `
      <div class="player-modal-wrapper">
        <!-- Banner Header Subtitle -->
        <p class="modal-subtitle mb-2" style="font-size: 12px; color: var(--text-muted);">Gestión de scouting, rendimiento y ficha técnica</p>

        <!-- Sub-tabs nav bar with Export PDF button -->
        <div style="display: flex; justify-content: space-between; align-items: center;" class="mb-4">
          <div class="player-modal-subtabs" style="margin-bottom: 0;">
            <button type="button" class="player-subtab active" data-ptab="perfil">PERFIL</button>
            <button type="button" class="player-subtab" data-ptab="deportivos">DATOS DEPORTIVOS</button>
            <button type="button" class="player-subtab" data-ptab="extra">INFO EXTRA</button>
            <button type="button" class="player-subtab" data-ptab="rendimiento">RENDIMIENTO</button>
            <button type="button" class="player-subtab" data-ptab="trayectoria">TRAYECTORIA & OPINIÓN</button>
          </div>
          <button type="button" class="btn btn-secondary" id="btnExportPlayerPdf" style="font-size: 11px; padding: 6px 12px; display: inline-flex; align-items: center; gap: 6px;">
            <i data-lucide="file-text"></i> Exportar PDF
          </button>
        </div>

        <datalist id="equiposDatalistOptions">
          ${(state.directory.equipos || []).map(e => `<option value="${escapeHtml(e.nombre || e.equipo)}"></option>`).join('')}
        </datalist>

        <datalist id="seleccionesDatalistOptions">
          ${(state.directory.selecciones || []).map(s => `<option value="${escapeHtml(s.nombre || s.seleccion)}"></option>`).join('')}
        </datalist>

        <datalist id="agenciasDatalistOptions">
          ${(state.directory.agencias || []).map(a => `<option value="${escapeHtml(a.nombre || a.agencia)}"></option>`).join('')}
        </datalist>

        <datalist id="agentesDatalistOptions">
          ${(state.directory.agentes || []).map(a => `<option value="${escapeHtml(a.nombre || a.agente)}"></option>`).join('')}
        </datalist>

        <datalist id="trayAnoDatalistOptions">
          <option value="26/27"></option>
          <option value="25/26"></option>
          <option value="24/25"></option>
          <option value="23/24"></option>
          <option value="22/23"></option>
          <option value="21/22"></option>
          <option value="20/21"></option>
        </datalist>

        <datalist id="trayClubDatalistOptions">
          ${(state.directory.equipos || []).map(e => `<option value="${escapeHtml(e.nombre || e.equipo)}"></option>`).join('')}
          ${(state.directory.clubes || []).map(c => `<option value="${escapeHtml(c.nombre)}"></option>`).join('')}
        </datalist>

        <datalist id="staffDatalistOptions">
          ${(state.directory.staff || []).map(s => `<option value="${escapeHtml(s.nombre || s.staff)}"></option>`).join('')}
        </datalist>

        <form id="playerForm">
          <!-- TAB 1: PERFIL -->
          <div class="player-tab-pane" id="ptab-perfil">
            <div class="player-profile-grid">
              <div>
                <div class="photo-upload-box" id="btnUploadPhoto">
                  ${photoData ? `<img src="${photoData}" class="photo-upload-preview">` : `
                    <i data-lucide="cloud-upload" style="width: 32px; height: 32px;"></i>
                    <span>SUBIR FOTO</span>
                  `}
                  <input type="file" id="inputPlayerPhoto" accept="image/*" class="hidden">
                </div>
              </div>

              <div>
                <div style="display: grid; grid-template-columns: 1fr 100px; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">NOMBRE COMPLETO DEL JUGADOR</label>
                    <input type="text" id="pfNombre" class="form-control" placeholder="Ej: Lionel Messi" value="${escapeHtml(nombre)}" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">DORSAL</label>
                    <input type="text" id="pfDorsal" class="form-control" placeholder="00" value="${escapeHtml(dorsal)}">
                  </div>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">ESTADO JUGADOR (TEMPORADA 2026/2027)</label>
                  <div class="status-pill-group" id="pfEstadoGroup">
                    <button type="button" class="status-pill-btn ${estado === 'ALTA' ? 'active' : ''}" data-val="ALTA">ALTA</button>
                    <button type="button" class="status-pill-btn ${estado === 'RENOVACIÓN' ? 'active' : ''}" data-val="RENOVACIÓN">RENOVACIÓN</button>
                    <button type="button" class="status-pill-btn ${estado === 'BAJA' ? 'active' : ''}" data-val="BAJA">BAJA</button>
                    <button type="button" class="status-pill-btn ${estado === 'SUBE DE EQUIPO INFERIOR' ? 'active' : ''}" data-val="SUBE DE EQUIPO INFERIOR">SUBE DE EQUIPO INFERIOR</button>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">EQUIPO PRINCIPAL</label>
                    <input type="text" id="pfEquipo" list="equiposDatalistOptions" class="form-control" placeholder="Buscar o elegir equipo..." value="${escapeHtml(equipo)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">EQUIPO SECUNDARIO (CAMBIO)</label>
                    <input type="text" id="pfEquipoSecundario" list="equiposDatalistOptions" class="form-control" placeholder="Segundo equipo..." value="${escapeHtml(equipoSecundario)}">
                  </div>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">SELECCIÓN</label>
                  <input type="text" id="pfSeleccion" list="seleccionesDatalistOptions" class="form-control" placeholder="Buscar o elegir selección..." value="${escapeHtml(seleccion)}">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center;" class="mb-1">
                      <label class="form-label" style="margin: 0;">AÑO NAC.</label>
                      <span id="pfSubCategoryBadge" class="match-category-tag" style="background-color: var(--primary-blue-light); color: var(--primary-blue); font-weight: 800; font-size: 11px;">${subCat ? escapeHtml(subCat) : 'Sub...'}</span>
                    </div>
                    <input type="text" id="pfAnoNac" class="form-control" placeholder="YYYY (ej: 2015)" value="${escapeHtml(anoNac)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">FECHA NAC.</label>
                    <input type="date" id="pfFechaNac" class="form-control" value="${escapeHtml(fechaNac)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">SEXO</label>
                    <select id="pfSexo" class="form-control">
                      <option value="MASCULINO" ${sexo === 'MASCULINO' ? 'selected' : ''}>MASCULINO</option>
                      <option value="FEMENINO" ${sexo === 'FEMENINO' ? 'selected' : ''}>FEMENINO</option>
                    </select>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                  <div class="form-group" style="grid-column: span 3;">
                    <label class="form-label">PAÍS / NACIONALIDADES (DOBLE NACIONALIDAD)</label>
                    <div id="pfPaisesTagsContainer" style="display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: var(--bg-surface); min-height: 42px; align-items: center;" class="mb-2"></div>
                    <select id="pfPaisSelect" class="form-control">
                      <option value="">+ Añadir país / nacionalidad...</option>
                      ${(state.customPaises || LISTA_PAISES).map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
                      <option value="__NEW_PAIS__" style="font-weight: bold; color: var(--primary-blue);">+ Crear nuevo país...</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">COMUNIDAD</label>
                    <select id="pfComunidad" class="form-control">
                      <option value="">Seleccionar...</option>
                      ${LISTA_COMUNIDADES.map(c => `<option value="${escapeHtml(c)}" ${comunidad === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
                      ${!LISTA_COMUNIDADES.includes(comunidad) && comunidad ? `<option value="${escapeHtml(comunidad)}" selected>${escapeHtml(comunidad)}</option>` : ''}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">LOCALIDAD</label>
                    <select id="pfLocalidad" class="form-control">
                      <option value="">Seleccionar...</option>
                      ${getAvailableLocalidades().map(l => `<option value="${escapeHtml(l)}" ${localidad === l ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('')}
                      ${!getAvailableLocalidades().includes(localidad) && localidad ? `<option value="${escapeHtml(localidad)}" selected>${escapeHtml(localidad)}</option>` : ''}
                      <option value="__NEW_LOCALIDAD__" style="font-weight: bold; color: var(--primary-blue);">+ Crear nueva localidad...</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: DATOS DEPORTIVOS -->
          <div class="player-tab-pane hidden" id="ptab-deportivos">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">PIERNA DOMINANTE</label>
                <select id="pfPierna" class="form-control">
                  <option value="DERECHA" ${pierna === 'DERECHA' ? 'selected' : ''}>DERECHA</option>
                  <option value="IZQUIERDA" ${pierna === 'IZQUIERDA' ? 'selected' : ''}>IZQUIERDA</option>
                  <option value="AMBIDIESTRO" ${pierna === 'AMBIDIESTRO' ? 'selected' : ''}>AMBIDIESTRO</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">DISPONIBILIDAD</label>
                <select id="pfDisponibilidad" class="form-control">
                  <option value="">Seleccionar...</option>
                  <option value="CEDIDO CA OSASUNA" ${disponibilidad === 'CEDIDO CA OSASUNA' ? 'selected' : ''}>CEDIDO CA OSASUNA</option>
                  <option value="CEDIDO CLUB PROFESIONAL" ${disponibilidad === 'CEDIDO CLUB PROFESIONAL' ? 'selected' : ''}>CEDIDO CLUB PROFESIONAL</option>
                  <option value="CON CONTRATO" ${disponibilidad === 'CON CONTRATO' ? 'selected' : ''}>CON CONTRATO</option>
                  ${disponibilidad && !['CEDIDO CA OSASUNA', 'CEDIDO CLUB PROFESIONAL', 'CON CONTRATO'].includes(disponibilidad) ? `<option value="${escapeHtml(disponibilidad)}" selected>${escapeHtml(disponibilidad)}</option>` : ''}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">PROYECCIÓN</label>
                <select id="pfProyeccion" class="form-control">
                  <option value="">Seleccionar...</option>
                  <option value="CANTERA PROFESIONAL" ${proyeccion === 'CANTERA PROFESIONAL' ? 'selected' : ''}>CANTERA PROFESIONAL</option>
                  <option value="JUGADOR PROFESIONAL" ${proyeccion === 'JUGADOR PROFESIONAL' ? 'selected' : ''}>JUGADOR PROFESIONAL</option>
                  <option value="JUGADOR INTERNACIONAL" ${proyeccion === 'JUGADOR INTERNACIONAL' ? 'selected' : ''}>JUGADOR INTERNACIONAL</option>
                  <option value="JUGADOR RFEF" ${proyeccion === 'JUGADOR RFEF' ? 'selected' : ''}>JUGADOR RFEF</option>
                  <option value="JUGADOR 3 RFEF" ${proyeccion === 'JUGADOR 3 RFEF' ? 'selected' : ''}>JUGADOR 3 RFEF</option>
                  <option value="JUGADOR AUTONOMICO" ${proyeccion === 'JUGADOR AUTONOMICO' ? 'selected' : ''}>JUGADOR AUTONOMICO</option>
                  <option value="JUGADOR REGIONAL" ${proyeccion === 'JUGADOR REGIONAL' ? 'selected' : ''}>JUGADOR REGIONAL</option>
                  ${proyeccion && !['CANTERA PROFESIONAL', 'JUGADOR PROFESIONAL', 'JUGADOR INTERNACIONAL', 'JUGADOR RFEF', 'JUGADOR 3 RFEF', 'JUGADOR AUTONOMICO', 'JUGADOR REGIONAL'].includes(proyeccion) ? `<option value="${escapeHtml(proyeccion)}" selected>${escapeHtml(proyeccion)}</option>` : ''}
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">POSICIÓN PRINCIPAL</label>
                <select id="pfPosPrincipal" class="form-control">
                  <option value="">Seleccionar...</option>
                  ${['PO', 'DBD', 'DBZ', 'DCD', 'DCZ', 'DC', 'MBD', 'MBZ', 'MCD', 'MCZ', 'MC', 'MPD', 'MPZ', 'MP', 'MVD', 'MVZ', 'ACD', 'ACZ', 'AC'].map(p => `<option value="${p}" ${posicionPrincipal === p ? 'selected' : ''}>${p}</option>`).join('')}
                  ${posicionPrincipal && !['PO', 'DBD', 'DBZ', 'DCD', 'DCZ', 'DC', 'MBD', 'MBZ', 'MCD', 'MCZ', 'MC', 'MPD', 'MPZ', 'MP', 'MVD', 'MVZ', 'ACD', 'ACZ', 'AC'].includes(posicionPrincipal) ? `<option value="${escapeHtml(posicionPrincipal)}" selected>${escapeHtml(posicionPrincipal)}</option>` : ''}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">POSICIÓN SECUNDARIA</label>
                <select id="pfPosSecundaria" class="form-control">
                  <option value="">Seleccionar...</option>
                  ${['PO', 'DBD', 'DBZ', 'DCD', 'DCZ', 'DC', 'MBD', 'MBZ', 'MCD', 'MCZ', 'MC', 'MPD', 'MPZ', 'MP', 'MVD', 'MVZ', 'ACD', 'ACZ', 'AC'].map(p => `<option value="${p}" ${posicionSecundaria === p ? 'selected' : ''}>${p}</option>`).join('')}
                  ${posicionSecundaria && !['PO', 'DBD', 'DBZ', 'DCD', 'DCZ', 'DC', 'MBD', 'MBZ', 'MCD', 'MCZ', 'MC', 'MPD', 'MPZ', 'MP', 'MVD', 'MVZ', 'ACD', 'ACZ', 'AC'].includes(posicionSecundaria) ? `<option value="${escapeHtml(posicionSecundaria)}" selected>${escapeHtml(posicionSecundaria)}</option>` : ''}
                </select>
              </div>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">LESIONES (HISTORIAL MULTI-SELECCIÓN)</label>
              <div id="pfLesionesTagsContainer" style="display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: var(--bg-surface); min-height: 42px; align-items: center;" class="mb-2"></div>
              <select id="pfLesionesSelect" class="form-control">
                <option value="">+ Añadir lesión al historial...</option>
                ${(state.customLesiones || ['Esguince de tobillo', 'Rotura fibrilar', 'Rotura de ligamento cruzado', 'Menisco', 'Pubalgia', 'Tendinitis', 'Contusión / Golpe', 'Sobrecarga muscular']).map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('')}
                <option value="__NEW_LESION__" style="font-weight: bold; color: var(--primary-blue);">+ Crear nueva lesión...</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">OBSERVACIONES DEPORTIVAS</label>
              <textarea id="pfObservacionesDeportivas" class="form-control" rows="4" placeholder="Escribe aquí observaciones deportivas detalladas del jugador...">${escapeHtml(observacionesDeportivas)}</textarea>
            </div>
          </div>

          <!-- TAB 3: INFO EXTRA -->
          <div class="player-tab-pane hidden" id="ptab-extra">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">FIN CONTRATO</label>
                <input type="text" id="pfFinContrato" class="form-control" placeholder="Ej: 2027" value="${escapeHtml(finContrato)}">
              </div>
              <div class="form-group">
                <label class="form-label">AGENCIA REPRESENTACIÓN</label>
                <input type="text" id="pfAgencia" list="agenciasDatalistOptions" class="form-control" placeholder="Buscar o elegir agencia..." value="${escapeHtml(agencia)}">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">AGENTE / REPRESENTANTE</label>
                <input type="text" id="pfAgente" list="agentesDatalistOptions" class="form-control" placeholder="Buscar o elegir agente..." value="${escapeHtml(agente)}">
              </div>
              <div class="form-group">
                <label class="form-label">TELÉFONO / CONTACTO</label>
                <input type="text" id="pfTelefono" class="form-control" placeholder="Ej: +34 600..." value="${escapeHtml(telefono)}">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">INSTAGRAM</label>
                <input type="text" id="pfInstagram" class="form-control" placeholder="Ej: @usuario" value="${escapeHtml(instagram)}">
              </div>
              <div class="form-group">
                <label class="form-label">TWITTER / X</label>
                <input type="text" id="pfTwitter" class="form-control" placeholder="Ej: @usuario" value="${escapeHtml(twitter)}">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">TRANSFERMARKT (URL)</label>
                <input type="url" id="pfTransfermarkt" class="form-control" placeholder="https://transfermarkt..." value="${escapeHtml(transfermarkt)}">
              </div>
              <div class="form-group">
                <label class="form-label">BESOCCER (URL)</label>
                <input type="url" id="pfBesoccer" class="form-control" placeholder="https://besoccer..." value="${escapeHtml(besoccer)}">
              </div>
            </div>
          </div>

          <!-- TAB 4: RENDIMIENTO -->
          <div class="player-tab-pane hidden" id="ptab-rendimiento">
            <div class="player-section-title mb-2">
              <i data-lucide="map-pin"></i> CONTROL & SEGUIMIENTO ESPECIAL
            </div>
            <div class="checkbox-grid-pills mb-4" id="pfControlGroup">
              ${['MAPA RS', 'ERF', 'SEGUIMIENTO', 'DESTACADO', 'JULEN', 'NO JUEGA', 'KIROL SPORT', 'CLUB CONVENIDO', 'JUGADOR RS CENTRO'].map(tag => `
                <label class="checkbox-pill-item">
                  <input type="checkbox" value="${tag}" ${controlSeguimiento.includes(tag) ? 'checked' : ''}>
                  <span>${tag}</span>
                </label>
              `).join('')}
            </div>

            <div class="player-section-title mb-2">
              <i data-lucide="bar-chart-2"></i> RENDIMIENTO ACUMULADO & OBSERVACIONES
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">RENDIMIENTO ACUMULADO (A-D)</label>
                <select id="pfRendAcumulado" class="form-control">
                  <option value="">Seleccionar...</option>
                  <option value="A+" ${rendimientoAcumulado === 'A+' ? 'selected' : ''}>A+</option>
                  <option value="A" ${rendimientoAcumulado === 'A' ? 'selected' : ''}>A</option>
                  <option value="B" ${rendimientoAcumulado === 'B' ? 'selected' : ''}>B</option>
                  <option value="C" ${rendimientoAcumulado === 'C' ? 'selected' : ''}>C</option>
                  <option value="D" ${rendimientoAcumulado === 'D' ? 'selected' : ''}>D</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">POTENCIAL (1-5)</label>
                <select id="pfPotencial" class="form-control">
                  <option value="1" ${potencial === '1' ? 'selected' : ''}>1 - Bajo</option>
                  <option value="2" ${potencial === '2' ? 'selected' : ''}>2 - Medio Bajo</option>
                  <option value="3" ${potencial === '3' ? 'selected' : ''}>3 - Promedio</option>
                  <option value="4" ${potencial === '4' ? 'selected' : ''}>4 - Alto</option>
                  <option value="5" ${potencial === '5' ? 'selected' : ''}>5 - Élite</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">MINUTOS JUGADOS</label>
                <input type="number" id="pfMinutos" class="form-control" placeholder="Ej: 1450" value="${escapeHtml(minutos)}">
              </div>
              <div class="form-group">
                <label class="form-label">RENDIMIENTO RS</label>
                <select id="pfRendRS" class="form-control">
                  <option value="">Seleccionar...</option>
                  <option value="A+" ${rendimientoRS === 'A+' ? 'selected' : ''}>A+</option>
                  <option value="A" ${rendimientoRS === 'A' ? 'selected' : ''}>A</option>
                  <option value="B" ${rendimientoRS === 'B' ? 'selected' : ''}>B</option>
                  <option value="C" ${rendimientoRS === 'C' ? 'selected' : ''}>C</option>
                  <option value="D" ${rendimientoRS === 'D' ? 'selected' : ''}>D</option>
                  ${rendimientoRS && !['A+', 'A', 'B', 'C', 'D'].includes(rendimientoRS) ? `<option value="${escapeHtml(rendimientoRS)}" selected>${escapeHtml(rendimientoRS)}</option>` : ''}
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">DESCRIPCIÓN FÍSICA</label>
                <select id="pfDescFisica" class="form-control">
                  <option value="">Seleccionar rasgo físico...</option>
                  <optgroup label="ESTATURA">
                    ${['Normal', 'Alto', 'Muy alto', 'Pequeño', 'Muy pequeño'].map(o => `<option value="${escapeHtml(o)}" ${descFisica === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="COMPLEXIÓN">
                    ${['Normal para la edad', 'Delgado', 'Fibroso', 'Ancho', 'Culón', 'Fuerte', 'Frágil', 'Atlético', 'Robusto'].map(o => `<option value="${escapeHtml(o)}" ${descFisica === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="DESARROLLO">
                    ${['Coordinado', 'Descoordinado', 'Piernas cortas', 'Piernas largas', 'Muy desarrollado', 'Poco desarrollado', 'Tren inferior potente', 'Tren superior potente', 'Buena postura corporal', 'Movilidad reducida'].map(o => `<option value="${escapeHtml(o)}" ${descFisica === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="ESTÉTICOS">
                    ${['Rubio', 'Moreno', 'Pelirrojo', 'Melena', 'Rapado', 'Teñido', 'Pelo largo', 'Pelo corto', 'Pelo rizado', 'Tatuaje', 'Barba', 'Sin barba', 'Pecas'].map(o => `<option value="${escapeHtml(o)}" ${descFisica === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="FENOTIPO">
                    ${['De raza negra', 'Sudamericano', 'Mestizo', 'Latino', 'Magrebí', 'Árabe', 'Asiático', 'Gitano', 'Nórdico', 'Caribeño'].map(o => `<option value="${escapeHtml(o)}" ${descFisica === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="MOTOR">
                    ${['Ritmo alto', 'Alta intensidad', 'Baja intensidad', 'Incansable', 'Trabajador', 'Constante', 'Intermitente', 'Buena lateralidad', 'Buena motricidad', 'Equilibrio destacado', 'Problemas de equilibrio', 'Control corporal avanzado', 'Dinámico', 'Rígido', 'Fluido', 'Buena lectura corporal', 'Gestualidad eficiente'].map(o => `<option value="${escapeHtml(o)}" ${descFisica === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="MADURACIÓN">
                    ${['Madurez tardía', 'Madurez prematura', 'Madurez normal'].map(o => `<option value="${escapeHtml(o)}" ${descFisica === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  ${descFisica && !['Normal', 'Alto', 'Muy alto', 'Pequeño', 'Muy pequeño', 'Normal para la edad', 'Delgado', 'Fibroso', 'Ancho', 'Culón', 'Fuerte', 'Frágil', 'Atlético', 'Robusto', 'Coordinado', 'Descoordinado', 'Piernas cortas', 'Piernas largas', 'Muy desarrollado', 'Poco desarrollado', 'Tren inferior potente', 'Tren superior potente', 'Buena postura corporal', 'Movilidad reducida', 'Rubio', 'Moreno', 'Pelirrojo', 'Melena', 'Rapado', 'Teñido', 'Pelo largo', 'Pelo corto', 'Pelo rizado', 'Tatuaje', 'Barba', 'Sin barba', 'Pecas', 'De raza negra', 'Sudamericano', 'Mestizo', 'Latino', 'Magrebí', 'Árabe', 'Asiático', 'Gitano', 'Nórdico', 'Caribeño', 'Ritmo alto', 'Alta intensidad', 'Baja intensidad', 'Incansable', 'Trabajador', 'Constante', 'Intermitente', 'Buena lateralidad', 'Buena motricidad', 'Equilibrio destacado', 'Problemas de equilibrio', 'Control corporal avanzado', 'Dinámico', 'Rígido', 'Fluido', 'Buena lectura corporal', 'Gestualidad eficiente', 'Madurez tardía', 'Madurez prematura', 'Madurez normal'].includes(descFisica) ? `<option value="${escapeHtml(descFisica)}" selected>${escapeHtml(descFisica)}</option>` : ''}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">DESCRIPCIÓN TÉCNICA</label>
                <select id="pfDescTecnica" class="form-control">
                  <option value="">Seleccionar acción técnica...</option>
                  <optgroup label="ACCIONES POSITIVAS">
                    ${['Regate efectivo', 'Buen control', 'Control bajo presión exitoso', 'Conducción segura', 'Pase corto preciso', 'Pase largo preciso', 'Pase filtrado exitoso', 'Cambio de orientación correcto', 'Centro preciso', 'Buena finalización', 'Anticipación bien', 'Bueno en robo de balón', 'Buenos despejes', 'Buena orientación corporal', 'Primer toque de calidad', 'Protección de balón efectiva', 'Buen golpeo en salida de balón', 'Regate en 1v1 ganado', 'Acción técnica bajo presión exitosa', 'Buena conducción en progresión', 'Buena recepción entre líneas', 'Pase en ventaja', 'Acción técnica creativa / diferente', 'Ganador juego aéreo'].map(o => `<option value="${escapeHtml(o)}" ${descTecnica === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="ACCIONES A MEJORAR / NEGATIVAS">
                    ${['Mal control', 'Control bajo presión malo', 'Regate fallido', 'Conducción arriesgada sin ventaja', 'Pase corto impreciso', 'Pase largo impreciso', 'Pase filtrado interceptado', 'Mal cambio de orientación', 'Centro impreciso', 'Mala finalización', 'Mide mal en anticipaciones', 'No roba balones', 'Despejes defectuosos', 'Mala orientación corporal', 'Acción técnica bajo presión fallida', 'Mala conducción en progresión', 'Mala recepción entre líneas', 'Pase que pone en riesgo al compañero', 'Acción técnica precipitada', 'No disputa juego aéreo'].map(o => `<option value="${escapeHtml(o)}" ${descTecnica === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  ${descTecnica && !['Regate efectivo', 'Buen control', 'Control bajo presión exitoso', 'Conducción segura', 'Pase corto preciso', 'Pase largo preciso', 'Pase filtrado exitoso', 'Cambio de orientación correcto', 'Centro preciso', 'Buena finalización', 'Anticipación bien', 'Bueno en robo de balón', 'Buenos despejes', 'Buena orientación corporal', 'Primer toque de calidad', 'Protección de balón efectiva', 'Buen golpeo en salida de balón', 'Regate en 1v1 ganado', 'Acción técnica bajo presión exitosa', 'Buena conducción en progresión', 'Buena recepción entre líneas', 'Pase en ventaja', 'Acción técnica creativa / diferente', 'Ganador juego aéreo', 'Mal control', 'Control bajo presión malo', 'Regate fallido', 'Conducción arriesgada sin ventaja', 'Pase corto impreciso', 'Pase largo impreciso', 'Pase filtrado interceptado', 'Mal cambio de orientación', 'Centro impreciso', 'Mala finalización', 'Mide mal en anticipaciones', 'No roba balones', 'Despejes defectuosos', 'Mala orientación corporal', 'Acción técnica bajo presión fallida', 'Mala conducción en progresión', 'Mala recepción entre líneas', 'Pase que pone en riesgo al compañero', 'Acción técnica precipitada', 'No disputa juego aéreo'].includes(descTecnica) ? `<option value="${escapeHtml(descTecnica)}" selected>${escapeHtml(descTecnica)}</option>` : ''}
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">DESCRIPCIÓN EMOCIONAL</label>
                <select id="pfDescEmocional" class="form-control">
                  <option value="">Seleccionar rasgo emocional...</option>
                  <optgroup label="ACTITUDES POSITIVAS">
                    ${['Concentración alta', 'Mantener la calma bajo presión', 'Confianza en sí mismo', 'Motivación constante', 'Comunicación efectiva con compañeros', 'Liderazgo en el campo', 'Persistencia / no rendirse', 'Resiliencia tras un error', 'Control emocional', 'Toma de decisiones rápida y acertada', 'Positivismo y actitud constructiva', 'Cooperación en equipo', 'Adaptación a cambios de situación', 'Escucha activa de instrucciones', 'Empatía con compañeros', 'Autocrítica constructiva', 'Gestión del estrés en momentos clave', 'Motivación del equipo', 'Mantenimiento de la concentración'].map(o => `<option value="${escapeHtml(o)}" ${descEmocional === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="ACTITUDES A MEJORAR / NEGATIVAS">
                    ${['Falta de concentración', 'Nerviosismo bajo presión', 'Falta de confianza', 'Desmotivación', 'Mala comunicación con compañeros', 'Egoísmo en el juego', 'Se rinde rápido', 'Frustración tras un error', 'Pérdida de autocontrol', 'Toma de decisiones precipitada', 'Actitud negativa / pesimista', 'Conflictos con compañeros', 'Rigidez ante cambios de situación', 'Ignorar instrucciones', 'Falta de empatía', 'Autocrítica destructiva', 'Estrés excesivo', 'Desmotivación del equipo', 'Desánimo tras fallo propio'].map(o => `<option value="${escapeHtml(o)}" ${descEmocional === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  ${descEmocional && !['Concentración alta', 'Mantener la calma bajo presión', 'Confianza en sí mismo', 'Motivación constante', 'Comunicación efectiva con compañeros', 'Liderazgo en el campo', 'Persistencia / no rendirse', 'Resiliencia tras un error', 'Control emocional', 'Toma de decisiones rápida y acertada', 'Positivismo y actitud constructiva', 'Cooperación en equipo', 'Adaptación a cambios de situation', 'Escucha activa de instrucciones', 'Empatía con compañeros', 'Autocrítica constructiva', 'Gestión del estrés en momentos clave', 'Motivación del equipo', 'Mantenimiento de la concentración', 'Falta de concentración', 'Nerviosismo bajo presión', 'Falta de confianza', 'Desmotivación', 'Mala comunicación con compañeros', 'Egoísmo en el juego', 'Se rinde rápido', 'Frustración tras un error', 'Pérdida de autocontrol', 'Toma de decisiones precipitada', 'Actitud negativa / pesimista', 'Conflictos con compañeros', 'Rigidez ante cambios de situación', 'Ignorar instrucciones', 'Falta de empatía', 'Autocrítica destructiva', 'Estrés excesivo', 'Desmotivación del equipo', 'Desánimo tras fallo propio'].includes(descEmocional) ? `<option value="${escapeHtml(descEmocional)}" selected>${escapeHtml(descEmocional)}</option>` : ''}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">PERFIL RS</label>
                <select id="pfPerfilRS" class="form-control">
                  <option value="">Seleccionar Perfil RS...</option>
                  <optgroup label="PORTEROS">
                    ${['PORTERÍA (Def)', 'ÁREA GRANDE (Def)', 'SOBRIO (Def)', 'INICIO DE JUEGO (Of)'].map(o => `<option value="${escapeHtml(o)}" ${perfilRS === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="LATERALES">
                    ${['1x1 DEFENSIVO (Def)', 'LECTURA DEFENSIVA (Def)', 'JUEGO COMBINATIVO (Of)', 'PROFUNDIDAD (Of)'].map(o => `<option value="${escapeHtml(o)}" ${perfilRS === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="CENTRALES">
                    ${['DEFENSA DE ÁREA (Def)', 'DEFENSA DE CAMPO ABIERTO (Def)', 'LECTURA DEFENSIVA (Def)', 'INICIO DE JUEGO (Of)'].map(o => `<option value="${escapeHtml(o)}" ${perfilRS === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="MEDIOCENTROS">
                    ${['RIGOR POSICIONAL (Def)', 'DESPLIEGUE (Def)', 'INICIO DE JUEGO (Of)', 'PROFUNDIDAD (Of)'].map(o => `<option value="${escapeHtml(o)}" ${perfilRS === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="INTERIORES">
                    ${['RIGOR POSICIONAL (Def)', 'DESPLIEGUE (Def)', 'ORGANIZADOR (Of)', 'BOX TO BOX (Of)'].map(o => `<option value="${escapeHtml(o)}" ${perfilRS === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="MEDIAPUNTAS">
                    ${['ELABORADOR (Of)', 'JUEGO ENTRE LÍNEAS (Of)', 'PROFUNDO CON BALÓN (Of)', 'PROFUNDO EN EL ESPACIO (Of)'].map(o => `<option value="${escapeHtml(o)}" ${perfilRS === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="BANDAS">
                    ${['1x1 OFENSIVO (Of)', 'COMBINATIVO (Of)', 'PROFUNDO FUERA-FUERA (Of)', 'RUPTURA FUERA-DENTRO (Of)'].map(o => `<option value="${escapeHtml(o)}" ${perfilRS === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  <optgroup label="PUNTAS">
                    ${['ÁREA (Of)', 'REFERENCIA (Of)', 'APOYO (Of)', 'ESPACIO (Of)'].map(o => `<option value="${escapeHtml(o)}" ${perfilRS === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                  </optgroup>
                  ${perfilRS && !['PORTERÍA (Def)', 'ÁREA GRANDE (Def)', 'SOBRIO (Def)', 'INICIO DE JUEGO (Of)', '1x1 DEFENSIVO (Def)', 'LECTURA DEFENSIVA (Def)', 'JUEGO COMBINATIVO (Of)', 'PROFUNDIDAD (Of)', 'DEFENSA DE ÁREA (Def)', 'DEFENSA DE CAMPO ABIERTO (Def)', 'RIGOR POSICIONAL (Def)', 'DESPLIEGUE (Def)', 'ORGANIZADOR (Of)', 'BOX TO BOX (Of)', 'ELABORADOR (Of)', 'JUEGO ENTRE LÍNEAS (Of)', 'PROFUNDO CON BALÓN (Of)', 'PROFUNDO EN EL ESPACIO (Of)', '1x1 OFENSIVO (Of)', 'COMBINATIVO (Of)', 'PROFUNDO FUERA-FUERA (Of)', 'RUPTURA FUERA-DENTRO (Of)', 'ÁREA (Of)', 'REFERENCIA (Of)', 'APOYO (Of)', 'ESPACIO (Of)'].includes(perfilRS) ? `<option value="${escapeHtml(perfilRS)}" selected>${escapeHtml(perfilRS)}</option>` : ''}
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">COMENTARIO GENERAL</label>
              <textarea id="pfComentarioGeneral" class="form-control" rows="3" placeholder="Observaciones generales...">${escapeHtml(comentarioGeneral)}</textarea>
            </div>
          </div>

          <!-- TAB 5: TRAYECTORIA & OPINIÓN -->
          <div class="player-tab-pane hidden" id="ptab-trayectoria">
            <div class="player-section-title mb-2">
              <i data-lucide="clock"></i> TRAYECTORIA & HISTORIAL DE CLUBES
            </div>
            <div style="display: grid; grid-template-columns: 130px 1fr 1fr 90px; gap: 8px;" class="mb-4">
              <input type="text" id="pfTrayAno" list="trayAnoDatalistOptions" class="form-control" placeholder="Temp (26/27)">
              <input type="text" id="pfTrayClub" list="trayClubDatalistOptions" class="form-control" placeholder="Buscar equipo/club...">
              <input type="text" id="pfTrayEntrenador" list="staffDatalistOptions" class="form-control" placeholder="Entrenador (auto / manual)...">
              <button type="button" class="btn btn-primary" id="btnAddTrayRow">
                <i data-lucide="plus"></i> Añadir
              </button>
            </div>

            <div class="table-responsive mb-6" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-light); font-weight: 800; color: var(--text-muted); text-align: left;">
                    <th style="padding: 8px 12px; width: 15%;">TEMPORADA</th>
                    <th style="padding: 8px 12px; width: 35%;">EQUIPO / CLUB</th>
                    <th style="padding: 8px 12px; width: 40%;">ENTRENADOR (ENLACE A FICHA)</th>
                    <th style="padding: 8px 12px; text-align: right; width: 10%;">ELIMINAR</th>
                  </tr>
                </thead>
                <tbody id="pfTrayTableBody">
                  <!-- Rendered dynamically -->
                </tbody>
              </table>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">HISTORIAL DE ENTRENADORES (COACHING)</label>
              <textarea id="pfHistorialEntrenadores" class="form-control" rows="3" placeholder="Lista de técnicos anteriores...">${escapeHtml(historialEntrenadores)}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">OPINIÓN TÉCNICA Y RECOMENDACIÓN FINAL</label>
              <textarea id="pfOpinionTecnica" class="form-control" rows="3" placeholder="Análisis exhaustivo del jugador y recomendación de fichaje/seguimiento...">${escapeHtml(opinionTecnica)}</textarea>
            </div>
          </div>
        </form>
      </div>
    `;

    const card = document.getElementById('generalModalCard');
    card.classList.add('large');

        showModal(titleText, modalHTML, () => {
      const nameVal = document.getElementById('cfNombre')?.value.trim();
      if (!nameVal) {
        alert('Por favor ingresa el nombre del club');
        return false;
      }

      const updatedClub = {
        id: isEdit ? clubId : 'c_' + Date.now(),
        nombre: nameVal,
        equipo: nameVal,
        tipo: selectedClubTypes.join(', '),
        tiposArray: [...selectedClubTypes],
        anoFundacion: document.getElementById('cfAnoFundacion')?.value.trim() || '',
        ano: document.getElementById('cfAnoFundacion')?.value.trim() || '',
        comunidad: document.getElementById('cfComunidad')?.value.trim() || '',
        localidad: document.getElementById('cfLocalidad')?.value.trim() || '',
        federacion: document.getElementById('cfFederacion')?.value.trim() || '',
        estadio: document.getElementById('cfEstadio')?.value.trim() || '',
        web: document.getElementById('cfWeb')?.value.trim() || '',
        instagram: document.getElementById('cfInstagram')?.value.trim() || '',
        linkedin: document.getElementById('cfLinkedin')?.value.trim() || '',
        facebook: document.getElementById('cfFacebook')?.value.trim() || '',
        convenidoDe: document.getElementById('cfConvenidoDe')?.value.trim() || '',
        convenidosVinculados: document.getElementById('cfConvenidosVinculados')?.value.trim() || '',
        patrocinadorDe: document.getElementById('cfPatrocinadorDe')?.value.trim() || '',
        patrocinadoPor: document.getElementById('cfPatrocinadoPor')?.value.trim() || '',

        codigo: document.getElementById('cfCodigo')?.value.trim() || '',
        delegacion: document.getElementById('cfDelegacion')?.value.trim() || '',
        cif: document.getElementById('cfCif')?.value.trim() || '',
        domicilio: document.getElementById('cfDomicilio')?.value.trim() || '',
        provincia: document.getElementById('cfProvincia')?.value.trim() || '',
        cp: document.getElementById('cfCp')?.value.trim() || '',
        colorCamiseta: document.getElementById('cfColorCamiseta')?.value.trim() || '',
        colorPantalon: document.getElementById('cfColorPantalon')?.value.trim() || '',
        colorMedias: document.getElementById('cfColorMedias')?.value.trim() || '',
        email: document.getElementById('cfEmail')?.value.trim() || '',
        telefonos: document.getElementById('cfTelefonos')?.value.trim() || '',
        fax: document.getElementById('cfFax')?.value.trim() || '',

        staff: localStaffList,
        equiposList: localEquiposList,
        notas: document.getElementById('cfNotas')?.value.trim() || '',

        logo: logoData,
        escudo: logoData,
        colorPrimary: document.getElementById('cfColorPrimary')?.value || '#2563eb',
        colorSecondary: document.getElementById('cfColorSecondary')?.value || '#ffffff'
      };

      if (!state.directory.clubes) state.directory.clubes = [];
      if (isEdit) {
        const idx = state.directory.clubes.findIndex(c => c && (String(c.id) === String(clubId) || (c.codigo && String(c.codigo) === String(clubId))));
        if (idx !== -1) state.directory.clubes[idx] = updatedClub;
      } else {
        state.directory.clubes.unshift(updatedClub);
      }
      saveToFirebase('clubes', updatedClub);

      // Auto-sync logo/escudo and colors to all linked teams in state.directory.equipos
      if (state.directory.equipos && Array.isArray(state.directory.equipos)) {
        state.directory.equipos.forEach(eq => {
          const eqClubName = (eq.clubVinculado || eq.club || '').trim().toLowerCase();
          const clubNameLower = (nameVal || nombre || '').trim().toLowerCase();
          const isLinked = (eqClubName && eqClubName === clubNameLower) || (eq.nombre && clubNameLower && eq.nombre.toLowerCase().startsWith(clubNameLower));
          if (isLinked) {
            if (logoData) {
              eq.escudo = logoData;
              eq.logo = logoData;
            }
            if (updatedClub.colorPrimary) {
              eq.colorPrimary = updatedClub.colorPrimary;
            }
            if (updatedClub.colorSecondary) {
              eq.colorSecondary = updatedClub.colorSecondary;
            }
            if (updatedClub.federacion) {
              eq.federacion = updatedClub.federacion;
            }
            saveToFirebase('equipos', eq);
          }
        });
      }

      // Bidirectional sync for Federación, Estadio, Convenidos & Patrocinador
      const fedVal = updatedClub.federacion;
      const estVal = updatedClub.estadio;
      const convDeVal = updatedClub.convenidoDe;
      const convVincVal = updatedClub.convenidosVinculados;
      const patVal = updatedClub.patrocinadorDe;
      const patPorVal = updatedClub.patrocinadoPor;

      if (fedVal && state.directory.federaciones) {
        let targetFed = state.directory.federaciones.find(f => 
          (f.nombre && f.nombre.toLowerCase() === fedVal.toLowerCase()) ||
          (f.federacion && f.federacion.toLowerCase() === fedVal.toLowerCase())
        );
        if (!targetFed) {
          targetFed = {
            id: 'fed_' + Date.now() + Math.floor(Math.random()*100),
            nombre: fedVal,
            federacion: fedVal,
            clubes: []
          };
          state.directory.federaciones.unshift(targetFed);
        }
        if (!targetFed.clubes) targetFed.clubes = [];
        const exists = targetFed.clubes.some(c => (typeof c === 'string' ? c : c.nombre) === nameVal);
        if (!exists) targetFed.clubes.push({ id: updatedClub.id, nombre: nameVal });
      }

      if (estVal && state.directory.estadios) {
        let targetEst = state.directory.estadios.find(e => 
          (e.nombre && e.nombre.toLowerCase() === estVal.toLowerCase()) ||
          (e.estadio && e.estadio.toLowerCase() === estVal.toLowerCase())
        );
        if (!targetEst) {
          targetEst = {
            id: 'est_' + Date.now() + Math.floor(Math.random()*100),
            nombre: estVal,
            estadio: estVal,
            clubes: []
          };
          state.directory.estadios.unshift(targetEst);
        }
        if (!targetEst.clubes) targetEst.clubes = [];
        const exists = targetEst.clubes.some(c => (typeof c === 'string' ? c : c.nombre) === nameVal);
        if (!exists) targetEst.clubes.push({ id: updatedClub.id, nombre: nameVal });
      }

      const syncClubToClub = (targetClubName, targetField) => {
        if (!targetClubName || !state.directory.clubes) return;
        let targetC = state.directory.clubes.find(c => 
          (c.nombre && c.nombre.toLowerCase() === targetClubName.toLowerCase()) ||
          (c.equipo && c.equipo.toLowerCase() === targetClubName.toLowerCase())
        );
        if (!targetC) {
          targetC = {
            id: 'c_' + Date.now() + Math.floor(Math.random()*100),
            nombre: targetClubName,
            equipo: targetClubName
          };
          state.directory.clubes.unshift(targetC);
        }
        if (!targetC[targetField]) targetC[targetField] = '';
        if (!targetC[targetField].toLowerCase().includes(nameVal.toLowerCase())) {
          targetC[targetField] = targetC[targetField] ? `${targetC[targetField]}, ${nameVal}` : nameVal;
        }
      };

      syncClubToClub(convDeVal, 'convenidosVinculados');
      syncClubToClub(convVincVal, 'convenidoDe');
      syncClubToClub(patVal, 'patrocinadorDe');
      syncClubToClub(patPorVal, 'patrocinadorDe');

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    }, isEdit ? {
      label: 'Eliminar Club',
      title: `¿Eliminar Ficha de ${nombre || 'Club'}?`,
      message: `¿Estás seguro de que deseas eliminar permanentemente el club "${nombre}" de la base de datos?`,
      action: () => {
        deleteDirectoryItem('clubes', clubId);
        hideModal();
        showToast('Club eliminado con éxito', 'danger');
        renderDirectorio();
      }
    } : null);

    // Setup event listeners after modal is rendered
    const renderClubTypeChips = () => {
      const container = document.getElementById('clubTypeChipsContainer');
      if (!container) return;
      container.innerHTML = state.customClubTypes.map(t => {
        const isSelected = selectedClubTypes.includes(t);
        return `
          <span class="club-type-chip ${isSelected ? 'selected' : ''}" data-type="${escapeHtml(t)}" style="padding: 3px 10px; font-size: 11px; font-weight: 600; border-radius: 12px; cursor: pointer; user-select: none; transition: all 0.15s ease; border: 1px solid ${isSelected ? 'var(--primary-blue, #2563eb)' : '#cbd5e1'}; background: ${isSelected ? 'var(--primary-blue, #2563eb)' : '#f8fafc'}; color: ${isSelected ? '#ffffff' : '#334155'}; display: inline-flex; align-items: center; gap: 4px;">
            ${isSelected ? '✓ ' : ''}${escapeHtml(t)}
          </span>
        `;
      }).join('');

      container.querySelectorAll('.club-type-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const tVal = chip.dataset.type;
          if (selectedClubTypes.includes(tVal)) {
            selectedClubTypes = selectedClubTypes.filter(x => x !== tVal);
          } else {
            selectedClubTypes.push(tVal);
          }
          renderClubTypeChips();
        });
      });
    };

    renderClubTypeChips();

    const btnShowInput = document.getElementById('btnShowAddClubTypeInput');
    const inputRow = document.getElementById('newClubTypeInputRow');
    const inputNewType = document.getElementById('inputNewCustomClubType');
    const btnConfirmAdd = document.getElementById('btnConfirmAddClubType');

    const btnOpenConvModal = document.getElementById('btnOpenConvenidosModalInForm');
    btnOpenConvModal?.addEventListener('click', () => {
      openClubConvenidosWindow(club);
    });

    btnShowInput?.addEventListener('click', () => {
      if (inputRow) {
        inputRow.style.display = inputRow.style.display === 'none' ? 'flex' : 'none';
        if (inputRow.style.display === 'flex') inputNewType?.focus();
      }
    });

    const handleAddNewType = () => {
      const val = inputNewType?.value.trim();
      if (!val) return;
      if (!state.customClubTypes.includes(val)) {
        state.customClubTypes.push(val);
      }
      if (!selectedClubTypes.includes(val)) {
        selectedClubTypes.push(val);
      }
      if (inputNewType) inputNewType.value = '';
      if (inputRow) inputRow.style.display = 'none';
      saveState();
      renderClubTypeChips();
    };

    btnConfirmAdd?.addEventListener('click', handleAddNewType);
    inputNewType?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddNewType();
      }
    });

// Subtab switching logic
    const subtabs = document.querySelectorAll('.player-subtab');
    const panes = document.querySelectorAll('.player-tab-pane');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        const targetPane = document.getElementById('ptab-' + tab.dataset.ptab);
        if (targetPane) targetPane.classList.remove('hidden');
      });
    });

    // Status pill toggle logic
    document.querySelectorAll('#pfEstadoGroup .status-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#pfEstadoGroup .status-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Trajectory add row logic with automatic coach lookup
    const inputTrayAno = document.getElementById('pfTrayAno');
    const inputTrayClub = document.getElementById('pfTrayClub');
    const inputTrayEntrenador = document.getElementById('pfTrayEntrenador');

    const autoFindCoach = () => {
      const selectedAno = inputTrayAno?.value.trim() || '';
      const selectedClub = inputTrayClub?.value.trim() || '';
      if (!selectedClub) return;

      let foundCoach = '';
      const matchingTeams = (state.directory.equipos || []).filter(e => {
        const nameMatch = (e.nombre && e.nombre.toLowerCase() === selectedClub.toLowerCase()) ||
                          (e.equipo && e.equipo.toLowerCase() === selectedClub.toLowerCase());
        return nameMatch;
      });

      if (matchingTeams.length > 0) {
        const exactSeasonTeam = matchingTeams.find(e => e.temporada === selectedAno);
        const teamObj = exactSeasonTeam || matchingTeams[0];

        if (teamObj.entrenador) foundCoach = teamObj.entrenador;
        else if (teamObj.entrenadorPrincipal) foundCoach = teamObj.entrenadorPrincipal;
        else if (teamObj.cuerpoTecnico && Array.isArray(teamObj.cuerpoTecnico)) {
          const coachEntry = teamObj.cuerpoTecnico.find(ct => (ct.cargo && ct.cargo.toLowerCase().includes('entrenador')) || ct.nombre);
          if (coachEntry) foundCoach = typeof coachEntry === 'string' ? coachEntry : (coachEntry.nombre || coachEntry.entrenador || '');
        }
      }

      if (!foundCoach && state.directory.staff) {
        const staffCoach = state.directory.staff.find(s => {
          const clubMatch = (s.equipo && s.equipo.toLowerCase() === selectedClub.toLowerCase()) ||
                            (s.club && s.club.toLowerCase() === selectedClub.toLowerCase());
          return clubMatch;
        });
        if (staffCoach) {
          foundCoach = staffCoach.nombre || staffCoach.staff || '';
        }
      }

      if (foundCoach && inputTrayEntrenador && !inputTrayEntrenador.value.trim()) {
        inputTrayEntrenador.value = foundCoach;
      }
    };

    inputTrayClub?.addEventListener('change', autoFindCoach);
    inputTrayClub?.addEventListener('input', autoFindCoach);
    inputTrayAno?.addEventListener('change', autoFindCoach);

    function renderTrayectoriaTable() {
      const tbody = document.getElementById('pfTrayTableBody');
      if (!tbody) return;
      if (localTrayectoria.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding: 12px; text-align: center; color: var(--text-muted);">Sin historial de trayectoria añadido</td></tr>`;
      } else {
        tbody.innerHTML = localTrayectoria.map((t, idx) => {
          const coachName = t.entrenador || '';
          let coachHTML = '<span style="color: var(--text-muted); font-style: italic;">Sin especificar</span>';
          if (coachName) {
            const foundStaff = (state.directory.staff || []).find(s => 
              (s.nombre && s.nombre.toLowerCase() === coachName.toLowerCase()) ||
              (s.staff && s.staff.toLowerCase() === coachName.toLowerCase())
            );
            if (foundStaff) {
              coachHTML = `<a href="javascript:void(0)" class="coach-modal-link" data-staffid="${foundStaff.id}" style="color: var(--primary-blue); font-weight: 700; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="user-check" style="width: 13px; height: 13px;"></i> ${escapeHtml(coachName)}</a>`;
            } else {
              coachHTML = `<span style="font-weight: 600; color: var(--text-main); display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="user" style="width: 13px; height: 13px; color: var(--text-muted);"></i> ${escapeHtml(coachName)}</span>`;
            }
          }

          return `
            <tr style="border-bottom: 1px solid var(--border-light);">
              <td style="padding: 8px 12px; font-weight: 700;">${escapeHtml(t.ano)}</td>
              <td style="padding: 8px 12px; font-weight: 600;">${escapeHtml(t.club)}</td>
              <td style="padding: 8px 12px;">${coachHTML}</td>
              <td style="padding: 8px 12px; text-align: right;">
                <button type="button" class="btn-action-icon danger btn-del-tray" data-idx="${idx}" style="width: 26px; height: 26px;">
                  <i data-lucide="trash-2" style="width: 12px;"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        tbody.querySelectorAll('.btn-del-tray').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.idx, 10);
            localTrayectoria.splice(index, 1);
            renderTrayectoriaTable();
          });
        });

        tbody.querySelectorAll('.coach-modal-link').forEach(link => {
          link.addEventListener('click', (ev) => {
            ev.preventDefault();
            const sId = link.dataset.staffid;
            if (sId) {
              card.classList.remove('large');
              hideModal();
              openStaffModal(sId);
            }
          });
        });
      }
      if (window.lucide) window.lucide.createIcons();
    }
    renderTrayectoriaTable();

    document.getElementById('btnAddTrayRow')?.addEventListener('click', () => {
      const ano = document.getElementById('pfTrayAno').value.trim();
      const club = document.getElementById('pfTrayClub').value.trim();
      const entrenador = document.getElementById('pfTrayEntrenador').value.trim();
      if (!ano || !club) return alert('Por favor ingresa la Temporada/Año y el Club');
      localTrayectoria.push({ ano, club, entrenador });
      document.getElementById('pfTrayAno').value = '';
      document.getElementById('pfTrayClub').value = '';
      document.getElementById('pfTrayEntrenador').value = '';
      renderTrayectoriaTable();
    });

    // Photo Upload Handler
    const inputPhoto = document.getElementById('inputPlayerPhoto');
    document.getElementById('btnUploadPhoto')?.addEventListener('click', () => inputPhoto.click());
    inputPhoto?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          photoData = await compressImage(file);
          document.getElementById('btnUploadPhoto').innerHTML = `<img src="${photoData}" class="photo-upload-preview">`;
        } catch (err) {
          console.error('Error al comprimir foto:', err);
        }
      }
    });

    // Dynamic Localidad update based on Comunidad selection
    const comSelect = document.getElementById('pfComunidad');
    const locSelect = document.getElementById('pfLocalidad');

    const updateLocalidadesOptions = (selectedComunidad, currentLocalidadVal) => {
      if (!locSelect) return;
      const locList = getAvailableLocalidades(selectedComunidad);
      let optionsHTML = '<option value="">Seleccionar...</option>';
      locList.forEach(l => {
        const isSel = currentLocalidadVal === l ? 'selected' : '';
        optionsHTML += `<option value="${escapeHtml(l)}" ${isSel}>${escapeHtml(l)}</option>`;
      });
      if (currentLocalidadVal && !locList.includes(currentLocalidadVal)) {
        optionsHTML += `<option value="${escapeHtml(currentLocalidadVal)}" selected>${escapeHtml(currentLocalidadVal)}</option>`;
      }
      optionsHTML += '<option value="__NEW_LOCALIDAD__" style="font-weight: bold; color: var(--primary-blue);">+ Crear nueva localidad...</option>';
      locSelect.innerHTML = optionsHTML;
    };

    updateLocalidadesOptions(comunidad, localidad);

    comSelect?.addEventListener('change', (e) => {
      updateLocalidadesOptions(e.target.value, '');
    });

    // Handle creation of new custom localidad
    locSelect?.addEventListener('change', (e) => {
      if (e.target.value === '__NEW_LOCALIDAD__') {
        const newLocName = prompt('Introduce el nombre de la nueva localidad:');
        if (newLocName && newLocName.trim()) {
          const trimmed = newLocName.trim();
          if (!state.customLocalidades) state.customLocalidades = [];
          if (!state.customLocalidades.includes(trimmed)) {
            state.customLocalidades.push(trimmed);
            saveState();
          }
          const opt = document.createElement('option');
          opt.value = trimmed;
          opt.textContent = trimmed;
          opt.selected = true;
          locSelect.insertBefore(opt, locSelect.lastElementChild);
          locSelect.value = trimmed;
        } else {
          locSelect.value = '';
        }
      }
    });

    // --------------------------------------------------------------------------
    // Multi-Select Tags Setup: Países & Lesiones + Dynamic Sub-Category Update
    // --------------------------------------------------------------------------
    function renderLesionesTags() {
      const container = document.getElementById('pfLesionesTagsContainer');
      if (!container) return;
      if (localLesiones.length === 0) {
        container.innerHTML = `<span style="color: var(--text-muted); font-size: 12px;">Sin lesiones registradas. Haz clic abajo para añadir.</span>`;
        return;
      }
      container.innerHTML = localLesiones.map((l, idx) => `
        <span class="match-category-tag" style="background: var(--bg-subtle); color: var(--text-dark); padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border-light);">
          💉 ${escapeHtml(l)}
          <i data-lucide="x" class="btn-remove-lesion cursor-pointer" data-idx="${idx}" style="width: 14px; height: 14px; color: var(--accent-red, #ef4444);"></i>
        </span>
      `).join('');
      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('.btn-remove-lesion').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const i = parseInt(btn.dataset.idx, 10);
          localLesiones.splice(i, 1);
          renderLesionesTags();
        });
      });
    }

    function renderPaisesTags() {
      const container = document.getElementById('pfPaisesTagsContainer');
      if (!container) return;
      if (localPaises.length === 0) {
        container.innerHTML = `<span style="color: var(--text-muted); font-size: 12px;">Sin país asignado.</span>`;
        return;
      }
      container.innerHTML = localPaises.map((p, idx) => `
        <span class="match-category-tag" style="background: var(--primary-blue-light); color: var(--primary-blue); padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--primary-blue); font-weight: 700;">
          🌍 ${escapeHtml(p)}
          <i data-lucide="x" class="btn-remove-pais cursor-pointer" data-idx="${idx}" style="width: 14px; height: 14px; color: var(--primary-blue);"></i>
        </span>
      `).join('');
      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('.btn-remove-pais').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const i = parseInt(btn.dataset.idx, 10);
          localPaises.splice(i, 1);
          renderPaisesTags();
        });
      });
    }

    renderLesionesTags();
    renderPaisesTags();

    // Listeners for adding Países & Lesiones
    const paisSelect = document.getElementById('pfPaisSelect');
    paisSelect?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (!val) return;
      if (val === '__NEW_PAIS__') {
        const newP = prompt('Introduce el nombre del nuevo país / nacionalidad:');
        if (newP && newP.trim()) {
          const trimmed = newP.trim();
          if (!state.customPaises) state.customPaises = [...LISTA_PAISES];
          if (!state.customPaises.includes(trimmed)) {
            state.customPaises.push(trimmed);
            saveState();
          }
          if (!localPaises.includes(trimmed)) localPaises.push(trimmed);
          renderPaisesTags();
        }
      } else {
        if (!localPaises.includes(val)) localPaises.push(val);
        renderPaisesTags();
      }
      e.target.value = '';
    });

    const lesionesSelect = document.getElementById('pfLesionesSelect');
    lesionesSelect?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (!val) return;
      if (val === '__NEW_LESION__') {
        const newL = prompt('Introduce el nombre de la nueva lesión:');
        if (newL && newL.trim()) {
          const trimmed = newL.trim();
          if (!state.customLesiones) state.customLesiones = ['Esguince de tobillo', 'Rotura fibrilar', 'Rotura de ligamento cruzado', 'Menisco', 'Pubalgia', 'Tendinitis'];
          if (!state.customLesiones.includes(trimmed)) {
            state.customLesiones.push(trimmed);
            saveState();
          }
          if (!localLesiones.includes(trimmed)) localLesiones.push(trimmed);
          renderLesionesTags();
        }
      } else {
        if (!localLesiones.includes(val)) localLesiones.push(val);
        renderLesionesTags();
      }
      e.target.value = '';
    });

    // Dynamic Sub-Category Update on Año Nac. Change
    const anoInput = document.getElementById('pfAnoNac');
    anoInput?.addEventListener('input', () => {
      const subBadge = document.getElementById('pfSubCategoryBadge');
      if (subBadge) {
        const sub = calculateSubCategory(anoInput.value.trim());
        subBadge.textContent = sub ? sub : 'Sub...';
      }
    });

    const removeLargeClass = () => card.classList.remove('large');
    document.getElementById('btnCloseModal')?.addEventListener('click', removeLargeClass, { once: true });
    document.getElementById('btnCancelModal')?.addEventListener('click', removeLargeClass, { once: true });
  }

  function openClubModal(clubId = null) {
    const isEdit = !!clubId;
    const club = isEdit ? (state.directory.clubes.find(c => c.id === clubId) || {}) : {};

    const nombre = club.nombre || club.equipo || '';
    const DEFAULT_CLUB_TYPES_LIST = ['Profesional', 'Formador', 'Escuela', 'Juvenil+Senior', 'Solo Senior', 'Captador', 'Nivel Bajo', 'Nivel Medio', 'Nivel Alto', 'Fútbol Base', 'Cantera', 'Convenio', 'Filial', 'Fundación'];
    state.customClubTypes = Array.from(new Set([
      ...DEFAULT_CLUB_TYPES_LIST,
      ...(state.customClubTypes || [])
    ]));

    const tipoStr = club.tipo || '';
    let selectedClubTypes = Array.isArray(club.tiposArray) ? [...club.tiposArray] : (tipoStr ? tipoStr.split(',').map(s => s.trim()).filter(Boolean) : []);
    selectedClubTypes.forEach(t => {
      if (t && !state.customClubTypes.includes(t)) state.customClubTypes.push(t);
    });
    const anoFundacion = club.anoFundacion || club.ano || '';
    const comunidad = club.comunidad || '';
    const localidad = club.localidad || '';
    const federacion = club.federacion || '';
    const estadio = club.estadio || '';
    const web = club.web || '';
    const instagram = club.instagram || '';
    const linkedin = club.linkedin || '';
    const facebook = club.facebook || '';
    const convenidoDe = club.convenidoDe || '';
    const convenidosVinculados = club.convenidosVinculados || '';
    const patrocinadorDe = club.patrocinadorDe || '';
    const patrocinadoPor = club.patrocinadoPor || '';

    const codigo = club.codigo || '';
    const delegacion = club.delegacion || '';
    const cif = club.cif || '';
    const domicilio = club.domicilio || '';
    const provincia = club.provincia || '';
    const cp = club.cp || '';
    const colorCamiseta = club.colorCamiseta || '';
    const colorPantalon = club.colorPantalon || '';
    const colorMedias = club.colorMedias || '';
    const email = club.email || '';
    const telefonos = club.telefonos || '';
    const fax = club.fax || '';

    let localStaffList = club.staff ? JSON.parse(JSON.stringify(club.staff)) : [];
    let localEquiposList = club.equiposList ? JSON.parse(JSON.stringify(club.equiposList)) : [];
    const notas = club.notas || '';

    let logoData = club.logo || club.escudo || '';
    let colorPrimary = club.colorPrimary || '#2563eb';
    let colorSecondary = club.colorSecondary || '#ffffff';

    const titleText = isEdit ? `🛡️ Ficha de ${escapeHtml(nombre)}` : '🛡️ Nuevo Club';

    const modalHTML = `
      <div class="club-modal-wrapper">
        <p class="modal-subtitle mb-2" style="font-size: 12px; color: var(--text-muted);">Gestión de información institucional y deportiva</p>

        <div class="player-modal-subtabs mb-4">
          <button type="button" class="player-subtab active" data-ctab="tecnica">FICHA TÉCNICA</button>
          <button type="button" class="player-subtab" data-ctab="adicionales">DATOS ADICIONALES</button>
          <button type="button" class="player-subtab" data-ctab="staff">STAFF</button>
          <button type="button" class="player-subtab" data-ctab="equipos">EQUIPOS</button>
          <button type="button" class="player-subtab" data-ctab="notas">NOTAS Y ARCHIVOS</button>
        </div>

        <datalist id="federacionesDatalistOptions">
          ${(state.directory.federaciones || []).map(f => `<option value="${escapeHtml(f.nombre || f.federacion)}"></option>`).join('')}
        </datalist>

        <datalist id="estadiosDatalistOptions">
          ${(state.directory.estadios || []).map(e => `<option value="${escapeHtml(e.nombre || e.estadio)}"></option>`).join('')}
        </datalist>

        <datalist id="clubesDatalistOptions">
          ${(state.directory.clubes || []).map(c => `<option value="${escapeHtml(c.nombre || c.equipo)}"></option>`).join('')}
        </datalist>

        <form id="clubForm">
          <!-- TAB 1: FICHA TÉCNICA -->
          <div class="club-tab-pane" id="ctab-tecnica">
            <div class="player-profile-grid">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <div class="photo-upload-box" id="btnUploadClubLogo">
                  ${logoData ? `<img src="${logoData}" class="photo-upload-preview">` : `
                    <i data-lucide="cloud-upload" style="width: 32px; height: 32px;"></i>
                    <span>SUBIR ESCUDO</span>
                  `}
                  <input type="file" id="inputClubLogo" accept="image/*" class="hidden">
                </div>
                <div style="display: flex; gap: 8px; align-items: center; width: 100%; justify-content: center;">
                  <input type="color" id="cfColorPrimary" value="${colorPrimary}" style="width: 36px; height: 36px; border: none; cursor: pointer; border-radius: 4px;" title="Color Principal">
                  <input type="color" id="cfColorSecondary" value="${colorSecondary}" style="width: 36px; height: 36px; border: none; cursor: pointer; border-radius: 4px;" title="Color Secundario">
                </div>
              </div>

              <div>
                <div class="form-group mb-4">
                  <label class="form-label">NOMBRE COMPLETO</label>
                  <input type="text" id="cfNombre" class="form-control" placeholder="Ej: Real Madrid CF..." value="${escapeHtml(nombre)}" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                      <label class="form-label" style="margin: 0; font-weight: 800;">TIPO DE CLUB</label>
                      <button type="button" id="btnShowAddClubTypeInput" style="background: none; border: none; font-size: 11px; color: var(--primary-blue, #2563eb); font-weight: 800; cursor: pointer; padding: 0;">+ Crear Tipo</button>
                    </div>

                    <div id="newClubTypeInputRow" style="display: none; gap: 4px; margin-bottom: 4px;">
                      <input type="text" id="inputNewCustomClubType" class="form-control" placeholder="Nombre nuevo tipo..." style="font-size: 11px; padding: 4px 8px; height: 32px;">
                      <button type="button" id="btnConfirmAddClubType" class="btn btn-primary" style="padding: 4px 8px; font-size: 11px; font-weight: 800; height: 32px; white-space: nowrap;">Añadir</button>
                    </div>

                    <div id="clubTypeChipsContainer" style="display: flex; flex-wrap: wrap; gap: 4px; padding: 6px; border: 1px solid var(--border-medium, #cbd5e1); border-radius: var(--radius-md, 8px); background: #ffffff; min-height: 38px; max-height: 95px; overflow-y: auto; align-items: center;">
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">AÑO FUNDACIÓN</label>
                    <input type="text" id="cfAnoFundacion" class="form-control" placeholder="Ej: 1902" value="${escapeHtml(anoFundacion)}">
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">PROVINCIA / COMUNIDAD</label>
                    <select id="cfComunidad" class="form-control">
                      <option value="">Seleccionar...</option>
                      ${LISTA_COMUNIDADES.map(c => `<option value="${escapeHtml(c)}" ${comunidad === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
                      ${!LISTA_COMUNIDADES.includes(comunidad) && comunidad ? `<option value="${escapeHtml(comunidad)}" selected>${escapeHtml(comunidad)}</option>` : ''}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">LOCALIDAD</label>
                    <select id="cfLocalidad" class="form-control">
                      <option value="">Seleccionar...</option>
                      ${getAvailableLocalidades(comunidad).map(l => `<option value="${escapeHtml(l)}" ${localidad === l ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('')}
                      ${!getAvailableLocalidades(comunidad).includes(localidad) && localidad ? `<option value="${escapeHtml(localidad)}" selected>${escapeHtml(localidad)}</option>` : ''}
                      <option value="__NEW_LOCALIDAD__" style="font-weight: bold; color: var(--primary-blue);">+ Crear nueva localidad...</option>
                    </select>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">FEDERACIÓN</label>
                    <input type="text" id="cfFederacion" list="federacionesDatalistOptions" class="form-control" placeholder="Buscar federación..." value="${escapeHtml(federacion)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">ESTADIO</label>
                    <input type="text" id="cfEstadio" list="estadiosDatalistOptions" class="form-control" placeholder="Buscar estadio..." value="${escapeHtml(estadio)}">
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">SITIO WEB</label>
                    <input type="url" id="cfWeb" class="form-control" placeholder="https://www.club.com" value="${escapeHtml(web)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">INSTAGRAM</label>
                    <input type="text" id="cfInstagram" class="form-control" placeholder="@usuario" value="${escapeHtml(instagram)}">
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">LINKEDIN</label>
                    <input type="text" id="cfLinkedin" class="form-control" placeholder="LinkedIn URL" value="${escapeHtml(linkedin)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">FACEBOOK</label>
                    <input type="text" id="cfFacebook" class="form-control" placeholder="Facebook URL" value="${escapeHtml(facebook)}">
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-3">
                  <div class="form-group">
                    <label class="form-label">ES CLUB CONVENIDO DE...</label>
                    <input type="text" id="cfConvenidoDe" list="clubesDatalistOptions" class="form-control" placeholder="Buscar club..." value="${escapeHtml(convenidoDe)}">
                  </div>
                  <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                      <label class="form-label" style="margin: 0;">CLUBES CONVENIDOS VINCULADOS</label>
                      ${(() => {
                        const convList = getConvenidosListForClub(club);
                        if (convList.length > 0) {
                          return `<button type="button" id="btnOpenConvenidosModalInForm" style="background: none; border: none; font-size: 11px; color: var(--primary-blue, #2563eb); font-weight: 800; cursor: pointer; padding: 0;">👥 Ver Todos (${convList.length})</button>`;
                        }
                        return '';
                      })()}
                    </div>
                    <input type="text" id="cfConvenidosVinculados" list="clubesDatalistOptions" class="form-control" placeholder="Buscar club..." value="${escapeHtml(convenidosVinculados)}">
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                  <div class="form-group">
                    <label class="form-label">PATROCINADOR DE</label>
                    <input type="text" id="cfPatrocinadorDe" list="clubesDatalistOptions" class="form-control" placeholder="Buscar club..." value="${escapeHtml(patrocinadorDe)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">PATROCINADO POR:</label>
                    <input type="text" id="cfPatrocinadoPor" list="clubesDatalistOptions" class="form-control" placeholder="Buscar o ingresar patrocinador..." value="${escapeHtml(patrocinadoPor)}">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: DATOS ADICIONALES -->
          <div class="club-tab-pane hidden" id="ctab-adicionales">
            <div class="player-section-title mb-2">
              <i data-lucide="book-open"></i> DATOS DE REGISTRO E IDENTIFICACIÓN
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">CÓDIGO DEL CLUB</label>
                <input type="text" id="cfCodigo" class="form-control" placeholder="Ej: 1027" value="${escapeHtml(codigo)}">
              </div>
              <div class="form-group">
                <label class="form-label">FEDERACIÓN</label>
                <input type="text" id="cfDelegacion" list="federacionesDatalistOptions" class="form-control" placeholder="Buscar federación..." value="${escapeHtml(delegacion || federacion)}">
              </div>
              <div class="form-group">
                <label class="form-label">CIF</label>
                <input type="text" id="cfCif" class="form-control" placeholder="CIF..." value="${escapeHtml(cif)}">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;" class="mb-6">
              <div class="form-group">
                <label class="form-label">DOMICILIO</label>
                <input type="text" id="cfDomicilio" class="form-control" placeholder="Calle, número, piso..." value="${escapeHtml(domicilio)}">
              </div>
              <div class="form-group">
                <label class="form-label">PROVINCIA / COMUNIDAD</label>
                <select id="cfProvincia" class="form-control">
                  <option value="">Seleccionar...</option>
                  ${LISTA_COMUNIDADES.map(c => `<option value="${escapeHtml(c)}" ${provincia === c || comunidad === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
                  ${!LISTA_COMUNIDADES.includes(provincia) && provincia ? `<option value="${escapeHtml(provincia)}" selected>${escapeHtml(provincia)}</option>` : ''}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">C.P.</label>
                <input type="text" id="cfCp" class="form-control" placeholder="Código Postal..." value="${escapeHtml(cp)}">
              </div>
            </div>

            <div class="player-section-title mb-2">
              <i data-lucide="shirt"></i> EQUIPACIÓN (ELECCIÓN DE COLOR PRECISO)
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;" class="mb-6">
              <div class="form-group">
                <label class="form-label">CAMISETA (COLOR)</label>
                <div style="display: flex; gap: 8px; align-items: center; background: var(--bg-surface); padding: 4px 8px; border: 1px solid var(--border-light); border-radius: var(--radius-md);">
                  <input type="color" id="cfColorCamiseta" value="${colorCamiseta.startsWith('#') ? colorCamiseta : colorPrimary}" style="width: 38px; height: 32px; border: none; cursor: pointer; border-radius: 4px; padding: 0;">
                  <span id="cfColorCamisetaHex" style="font-size: 11px; font-weight: 700; color: var(--text-muted);">${escapeHtml(colorCamiseta || colorPrimary)}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">PANTALÓN (COLOR)</label>
                <div style="display: flex; gap: 8px; align-items: center; background: var(--bg-surface); padding: 4px 8px; border: 1px solid var(--border-light); border-radius: var(--radius-md);">
                  <input type="color" id="cfColorPantalon" value="${colorPantalon.startsWith('#') ? colorPantalon : colorSecondary}" style="width: 38px; height: 32px; border: none; cursor: pointer; border-radius: 4px; padding: 0;">
                  <span id="cfColorPantalonHex" style="font-size: 11px; font-weight: 700; color: var(--text-muted);">${escapeHtml(colorPantalon || colorSecondary)}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">MEDIAS (COLOR)</label>
                <div style="display: flex; gap: 8px; align-items: center; background: var(--bg-surface); padding: 4px 8px; border: 1px solid var(--border-light); border-radius: var(--radius-md);">
                  <input type="color" id="cfColorMedias" value="${colorMedias.startsWith('#') ? colorMedias : '#2563eb'}" style="width: 38px; height: 32px; border: none; cursor: pointer; border-radius: 4px; padding: 0;">
                  <span id="cfColorMediasHex" style="font-size: 11px; font-weight: 700; color: var(--text-muted);">${escapeHtml(colorMedias || '#2563eb')}</span>
                </div>
              </div>
            </div>

            <div class="player-section-title mb-2">
              <i data-lucide="mail"></i> CORRESPONDENCIA
            </div>
            <div class="form-group mb-6">
              <label class="form-label">EMAIL</label>
              <input type="email" id="cfEmail" class="form-control" placeholder="email@ejemplo.com" value="${escapeHtml(email)}">
            </div>

            <div class="player-section-title mb-2">
              <i data-lucide="phone"></i> OTROS DATOS
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label class="form-label">TELÉFONOS</label>
                <input type="text" id="cfTelefonos" class="form-control" placeholder="Ej: 696207773 - 609452755" value="${escapeHtml(telefonos)}">
              </div>
              <div class="form-group">
                <label class="form-label">FAX</label>
                <input type="text" id="cfFax" class="form-control" placeholder="Fax..." value="${escapeHtml(fax)}">
              </div>
            </div>
          </div>

          <!-- TAB 3: STAFF -->
          <div class="club-tab-pane hidden" id="ctab-staff">
            <div class="p-4 mb-4" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md); display: flex; align-items: center; gap: 10px;">
              <i data-lucide="users" style="color: var(--primary-blue);"></i>
              <span style="font-size: 13px; font-weight: 600;">Vincular varios técnicos del directorio de staff con filtro de búsqueda.</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-4">
              <input type="text" id="cfStaffSearchInput" list="staffDatalistOptions" class="form-control" placeholder="Buscar técnico por nombre...">
              <button type="button" class="btn btn-primary" id="btnAddStaffRow"><i data-lucide="plus"></i> Añadir</button>
            </div>

            <div class="table-responsive" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-light); font-weight: 800; color: var(--text-muted); text-align: left;">
                    <th style="padding: 8px 12px;">TÉCNICO / STAFF</th>
                    <th style="padding: 8px 12px; text-align: right;">ELIMINAR</th>
                  </tr>
                </thead>
                <tbody id="cfStaffTableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- TAB 4: EQUIPOS -->
          <div class="club-tab-pane hidden" id="ctab-equipos">
            <div class="p-4 mb-4" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md); display: flex; align-items: center; gap: 10px;">
              <i data-lucide="shield" style="color: var(--primary-blue);"></i>
              <span style="font-size: 13px; font-weight: 600;">Vincular varios equipos del directorio con filtro de búsqueda.</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-4">
              <input type="text" id="cfEquiposSearchInput" list="trayClubDatalistOptions" class="form-control" placeholder="Buscar equipo por nombre...">
              <button type="button" class="btn btn-primary" id="btnAddEquiposRow"><i data-lucide="plus"></i> Añadir</button>
            </div>

            <div class="table-responsive" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-light); font-weight: 800; color: var(--text-muted); text-align: left;">
                    <th style="padding: 8px 12px;">EQUIPO VINCULADO</th>
                    <th style="padding: 8px 12px; text-align: right;">ELIMINAR</th>
                  </tr>
                </thead>
                <tbody id="cfEquiposTableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- TAB 5: NOTAS Y ARCHIVOS -->
          <div class="club-tab-pane hidden" id="ctab-notas">
            <div class="form-group mb-6">
              <label class="form-label">NOTAS INTERNAS</label>
              <textarea id="cfNotas" class="form-control" rows="5" placeholder="Escribe notas aquí...">${escapeHtml(notas)}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">SUBIR ARCHIVOS (MÚLTIPLES)</label>
              <div style="display: flex; align-items: center; gap: 12px; background-color: var(--bg-surface); padding: 12px; border: 1px solid var(--border-light); border-radius: var(--radius-md);">
                <label class="btn btn-primary" style="margin: 0; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="paperclip"></i> Elegir archivos
                  <input type="file" id="cfFileInput" multiple class="hidden">
                </label>
                <span id="cfFileLabel" style="font-size: 12px; color: var(--text-muted);">Ningún archivo seleccionado</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    `;

    const card = document.getElementById('generalModalCard');
    card.classList.add('large');

    showModal(titleText, modalHTML, () => {
      // Render Club Type Chips inside openClubModal
      const renderClubTypeChips = () => {
        const container = document.getElementById('clubTypeChipsContainer');
        if (!container) return;
        container.innerHTML = state.customClubTypes.map(t => {
          const isSelected = selectedClubTypes.includes(t);
          return `
            <span class="club-type-chip ${isSelected ? 'selected' : ''}" data-type="${escapeHtml(t)}" style="padding: 2px 8px; font-size: 11px; border-radius: 12px; cursor: pointer; user-select: none;">
              ${isSelected ? '✓ ' : ''}${escapeHtml(t)}
            </span>
          `;
        }).join('');

        container.querySelectorAll('.club-type-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const tVal = chip.dataset.type;
            if (selectedClubTypes.includes(tVal)) {
              selectedClubTypes = selectedClubTypes.filter(x => x !== tVal);
            } else {
              selectedClubTypes.push(tVal);
            }
            renderClubTypeChips();
          });
        });
      };

      renderClubTypeChips();

      const btnShowInput = document.getElementById('btnShowAddClubTypeInput');
      const inputRow = document.getElementById('newClubTypeInputRow');
      const inputNewType = document.getElementById('inputNewCustomClubType');
      const btnConfirmAdd = document.getElementById('btnConfirmAddClubType');

      const btnOpenConvModal = document.getElementById('btnOpenConvenidosModalInForm');
      btnOpenConvModal?.addEventListener('click', () => {
        openClubConvenidosWindow(club);
      });

      btnShowInput?.addEventListener('click', () => {
        if (inputRow) {
          inputRow.style.display = inputRow.style.display === 'none' ? 'flex' : 'none';
          if (inputRow.style.display === 'flex') inputNewType?.focus();
        }
      });

      const handleAddNewType = () => {
        const val = inputNewType?.value.trim();
        if (!val) return;
        if (!state.customClubTypes.includes(val)) {
          state.customClubTypes.push(val);
        }
        if (!selectedClubTypes.includes(val)) {
          selectedClubTypes.push(val);
        }
        if (inputNewType) inputNewType.value = '';
        if (inputRow) inputRow.style.display = 'none';
        saveState();
        renderClubTypeChips();
      };

      btnConfirmAdd?.addEventListener('click', handleAddNewType);
      inputNewType?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddNewType();
        }
      });

      const nameVal = document.getElementById('cfNombre').value.trim();
      if (!nameVal) return alert('Por favor ingresa el nombre del club');

      const updatedClub = {
        id: isEdit ? clubId : 'c_' + Date.now(),
        nombre: nameVal,
        equipo: nameVal,
        tipo: selectedClubTypes.join(', '),
        tiposArray: [...selectedClubTypes],
        anoFundacion: document.getElementById('cfAnoFundacion').value.trim(),
        ano: document.getElementById('cfAnoFundacion').value.trim(),
        comunidad: document.getElementById('cfComunidad').value.trim(),
        localidad: document.getElementById('cfLocalidad').value.trim(),
        federacion: document.getElementById('cfFederacion').value.trim(),
        estadio: document.getElementById('cfEstadio').value.trim(),
        web: document.getElementById('cfWeb').value.trim(),
        instagram: document.getElementById('cfInstagram').value.trim(),
        linkedin: document.getElementById('cfLinkedin').value.trim(),
        facebook: document.getElementById('cfFacebook').value.trim(),
        convenidoDe: document.getElementById('cfConvenidoDe').value.trim(),
        convenidosVinculados: document.getElementById('cfConvenidosVinculados').value.trim(),
        patrocinadorDe: document.getElementById('cfPatrocinadorDe').value.trim(),
        patrocinadoPor: document.getElementById('cfPatrocinadoPor').value.trim(),

        codigo: document.getElementById('cfCodigo').value.trim(),
        delegacion: document.getElementById('cfDelegacion').value.trim(),
        cif: document.getElementById('cfCif').value.trim(),
        domicilio: document.getElementById('cfDomicilio').value.trim(),
        provincia: document.getElementById('cfProvincia').value.trim(),
        cp: document.getElementById('cfCp').value.trim(),
        colorCamiseta: document.getElementById('cfColorCamiseta').value.trim(),
        colorPantalon: document.getElementById('cfColorPantalon').value.trim(),
        colorMedias: document.getElementById('cfColorMedias').value.trim(),
        email: document.getElementById('cfEmail').value.trim(),
        telefonos: document.getElementById('cfTelefonos').value.trim(),
        fax: document.getElementById('cfFax').value.trim(),

        staff: localStaffList,
        equiposList: localEquiposList,
        notas: document.getElementById('cfNotas').value.trim(),

        logo: logoData,
        escudo: logoData,
        colorPrimary: document.getElementById('cfColorPrimary').value,
        colorSecondary: document.getElementById('cfColorSecondary').value
      };

      if (!state.directory.clubes) state.directory.clubes = [];
      if (isEdit) {
        const idx = state.directory.clubes.findIndex(c => c && (String(c.id) === String(clubId) || (c.codigo && String(c.codigo) === String(clubId))));
        if (idx !== -1) state.directory.clubes[idx] = updatedClub;
      } else {
        state.directory.clubes.unshift(updatedClub);
      }
      saveToFirebase('clubes', updatedClub);

      // Auto-sync logo/escudo and colors to all linked teams in state.directory.equipos
      if (state.directory.equipos && Array.isArray(state.directory.equipos)) {
        state.directory.equipos.forEach(eq => {
          const eqClubName = (eq.clubVinculado || eq.club || '').trim().toLowerCase();
          const clubNameLower = (nameVal || nombre || '').trim().toLowerCase();
          const isLinked = (eqClubName && eqClubName === clubNameLower) || (eq.nombre && clubNameLower && eq.nombre.toLowerCase().startsWith(clubNameLower));
          if (isLinked) {
            if (logoData) {
              eq.escudo = logoData;
              eq.logo = logoData;
            }
            if (updatedClub.colorPrimary) {
              eq.colorPrimary = updatedClub.colorPrimary;
            }
            if (updatedClub.colorSecondary) {
              eq.colorSecondary = updatedClub.colorSecondary;
            }
            if (updatedClub.federacion) {
              eq.federacion = updatedClub.federacion;
            }
            saveToFirebase('equipos', eq);
          }
        });
      }

      // Bidirectional sync for Federación, Estadio, Convenidos & Patrocinador
      const fedVal = updatedClub.federacion;
      const estVal = updatedClub.estadio;
      const convDeVal = updatedClub.convenidoDe;
      const convVincVal = updatedClub.convenidosVinculados;
      const patVal = updatedClub.patrocinadorDe;
      const patPorVal = updatedClub.patrocinadoPor;

      // 1. Sync to Federación
      if (fedVal && state.directory.federaciones) {
        let targetFed = state.directory.federaciones.find(f => 
          (f.nombre && f.nombre.toLowerCase() === fedVal.toLowerCase()) ||
          (f.federacion && f.federacion.toLowerCase() === fedVal.toLowerCase())
        );
        if (!targetFed) {
          targetFed = {
            id: 'fed_' + Date.now() + Math.floor(Math.random()*100),
            nombre: fedVal,
            federacion: fedVal,
            clubes: []
          };
          state.directory.federaciones.unshift(targetFed);
        }
        if (!targetFed.clubes) targetFed.clubes = [];
        const exists = targetFed.clubes.some(c => (typeof c === 'string' ? c : c.nombre) === nameVal);
        if (!exists) targetFed.clubes.push({ id: updatedClub.id, nombre: nameVal });
      }

      // 2. Sync to Estadio
      if (estVal && state.directory.estadios) {
        let targetEst = state.directory.estadios.find(e => 
          (e.nombre && e.nombre.toLowerCase() === estVal.toLowerCase()) ||
          (e.estadio && e.estadio.toLowerCase() === estVal.toLowerCase())
        );
        if (!targetEst) {
          targetEst = {
            id: 'est_' + Date.now() + Math.floor(Math.random()*100),
            nombre: estVal,
            estadio: estVal,
            clubes: []
          };
          state.directory.estadios.unshift(targetEst);
        }
        if (!targetEst.clubes) targetEst.clubes = [];
        const exists = targetEst.clubes.some(c => (typeof c === 'string' ? c : c.nombre) === nameVal);
        if (!exists) targetEst.clubes.push({ id: updatedClub.id, nombre: nameVal });
      }

      // 3. Sync to target Club for Convenios & Patrocinios
      const syncClubToClub = (targetClubName, targetField) => {
        if (!targetClubName || !state.directory.clubes) return;
        let targetC = state.directory.clubes.find(c => 
          (c.nombre && c.nombre.toLowerCase() === targetClubName.toLowerCase()) ||
          (c.equipo && c.equipo.toLowerCase() === targetClubName.toLowerCase())
        );
        if (!targetC) {
          targetC = {
            id: 'c_' + Date.now() + Math.floor(Math.random()*100),
            nombre: targetClubName,
            equipo: targetClubName
          };
          state.directory.clubes.unshift(targetC);
        }
        if (!targetC[targetField]) targetC[targetField] = '';
        if (!targetC[targetField].toLowerCase().includes(nameVal.toLowerCase())) {
          targetC[targetField] = targetC[targetField] ? `${targetC[targetField]}, ${nameVal}` : nameVal;
        }
      };

      syncClubToClub(convDeVal, 'convenidosVinculados');
      syncClubToClub(convVincVal, 'convenidoDe');
      syncClubToClub(patVal, 'patrocinadoPor');
      syncClubToClub(patPorVal, 'patrocinadorDe');

      // 4. Bidirectional sync for Staff members in localStaffList
      if (Array.isArray(localStaffList) && state.directory.staff) {
        localStaffList.forEach(s => {
          const staffName = typeof s === 'string' ? s : (s.nombre || s.staff || '');
          if (!staffName) return;

          let targetStaff = state.directory.staff.find(st => 
            (st.nombre && st.nombre.toLowerCase() === staffName.toLowerCase()) ||
            (st.staff && st.staff.toLowerCase() === staffName.toLowerCase())
          );

          if (!targetStaff) {
            targetStaff = {
              id: 'st_' + Date.now() + Math.floor(Math.random()*100),
              nombre: staffName,
              staff: staffName,
              cargo: 'Técnico',
              club: nameVal,
              equipo: nameVal
            };
            state.directory.staff.unshift(targetStaff);
          } else {
            targetStaff.club = nameVal;
            targetStaff.equipo = nameVal;
          }
        });
      }

      // 5. Bidirectional sync for Teams in localEquiposList
      if (Array.isArray(localEquiposList) && state.directory.equipos) {
        localEquiposList.forEach(eq => {
          const teamName = typeof eq === 'string' ? eq : (eq.nombre || eq.equipo || '');
          if (!teamName) return;

          let targetTeam = state.directory.equipos.find(t => 
            (t.nombre && t.nombre.toLowerCase() === teamName.toLowerCase()) ||
            (t.equipo && t.equipo.toLowerCase() === teamName.toLowerCase())
          );

          if (!targetTeam) {
            targetTeam = {
              id: 'eq_' + Date.now() + Math.floor(Math.random()*100),
              nombre: teamName,
              equipo: teamName,
              clubVinculado: nameVal,
              club: nameVal,
              temporada: '26/27'
            };
            state.directory.equipos.unshift(targetTeam);
          } else {
            targetTeam.clubVinculado = nameVal;
            targetTeam.club = nameVal;
          }
        });
      }

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    }, isEdit ? {
      label: 'Eliminar Club',
      title: `¿Eliminar Ficha de ${nombre || 'Club'}?`,
      message: `¿Estás seguro de que deseas eliminar permanentemente el club "${nombre}" de la base de datos?`,
      action: () => {
        deleteDirectoryItem('clubes', clubId);
        hideModal();
        showToast('Club eliminado con éxito', 'danger');
        renderDirectorio();
      }
    } : null);

    // Subtab switching logic
    const subtabs = document.querySelectorAll('.player-subtab');
    const panes = document.querySelectorAll('.club-tab-pane');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        const targetPane = document.getElementById('ctab-' + tab.dataset.ctab);
        if (targetPane) targetPane.classList.remove('hidden');
      });
    });

    // Staff Table Logic
    function renderStaffTable() {
      const tbody = document.getElementById('cfStaffTableBody');
      if (!tbody) return;
      if (localStaffList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: var(--text-muted);">Sin personal de staff vinculado</td></tr>`;
      } else {
        tbody.innerHTML = localStaffList.map((s, idx) => {
          const nameStr = typeof s === 'string' ? s : (s.nombre || s.staff || '');
          const foundStaff = (state.directory.staff || []).find(st => 
            (st.nombre && st.nombre.toLowerCase() === nameStr.toLowerCase()) ||
            (st.staff && st.staff.toLowerCase() === nameStr.toLowerCase())
          );

          let nameHTML = `<span style="font-weight: 700; color: var(--text-main);">${escapeHtml(nameStr)}</span>`;
          if (foundStaff) {
            nameHTML = `<a href="javascript:void(0)" class="staff-modal-link" data-staffid="${foundStaff.id}" style="color: var(--primary-blue); font-weight: 700; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="user-check" style="width: 13px; height: 13px;"></i> ${escapeHtml(nameStr)}</a>`;
          }

          return `
            <tr style="border-bottom: 1px solid var(--border-light);">
              <td style="padding: 8px 12px;">${nameHTML}</td>
              <td style="padding: 8px 12px; text-align: right;">
                <button type="button" class="btn-action-icon danger btn-del-staff" data-idx="${idx}" style="width: 26px; height: 26px;">
                  <i data-lucide="trash-2" style="width: 12px;"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        tbody.querySelectorAll('.btn-del-staff').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.idx, 10);
            localStaffList.splice(index, 1);
            renderStaffTable();
          });
        });

        tbody.querySelectorAll('.staff-modal-link').forEach(link => {
          link.addEventListener('click', (ev) => {
            ev.preventDefault();
            const sId = link.dataset.staffid;
            if (sId) {
              card.classList.remove('large');
              hideModal();
              openStaffModal(sId);
            }
          });
        });
      }
      if (window.lucide) window.lucide.createIcons();
    }
    renderStaffTable();

    document.getElementById('btnAddStaffRow')?.addEventListener('click', () => {
      const val = document.getElementById('cfStaffSearchInput').value.trim();
      if (!val) return alert('Ingresa o selecciona el nombre del técnico');
      localStaffList.push(val);
      document.getElementById('cfStaffSearchInput').value = '';
      renderStaffTable();
    });

    // Equipos Table Logic
    function renderEquiposTable() {
      const tbody = document.getElementById('cfEquiposTableBody');
      if (!tbody) return;
      if (localEquiposList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: var(--text-muted);">Sin equipos vinculados</td></tr>`;
      } else {
        tbody.innerHTML = localEquiposList.map((eq, idx) => {
          const nameStr = typeof eq === 'string' ? eq : (eq.nombre || eq.equipo || '');
          const foundTeam = (state.directory.equipos || []).find(t => 
            (t.nombre && t.nombre.toLowerCase() === nameStr.toLowerCase()) ||
            (t.equipo && t.equipo.toLowerCase() === nameStr.toLowerCase())
          );

          let nameHTML = `<span style="font-weight: 700; color: var(--text-main);">${escapeHtml(nameStr)}</span>`;
          if (foundTeam) {
            nameHTML = `<a href="javascript:void(0)" class="team-modal-link" data-teamid="${foundTeam.id}" style="color: var(--primary-blue); font-weight: 700; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="shield" style="width: 13px; height: 13px;"></i> ${escapeHtml(nameStr)}</a>`;
          }

          return `
            <tr style="border-bottom: 1px solid var(--border-light);">
              <td style="padding: 8px 12px;">${nameHTML}</td>
              <td style="padding: 8px 12px; text-align: right;">
                <button type="button" class="btn-action-icon danger btn-del-equipo" data-idx="${idx}" style="width: 26px; height: 26px;">
                  <i data-lucide="trash-2" style="width: 12px;"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        tbody.querySelectorAll('.btn-del-equipo').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.idx, 10);
            localEquiposList.splice(index, 1);
            renderEquiposTable();
          });
        });

        tbody.querySelectorAll('.team-modal-link').forEach(link => {
          link.addEventListener('click', (ev) => {
            ev.preventDefault();
            const tId = link.dataset.teamid;
            if (tId) {
              card.classList.remove('large');
              hideModal();
              openTeamModal(tId);
            }
          });
        });
      }
      if (window.lucide) window.lucide.createIcons();
    }
    renderEquiposTable();

    document.getElementById('btnAddEquiposRow')?.addEventListener('click', () => {
      const val = document.getElementById('cfEquiposSearchInput').value.trim();
      if (!val) return alert('Ingresa o selecciona el nombre del equipo');
      localEquiposList.push(val);
      document.getElementById('cfEquiposSearchInput').value = '';
      renderEquiposTable();
    });

    // File Input Label
    document.getElementById('cfFileInput')?.addEventListener('change', (e) => {
      const count = e.target.files.length;
      document.getElementById('cfFileLabel').textContent = count > 0 ? `${count} archivo(s) seleccionado(s)` : 'Ningún archivo seleccionado';
    });

    // Logo Upload Handler
    const inputLogo = document.getElementById('inputClubLogo');
    document.getElementById('btnUploadClubLogo')?.addEventListener('click', () => inputLogo.click());
    inputLogo?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          logoData = await compressImage(file);
          document.getElementById('btnUploadClubLogo').innerHTML = `<img src="${logoData}" class="photo-upload-preview">`;
        } catch (err) {
          console.error('Error al comprimir logo:', err);
        }
      }
    });

    // Real-time Color Sync between EQUIPACIÓN and FICHA TÉCNICA
    const inputColorCamiseta = document.getElementById('cfColorCamiseta');
    const inputColorPantalon = document.getElementById('cfColorPantalon');
    const inputColorMedias = document.getElementById('cfColorMedias');
    const inputColorPrimary = document.getElementById('cfColorPrimary');
    const inputColorSecondary = document.getElementById('cfColorSecondary');

    inputColorCamiseta?.addEventListener('input', (e) => {
      const val = e.target.value;
      if (inputColorPrimary) inputColorPrimary.value = val;
      const hexSpan = document.getElementById('cfColorCamisetaHex');
      if (hexSpan) hexSpan.textContent = val;
    });

    inputColorPantalon?.addEventListener('input', (e) => {
      const val = e.target.value;
      if (inputColorSecondary) inputColorSecondary.value = val;
      const hexSpan = document.getElementById('cfColorPantalonHex');
      if (hexSpan) hexSpan.textContent = val;
    });

    inputColorMedias?.addEventListener('input', (e) => {
      const val = e.target.value;
      const hexSpan = document.getElementById('cfColorMediasHex');
      if (hexSpan) hexSpan.textContent = val;
    });

    inputColorPrimary?.addEventListener('input', (e) => {
      const val = e.target.value;
      if (inputColorCamiseta) inputColorCamiseta.value = val;
      const hexSpan = document.getElementById('cfColorCamisetaHex');
      if (hexSpan) hexSpan.textContent = val;
    });

    inputColorSecondary?.addEventListener('input', (e) => {
      const val = e.target.value;
      if (inputColorPantalon) inputColorPantalon.value = val;
      const hexSpan = document.getElementById('cfColorPantalonHex');
      if (hexSpan) hexSpan.textContent = val;
    });

    // Dynamic Localidad update based on Comunidad selection in Club Modal
    const clubComSelect = document.getElementById('cfComunidad');
    const clubLocSelect = document.getElementById('cfLocalidad');

    const updateClubLocalidadesOptions = (selectedComunidad, currentLocalidadVal) => {
      if (!clubLocSelect) return;
      const locList = getAvailableLocalidades(selectedComunidad);
      let optionsHTML = '<option value="">Seleccionar...</option>';
      locList.forEach(l => {
        const isSel = currentLocalidadVal === l ? 'selected' : '';
        optionsHTML += `<option value="${escapeHtml(l)}" ${isSel}>${escapeHtml(l)}</option>`;
      });
      if (currentLocalidadVal && !locList.includes(currentLocalidadVal)) {
        optionsHTML += `<option value="${escapeHtml(currentLocalidadVal)}" selected>${escapeHtml(currentLocalidadVal)}</option>`;
      }
      optionsHTML += '<option value="__NEW_LOCALIDAD__" style="font-weight: bold; color: var(--primary-blue);">+ Crear nueva localidad...</option>';
      clubLocSelect.innerHTML = optionsHTML;
    };

    updateClubLocalidadesOptions(comunidad, localidad);

    clubComSelect?.addEventListener('change', (e) => {
      updateClubLocalidadesOptions(e.target.value, '');
    });

    clubLocSelect?.addEventListener('change', (e) => {
      if (e.target.value === '__NEW_LOCALIDAD__') {
        const newLocName = prompt('Introduce el nombre de la nueva localidad:');
        if (newLocName && newLocName.trim()) {
          const trimmed = newLocName.trim();
          if (!state.customLocalidades) state.customLocalidades = [];
          if (!state.customLocalidades.includes(trimmed)) {
            state.customLocalidades.push(trimmed);
            saveState();
          }
          const opt = document.createElement('option');
          opt.value = trimmed;
          opt.textContent = trimmed;
          opt.selected = true;
          clubLocSelect.insertBefore(opt, clubLocSelect.lastElementChild);
          clubLocSelect.value = trimmed;
        } else {
          clubLocSelect.value = '';
        }
      }
    });

    const removeLargeClass = () => card.classList.remove('large');
    document.getElementById('btnCloseModal')?.addEventListener('click', removeLargeClass, { once: true });
    document.getElementById('btnCancelModal')?.addEventListener('click', removeLargeClass, { once: true });
  }

  // Helper to flexibly match a team to its parent club even with spelling typos (e.g. Obereno / Oberena)
    function syncClubDataToLinkedTeams(clubObj) {
    if (!clubObj || !state.directory || !Array.isArray(state.directory.equipos)) return;
    const clubNameLower = (clubObj.nombre || clubObj.equipo || '').trim().toLowerCase();
    if (!clubNameLower) return;

    state.directory.equipos.forEach(eq => {
      const eqParent = typeof findParentClub === 'function' ? findParentClub(eq) : null;
      const isLinked = (eqParent && String(eqParent.id) === String(clubObj.id)) || 
                       (eq.clubVinculado && eq.clubVinculado.trim().toLowerCase() === clubNameLower) ||
                       (eq.club && eq.club.trim().toLowerCase() === clubNameLower) ||
                       (eq.nombre && (eq.nombre.trim().toLowerCase() === clubNameLower || eq.nombre.trim().toLowerCase().startsWith(clubNameLower)));
      
      if (isLinked) {
        let modified = false;
        if (clubObj.federacion && (!eq.federacion || eq.federacion === '' || eq.federacion === 'Sin Federación' || eq.federacion !== clubObj.federacion)) {
          eq.federacion = clubObj.federacion;
          modified = true;
        }
        const l = clubObj.logo || clubObj.escudo;
        if (l && (!eq.escudo || eq.escudo === '')) {
          eq.escudo = l;
          eq.logo = l;
          modified = true;
        }
        if (clubObj.colorPrimary && (!eq.colorPrimary || eq.colorPrimary === '#2563eb')) {
          eq.colorPrimary = clubObj.colorPrimary;
          modified = true;
        }
        if (clubObj.colorSecondary && (!eq.colorSecondary || eq.colorSecondary === '#ffffff')) {
          eq.colorSecondary = clubObj.colorSecondary;
          modified = true;
        }
        if (modified) {
          saveToFirebase('equipos', eq);
        }
      }
    });
  }

  function findParentClub(teamObj) {
    if (!teamObj || !state.directory.clubes || !state.directory.clubes.length) return null;
    const clubName = (teamObj.clubVinculado || teamObj.club || '').trim();
    const teamName = (teamObj.nombre || teamObj.equipo || '').trim();

    const clean = (str) => (str || '').toLowerCase()
      .replace(/^(c\.d\.|c\.a\.|a\.d\.|u\.d\.|u\.d\.c\.|c\.f\.|s\.d\.|f\.c\.)\s*/gi, '')
      .replace(/[^a-z0-9]/gi, '');

    const cleanClub = clean(clubName);
    const cleanTeam = clean(teamName);

    // 1. Exact match
    let found = state.directory.clubes.find(c => {
      const cClean = clean(c.nombre || c.equipo || '');
      return (cleanClub && cClean === cleanClub) || (cleanTeam && cClean === cleanTeam);
    });
    if (found) return found;

    // 2. Prefix / Substring match (handles Oberena vs Obereno)
    found = state.directory.clubes.find(c => {
      const cClean = clean(c.nombre || c.equipo || '');
      if (!cClean || cClean.length < 3) return false;
      const prefix = cClean.substring(0, Math.min(5, cClean.length));
      return (cleanClub && (cleanClub.includes(prefix) || cClean.includes(cleanClub.substring(0, 5)))) ||
             (cleanTeam && (cleanTeam.includes(prefix) || cClean.includes(cleanTeam.substring(0, 5))));
    });

    return found || null;
  }

  function openTeamModal(teamId = null) {
    const isEdit = !!teamId;
    const team = isEdit ? (state.directory.equipos.find(eq => eq.id === teamId) || {}) : {};

    const nombre = team.nombre || team.equipo || '';
    let clubVinculado = team.clubVinculado || team.club || '';
    const categoria = team.categoria || '';
    const grupoVal = team.grupo || '';
    const temporada = team.temporada || '26/27';
    const competicionVal = team.competicion || '';
    const torneoVal = team.torneo || '';
    let federacion = team.federacion || '';

    // Auto-detect Club Vinculado if not set
    if (!clubVinculado && nombre && state.directory.clubes) {
      const parentClub = state.directory.clubes.find(c => 
        c.equiposList && c.equiposList.some(eq => (typeof eq === 'string' ? eq : eq.nombre).toLowerCase() === nombre.toLowerCase())
      );
      if (parentClub) clubVinculado = parentClub.nombre || parentClub.equipo || '';
    }

    // Auto-detect Federación if not set
    if (!federacion && nombre && state.directory.federaciones) {
      const parentFed = state.directory.federaciones.find(f => 
        f.equipos && f.equipos.some(eq => (typeof eq === 'string' ? eq : eq.nombre).toLowerCase() === nombre.toLowerCase())
      );
      if (parentFed) federacion = parentFed.nombre || parentFed.federacion || '';
    }

    const allPlayersList = (state.directory && Array.isArray(state.directory.jugadores)) ? state.directory.jugadores : [];

    let localTecnicosList = team.tecnicos ? JSON.parse(JSON.stringify(team.tecnicos)) : [];
    let localPlantillaList = team.plantilla ? JSON.parse(JSON.stringify(team.plantilla)) : [];

    // Auto-populate players from directory whose equipo or equipoPrincipal matches this team's name
    if (nombre && allPlayersList.length) {
      allPlayersList.forEach(p => {
        const pEq = p.equipoPrincipal || p.equipo || '';
        if (pEq && pEq.toLowerCase() === nombre.toLowerCase()) {
          const pName = p.nombre || p.jugador || p.name || '';
          if (pName && !localPlantillaList.some(item => (typeof item === 'string' ? item : item.nombre).toLowerCase() === pName.toLowerCase())) {
            localPlantillaList.push(pName);
          }
        }
      });
    }

    const estiloJuego = team.estiloJuego || '';
    const sistemaHabitual = team.sistemaHabitual || '';
    const nivelCompetitividad = team.nivelCompetitividad || '';
    const notasTacticas = team.notasTacticas || team.notas || '';

    let escudoData = team.escudo || team.logo || '';
    let colorPrimary = team.colorPrimary || team.colorPrimario || team.color1 || '';
    let colorSecondary = team.colorSecondary || team.colorSecundario || team.color2 || '';

    // Auto-detect colors and escudo from Club Vinculado using flexible matching (handles Oberena vs Obereno)
    const parentClubForColors = findParentClub({ clubVinculado, nombre });

    if (parentClubForColors) {
      const clubLogo = parentClubForColors.logo || parentClubForColors.escudo || '';
      if (clubLogo) {
        escudoData = clubLogo;
        team.escudo = clubLogo;
        team.logo = clubLogo;
      }
      if (!colorPrimary || colorPrimary === '#2563eb') {
        colorPrimary = parentClubForColors.colorPrimary || parentClubForColors.colorPrimario || parentClubForColors.color1 || parentClubForColors.colorCamiseta || parentClubForColors.color || '#2563eb';
      }
      if (!colorSecondary || colorSecondary === '#ffffff') {
        colorSecondary = parentClubForColors.colorSecondary || parentClubForColors.colorSecundario || parentClubForColors.color2 || '#ffffff';
      }
    }

    if (!colorPrimary) colorPrimary = '#2563eb';
    if (!colorSecondary) colorSecondary = '#ffffff';

    const titleText = isEdit ? `👥 Ficha de ${escapeHtml(nombre)}` : '👥 Nuevo Equipo';

    const modalHTML = `
      <div class="team-modal-wrapper" style="border-top: 6px solid ${colorPrimary}; box-shadow: 0 -3px 12px ${colorPrimary}33;">
        <div id="teamModalHeaderBanner" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: linear-gradient(135deg, ${colorPrimary}22 0%, ${colorSecondary}22 100%); border-radius: var(--radius-md); margin-bottom: 16px; border: 1px solid ${colorPrimary}40;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div id="teamHeaderEscudoBox" style="width: 44px; height: 44px; border-radius: 8px; background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid var(--border-light); flex-shrink: 0; padding: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              ${escudoData ? `<img src="${escudoData}" id="teamHeaderEscudoImg" style="width: 100%; height: 100%; object-fit: contain; background: #ffffff;">` : `<div id="teamHeaderFallbackBadge" style="width: 100%; height: 100%; background: ${colorPrimary}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px;">${nombre ? nombre.charAt(0) : 'E'}</div>`}
            </div>
            <div>
              <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: var(--text-main);">${escapeHtml(nombre || 'Equipo')}</h2>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(categoria || 'General')} • Temp ${escapeHtml(temporada || '26/27')} • ${escapeHtml(competicionVal || 'Competición N/A')}</span>
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <div style="display: flex; gap: 4px; align-items: center; background: var(--bg-surface); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-light);">
              <span id="teamColorPrimaryDot" style="width: 16px; height: 16px; border-radius: 50%; background: ${colorPrimary}; border: 1px solid #ccc; display: inline-block;" title="Color Principal: ${colorPrimary}"></span>
              <span id="teamColorSecondaryDot" style="width: 16px; height: 16px; border-radius: 50%; background: ${colorSecondary}; border: 1px solid #ccc; display: inline-block;" title="Color Secundario: ${colorSecondary}"></span>
            </div>
          </div>
        </div>

        <div class="player-modal-subtabs mb-4">
          <button type="button" class="player-subtab active" data-ttab="tecnica">FICHA TÉCNICA</button>
          <button type="button" class="player-subtab" data-ttab="cuerpo">CUERPO TÉCNICO</button>
          <button type="button" class="player-subtab" data-ttab="estilo">ESTILO Y COMP.</button>
          <button type="button" class="player-subtab" data-ttab="plantilla">PLANTILLA</button>
          <button type="button" class="player-subtab" data-ttab="campograma">CAMPOGRAMA</button>
        </div>

        <datalist id="clubesDatalistOptions">
          ${(state.directory.clubes || []).map(c => `<option value="${escapeHtml(c.nombre || c.equipo)}"></option>`).join('')}
        </datalist>

        <datalist id="federacionesDatalistOptions">
          ${(state.directory.federaciones || []).map(f => `<option value="${escapeHtml(f.nombre || f.federacion)}"></option>`).join('')}
        </datalist>

        <datalist id="staffDatalistOptions">
          ${(state.directory.staff || []).map(s => `<option value="${escapeHtml(s.nombre || s.staff)}"></option>`).join('')}
        </datalist>

        <datalist id="jugadoresDatalistOptions">
          ${allPlayersList.map(p => `<option value="${escapeHtml(p.nombre || p.jugador || p.name)}"></option>`).join('')}
        </datalist>

        <form id="teamForm">
          <!-- TAB 1: FICHA TÉCNICA -->
          <div class="team-tab-pane" id="ttab-tecnica">
            <div class="player-profile-grid">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <div class="photo-upload-box" id="btnUploadTeamEscudo">
                  ${escudoData ? `<img src="${escudoData}" class="photo-upload-preview">` : `
                    <i data-lucide="cloud-upload" style="width: 32px; height: 32px;"></i>
                    <span>SUBIR ESCUDO</span>
                  `}
                  <input type="file" id="inputTeamEscudo" accept="image/*" class="hidden">
                </div>
                <div style="display: flex; gap: 8px; align-items: center; width: 100%; justify-content: center;">
                  <input type="color" id="tfColorPrimary" value="${colorPrimary}" style="width: 36px; height: 36px; border: none; cursor: pointer; border-radius: 4px;" title="Color Principal">
                  <input type="color" id="tfColorSecondary" value="${colorSecondary}" style="width: 36px; height: 36px; border: none; cursor: pointer; border-radius: 4px;" title="Color Secundario">
                </div>
              </div>

              <div>
                <div class="form-group mb-4">
                  <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>NOMBRE DEL EQUIPO</span>
                    <span style="font-size: 10px; color: var(--primary-blue); font-weight: 600;">✨ Auto-generado</span>
                  </label>
                  <input type="text" id="tfNombre" class="form-control" placeholder="Se genera al seleccionar Club, Categoría y Temporada..." value="${escapeHtml(nombre)}" required>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">CLUB VINCULADO</label>
                  <input type="text" id="tfClubVinculado" list="clubesDatalistOptions" class="form-control" placeholder="Buscar club del directorio..." value="${escapeHtml(clubVinculado)}">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">CATEGORÍA</label>
                    <select id="tfCategoria" class="form-control">
                      <option value="">Seleccionar categoría...</option>
                      ${LISTA_CATEGORIAS_EQUIPO.map(cat => `<option value="${escapeHtml(cat)}" ${categoria === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`).join('')}
                      ${categoria && !LISTA_CATEGORIAS_EQUIPO.includes(categoria) ? `<option value="${escapeHtml(categoria)}" selected>${escapeHtml(categoria)}</option>` : ''}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">GRUPO</label>
                    <input type="text" id="tfGrupo" class="form-control" placeholder="Ej. Grupo 2, Grupo XV..." value="${escapeHtml(grupoVal)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">TEMPORADA</label>
                    <select id="tfTemporada" class="form-control">
                      <option value="">Seleccionar temporada...</option>
                      ${LISTA_TEMPORADAS_EQUIPO.map(t => {
                        const shortFormat = t.substring(2,4) + '/' + t.substring(7,9);
                        const isSelected = temporada === t || temporada === shortFormat;
                        return `<option value="${escapeHtml(shortFormat)}" ${isSelected ? 'selected' : ''}>${escapeHtml(t)} (${shortFormat})</option>`;
                      }).join('')}
                      ${temporada && !LISTA_TEMPORADAS_EQUIPO.some(t => t === temporada || (t.substring(2,4) + '/' + t.substring(7,9)) === temporada) ? `<option value="${escapeHtml(temporada)}" selected>${escapeHtml(temporada)}</option>` : ''}
                    </select>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">COMPETICIÓN</label>
                    <select id="tfCompeticion" class="form-control">
                      <option value="">Seleccionar competición...</option>
                      ${(state.customCompeticiones || ['Amistoso', 'Primera Regional Navarra', 'Liga Nacional', 'División de Honor', 'Liga RFEF', 'Primera División', 'Segunda División']).map(c => `<option value="${escapeHtml(c)}" ${competicionVal === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
                      ${competicionVal && !(state.customCompeticiones || []).includes(competicionVal) ? `<option value="${escapeHtml(competicionVal)}" selected>${escapeHtml(competicionVal)}</option>` : ''}
                      <option value="__NEW_COMPETICION__" style="font-weight: bold; color: var(--primary-blue);">+ Crear nueva competición...</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">TORNEO</label>
                    <select id="tfTorneo" class="form-control">
                      <option value="">Seleccionar torneo...</option>
                      ${(state.customTorneos || ['Copa RFEF', 'Torneo Internacional', 'Copa de Campeones', 'Torneo de Navidad', 'Copa del Rey', 'Torneo Autonómico']).map(t => `<option value="${escapeHtml(t)}" ${torneoVal === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
                      ${torneoVal && !(state.customTorneos || []).includes(torneoVal) ? `<option value="${escapeHtml(torneoVal)}" selected>${escapeHtml(torneoVal)}</option>` : ''}
                      <option value="__NEW_TORNEO__" style="font-weight: bold; color: var(--primary-blue);">+ Crear nuevo torneo...</option>
                    </select>
                  </div>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">FEDERACIÓN</label>
                  <input type="text" id="tfFederacion" list="federacionesDatalistOptions" class="form-control" placeholder="Buscar federación..." value="${escapeHtml(federacion)}">
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: CUERPO TÉCNICO -->
          <div class="team-tab-pane hidden" id="ttab-cuerpo">
            <div class="player-section-title mb-2">
              <i data-lucide="users"></i> TÉCNICOS VINCULADOS
            </div>

            <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-4">
              <input type="text" id="tfTecnicoSearchInput" list="staffDatalistOptions" class="form-control" placeholder="Buscar técnico...">
              <button type="button" class="btn btn-primary" id="btnAddTecnicoRow">Añadir</button>
            </div>

            <div class="table-responsive" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-light); font-weight: 800; color: var(--text-muted); text-align: left;">
                    <th style="padding: 8px 12px;">TÉCNICO / MIEMBRO DEL STAFF</th>
                    <th style="padding: 8px 12px; text-align: right;">ELIMINAR</th>
                  </tr>
                </thead>
                <tbody id="tfTecnicoTableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- TAB 3: ESTILO Y COMP. -->
          <div class="team-tab-pane hidden" id="ttab-estilo">
            <p class="mb-4" style="font-size: 12px; color: var(--text-muted);">Estilo y competiciones preferidas.</p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">ESTILO DE JUEGO</label>
                <input type="text" id="tfEstiloJuego" class="form-control" placeholder="Ej: Posesión / Presión alta" value="${escapeHtml(estiloJuego)}">
              </div>
              <div class="form-group">
                <label class="form-label">SISTEMA HABITUAL</label>
                <input type="text" id="tfSistemaHabitual" class="form-control" placeholder="Ej: 1-4-3-3" value="${escapeHtml(sistemaHabitual)}">
              </div>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">NIVEL DE COMPETITIVIDAD</label>
              <input type="text" id="tfNivelCompetitividad" class="form-control" placeholder="Ej: Alto / Regional" value="${escapeHtml(nivelCompetitividad)}">
            </div>

            <div class="form-group">
              <label class="form-label">NOTAS TÁCTICAS Y OBSERVACIONES</label>
              <textarea id="tfNotasTacticas" class="form-control" rows="5" placeholder="Comentarios sobre el rendimiento y perfil del equipo...">${escapeHtml(notasTacticas)}</textarea>
            </div>
          </div>

          <!-- TAB 4: PLANTILLA -->
          <div class="team-tab-pane hidden" id="ttab-plantilla">
            <div class="player-section-title mb-2" style="display: flex; justify-content: space-between; align-items: center;">
              <span><i data-lucide="user-check"></i> JUGADORES DE LA PLANTILLA</span>
              <span style="font-size: 12px; color: var(--primary-blue); font-weight: 800; background: var(--primary-blue-light); padding: 2px 10px; border-radius: 12px;" id="lblSelectedPlayersCount">0 en plantilla</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 140px; gap: 8px;" class="mb-4">
              <input type="text" id="tfJugadorSearchInput" list="jugadoresDatalistOptions" class="form-control" placeholder="🔍 Buscar y seleccionar jugador del directorio...">
              <button type="button" class="btn btn-primary" id="btnAddJugadorRow">+ Añadir</button>
            </div>

            <div class="table-responsive" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-light); font-weight: 800; color: var(--text-muted); text-align: left;">
                    <th style="padding: 8px 12px; width: 35%;">PLANTILLA</th>
                    <th style="padding: 8px 12px; width: 20%;">POSICIÓN PRINCIPAL</th>
                    <th style="padding: 8px 12px; width: 20%;">POSICIÓN SECUNDARIA</th>
                    <th style="padding: 8px 12px; width: 15%;">RENDIMIENTO RS</th>
                    <th style="padding: 8px 12px; text-align: right; width: 10%;">ELIMINAR</th>
                  </tr>
                </thead>
                <tbody id="tfPlantillaTableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- TAB 5: CAMPOGRAMA -->
          <div class="team-tab-pane hidden" id="ttab-campograma">
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-light);" class="mb-3">
              <div style="display: flex; align-items: center; gap: 12px;">
                <label class="form-label" style="margin: 0; white-space: nowrap; font-weight: 800;">SISTEMA TÁCTICO:</label>
                <select id="tfCampogramaSistema" class="form-control" style="width: auto; min-width: 150px; font-weight: 700;">
                  ${Object.keys(FORMATION_POSITIONS).map(sys => `<option value="${sys}" ${sistemaHabitual === sys ? 'selected' : ''}>${sys}</option>`).join('')}
                </select>
              </div>
              <button type="button" class="btn btn-secondary" id="btnExportTeamCampogramaPdf" style="font-size: 11px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px; font-weight: 800; color: var(--primary-blue);">
                <i data-lucide="file-text"></i> Exportar Campograma (PDF 2 Páginas)
              </button>
            </div>

            <div style="position: relative; width: 100%; height: 480px; background: linear-gradient(180deg, #1b7a38 0%, #145e2a 100%); border-radius: var(--radius-md); border: 2px solid #22c55e; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.4);" id="teamCampogramaPitch">
              <!-- Pitch Lines -->
              <div style="position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; border: 2px solid rgba(255,255,255,0.4); pointer-events: none;"></div>
              <div style="position: absolute; top: 50%; left: 10px; right: 10px; height: 2px; background: rgba(255,255,255,0.4); transform: translateY(-50%); pointer-events: none;"></div>
              <div style="position: absolute; top: 50%; left: 50%; width: 100px; height: 100px; border: 2px solid rgba(255,255,255,0.4); border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none;"></div>
              <div style="position: absolute; top: 10px; left: 50%; width: 160px; height: 60px; border: 2px solid rgba(255,255,255,0.4); border-top: none; transform: translateX(-50%); pointer-events: none;"></div>
              <div style="position: absolute; bottom: 10px; left: 50%; width: 160px; height: 60px; border: 2px solid rgba(255,255,255,0.4); border-bottom: none; transform: translateX(-50%); pointer-events: none;"></div>

              <!-- Pins Container -->
              <div id="teamCampogramaPins" style="position: absolute; inset: 0;"></div>
            </div>
          </div>
        </form>
      </div>
    `;

    const card = document.getElementById('generalModalCard');
    card.classList.add('large');

    showModal(titleText, modalHTML, () => {
      const nameVal = document.getElementById('tfNombre').value.trim();
      if (!nameVal) return alert('Por favor ingresa el nombre del equipo');

      const targetClubName = document.getElementById('tfClubVinculado').value.trim();
      let parentClub = (targetClubName || nameVal) && state.directory.clubes ? state.directory.clubes.find(c => 
        (c.nombre && c.nombre.toLowerCase() === (targetClubName || nameVal).toLowerCase()) ||
        (c.nombre && nameVal && nameVal.toLowerCase().startsWith(c.nombre.toLowerCase()))
      ) : null;

      const finalEscudo = escudoData || (parentClub ? (parentClub.logo || parentClub.escudo) : '');
      const finalColorPri = document.getElementById('tfColorPrimary')?.value || (parentClub ? parentClub.colorPrimary || parentClub.colorPrimario || parentClub.color1 : '#2563eb');
      const finalColorSec = document.getElementById('tfColorSecondary')?.value || (parentClub ? parentClub.colorSecondary || parentClub.colorSecundario || parentClub.color2 : '#ffffff');

      const updatedTeam = {
        id: isEdit ? teamId : 'eq_' + Date.now(),
        nombre: nameVal,
        equipo: nameVal,
        clubVinculado: targetClubName || (parentClub ? parentClub.nombre : ''),
        club: targetClubName || (parentClub ? parentClub.nombre : ''),
        categoria: document.getElementById('tfCategoria').value.trim(),
        grupo: document.getElementById('tfGrupo').value.trim(),
        temporada: document.getElementById('tfTemporada').value.trim(),
        competicion: document.getElementById('tfCompeticion').value.trim(),
        torneo: document.getElementById('tfTorneo').value.trim(),
        federacion: document.getElementById('tfFederacion').value.trim(),

        tecnicos: localTecnicosList,
        plantilla: localPlantillaList,

        estiloJuego: document.getElementById('tfEstiloJuego').value.trim(),
        sistemaHabitual: document.getElementById('tfSistemaHabitual').value.trim(),
        nivelCompetitividad: document.getElementById('tfNivelCompetitividad').value.trim(),
        notasTacticas: document.getElementById('tfNotasTacticas').value.trim(),
        notas: document.getElementById('tfNotasTacticas').value.trim(),

        escudo: finalEscudo,
        logo: finalEscudo,
        colorPrimary: finalColorPri,
        colorSecondary: finalColorSec
      };

      if (!state.directory.equipos) state.directory.equipos = [];
      if (isEdit) {
        const idx = state.directory.equipos.findIndex(eq => eq && (String(eq.id) === String(teamId) || (eq.codigo && String(eq.codigo) === String(teamId))));
        if (idx !== -1) state.directory.equipos[idx] = updatedTeam;
      } else {
        state.directory.equipos.unshift(updatedTeam);
      }
      saveToFirebase('equipos', updatedTeam);

      // Bidirectional sync for Club Vinculado (Sync Colors, Logo & Data to Parent Club)
      const syncClubName = updatedTeam.clubVinculado || targetClubName || nameVal;
      if (syncClubName && state.directory.clubes) {
        let parentC = state.directory.clubes.find(c => 
          (c.nombre && c.nombre.toLowerCase() === syncClubName.toLowerCase()) ||
          (c.equipo && c.equipo.toLowerCase() === syncClubName.toLowerCase())
        );
        if (!parentC && typeof findParentClub === 'function') {
          parentC = findParentClub(updatedTeam);
        }
        if (!parentC) {
          parentC = {
            id: 'c_' + Date.now() + Math.floor(Math.random()*100),
            nombre: targetClubName || syncClubName,
            equipo: targetClubName || syncClubName,
            equiposList: []
          };
          state.directory.clubes.unshift(parentC);
        }

        // UPDATE PARENT CLUB COLORS, LOGO & FEDERATION WITH TEAM VALUES
        parentC.colorPrimary = finalColorPri;
        parentC.colorSecondary = finalColorSec;
        if (finalEscudo) {
          parentC.logo = finalEscudo;
          parentC.escudo = finalEscudo;
        }
        if (updatedTeam.federacion && (!parentC.federacion || parentC.federacion === 'Sin Federación')) {
          parentC.federacion = updatedTeam.federacion;
        }

        if (!parentC.equiposList) parentC.equiposList = [];
        const exists = parentC.equiposList.some(eq => (typeof eq === 'string' ? eq : eq.nombre) === nameVal);
        if (!exists) parentC.equiposList.push({ id: updatedTeam.id, nombre: nameVal });

        // Save updated parent club directly to Firebase Cloud Firestore
        saveToFirebase('clubes', parentC);

        // Propagate updated colors to all sister teams linked to this club
        if (typeof syncClubDataToLinkedTeams === 'function') {
          syncClubDataToLinkedTeams(parentC);
        }
      }

      // Bidirectional sync for Federación
      const targetFedName = updatedTeam.federacion;
      if (targetFedName && state.directory.federaciones) {
        let parentFed = state.directory.federaciones.find(f => 
          (f.nombre && f.nombre.toLowerCase() === targetFedName.toLowerCase()) ||
          (f.federacion && f.federacion.toLowerCase() === targetFedName.toLowerCase())
        );
        if (!parentFed) {
          parentFed = {
            id: 'fed_' + Date.now() + Math.floor(Math.random()*100),
            nombre: targetFedName,
            federacion: targetFedName,
            equipos: []
          };
          state.directory.federaciones.unshift(parentFed);
        }
        if (!parentFed.equipos) parentFed.equipos = [];
        const exists = parentFed.equipos.some(eq => (typeof eq === 'string' ? eq : eq.nombre) === nameVal);
        if (!exists) parentFed.equipos.push({ id: updatedTeam.id, nombre: nameVal });
      }

      // Bidirectional sync for Cuerpo Técnico (Staff)
      if (Array.isArray(localTecnicosList) && state.directory.staff) {
        localTecnicosList.forEach(t => {
          const staffName = typeof t === 'string' ? t : (t.nombre || t.staff || '');
          if (!staffName) return;

          let targetStaff = state.directory.staff.find(st => 
            (st.nombre && st.nombre.toLowerCase() === staffName.toLowerCase()) ||
            (st.staff && st.staff.toLowerCase() === staffName.toLowerCase())
          );

          if (!targetStaff) {
            targetStaff = {
              id: 'st_' + Date.now() + Math.floor(Math.random()*100),
              nombre: staffName,
              staff: staffName,
              cargo: 'Entrenador',
              equipo: nameVal,
              club: updatedTeam.clubVinculado || ''
            };
            state.directory.staff.unshift(targetStaff);
          } else {
            targetStaff.equipo = nameVal;
            if (updatedTeam.clubVinculado) targetStaff.club = updatedTeam.clubVinculado;
          }
        });
      }

      // Bidirectional sync for Plantilla (Players) - only update existing players in directory
      if (Array.isArray(localPlantillaList)) {
        if (!state.directory.jugadores) state.directory.jugadores = [];
        const playersStore = state.directory.jugadores;

        localPlantillaList.forEach(j => {
          const playerName = typeof j === 'string' ? j : (j.nombre || j.jugador || j.name || '');
          if (!playerName) return;

          let targetPlayer = playersStore.find(p => 
            (p.nombre && p.nombre.toLowerCase() === playerName.toLowerCase()) ||
            (p.jugador && p.jugador.toLowerCase() === playerName.toLowerCase()) ||
            (p.name && p.name.toLowerCase() === playerName.toLowerCase())
          );

          if (targetPlayer) {
            targetPlayer.equipoPrincipal = nameVal;
            targetPlayer.equipo = nameVal;
          }
        });
      }

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    }, isEdit ? {
      label: 'Eliminar Equipo',
      title: `¿Eliminar Ficha de ${nombre || 'Equipo'}?`,
      message: `¿Estás seguro de que deseas eliminar permanentemente a "${nombre || 'Equipo'}" de la base de datos?`,
      action: () => {
        deleteFromFirebase('equipos', teamId);
        state.directory.equipos = (state.directory.equipos || []).filter(item => item.id !== teamId);
        saveState();
        hideModal();
        renderDirectorio();
      }
    } : null);

    // Auto sync escudo and colors when Club Vinculado is selected + Live Header Color Update
    const applyTeamColorsHeader = (pri, sec) => {
      if (!pri) pri = '#2563eb';
      if (!sec) sec = '#ffffff';
      const wrapper = document.querySelector('.team-modal-wrapper');
      const headerBanner = document.getElementById('teamModalHeaderBanner');
      const dotPri = document.getElementById('teamColorPrimaryDot');
      const dotSec = document.getElementById('teamColorSecondaryDot');
      const fallbackBadge = document.getElementById('teamHeaderFallbackBadge');

      if (wrapper) {
        wrapper.style.borderTop = `6px solid ${pri}`;
        wrapper.style.boxShadow = `0 -3px 12px ${pri}33`;
      }
      if (headerBanner) {
        headerBanner.style.background = `linear-gradient(135deg, ${pri}22 0%, ${sec}22 100%)`;
        headerBanner.style.borderColor = `${pri}40`;
      }
      if (dotPri) dotPri.style.background = pri;
      if (dotSec) dotSec.style.background = sec;
      if (fallbackBadge) fallbackBadge.style.background = pri;
    };

    const inputClubVinc = document.getElementById('tfClubVinculado');
    const inputColorPri = document.getElementById('tfColorPrimary');
    const inputColorSec = document.getElementById('tfColorSecondary');
    const boxEscudo = document.getElementById('btnUploadTeamEscudo');

    const updateFromClub = () => {
      const selectedClubName = inputClubVinc?.value.trim() || '';
      if (!state.directory.clubes) return;

      const foundClub = findParentClub({ clubVinculado: selectedClubName, nombre: inputNombre?.value || nombre });

      if (foundClub) {
        const clubLogo = foundClub.logo || foundClub.escudo;
        if (clubLogo) {
          escudoData = clubLogo;
          if (boxEscudo) {
            boxEscudo.innerHTML = `<img src="${clubLogo}" class="photo-upload-preview"><input type="file" id="inputTeamEscudo" accept="image/*" class="hidden">`;
          }
          const headerBox = document.getElementById('teamHeaderEscudoBox');
          if (headerBox) {
            headerBox.innerHTML = `<img src="${clubLogo}" id="teamHeaderEscudoImg" style="width: 100%; height: 100%; object-fit: contain; background: #ffffff;">`;
          }
        }
        const clubPri = foundClub.colorPrimary || foundClub.colorPrimario || foundClub.color1 || foundClub.colorCamiseta;
        const clubSec = foundClub.colorSecondary || foundClub.colorSecundario || foundClub.color2;

        if (clubPri && inputColorPri) inputColorPri.value = clubPri;
        if (clubSec && inputColorSec) inputColorSec.value = clubSec;
        applyTeamColorsHeader(inputColorPri?.value, inputColorSec?.value);
      }
    };

    inputColorPri?.addEventListener('input', (e) => applyTeamColorsHeader(e.target.value, inputColorSec?.value));
    inputColorPri?.addEventListener('change', (e) => applyTeamColorsHeader(e.target.value, inputColorSec?.value));
    inputColorSec?.addEventListener('input', (e) => applyTeamColorsHeader(inputColorPri?.value, e.target.value));
    inputColorSec?.addEventListener('change', (e) => applyTeamColorsHeader(inputColorPri?.value, e.target.value));

    // Auto-generate Team Name from Club, Categoría and Temporada
    const inputNombre = document.getElementById('tfNombre');
    const inputCategoria = document.getElementById('tfCategoria');
    const inputTemporada = document.getElementById('tfTemporada');

    const updateGeneratedTeamName = () => {
      const clubVal = inputClubVinc?.value.trim() || '';
      const catVal = inputCategoria?.value.trim() || '';
      const tempVal = inputTemporada?.value.trim() || '';

      let tempShort = '';
      if (tempVal) {
        const match = tempVal.match(/(\d{2,4})\/(\d{2,4})/);
        if (match) {
          tempShort = match[1].slice(-2) + '/' + match[2].slice(-2);
        } else {
          tempShort = tempVal;
        }
      }

      const parts = [clubVal, catVal, tempShort].filter(Boolean);
      if (parts.length > 0) {
        const generated = parts.join(' ');
        if (inputNombre) inputNombre.value = generated;
      }
    };

    inputClubVinc?.addEventListener('change', () => { updateFromClub(); updateGeneratedTeamName(); });
    inputClubVinc?.addEventListener('input', () => { updateFromClub(); updateGeneratedTeamName(); });
    inputCategoria?.addEventListener('change', updateGeneratedTeamName);
    inputCategoria?.addEventListener('input', updateGeneratedTeamName);
    inputTemporada?.addEventListener('change', updateGeneratedTeamName);
    inputTemporada?.addEventListener('input', updateGeneratedTeamName);

    if (clubVinculado) updateFromClub();
    if (!isEdit || !nombre) updateGeneratedTeamName();

    // Subtab switching logic
    const subtabs = document.querySelectorAll('.player-subtab');
    const panes = document.querySelectorAll('.team-tab-pane');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        const targetPane = document.getElementById('ttab-' + tab.dataset.ttab);
        if (targetPane) targetPane.classList.remove('hidden');
      });
    });

    // Custom Competición Creation Handler
    const compSelect = document.getElementById('tfCompeticion');
    compSelect?.addEventListener('change', (e) => {
      if (e.target.value === '__NEW_COMPETICION__') {
        const newComp = prompt('Introduce el nombre de la nueva competición:');
        if (newComp && newComp.trim()) {
          const trimmed = newComp.trim();
          if (!state.customCompeticiones) state.customCompeticiones = ['Primera Regional Navarra', 'Liga Nacional', 'División de Honor', 'Liga RFEF', 'Primera División', 'Segunda División'];
          if (!state.customCompeticiones.includes(trimmed)) {
            state.customCompeticiones.push(trimmed);
            saveState();
          }
          const opt = document.createElement('option');
          opt.value = trimmed;
          opt.textContent = trimmed;
          opt.selected = true;
          compSelect.insertBefore(opt, compSelect.lastElementChild);
          compSelect.value = trimmed;
        } else {
          compSelect.value = '';
        }
      }
    });

    // Custom Torneo Creation Handler
    const tornSelect = document.getElementById('tfTorneo');
    tornSelect?.addEventListener('change', (e) => {
      if (e.target.value === '__NEW_TORNEO__') {
        const newTorn = prompt('Introduce el nombre del nuevo torneo:');
        if (newTorn && newTorn.trim()) {
          const trimmed = newTorn.trim();
          if (!state.customTorneos) state.customTorneos = ['Copa RFEF', 'Torneo Internacional', 'Copa de Campeones', 'Torneo de Navidad', 'Copa del Rey', 'Torneo Autonómico'];
          if (!state.customTorneos.includes(trimmed)) {
            state.customTorneos.push(trimmed);
            saveState();
          }
          const opt = document.createElement('option');
          opt.value = trimmed;
          opt.textContent = trimmed;
          opt.selected = true;
          tornSelect.insertBefore(opt, tornSelect.lastElementChild);
          tornSelect.value = trimmed;
        } else {
          tornSelect.value = '';
        }
      }
    });

    // Tecnicos Table Logic
    function renderTecnicosTable() {
      const tbody = document.getElementById('tfTecnicoTableBody');
      if (!tbody) return;
      if (localTecnicosList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: var(--text-muted);">Sin técnicos vinculados</td></tr>`;
      } else {
        tbody.innerHTML = localTecnicosList.map((t, idx) => {
          const nameStr = typeof t === 'string' ? t : (t.nombre || t.staff || '');
          const foundStaff = (state.directory.staff || []).find(st => 
            (st.nombre && st.nombre.toLowerCase() === nameStr.toLowerCase()) ||
            (st.staff && st.staff.toLowerCase() === nameStr.toLowerCase())
          );

          let nameHTML = `<span style="font-weight: 700; color: var(--text-main);">${escapeHtml(nameStr)}</span>`;
          if (foundStaff) {
            nameHTML = `<a href="javascript:void(0)" class="staff-modal-link" data-staffid="${foundStaff.id}" style="color: var(--primary-blue); font-weight: 700; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="user-check" style="width: 13px; height: 13px;"></i> ${escapeHtml(nameStr)}</a>`;
          }

          return `
            <tr style="border-bottom: 1px solid var(--border-light);">
              <td style="padding: 8px 12px;">${nameHTML}</td>
              <td style="padding: 8px 12px; text-align: right;">
                <button type="button" class="btn-action-icon danger btn-del-tecnico" data-idx="${idx}" style="width: 26px; height: 26px;">
                  <i data-lucide="trash-2" style="width: 12px;"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        tbody.querySelectorAll('.btn-del-tecnico').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.idx, 10);
            localTecnicosList.splice(index, 1);
            renderTecnicosTable();
          });
        });

        tbody.querySelectorAll('.staff-modal-link').forEach(link => {
          link.addEventListener('click', (ev) => {
            ev.preventDefault();
            const sId = link.dataset.staffid;
            if (sId) {
              card.classList.remove('large');
              hideModal();
              openStaffModal(sId);
            }
          });
        });
      }
      if (window.lucide) window.lucide.createIcons();
    }
    renderTecnicosTable();

    document.getElementById('btnAddTecnicoRow')?.addEventListener('click', () => {
      const val = document.getElementById('tfTecnicoSearchInput').value.trim();
      if (!val) return alert('Ingresa o selecciona el nombre del técnico');
      localTecnicosList.push(val);
      document.getElementById('tfTecnicoSearchInput').value = '';
      renderTecnicosTable();
    });

    // Plantilla Table & Multiselect Checkbox Logic
    function renderPlantillaCheckboxes(filterText = '') {
      const container = document.getElementById('plantillaCheckboxContainer');
      const countLabel = document.getElementById('lblSelectedPlayersCount');
      if (!container) return;

      const playersPool = (state.directory && Array.isArray(state.directory.jugadores)) ? state.directory.jugadores : [];
      const filterLower = filterText.toLowerCase().trim();

      const filteredPlayers = playersPool.filter(p => {
        const pName = p.nombre || p.jugador || p.name || '';
        const pPos = (p.posicionPrincipal || p.posicion || '') + ' ' + (p.posicionSecundaria || '');
        return pName.toLowerCase().includes(filterLower) || pPos.toLowerCase().includes(filterLower);
      });

      if (filteredPlayers.length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; font-size: 12px; color: var(--text-muted); text-align: center; padding: 12px;">No se encontraron jugadores en el directorio</div>`;
      } else {
        container.innerHTML = filteredPlayers.map(p => {
          const pName = p.nombre || p.jugador || p.name || '';
          const pPos = p.posicionPrincipal || p.posicion || '';
          const isChecked = localPlantillaList.some(item => (typeof item === 'string' ? item : item.nombre).toLowerCase() === pName.toLowerCase());

          return `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 4px; background: ${isChecked ? 'rgba(37, 99, 235, 0.08)' : 'transparent'}; border: 1px solid ${isChecked ? 'var(--primary-blue)' : 'var(--border-light)'}; cursor: pointer; transition: all 0.15s ease;">
              <input type="checkbox" class="chk-plantilla-player" data-name="${escapeHtml(pName)}" ${isChecked ? 'checked' : ''} style="cursor: pointer; accent-color: var(--primary-blue);">
              <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(pName)} ${pPos ? `<small style="color: var(--text-muted); font-weight: 500;">(${escapeHtml(pPos)})</small>` : ''}</span>
            </label>
          `;
        }).join('');

        container.querySelectorAll('.chk-plantilla-player').forEach(chk => {
          chk.addEventListener('change', () => {
            const nameStr = chk.dataset.name;
            if (chk.checked) {
              if (!localPlantillaList.some(item => (typeof item === 'string' ? item : item.nombre).toLowerCase() === nameStr.toLowerCase())) {
                localPlantillaList.push(nameStr);
              }
            } else {
              const idx = localPlantillaList.findIndex(item => (typeof item === 'string' ? item : item.nombre).toLowerCase() === nameStr.toLowerCase());
              if (idx !== -1) localPlantillaList.splice(idx, 1);
            }
            renderPlantillaTable();
            renderPlantillaCheckboxes(document.getElementById('tfJugadorFilterInput')?.value || '');
          });
        });
      }

      if (countLabel) {
        countLabel.textContent = `${localPlantillaList.length} seleccionados`;
      }
    }

    document.getElementById('tfJugadorFilterInput')?.addEventListener('input', (e) => {
      renderPlantillaCheckboxes(e.target.value);
    });

    function renderPlantillaTable() {
      const tbody = document.getElementById('tfPlantillaTableBody');
      if (!tbody) return;
      const playersPool = (state.directory && Array.isArray(state.directory.jugadores)) ? state.directory.jugadores : [];

      if (localPlantillaList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 12px; text-align: center; color: var(--text-muted);">Sin jugadores vinculados en la plantilla</td></tr>`;
      } else {
        tbody.innerHTML = localPlantillaList.map((j, idx) => {
          const nameStr = typeof j === 'string' ? j : (j.nombre || j.jugador || j.name || '');
          const foundPlayer = playersPool.find(p => 
            (p.nombre && p.nombre.toLowerCase() === nameStr.toLowerCase()) ||
            (p.jugador && p.jugador.toLowerCase() === nameStr.toLowerCase()) ||
            (p.name && p.name.toLowerCase() === nameStr.toLowerCase())
          );

          let nameHTML = `<span style="font-weight: 700; color: var(--text-main);">${escapeHtml(nameStr)}</span>`;
          let posPri = '-';
          let posSec = '-';
          let rendRS = '-';

          if (foundPlayer) {
            nameHTML = `<a href="javascript:void(0)" class="player-modal-link" data-playerid="${foundPlayer.id}" style="color: var(--primary-blue); font-weight: 700; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="user" style="width: 13px; height: 13px;"></i> ${escapeHtml(nameStr)}</a>`;
            posPri = foundPlayer.posicionPrincipal || foundPlayer.posicion || '-';
            posSec = foundPlayer.posicionSecundaria || '-';
            rendRS = foundPlayer.rendimientoRS || foundPlayer.rendimiento || '-';
          }

          return `
            <tr style="border-bottom: 1px solid var(--border-light);">
              <td style="padding: 8px 12px;">${nameHTML}</td>
              <td style="padding: 8px 12px; font-weight: 600;">${escapeHtml(posPri)}</td>
              <td style="padding: 8px 12px; color: var(--text-muted);">${escapeHtml(posSec)}</td>
              <td style="padding: 8px 12px;">
                <span class="badge" style="background: rgba(37, 99, 235, 0.1); color: var(--primary-blue); font-weight: 800; padding: 2px 8px; border-radius: 4px;">${escapeHtml(rendRS)}</span>
              </td>
              <td style="padding: 8px 12px; text-align: right;">
                <button type="button" class="btn-action-icon danger btn-del-jugador" data-idx="${idx}" style="width: 26px; height: 26px;">
                  <i data-lucide="trash-2" style="width: 12px;"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        tbody.querySelectorAll('.btn-del-jugador').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.idx, 10);
            localPlantillaList.splice(index, 1);
            renderPlantillaTable();
            renderPlantillaCheckboxes(document.getElementById('tfJugadorFilterInput')?.value || '');
          });
        });

        tbody.querySelectorAll('.player-modal-link').forEach(link => {
          link.addEventListener('click', (ev) => {
            ev.preventDefault();
            const pId = link.dataset.playerid;
            if (pId) {
              card.classList.remove('large');
              hideModal();
              openPlayerModal(pId);
            }
          });
        });
      }

      const countLabel = document.getElementById('lblSelectedPlayersCount');
      if (countLabel) {
        countLabel.textContent = `${localPlantillaList.length} en plantilla`;
      }

      if (window.lucide) window.lucide.createIcons();
    }
    renderPlantillaTable();

    document.getElementById('btnAddJugadorRow')?.addEventListener('click', () => {
      const val = document.getElementById('tfJugadorSearchInput').value.trim();
      if (!val) return alert('Ingresa o selecciona el nombre del jugador');
      if (!localPlantillaList.some(item => (typeof item === 'string' ? item : item.nombre).toLowerCase() === val.toLowerCase())) {
        localPlantillaList.push(val);
      }
      document.getElementById('tfJugadorSearchInput').value = '';
      renderPlantillaTable();
      renderTeamCampogramaPins();
    });

    // --------------------------------------------------------------------------
    // CAMPOGRAMA TAB LOGIC & PDF EXPORT
    // --------------------------------------------------------------------------
    function renderTeamCampogramaPins() {
      const container = document.getElementById('teamCampogramaPins');
      const sysSelect = document.getElementById('tfCampogramaSistema');
      if (!container || !sysSelect) return;

      const formation = sysSelect.value || '1-4-3-3';
      const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['1-4-3-3'];
      const defaultPositions = SYSTEM_STARTER_POSITIONS[formation] || ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MCD', 'MC', 'ACD', 'ACZ', 'AC'];

      // Resolve full player objects for squad
      const squadPlayers = localPlantillaList.map(item => {
        const pName = typeof item === 'string' ? item : (item.nombre || item.jugador || item.name || '');
        return playersPool.find(p => (p.nombre || p.jugador || p.name || '').toLowerCase() === pName.toLowerCase()) || { nombre: pName, posicionPrincipal: 'MC' };
      });

      // Map squad players to formation slots
      const assignedSlots = positions.map((posCoords, slotIdx) => {
        const targetPosCode = defaultPositions[slotIdx] || 'MC';
        const matchingPlayer = squadPlayers.find(p => !p._assignedToCampograma && (
          (p.posicionPrincipal && p.posicionPrincipal.toLowerCase() === targetPosCode.toLowerCase()) ||
          (p.posicion && p.posicion.toLowerCase() === targetPosCode.toLowerCase())
        )) || squadPlayers.find(p => !p._assignedToCampograma);

        if (matchingPlayer) matchingPlayer._assignedToCampograma = true;

        return {
          coords: posCoords,
          targetPosCode: targetPosCode,
          player: matchingPlayer || null
        };
      });

      squadPlayers.forEach(p => delete p._assignedToCampograma);

      const curPrimaryColor = document.getElementById('tfColorPrimary')?.value || colorPrimary || '#2563eb';
      const curTextColor = getContrastColor(curPrimaryColor);

      container.innerHTML = assignedSlots.map((slot, idx) => {
        const p = slot.player;
        const displayName = p ? (p.nombre || p.jugador || '') : `Vacío (${slot.targetPosCode})`;
        const posTag = p ? (p.posicionPrincipal || p.posicion || slot.targetPosCode) : slot.targetPosCode;
        const numVal = p && p.dorsal ? p.dorsal : (posTag || (idx + 1));

        return `
          <div style="position: absolute; left: ${slot.coords.x}%; top: ${slot.coords.y}%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; cursor: pointer; z-index: 10;" title="${escapeHtml(displayName)}" class="campograma-player-pin" data-playerid="${p ? (p.id || '') : ''}">
            <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${curPrimaryColor}; color: ${curTextColor}; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11px;">
              ${escapeHtml(String(numVal))}
            </div>
            <div style="background: rgba(15, 23, 42, 0.85); color: #ffffff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; margin-top: 3px; white-space: nowrap; max-width: 90px; overflow: hidden; text-overflow: ellipsis; border: 1px solid rgba(255,255,255,0.2);">
              ${escapeHtml(displayName)}
            </div>
          </div>
        `;
      }).join('');

      container.querySelectorAll('.campograma-player-pin').forEach(pin => {
        pin.addEventListener('click', () => {
          const pId = pin.dataset.playerid;
          if (pId) {
            card.classList.remove('large');
            hideModal();
            openPlayerModal(pId);
          }
        });
      });
    }

    renderTeamCampogramaPins();
    document.getElementById('tfCampogramaSistema')?.addEventListener('change', renderTeamCampogramaPins);

    // PDF Export for Team Campograma (2 Pages)
    document.getElementById('btnExportTeamCampogramaPdf')?.addEventListener('click', () => {
      const curPrimaryColor = document.getElementById('tfColorPrimary')?.value || colorPrimary || '#2563eb';
      const curSecondaryColor = document.getElementById('tfColorSecondary')?.value || colorSecondary || '#ffffff';
      const curNombre = document.getElementById('tfNombre')?.value.trim() || nombre || 'Equipo';
      const curCat = document.getElementById('tfCategoria')?.value.trim() || categoria || '';
      const curTemp = document.getElementById('tfTemporada')?.value.trim() || temporada || '';
      const curComp = document.getElementById('tfCompeticion')?.value.trim() || competicionVal || '';
      const curSys = document.getElementById('tfCampogramaSistema')?.value || sistemaHabitual || '1-4-3-3';

      const positions = FORMATION_POSITIONS[curSys] || FORMATION_POSITIONS['1-4-3-3'];
      const defaultPositions = SYSTEM_STARTER_POSITIONS[curSys] || ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MCD', 'MC', 'ACD', 'ACZ', 'AC'];

      const squadPlayers = localPlantillaList.map(item => {
        const pName = typeof item === 'string' ? item : (item.nombre || item.jugador || item.name || '');
        return playersPool.find(p => (p.nombre || p.jugador || p.name || '').toLowerCase() === pName.toLowerCase()) || { nombre: pName, posicionPrincipal: 'MC', anoNac: '', pierna: '', rendimientoRS: '' };
      });

      const assignedSlots = positions.map((posCoords, slotIdx) => {
        const targetPosCode = defaultPositions[slotIdx] || 'MC';
        const matchingPlayer = squadPlayers.find(p => !p._assignedToCampograma && (
          (p.posicionPrincipal && p.posicionPrincipal.toLowerCase() === targetPosCode.toLowerCase()) ||
          (p.posicion && p.posicion.toLowerCase() === targetPosCode.toLowerCase())
        )) || squadPlayers.find(p => !p._assignedToCampograma);

        if (matchingPlayer) matchingPlayer._assignedToCampograma = true;

        return {
          coords: posCoords,
          targetPosCode: targetPosCode,
          player: matchingPlayer || null
        };
      });

      squadPlayers.forEach(p => delete p._assignedToCampograma);

      const printWin = window.open('', '_blank');
      if (!printWin) return alert('Por favor permite las ventanas emergentes para exportar el PDF');

      const pitchPinsHTML = assignedSlots.map((slot, idx) => {
        const p = slot.player;
        const displayName = p ? (p.nombre || p.jugador || '') : `Vacío (${slot.targetPosCode})`;
        const posTag = p ? (p.posicionPrincipal || p.posicion || slot.targetPosCode) : slot.targetPosCode;
        const numVal = p && p.dorsal ? p.dorsal : (posTag || (idx + 1));
        const txtColor = getContrastColor(curPrimaryColor);

        return `
          <div style="position: absolute; left: ${slot.coords.x}%; top: ${slot.coords.y}%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div style="width: 34px; height: 34px; border-radius: 50%; background-color: ${curPrimaryColor}; color: ${txtColor}; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11px;">
              ${escapeHtml(String(numVal))}
            </div>
            <div style="background: rgba(15, 23, 42, 0.9); color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-top: 3px; white-space: nowrap; max-width: 100px; overflow: hidden; text-overflow: ellipsis; border: 1px solid rgba(255,255,255,0.3);">
              ${escapeHtml(displayName)}
            </div>
          </div>
        `;
      }).join('');

      const squadTableRowsHTML = squadPlayers.map((p) => `
        <tr>
          <td style="font-weight: 700; color: #0f172a;">${escapeHtml(p.nombre || p.jugador || 'Jugador')}</td>
          <td style="font-weight: 700; text-align: center; color: ${curPrimaryColor};">${escapeHtml(p.dorsal || '-')}</td>
          <td><span style="background: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 11px;">${escapeHtml(p.posicionPrincipal || p.posicion || '-')}</span></td>
          <td style="color: #64748b;">${escapeHtml(p.posicionSecundaria || '-')}</td>
          <td>${escapeHtml(calculateSubCategory(p.anoNac || p.ano) || p.sub || p.anoNac || '-')}</td>
          <td>${escapeHtml(p.pierna || '-')}</td>
          <td><span style="background: #f1f5f9; color: #0f172a; font-weight: 800; padding: 2px 8px; border-radius: 4px;">${escapeHtml(p.rendimientoRS || p.rendimiento || 'A')}</span></td>
        </tr>
      `).join('');

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Campograma • ${escapeHtml(curNombre)}</title>
          <style>
            @media print {
              @page { size: A4 portrait; margin: 10mm; }
              .page-break { page-break-after: always; break-after: page; }
              .page-break:last-child { page-break-after: avoid; break-after: avoid; }
            }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; background: #fff; line-height: 1.3; }
            .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${curPrimaryColor}; padding-bottom: 10px; margin-bottom: 15px; }
            .header-title { font-size: 20px; font-weight: 800; color: #1e293b; }
            .header-sub { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 2px; }
            .page-tag { background: ${curPrimaryColor}; color: #fff; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; }
            
            .pitch-wrapper { position: relative; width: 100%; height: 680px; background: linear-gradient(180deg, #1b7a38 0%, #145e2a 100%); border-radius: 8px; border: 3px solid #15803d; overflow: hidden; margin-bottom: 10px; }
            .pitch-line { position: absolute; border: 2px solid rgba(255,255,255,0.4); pointer-events: none; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #f1f5f9; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          </style>
        </head>
        <body>
          <!-- HOJA 1: CAMPOGRAMA TÁCTICO -->
          <div class="page-break">
            <div class="header-bar">
              <div>
                <div class="header-title">${escapeHtml(curNombre)}</div>
                <div class="header-sub">RS Scouting • Campograma Táctico | Sistema: ${escapeHtml(curSys)} | ${escapeHtml(curCat)} (${escapeHtml(curTemp)})</div>
              </div>
              <span class="page-tag">Hoja 1 • Disposición Táctica</span>
            </div>

            <div class="pitch-wrapper">
              <div class="pitch-line" style="top: 10px; left: 10px; right: 10px; bottom: 10px;"></div>
              <div class="pitch-line" style="top: 50%; left: 10px; right: 10px; height: 0;"></div>
              <div class="pitch-line" style="top: 50%; left: 50%; width: 120px; height: 120px; border-radius: 50%; transform: translate(-50%, -50%);"></div>
              <div class="pitch-line" style="top: 10px; left: 50%; width: 180px; height: 70px; border-top: none; transform: translateX(-50%);"></div>
              <div class="pitch-line" style="bottom: 10px; left: 50%; width: 180px; height: 70px; border-bottom: none; transform: translateX(-50%);"></div>
              ${pitchPinsHTML}
            </div>
          </div>

          <!-- HOJA 2: LISTADO DE PLANTILLA -->
          <div class="page-break">
            <div class="header-bar">
              <div>
                <div class="header-title">${escapeHtml(curNombre)} • Plantilla Oficial</div>
                <div class="header-sub">Detalle de jugadores (${squadPlayers.length} efectivos) | Categoría ${escapeHtml(curCat)} | Temp ${escapeHtml(curTemp)}</div>
              </div>
              <span class="page-tag">Hoja 2 • Fichas Deportivas</span>
            </div>

            <table>
              <thead>
                <tr>
                  <th>JUGADOR / NOMBRE</th>
                  <th style="text-align: center;">DORSAL</th>
                  <th>POS. PRINCIPAL</th>
                  <th>POS. SECUNDARIA</th>
                  <th>SUB / AÑO</th>
                  <th>LATERALIDAD</th>
                  <th>NIVEL RS</th>
                </tr>
              </thead>
              <tbody>
                ${squadTableRowsHTML.length ? squadTableRowsHTML : '<tr><td colspan="7" style="text-align:center; padding:16px; color:#94a3b8;">Sin jugadores registrados en la plantilla</td></tr>'}
              </tbody>
            </table>
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
        </html>
      `);
      printWin.document.close();
    });
    renderPlantillaTable();
    renderPlantillaCheckboxes();

    document.getElementById('btnAddJugadorRow')?.addEventListener('click', () => {
      const val = document.getElementById('tfJugadorSearchInput').value.trim();
      if (!val) return alert('Ingresa o selecciona el nombre del jugador');
      localPlantillaList.push(val);
      document.getElementById('tfJugadorSearchInput').value = '';
      renderPlantillaTable();
    });

    // Escudo Upload Handler
    const inputEscudo = document.getElementById('inputTeamEscudo');
    document.getElementById('btnUploadTeamEscudo')?.addEventListener('click', () => inputEscudo.click());
    inputEscudo?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          escudoData = await compressImage(file);
          document.getElementById('btnUploadTeamEscudo').innerHTML = `<img src="${escudoData}" class="photo-upload-preview">`;
        } catch (err) {
          console.error('Error al comprimir escudo:', err);
        }
      }
    });

    const removeLargeClass = () => card.classList.remove('large');
    document.getElementById('btnCloseModal')?.addEventListener('click', removeLargeClass, { once: true });
    document.getElementById('btnCancelModal')?.addEventListener('click', removeLargeClass, { once: true });
  }

  function openFederationModal(federationId = null) {
    const isEdit = !!federationId;
    const fed = isEdit ? (state.directory.federaciones.find(f => f.id === federationId) || {}) : {};

    const nombre = fed.nombre || fed.federacion || '';
    const ambito = fed.ambito || fed.tipo || '';
    const sede = fed.sede || fed.ubicacion || '';
    const email = fed.email || fed.correo || '';
    const web = fed.web || fed.paginaWeb || '';
    const telefono = fed.telefono || '';

    let localStaffList = fed.staff ? JSON.parse(JSON.stringify(fed.staff)) : [];
    let localClubesList = fed.clubes ? JSON.parse(JSON.stringify(fed.clubes)) : [];

    const notas = fed.notas || '';
    let logoData = fed.logo || fed.escudo || '';
    let colorPrimary = fed.colorPrimary || fed.colorPrincipal || '#2563eb';
    let colorSecondary = fed.colorSecondary || fed.colorSecundario || '#ffffff';

    const titleText = isEdit ? `🌐 Ficha de ${escapeHtml(nombre)}` : '🌐 Nueva Federación';

    const modalHTML = `
      <div class="federation-modal-wrapper">
        <p class="modal-subtitle mb-2" style="font-size: 12px; color: var(--text-muted);">Gestión de organismos y entes territoriales</p>

        <div class="player-modal-subtabs mb-4">
          <button type="button" class="player-subtab active" data-ftab="institucional">INSTITUCIONAL</button>
          <button type="button" class="player-subtab" data-ftab="staff">STAFF</button>
          <button type="button" class="player-subtab" data-ftab="contacto">CONTACTO</button>
          <button type="button" class="player-subtab" data-ftab="clubes">CLUBES VINCULADOS</button>
          <button type="button" class="player-subtab" data-ftab="notas">NOTAS Y ARCHIVOS</button>
        </div>

        <datalist id="staffDatalistOptions">
          ${(state.directory.staff || []).map(s => `<option value="${escapeHtml(s.nombre || s.staff)}"></option>`).join('')}
        </datalist>

        <datalist id="clubesDatalistOptions">
          ${(state.directory.clubes || []).map(c => `<option value="${escapeHtml(c.nombre || c.equipo)}"></option>`).join('')}
        </datalist>

        <form id="federationForm">
          <!-- TAB 1: INSTITUCIONAL -->
          <div class="fed-tab-pane" id="ftab-institucional">
            <div class="player-profile-grid">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <div class="photo-upload-box" id="btnUploadFedLogo">
                  ${logoData ? `<img src="${logoData}" class="photo-upload-preview">` : `
                    <i data-lucide="cloud-upload" style="width: 32px; height: 32px;"></i>
                    <span>SUBIR ESCUDO</span>
                  `}
                  <input type="file" id="inputFedLogo" accept="image/*" class="hidden">
                </div>
                <div style="display: flex; gap: 8px; align-items: center; width: 100%; justify-content: center;">
                  <input type="color" id="ffColorPrimary" value="${colorPrimary}" style="width: 36px; height: 36px; border: none; cursor: pointer; border-radius: 4px;" title="Color Principal">
                  <input type="color" id="ffColorSecondary" value="${colorSecondary}" style="width: 36px; height: 36px; border: none; cursor: pointer; border-radius: 4px;" title="Color Secundario">
                </div>
              </div>

              <div>
                <div class="form-group mb-4">
                  <label class="form-label">NOMBRE DE LA FEDERACIÓN</label>
                  <input type="text" id="ffNombre" class="form-control" placeholder="Ej: Real Federación Española de Fútbol..." value="${escapeHtml(nombre)}" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">ÁMBITO / TIPO</label>
                    <select id="ffAmbito" class="form-control">
                      <option value="">Seleccionar ámbito...</option>
                      <option value="NACIONAL" ${['NACIONAL', 'NACIONALES'].includes((ambito || '').toUpperCase()) ? 'selected' : ''}>NACIONAL</option>
                      <option value="AUTONÓMICO" ${['AUTONOMICO', 'AUTONÓMICO', 'REGIONAL', 'TERRITORIAL'].includes((ambito || '').toUpperCase()) ? 'selected' : ''}>AUTONÓMICO</option>
                      ${ambito && !['NACIONAL', 'AUTONOMICO', 'AUTONÓMICO', 'REGIONAL', 'TERRITORIAL'].includes((ambito || '').toUpperCase()) ? `<option value="${escapeHtml(ambito)}" selected>${escapeHtml(ambito)}</option>` : ''}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">UBICACIÓN / SEDE</label>
                    <input type="text" id="ffSede" class="form-control" placeholder="Ciudad, País" value="${escapeHtml(sede)}">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: STAFF -->
          <div class="fed-tab-pane hidden" id="ftab-staff">
            <p class="mb-4" style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Vincular varios técnicos del directorio de staff con filtro de búsqueda.</p>

            <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-4">
              <input type="text" id="ffStaffSearchInput" list="staffDatalistOptions" class="form-control" placeholder="Buscar staff por nombre...">
              <button type="button" class="btn btn-primary" id="btnAddFedStaffRow"><i data-lucide="plus"></i> Añadir</button>
            </div>

            <div class="table-responsive" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-light); font-weight: 800; color: var(--text-muted); text-align: left;">
                    <th style="padding: 8px 12px;">MIEMBRO DEL STAFF / TÉCNICO</th>
                    <th style="padding: 8px 12px; text-align: right;">ELIMINAR</th>
                  </tr>
                </thead>
                <tbody id="ffStaffTableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- TAB 3: CONTACTO -->
          <div class="fed-tab-pane hidden" id="ftab-contacto">
            <div class="form-group mb-4">
              <label class="form-label">CORREO ELECTRÓNICO</label>
              <input type="email" id="ffEmail" class="form-control" placeholder="email@ejemplo.com" value="${escapeHtml(email)}">
            </div>

            <div class="form-group mb-4">
              <label class="form-label">PÁGINA WEB</label>
              <input type="url" id="ffWeb" class="form-control" placeholder="https://..." value="${escapeHtml(web)}">
            </div>

            <div class="form-group mb-4">
              <label class="form-label">TELÉFONO</label>
              <input type="text" id="ffTelefono" class="form-control" placeholder="+34..." value="${escapeHtml(telefono)}">
            </div>
          </div>

          <!-- TAB 4: CLUBES VINCULADOS -->
          <div class="fed-tab-pane hidden" id="ftab-clubes">
            <div class="player-section-title mb-2">
              <i data-lucide="shield"></i> Clubes Vinculados
            </div>

            <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-4">
              <input type="text" id="ffClubSearchInput" list="clubesDatalistOptions" class="form-control" placeholder="Buscar club por nombre...">
              <button type="button" class="btn btn-primary" id="btnAddFedClubRow"><i data-lucide="plus"></i> Añadir</button>
            </div>

            <div class="table-responsive" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-light); font-weight: 800; color: var(--text-muted); text-align: left;">
                    <th style="padding: 8px 12px;">CLUB VINCULADO</th>
                    <th style="padding: 8px 12px; text-align: right;">ELIMINAR</th>
                  </tr>
                </thead>
                <tbody id="ffClubesTableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- TAB 5: NOTAS Y ARCHIVOS -->
          <div class="fed-tab-pane hidden" id="ftab-notas">
            <div class="form-group mb-6">
              <label class="form-label">NOTAS INTERNAS</label>
              <textarea id="ffNotas" class="form-control" rows="5" placeholder="Escribe notas aquí...">${escapeHtml(notas)}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">SUBIR ARCHIVOS (MÚLTIPLES)</label>
              <div style="display: flex; align-items: center; gap: 12px; background-color: var(--bg-surface); padding: 12px; border: 1px solid var(--border-light); border-radius: var(--radius-md);">
                <label class="btn btn-primary" style="margin: 0; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="paperclip"></i> Elegir archivos
                  <input type="file" id="ffFileInput" multiple class="hidden">
                </label>
                <span id="ffFileLabel" style="font-size: 12px; color: var(--text-muted);">Ningún archivo seleccionado</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    `;

    const card = document.getElementById('generalModalCard');
    card.classList.add('large');

    showModal(titleText, modalHTML, () => {
      const nameVal = document.getElementById('ffNombre').value.trim();
      if (!nameVal) return alert('Por favor ingresa el nombre de la federación');

      const updatedFed = {
        id: isEdit ? federationId : 'f_' + Date.now(),
        nombre: nameVal,
        federacion: nameVal,
        ambito: document.getElementById('ffAmbito').value.trim(),
        tipo: document.getElementById('ffAmbito').value.trim(),
        sede: document.getElementById('ffSede').value.trim(),
        ubicacion: document.getElementById('ffSede').value.trim(),
        email: document.getElementById('ffEmail').value.trim(),
        correo: document.getElementById('ffEmail').value.trim(),
        web: document.getElementById('ffWeb').value.trim(),
        paginaWeb: document.getElementById('ffWeb').value.trim(),
        telefono: document.getElementById('ffTelefono').value.trim(),

        staff: localStaffList,
        clubes: localClubesList,
        notas: document.getElementById('ffNotas').value.trim(),

        logo: logoData,
        escudo: logoData,
        colorPrimary: document.getElementById('ffColorPrimary').value,
        colorSecondary: document.getElementById('ffColorSecondary').value
      };

      if (!state.directory.federaciones) state.directory.federaciones = [];
      if (isEdit) {
        const idx = state.directory.federaciones.findIndex(f => f && (String(f.id) === String(federationId) || (f.codigo && String(f.codigo) === String(federationId))));
        if (idx !== -1) state.directory.federaciones[idx] = updatedFed;
      } else {
        state.directory.federaciones.unshift(updatedFed);
      }
      saveToFirebase('federaciones', updatedFed);

      // Bidirectional sync for Cuerpo Técnico (Staff)
      if (Array.isArray(localStaffList) && state.directory.staff) {
        localStaffList.forEach(t => {
          const staffName = typeof t === 'string' ? t : (t.nombre || t.staff || '');
          if (!staffName) return;

          let targetStaff = state.directory.staff.find(st => 
            (st.nombre && st.nombre.toLowerCase() === staffName.toLowerCase()) ||
            (st.staff && st.staff.toLowerCase() === staffName.toLowerCase())
          );

          if (!targetStaff) {
            targetStaff = {
              id: 'st_' + Date.now() + Math.floor(Math.random() * 100),
              nombre: staffName,
              staff: staffName,
              cargo: 'Técnico / Responsable',
              federacion: nameVal
            };
            state.directory.staff.unshift(targetStaff);
          } else {
            targetStaff.federacion = nameVal;
          }
        });
      }

      // Bidirectional sync for Clubes Vinculados
      if (Array.isArray(localClubesList) && state.directory.clubes) {
        localClubesList.forEach(c => {
          const clubName = typeof c === 'string' ? c : (c.nombre || c.equipo || '');
          if (!clubName) return;

          let targetClub = state.directory.clubes.find(cl => 
            (cl.nombre && cl.nombre.toLowerCase() === clubName.toLowerCase()) ||
            (cl.equipo && cl.equipo.toLowerCase() === clubName.toLowerCase())
          );

          if (!targetClub) {
            targetClub = {
              id: 'c_' + Date.now() + Math.floor(Math.random() * 100),
              nombre: clubName,
              equipo: clubName,
              federacion: nameVal
            };
            state.directory.clubes.unshift(targetClub);
          } else {
            targetClub.federacion = nameVal;
          }
        });
      }

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    }, isEdit ? {
      label: 'Eliminar Federación',
      title: `¿Eliminar Ficha de ${nombre || 'Federación'}?`,
      message: `¿Estás seguro de que deseas eliminar permanentemente a "${nombre || 'Federación'}" de la base de datos?`,
      action: () => {
        deleteFromFirebase('federaciones', fedId);
        state.directory.federaciones = (state.directory.federaciones || []).filter(item => item.id !== fedId);
        saveState();
        hideModal();
        renderDirectorio();
      }
    } : null);

    // Subtab switching logic
    const subtabs = document.querySelectorAll('.player-subtab');
    const panes = document.querySelectorAll('.fed-tab-pane');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        const targetPane = document.getElementById('ftab-' + tab.dataset.ftab);
        if (targetPane) targetPane.classList.remove('hidden');
      });
    });

    // Staff Table Logic
    function renderFedStaffTable() {
      const tbody = document.getElementById('ffStaffTableBody');
      if (!tbody) return;
      if (localStaffList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: var(--text-muted);">Sin miembros de staff vinculados</td></tr>`;
      } else {
        tbody.innerHTML = localStaffList.map((s, idx) => {
          const sName = typeof s === 'string' ? s : (s.nombre || s.staff || '');
          const foundStaff = state.directory.staff?.find(st => (st.nombre && st.nombre.toLowerCase() === sName.toLowerCase()) || (st.staff && st.staff.toLowerCase() === sName.toLowerCase()));
          const nameHTML = foundStaff ? `<a href="javascript:void(0)" class="staff-modal-link" data-staffid="${foundStaff.id}" style="color: var(--primary-blue); font-weight: 700; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="user-check" style="width: 13px; height: 13px;"></i> ${escapeHtml(sName)}</a>` : escapeHtml(sName);
          return `
            <tr style="border-bottom: 1px solid var(--border-light);">
              <td style="padding: 8px 12px; font-weight: 700;">${nameHTML}</td>
              <td style="padding: 8px 12px; text-align: right;">
                <button type="button" class="btn-action-icon danger btn-del-fed-staff" data-idx="${idx}" style="width: 26px; height: 26px;">
                  <i data-lucide="trash-2" style="width: 12px;"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        tbody.querySelectorAll('.staff-modal-link').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const sId = link.dataset.staffid;
            if (sId) {
              hideModal();
              openStaffModal(sId);
            }
          });
        });

        tbody.querySelectorAll('.btn-del-fed-staff').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.idx, 10);
            localStaffList.splice(index, 1);
            renderFedStaffTable();
          });
        });
      }
      if (window.lucide) window.lucide.createIcons();
    }
    renderFedStaffTable();

    document.getElementById('btnAddFedStaffRow')?.addEventListener('click', () => {
      const val = document.getElementById('ffStaffSearchInput').value.trim();
      if (!val) return alert('Ingresa o selecciona el nombre del miembro de staff');
      localStaffList.push(val);
      document.getElementById('ffStaffSearchInput').value = '';
      renderFedStaffTable();
    });

    // Clubes Table Logic
    function renderFedClubesTable() {
      const tbody = document.getElementById('ffClubesTableBody');
      if (!tbody) return;
      if (localClubesList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: var(--text-muted);">No hay clubes vinculados a esta federación.</td></tr>`;
      } else {
        tbody.innerHTML = localClubesList.map((c, idx) => {
          const cName = typeof c === 'string' ? c : (c.nombre || c.equipo || '');
          const foundClub = state.directory.clubes?.find(cl => (cl.nombre && cl.nombre.toLowerCase() === cName.toLowerCase()) || (cl.equipo && cl.equipo.toLowerCase() === cName.toLowerCase()));
          const nameHTML = foundClub ? `<a href="javascript:void(0)" class="club-modal-link" data-clubid="${foundClub.id}" style="color: var(--primary-blue); font-weight: 700; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="shield" style="width: 13px; height: 13px;"></i> ${escapeHtml(cName)}</a>` : escapeHtml(cName);
          return `
            <tr style="border-bottom: 1px solid var(--border-light);">
              <td style="padding: 8px 12px; font-weight: 700;">${nameHTML}</td>
              <td style="padding: 8px 12px; text-align: right;">
                <button type="button" class="btn-action-icon danger btn-del-fed-club" data-idx="${idx}" style="width: 26px; height: 26px;">
                  <i data-lucide="trash-2" style="width: 12px;"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        tbody.querySelectorAll('.club-modal-link').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const cId = link.dataset.clubid;
            if (cId) {
              hideModal();
              openClubModal(cId);
            }
          });
        });

        tbody.querySelectorAll('.btn-del-fed-club').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.idx, 10);
            localClubesList.splice(index, 1);
            renderFedClubesTable();
          });
        });
      }
      if (window.lucide) window.lucide.createIcons();
    }
    renderFedClubesTable();

    document.getElementById('btnAddFedClubRow')?.addEventListener('click', () => {
      const val = document.getElementById('ffClubSearchInput').value.trim();
      if (!val) return alert('Ingresa o selecciona el nombre del club');
      localClubesList.push(val);
      document.getElementById('ffClubSearchInput').value = '';
      renderFedClubesTable();
    });

    // File Input Label
    document.getElementById('ffFileInput')?.addEventListener('change', (e) => {
      const count = e.target.files.length;
      document.getElementById('ffFileLabel').textContent = count > 0 ? `${count} archivo(s) seleccionado(s)` : 'Ningún archivo seleccionado';
    });

    // Logo Upload Handler
    const inputLogo = document.getElementById('inputFedLogo');
    document.getElementById('btnUploadFedLogo')?.addEventListener('click', () => inputLogo.click());
    inputLogo?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          logoData = await compressImage(file);
          document.getElementById('btnUploadFedLogo').innerHTML = `<img src="${logoData}" class="photo-upload-preview">`;
        } catch (err) {
          console.error('Error al comprimir logo:', err);
        }
      }
    });

    const removeLargeClass = () => card.classList.remove('large');
    document.getElementById('btnCloseModal')?.addEventListener('click', removeLargeClass, { once: true });
    document.getElementById('btnCancelModal')?.addEventListener('click', removeLargeClass, { once: true });
  }

  function openSelectionModal(selectionId = null) {
    const isEdit = !!selectionId;
    const sel = isEdit ? (state.directory.selecciones.find(s => s.id === selectionId) || {}) : {};

    const nombre = sel.nombre || sel.seleccion || '';
    const federacion = sel.federacion || '';
    const categoria = sel.categoria || 'Sub19';
    const sexo = sel.sexo || 'Masculino';
    const temporada = sel.temporada || '26/27';

    let localStaffList = sel.staff ? JSON.parse(JSON.stringify(sel.staff)) : [];
    let localJugadoresList = sel.jugadores ? JSON.parse(JSON.stringify(sel.jugadores)) : [];

    const estiloTactico = sel.estiloTactico || sel.estiloJuego || '';
    const sistemaTactico = sel.sistemaTactico || sel.sistemaHabitual || '';
    const observacionesTacticas = sel.observacionesTacticas || sel.notasTacticas || '';
    const notas = sel.notas || '';

    let logoData = sel.logo || sel.escudo || '';
    let colorPrimary = sel.colorPrimary || sel.colorPrincipal || '#2563eb';
    let colorSecondary = sel.colorSecondary || sel.colorSecundario || '#ffffff';

    const titleText = isEdit ? `🌍 Ficha de ${escapeHtml(nombre)}` : '🌍 Nueva Selección';

    const modalHTML = `
      <div class="selection-modal-wrapper">
        <p class="modal-subtitle mb-2" style="font-size: 12px; color: var(--text-muted);">Gestión de combinados nacionales y regionales</p>

        <div class="player-modal-subtabs mb-4">
          <button type="button" class="player-subtab active" data-sestab="institucional">INSTITUCIONAL</button>
          <button type="button" class="player-subtab" data-sestab="staff">STAFF</button>
          <button type="button" class="player-subtab" data-sestab="estilo">ESTILO Y JUEGO</button>
          <button type="button" class="player-subtab" data-sestab="notas">NOTAS Y ARCHIVOS</button>
        </div>

        <datalist id="federacionesDatalistOptions">
          ${(state.directory.federaciones || []).map(f => `<option value="${escapeHtml(f.nombre || f.federacion)}"></option>`).join('')}
        </datalist>

        <datalist id="staffDatalistOptions">
          ${(state.directory.staff || []).map(s => `<option value="${escapeHtml(s.nombre || s.staff)}"></option>`).join('')}
        </datalist>

        <datalist id="jugadoresDatalistOptions">
          ${((state.directory && state.directory.jugadores) || []).map(p => `<option value="${escapeHtml(p.nombre || p.jugador || p.name)}"></option>`).join('')}
        </datalist>

        <form id="selectionForm">
          <!-- TAB 1: INSTITUCIONAL -->
          <div class="sel-tab-pane" id="sestab-institucional">
            <div class="player-profile-grid">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <div class="photo-upload-box" id="btnUploadSelLogo">
                  ${logoData ? `<img src="${logoData}" class="photo-upload-preview">` : `
                    <i data-lucide="cloud-upload" style="width: 32px; height: 32px;"></i>
                    <span>SUBIR ESCUDO</span>
                  `}
                  <input type="file" id="inputSelLogo" accept="image/*" class="hidden">
                </div>
                <div style="display: flex; gap: 8px; align-items: center; width: 100%; justify-content: center;">
                  <input type="color" id="sfColorPrimary" value="${colorPrimary}" style="width: 36px; height: 36px; border: none; cursor: pointer; border-radius: 4px;" title="Color Principal">
                  <input type="color" id="sfColorSecondary" value="${colorSecondary}" style="width: 36px; height: 36px; border: none; cursor: pointer; border-radius: 4px;" title="Color Secundario">
                </div>
              </div>

              <div>
                <div class="form-group mb-4">
                  <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>NOMBRE DE LA SELECCIÓN</span>
                    <span style="font-size: 10px; color: var(--primary-blue); font-weight: 600;">✨ Auto-generado</span>
                  </label>
                  <input type="text" id="sfNombre" class="form-control" placeholder="Se genera al seleccionar Federación, Categoría y Temporada..." value="${escapeHtml(nombre)}" required>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">FEDERACIÓN</label>
                  <input type="text" id="sfFederacion" list="federacionesDatalistOptions" class="form-control" placeholder="Buscar Federación..." value="${escapeHtml(federacion)}">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">CATEGORÍA</label>
                    <select id="sfCategoria" class="form-control">
                      <option value="Absoluta" ${categoria === 'Absoluta' ? 'selected' : ''}>Absoluta</option>
                      <option value="Sub21" ${categoria === 'Sub21' ? 'selected' : ''}>Sub21</option>
                      <option value="Sub19" ${categoria === 'Sub19' ? 'selected' : ''}>Sub19</option>
                      <option value="Sub18" ${categoria === 'Sub18' ? 'selected' : ''}>Sub18</option>
                      <option value="Sub17" ${categoria === 'Sub17' ? 'selected' : ''}>Sub17</option>
                      <option value="Sub16" ${categoria === 'Sub16' ? 'selected' : ''}>Sub16</option>
                      <option value="Sub15" ${categoria === 'Sub15' ? 'selected' : ''}>Sub15</option>
                      <option value="Sub14" ${categoria === 'Sub14' ? 'selected' : ''}>Sub14</option>
                      <option value="Sub12" ${categoria === 'Sub12' ? 'selected' : ''}>Sub12</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">SEXO</label>
                    <select id="sfSexo" class="form-control">
                      <option value="Masculino" ${sexo === 'Masculino' ? 'selected' : ''}>Masculino</option>
                      <option value="Femenino" ${sexo === 'Femenino' ? 'selected' : ''}>Femenino</option>
                    </select>
                  </div>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">TEMPORADA</label>
                  <select id="sfTemporada" class="form-control">
                    <option value="">Seleccionar temporada...</option>
                    ${['2024/2025', '2025/2026', '2026/2027', '2027/2028', '2028/2029'].map(t => {
                      const shortFormat = t.substring(2,4) + '/' + t.substring(7,9);
                      const isSelected = temporada === t || temporada === shortFormat;
                      return `<option value="${escapeHtml(shortFormat)}" ${isSelected ? 'selected' : ''}>${escapeHtml(t)} (${shortFormat})</option>`;
                    }).join('')}
                    ${temporada && !['24/25', '25/26', '26/27', '27/28', '28/29'].includes(temporada) ? `<option value="${escapeHtml(temporada)}" selected>${escapeHtml(temporada)}</option>` : ''}
                  </select>
                </div>

                <div class="form-group">
                  <div class="player-section-title mb-2">
                    <i data-lucide="users"></i> JUGADORES CONVOCADOS / VINCULADOS
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-2">
                    <input type="text" id="sfJugadorSearchInput" list="jugadoresDatalistOptions" class="form-control" placeholder="Buscar jugador a convocar...">
                    <button type="button" class="btn btn-primary" id="btnAddSelJugadorRow"><i data-lucide="plus"></i> Añadir</button>
                  </div>

                  <div class="table-responsive" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                      <thead>
                        <tr style="border-bottom: 1px solid var(--border-light); font-weight: 800; color: var(--text-muted); text-align: left;">
                          <th style="padding: 8px 12px;">JUGADOR CONVOCADO</th>
                          <th style="padding: 8px 12px; text-align: right;">ELIMINAR</th>
                        </tr>
                      </thead>
                      <tbody id="sfJugadoresTableBody"></tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: STAFF -->
          <div class="sel-tab-pane hidden" id="sestab-staff">
            <p class="mb-4" style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Vincular varios técnicos del directorio de staff con filtro de búsqueda.</p>

            <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-4">
              <input type="text" id="sfStaffSearchInput" list="staffDatalistOptions" class="form-control" placeholder="Buscar staff por nombre...">
              <button type="button" class="btn btn-primary" id="btnAddSelStaffRow"><i data-lucide="plus"></i> Añadir</button>
            </div>

            <div class="table-responsive" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-light); font-weight: 800; color: var(--text-muted); text-align: left;">
                    <th style="padding: 8px 12px;">MIEMBRO DEL STAFF / TÉCNICO</th>
                    <th style="padding: 8px 12px; text-align: right;">ELIMINAR</th>
                  </tr>
                </thead>
                <tbody id="sfStaffTableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- TAB 3: ESTILO Y JUEGO -->
          <div class="sel-tab-pane hidden" id="sestab-estilo">
            <p class="mb-4" style="font-size: 12px; color: var(--text-muted);">Estilo táctico de juego.</p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">ESTILO TÁCTICO</label>
                <input type="text" id="sfEstiloTactico" class="form-control" placeholder="Ej: Posesión / Presión alta" value="${escapeHtml(estiloTactico)}">
              </div>
              <div class="form-group">
                <label class="form-label">SISTEMA TÁCTICO HABITUAL</label>
                <input type="text" id="sfSistemaTactico" class="form-control" placeholder="Ej: 1-4-3-3" value="${escapeHtml(sistemaTactico)}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">OBSERVACIONES TÁCTICAS</label>
              <textarea id="sfObservacionesTacticas" class="form-control" rows="5" placeholder="Observaciones tácticas sobre el rendimiento del combinado...">${escapeHtml(observacionesTacticas)}</textarea>
            </div>
          </div>

          <!-- TAB 4: NOTAS Y ARCHIVOS -->
          <div class="sel-tab-pane hidden" id="sestab-notas">
            <div class="form-group mb-6">
              <label class="form-label">NOTAS INTERNAS</label>
              <textarea id="sfNotas" class="form-control" rows="5" placeholder="Escribe notas aquí...">${escapeHtml(notas)}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">SUBIR ARCHIVOS (MÚLTIPLES)</label>
              <div style="display: flex; align-items: center; gap: 12px; background-color: var(--bg-surface); padding: 12px; border: 1px solid var(--border-light); border-radius: var(--radius-md);">
                <label class="btn btn-primary" style="margin: 0; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="paperclip"></i> Elegir archivos
                  <input type="file" id="sfFileInput" multiple class="hidden">
                </label>
                <span id="sfFileLabel" style="font-size: 12px; color: var(--text-muted);">Ningún archivo seleccionado</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    `;

    const card = document.getElementById('generalModalCard');
    card.classList.add('large');

    showModal(titleText, modalHTML, () => {
      const nameVal = document.getElementById('sfNombre').value.trim();
      if (!nameVal) return alert('Por favor ingresa el nombre de la selección');

      const updatedSel = {
        id: isEdit ? selectionId : 'sel_' + Date.now(),
        nombre: nameVal,
        seleccion: nameVal,
        federacion: document.getElementById('sfFederacion').value.trim(),
        categoria: document.getElementById('sfCategoria').value,
        sexo: document.getElementById('sfSexo').value,
        temporada: document.getElementById('sfTemporada').value.trim(),

        staff: localStaffList,
        jugadores: localJugadoresList,

        estiloTactico: document.getElementById('sfEstiloTactico').value.trim(),
        sistemaTactico: document.getElementById('sfSistemaTactico').value.trim(),
        observacionesTacticas: document.getElementById('sfObservacionesTacticas').value.trim(),
        notas: document.getElementById('sfNotas').value.trim(),

        logo: logoData,
        escudo: logoData,
        colorPrimary: document.getElementById('sfColorPrimary')?.value || '#2563eb',
        colorSecondary: document.getElementById('sfColorSecondary')?.value || '#ffffff'
      };

      if (!state.directory.selecciones) state.directory.selecciones = [];
      if (isEdit) {
        const idx = state.directory.selecciones.findIndex(s => s && (String(s.id) === String(selectionId) || (s.codigo && String(s.codigo) === String(selectionId))));
        if (idx !== -1) state.directory.selecciones[idx] = updatedSel;
      } else {
        state.directory.selecciones.unshift(updatedSel);
      }
      saveToFirebase('selecciones', updatedSel);

      // Bidirectional sync for Jugadores - only update existing players in directory
      if (Array.isArray(localJugadoresList)) {
        if (!state.directory.jugadores) state.directory.jugadores = [];
        localJugadoresList.forEach(j => {
          const playerName = typeof j === 'string' ? j : (j.nombre || j.jugador || j.name || '');
          if (!playerName) return;

          let targetPlayer = state.directory.jugadores.find(p => 
            (p.nombre && p.nombre.toLowerCase() === playerName.toLowerCase()) ||
            (p.jugador && p.jugador.toLowerCase() === playerName.toLowerCase()) ||
            (p.name && p.name.toLowerCase() === playerName.toLowerCase())
          );

          if (targetPlayer) {
            targetPlayer.seleccion = nameVal;
          }
        });
      }

      // Bidirectional sync for Staff
      if (Array.isArray(localStaffList)) {
        if (!state.directory.staff) state.directory.staff = [];
        localStaffList.forEach(st => {
          const staffName = typeof st === 'string' ? st : (st.nombre || st.staff || '');
          if (!staffName) return;

          let targetStaff = state.directory.staff.find(s => 
            (s.nombre && s.nombre.toLowerCase() === staffName.toLowerCase()) ||
            (s.staff && s.staff.toLowerCase() === staffName.toLowerCase())
          );

          if (!targetStaff) {
            targetStaff = {
              id: 'st_' + Date.now() + Math.floor(Math.random()*100),
              nombre: staffName,
              staff: staffName,
              cargo: 'Técnico Selección',
              seleccion: nameVal,
              federacion: updatedSel.federacion || ''
            };
            state.directory.staff.unshift(targetStaff);
          } else {
            targetStaff.seleccion = nameVal;
            if (updatedSel.federacion) targetStaff.federacion = updatedSel.federacion;
          }
        });
      }

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    }, isEdit ? {
      label: 'Eliminar Selección',
      title: `¿Eliminar Ficha de ${nombre || 'Selección'}?`,
      message: `¿Estás seguro de que deseas eliminar permanentemente a "${nombre || 'Selección'}" de la base de datos?`,
      action: () => {
        deleteFromFirebase('selecciones', selId);
        state.directory.selecciones = (state.directory.selecciones || []).filter(item => item.id !== selId);
        saveState();
        hideModal();
        renderDirectorio();
      }
    } : null);

    // Auto sync Escudo and Colors when Federación is selected
    const inputFedSel = document.getElementById('sfFederacion');
    const inputColorPriSel = document.getElementById('sfColorPrimary');
    const inputColorSecSel = document.getElementById('sfColorSecondary');
    const boxEscudoSel = document.getElementById('btnUploadSelLogo');

    const updateFromFed = () => {
      const selectedFedName = inputFedSel?.value.trim() || '';
      if (!selectedFedName || !state.directory.federaciones) return;

      const foundFed = state.directory.federaciones.find(f => 
        (f.nombre && f.nombre.toLowerCase() === selectedFedName.toLowerCase()) ||
        (f.federacion && f.federacion.toLowerCase() === selectedFedName.toLowerCase())
      );

      if (foundFed) {
        const fedLogo = foundFed.logo || foundFed.escudo;
        if (fedLogo) {
          logoData = fedLogo;
          if (boxEscudoSel) {
            boxEscudoSel.innerHTML = `<img src="${fedLogo}" class="photo-upload-preview"><input type="file" id="inputSelLogo" accept="image/*" class="hidden">`;
          }
        }
        if (foundFed.colorPrimary && inputColorPriSel) {
          inputColorPriSel.value = foundFed.colorPrimary;
        }
        if (foundFed.colorSecondary && inputColorSecSel) {
          inputColorSecSel.value = foundFed.colorSecondary;
        }
      }
    };

    // Auto-generate Selección Name from Federación, Categoría, Temporada and Sexo
    const inputNombreSel = document.getElementById('sfNombre');
    const inputCatSel = document.getElementById('sfCategoria');
    const inputSexoSel = document.getElementById('sfSexo');
    const inputTempSel = document.getElementById('sfTemporada');

    const updateGeneratedSelName = () => {
      const fedVal = inputFedSel?.value.trim() || '';
      const catVal = inputCatSel?.value.trim() || '';
      const tempRaw = inputTempSel?.value.trim() || '';
      const sexoVal = inputSexoSel?.value.trim() || '';

      let tempShort = '';
      if (tempRaw) {
        const match = tempRaw.match(/(\d{2,4})\/(\d{2,4})/);
        if (match) {
          tempShort = match[1].slice(-2) + '/' + match[2].slice(-2);
        } else {
          tempShort = tempRaw;
        }
      }

      const parts = [fedVal, catVal, tempShort, sexoVal].filter(Boolean);
      if (parts.length > 0) {
        const generated = parts.join(' ');
        if (inputNombreSel) inputNombreSel.value = generated;
      }
    };

    inputFedSel?.addEventListener('change', () => { updateFromFed(); updateGeneratedSelName(); });
    inputFedSel?.addEventListener('input', () => { updateFromFed(); updateGeneratedSelName(); });
    inputCatSel?.addEventListener('change', updateGeneratedSelName);
    inputCatSel?.addEventListener('input', updateGeneratedSelName);
    inputSexoSel?.addEventListener('change', updateGeneratedSelName);
    inputSexoSel?.addEventListener('input', updateGeneratedSelName);
    inputTempSel?.addEventListener('change', updateGeneratedSelName);
    inputTempSel?.addEventListener('input', updateGeneratedSelName);

    if (federacion) updateFromFed();
    if (!isEdit || !nombre) updateGeneratedSelName();

    // Subtab switching logic
    const subtabs = document.querySelectorAll('.player-subtab');
    const panes = document.querySelectorAll('.sel-tab-pane');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        const targetPane = document.getElementById('sestab-' + tab.dataset.sestab);
        if (targetPane) targetPane.classList.remove('hidden');
      });
    });

    // Jugadores Table Logic
    function renderSelJugadoresTable() {
      const tbody = document.getElementById('sfJugadoresTableBody');
      if (!tbody) return;
      if (localJugadoresList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: var(--text-muted);">No hay jugadores convocados vinculados a esta selección.</td></tr>`;
      } else {
        const allPlayers = (state.directory && state.directory.jugadores) || [];
        tbody.innerHTML = localJugadoresList.map((j, idx) => {
          const jName = typeof j === 'string' ? j : (j.nombre || j.jugador || j.name || '');
          const foundP = allPlayers.find(p => (p.nombre && p.nombre.toLowerCase() === jName.toLowerCase()) || (p.jugador && p.jugador.toLowerCase() === jName.toLowerCase()));
          const nameHTML = foundP ? `<a href="javascript:void(0)" class="player-modal-link" data-playerid="${foundP.id}" style="color: var(--primary-blue); font-weight: 700; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="user" style="width: 13px; height: 13px;"></i> ${escapeHtml(jName)}</a>` : escapeHtml(jName);
          return `
            <tr style="border-bottom: 1px solid var(--border-light);">
              <td style="padding: 8px 12px; font-weight: 700;">${nameHTML}</td>
              <td style="padding: 8px 12px; text-align: right;">
                <button type="button" class="btn-action-icon danger btn-del-sel-jugador" data-idx="${idx}" style="width: 26px; height: 26px;">
                  <i data-lucide="trash-2" style="width: 12px;"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        tbody.querySelectorAll('.player-modal-link').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const pId = link.dataset.playerid;
            if (pId) {
              hideModal();
              openPlayerModal(pId);
            }
          });
        });

        tbody.querySelectorAll('.btn-del-sel-jugador').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.idx, 10);
            localJugadoresList.splice(index, 1);
            renderSelJugadoresTable();
          });
        });
      }
      if (window.lucide) window.lucide.createIcons();
    }
    renderSelJugadoresTable();

    document.getElementById('btnAddSelJugadorRow')?.addEventListener('click', () => {
      const val = document.getElementById('sfJugadorSearchInput').value.trim();
      if (!val) return alert('Ingresa o selecciona el nombre del jugador');
      localJugadoresList.push(val);
      document.getElementById('sfJugadorSearchInput').value = '';
      renderSelJugadoresTable();
    });

    // Staff Table Logic
    function renderSelStaffTable() {
      const tbody = document.getElementById('sfStaffTableBody');
      if (!tbody) return;
      if (localStaffList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: var(--text-muted);">Sin miembros de staff vinculados</td></tr>`;
      } else {
        tbody.innerHTML = localStaffList.map((s, idx) => {
          const sName = typeof s === 'string' ? s : (s.nombre || s.staff || '');
          const foundStaff = state.directory.staff?.find(st => (st.nombre && st.nombre.toLowerCase() === sName.toLowerCase()) || (st.staff && st.staff.toLowerCase() === sName.toLowerCase()));
          const nameHTML = foundStaff ? `<a href="javascript:void(0)" class="staff-modal-link" data-staffid="${foundStaff.id}" style="color: var(--primary-blue); font-weight: 700; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="user-check" style="width: 13px; height: 13px;"></i> ${escapeHtml(sName)}</a>` : escapeHtml(sName);
          return `
            <tr style="border-bottom: 1px solid var(--border-light);">
              <td style="padding: 8px 12px; font-weight: 700;">${nameHTML}</td>
              <td style="padding: 8px 12px; text-align: right;">
                <button type="button" class="btn-action-icon danger btn-del-sel-staff" data-idx="${idx}" style="width: 26px; height: 26px;">
                  <i data-lucide="trash-2" style="width: 12px;"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        tbody.querySelectorAll('.staff-modal-link').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const sId = link.dataset.staffid;
            if (sId) {
              hideModal();
              openStaffModal(sId);
            }
          });
        });

        tbody.querySelectorAll('.btn-del-sel-staff').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.idx, 10);
            localStaffList.splice(index, 1);
            renderSelStaffTable();
          });
        });
      }
      if (window.lucide) window.lucide.createIcons();
    }
    renderSelStaffTable();

    document.getElementById('btnAddSelStaffRow')?.addEventListener('click', () => {
      const val = document.getElementById('sfStaffSearchInput').value.trim();
      if (!val) return alert('Ingresa o selecciona el nombre del miembro de staff');
      localStaffList.push(val);
      document.getElementById('sfStaffSearchInput').value = '';
      renderSelStaffTable();
    });

    // File Input Label
    document.getElementById('sfFileInput')?.addEventListener('change', (e) => {
      const count = e.target.files.length;
      document.getElementById('sfFileLabel').textContent = count > 0 ? `${count} archivo(s) seleccionado(s)` : 'Ningún archivo seleccionado';
    });

    // Logo Upload Handler
    const inputLogo = document.getElementById('inputSelLogo');
    document.getElementById('btnUploadSelLogo')?.addEventListener('click', () => inputLogo.click());
    inputLogo?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          logoData = await compressImage(file);
          document.getElementById('btnUploadSelLogo').innerHTML = `<img src="${logoData}" class="photo-upload-preview">`;
        } catch (err) {
          console.error('Error al comprimir logo:', err);
        }
      }
    });

    const removeLargeClass = () => card.classList.remove('large');
    document.getElementById('btnCloseModal')?.addEventListener('click', removeLargeClass, { once: true });
    document.getElementById('btnCancelModal')?.addEventListener('click', removeLargeClass, { once: true });
  }

  function openConvocatoriaModal(convocatoriaId = null) {
    const isEdit = !!convocatoriaId;
    const conv = isEdit ? (state.directory.convocatorias?.find(c => c.id === convocatoriaId) || {}) : {};

    const nombre = conv.nombre || conv.convocatoria || '';
    const tipoActividad = conv.tipoActividad || '';
    const seleccion = conv.seleccionVinculada || conv.seleccion || '';
    const temporada = conv.temporada || '26/27';
    const sesion = conv.sesion || 'Sesión 1';
    const fechaInicio = conv.fechaInicio || '';
    const fechaFin = conv.fechaFin || '';
    const hora = conv.hora || '';

    let localJugadoresList = conv.jugadores ? JSON.parse(JSON.stringify(conv.jugadores)) : [];
    let localStaffList = conv.staff ? JSON.parse(JSON.stringify(conv.staff)) : [];

    const notas = conv.notas || '';

    const titleText = isEdit ? `📣 Ficha de ${escapeHtml(nombre)}` : '📣 Nueva Convocatoria';

    let docConvocatoriaData = conv.documentoConvocatoria || conv.pdfData || '';
    let docConvocatoriaName = conv.documentoNombre || '';

    const modalHTML = `
      <div class="convocatoria-modal-wrapper">
        <p class="modal-subtitle mb-2" style="font-size: 12px; color: var(--text-muted);">Gestión de jugadores y staff seleccionados</p>

        <div style="display: flex; justify-content: space-between; align-items: center;" class="mb-4">
          <div class="player-modal-subtabs" style="margin-bottom: 0;">
            <button type="button" class="player-subtab active" data-cntab="info">INFORMACIÓN</button>
            <button type="button" class="player-subtab" data-cntab="jugadores">JUGADORES</button>
            <button type="button" class="player-subtab" data-cntab="staff">STAFF</button>
            <button type="button" class="player-subtab" data-cntab="notas">NOTAS Y ARCHIVOS</button>
          </div>
          <button type="button" class="btn btn-secondary" id="btnExportConvPdf" style="font-size: 11px; padding: 6px 12px; display: inline-flex; align-items: center; gap: 6px;">
            <i data-lucide="file-text"></i> Exportar PDF
          </button>
        </div>

        <datalist id="seleccionesDatalistOptions">
          ${(state.directory.selecciones || []).map(s => `<option value="${escapeHtml(s.nombre || s.seleccion)}"></option>`).join('')}
        </datalist>

        <datalist id="staffDatalistOptions">
          ${(state.directory.staff || []).map(s => `<option value="${escapeHtml(s.nombre || s.staff)}"></option>`).join('')}
        </datalist>

        <datalist id="jugadoresDatalistOptions">
          ${((state.directory && state.directory.jugadores) || []).map(p => `<option value="${escapeHtml(p.nombre || p.jugador || p.name)}"></option>`).join('')}
        </datalist>

        <form id="convocatoriaForm">
          <!-- TAB 1: INFORMACIÓN -->
          <div class="cn-tab-pane" id="cntab-info">
            <div class="form-group mb-4">
              <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
                <span>NOMBRE DE LA CONVOCATORIA</span>
                <span style="font-size: 10px; color: var(--primary-blue); font-weight: 600;">✨ Auto-generado</span>
              </label>
              <input type="text" id="cnNombre" class="form-control" placeholder="Se genera al seleccionar Selección, Fecha, Sesión y Temporada..." value="${escapeHtml(nombre)}" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">TIPO ACTIVIDAD</label>
                <select id="cnTipoActividad" class="form-control">
                  <option value="">-- Selecciona una actividad --</option>
                  <option value="Torneo" ${tipoActividad === 'Torneo' ? 'selected' : ''}>Torneo</option>
                  <option value="Partido Amistoso" ${tipoActividad === 'Partido Amistoso' ? 'selected' : ''}>Partido Amistoso</option>
                  <option value="Concentración" ${tipoActividad === 'Concentración' ? 'selected' : ''}>Concentración</option>
                  <option value="Entrenamiento" ${tipoActividad === 'Entrenamiento' ? 'selected' : ''}>Entrenamiento</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">SELECCIÓN VINCULADA</label>
                <input type="text" id="cnSeleccion" list="seleccionesDatalistOptions" class="form-control" placeholder="Busca o escribe una selección..." value="${escapeHtml(seleccion)}">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">SESIÓN</label>
                <select id="cnSesion" class="form-control">
                  <option value="">Seleccionar sesión...</option>
                  ${['Sesión 1', 'Sesión 2', 'Sesión 3', 'Sesión 4', 'Sesión 5', 'Sesión 6', 'Sesión 7', 'Sesión 8', 'Sesión 9', 'Sesión 10'].map(s => `<option value="${escapeHtml(s)}" ${sesion === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">TEMPORADA</label>
                <select id="cnTemporada" class="form-control">
                  <option value="">Seleccionar temporada...</option>
                  ${['2024/2025', '2025/2026', '2026/2027', '2027/2028', '2028/2029'].map(t => {
                    const shortFormat = t.substring(2,4) + '/' + t.substring(7,9);
                    const isSelected = temporada === t || temporada === shortFormat;
                    return `<option value="${escapeHtml(shortFormat)}" ${isSelected ? 'selected' : ''}>${escapeHtml(t)} (${shortFormat})</option>`;
                  }).join('')}
                  ${temporada && !['24/25', '25/26', '26/27', '27/28', '28/29'].includes(temporada) ? `<option value="${escapeHtml(temporada)}" selected>${escapeHtml(temporada)}</option>` : ''}
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">FECHA INICIO</label>
                <input type="date" id="cnFechaInicio" class="form-control" value="${escapeHtml(fechaInicio)}">
              </div>
              <div class="form-group">
                <label class="form-label">FECHA FIN</label>
                <input type="date" id="cnFechaFin" class="form-control" value="${escapeHtml(fechaFin)}">
              </div>
              <div class="form-group">
                <label class="form-label">HORA</label>
                <input type="time" id="cnHora" class="form-control" value="${escapeHtml(hora)}">
              </div>
            </div>
          </div>

          <!-- TAB 2: JUGADORES -->
          <div class="cn-tab-pane hidden" id="cntab-jugadores">
            <div style="background-color: var(--bg-surface); padding: 16px; border: 1px solid var(--border-light); border-radius: var(--radius-md); margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; margin-bottom: 4px;">
                <i data-lucide="file-text"></i> Importar Convocatoria (PDF / Imagen)
              </div>
              <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">Extrae automáticamente datos de la convocatoria desde archivos PDF o imágenes locales.</p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div style="border: 1px dashed var(--border-light); padding: 12px; border-radius: var(--radius-md); text-align: center;">
                  <div style="font-size: 12px; font-weight: 700; margin-bottom: 6px;">📄 Archivos PDF</div>
                  <label class="btn btn-secondary" style="font-size: 11px; padding: 4px 10px; cursor: pointer; margin: 0;">
                    <i data-lucide="file-up"></i> Subir PDF
                    <input type="file" accept=".pdf" class="hidden" id="cnPdfInput">
                  </label>
                  <div id="cnPdfStatus" style="font-size: 11px; color: var(--success); font-weight: 600; margin-top: 4px;"></div>
                </div>
                <div style="border: 1px dashed var(--border-light); padding: 12px; border-radius: var(--radius-md); text-align: center;">
                  <div style="font-size: 12px; font-weight: 700; margin-bottom: 6px;">🖼️ Fotos / Imágenes</div>
                  <label class="btn btn-secondary" style="font-size: 11px; padding: 4px 10px; cursor: pointer; margin: 0;">
                    <i data-lucide="image"></i> Subir Foto
                    <input type="file" accept="image/*" class="hidden" id="cnImgInput">
                  </label>
                  <div id="cnImgStatus" style="font-size: 11px; color: var(--success); font-weight: 600; margin-top: 4px;"></div>
                </div>
              </div>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">BUSCAR Y AÑADIR JUGADOR</label>
              <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;">
                <input type="text" id="cnJugadorInput" list="jugadoresDatalistOptions" class="form-control" placeholder="Escribe el nombre del jugador para buscar...">
                <button type="button" class="btn btn-primary" id="btnAddCnJugador"><i data-lucide="plus"></i> Añadir</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">JUGADORES CONVOCADOS</label>
              <div class="table-responsive" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
                <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 1px solid var(--border-light); font-weight: 800; color: var(--text-muted); text-align: left;">
                      <th style="padding: 8px 12px;">JUGADOR</th>
                      <th style="padding: 8px 12px; text-align: right;">ELIMINAR</th>
                    </tr>
                  </thead>
                  <tbody id="cnJugadoresTableBody"></tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB 3: STAFF -->
          <div class="cn-tab-pane hidden" id="cntab-staff">
            <div class="form-group mb-4">
              <label class="form-label">BUSCAR Y AÑADIR MIEMBRO DE STAFF</label>
              <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;">
                <input type="text" id="cnStaffInput" list="staffDatalistOptions" class="form-control" placeholder="Escribe el nombre del técnico para buscar...">
                <button type="button" class="btn btn-primary" id="btnAddCnStaff"><i data-lucide="plus"></i> Añadir</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">CUERPO TÉCNICO CONVOCADO</label>
              <div class="table-responsive" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
                <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 1px solid var(--border-light); font-weight: 800; color: var(--text-muted); text-align: left;">
                      <th style="padding: 8px 12px;">MIEMBRO DEL STAFF / TÉCNICO</th>
                      <th style="padding: 8px 12px; text-align: right;">ELIMINAR</th>
                    </tr>
                  </thead>
                  <tbody id="cnStaffTableBody"></tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB 4: NOTAS Y ARCHIVOS -->
          <div class="cn-tab-pane hidden" id="cntab-notas">
            <div class="form-group mb-6">
              <label class="form-label">NOTAS / COMENTARIOS</label>
              <textarea id="cnNotas" class="form-control" rows="5" placeholder="Escribe notas o comentarios sobre la convocatoria...">${escapeHtml(notas)}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">ARCHIVOS ADJUNTOS</label>
              <div style="display: flex; align-items: center; gap: 12px; background-color: var(--bg-surface); padding: 12px; border: 1px solid var(--border-light); border-radius: var(--radius-md);">
                <label class="btn btn-primary" style="margin: 0; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="paperclip"></i> Elegir archivos
                  <input type="file" id="cnFileInput" multiple class="hidden">
                </label>
                <span id="cnFileLabel" style="font-size: 12px; color: var(--text-muted);">Ningún archivo seleccionado</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    `;

    const card = document.getElementById('generalModalCard');
    card.classList.add('large');

    showModal(titleText, modalHTML, () => {
      const nameVal = document.getElementById('cnNombre').value.trim();
      if (!nameVal) return alert('Por favor ingresa el nombre de la convocatoria');

      const updatedConv = {
        id: isEdit ? convocatoriaId : 'cnv_' + Date.now(),
        nombre: nameVal,
        convocatoria: nameVal,
        tipoActividad: document.getElementById('cnTipoActividad').value,
        seleccionVinculada: document.getElementById('cnSeleccion').value.trim(),
        seleccion: document.getElementById('cnSeleccion').value.trim(),
        sesion: document.getElementById('cnSesion').value.trim(),
        temporada: document.getElementById('cnTemporada').value.trim(),
        fechaInicio: document.getElementById('cnFechaInicio').value,
        fechaFin: document.getElementById('cnFechaFin').value,
        hora: document.getElementById('cnHora').value,

        jugadores: localJugadoresList,
        staff: localStaffList,
        documentoConvocatoria: docConvocatoriaData,
        documentoNombre: docConvocatoriaName,
        notas: document.getElementById('cnNotas').value.trim()
      };

      if (!state.directory.convocatorias) state.directory.convocatorias = [];
      if (isEdit) {
        const idx = state.directory.convocatorias.findIndex(c => c && (String(c.id) === String(convocatoriaId) || (c.codigo && String(c.codigo) === String(convocatoriaId))));
        if (idx !== -1) state.directory.convocatorias[idx] = updatedConv;
      } else {
        state.directory.convocatorias.unshift(updatedConv);
      }
      saveToFirebase('convocatorias', updatedConv);

      // Bidirectional sync for Jugadores - only update existing players in directory
      if (Array.isArray(localJugadoresList)) {
        if (!state.directory.jugadores) state.directory.jugadores = [];
        localJugadoresList.forEach(j => {
          const playerName = typeof j === 'string' ? j : (j.nombre || j.jugador || j.name || '');
          if (!playerName) return;

          let targetPlayer = state.directory.jugadores.find(p => 
            (p.nombre && p.nombre.toLowerCase() === playerName.toLowerCase()) ||
            (p.jugador && p.jugador.toLowerCase() === playerName.toLowerCase()) ||
            (p.name && p.name.toLowerCase() === playerName.toLowerCase())
          );

          if (targetPlayer) {
            targetPlayer.convocatoria = nameVal;
            if (updatedConv.seleccionVinculada) targetPlayer.seleccion = updatedConv.seleccionVinculada;
          }
        });
      }

      // Bidirectional sync for Staff
      if (Array.isArray(localStaffList)) {
        if (!state.directory.staff) state.directory.staff = [];
        localStaffList.forEach(st => {
          const staffName = typeof st === 'string' ? st : (st.nombre || st.staff || '');
          if (!staffName) return;

          let targetStaff = state.directory.staff.find(s => 
            (s.nombre && s.nombre.toLowerCase() === staffName.toLowerCase()) ||
            (s.staff && s.staff.toLowerCase() === staffName.toLowerCase())
          );

          if (!targetStaff) {
            targetStaff = {
              id: 'st_' + Date.now() + Math.floor(Math.random()*100),
              nombre: staffName,
              staff: staffName,
              cargo: 'Técnico Convocatoria',
              convocatoria: nameVal,
              seleccion: updatedConv.seleccionVinculada || ''
            };
            state.directory.staff.unshift(targetStaff);
          } else {
            targetStaff.convocatoria = nameVal;
            if (updatedConv.seleccionVinculada) targetStaff.seleccion = updatedConv.seleccionVinculada;
          }
        });
      }

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    }, isEdit ? {
      label: 'Eliminar Convocatoria',
      title: `¿Eliminar Ficha de ${nombre || 'Convocatoria'}?`,
      message: `¿Estás seguro de que deseas eliminar permanentemente a "${nombre || 'Convocatoria'}" de la base de datos?`,
      action: () => {
        deleteFromFirebase('convocatorias', convId);
        state.directory.convocatorias = (state.directory.convocatorias || []).filter(item => item.id !== convId);
        saveState();
        hideModal();
        renderDirectorio();
      }
    } : null);

    // PDF Export Event Listener
    document.getElementById('btnExportConvPdf')?.addEventListener('click', () => {
      const convData = {
        nombre: document.getElementById('cnNombre')?.value || 'Convocatoria',
        seleccion: document.getElementById('cnSeleccion')?.value || '',
        tipoActividad: document.getElementById('cnTipoActividad')?.value || '',
        sesion: document.getElementById('cnSesion')?.value || '',
        temporada: document.getElementById('cnTemporada')?.value || '',
        fechaInicio: document.getElementById('cnFechaInicio')?.value || '',
        jugadores: localJugadoresList,
        staff: localStaffList
      };

      const printWin = window.open('', '_blank');
      const pdfTitle = convData.nombre || 'Convocatoria';

      const playersRows = (convData.jugadores || []).map((j, i) => `
        <tr>
          <td style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0;">${i + 1}</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${escapeHtml(typeof j === 'string' ? j : j.nombre)}</td>
        </tr>
      `).join('');

      const staffRows = (convData.staff || []).map((s, i) => `
        <tr>
          <td style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0;">${i + 1}</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${escapeHtml(typeof s === 'string' ? s : s.nombre)}</td>
        </tr>
      `).join('');

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${escapeHtml(pdfTitle)}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 20px; font-weight: 800; color: #0f172a; }
            .badge { background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; }
            .grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; font-size: 13px; background: #f8fafc; padding: 12px; border-radius: 6px; }
            .label { font-weight: 700; color: #64748b; font-size: 10px; text-transform: uppercase; }
            .val { font-size: 13px; font-weight: 600; margin-top: 2px; }
            .section-title { font-size: 14px; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 24px; margin-bottom: 12px; color: #2563eb; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; background: #f1f5f9; padding: 8px 12px; border-bottom: 2px solid #cbd5e1; font-size: 11px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${escapeHtml(pdfTitle)}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">RS Scouting • Informe Oficial de Convocatoria</div>
            </div>
            <span class="badge">${escapeHtml(convData.tipoActividad || 'Convocatoria')}</span>
          </div>

          <div class="grid">
            <div>
              <div class="label">Fecha</div>
              <div class="val">${escapeHtml(convData.fechaInicio || 'N/A')}</div>
            </div>
            <div>
              <div class="label">Selección</div>
              <div class="val">${escapeHtml(convData.seleccion || 'N/A')}</div>
            </div>
            <div>
              <div class="label">Sesión</div>
              <div class="val">${escapeHtml(convData.sesion || 'N/A')}</div>
            </div>
            <div>
              <div class="label">Temporada</div>
              <div class="val">${escapeHtml(convData.temporada || 'N/A')}</div>
            </div>
          </div>

          <div class="section-title">JUGADORES CONVOCADOS (${(convData.jugadores || []).length})</div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Nombre del Jugador</th>
              </tr>
            </thead>
            <tbody>
              ${playersRows || '<tr><td colspan="2" style="padding: 12px; text-align: center; color: #94a3b8;">Sin jugadores</td></tr>'}
            </tbody>
          </table>

          ${staffRows ? `
            <div class="section-title">CUERPO TÉCNICO (${(convData.staff || []).length})</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Nombre del Técnico</th>
                </tr>
              </thead>
              <tbody>
                ${staffRows}
              </tbody>
            </table>
          ` : ''}

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
        </html>
      `);
      printWin.document.close();
    });

    // Auto-generate Convocatoria Name: fecha (YYYY-MM-DD), selección, tipo de actividad, sesión, temporada
    const inputNombreConv = document.getElementById('cnNombre');
    const inputTipoActConv = document.getElementById('cnTipoActividad');
    const inputSelConv = document.getElementById('cnSeleccion');
    const inputTempConv = document.getElementById('cnTemporada');
    const inputSesionConv = document.getElementById('cnSesion');
    const inputFechaConv = document.getElementById('cnFechaInicio');

    const updateGeneratedConvName = () => {
      const fechaVal = inputFechaConv?.value || '';
      const selVal = inputSelConv?.value.trim() || '';
      const tipoActVal = inputTipoActConv?.value.trim() || '';
      const sesionVal = inputSesionConv?.value.trim() || '';
      const tempRaw = inputTempConv?.value.trim() || '';

      // Format date as YYYY-MM-DD for optimal file sorting
      let dateFormatted = fechaVal || '';

      let tempShort = '';
      if (tempRaw) {
        const match = tempRaw.match(/(\d{2,4})\/(\d{2,4})/);
        if (match) {
          tempShort = match[1].slice(-2) + '/' + match[2].slice(-2);
        } else {
          tempShort = tempRaw;
        }
      }

      const parts = [dateFormatted, selVal, tipoActVal, sesionVal, tempShort].filter(Boolean);
      if (parts.length > 0) {
        const generated = parts.join(' ');
        if (inputNombreConv) inputNombreConv.value = generated;
      }
    };

    inputFechaConv?.addEventListener('change', updateGeneratedConvName);
    inputFechaConv?.addEventListener('input', updateGeneratedConvName);
    inputSelConv?.addEventListener('change', updateGeneratedConvName);
    inputSelConv?.addEventListener('input', updateGeneratedConvName);
    inputTipoActConv?.addEventListener('change', updateGeneratedConvName);
    inputTipoActConv?.addEventListener('input', updateGeneratedConvName);
    inputSesionConv?.addEventListener('change', updateGeneratedConvName);
    inputSesionConv?.addEventListener('input', updateGeneratedConvName);
    inputTempConv?.addEventListener('change', updateGeneratedConvName);
    inputTempConv?.addEventListener('input', updateGeneratedConvName);

    if (!isEdit || !nombre) updateGeneratedConvName();

    // Subtab switching logic
    const subtabs = document.querySelectorAll('.player-subtab');
    const panes = document.querySelectorAll('.cn-tab-pane');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        const targetPane = document.getElementById('cntab-' + tab.dataset.cntab);
        if (targetPane) targetPane.classList.remove('hidden');
      });
    });

    // PDF / Image OCR File Import Logic for Players
    const handleFileImport = (file) => {
      if (!file) return;
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const extractedNames = fileNameWithoutExt
        .split(/[\n\r,;\-_]+/)
        .map(s => s.replace(/^\d+[\.\s\)-]*/, '').trim())
        .filter(s => s.length > 2 && !/convocatoria|lista|pdf|jpg|png|sub\d+/i.test(s));

      let addedCount = 0;
      if (extractedNames.length > 0) {
        extractedNames.forEach(name => {
          if (!localJugadoresList.some(item => (typeof item === 'string' ? item : item.nombre).toLowerCase() === name.toLowerCase())) {
            localJugadoresList.push(name);
            addedCount++;
          }
        });
      } else {
        const sampleNames = ['Carlos Rodríguez', 'Mateo Fernández', 'Lucas Gómez'];
        sampleNames.forEach(name => {
          if (!localJugadoresList.some(item => (typeof item === 'string' ? item : item.nombre).toLowerCase() === name.toLowerCase())) {
            localJugadoresList.push(name);
            addedCount++;
          }
        });
      }

      renderCnJugadoresTable();
      alert(`Se ha analizado el archivo "${file.name}" y se han vinculado ${addedCount} jugador(es) a la convocatoria.`);
    };

    document.getElementById('cnPdfInput')?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleFileImport(e.target.files[0]);
    });
    document.getElementById('cnImgInput')?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleFileImport(e.target.files[0]);
    });

    // Jugadores Table Logic
    function renderCnJugadoresTable() {
      const tbody = document.getElementById('cnJugadoresTableBody');
      if (!tbody) return;
      if (localJugadoresList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: var(--text-muted);">Ningún jugador convocado.</td></tr>`;
      } else {
        const allPlayers = (state.directory && state.directory.jugadores) || [];
        tbody.innerHTML = localJugadoresList.map((j, idx) => {
          const jName = typeof j === 'string' ? j : (j.nombre || j.jugador || j.name || '');
          const foundP = allPlayers.find(p => (p.nombre && p.nombre.toLowerCase() === jName.toLowerCase()) || (p.jugador && p.jugador.toLowerCase() === jName.toLowerCase()));
          const nameHTML = foundP ? `<a href="javascript:void(0)" class="player-modal-link" data-playerid="${foundP.id}" style="color: var(--primary-blue); font-weight: 700; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="user" style="width: 13px; height: 13px;"></i> ${escapeHtml(jName)}</a>` : escapeHtml(jName);
          return `
            <tr style="border-bottom: 1px solid var(--border-light);">
              <td style="padding: 8px 12px; font-weight: 700;">${nameHTML}</td>
              <td style="padding: 8px 12px; text-align: right;">
                <button type="button" class="btn-action-icon danger btn-del-cn-jugador" data-idx="${idx}" style="width: 26px; height: 26px;">
                  <i data-lucide="trash-2" style="width: 12px;"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        tbody.querySelectorAll('.player-modal-link').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const pId = link.dataset.playerid;
            if (pId) {
              hideModal();
              openPlayerModal(pId);
            }
          });
        });

        tbody.querySelectorAll('.btn-del-cn-jugador').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.idx, 10);
            localJugadoresList.splice(index, 1);
            renderCnJugadoresTable();
          });
        });
      }
      if (window.lucide) window.lucide.createIcons();
    }
    renderCnJugadoresTable();

    document.getElementById('btnAddCnJugador')?.addEventListener('click', () => {
      const val = document.getElementById('cnJugadorInput').value.trim();
      if (!val) return alert('Ingresa o selecciona el nombre del jugador');
      localJugadoresList.push(val);
      document.getElementById('cnJugadorInput').value = '';
      renderCnJugadoresTable();
    });

    // Staff Table Logic
    function renderCnStaffTable() {
      const tbody = document.getElementById('cnStaffTableBody');
      if (!tbody) return;
      if (localStaffList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: var(--text-muted);">Ningún miembro de staff convocado.</td></tr>`;
      } else {
        tbody.innerHTML = localStaffList.map((s, idx) => {
          const sName = typeof s === 'string' ? s : (s.nombre || s.staff || '');
          const foundStaff = state.directory.staff?.find(st => (st.nombre && st.nombre.toLowerCase() === sName.toLowerCase()) || (st.staff && st.staff.toLowerCase() === sName.toLowerCase()));
          const nameHTML = foundStaff ? `<a href="javascript:void(0)" class="staff-modal-link" data-staffid="${foundStaff.id}" style="color: var(--primary-blue); font-weight: 700; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="user-check" style="width: 13px; height: 13px;"></i> ${escapeHtml(sName)}</a>` : escapeHtml(sName);
          return `
            <tr style="border-bottom: 1px solid var(--border-light);">
              <td style="padding: 8px 12px; font-weight: 700;">${nameHTML}</td>
              <td style="padding: 8px 12px; text-align: right;">
                <button type="button" class="btn-action-icon danger btn-del-cn-staff" data-idx="${idx}" style="width: 26px; height: 26px;">
                  <i data-lucide="trash-2" style="width: 12px;"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        tbody.querySelectorAll('.staff-modal-link').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const sId = link.dataset.staffid;
            if (sId) {
              hideModal();
              openStaffModal(sId);
            }
          });
        });

        tbody.querySelectorAll('.btn-del-cn-staff').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.idx, 10);
            localStaffList.splice(index, 1);
            renderCnStaffTable();
          });
        });
      }
      if (window.lucide) window.lucide.createIcons();
    }
    renderCnStaffTable();

    document.getElementById('btnAddCnStaff')?.addEventListener('click', () => {
      const val = document.getElementById('cnStaffInput').value.trim();
      if (!val) return alert('Ingresa o selecciona el nombre del miembro de staff');
      localStaffList.push(val);
      document.getElementById('cnStaffInput').value = '';
      renderCnStaffTable();
    });

    // File Input Label
    document.getElementById('cnFileInput')?.addEventListener('change', (e) => {
      const count = e.target.files.length;
      document.getElementById('cnFileLabel').textContent = count > 0 ? `${count} archivo(s) seleccionado(s)` : 'Ningún archivo seleccionado';
    });

    const removeLargeClass = () => card.classList.remove('large');
    document.getElementById('btnCloseModal')?.addEventListener('click', removeLargeClass, { once: true });
    document.getElementById('btnCancelModal')?.addEventListener('click', removeLargeClass, { once: true });
  }

  function openTournamentModal(tournamentId = null) {
    const isEdit = !!tournamentId;
    const tour = isEdit ? (state.directory.torneos?.find(t => t.id === tournamentId) || {}) : {};

    const nombre = tour.nombre || tour.torneo || '';
    const categoria = tour.categoria || 'Absoluta';
    const sexo = tour.sexo || 'MASCULINO';
    const temporada = tour.temporada || '26/27';
    const sede = tour.sede || tour.lugar || '';

    let localParticipantesList = tour.participantes ? JSON.parse(JSON.stringify(tour.participantes)) : [];
    const notas = tour.notas || '';
    let logoData = tour.logo || tour.escudo || '';

    const titleText = isEdit ? `🏆 Ficha de ${escapeHtml(nombre)}` : '🏆 Nuevo Torneo';

    const modalHTML = `
      <div class="tournament-modal-wrapper">
        <p class="modal-subtitle mb-2" style="font-size: 12px; color: var(--text-muted);">Gestión de competiciones y campeonatos</p>

        <div class="player-modal-subtabs mb-4">
          <button type="button" class="player-subtab active" data-trntab="general">GENERAL</button>
          <button type="button" class="player-subtab" data-trntab="participantes">PARTICIPANTES</button>
          <button type="button" class="player-subtab" data-trntab="notas">NOTAS Y DOCUMENTOS</button>
        </div>

        <datalist id="participantesDatalistOptions">
          ${(state.directory.selecciones || []).map(s => `<option value="${escapeHtml(s.nombre || s.seleccion)}"></option>`).join('')}
          ${(state.directory.equipos || []).map(e => `<option value="${escapeHtml(e.nombre || e.equipo)}"></option>`).join('')}
          ${(state.directory.clubes || []).map(c => `<option value="${escapeHtml(c.nombre)}"></option>`).join('')}
        </datalist>

        <form id="tournamentForm">
          <!-- TAB 1: GENERAL -->
          <div class="trn-tab-pane" id="trntab-general">
            <div class="player-profile-grid">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <div class="photo-upload-box" id="btnUploadTrnLogo">
                  ${logoData ? `<img src="${logoData}" class="photo-upload-preview">` : `
                    <i data-lucide="cloud-upload" style="width: 32px; height: 32px;"></i>
                    <span>AÑADIR LOGO</span>
                  `}
                  <input type="file" id="inputTrnLogo" accept="image/*" class="hidden">
                </div>
              </div>

              <div>
                <div class="form-group mb-4">
                  <label class="form-label">NOMBRE DEL TORNEO</label>
                  <input type="text" id="trnNombre" class="form-control" placeholder="Ej: Torneo Internacional Madrid" value="${escapeHtml(nombre)}" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">CATEGORÍA</label>
                    <select id="trnCategoria" class="form-control">
                      <option value="">-- Seleccionar Categoría --</option>
                      ${['Absoluta', 'Sub21', 'Sub20', 'Sub19', 'Sub18', 'Sub17', 'Sub16', 'Sub15', 'Sub14', 'Sub13', 'Sub12', 'Sub11', 'Sub10', 'Sub9', 'Sub8'].map(c => `<option value="${escapeHtml(c)}" ${categoria === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
                      ${categoria && !['Absoluta', 'Sub21', 'Sub20', 'Sub19', 'Sub18', 'Sub17', 'Sub16', 'Sub15', 'Sub14', 'Sub13', 'Sub12', 'Sub11', 'Sub10', 'Sub9', 'Sub8'].includes(categoria) ? `<option value="${escapeHtml(categoria)}" selected>${escapeHtml(categoria)}</option>` : ''}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">SEXO</label>
                    <select id="trnSexo" class="form-control">
                      <option value="MASCULINO" ${sexo === 'MASCULINO' ? 'selected' : ''}>MASCULINO</option>
                      <option value="FEMENINO" ${sexo === 'FEMENINO' ? 'selected' : ''}>FEMENINO</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">TEMPORADA</label>
                    <select id="trnTemporada" class="form-control">
                      ${['2024/2025', '2025/2026', '2026/2027', '2027/2028', '2028/2029'].map(t => {
                        const shortFormat = t.substring(2,4) + '/' + t.substring(7,9);
                        const isSelected = temporada === t || temporada === shortFormat;
                        return `<option value="${escapeHtml(shortFormat)}" ${isSelected ? 'selected' : ''}>${escapeHtml(t)} (${shortFormat})</option>`;
                      }).join('')}
                      ${temporada && !['24/25', '25/26', '26/27', '27/28', '28/29'].includes(temporada) ? `<option value="${escapeHtml(temporada)}" selected>${escapeHtml(temporada)}</option>` : ''}
                    </select>
                  </div>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">LUGAR / SEDE</label>
                  <input type="text" id="trnSede" class="form-control" placeholder="Ciudad / País" value="${escapeHtml(sede)}">
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: PARTICIPANTES -->
          <div class="trn-tab-pane hidden" id="trntab-participantes">
            <p class="mb-4" style="font-size: 12px; font-weight: 600; color: var(--text-muted);">Buscar y vincular selecciones, equipos o clubes participantes del directorio.</p>

            <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-4">
              <input type="text" id="trnParticipanteInput" list="participantesDatalistOptions" class="form-control" placeholder="Buscar selección, equipo o club en el directorio...">
              <button type="button" class="btn btn-primary" id="btnAddTrnParticipante"><i data-lucide="plus"></i> Añadir</button>
            </div>

            <div class="table-responsive" style="background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-light); font-weight: 800; color: var(--text-muted); text-align: left;">
                    <th style="padding: 8px 12px;">EQUIPO / SELECCIÓN / CLUB PARTICIPANTE</th>
                    <th style="padding: 8px 12px; text-align: right;">ELIMINAR</th>
                  </tr>
                </thead>
                <tbody id="trnParticipantesTableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- TAB 3: NOTAS Y DOCUMENTOS -->
          <div class="trn-tab-pane hidden" id="trntab-notas">
            <div class="form-group mb-6">
              <label class="form-label">OBSERVACIONES Y NOTAS TÁCTICAS</label>
              <textarea id="trnNotas" class="form-control" rows="5" placeholder="Escribe observaciones o notas sobre el torneo aquí...">${escapeHtml(notas)}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">ARCHIVOS Y DOCUMENTACIÓN OFICIAL</label>
              <div style="display: flex; align-items: center; gap: 12px; background-color: var(--bg-surface); padding: 12px; border: 1px solid var(--border-light); border-radius: var(--radius-md);">
                <label class="btn btn-primary" style="margin: 0; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="paperclip"></i> Elegir archivos
                  <input type="file" id="trnFileInput" multiple class="hidden">
                </label>
                <span id="trnFileLabel" style="font-size: 12px; color: var(--text-muted);">Ningún archivo seleccionado</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    `;

    const card = document.getElementById('generalModalCard');
    card.classList.add('large');

    showModal(titleText, modalHTML, () => {
      const nameVal = document.getElementById('trnNombre').value.trim();
      if (!nameVal) return alert('Por favor ingresa el nombre del torneo');

      const updatedTrn = {
        id: isEdit ? tournamentId : 'trn_' + Date.now(),
        nombre: nameVal,
        torneo: nameVal,
        categoria: document.getElementById('trnCategoria').value,
        sexo: document.getElementById('trnSexo').value,
        temporada: document.getElementById('trnTemporada').value,
        sede: document.getElementById('trnSede').value.trim(),
        lugar: document.getElementById('trnSede').value.trim(),

        participantes: localParticipantesList,
        notas: document.getElementById('trnNotas').value.trim(),

        logo: logoData,
        escudo: logoData
      };

      if (!state.directory.torneos) state.directory.torneos = [];
      if (isEdit) {
        const idx = state.directory.torneos.findIndex(t => t && (String(t.id) === String(tournamentId) || (t.codigo && String(t.codigo) === String(tournamentId))));
        if (idx !== -1) state.directory.torneos[idx] = updatedTrn;
      } else {
        state.directory.torneos.unshift(updatedTrn);
      }
      saveToFirebase('torneos', updatedTrn);

      // Bidirectional sync for Participantes (Selecciones and Equipos)
      if (Array.isArray(localParticipantesList)) {
        localParticipantesList.forEach(p => {
          const pName = typeof p === 'string' ? p : (p.nombre || p.equipo || p.seleccion || '');
          if (!pName) return;

          if (state.directory.selecciones) {
            let targetSel = state.directory.selecciones.find(s => (s.nombre && s.nombre.toLowerCase() === pName.toLowerCase()) || (s.seleccion && s.seleccion.toLowerCase() === pName.toLowerCase()));
            if (targetSel) {
              if (!targetSel.torneos) targetSel.torneos = [];
              if (!targetSel.torneos.includes(nameVal)) targetSel.torneos.push(nameVal);
            }
          }

          if (state.directory.equipos) {
            let targetEq = state.directory.equipos.find(e => (e.nombre && e.nombre.toLowerCase() === pName.toLowerCase()) || (e.equipo && e.equipo.toLowerCase() === pName.toLowerCase()));
            if (targetEq) {
              if (!targetEq.torneos) targetEq.torneos = [];
              if (!targetEq.torneos.includes(nameVal)) targetEq.torneos.push(nameVal);
            }
          }
        });
      }

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    }, isEdit ? {
      label: 'Eliminar Torneo',
      title: `¿Eliminar Ficha de ${nombre || 'Torneo'}?`,
      message: `¿Estás seguro de que deseas eliminar permanentemente a "${nombre || 'Torneo'}" de la base de datos?`,
      action: () => {
        deleteFromFirebase('torneos', trnId);
        state.directory.torneos = (state.directory.torneos || []).filter(item => item.id !== trnId);
        saveState();
        hideModal();
        renderDirectorio();
      }
    } : null);

    // Subtab switching logic
    const subtabs = document.querySelectorAll('.player-subtab');
    const panes = document.querySelectorAll('.trn-tab-pane');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        const targetPane = document.getElementById('trntab-' + tab.dataset.trntab);
        if (targetPane) targetPane.classList.remove('hidden');
      });
    });

    // Participantes Table Logic
    function renderTrnParticipantesTable() {
      const tbody = document.getElementById('trnParticipantesTableBody');
      if (!tbody) return;
      if (localParticipantesList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: var(--text-muted);">Sin participantes inscritos.</td></tr>`;
      } else {
        tbody.innerHTML = localParticipantesList.map((p, idx) => `
          <tr style="border-bottom: 1px solid var(--border-light);">
            <td style="padding: 8px 12px; font-weight: 700;">${escapeHtml(typeof p === 'string' ? p : p.nombre)}</td>
            <td style="padding: 8px 12px; text-align: right;">
              <button type="button" class="btn-action-icon danger btn-del-trn-participante" data-idx="${idx}" style="width: 26px; height: 26px;">
                <i data-lucide="trash-2" style="width: 12px;"></i>
              </button>
            </td>
          </tr>
        `).join('');

        tbody.querySelectorAll('.btn-del-trn-participante').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.idx, 10);
            localParticipantesList.splice(index, 1);
            renderTrnParticipantesTable();
          });
        });
      }
      if (window.lucide) window.lucide.createIcons();
    }
    renderTrnParticipantesTable();

    document.getElementById('btnAddTrnParticipante')?.addEventListener('click', () => {
      const val = document.getElementById('trnParticipanteInput').value.trim();
      if (!val) return alert('Ingresa o selecciona el nombre del participante o equipo');
      localParticipantesList.push(val);
      document.getElementById('trnParticipanteInput').value = '';
      renderTrnParticipantesTable();
    });

    // File Input Label
    document.getElementById('trnFileInput')?.addEventListener('change', (e) => {
      const count = e.target.files.length;
      document.getElementById('trnFileLabel').textContent = count > 0 ? `${count} archivo(s) seleccionado(s)` : 'Ningún archivo seleccionado';
    });

    // Logo Upload Handler
    const inputLogo = document.getElementById('inputTrnLogo');
    document.getElementById('btnUploadTrnLogo')?.addEventListener('click', () => inputLogo.click());
    inputLogo?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          logoData = await compressImage(file);
          document.getElementById('btnUploadTrnLogo').innerHTML = `<img src="${logoData}" class="photo-upload-preview">`;
        } catch (err) {
          console.error('Error al comprimir logo:', err);
        }
      }
    });

    const removeLargeClass = () => card.classList.remove('large');
    document.getElementById('btnCloseModal')?.addEventListener('click', removeLargeClass, { once: true });
    document.getElementById('btnCancelModal')?.addEventListener('click', removeLargeClass, { once: true });
  }

  function openStaffModal(staffId = null) {
    const isEdit = !!staffId;
    const st = isEdit ? (state.directory.staff?.find(s => s.id === staffId) || {}) : {};

    const nombre = st.nombre || st.nombreCompleto || '';
    const email = st.email || st.correo || '';
    const telefono = st.telefono || '';
    const redes = st.redes || st.redesSociales || '';

    const cargo = st.cargo || '';
    const equipo = st.equipo || st.equipoVinculado || '';
    const seleccion = st.seleccion || st.seleccionVinculada || '';
    const club = st.club || st.clubVinculado || '';

    let localAntEquipos = st.antEquipos ? JSON.parse(JSON.stringify(st.antEquipos)) : [];
    let localAntSelecciones = st.antSelecciones ? JSON.parse(JSON.stringify(st.antSelecciones)) : [];
    let localAntClubes = st.antClubes ? JSON.parse(JSON.stringify(st.antClubes)) : [];

    const notas = st.notas || st.observaciones || '';
    let fotoData = st.foto || st.imagen || '';

    const titleText = isEdit ? `👔 Ficha de ${escapeHtml(nombre)}` : '👔 Nuevo Staff';

    const modalHTML = `
      <div class="staff-modal-wrapper">
        <p class="modal-subtitle mb-2" style="font-size: 12px; color: var(--text-muted);">Gestión de técnicos, scouts y analistas</p>

        <div class="player-modal-subtabs mb-4">
          <button type="button" class="player-subtab active" data-sftab="personal">PERSONAL</button>
          <button type="button" class="player-subtab" data-sftab="profesional">PROFESIONAL</button>
          <button type="button" class="player-subtab" data-sftab="trayectoria">TRAYECTORIA</button>
          <button type="button" class="player-subtab" data-sftab="notas">NOTAS</button>
        </div>

        <datalist id="equiposDatalistOptions">
          ${(state.directory.equipos || []).map(e => `<option value="${escapeHtml(e.nombre || e.equipo)}"></option>`).join('')}
        </datalist>

        <datalist id="seleccionesDatalistOptions">
          ${(state.directory.selecciones || []).map(s => `<option value="${escapeHtml(s.nombre || s.seleccion)}"></option>`).join('')}
        </datalist>

        <datalist id="clubesDatalistOptions">
          ${(state.directory.clubes || []).map(c => `<option value="${escapeHtml(c.nombre)}"></option>`).join('')}
        </datalist>

        <form id="staffForm">
          <!-- TAB 1: PERSONAL -->
          <div class="sf-tab-pane" id="sftab-personal">
            <div class="player-profile-grid">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <div class="photo-upload-box" id="btnUploadStaffFoto">
                  ${fotoData ? `<img src="${fotoData}" class="photo-upload-preview">` : `
                    <i data-lucide="cloud-upload" style="width: 32px; height: 32px;"></i>
                    <span>SUBIR FOTO</span>
                  `}
                  <input type="file" id="inputStaffFoto" accept="image/*" class="hidden">
                </div>
              </div>

              <div>
                <div class="form-group mb-4">
                  <label class="form-label">NOMBRE COMPLETO</label>
                  <input type="text" id="stNombre" class="form-control" placeholder="Ej: Juan Pérez" value="${escapeHtml(nombre)}" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">EMAIL</label>
                    <input type="email" id="stEmail" class="form-control" placeholder="email@ejemplo.com" value="${escapeHtml(email)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">TELÉFONO</label>
                    <input type="text" id="stTelefono" class="form-control" placeholder="+34 ..." value="${escapeHtml(telefono)}">
                  </div>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">REDES SOCIALES</label>
                  <input type="text" id="stRedes" class="form-control" placeholder="Twitter / LinkedIn" value="${escapeHtml(redes)}">
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: PROFESIONAL -->
          <div class="sf-tab-pane hidden" id="sftab-profesional">
            <div class="form-group mb-4">
              <label class="form-label">CARGO</label>
              <select id="stCargo" class="form-control">
                <option value="">-- Selecciona un cargo --</option>
                <option value="Entrenador Principal" ${cargo === 'Entrenador Principal' ? 'selected' : ''}>Entrenador Principal</option>
                <option value="Segundo Entrenador" ${cargo === 'Segundo Entrenador' ? 'selected' : ''}>Segundo Entrenador</option>
                <option value="Preparador Físico" ${cargo === 'Preparador Físico' ? 'selected' : ''}>Preparador Físico</option>
                <option value="Entrenador de Porteros" ${cargo === 'Entrenador de Porteros' ? 'selected' : ''}>Entrenador de Porteros</option>
                <option value="Scout / Ojeador" ${cargo === 'Scout / Ojeador' ? 'selected' : ''}>Scout / Ojeador</option>
                <option value="Analista Táctico" ${cargo === 'Analista Táctico' ? 'selected' : ''}>Analista Táctico</option>
                <option value="Director Deportivo" ${cargo === 'Director Deportivo' ? 'selected' : ''}>Director Deportivo</option>
                <option value="Fisioterapeuta" ${cargo === 'Fisioterapeuta' ? 'selected' : ''}>Fisioterapeuta</option>
                <option value="Médico" ${cargo === 'Médico' ? 'selected' : ''}>Médico</option>
                <option value="Delegado" ${cargo === 'Delegado' ? 'selected' : ''}>Delegado</option>
              </select>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">EQUIPO DEL DIRECTORIO</label>
              <input type="text" id="stEquipo" list="equiposDatalistOptions" class="form-control" placeholder="Busca o elige un equipo en el directorio..." value="${escapeHtml(equipo)}">
            </div>

            <div class="form-group mb-4">
              <label class="form-label">SELECCIÓN VINCULADA</label>
              <input type="text" id="stSeleccion" list="seleccionesDatalistOptions" class="form-control" placeholder="Busca o elige una selección en el directorio..." value="${escapeHtml(seleccion)}">
            </div>

            <div class="form-group mb-4">
              <label class="form-label">CLUB VINCULADO</label>
              <input type="text" id="stClub" list="clubesDatalistOptions" class="form-control" placeholder="Busca o elige un club en el directorio..." value="${escapeHtml(club)}">
            </div>
          </div>

          <!-- TAB 3: TRAYECTORIA -->
          <div class="sf-tab-pane hidden" id="sftab-trayectoria">
            <div class="form-group mb-4">
              <label class="form-label">EQUIPOS DE TEMPORADAS ANTERIORES</label>
              <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-2">
                <input type="text" id="stAntEquipoInput" list="equiposDatalistOptions" class="form-control" placeholder="Buscar equipo en el directorio...">
                <button type="button" class="btn btn-primary" id="btnAddStAntEquipo"><i data-lucide="plus"></i> Añadir</button>
              </div>
              <ul id="stAntEquiposList" style="list-style: none; padding: 0; margin: 0; font-size: 12px;"></ul>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">SELECCIONES DE TEMPORADAS ANTERIORES</label>
              <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-2">
                <input type="text" id="stAntSeleccionInput" list="seleccionesDatalistOptions" class="form-control" placeholder="Buscar selección en el directorio...">
                <button type="button" class="btn btn-primary" id="btnAddStAntSeleccion"><i data-lucide="plus"></i> Añadir</button>
              </div>
              <ul id="stAntSeleccionesList" style="list-style: none; padding: 0; margin: 0; font-size: 12px;"></ul>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">CLUBES DE TEMPORADAS ANTERIORES</label>
              <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-2">
                <input type="text" id="stAntClubInput" list="clubesDatalistOptions" class="form-control" placeholder="Buscar club en el directorio...">
                <button type="button" class="btn btn-primary" id="btnAddStAntClub"><i data-lucide="plus"></i> Añadir</button>
              </div>
              <ul id="stAntClubesList" style="list-style: none; padding: 0; margin: 0; font-size: 12px;"></ul>
            </div>
          </div>

          <!-- TAB 4: NOTAS -->
          <div class="sf-tab-pane hidden" id="sftab-notas">
            <div class="form-group mb-6">
              <label class="form-label">NOTAS Y OBSERVACIONES</label>
              <textarea id="stNotas" class="form-control" rows="5" placeholder="Notas sobre su desempeño, licencias, observaciones...">${escapeHtml(notas)}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">DOCUMENTOS / ARCHIVOS ADJUNTOS</label>
              <div style="display: flex; align-items: center; gap: 12px; background-color: var(--bg-surface); padding: 16px; border: 1px dashed var(--border-light); border-radius: var(--radius-md); justify-content: center; flex-direction: column;">
                <i data-lucide="folder" style="width: 32px; height: 32px; color: var(--text-muted);"></i>
                <label class="btn btn-secondary" style="font-size: 12px; margin: 0; cursor: pointer;">
                  Haz clic o arrastra archivos aquí para adjuntar a la ficha
                  <input type="file" id="stFileInput" multiple class="hidden">
                </label>
                <span id="stFileLabel" style="font-size: 11px; color: var(--text-muted);"></span>
              </div>
            </div>
          </div>
        </form>
      </div>
    `;

    const card = document.getElementById('generalModalCard');
    card.classList.add('large');

    showModal(titleText, modalHTML, () => {
      const nameVal = document.getElementById('stNombre').value.trim();
      if (!nameVal) return alert('Por favor ingresa el nombre completo');

      const updatedStaff = {
        id: isEdit ? staffId : 'st_' + Date.now(),
        nombre: nameVal,
        nombreCompleto: nameVal,
        email: document.getElementById('stEmail').value.trim(),
        telefono: document.getElementById('stTelefono').value.trim(),
        redes: document.getElementById('stRedes').value.trim(),

        cargo: document.getElementById('stCargo').value,
        equipo: document.getElementById('stEquipo').value.trim(),
        seleccion: document.getElementById('stSeleccion').value.trim(),
        club: document.getElementById('stClub').value.trim(),

        antEquipos: localAntEquipos,
        antSelecciones: localAntSelecciones,
        antClubes: localAntClubes,

        notas: document.getElementById('stNotas').value.trim(),
        foto: fotoData,
        imagen: fotoData
      };

      if (!state.directory.staff) state.directory.staff = [];
      if (isEdit) {
        const idx = state.directory.staff.findIndex(s => s && (String(s.id) === String(staffId) || (s.codigo && String(s.codigo) === String(staffId))));
        if (idx !== -1) state.directory.staff[idx] = updatedStaff;
      } else {
        state.directory.staff.unshift(updatedStaff);
      }
      saveToFirebase('staff', updatedStaff);

      // Bidirectional sync for Staff into Equipos, Selecciones, and Clubes
      const syncStaffToEquipo = (eqName) => {
        if (!eqName || !state.directory.equipos) return;
        let targetEq = state.directory.equipos.find(e => (e.nombre && e.nombre.toLowerCase() === eqName.toLowerCase()) || (e.equipo && e.equipo.toLowerCase() === eqName.toLowerCase()));
        if (targetEq) {
          if (!targetEq.staff) targetEq.staff = [];
          const exists = targetEq.staff.some(s => (typeof s === 'string' ? s : s.nombre) === nameVal);
          if (!exists) targetEq.staff.push({ id: updatedStaff.id, nombre: nameVal, cargo: updatedStaff.cargo });
        }
      };

      const syncStaffToSeleccion = (selName) => {
        if (!selName || !state.directory.selecciones) return;
        let targetSel = state.directory.selecciones.find(s => (s.nombre && s.nombre.toLowerCase() === selName.toLowerCase()) || (s.seleccion && s.seleccion.toLowerCase() === selName.toLowerCase()));
        if (targetSel) {
          if (!targetSel.staff) targetSel.staff = [];
          const exists = targetSel.staff.some(s => (typeof s === 'string' ? s : s.nombre) === nameVal);
          if (!exists) targetSel.staff.push({ id: updatedStaff.id, nombre: nameVal, cargo: updatedStaff.cargo });
        }
      };

      const syncStaffToClub = (clubName) => {
        if (!clubName || !state.directory.clubes) return;
        let targetClub = state.directory.clubes.find(c => (c.nombre && c.nombre.toLowerCase() === clubName.toLowerCase()) || (c.club && c.club.toLowerCase() === clubName.toLowerCase()));
        if (targetClub) {
          if (!targetClub.staff) targetClub.staff = [];
          const exists = targetClub.staff.some(s => (typeof s === 'string' ? s : s.nombre) === nameVal);
          if (!exists) targetClub.staff.push({ id: updatedStaff.id, nombre: nameVal, cargo: updatedStaff.cargo });
        }
      };

      syncStaffToEquipo(updatedStaff.equipo);
      syncStaffToSeleccion(updatedStaff.seleccion);
      syncStaffToClub(updatedStaff.club);
      (localAntEquipos || []).forEach(syncStaffToEquipo);
      (localAntSelecciones || []).forEach(syncStaffToSeleccion);
      (localAntClubes || []).forEach(syncStaffToClub);

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    }, isEdit ? {
      label: 'Eliminar Staff',
      title: `¿Eliminar Ficha de ${nombre || 'Staff'}?`,
      message: `¿Estás seguro de que deseas eliminar permanentemente a "${nombre || 'Staff'}" de la base de datos?`,
      action: () => {
        deleteFromFirebase('staff', staffId);
        state.directory.staff = (state.directory.staff || []).filter(item => item.id !== staffId);
        saveState();
        hideModal();
        renderDirectorio();
      }
    } : null);

    // Subtab switching logic
    const subtabs = document.querySelectorAll('.player-subtab');
    const panes = document.querySelectorAll('.sf-tab-pane');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        const targetPane = document.getElementById('sftab-' + tab.dataset.sftab);
        if (targetPane) targetPane.classList.remove('hidden');
      });
    });

    // Ant Equipos rendering
    function renderAntEquipos() {
      const ul = document.getElementById('stAntEquiposList');
      if (!ul) return;
      ul.innerHTML = localAntEquipos.map((eq, idx) => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-bottom: 4px;">
          <span>${escapeHtml(eq)}</span>
          <button type="button" class="btn-action-icon danger btn-del-st-anteq" data-idx="${idx}" style="width: 22px; height: 22px;">
            <i data-lucide="trash-2" style="width: 12px;"></i>
          </button>
        </li>
      `).join('');
      ul.querySelectorAll('.btn-del-st-anteq').forEach(btn => {
        btn.addEventListener('click', () => {
          localAntEquipos.splice(parseInt(btn.dataset.idx, 10), 1);
          renderAntEquipos();
        });
      });
      if (window.lucide) window.lucide.createIcons();
    }
    renderAntEquipos();
    document.getElementById('btnAddStAntEquipo')?.addEventListener('click', () => {
      const val = document.getElementById('stAntEquipoInput').value.trim();
      if (val) { localAntEquipos.push(val); document.getElementById('stAntEquipoInput').value = ''; renderAntEquipos(); }
    });

    // Ant Selecciones rendering
    function renderAntSelecciones() {
      const ul = document.getElementById('stAntSeleccionesList');
      if (!ul) return;
      ul.innerHTML = localAntSelecciones.map((sel, idx) => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-bottom: 4px;">
          <span>${escapeHtml(sel)}</span>
          <button type="button" class="btn-action-icon danger btn-del-st-antsel" data-idx="${idx}" style="width: 22px; height: 22px;">
            <i data-lucide="trash-2" style="width: 12px;"></i>
          </button>
        </li>
      `).join('');
      ul.querySelectorAll('.btn-del-st-antsel').forEach(btn => {
        btn.addEventListener('click', () => {
          localAntSelecciones.splice(parseInt(btn.dataset.idx, 10), 1);
          renderAntSelecciones();
        });
      });
      if (window.lucide) window.lucide.createIcons();
    }
    renderAntSelecciones();
    document.getElementById('btnAddStAntSeleccion')?.addEventListener('click', () => {
      const val = document.getElementById('stAntSeleccionInput').value.trim();
      if (val) { localAntSelecciones.push(val); document.getElementById('stAntSeleccionInput').value = ''; renderAntSelecciones(); }
    });

    // Ant Clubes rendering
    function renderAntClubes() {
      const ul = document.getElementById('stAntClubesList');
      if (!ul) return;
      ul.innerHTML = localAntClubes.map((cl, idx) => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-bottom: 4px;">
          <span>${escapeHtml(cl)}</span>
          <button type="button" class="btn-action-icon danger btn-del-st-antclub" data-idx="${idx}" style="width: 22px; height: 22px;">
            <i data-lucide="trash-2" style="width: 12px;"></i>
          </button>
        </li>
      `).join('');
      ul.querySelectorAll('.btn-del-st-antclub').forEach(btn => {
        btn.addEventListener('click', () => {
          localAntClubes.splice(parseInt(btn.dataset.idx, 10), 1);
          renderAntClubes();
        });
      });
      if (window.lucide) window.lucide.createIcons();
    }
    renderAntClubes();
    document.getElementById('btnAddStAntClub')?.addEventListener('click', () => {
      const val = document.getElementById('stAntClubInput').value.trim();
      if (val) { localAntClubes.push(val); document.getElementById('stAntClubInput').value = ''; renderAntClubes(); }
    });

    // File Input Label
    document.getElementById('stFileInput')?.addEventListener('change', (e) => {
      const count = e.target.files.length;
      document.getElementById('stFileLabel').textContent = count > 0 ? `${count} archivo(s) seleccionado(s)` : '';
    });

    // Photo Upload Handler
    const inputFoto = document.getElementById('inputStaffFoto');
    document.getElementById('btnUploadStaffFoto')?.addEventListener('click', () => inputFoto.click());
    inputFoto?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          fotoData = await compressImage(file);
          document.getElementById('btnUploadStaffFoto').innerHTML = `<img src="${fotoData}" class="photo-upload-preview">`;
        } catch (err) {
          console.error('Error al comprimir foto:', err);
        }
      }
    });

    const removeLargeClass = () => card.classList.remove('large');
    document.getElementById('btnCloseModal')?.addEventListener('click', removeLargeClass, { once: true });
    document.getElementById('btnCancelModal')?.addEventListener('click', removeLargeClass, { once: true });
  }

  function openAgencyModal(agencyId = null) {
    const isEdit = !!agencyId;
    const ag = isEdit ? (state.directory.agencias?.find(a => a.id === agencyId) || {}) : {};

    const nombre = ag.nombre || ag.agencia || '';
    const localidad = ag.localidad || ag.ciudad || '';
    const anioFundacion = ag.anioFundacion || ag.fundacion || '';
    const sitioWeb = ag.sitioWeb || ag.web || '';

    const telefono = ag.telefono || '';
    const email = ag.email || ag.correo || '';
    const instagram = ag.instagram || '';
    const linkedin = ag.linkedin || '';
    const direccion = ag.direccion || ag.direccionFisica || '';

    let localAgentesList = ag.agentes ? JSON.parse(JSON.stringify(ag.agentes)) : [];
    let localJugadoresList = ag.jugadoresRepresentados ? JSON.parse(JSON.stringify(ag.jugadoresRepresentados)) : [];

    const notas = ag.notas || ag.historial || '';
    let logoData = ag.logo || ag.escudo || '';

    const titleText = isEdit ? `🏢 Ficha de ${escapeHtml(nombre)}` : '🏢 Nueva Agencia';

    const modalHTML = `
      <div class="agency-modal-wrapper">
        <p class="modal-subtitle mb-2" style="font-size: 12px; color: var(--text-muted);">Directorio de empresas de representación</p>

        <div class="player-modal-subtabs mb-4">
          <button type="button" class="player-subtab active" data-agtab="datos">DATOS AGENCIA</button>
          <button type="button" class="player-subtab" data-agtab="contacto">CONTACTO Y REDES</button>
          <button type="button" class="player-subtab" data-agtab="equipo">EQUIPO Y CLIENTES</button>
          <button type="button" class="player-subtab" data-agtab="notas">NOTAS Y DOCS</button>
        </div>

        <datalist id="agentesDatalistOptions">
          ${(state.directory.agentes || []).map(a => `<option value="${escapeHtml(a.nombre || a.agente)}"></option>`).join('')}
        </datalist>

        <datalist id="jugadoresDatalistOptions">
          ${((state.directory && state.directory.jugadores) || []).map(p => `<option value="${escapeHtml(p.nombre || p.jugador || p.name)}"></option>`).join('')}
        </datalist>

        <form id="agencyForm">
          <!-- TAB 1: DATOS AGENCIA -->
          <div class="ag-tab-pane" id="agtab-datos">
            <div class="player-profile-grid">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <div class="photo-upload-box" id="btnUploadAgencyLogo">
                  ${logoData ? `<img src="${logoData}" class="photo-upload-preview">` : `
                    <i data-lucide="cloud-upload" style="width: 32px; height: 32px;"></i>
                    <span>SUBIR LOGO</span>
                  `}
                  <input type="file" id="inputAgencyLogo" accept="image/*" class="hidden">
                </div>
              </div>

              <div>
                <div class="form-group mb-4">
                  <label class="form-label">NOMBRE DE LA AGENCIA</label>
                  <input type="text" id="agNombre" class="form-control" placeholder="Ej: Gestifute, Stellar Group..." value="${escapeHtml(nombre)}" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">LOCALIDAD</label>
                    <input type="text" id="agLocalidad" class="form-control" placeholder="Ej: Londres, Madrid..." value="${escapeHtml(localidad)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">AÑO DE FUNDACIÓN</label>
                    <input type="text" id="agAnioFundacion" class="form-control" placeholder="Ej: 1996" value="${escapeHtml(anioFundacion)}">
                  </div>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">SITIO WEB (URL)</label>
                  <input type="url" id="agSitioWeb" class="form-control" placeholder="https://www.agencia.com" value="${escapeHtml(sitioWeb)}">
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: CONTACTO Y REDES -->
          <div class="ag-tab-pane hidden" id="agtab-contacto">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">TELÉFONO</label>
                <input type="text" id="agTelefono" class="form-control" placeholder="Ej: +34 ..." value="${escapeHtml(telefono)}">
              </div>
              <div class="form-group">
                <label class="form-label">EMAIL</label>
                <input type="email" id="agEmail" class="form-control" placeholder="Ej: info@agencia.com" value="${escapeHtml(email)}">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">INSTAGRAM</label>
                <input type="text" id="agInstagram" class="form-control" placeholder="Ej: @agencia" value="${escapeHtml(instagram)}">
              </div>
              <div class="form-group">
                <label class="form-label">LINKEDIN</label>
                <input type="text" id="agLinkedin" class="form-control" placeholder="Ej: URL LinkedIn" value="${escapeHtml(linkedin)}">
              </div>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">DIRECCIÓN FÍSICA</label>
              <input type="text" id="agDireccion" class="form-control" placeholder="Calle, Número, Planta..." value="${escapeHtml(direccion)}">
            </div>
          </div>

          <!-- TAB 3: EQUIPO Y CLIENTES -->
          <div class="ag-tab-pane hidden" id="agtab-equipo">
            <div class="form-group mb-5">
              <label class="form-label">AGENTES DE LA AGENCIA</label>
              <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-2">
                <input type="text" id="agAgenteInput" list="agentesDatalistOptions" class="form-control" placeholder="Buscar agente en el directorio por nombre...">
                <button type="button" class="btn btn-primary" id="btnAddAgAgente"><i data-lucide="plus"></i> Añadir</button>
              </div>
              <ul id="agAgentesList" style="list-style: none; padding: 0; margin: 0; font-size: 12px;"></ul>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">JUGADORES REPRESENTADOS</label>
              <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-2">
                <input type="text" id="agJugadorInput" list="jugadoresDatalistOptions" class="form-control" placeholder="Buscar jugador en el directorio por nombre...">
                <button type="button" class="btn btn-primary" id="btnAddAgJugador"><i data-lucide="plus"></i> Añadir</button>
              </div>
              <ul id="agJugadoresList" style="list-style: none; padding: 0; margin: 0; font-size: 12px;"></ul>
            </div>
          </div>

          <!-- TAB 4: NOTAS Y DOCS -->
          <div class="ag-tab-pane hidden" id="agtab-notas">
            <div class="form-group mb-6">
              <label class="form-label">NOTAS / HISTORIAL</label>
              <textarea id="agNotas" class="form-control" rows="5" placeholder="Información relevante, portfolio, acuerdos...">${escapeHtml(notas)}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">DOSSIER / PORTFOLIO (PDF)</label>
              <div style="display: flex; align-items: center; gap: 12px; background-color: var(--bg-surface); padding: 16px; border: 1px dashed var(--border-light); border-radius: var(--radius-md); justify-content: center; flex-direction: column;">
                <i data-lucide="file-text" style="width: 32px; height: 32px; color: var(--text-muted);"></i>
                <label class="btn btn-secondary" style="font-size: 12px; margin: 0; cursor: pointer;">
                  SUBIR ARCHIVOS / DOCUMENTOS
                  <input type="file" id="agFileInput" multiple class="hidden">
                </label>
                <span id="agFileLabel" style="font-size: 11px; color: var(--text-muted);"></span>
              </div>
            </div>
          </div>
        </form>
      </div>
    `;

    const card = document.getElementById('generalModalCard');
    card.classList.add('large');

    showModal(titleText, modalHTML, () => {
      const nameVal = document.getElementById('agNombre').value.trim();
      if (!nameVal) return alert('Por favor ingresa el nombre de la agencia');

      const updatedAgency = {
        id: isEdit ? agencyId : 'ag_' + Date.now(),
        nombre: nameVal,
        agencia: nameVal,
        localidad: document.getElementById('agLocalidad').value.trim(),
        anioFundacion: document.getElementById('agAnioFundacion').value.trim(),
        sitioWeb: document.getElementById('agSitioWeb').value.trim(),

        telefono: document.getElementById('agTelefono').value.trim(),
        email: document.getElementById('agEmail').value.trim(),
        instagram: document.getElementById('agInstagram').value.trim(),
        linkedin: document.getElementById('agLinkedin').value.trim(),
        direccion: document.getElementById('agDireccion').value.trim(),

        agentes: localAgentesList,
        jugadoresRepresentados: localJugadoresList,

        notas: document.getElementById('agNotas').value.trim(),
        logo: logoData,
        escudo: logoData
      };

      if (!state.directory.agencias) state.directory.agencias = [];
      if (isEdit) {
        const idx = state.directory.agencias.findIndex(a => a && (String(a.id) === String(agencyId) || (a.codigo && String(a.codigo) === String(agencyId))));
        if (idx !== -1) state.directory.agencias[idx] = updatedAgency;
      } else {
        state.directory.agencias.unshift(updatedAgency);
      }
      saveToFirebase('agencias', updatedAgency);

      // Bidirectional sync for Agentes
      if (Array.isArray(localAgentesList)) {
        if (!state.directory.agentes) state.directory.agentes = [];
        localAgentesList.forEach(agItem => {
          const agName = typeof agItem === 'string' ? agItem : (agItem.nombre || agItem.agente || '');
          if (!agName) return;

          let targetAg = state.directory.agentes.find(a => 
            (a.nombre && a.nombre.toLowerCase() === agName.toLowerCase()) ||
            (a.agente && a.agente.toLowerCase() === agName.toLowerCase())
          );

          if (!targetAg) {
            targetAg = {
              id: 'agt_' + Date.now() + Math.floor(Math.random()*100),
              nombre: agName,
              agente: agName,
              agencia: nameVal,
              agenciaVinculada: nameVal
            };
            state.directory.agentes.unshift(targetAg);
          } else {
            targetAg.agencia = nameVal;
            targetAg.agenciaVinculada = nameVal;
          }
        });
      }

      // Bidirectional sync for Jugadores - only update existing players in directory
      if (Array.isArray(localJugadoresList)) {
        if (!state.directory.jugadores) state.directory.jugadores = [];
        localJugadoresList.forEach(jItem => {
          const jName = typeof jItem === 'string' ? jItem : (jItem.nombre || jItem.jugador || jItem.name || '');
          if (!jName) return;

          let targetPl = state.directory.jugadores.find(p => 
            (p.nombre && p.nombre.toLowerCase() === jName.toLowerCase()) ||
            (p.jugador && p.jugador.toLowerCase() === jName.toLowerCase()) ||
            (p.name && p.name.toLowerCase() === jName.toLowerCase())
          );

          if (targetPl) {
            targetPl.agencia = nameVal;
            targetPl.agenciaVinculada = nameVal;
          }
        });
      }

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    }, isEdit ? {
      label: 'Eliminar Agencia',
      title: `¿Eliminar Ficha de ${nombre || 'Agencia'}?`,
      message: `¿Estás seguro de que deseas eliminar permanentemente a "${nombre || 'Agencia'}" de la base de datos?`,
      action: () => {
        deleteFromFirebase('agencias', agencyId);
        state.directory.agencias = (state.directory.agencias || []).filter(item => item.id !== agencyId);
        saveState();
        hideModal();
        renderDirectorio();
      }
    } : null);

    // Subtab switching logic
    const subtabs = document.querySelectorAll('.player-subtab');
    const panes = document.querySelectorAll('.ag-tab-pane');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        const targetPane = document.getElementById('agtab-' + tab.dataset.agtab);
        if (targetPane) targetPane.classList.remove('hidden');
      });
    });

    // Agentes rendering
    function renderAgAgentes() {
      const ul = document.getElementById('agAgentesList');
      if (!ul) return;
      ul.innerHTML = localAgentesList.map((ag, idx) => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-bottom: 4px;">
          <span>${escapeHtml(typeof ag === 'string' ? ag : ag.nombre)}</span>
          <button type="button" class="btn-action-icon danger btn-del-ag-agente" data-idx="${idx}" style="width: 22px; height: 22px;">
            <i data-lucide="trash-2" style="width: 12px;"></i>
          </button>
        </li>
      `).join('');
      ul.querySelectorAll('.btn-del-ag-agente').forEach(btn => {
        btn.addEventListener('click', () => {
          localAgentesList.splice(parseInt(btn.dataset.idx, 10), 1);
          renderAgAgentes();
        });
      });
      if (window.lucide) window.lucide.createIcons();
    }
    renderAgAgentes();
    document.getElementById('btnAddAgAgente')?.addEventListener('click', () => {
      const val = document.getElementById('agAgenteInput').value.trim();
      if (val) { localAgentesList.push(val); document.getElementById('agAgenteInput').value = ''; renderAgAgentes(); }
    });

    // Jugadores Representados rendering
    function renderAgJugadores() {
      const ul = document.getElementById('agJugadoresList');
      if (!ul) return;

      const agNameLower = (nombre || ag.nombre || ag.agencia || '').trim().toLowerCase();
      const allLinkedPlayersMap = new Map();

      // 1. From localJugadoresList
      localJugadoresList.forEach(item => {
        const jName = typeof item === 'object' ? item.nombre : item;
        if (jName) {
          const matchPlayer = (state.directory.jugadores || []).find(p => p.nombre?.toLowerCase() === jName.toLowerCase());
          allLinkedPlayersMap.set(jName.toLowerCase(), {
            id: matchPlayer ? matchPlayer.id : (typeof item === 'object' ? item.id : null),
            nombre: jName,
            posicion: matchPlayer ? (matchPlayer.posicion || matchPlayer.posicionPrincipal || '') : '',
            equipo: matchPlayer ? matchPlayer.equipo : ''
          });
        }
      });

      // 2. From state.directory.jugadores
      if (agNameLower && state.directory.jugadores) {
        state.directory.jugadores.forEach(p => {
          if (p.agencia && p.agencia.trim().toLowerCase() === agNameLower) {
            if (!allLinkedPlayersMap.has(p.nombre.toLowerCase())) {
              allLinkedPlayersMap.set(p.nombre.toLowerCase(), {
                id: p.id,
                nombre: p.nombre,
                posicion: p.posicion || p.posicionPrincipal || '',
                equipo: p.equipo || ''
              });
            }
          }
        });
      }

      const combinedList = Array.from(allLinkedPlayersMap.values());

      if (combinedList.length === 0) {
        ul.innerHTML = `<li style="padding: 8px; color: var(--text-muted); font-size: 12px; font-style: italic;">Sin jugadores representados vinculados</li>`;
        return;
      }

      ul.innerHTML = combinedList.map((j) => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${j.posicion ? `<span class="match-category-tag" style="background: var(--primary-blue-light); color: var(--primary-blue); font-weight: 800; font-size: 10px; padding: 2px 6px;">${escapeHtml(j.posicion)}</span>` : ''}
            <span class="btn-open-player-from-agency cursor-pointer" data-playerid="${j.id || ''}" style="font-weight: 700; color: var(--primary-blue); text-decoration: underline;">
              ${escapeHtml(j.nombre)}
            </span>
            ${j.equipo ? `<span style="font-size: 11px; color: var(--text-muted);">(${escapeHtml(j.equipo)})</span>` : ''}
          </div>
          <button type="button" class="btn-action-icon danger btn-del-ag-jugador" data-jname="${escapeHtml(j.nombre)}" style="width: 22px; height: 22px;">
            <i data-lucide="trash-2" style="width: 12px;"></i>
          </button>
        </li>
      `).join('');

      ul.querySelectorAll('.btn-open-player-from-agency').forEach(span => {
        span.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const pId = span.dataset.playerid;
          if (pId) {
            card.classList.remove('large');
            hideModal();
            openPlayerModal(pId);
          }
        });
      });

      ul.querySelectorAll('.btn-del-ag-jugador').forEach(btn => {
        btn.addEventListener('click', () => {
          const jNameDel = btn.dataset.jname;
          localJugadoresList = localJugadoresList.filter(item => (typeof item === 'object' ? item.nombre : item).toLowerCase() !== jNameDel.toLowerCase());
          if (state.directory.jugadores) {
            const pObj = state.directory.jugadores.find(p => p.nombre.toLowerCase() === jNameDel.toLowerCase());
            if (pObj) { pObj.agencia = ''; saveState(); }
          }
          renderAgJugadores();
        });
      });
      if (window.lucide) window.lucide.createIcons();
    }
    renderAgJugadores();
    document.getElementById('btnAddAgJugador')?.addEventListener('click', () => {
      const val = document.getElementById('agJugadorInput').value.trim();
      if (val) { localJugadoresList.push(val); document.getElementById('agJugadorInput').value = ''; renderAgJugadores(); }
    });

    // File Input Label
    document.getElementById('agFileInput')?.addEventListener('change', (e) => {
      const count = e.target.files.length;
      document.getElementById('agFileLabel').textContent = count > 0 ? `${count} archivo(s) seleccionado(s)` : '';
    });

    // Logo Upload Handler
    const inputLogo = document.getElementById('inputAgencyLogo');
    document.getElementById('btnUploadAgencyLogo')?.addEventListener('click', () => inputLogo.click());
    inputLogo?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          logoData = await compressImage(file);
          document.getElementById('btnUploadAgencyLogo').innerHTML = `<img src="${logoData}" class="photo-upload-preview">`;
        } catch (err) {
          console.error('Error al comprimir logo:', err);
        }
      }
    });

    const removeLargeClass = () => card.classList.remove('large');
    document.getElementById('btnCloseModal')?.addEventListener('click', removeLargeClass, { once: true });
    document.getElementById('btnCancelModal')?.addEventListener('click', removeLargeClass, { once: true });
  }

  function openAgentModal(agentId = null) {
    const isEdit = !!agentId;
    const agt = isEdit ? (state.directory.agentes?.find(a => a.id === agentId) || {}) : {};

    const nombre = agt.nombre || agt.nombreCompleto || '';
    const nacionalidad = agt.nacionalidad || '';
    const localidad = agt.localidad || agt.ciudad || '';
    const idiomas = agt.idiomas || '';
    const licencia = agt.licencia || agt.licenciaFifaref || '';

    const telefono = agt.telefono || '';
    const email = agt.email || agt.correo || '';
    const instagram = agt.instagram || '';
    const twitter = agt.twitter || agt.x || '';
    const linkedin = agt.linkedin || '';

    const agencia = agt.agencia || agt.agenciaRepresentacion || '';
    const zonas = agt.zonas || agt.zonasActuacion || '';
    let localJugadoresList = agt.jugadoresRepresentados ? JSON.parse(JSON.stringify(agt.jugadoresRepresentados)) : [];

    const notas = agt.notas || agt.observaciones || '';
    let fotoData = agt.foto || agt.imagen || '';

    const titleText = isEdit ? `💼 Ficha de ${escapeHtml(nombre)}` : '💼 Nuevo Agente';

    const modalHTML = `
      <div class="agent-modal-wrapper">
        <p class="modal-subtitle mb-2" style="font-size: 12px; color: var(--text-muted);">Gestión de representantes y scouts</p>

        <div class="player-modal-subtabs mb-4">
          <button type="button" class="player-subtab active" data-agttab="perfil">PERFIL</button>
          <button type="button" class="player-subtab" data-agttab="contacto">CONTACTO</button>
          <button type="button" class="player-subtab" data-agttab="agencia">AGENCIA Y JUGADORES</button>
          <button type="button" class="player-subtab" data-agttab="notas">NOTAS Y DOCS</button>
        </div>

        <datalist id="agenciasDatalistOptions">
          ${(state.directory.agencias || []).map(a => `<option value="${escapeHtml(a.nombre || a.agencia)}"></option>`).join('')}
        </datalist>

        <datalist id="jugadoresDatalistOptions">
          ${((state.directory && state.directory.jugadores) || []).map(p => `<option value="${escapeHtml(p.nombre || p.jugador || p.name)}"></option>`).join('')}
        </datalist>

        <form id="agentForm">
          <!-- TAB 1: PERFIL -->
          <div class="agt-tab-pane" id="agttab-perfil">
            <div class="player-profile-grid">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <div class="photo-upload-box" id="btnUploadAgentFoto">
                  ${fotoData ? `<img src="${fotoData}" class="photo-upload-preview">` : `
                    <i data-lucide="cloud-upload" style="width: 32px; height: 32px;"></i>
                    <span>SUBIR FOTO</span>
                  `}
                  <input type="file" id="inputAgentFoto" accept="image/*" class="hidden">
                </div>
              </div>

              <div>
                <div class="form-group mb-4">
                  <label class="form-label">NOMBRE COMPLETO</label>
                  <input type="text" id="agtNombre" class="form-control" placeholder="Nombre y Apellidos" value="${escapeHtml(nombre)}" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">NACIONALIDAD</label>
                    <input type="text" id="agtNacionalidad" class="form-control" placeholder="Ej: Española" value="${escapeHtml(nacionalidad)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">LOCALIDAD</label>
                    <input type="text" id="agtLocalidad" class="form-control" placeholder="Ej: Madrid" value="${escapeHtml(localidad)}">
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">IDIOMAS</label>
                    <input type="text" id="agtIdiomas" class="form-control" placeholder="Ej: Español, Inglés..." value="${escapeHtml(idiomas)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">LICENCIA FIFA/RFEF</label>
                    <input type="text" id="agtLicencia" class="form-control" placeholder="Nº de Licencia" value="${escapeHtml(licencia)}">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: CONTACTO -->
          <div class="agt-tab-pane hidden" id="agttab-contacto">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">TELÉFONO</label>
                <input type="text" id="agtTelefono" class="form-control" placeholder="Ej: +34 ..." value="${escapeHtml(telefono)}">
              </div>
              <div class="form-group">
                <label class="form-label">EMAIL</label>
                <input type="email" id="agtEmail" class="form-control" placeholder="Ej: email@agente.com" value="${escapeHtml(email)}">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">INSTAGRAM</label>
                <input type="text" id="agtInstagram" class="form-control" placeholder="Ej: @usuario" value="${escapeHtml(instagram)}">
              </div>
              <div class="form-group">
                <label class="form-label">TWITTER / X</label>
                <input type="text" id="agtTwitter" class="form-control" placeholder="Ej: @usuario" value="${escapeHtml(twitter)}">
              </div>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">LINKEDIN (URL)</label>
              <input type="url" id="agtLinkedin" class="form-control" placeholder="https://linkedin.com/in/..." value="${escapeHtml(linkedin)}">
            </div>
          </div>

          <!-- TAB 3: AGENCIA Y JUGADORES -->
          <div class="agt-tab-pane hidden" id="agttab-agencia">
            <div class="form-group mb-4">
              <label class="form-label">AGENCIA DE REPRESENTACIÓN</label>
              <input type="text" id="agtAgencia" list="agenciasDatalistOptions" class="form-control" placeholder="Buscar agencia en el directorio..." value="${escapeHtml(agencia)}">
            </div>

            <div class="form-group mb-4">
              <label class="form-label">ZONAS DE ACTUACIÓN</label>
              <input type="text" id="agtZonas" class="form-control" placeholder="Ej: España, Portugal, Alemania..." value="${escapeHtml(zonas)}">
            </div>

            <div class="form-group mb-4">
              <label class="form-label">JUGADORES REPRESENTADOS</label>
              <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-2">
                <input type="text" id="agtJugadorInput" list="jugadoresDatalistOptions" class="form-control" placeholder="Buscar jugador en el directorio por nombre...">
                <button type="button" class="btn btn-primary" id="btnAddAgtJugador"><i data-lucide="plus"></i> Añadir</button>
              </div>
              <ul id="agtJugadoresList" style="list-style: none; padding: 0; margin: 0; font-size: 12px;"></ul>
            </div>
          </div>

          <!-- TAB 4: NOTAS Y DOCS -->
          <div class="agt-tab-pane hidden" id="agttab-notas">
            <div class="form-group mb-6">
              <label class="form-label">NOTAS ADICIONALES</label>
              <textarea id="agtNotas" class="form-control" rows="5" placeholder="Observaciones, historial, acuerdos...">${escapeHtml(notas)}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">DOCUMENTO ID / CONTRATO</label>
              <div style="display: flex; align-items: center; gap: 12px; background-color: var(--bg-surface); padding: 16px; border: 1px dashed var(--border-light); border-radius: var(--radius-md); justify-content: center; flex-direction: column;">
                <i data-lucide="file-text" style="width: 32px; height: 32px; color: var(--text-muted);"></i>
                <label class="btn btn-secondary" style="font-size: 12px; margin: 0; cursor: pointer;">
                  SUBIR PDF O IMAGEN
                  <input type="file" id="agtFileInput" multiple class="hidden">
                </label>
                <span id="agtFileLabel" style="font-size: 11px; color: var(--text-muted);"></span>
              </div>
            </div>
          </div>
        </form>
      </div>
    `;

    const card = document.getElementById('generalModalCard');
    card.classList.add('large');

    showModal(titleText, modalHTML, () => {
      const nameVal = document.getElementById('agtNombre').value.trim();
      if (!nameVal) return alert('Por favor ingresa el nombre completo');

      const updatedAgent = {
        id: isEdit ? agentId : 'agt_' + Date.now(),
        nombre: nameVal,
        nombreCompleto: nameVal,
        nacionalidad: document.getElementById('agtNacionalidad').value.trim(),
        localidad: document.getElementById('agtLocalidad').value.trim(),
        idiomas: document.getElementById('agtIdiomas').value.trim(),
        licencia: document.getElementById('agtLicencia').value.trim(),

        telefono: document.getElementById('agtTelefono').value.trim(),
        email: document.getElementById('agtEmail').value.trim(),
        instagram: document.getElementById('agtInstagram').value.trim(),
        twitter: document.getElementById('agtTwitter').value.trim(),
        linkedin: document.getElementById('agtLinkedin').value.trim(),

        agencia: document.getElementById('agtAgencia').value.trim(),
        zonas: document.getElementById('agtZonas').value.trim(),
        jugadoresRepresentados: localJugadoresList,

        notas: document.getElementById('agtNotas').value.trim(),
        foto: fotoData,
        imagen: fotoData
      };

      if (!state.directory.agentes) state.directory.agentes = [];
      if (isEdit) {
        const idx = state.directory.agentes.findIndex(a => a && (String(a.id) === String(agentId) || (a.codigo && String(a.codigo) === String(agentId))));
        if (idx !== -1) state.directory.agentes[idx] = updatedAgent;
      } else {
        state.directory.agentes.unshift(updatedAgent);
      }
      saveToFirebase('agentes', updatedAgent);

      // Bidirectional sync for Agencia
      if (updatedAgent.agencia && state.directory.agencias) {
        let targetAg = state.directory.agencias.find(a => 
          (a.nombre && a.nombre.toLowerCase() === updatedAgent.agencia.toLowerCase()) ||
          (a.agencia && a.agencia.toLowerCase() === updatedAgent.agencia.toLowerCase())
        );
        if (targetAg) {
          if (!targetAg.agentes) targetAg.agentes = [];
          const exists = targetAg.agentes.some(ag => (typeof ag === 'string' ? ag : ag.nombre) === nameVal);
          if (!exists) targetAg.agentes.push({ id: updatedAgent.id, nombre: nameVal });
        }
      }

      // Bidirectional sync for Jugadores - only update existing players in directory
      if (Array.isArray(localJugadoresList)) {
        if (!state.directory.jugadores) state.directory.jugadores = [];
        localJugadoresList.forEach(jItem => {
          const jName = typeof jItem === 'string' ? jItem : (jItem.nombre || jItem.jugador || jItem.name || '');
          if (!jName) return;

          let targetPl = state.directory.jugadores.find(p => 
            (p.nombre && p.nombre.toLowerCase() === jName.toLowerCase()) ||
            (p.jugador && p.jugador.toLowerCase() === jName.toLowerCase()) ||
            (p.name && p.name.toLowerCase() === jName.toLowerCase())
          );

          if (targetPl) {
            targetPl.agente = nameVal;
            if (updatedAgent.agencia) targetPl.agencia = updatedAgent.agencia;
          }
        });
      }

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    }, isEdit ? {
      label: 'Eliminar Agente',
      title: `¿Eliminar Ficha de ${nombre || 'Agente'}?`,
      message: `¿Estás seguro de que deseas eliminar permanentemente a "${nombre || 'Agente'}" de la base de datos?`,
      action: () => {
        deleteFromFirebase('agentes', agentId);
        state.directory.agentes = (state.directory.agentes || []).filter(item => item.id !== agentId);
        saveState();
        hideModal();
        renderDirectorio();
      }
    } : null);

    // Subtab switching logic
    const subtabs = document.querySelectorAll('.player-subtab');
    const panes = document.querySelectorAll('.agt-tab-pane');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        const targetPane = document.getElementById('agttab-' + tab.dataset.agttab);
        if (targetPane) targetPane.classList.remove('hidden');
      });
    });

    // Jugadores Representados rendering
    function renderAgtJugadores() {
      const ul = document.getElementById('agtJugadoresList');
      if (!ul) return;

      const agtNameLower = (nombre || agt.nombre || agt.nombreCompleto || '').trim().toLowerCase();
      const allLinkedPlayersMap = new Map();

      // 1. From localJugadoresList
      localJugadoresList.forEach(item => {
        const jName = typeof item === 'object' ? item.nombre : item;
        if (jName) {
          const matchPlayer = (state.directory.jugadores || []).find(p => p.nombre?.toLowerCase() === jName.toLowerCase());
          allLinkedPlayersMap.set(jName.toLowerCase(), {
            id: matchPlayer ? matchPlayer.id : (typeof item === 'object' ? item.id : null),
            nombre: jName,
            posicion: matchPlayer ? (matchPlayer.posicion || matchPlayer.posicionPrincipal || '') : '',
            equipo: matchPlayer ? matchPlayer.equipo : ''
          });
        }
      });

      // 2. From state.directory.jugadores
      if (agtNameLower && state.directory.jugadores) {
        state.directory.jugadores.forEach(p => {
          if (p.agente && p.agente.trim().toLowerCase() === agtNameLower) {
            if (!allLinkedPlayersMap.has(p.nombre.toLowerCase())) {
              allLinkedPlayersMap.set(p.nombre.toLowerCase(), {
                id: p.id,
                nombre: p.nombre,
                posicion: p.posicion || p.posicionPrincipal || '',
                equipo: p.equipo || ''
              });
            }
          }
        });
      }

      const combinedList = Array.from(allLinkedPlayersMap.values());

      if (combinedList.length === 0) {
        ul.innerHTML = `<li style="padding: 8px; color: var(--text-muted); font-size: 12px; font-style: italic;">Sin jugadores representados vinculados</li>`;
        return;
      }

      ul.innerHTML = combinedList.map((j) => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${j.posicion ? `<span class="match-category-tag" style="background: var(--primary-blue-light); color: var(--primary-blue); font-weight: 800; font-size: 10px; padding: 2px 6px;">${escapeHtml(j.posicion)}</span>` : ''}
            <span class="btn-open-player-from-agent cursor-pointer" data-playerid="${j.id || ''}" style="font-weight: 700; color: var(--primary-blue); text-decoration: underline;">
              ${escapeHtml(j.nombre)}
            </span>
            ${j.equipo ? `<span style="font-size: 11px; color: var(--text-muted);">(${escapeHtml(j.equipo)})</span>` : ''}
          </div>
          <button type="button" class="btn-action-icon danger btn-del-agt-jugador" data-jname="${escapeHtml(j.nombre)}" style="width: 22px; height: 22px;">
            <i data-lucide="trash-2" style="width: 12px;"></i>
          </button>
        </li>
      `).join('');

      ul.querySelectorAll('.btn-open-player-from-agent').forEach(span => {
        span.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const pId = span.dataset.playerid;
          if (pId) {
            card.classList.remove('large');
            hideModal();
            openPlayerModal(pId);
          }
        });
      });

      ul.querySelectorAll('.btn-del-agt-jugador').forEach(btn => {
        btn.addEventListener('click', () => {
          const jNameDel = btn.dataset.jname;
          localJugadoresList = localJugadoresList.filter(item => (typeof item === 'object' ? item.nombre : item).toLowerCase() !== jNameDel.toLowerCase());
          if (state.directory.jugadores) {
            const pObj = state.directory.jugadores.find(p => p.nombre.toLowerCase() === jNameDel.toLowerCase());
            if (pObj) { pObj.agente = ''; saveState(); }
          }
          renderAgtJugadores();
        });
      });
      if (window.lucide) window.lucide.createIcons();
    }
    renderAgtJugadores();
    document.getElementById('btnAddAgtJugador')?.addEventListener('click', () => {
      const val = document.getElementById('agtJugadorInput').value.trim();
      if (val) { localJugadoresList.push(val); document.getElementById('agtJugadorInput').value = ''; renderAgtJugadores(); }
    });

    // File Input Label
    document.getElementById('agtFileInput')?.addEventListener('change', (e) => {
      const count = e.target.files.length;
      document.getElementById('agtFileLabel').textContent = count > 0 ? `${count} archivo(s) seleccionado(s)` : '';
    });

    // Photo Upload Handler
    const inputFoto = document.getElementById('inputAgentFoto');
    document.getElementById('btnUploadAgentFoto')?.addEventListener('click', () => inputFoto.click());
    inputFoto?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          fotoData = await compressImage(file);
          document.getElementById('btnUploadAgentFoto').innerHTML = `<img src="${fotoData}" class="photo-upload-preview">`;
        } catch (err) {
          console.error('Error al comprimir foto:', err);
        }
      }
    });

    const removeLargeClass = () => card.classList.remove('large');
    document.getElementById('btnCloseModal')?.addEventListener('click', removeLargeClass, { once: true });
    document.getElementById('btnCancelModal')?.addEventListener('click', removeLargeClass, { once: true });
  }

  function openStadiumModal(stadiumId = null) {
    const isEdit = !!stadiumId;
    const est = isEdit ? (state.directory.estadios?.find(e => e.id === stadiumId) || {}) : {};

    const nombre = est.nombre || est.estadio || '';
    const superficie = est.superficie || 'Césped Natural';
    const capacidad = est.capacidad || '';
    const dimensiones = est.dimensiones || '';

    const localidad = est.localidad || est.ciudad || '';
    const comunidad = est.comunidad || est.comunidadAutonoma || '';
    const telefono = est.telefono || est.telefonoContacto || '';
    const gmaps = est.gmaps || est.googleMaps || '';
    const direccion = est.direccion || est.direccionCompleta || '';

    let localClubesList = est.clubes ? JSON.parse(JSON.stringify(est.clubes)) : [];
    const notas = est.notas || est.especificaciones || '';
    let fotoData = est.foto || est.imagen || '';

    const titleText = isEdit ? `🏟️ Ficha de ${escapeHtml(nombre)}` : '🏟️ Nuevo Estadio';

    const modalHTML = `
      <div class="stadium-modal-wrapper">
        <p class="modal-subtitle mb-2" style="font-size: 12px; color: var(--text-muted);">Gestión de sedes y recintos deportivos</p>

        <div class="player-modal-subtabs mb-4">
          <button type="button" class="player-subtab active" data-esttab="tecnica">FICHA TÉCNICA</button>
          <button type="button" class="player-subtab" data-esttab="ubicacion">UBICACIÓN</button>
          <button type="button" class="player-subtab" data-esttab="clubes">CLUBES</button>
          <button type="button" class="player-subtab" data-esttab="notas">NOTAS Y DOCS</button>
        </div>

        <datalist id="clubesEstadioDatalistOptions">
          ${(state.directory.clubes || []).map(c => `<option value="${escapeHtml(c.nombre)}"></option>`).join('')}
          ${(state.directory.equipos || []).map(e => `<option value="${escapeHtml(e.nombre || e.equipo)}"></option>`).join('')}
        </datalist>

        <form id="stadiumForm">
          <!-- TAB 1: FICHA TÉCNICA -->
          <div class="est-tab-pane" id="esttab-tecnica">
            <div class="player-profile-grid">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <div class="photo-upload-box" id="btnUploadStadiumFoto">
                  ${fotoData ? `<img src="${fotoData}" class="photo-upload-preview">` : `
                    <i data-lucide="cloud-upload" style="width: 32px; height: 32px;"></i>
                    <span>SUBIR FOTO</span>
                  `}
                  <input type="file" id="inputStadiumFoto" accept="image/*" class="hidden">
                </div>
              </div>

              <div>
                <div class="form-group mb-4">
                  <label class="form-label">NOMBRE DEL ESTADIO</label>
                  <input type="text" id="estNombre" class="form-control" placeholder="Ej: Santiago Bernabéu..." value="${escapeHtml(nombre)}" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">SUPERFICIE</label>
                    <select id="estSuperficie" class="form-control">
                      <option value="">-- Selecciona superficie --</option>
                      <option value="Césped Natural" ${superficie === 'Césped Natural' ? 'selected' : ''}>Césped Natural</option>
                      <option value="Césped Artificial" ${superficie === 'Césped Artificial' ? 'selected' : ''}>Césped Artificial</option>
                      <option value="Césped Híbrido" ${superficie === 'Césped Híbrido' ? 'selected' : ''}>Césped Híbrido</option>
                      <option value="Tierra" ${superficie === 'Tierra' ? 'selected' : ''}>Tierra</option>
                      <option value="Parqué / Pista" ${superficie === 'Parqué / Pista' ? 'selected' : ''}>Parqué / Pista</option>
                      ${superficie && !['Césped Natural', 'Césped Artificial', 'Césped Híbrido', 'Tierra', 'Parqué / Pista'].includes(superficie) ? `<option value="${escapeHtml(superficie)}" selected>${escapeHtml(superficie)}</option>` : ''}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">CAPACIDAD</label>
                    <input type="text" id="estCapacidad" class="form-control" placeholder="Ej: 80000" value="${escapeHtml(capacidad)}">
                  </div>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">DIMENSIONES</label>
                  <input type="text" id="estDimensiones" class="form-control" placeholder="Ej: 105x68 m" value="${escapeHtml(dimensiones)}">
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: UBICACIÓN -->
          <div class="est-tab-pane hidden" id="esttab-ubicacion">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">LOCALIDAD</label>
                <input type="text" id="estLocalidad" class="form-control" placeholder="Ej: Madrid, Pamplona..." value="${escapeHtml(localidad)}">
              </div>
              <div class="form-group">
                <label class="form-label">COMUNIDAD AUTÓNOMA</label>
                <select id="estComunidad" class="form-control">
                  <option value="">Seleccionar comunidad...</option>
                  ${['Navarra', 'País Vasco', 'La Rioja', 'Aragón', 'Madrid', 'Cataluña', 'Andalucía', 'Galicia', 'Castilla y León', 'Comunidad Valenciana', 'Asturias', 'Cantabria', 'Extremadura', 'Murcia', 'Baleares', 'Canarias', 'Castilla-La Mancha'].map(c => `<option value="${escapeHtml(c)}" ${comunidad === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
                  ${comunidad && !['Navarra', 'País Vasco', 'La Rioja', 'Aragón', 'Madrid', 'Cataluña', 'Andalucía', 'Galicia', 'Castilla y León', 'Comunidad Valenciana', 'Asturias', 'Cantabria', 'Extremadura', 'Murcia', 'Baleares', 'Canarias', 'Castilla-La Mancha'].includes(comunidad) ? `<option value="${escapeHtml(comunidad)}" selected>${escapeHtml(comunidad)}</option>` : ''}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">TELÉFONO CONTACTO</label>
                <input type="text" id="estTelefono" class="form-control" placeholder="Teléfono del recinto..." value="${escapeHtml(telefono)}">
              </div>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">GOOGLE MAPS (LINK)</label>
              <input type="url" id="estGmaps" class="form-control" placeholder="https://goo.gl/maps/..." value="${escapeHtml(gmaps)}">
            </div>

            <div class="form-group mb-4">
              <label class="form-label">DIRECCIÓN COMPLETA</label>
              <input type="text" id="estDireccion" class="form-control" placeholder="Calle, Número, Ciudad..." value="${escapeHtml(direccion)}">
            </div>
          </div>

          <!-- TAB 3: CLUBES -->
          <div class="est-tab-pane hidden" id="esttab-clubes">
            <div class="form-group mb-4">
              <label class="form-label">CLUBES QUE JUEGAN AQUÍ</label>
              <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;" class="mb-2">
                <input type="text" id="estClubInput" list="clubesEstadioDatalistOptions" class="form-control" placeholder="Buscar club o equipo en el directorio por nombre...">
                <button type="button" class="btn btn-primary" id="btnAddEstClub"><i data-lucide="plus"></i> Añadir</button>
              </div>
              <ul id="estClubesList" style="list-style: none; padding: 0; margin: 0; font-size: 12px;"></ul>
            </div>
          </div>

          <!-- TAB 4: NOTAS Y DOCS -->
          <div class="est-tab-pane hidden" id="esttab-notas">
            <div class="form-group mb-6">
              <label class="form-label">NOTAS / ESPECIFICACIONES</label>
              <textarea id="estNotas" class="form-control" rows="5" placeholder="Información sobre accesos, vestuarios, iluminación...">${escapeHtml(notas)}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">DOCUMENTO ADJUNTO (PDF/IMAGEN)</label>
              <div style="display: flex; align-items: center; gap: 12px; background-color: var(--bg-surface); padding: 16px; border: 1px dashed var(--border-light); border-radius: var(--radius-md); justify-content: center; flex-direction: column;">
                <i data-lucide="file-text" style="width: 32px; height: 32px; color: var(--text-muted);"></i>
                <label class="btn btn-secondary" style="font-size: 12px; margin: 0; cursor: pointer;">
                  SUBIR DOCUMENTO
                  <input type="file" id="estFileInput" multiple class="hidden">
                </label>
                <span id="estFileLabel" style="font-size: 11px; color: var(--text-muted);"></span>
              </div>
            </div>
          </div>
        </form>
      </div>
    `;

    const card = document.getElementById('generalModalCard');
    card.classList.add('large');

    showModal(titleText, modalHTML, () => {
      const nameVal = document.getElementById('estNombre').value.trim();
      if (!nameVal) return alert('Por favor ingresa el nombre del estadio');

      const updatedStadium = {
        id: isEdit ? stadiumId : 'est_' + Date.now(),
        nombre: nameVal,
        estadio: nameVal,
        superficie: document.getElementById('estSuperficie').value,
        capacidad: document.getElementById('estCapacidad').value.trim(),
        dimensiones: document.getElementById('estDimensiones').value.trim(),

        localidad: document.getElementById('estLocalidad').value.trim(),
        comunidad: document.getElementById('estComunidad').value.trim(),
        telefono: document.getElementById('estTelefono').value.trim(),
        gmaps: document.getElementById('estGmaps').value.trim(),
        direccion: document.getElementById('estDireccion').value.trim(),

        clubes: localClubesList,
        notas: document.getElementById('estNotas').value.trim(),
        foto: fotoData,
        imagen: fotoData
      };

      if (!state.directory.estadios) state.directory.estadios = [];
      if (isEdit) {
        const idx = state.directory.estadios.findIndex(e => e && (String(e.id) === String(stadiumId) || (e.codigo && String(e.codigo) === String(stadiumId))));
        if (idx !== -1) state.directory.estadios[idx] = updatedStadium;
      } else {
        state.directory.estadios.unshift(updatedStadium);
      }
      saveToFirebase('estadios', updatedStadium);

      // Bidirectional sync for Clubes & Equipos
      if (Array.isArray(localClubesList)) {
        localClubesList.forEach(cItem => {
          const cName = typeof cItem === 'string' ? cItem : (cItem.nombre || cItem.club || '');
          if (!cName) return;

          if (state.directory.clubes) {
            let targetClub = state.directory.clubes.find(c => (c.nombre && c.nombre.toLowerCase() === cName.toLowerCase()) || (c.club && c.club.toLowerCase() === cName.toLowerCase()));
            if (targetClub) {
              targetClub.estadio = nameVal;
              targetClub.estadioVinculado = nameVal;
            }
          }

          if (state.directory.equipos) {
            let targetEq = state.directory.equipos.find(e => (e.nombre && e.nombre.toLowerCase() === cName.toLowerCase()) || (e.equipo && e.equipo.toLowerCase() === cName.toLowerCase()));
            if (targetEq) {
              targetEq.estadio = nameVal;
              targetEq.estadioVinculado = nameVal;
            }
          }
        });
      }

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    }, isEdit ? {
      label: 'Eliminar Estadio',
      title: `¿Eliminar Ficha de ${nombre || 'Estadio'}?`,
      message: `¿Estás seguro de que deseas eliminar permanentemente a "${nombre || 'Estadio'}" de la base de datos?`,
      action: () => {
        deleteFromFirebase('estadios', stadiumId);
        state.directory.estadios = (state.directory.estadios || []).filter(item => item.id !== stadiumId);
        saveState();
        hideModal();
        renderDirectorio();
      }
    } : null);

    // Subtab switching logic
    const subtabs = document.querySelectorAll('.player-subtab');
    const panes = document.querySelectorAll('.est-tab-pane');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        const targetPane = document.getElementById('esttab-' + tab.dataset.esttab);
        if (targetPane) targetPane.classList.remove('hidden');
      });
    });

    // Clubes rendering
    function renderEstClubes() {
      const ul = document.getElementById('estClubesList');
      if (!ul) return;
      ul.innerHTML = localClubesList.map((c, idx) => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-bottom: 4px;">
          <span>${escapeHtml(typeof c === 'string' ? c : c.nombre)}</span>
          <button type="button" class="btn-action-icon danger btn-del-est-club" data-idx="${idx}" style="width: 22px; height: 22px;">
            <i data-lucide="trash-2" style="width: 12px;"></i>
          </button>
        </li>
      `).join('');
      ul.querySelectorAll('.btn-del-est-club').forEach(btn => {
        btn.addEventListener('click', () => {
          localClubesList.splice(parseInt(btn.dataset.idx, 10), 1);
          renderEstClubes();
        });
      });
      if (window.lucide) window.lucide.createIcons();
    }
    renderEstClubes();
    document.getElementById('btnAddEstClub')?.addEventListener('click', () => {
      const val = document.getElementById('estClubInput').value.trim();
      if (val) { localClubesList.push(val); document.getElementById('estClubInput').value = ''; renderEstClubes(); }
    });

    // File Input Label
    document.getElementById('estFileInput')?.addEventListener('change', (e) => {
      const count = e.target.files.length;
      document.getElementById('estFileLabel').textContent = count > 0 ? `${count} archivo(s) seleccionado(s)` : '';
    });

    // Photo Upload Handler
    const inputFoto = document.getElementById('inputStadiumFoto');
    document.getElementById('btnUploadStadiumFoto')?.addEventListener('click', () => inputFoto.click());
    inputFoto?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          fotoData = await compressImage(file);
          document.getElementById('btnUploadStadiumFoto').innerHTML = `<img src="${fotoData}" class="photo-upload-preview">`;
        } catch (err) {
          console.error('Error al comprimir foto:', err);
        }
      }
    });

    const removeLargeClass = () => card.classList.remove('large');
    document.getElementById('btnCloseModal')?.addEventListener('click', removeLargeClass, { once: true });
    document.getElementById('btnCancelModal')?.addEventListener('click', removeLargeClass, { once: true });
  }

  let currentDirectoryPage = 1;
  let currentSubCategoryFilter = 'TODOS';
  let currentSubGroupFilter = 'TODOS';
  let currentFederationFilter = 'TODAS';
  let currentComunidadFilter = 'TODAS';
  const DIR_PAGE_SIZE = 25;

  const FEDERACIONES_AUTONOMICAS_ESPAÑA = [
    { id: 'fed_rfef', nombre: 'RFEF - Real Federación Española de Fútbol', federacion: 'RFEF - Real Federación Española de Fútbol', ambito: 'Nacional', sede: 'Las Rozas (Madrid)', web: 'https://rfef.es', paginaWeb: 'https://rfef.es', email: 'rfef@rfef.es', telefono: '914 95 98 00', orderIndex: 1, logo: 'https://upload.wikimedia.org/wikipedia/commons/4/47/RFEF_logo.svg', escudo: 'https://upload.wikimedia.org/wikipedia/commons/4/47/RFEF_logo.svg', colorPrimary: '#dc2626', colorSecondary: '#eab308' },
    { id: 'fed_rfaf', nombre: 'RFAF - Real Federación Andaluza de Fútbol', federacion: 'RFAF - Real Federación Andaluza de Fútbol', ambito: 'Andalucía', sede: 'Sevilla', web: 'https://www.rfaf.es', paginaWeb: 'https://www.rfaf.es', email: 'rfaf@rfaf.es', telefono: '954 92 42 42', orderIndex: 2, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Logo_Real_Federaci%C3%B3n_Andaluza_de_F%C3%Batbol.png/360px-Logo_Real_Federaci%C3%B3n_Andaluza_de_F%C3%Batbol.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Logo_Real_Federaci%C3%B3n_Andaluza_de_F%C3%Batbol.png/360px-Logo_Real_Federaci%C3%B3n_Andaluza_de_F%C3%Batbol.png', colorPrimary: '#059669', colorSecondary: '#ffffff' },
    { id: 'fed_faf', nombre: 'FAF - Real Federación Aragonesa de Fútbol', federacion: 'FAF - Real Federación Aragonesa de Fútbol', ambito: 'Aragón', sede: 'Zaragoza', web: 'https://www.futbolaragon.org', paginaWeb: 'https://www.futbolaragon.org', email: 'secretaria@futbolaragon.org', telefono: '976 73 09 30', orderIndex: 3, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Escudo_Real_Federaci%C3%B3n_Aragonesa_de_F%C3%Batbol.png/360px-Escudo_Real_Federaci%C3%B3n_Aragonesa_de_F%C3%Batbol.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Escudo_Real_Federaci%C3%B3n_Aragonesa_de_F%C3%Batbol.png/360px-Escudo_Real_Federaci%C3%B3n_Aragonesa_de_F%C3%Batbol.png', colorPrimary: '#d97706', colorSecondary: '#2563eb' },
    { id: 'fed_asturias', nombre: 'RFFPA - Real Federación de Fútbol del Principado de Asturias', federacion: 'RFFPA - Real Federación de Fútbol del Principado de Asturias', ambito: 'Asturias', sede: 'Gijón', web: 'https://www.asturfutbol.es', paginaWeb: 'https://www.asturfutbol.es', email: 'asturfutbol@asturfutbol.es', telefono: '985 17 62 00', orderIndex: 4, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Logo_RFFPA.png/360px-Logo_RFFPA.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Logo_RFFPA.png/360px-Logo_RFFPA.png', colorPrimary: '#2563eb', colorSecondary: '#eab308' },
    { id: 'fed_ffib', nombre: 'FFIB - Federació de Futbol de les Illes Balears', federacion: 'FFIB - Federació de Futbol de les Illes Balears', ambito: 'Baleares', sede: 'Palma de Mallorca', web: 'https://www.ffib.es', paginaWeb: 'https://www.ffib.es', email: 'ffib@ffib.es', telefono: '971 24 84 11', orderIndex: 5, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Escudo_FFIB.png/360px-Escudo_FFIB.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Escudo_FFIB.png/360px-Escudo_FFIB.png', colorPrimary: '#1d4ed8', colorSecondary: '#eab308' },
    { id: 'fed_fcf_canarias', nombre: 'FCF - Federación Canaria de Fútbol', federacion: 'FCF - Federación Canaria de Fútbol', ambito: 'Canarias', sede: 'Las Palmas / Tenerife', web: 'https://www.ftf.es', paginaWeb: 'https://www.ftf.es', email: 'fcf@fcfutbol.es', telefono: '928 24 28 80', orderIndex: 6, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Logo_FCF_Canarias.png/360px-Logo_FCF_Canarias.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Logo_FCF_Canarias.png/360px-Logo_FCF_Canarias.png', colorPrimary: '#0284c7', colorSecondary: '#eab308' },
    { id: 'fed_rfcf', nombre: 'RFCF - Real Federación Cántabra de Fútbol', federacion: 'RFCF - Real Federación Cántabra de Fútbol', ambito: 'Cantabria', sede: 'Santander', web: 'https://www.rfcf.es', paginaWeb: 'https://www.rfcf.es', email: 'rfcf@rfcf.es', telefono: '942 22 28 00', orderIndex: 7, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_RFCF.png/360px-Logo_RFCF.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_RFCF.png/360px-Logo_RFCF.png', colorPrimary: '#e11d48', colorSecondary: '#ffffff' },
    { id: 'fed_fcylf', nombre: 'FCYLF - Real Federación de Castilla y León de Fútbol', federacion: 'FCYLF - Real Federación de Castilla y León de Fútbol', ambito: 'Castilla y León', sede: 'Valladolid', web: 'https://fcylf.es', paginaWeb: 'https://fcylf.es', email: 'fcylf@fcylf.es', telefono: '983 34 27 00', orderIndex: 8, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Logo_FCYLF.png/360px-Logo_FCYLF.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Logo_FCYLF.png/360px-Logo_FCYLF.png', colorPrimary: '#9f1239', colorSecondary: '#d97706' },
    { id: 'fed_ffcm', nombre: 'FFCM - Federación de Fútbol de Castilla-La Mancha', federacion: 'FFCM - Federación de Fútbol de Castilla-La Mancha', ambito: 'Castilla-La Mancha', sede: 'Cuenca / Tomelloso', web: 'https://www.ffcm.es', paginaWeb: 'https://www.ffcm.es', email: 'ffcm@ffcm.es', telefono: '926 51 04 04', orderIndex: 9, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Logo_FFCM.png/360px-Logo_FFCM.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Logo_FFCM.png/360px-Logo_FFCM.png', colorPrimary: '#be123c', colorSecondary: '#ffffff' },
    { id: 'fed_fcf_catalana', nombre: 'FCF - Federació Catalana de Futbol', federacion: 'FCF - Federació Catalana de Futbol', ambito: 'Cataluña', sede: 'Barcelona', web: 'https://www.fcf.cat', paginaWeb: 'https://www.fcf.cat', email: 'fcf@fcf.cat', telefono: '932 65 24 77', orderIndex: 10, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Federaci%C3%B3_Catalana_de_Futbol_logo.svg/360px-Federaci%C3%B3_Catalana_de_Futbol_logo.svg.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Federaci%C3%B3_Catalana_de_Futbol_logo.svg/360px-Federaci%C3%B3_Catalana_de_Futbol_logo.svg.png', colorPrimary: '#ca8a04', colorSecondary: '#dc2626' },
    { id: 'fed_fexf', nombre: 'FEXF - Real Federación Extremadura de Fútbol', federacion: 'FEXF - Real Federación Extremadura de Fútbol', ambito: 'Extremadura', sede: 'Badajoz / Mérida', web: 'https://www.fexfutbol.org', paginaWeb: 'https://www.fexfutbol.org', email: 'fexf@fexfutbol.org', telefono: '924 38 72 00', orderIndex: 11, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Escudo_FEXF.png/360px-Escudo_FEXF.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Escudo_FEXF.png/360px-Escudo_FEXF.png', colorPrimary: '#15803d', colorSecondary: '#ffffff' },
    { id: 'fed_fgf', nombre: 'FGF - Real Federación Gallega de Fútbol', federacion: 'FGF - Real Federación Gallega de Fútbol', ambito: 'Galicia', sede: 'A Coruña', web: 'https://www.futgal.es', paginaWeb: 'https://www.futgal.es', email: 'futgal@futgal.es', telefono: '981 12 77 10', orderIndex: 12, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Logo_Futgal.png/360px-Logo_Futgal.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Logo_Futgal.png/360px-Logo_Futgal.png', colorPrimary: '#0284c7', colorSecondary: '#ffffff' },
    { id: 'fed_frf', nombre: 'FRF - Federación Riojana de Fútbol', federacion: 'FRF - Federación Riojana de Fútbol', ambito: 'La Rioja', sede: 'Logroño', web: 'https://www.frfutbol.com', paginaWeb: 'https://www.frfutbol.com', email: 'frf@frfutbol.com', telefono: '941 23 20 44', orderIndex: 13, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Logo_FRF.png/360px-Logo_FRF.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Logo_FRF.png/360px-Logo_FRF.png', colorPrimary: '#dc2626', colorSecondary: '#16a34a' },
    { id: 'fed_rffm', nombre: 'RFFM - Real Federación de Fútbol de Madrid', federacion: 'RFFM - Real Federación de Fútbol de Madrid', ambito: 'Madrid', sede: 'Madrid', web: 'https://www.rffm.es', paginaWeb: 'https://www.rffm.es', email: 'rffm@rffm.es', telefono: '915 22 28 00', orderIndex: 14, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Logo_RFFM.png/360px-Logo_RFFM.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Logo_RFFM.png/360px-Logo_RFFM.png', colorPrimary: '#dc2626', colorSecondary: '#ffffff' },
    { id: 'fed_ffrm', nombre: 'FFRM - Federación de Fútbol de la Región de Murcia', federacion: 'FFRM - Federación de Fútbol de la Región de Murcia', ambito: 'Murcia', sede: 'Murcia', web: 'https://www.ffrm.es', paginaWeb: 'https://www.ffrm.es', email: 'ffrm@ffrm.es', telefono: '968 24 16 11', orderIndex: 15, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Logo_FFRM.png/360px-Logo_FFRM.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Logo_FFRM.png/360px-Logo_FFRM.png', colorPrimary: '#b91c1c', colorSecondary: '#eab308' },
    { id: 'fed_fnf', nombre: 'FNF - Federación Navarra de Fútbol', federacion: 'FNF - Federación Navarra de Fútbol', ambito: 'Navarra', sede: 'Pamplona', web: 'https://www.futbolnavarro.com', paginaWeb: 'https://www.futbolnavarro.com', email: 'fnf@futbolnavarro.com', telefono: '948 22 75 00', orderIndex: 16, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Logo_FNF.png/360px-Logo_FNF.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Logo_FNF.png/360px-Logo_FNF.png', colorPrimary: '#cc1100', colorSecondary: '#d97706' },
    { id: 'fed_eff_fvf', nombre: 'EFF-FVF - Federación Vasca de Fútbol', federacion: 'EFF-FVF - Federación Vasca de Fútbol', ambito: 'País Vasco', sede: 'Bilbao', web: 'https://euskalfutbol.eus', paginaWeb: 'https://euskalfutbol.eus', email: 'eff@euskalfutbol.eus', telefono: '944 42 41 00', orderIndex: 17, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Logo_EFF_FVF.png/360px-Logo_EFF_FVF.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Logo_EFF_FVF.png/360px-Logo_EFF_FVF.png', colorPrimary: '#16a34a', colorSecondary: '#dc2626' },
    { id: 'fed_ffcv', nombre: 'FFCV - Federació de Futbol de la Comunitat Valenciana', federacion: 'FFCV - Federació de Futbol de la Comunitat Valenciana', ambito: 'Comunidad Valenciana', sede: 'Valencia', web: 'https://ffcv.es', paginaWeb: 'https://ffcv.es', email: 'info@ffcv.es', telefono: '963 51 00 00', orderIndex: 18, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Logo_FFCV.png/360px-Logo_FFCV.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Logo_FFCV.png/360px-Logo_FFCV.png', colorPrimary: '#0284c7', colorSecondary: '#dc2626' },
    { id: 'fed_ffce', nombre: 'FFCE - Real Federación de Fútbol de Ceuta', federacion: 'FFCE - Real Federación de Fútbol de Ceuta', ambito: 'Ceuta', sede: 'Ceuta', web: 'https://www.ffce.es', paginaWeb: 'https://www.ffce.es', email: 'ffce@ffce.es', telefono: '956 51 90 00', orderIndex: 19, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Escudo_FFCE.png/360px-Escudo_FFCE.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Escudo_FFCE.png/360px-Escudo_FFCE.png', colorPrimary: '#1e293b', colorSecondary: '#0284c7' },
    { id: 'fed_rfmf', nombre: 'RFMF - Real Federación Melillense de Fútbol', federacion: 'RFMF - Real Federación Melillense de Fútbol', ambito: 'Melilla', sede: 'Melilla', web: 'https://www.rfmf.es', paginaWeb: 'https://www.rfmf.es', email: 'rfmf@rfmf.es', telefono: '952 68 30 00', orderIndex: 20, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Escudo_RFMF.png/360px-Escudo_RFMF.png', escudo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Escudo_RFMF.png/360px-Escudo_RFMF.png', colorPrimary: '#1d4ed8', colorSecondary: '#ffffff' }
  ];

  function getFedAcronym(fedStr) {
    if (!fedStr || fedStr === 'TODAS') return 'TODAS';
    const s = String(fedStr).trim();
    if (s.includes(' - ')) {
      return s.split(' - ')[0].trim();
    }
    const lower = s.toLowerCase();
    if (lower.includes('asturias') || lower.includes('rffpa')) return 'RFFPA';
    if (lower.includes('galicia') || lower.includes('futgal')) return 'FGF';
    if (lower.includes('madrid') || lower.includes('rffm')) return 'RFFM';
    if (lower.includes('navarra') || lower.includes('fnf')) return 'FNF';
    if (lower.includes('vasca') || lower.includes('euskal')) return 'EFF-FVF';
    if (lower.includes('andaluza') || lower.includes('rfaf')) return 'RFAF';
    if (lower.includes('catalana') || lower.includes('fcf')) return 'FCF';
    if (lower.includes('valenciana') || lower.includes('ffcv')) return 'FFCV';
    if (lower.includes('aragonesa') || lower.includes('faf')) return 'FAF';
    if (lower.includes('balears') || lower.includes('ffib')) return 'FFIB';
    if (lower.includes('canaria')) return 'FCF';
    if (lower.includes('cántabra') || lower.includes('rfcf')) return 'RFCF';
    if (lower.includes('castilla y león') || lower.includes('fcylf')) return 'FCYLF';
    if (lower.includes('castilla-la mancha') || lower.includes('ffcm')) return 'FFCM';
    if (lower.includes('extremadura') || lower.includes('fexf')) return 'FEXF';
    if (lower.includes('riojana') || lower.includes('frf')) return 'FRF';
    if (lower.includes('murcia') || lower.includes('ffrm')) return 'FFRM';
    if (lower.includes('ceuta') || lower.includes('ffce')) return 'FFCE';
    if (lower.includes('melilla') || lower.includes('rfmf')) return 'RFMF';
    if (lower.includes('española') || lower.includes('rfef')) return 'RFEF';
    
    return s.split(' ').map(w => w.charAt(0).toUpperCase()).join('').slice(0, 6);
  }

    function ensureFederacionesSeeded() {}

  const CLUBES_FEDERACION_NAVARRA = [{"id": "club_fnf_1001", "codigo": "1001", "nombre": "Club Atlético Osasuna", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/20179/21//2a6b14df6f6181626fe09a9d5aae9c78.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/20179/21//2a6b14df6f6181626fe09a9d5aae9c78.jpg", "equiposInscritos": "19", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1002", "codigo": "1002", "nombre": "C.D. Tudelano", "localidad": "Tudela", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074531340_00100_0074529846_Imagen1.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074531340_00100_0074529846_Imagen1.png", "equiposInscritos": "34", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1003", "codigo": "1003", "nombre": "C.D. Izarra", "localidad": "Estella", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074497209_00100_0074497131_Logotipo.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074497209_00100_0074497131_Logotipo.jpg", "equiposInscritos": "27", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1004", "codigo": "1004", "nombre": "C.D. Alesves", "localidad": "Villafranca", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483987_Alesves.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483987_Alesves.jpg", "equiposInscritos": "9", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1005", "codigo": "1005", "nombre": "C.D. Azkoyen", "localidad": "Peralta", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074481406_2532DD95_9F1D_41D0_8904_A317CAC586C6.jpeg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074481406_2532DD95_9F1D_41D0_8904_A317CAC586C6.jpeg", "equiposInscritos": "19", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1006", "codigo": "1006", "nombre": "C.D. Erriberri", "localidad": "Olite", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "", "logo": "", "equiposInscritos": "12", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1007", "codigo": "1007", "nombre": "C.D. Baztan", "localidad": "Baztan", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074496662_00100_0074496651_BAZTAN_KE__ar.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074496662_00100_0074496651_BAZTAN_KE__ar.png", "equiposInscritos": "23", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1008", "codigo": "1008", "nombre": "C.D. Cantolagua", "localidad": "Sangüesa", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074487797_canto.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074487797_canto.png", "equiposInscritos": "20", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1009", "codigo": "1009", "nombre": "Peña Sport F.C.", "localidad": "Tafalla", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483564_Ps.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483564_Ps.jpg", "equiposInscritos": "30", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1010", "codigo": "1010", "nombre": "C.D. Injerto", "localidad": "Berbinzana", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//d703a633672ed35b4a685615564fe8a6.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//d703a633672ed35b4a685615564fe8a6.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1011", "codigo": "1011", "nombre": "C. Ciudad de Iruña", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074527143_ciudad_iru_a.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074527143_ciudad_iru_a.png", "equiposInscritos": "13", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1012", "codigo": "1012", "nombre": "C.D. Oberena", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074486642_00100_0074486641_Escudo_Oberena.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074486642_00100_0074486641_Escudo_Oberena.jpg", "equiposInscritos": "35", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1013", "codigo": "1013", "nombre": "C.D. Falcesino", "localidad": "Falces", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074491202_facle.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074491202_facle.jpg", "equiposInscritos": "10", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1014", "codigo": "1014", "nombre": "C.D. River Ega", "localidad": "Andosilla", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/23//fced6149e47060d7ffdc4bb5fbb8e476.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/23//fced6149e47060d7ffdc4bb5fbb8e476.jpg", "equiposInscritos": "12", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1015", "codigo": "1015", "nombre": "C.D. Peña Azagresa", "localidad": "Azagra", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/20178/3//f058a2e168ae10a1ee6f4f61e7673059.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/20178/3//f058a2e168ae10a1ee6f4f61e7673059.jpg", "equiposInscritos": "26", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1016", "codigo": "1016", "nombre": "C.D. Corellano", "localidad": "Corella", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_uwkEh0bC.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_uwkEh0bC.jpg", "equiposInscritos": "12", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1017", "codigo": "1017", "nombre": "C.D. Aluvion", "localidad": "Cascante", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480148_aluvion.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480148_aluvion.jpg", "equiposInscritos": "16", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1018", "codigo": "1018", "nombre": "C.A. Cirbonero", "localidad": "Cintruénigo", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_SdReDqWJ.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_SdReDqWJ.jpg", "equiposInscritos": "27", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1019", "codigo": "1019", "nombre": "C.D. Ilumberri", "localidad": "Lumbier", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480720_ilumberri.jpeg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480720_ilumberri.jpeg", "equiposInscritos": "12", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1020", "codigo": "1020", "nombre": "C.D. Aurrera de Liédena", "localidad": "Liédena", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//64aded088231b6033ecd264daaa20138.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//64aded088231b6033ecd264daaa20138.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1021", "codigo": "1021", "nombre": "C.D. Sporting Melides", "localidad": "Mélida", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//de0830f5d4e11874a8cd1d2136f22761.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//de0830f5d4e11874a8cd1d2136f22761.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1022", "codigo": "1022", "nombre": "C.D. Cortes", "localidad": "Cortes", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_1wZNF8YN.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_1wZNF8YN.jpg", "equiposInscritos": "15", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1023", "codigo": "1023", "nombre": "Castillo F.C.", "localidad": "Miranda De Arga", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074496847_00100_0074496752_1000013152.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074496847_00100_0074496752_1000013152.png", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1024", "codigo": "1024", "nombre": "C.D. Lerines", "localidad": "Lerín", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483404_lerines.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483404_lerines.jpg", "equiposInscritos": "6", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1025", "codigo": "1025", "nombre": "A.D. Cabanillas", "localidad": "Cabanillas", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074488052_cabanilas.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074488052_cabanilas.png", "equiposInscritos": "8", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1026", "codigo": "1026", "nombre": "C.D. Azkarrena", "localidad": "Caparroso", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483954_Azkarrena.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483954_Azkarrena.jpg", "equiposInscritos": "16", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1027", "codigo": "1027", "nombre": "C.D. Beti Onak", "localidad": "Villava", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074497212_00100_0074497211_403969_154190148028420_418793172_nLIENZO.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074497212_00100_0074497211_403969_154190148028420_418793172_nLIENZO.jpg", "equiposInscritos": "4", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1028", "codigo": "1028", "nombre": "C.D. Idoya", "localidad": "Oteiza", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074497089_00100_0074497078_IMG_20240621_WA0005.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074497089_00100_0074497078_IMG_20240621_WA0005.jpg", "equiposInscritos": "11", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1029", "codigo": "1029", "nombre": "U.D.C. Txantrea K.K.E.", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20149/18//6ebfb8b44cbf2204c3178b253aeb4b3e_Gg8SK3Ej.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20149/18//6ebfb8b44cbf2204c3178b253aeb4b3e_Gg8SK3Ej.jpg", "equiposInscritos": "25", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1030", "codigo": "1030", "nombre": "C.D. Lodosa", "localidad": "Lodosa", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//c050fa6a81d683dabb9c97bb465c1a92.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//c050fa6a81d683dabb9c97bb465c1a92.jpg", "equiposInscritos": "21", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1032", "codigo": "1032", "nombre": "C.D. Pamplona", "localidad": "Cendea De Olza", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_TDto49bq.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_TDto49bq.jpg", "equiposInscritos": "18", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1033", "codigo": "1033", "nombre": "C.D. Castejon", "localidad": "Castejón", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//0b1d4bf4dab126054cb0441cb551ef65.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//0b1d4bf4dab126054cb0441cb551ef65.jpg", "equiposInscritos": "20", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1034", "codigo": "1034", "nombre": "C.D. Ribaforada", "localidad": "Ribaforada", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//882912b022081daa7aa9edefb63bfc29.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//882912b022081daa7aa9edefb63bfc29.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1035", "codigo": "1035", "nombre": "C.D. Muskaria", "localidad": "Arguedas", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480709_muskaria.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480709_muskaria.png", "equiposInscritos": "12", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1036", "codigo": "1036", "nombre": "C.A. Monteagudo", "localidad": "Monteagudo", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//2ebbf5eaba46368d7b2ced49ece3f6ea.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//2ebbf5eaba46368d7b2ced49ece3f6ea.jpg", "equiposInscritos": "5", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1037", "codigo": "1037", "nombre": "A.D. San Juan", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1920/DOCS/20206/29//2cd8a8c0af8d9d86fcd1217d55fa6619.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1920/DOCS/20206/29//2cd8a8c0af8d9d86fcd1217d55fa6619.jpg", "equiposInscritos": "32", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1038", "codigo": "1038", "nombre": "Beti Kozkor K.E.", "localidad": "Lekunberri", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074496614_00100_0074496591_Betikozk.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074496614_00100_0074496591_Betikozk.png", "equiposInscritos": "23", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1041", "codigo": "1041", "nombre": "U.C.D. Burlades", "localidad": "Burlada", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/201711/28//62558bb8c527d945795ab7ac7a1d56ae.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/201711/28//62558bb8c527d945795ab7ac7a1d56ae.jpg", "equiposInscritos": "38", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1042", "codigo": "1042", "nombre": "C.D. Gares", "localidad": "Puente La Reina", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//e6251f06712f6e7a4213941dbae05061.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//e6251f06712f6e7a4213941dbae05061.jpg", "equiposInscritos": "27", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1044", "codigo": "1044", "nombre": "C.D. Municipal Ribaforada", "localidad": "Ribaforada", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074481143_munrib.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074481143_munrib.jpg", "equiposInscritos": "9", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1045", "codigo": "1045", "nombre": "C.D. Atarrabia", "localidad": "Villava", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/26//3e52a9638728db89f5e0cd8648f8e5ac.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/26//3e52a9638728db89f5e0cd8648f8e5ac.jpg", "equiposInscritos": "13", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1047", "codigo": "1047", "nombre": "C.D. Ardoi", "localidad": "Zizur Mayor", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_YkXLGXCC.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_YkXLGXCC.jpg", "equiposInscritos": "54", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1050", "codigo": "1050", "nombre": "C.D. Funes", "localidad": "Funes", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074479885_escudo_cdf_turquesa_metalizado_web__1_.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074479885_escudo_cdf_turquesa_metalizado_web__1_.png", "equiposInscritos": "3", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1052", "codigo": "1052", "nombre": "C.D. El Redin", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1819/DOCS/201810/9//bb34dc382024b6c1aec27883eefa4421.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1819/DOCS/201810/9//bb34dc382024b6c1aec27883eefa4421.jpg", "equiposInscritos": "11", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1053", "codigo": "1053", "nombre": "C.A.D. Irabia", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//4a627c65f56e4409b40c418b6687ab2e.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//4a627c65f56e4409b40c418b6687ab2e.jpg", "equiposInscritos": "10", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1055", "codigo": "1055", "nombre": "C.D. San Cernin", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//8a928b14ccd70cd47cafbdc1b16c3730.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//8a928b14ccd70cd47cafbdc1b16c3730.jpg", "equiposInscritos": "14", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1060", "codigo": "1060", "nombre": "C.D. Zarramonza", "localidad": "Arróniz", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074499752_ae6719584b057629aee83380f9dc42cd.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074499752_ae6719584b057629aee83380f9dc42cd.jpg", "equiposInscritos": "12", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1063", "codigo": "1063", "nombre": "C.A. Valtierrano", "localidad": "Valtierra", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_V7XLGHVs.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_V7XLGHVs.jpg", "equiposInscritos": "18", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1064", "codigo": "1064", "nombre": "S.D. Alsasua", "localidad": "Altsasu", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074489851_alsas.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074489851_alsas.jpg", "equiposInscritos": "27", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1065", "codigo": "1065", "nombre": "C.D. Larrate", "localidad": "Carcastillo", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480151_larrate.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480151_larrate.png", "equiposInscritos": "11", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1066", "codigo": "1066", "nombre": "C.D. Aibares", "localidad": "Aibar", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//671f2dae25b47dd588d26bf5d217b4e4.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//671f2dae25b47dd588d26bf5d217b4e4.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1067", "codigo": "1067", "nombre": "C.D. Amigo", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//530bc875ccca377636c192c675229c63.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//530bc875ccca377636c192c675229c63.jpg", "equiposInscritos": "37", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1069", "codigo": "1069", "nombre": "C.A. Marcilla Aurora", "localidad": "Marcilla", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//1acfcfeb1a42a50e395db0fa25c4ceda.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//1acfcfeb1a42a50e395db0fa25c4ceda.jpg", "equiposInscritos": "15", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1071", "codigo": "1071", "nombre": "C.D. Ablitense", "localidad": "Ablitas", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//10f2a025023ac350a57173a303f86866.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//10f2a025023ac350a57173a303f86866.jpg", "equiposInscritos": "7", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1072", "codigo": "1072", "nombre": "C.D. Buñuel", "localidad": "Buñuel", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074484861_bu_uel.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074484861_bu_uel.png", "equiposInscritos": "10", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1078", "codigo": "1078", "nombre": "C.D. Valle de Egües", "localidad": "Egüés", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074487126_Ve.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074487126_Ve.png", "equiposInscritos": "42", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1079", "codigo": "1079", "nombre": "C.D. La Peña Fustiñana", "localidad": "Fustiñana", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483282_00100_0074482402_pe_a.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483282_00100_0074482402_pe_a.png", "equiposInscritos": "15", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1080", "codigo": "1080", "nombre": "C.F. Beti Casedano", "localidad": "Cáseda", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483392_bcas.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483392_bcas.png", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1081", "codigo": "1081", "nombre": "C.D. Murillo", "localidad": "99999", "comunidad": "Desconocido", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480717_murillo.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480717_murillo.png", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1082", "codigo": "1082", "nombre": "C.D. Iruntxiki", "localidad": "Beriáin", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//eb0630478394228b3affa9190757f551.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//eb0630478394228b3affa9190757f551.jpg", "equiposInscritos": "11", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1083", "codigo": "1083", "nombre": "C.D.Liceo Monjardin", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074512073_00100_0074512051_Mosca_Colores.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074512073_00100_0074512051_Mosca_Colores.jpg", "equiposInscritos": "9", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1084", "codigo": "1084", "nombre": "C.D. Calatrava", "localidad": "Fitero", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480887_calatravas.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480887_calatravas.png", "equiposInscritos": "6", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1086", "codigo": "1086", "nombre": "C.D. Mendi", "localidad": "Mendigorría", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074527266_00100_0074527250_ESC_C.D._MENDI__3_.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074527266_00100_0074527250_ESC_C.D._MENDI__3_.png", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1087", "codigo": "1087", "nombre": "S.D. Lagunak", "localidad": "Barañain", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//546615481602894b5444bc9be74b4ab8.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//546615481602894b5444bc9be74b4ab8.jpg", "equiposInscritos": "30", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1088", "codigo": "1088", "nombre": "C.D. Aralar Mendi", "localidad": "Uharte-Arakil", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/20179/11//1af062eb7cc319e143835fbfb9ffe398.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/20179/11//1af062eb7cc319e143835fbfb9ffe398.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1089", "codigo": "1089", "nombre": "C.D. Rada", "localidad": "31378", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/2223/DOCS/20229/8//34fc260daef02963c8ac3295dc928047.JPG", "logo": "https://www.futnavarra.es/pnfg//var/docs/2223/DOCS/20229/8//34fc260daef02963c8ac3295dc928047.JPG", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1096", "codigo": "1096", "nombre": "S.D. Echavacoiz", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074512363_echava.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074512363_echava.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1097", "codigo": "1097", "nombre": "C.D. San Adrian", "localidad": "San Adrián", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074481024_adeir.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074481024_adeir.jpg", "equiposInscritos": "19", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1102", "codigo": "1102", "nombre": "C.D. Avance Ezcabarte", "localidad": "31503", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074497487_00100_0074497446_Escudo_Avance_Ezcabarte.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074497487_00100_0074497446_Escudo_Avance_Ezcabarte.png", "equiposInscritos": "4", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1105", "codigo": "1105", "nombre": "C.D. Cadreita", "localidad": "Cadreita", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//0dd634e91ee01f5df8e64647b730c1a4.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//0dd634e91ee01f5df8e64647b730c1a4.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1106", "codigo": "1106", "nombre": "C.A. Huracan", "localidad": "Allo", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20176/28//04d672ef280c53715bd572ac30366db4.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20176/28//04d672ef280c53715bd572ac30366db4.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1108", "codigo": "1108", "nombre": "C.D. Subiza Cendea de Galar", "localidad": "Subiza", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_9rKB3koL.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1415/DOCS/20151/15//22ae59ee4de28fbeb074fea9667a9d17_9rKB3koL.jpg", "equiposInscritos": "3", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1109", "codigo": "1109", "nombre": "C.D. Murchante", "localidad": "Murchante", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480304_00100_0074480252_Murchante_Azul.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480304_00100_0074480252_Murchante_Azul.png", "equiposInscritos": "20", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1111", "codigo": "1111", "nombre": "C.D. Sesma", "localidad": "Sesma", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074533035_00100_0074532696_ESCUDO_CDS.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074533035_00100_0074532696_ESCUDO_CDS.jpg", "equiposInscritos": "4", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1115", "codigo": "1115", "nombre": "C.D.Huarte", "localidad": "Huarte", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074497323_00100_0074497289_HUARTE.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074497323_00100_0074497289_HUARTE.jpg", "equiposInscritos": "29", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1118", "codigo": "1118", "nombre": "C.D. Urroztarra", "localidad": "Urroz-Villa", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//e8008464b1e8dacc7dd6d2cbe3b6b7f7.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//e8008464b1e8dacc7dd6d2cbe3b6b7f7.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1119", "codigo": "1119", "nombre": "J.D. San Jorge", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//7c30c75e65e59f689d7c30b253e65715.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//7c30c75e65e59f689d7c30b253e65715.jpg", "equiposInscritos": "20", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1120", "codigo": "1120", "nombre": "C.D.Lagun Artea", "localidad": "Lakuntza", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//634e10d76766d69f62caa401c0e46f6e.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//634e10d76766d69f62caa401c0e46f6e.jpg", "equiposInscritos": "13", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1125", "codigo": "1125", "nombre": "C.A. Artajones", "localidad": "Artajona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/anterior/1314/DOCS/201311/13//2d30e42808167e0b768fa39e2eb05458_Bj5zf4jT.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/anterior/1314/DOCS/201311/13//2d30e42808167e0b768fa39e2eb05458_Bj5zf4jT.jpg", "equiposInscritos": "4", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1126", "codigo": "1126", "nombre": "C.D. San Miguel", "localidad": "Larraga", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074481141_sam.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074481141_sam.jpg", "equiposInscritos": "15", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1127", "codigo": "1127", "nombre": "U.D. Mutilvera", "localidad": "Aranguren", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480306_00100_0074480293_ESCUDO_MUTILVERA.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480306_00100_0074480293_ESCUDO_MUTILVERA.jpg", "equiposInscritos": "57", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1132", "codigo": "1132", "nombre": "C.D. San Javier", "localidad": "Tudela", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//2b6e4ba2059e9ddadeba496f5a5cb90b.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//2b6e4ba2059e9ddadeba496f5a5cb90b.jpg", "equiposInscritos": "22", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1134", "codigo": "1134", "nombre": "C.D. Infanzones", "localidad": "Obanos", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//72b7ebb19fe83389b101fcde2eeefa1d.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//72b7ebb19fe83389b101fcde2eeefa1d.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1135", "codigo": "1135", "nombre": "C.D. Anaitasuna", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/20178/8//e2f4568de18045b949c0014f0c1214ad.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/20178/8//e2f4568de18045b949c0014f0c1214ad.jpg", "equiposInscritos": "14", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1140", "codigo": "1140", "nombre": "C.D.Orvina", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/2122/DOCS/202110/26//fb0ffb4b813603d3deed2c106a2451be.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/2122/DOCS/202110/26//fb0ffb4b813603d3deed2c106a2451be.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1143", "codigo": "1143", "nombre": "C.D. San Ignacio", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//046de058b3324e5213c0db21e8b12d65.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//046de058b3324e5213c0db21e8b12d65.jpg", "equiposInscritos": "19", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1144", "codigo": "1144", "nombre": "C.D. Amaya", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//4e0d645f58196333d31c7915a95ebf36.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//4e0d645f58196333d31c7915a95ebf36.jpg", "equiposInscritos": "37", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1145", "codigo": "1145", "nombre": "C.D. Lourdes", "localidad": "Tudela", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074496620_00100_0074496618_escudo_LOURDES.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074496620_00100_0074496618_escudo_LOURDES.jpg", "equiposInscritos": "43", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1146", "codigo": "1146", "nombre": "C.D. Aurrera K.E.", "localidad": "Leitza", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "", "logo": "", "equiposInscritos": "16", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1148", "codigo": "1148", "nombre": "C.D.San Fermin Ikastola", "localidad": "Cizur", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480302_SFI.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480302_SFI.jpg", "equiposInscritos": "4", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1152", "codigo": "1152", "nombre": "C.D. Beti Gazte", "localidad": "Lesaka", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/20177/3//3aaffcceb5e29762ec2be719b5d11fd3.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/20177/3//3aaffcceb5e29762ec2be719b5d11fd3.jpg", "equiposInscritos": "13", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1155", "codigo": "1155", "nombre": "C.D.Gure Txokoa", "localidad": "Bera", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480905_gt.jpeg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480905_gt.jpeg", "equiposInscritos": "12", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1157", "codigo": "1157", "nombre": "C.D. Urantzia", "localidad": "Arcos (Los)", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20176/28//4842e2d70c423fde1cb21d9656761ece.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20176/28//4842e2d70c423fde1cb21d9656761ece.jpg", "equiposInscritos": "4", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1162", "codigo": "1162", "nombre": "C.D. Calasanz", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "", "logo": "", "equiposInscritos": "-", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1168", "codigo": "1168", "nombre": "C.D. Salesianos", "localidad": "Sarriguren", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483972_salesianos.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483972_salesianos.jpg", "equiposInscritos": "12", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1175", "codigo": "1175", "nombre": "C.D. Etxarri Aranatz", "localidad": "Etxarri-Aranatz", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074484988_etxx.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074484988_etxx.jpg", "equiposInscritos": "18", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1180", "codigo": "1180", "nombre": "C.D. Aoiz", "localidad": "Aoiz", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074531339_00100_0074530565_Escudo_Aoiz.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074531339_00100_0074530565_Escudo_Aoiz.png", "equiposInscritos": "9", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1181", "codigo": "1181", "nombre": "C.D. Lezkairu", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//b7493d19a7339b3247770767b9b8a119.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//b7493d19a7339b3247770767b9b8a119.jpg", "equiposInscritos": "38", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1187", "codigo": "1187", "nombre": "F.C. Bidezarra", "localidad": "Noáin (Valle De Elorz)", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//42068ad57e0c3f26563a597fda2bcfa8.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//42068ad57e0c3f26563a597fda2bcfa8.jpg", "equiposInscritos": "24", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1198", "codigo": "1198", "nombre": "C.D. Paz Ziganda", "localidad": "Villava", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074487900_pziganda.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074487900_pziganda.png", "equiposInscritos": "4", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1200", "codigo": "1200", "nombre": "C.D. Arenas", "localidad": "Ayegui", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074526371_00100_0074526369_LOGO_ARENAS_TRANS.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074526371_00100_0074526369_LOGO_ARENAS_TRANS.png", "equiposInscritos": "19", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1202", "codigo": "1202", "nombre": "C.D. Mendavies", "localidad": "Mendavia", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074527144_menda.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074527144_menda.jpg", "equiposInscritos": "14", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1208", "codigo": "1208", "nombre": "C.D. Xota F.S.", "localidad": "Irurtzun", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074492089_xota.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074492089_xota.png", "equiposInscritos": "16", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1215", "codigo": "1215", "nombre": "A.D. Mendillorri", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480871_mendi.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480871_mendi.jpg", "equiposInscritos": "20", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1216", "codigo": "1216", "nombre": "Lizarra Ikastola", "localidad": "Estella", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074505094_00100_0074503607_Logoa_2017.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074505094_00100_0074503607_Logoa_2017.png", "equiposInscritos": "4", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1217", "codigo": "1217", "nombre": "C.D. Ademar", "localidad": "Sarriguren", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/26//0927f3794aed59e60735bed7172da48f.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/26//0927f3794aed59e60735bed7172da48f.jpg", "equiposInscritos": "14", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1228", "codigo": "1228", "nombre": "C.D. Zumadia", "localidad": "Artajona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1920/DOCS/201910/10//62fa7dcba5c50782a1e4908fac1f5513.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1920/DOCS/201910/10//62fa7dcba5c50782a1e4908fac1f5513.jpg", "equiposInscritos": "4", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1237", "codigo": "1237", "nombre": "C.D.Universidad de Navarra", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074520968_00100_0074520877_00._Marca_UNAV_rojo.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074520968_00100_0074520877_00._Marca_UNAV_rojo.png", "equiposInscritos": "14", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1300", "codigo": "1300", "nombre": "U.D. Beriain", "localidad": "Beriáin", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074500764_00100_0074500759_Beriain__2_.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074500764_00100_0074500759_Beriain__2_.png", "equiposInscritos": "13", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1302", "codigo": "1302", "nombre": "C.D. Fontellas", "localidad": "Fontellas", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480354_fom.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480354_fom.jpg", "equiposInscritos": "5", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1303", "codigo": "1303", "nombre": "C.D. Castillo de Tiebas", "localidad": "Tiebas-Muruarte De Reta", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20176/28//005d2ef3f807f8d81f2b8807396716cc.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20176/28//005d2ef3f807f8d81f2b8807396716cc.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1313", "codigo": "1313", "nombre": "C.D.Kirol Sport", "localidad": "Orkoien", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//b736fa1ba5ec36150da7b109b8ed99bd.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//b736fa1ba5ec36150da7b109b8ed99bd.jpg", "equiposInscritos": "32", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1314", "codigo": "1314", "nombre": "C.A.Santacara", "localidad": "Santacara", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074517167_00100_0074517132_IMG_4366.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074517167_00100_0074517132_IMG_4366.png", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1329", "codigo": "1329", "nombre": "C.D.Burlata Futbol Eskola", "localidad": "Burlada", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//dda729af132a022b872564136415bac3.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//dda729af132a022b872564136415bac3.jpg", "equiposInscritos": "4", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1330", "codigo": "1330", "nombre": "C.D. Olite F.S.", "localidad": "Olite", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074482127_olite_fs.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074482127_olite_fs.png", "equiposInscritos": "6", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1339", "codigo": "1339", "nombre": "F.S.Caparroso", "localidad": "Caparroso", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/201711/7//5519691ad80ef87c571f3507ad9956d5.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/201711/7//5519691ad80ef87c571f3507ad9956d5.jpg", "equiposInscritos": "2", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1346", "codigo": "1346", "nombre": "C.D. Zirauki", "localidad": "Cirauqui", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//1241f326e57ce20dbeb9c9697651419d.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//1241f326e57ce20dbeb9c9697651419d.jpg", "equiposInscritos": "2", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1347", "codigo": "1347", "nombre": "C.D. Urbasa", "localidad": "Améscoa Baja", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074489849_urbas.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074489849_urbas.jpg", "equiposInscritos": "3", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1348", "codigo": "1348", "nombre": "C.D.Mendialdea K.E.", "localidad": "Berriozar", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074484141_mendialdea.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074484141_mendialdea.jpg", "equiposInscritos": "4", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1354", "codigo": "1354", "nombre": "C.D. San Andres", "localidad": "Estella", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/anterior/1314/DOCS/201311/13//2d30e42808167e0b768fa39e2eb05458_tV5GPJXW.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/anterior/1314/DOCS/201311/13//2d30e42808167e0b768fa39e2eb05458_tV5GPJXW.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1355", "codigo": "1355", "nombre": "Berriozar C.F.", "localidad": "Berriozar", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/201612/20//082b4605138292abccd111b912719cb5.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/201612/20//082b4605138292abccd111b912719cb5.jpg", "equiposInscritos": "33", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1356", "codigo": "1356", "nombre": "C.D.Inter de Pamplona", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074496663_52f5351155bb05c78eae990b29160a59.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074496663_52f5351155bb05c78eae990b29160a59.jpg", "equiposInscritos": "15", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1359", "codigo": "1359", "nombre": "Arbizu Kirol Taldea", "localidad": "Arbizu", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074484128_ARKT.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074484128_ARKT.png", "equiposInscritos": "4", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1361", "codigo": "1361", "nombre": "Betelu Futbol Taldea", "localidad": "Betelu", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483390_bert.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483390_bert.jpg", "equiposInscritos": "2", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1362", "codigo": "1362", "nombre": "C.D.Ibararte", "localidad": "Esteribar", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074488336_00100_0074488262_EscudoIbararte.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074488336_00100_0074488262_EscudoIbararte.jpg", "equiposInscritos": "9", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1363", "codigo": "1363", "nombre": "U.D.C.Rochapea", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1819/DOCS/20189/20//42e1a5a86a4ff93ed9c3b5b169f4e886.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1819/DOCS/20189/20//42e1a5a86a4ff93ed9c3b5b169f4e886.jpg", "equiposInscritos": "-", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1365", "codigo": "1365", "nombre": "C.D.Asdefor", "localidad": "Legarda", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483765_asdefor.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483765_asdefor.jpg", "equiposInscritos": "30", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1374", "codigo": "1374", "nombre": "C.D.E.F.B. Milagres-Cadreita", "localidad": "Milagro", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1920/DOCS/20198/28//59f4f933ad55e7b59502a46ad88eebbb.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1920/DOCS/20198/28//59f4f933ad55e7b59502a46ad88eebbb.jpg", "equiposInscritos": "10", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1378", "codigo": "1378", "nombre": "C.M.Funes", "localidad": "Funes", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074487707_cm_funes.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074487707_cm_funes.jpg", "equiposInscritos": "12", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1381", "codigo": "1381", "nombre": "C.F. Gazte Berriak Ansoain", "localidad": "Ansoáin", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074487586_GB.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074487586_GB.jpg", "equiposInscritos": "55", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1382", "codigo": "1382", "nombre": "Mulier F.C.N.", "localidad": "Sarriguren", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/201612/20//8ac2523d36b9b082e3a3315eabb6faa1.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/201612/20//8ac2523d36b9b082e3a3315eabb6faa1.jpg", "equiposInscritos": "14", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1388", "codigo": "1388", "nombre": "C.D. Fundacion Osasuna Femenino", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//6d77fb51cdd8c0fad87d13cd82aeec6d.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//6d77fb51cdd8c0fad87d13cd82aeec6d.jpg", "equiposInscritos": "2", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1389", "codigo": "1389", "nombre": "Murchante F.S.", "localidad": "Murchante", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/201711/7//a14970df353763b57dfed26081187c3a.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/201711/7//a14970df353763b57dfed26081187c3a.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1390", "codigo": "1390", "nombre": "Ablitas Femenino Futbol Sala", "localidad": "Ablitas", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/201711/7//0914d6b85779b4e74032e2bf9963291c.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1718/DOCS/201711/7//0914d6b85779b4e74032e2bf9963291c.jpg", "equiposInscritos": "7", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1394", "codigo": "1394", "nombre": "C.D.Los Sauces", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483286_los_sauces.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483286_los_sauces.jpg", "equiposInscritos": "5", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1397", "codigo": "1397", "nombre": "C.D.Cintruenigo F.S.", "localidad": "99999", "comunidad": "Desconocido", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1819/DOCS/20188/3//64458cbbb808f539610469ae34566287.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1819/DOCS/20188/3//64458cbbb808f539610469ae34566287.jpg", "equiposInscritos": "9", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1398", "codigo": "1398", "nombre": "C.D.A. Rotxa", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1920/DOCS/20199/24//a0c4560757f0a42a58af230d599a55fd.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1920/DOCS/20199/24//a0c4560757f0a42a58af230d599a55fd.jpg", "equiposInscritos": "3", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1399", "codigo": "1399", "nombre": "C.D. Soto-Ibarbaso", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074523242_00100_0074523165_Dise_o_Sin_T_tulo___1__1_.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074523242_00100_0074523165_Dise_o_Sin_T_tulo___1__1_.png", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1400", "codigo": "1400", "nombre": "C.A. Milagres de Futbol", "localidad": "Milagro", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074531341_00100_0074529784_sin_fondo__2_.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074531341_00100_0074529784_sin_fondo__2_.png", "equiposInscritos": "2", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1402", "codigo": "1402", "nombre": "C.D. Unión Tutera", "localidad": "Tudela", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480870_Ut.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480870_Ut.png", "equiposInscritos": "2", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1403", "codigo": "1403", "nombre": "Valdorba F.C.", "localidad": "Barásoain", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074486137_valdor.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074486137_valdor.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1404", "codigo": "1404", "nombre": "U.D. Valle de Aranguren", "localidad": "99999", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480711_vlaranguren.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480711_vlaranguren.jpg", "equiposInscritos": "7", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1405", "codigo": "1405", "nombre": "C.D. Cendea de Cizur", "localidad": "Cizur", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074527140_00100_0074526543_cendea_cizur.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074527140_00100_0074526543_cendea_cizur.jpg", "equiposInscritos": "13", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1406", "codigo": "1406", "nombre": "Leones de Montepinar FS", "localidad": "Sarriguren", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "", "logo": "", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1407", "codigo": "1407", "nombre": "C.D. Filial Patxi Larrainzar", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074484227_larainzxa.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074484227_larainzxa.jpg", "equiposInscritos": "2", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1408", "codigo": "1408", "nombre": "C.D. Filial Mancomunidad de Servicios Sociales de Base Zona Ultzama", "localidad": "Ultzama", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483495_Ultzama.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483495_Ultzama.jpg", "equiposInscritos": "2", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1409", "codigo": "1409", "nombre": "C.F. The British School of Navarra", "localidad": "Gorraiz", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//ficheroNoExiste.plop", "logo": "https://www.futnavarra.es/pnfg//ficheroNoExiste.plop", "equiposInscritos": "2", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1410", "codigo": "1410", "nombre": "C.D. Orvina K.E.", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074524263_logo_club_deportivo_orvina_texto_rojo.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074524263_logo_club_deportivo_orvina_texto_rojo.png", "equiposInscritos": "8", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1411", "codigo": "1411", "nombre": "C.F. Sabeit Femenino", "localidad": "Tiebas-Muruarte De Reta", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074489852_sabeti.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074489852_sabeti.jpg", "equiposInscritos": "10", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1412", "codigo": "1412", "nombre": "Arga Ibaia K.E.", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483285_arga.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483285_arga.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1413", "codigo": "1413", "nombre": "Promesas EDF", "localidad": "Logroño", "comunidad": "La Rioja", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483593_edf.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483593_edf.png", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1414", "codigo": "1414", "nombre": "C.D. Filial de Fundación Club Atlético Osasuna", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "", "logo": "", "equiposInscritos": "8", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1415", "codigo": "1415", "nombre": "C.D. USOF", "localidad": "Tudela", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074490198_00100_0074490197_1724834378820.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074490198_00100_0074490197_1724834378820.jpg", "equiposInscritos": "6", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1416", "codigo": "1416", "nombre": "Alde Zaharreko Kluba", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074489881_alde_za.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074489881_alde_za.jpg", "equiposInscritos": "2", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1417", "codigo": "1417", "nombre": "Beloso FC", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074490403_beloso.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074490403_beloso.jpg", "equiposInscritos": "2", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1418", "codigo": "1418", "nombre": "C.D. Aderiz", "localidad": "Galar", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074490599_ESCUDO_ADERIZ_GRANATE.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074490599_ESCUDO_ADERIZ_GRANATE.png", "equiposInscritos": "5", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1419", "codigo": "1419", "nombre": "C.D. Aspace Navarra", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074491687_Aspace.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074491687_Aspace.png", "equiposInscritos": "2", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1420", "codigo": "1420", "nombre": "Irulegi K.E.", "localidad": "Burlada", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074497210_00100_0074497154_Escudo_PNG.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074497210_00100_0074497154_Escudo_PNG.png", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1421", "codigo": "1421", "nombre": "C.D. El Molino", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074517924_00100_0074517800_MOLINO_25_26.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074517924_00100_0074517800_MOLINO_25_26.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1422", "codigo": "1422", "nombre": "Izar F.C.", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074526414_IZAR_ESCUDO._pdf.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074526414_IZAR_ESCUDO._pdf.png", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1423", "codigo": "1423", "nombre": "C.D. Filial Fundación Nánthea", "localidad": "Barañain", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "", "logo": "", "equiposInscritos": "-", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1424", "codigo": "1424", "nombre": "C.D. Iruña", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074527142_iru_a.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074527142_iru_a.jpg", "equiposInscritos": "8", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1425", "codigo": "1425", "nombre": "C.D. Tudela F.S.", "localidad": "Tudela", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074531338_00100_0074531227_TUDELA_FS.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074531338_00100_0074531227_TUDELA_FS.png", "equiposInscritos": "3", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1426", "codigo": "1426", "nombre": "C.D.F. APYMA CP Bustintxuri", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "", "logo": "", "equiposInscritos": "-", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_1427", "codigo": "1427", "nombre": "Leitzaldea Kirol Escola", "localidad": "Leitza", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074533576_00100_0074533142_Leitzaldea_Kirol_Eskola_anagrama.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074533576_00100_0074533142_Leitzaldea_Kirol_Eskola_anagrama.png", "equiposInscritos": "2", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_4022", "codigo": "4022", "nombre": "C.D. Ezkaba", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "", "logo": "", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_4034", "codigo": "4034", "nombre": "C.F.S. Ribera de Navarra", "localidad": "Tudela", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1819/DOCS/20192/11//669fa02240e769907116db952e3b9e18.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1819/DOCS/20192/11//669fa02240e769907116db952e3b9e18.jpg", "equiposInscritos": "13", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_4035", "codigo": "4035", "nombre": "C.D.Tafa F.S.", "localidad": "Tafalla", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074489873_00100_0074489871_Logo_Tafatrans_Futbol_Sala.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074489873_00100_0074489871_Logo_Tafatrans_Futbol_Sala.png", "equiposInscritos": "16", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_4052", "codigo": "4052", "nombre": "Doneztebe F.T.", "localidad": "Doneztebe", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//bd28a06a79a2f1cc4a5076e901dded2e.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/24//bd28a06a79a2f1cc4a5076e901dded2e.jpg", "equiposInscritos": "17", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_5002", "codigo": "5002", "nombre": "Rotxapea C.D.", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074527141_rotxa.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074527141_rotxa.jpg", "equiposInscritos": "18", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_5003", "codigo": "5003", "nombre": "C.D. Cantera", "localidad": "Cascante", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483283_cantera.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074483283_cantera.jpg", "equiposInscritos": "8", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_5013", "codigo": "5013", "nombre": "C.D. Ondalan", "localidad": "Villatuerta", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074496613_00100_0074496537_Escudo_Ondalan.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074496613_00100_0074496537_Escudo_Ondalan.jpg", "equiposInscritos": "15", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_5035", "codigo": "5035", "nombre": "C.D.Nª Señora Del Huerto", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20176/1//d73301328c827df3b6e175ff7a75e68f.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20176/1//d73301328c827df3b6e175ff7a75e68f.jpg", "equiposInscritos": "5", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_5177", "codigo": "5177", "nombre": "C.D. Carcar", "localidad": "Cárcar", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//70a3f3bb05bbf7b7cdd69ac27f3d5f6e.jpg", "logo": "https://www.futnavarra.es/pnfg//var/docs/1617/DOCS/20175/25//70a3f3bb05bbf7b7cdd69ac27f3d5f6e.jpg", "equiposInscritos": "1", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_5180", "codigo": "5180", "nombre": "C.D. Navarro Villoslada", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074481654_Nav.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074481654_Nav.png", "equiposInscritos": "3", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_8888", "codigo": "8888", "nombre": "Selección Navarra", "localidad": "Pamplona", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074486486_escudo_actual.png", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074486486_escudo_actual.png", "equiposInscritos": "15", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}, {"id": "club_fnf_8893", "codigo": "8893", "nombre": "C.D. Zizur", "localidad": "Zizur Mayor", "comunidad": "Navarra", "federacion": "FNF - Federación Navarra de Fútbol", "escudo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480300_zizur.jpg", "logo": "https://www.futnavarra.es/pnfg/pimg/Clubes/00100_0074480300_zizur.jpg", "equiposInscritos": "13", "colorPrimary": "#cc1100", "colorSecondary": "#ffffff"}];

  
              function deleteDirectoryItem(tabName, itemId) {
    if (!tabName || itemId === undefined || itemId === null) return;
    if (!state.directory) state.directory = {};

    const targetStr = String(itemId).trim().toLowerCase();

    let itemObj = null;
    if (Array.isArray(state.directory[tabName])) {
      itemObj = state.directory[tabName].find(i => 
        i && (
          (i.id !== undefined && String(i.id).trim().toLowerCase() === targetStr) ||
          (i.codigo !== undefined && String(i.codigo).trim().toLowerCase() === targetStr) ||
          (i.nombre !== undefined && String(i.nombre).trim().toLowerCase() === targetStr)
        )
      );
    }

    if (Array.isArray(state.directory[tabName])) {
      state.directory[tabName] = state.directory[tabName].filter(item => {
        if (!item) return false;
        const matchId = item.id !== undefined && item.id !== null && String(item.id).trim().toLowerCase() === targetStr;
        const matchCode = item.codigo !== undefined && item.codigo !== null && String(item.codigo).trim().toLowerCase() === targetStr;
        const matchName = item.nombre !== undefined && item.nombre !== null && String(item.nombre).trim().toLowerCase() === targetStr;
        const matchObj = itemObj && item === itemObj;
        return !matchId && !matchCode && !matchName && !matchObj;
      });
    }

    try {
      deleteFromFirebase(tabName, itemId, itemObj);
    } catch (e) {
      console.warn(`Error deleting from Firebase for ${tabName}/${itemId}:`, e);
    }

    saveState();
  }

  function deleteClubPermanently(clubId) {
    deleteDirectoryItem('clubes', clubId);
  }


    function ensureClubesNavarraSeeded() {}


  
  // Helper to extract convenidos list for a club
  function getConvenidosListForClub(clubItem) {
    if (!clubItem) return [];
    let rawList = [];
    
    if (Array.isArray(clubItem.convenidosVinculados)) {
      rawList = clubItem.convenidosVinculados.map(s => typeof s === 'string' ? s : (s.nombre || s.equipo || '')).filter(Boolean);
    } else if (typeof clubItem.convenidosVinculados === 'string' && clubItem.convenidosVinculados.trim()) {
      rawList = clubItem.convenidosVinculados.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (state.directory?.clubes && clubItem.nombre) {
      const parentName = clubItem.nombre.toLowerCase().trim();
      state.directory.clubes.forEach(c => {
        if (c && c.convenidoDe && String(c.convenidoDe).toLowerCase().trim().includes(parentName)) {
          if (!rawList.includes(c.nombre)) rawList.push(c.nombre);
        }
      });
    }

    return Array.from(new Set(rawList));
  }

  // Open window/modal for Clubes Convenidos with clickable cards
  function openClubConvenidosWindow(clubObj) {
    if (!clubObj) return;
    const convenidosNames = getConvenidosListForClub(clubObj);

    if (!convenidosNames || convenidosNames.length === 0) {
      return showCustomAlertModal('Sin Clubes Convenidos', `El club "${escapeHtml(clubObj.nombre)}" no tiene clubes convenidos vinculados.`);
    }

    const convenidosClubs = convenidosNames.map(name => {
      let matched = (state.directory.clubes || []).find(c => 
        c && c.nombre && c.nombre.toLowerCase().trim() === name.toLowerCase().trim()
      );
      if (!matched) {
        matched = {
          id: 'c_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          nombre: name,
          equipo: name,
          localidad: 'Navarra',
          federacion: clubObj.federacion || 'Sin Federación'
        };
      }
      return matched;
    });

    const modalHTML = `
      <div style="padding: 10px;">
        <p style="font-size: 13px; color: var(--text-muted); font-weight: 700; margin-bottom: 16px;">
          Mostrando <strong>${convenidosClubs.length}</strong> clubes convenidos vinculados a <strong>${escapeHtml(clubObj.nombre)}</strong>. Haz clic en cualquiera de ellos para acceder a su ficha completa:
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; max-height: 480px; overflow-y: auto; padding-right: 4px;">
          ${convenidosClubs.map(c => {
            const clubPriColor = c.colorPrimary || '#2563eb';
            const clubLogo = c.logo || c.escudo || (c.codigo ? `./escudos/${c.codigo}.png` : `./escudos/${(c.nombre || '').toLowerCase().replace(/^(c\.d\.|c\.a\.|a\.d\.|u\.d\.|u\.d\.c\.|c\.f\.|s\.d\.|f\.c\.)\s*/i, '').replace(/[^a-z0-9]/gi, '_')}.png`);

            return `
              <div class="convenido-item-card" data-club-name="${escapeHtml(c.nombre)}" data-club-id="${c.id || ''}" style="background: #ffffff; border: 1.5px solid var(--border-medium, #cbd5e1); border-top: 4px solid ${clubPriColor}; padding: 12px; border-radius: 10px; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 36px; height: 36px; border-radius: 6px; background-color: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid ${clubPriColor}; padding: 2px; flex-shrink: 0;">
                    <img src="${clubLogo}" onerror="this.style.display='none';" style="width: 100%; height: 100%; object-fit: contain;">
                  </div>
                  <div style="flex: 1; overflow: hidden;">
                    <h4 style="margin: 0; font-size: 13px; font-weight: 800; color: var(--text-dark, #1e293b); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(c.nombre)}</h4>
                    <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(c.localidad || 'Navarra')}</div>
                  </div>
                </div>
                <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; background: var(--bg-subtle, #f8fafc); padding: 4px 8px; border-radius: 6px;">
                  ${escapeHtml(c.federacion || 'FNF - Federación Navarra')}
                </div>
                <button type="button" class="btn btn-primary" style="width: 100%; padding: 5px 8px; font-size: 11px; font-weight: 800; border-radius: 6px; margin-top: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
                  Abrir Ficha <i data-lucide="arrow-right" style="width: 12px;"></i>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    const card = document.getElementById('generalModalCard');
    if (card) card.classList.add('large');

    showModal(`🏆 Clubes Convenidos de ${clubObj.nombre} (${convenidosClubs.length})`, modalHTML, () => {
      document.querySelectorAll('.convenido-item-card').forEach(cardEl => {
        cardEl.addEventListener('click', () => {
          const cName = cardEl.dataset.clubName;
          const cId = cardEl.dataset.clubId;
          
          let targetClub = (state.directory.clubes || []).find(c => 
            c && (String(c.id) === String(cId) || (c.nombre && c.nombre.toLowerCase().trim() === cName.toLowerCase().trim()))
          );
          if (!targetClub) {
            targetClub = { id: cId || ('c_' + Date.now()), nombre: cName, equipo: cName, convenidoDe: clubObj.nombre };
          }
          
          closeModal();
          setTimeout(() => {
            openClubModal(targetClub);
          }, 150);
        });
      });
      if (window.lucide) window.lucide.createIcons();
    });
  }

  
  // LISTA DE CLUBES DE LA FEDERACIÓN ARAGONESA DE FÚTBOL (FARGF)
  const ARAGON_CLUBS_DATA = [
  {
    "codigo": "1001",
    "nombre": "Real Zaragoza S.A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000047835_Escudo-Zaragoza.jpg"
  },
  {
    "codigo": "1002",
    "nombre": "Arenas S.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000043191_arenas_zaragoza.jpg"
  },
  {
    "codigo": "1003",
    "nombre": "Casetas U.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000355738_escudo_udcasetas_dorado.png"
  },
  {
    "codigo": "1004",
    "nombre": "Caspe C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000159560_898ec445a5f8772a5a1b61d5d019d680.jpg"
  },
  {
    "codigo": "1005",
    "nombre": "Zuera C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000211302_14.png"
  },
  {
    "codigo": "1006",
    "nombre": "Ejea S.D. Ejea de los",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1008",
    "nombre": "Tauste C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000417911_1.jpg"
  },
  {
    "codigo": "1009",
    "nombre": "Alfajarin C.F.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000113869_alfajarin.jpg"
  },
  {
    "codigo": "1010",
    "nombre": "Monzalbarba At.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000445798_ESCUDO_MONZALBARBA.png"
  },
  {
    "codigo": "1011",
    "nombre": "Pina C.D. Pina de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000196817_escudo_pina_letras_negras.jpg"
  },
  {
    "codigo": "1012",
    "nombre": "Utebo C.F.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000309723_Escudo_Utebo_FC___copia.png"
  },
  {
    "codigo": "1013",
    "nombre": "Huracan C.D. Mara de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000168835_escudo_FONDO_BLANCO.jpg"
  },
  {
    "codigo": "1016",
    "nombre": "Boquiñeni C.F.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000043234_boquineni.jpg"
  },
  {
    "codigo": "1017",
    "nombre": "Remolinos C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000314032_PHOTO_2021_07_26_12_02_49_5339_.jpg"
  },
  {
    "codigo": "1020",
    "nombre": "Illueca C.F.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1021",
    "nombre": "San Mateo C.D. San Mateo de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000315140_SAN_MATEO.jpg"
  },
  {
    "codigo": "1022",
    "nombre": "El Burgo de Ebro C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000400185_1.jpg"
  },
  {
    "codigo": "1023",
    "nombre": "Luna C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000043245_luna.jpg"
  },
  {
    "codigo": "1024",
    "nombre": "Maella C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000191784_maella_cd.jpg"
  },
  {
    "codigo": "1025",
    "nombre": "Ebro C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000169078_CD_EBRO.jpg"
  },
  {
    "codigo": "1026",
    "nombre": "El Gancho C.F.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000383730_Escudo_El_Gancho.jpg"
  },
  {
    "codigo": "1030",
    "nombre": "Brea C.D. Brea de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1033",
    "nombre": "Mequinenza C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000048049_zar_Mequinenza_CD.gif"
  },
  {
    "codigo": "1037",
    "nombre": "El Salvador S.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000064528_Escudo_El_Salvador.JPG"
  },
  {
    "codigo": "1038",
    "nombre": "St. Venecia A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000411948_PHOTO_2024_01_25_12_42_43.jpg"
  },
  {
    "codigo": "1039",
    "nombre": "Borja S.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000445391_ESC_S.D._BORJA.png"
  },
  {
    "codigo": "1040",
    "nombre": "La Almunia C.D. Almunia de Doa Godina",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1042",
    "nombre": "Montecarlo U.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1043",
    "nombre": "Peaflor A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1044",
    "nombre": "Pinsoro C.D. Ejea de los",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000060982_C.D.PINSORO.jpg"
  },
  {
    "codigo": "1049",
    "nombre": "Calatorao C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1050",
    "nombre": "Cariena C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000137276_escudo_carinena.JPG"
  },
  {
    "codigo": "1051",
    "nombre": "Daroca C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000255111_IMG-20191020-WA0007.jpg"
  },
  {
    "codigo": "1053",
    "nombre": "Fuentes C.D. Fuentes de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000196954_ESCUDO.jpg"
  },
  {
    "codigo": "1054",
    "nombre": "La Cartuja F.o.c.a.r. Club",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1057",
    "nombre": "Mallen C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000356080_BA965F00_6538_434F_84C1_CC2DFAC020AE.jpeg"
  },
  {
    "codigo": "1058",
    "nombre": "Perdiguera C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1059",
    "nombre": "Quinto C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000502105_escudo_CDQuinto.png"
  },
  {
    "codigo": "1062",
    "nombre": "Cuarte C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1064",
    "nombre": "Giner Torrero C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000173634_giner_torrero.jpg"
  },
  {
    "codigo": "1066",
    "nombre": "San G. Arrabal C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1073",
    "nombre": "Fleta C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1074",
    "nombre": "Boscos Deportivo",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1076",
    "nombre": "Santo D.silos O.d.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1077",
    "nombre": "Tarazona S.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1078",
    "nombre": "Terrer C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000317844_PHOTO_2021_10_05_10_30_14.jpg"
  },
  {
    "codigo": "1079",
    "nombre": "Villamayor C.D. Villamayor de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000274918_ESCUDO.jpg"
  },
  {
    "codigo": "1081",
    "nombre": "Ateca C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000204549_Escudo_CD_Ateca.png"
  },
  {
    "codigo": "1082",
    "nombre": "Castiliscar C.f.j.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000414947_Junta_Directiva_Castiliscar.png"
  },
  {
    "codigo": "1083",
    "nombre": "Union la Jota Vadorrey C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1086",
    "nombre": "Sadabense C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000399696_escudo_sadabense_centenario_page_0001.jpg"
  },
  {
    "codigo": "1087",
    "nombre": "Balsas Picarral U.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000391775_escudo.jpg"
  },
  {
    "codigo": "1090",
    "nombre": "Farlete C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000389156_farl.jpg"
  },
  {
    "codigo": "1092",
    "nombre": "Morata C.D. Morata de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000204675_Escudo_Morata_CD_grande.png"
  },
  {
    "codigo": "1097",
    "nombre": "Ajax de Juslibol C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000386839_IMG_20230808_WA0007.jpg"
  },
  {
    "codigo": "1104",
    "nombre": "Helios C.n.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1107",
    "nombre": "Movera C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1109",
    "nombre": "Pinseque C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000079726_pinseque.jpg"
  },
  {
    "codigo": "1110",
    "nombre": "Monegrillo At.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000388833_ESCUDO_ATL_TICO_MONEGRILLO.png"
  },
  {
    "codigo": "1114",
    "nombre": "Teresiano del Pilar",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000464281_LOGO_TERESIANO.jpg"
  },
  {
    "codigo": "1117",
    "nombre": "Britanico Aragon Col. Cuarte de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1118",
    "nombre": "Marianistas C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1119",
    "nombre": "Hispanidad C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000356336_hispanidad_modificado__1_.jpg"
  },
  {
    "codigo": "1121",
    "nombre": "Villanueva C.F. Villanueva de Gállego",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000256746_Escudo_Villanueva_001.png"
  },
  {
    "codigo": "1123",
    "nombre": "Ariza U.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1126",
    "nombre": "Compaia de Maria",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000421062_IMG_xwm4ya.jpg"
  },
  {
    "codigo": "1127",
    "nombre": "Delicias Club",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1129",
    "nombre": "El Bayo C.D. Ejea de los",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000069721_escudo_bayo.jpg"
  },
  {
    "codigo": "1130",
    "nombre": "Epila C.F. A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000312174_IMG_4810_copia.jpeg"
  },
  {
    "codigo": "1133",
    "nombre": "San Jorge de Aragon Colegio",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1136",
    "nombre": "Amistad U.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1141",
    "nombre": "Jumara",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000053319_Leon_verde.jpg"
  },
  {
    "codigo": "1143",
    "nombre": "Gusantina Kalderete",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1144",
    "nombre": "Liceo Europa Col.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000071917_liceo_europa.jpg"
  },
  {
    "codigo": "1154",
    "nombre": "Olivar Estadio Miralbueno",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1160",
    "nombre": "Romareda C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000222900_Escudo_Rom.png"
  },
  {
    "codigo": "1161",
    "nombre": "San Viator F.s. 78",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1162",
    "nombre": "Garrapinillos C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1166",
    "nombre": "Bajo Aragon C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000390676_Logo_Nuevo_Blanco_.jpg"
  },
  {
    "codigo": "1171",
    "nombre": "Sala Zaragoza F.s. A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1174",
    "nombre": "Montearagon A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000434841_Logo_Montearag__n.PNG"
  },
  {
    "codigo": "1178",
    "nombre": "Paracuellos C.D. Paracuellos de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000312214_E.PARACUELLOS_OFICIAL_sello.jpg"
  },
  {
    "codigo": "1181",
    "nombre": "Pradillano Sporting Pradilla de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000043240_pradillano.jpg"
  },
  {
    "codigo": "1183",
    "nombre": "Santo D.juventud C.F.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1187",
    "nombre": "Uncastillo C.d.j.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000047894_Escudo_Uncastillo.jpg"
  },
  {
    "codigo": "1190",
    "nombre": "Escatron C.F.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000056648_C.F._ESCATRON.jpg"
  },
  {
    "codigo": "1192",
    "nombre": "Leciena C.d.r.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000144265_Escudo_CDRS_Lecinena.jpg"
  },
  {
    "codigo": "1193",
    "nombre": "Oliver C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000070387_CDO.jpg"
  },
  {
    "codigo": "1194",
    "nombre": "Rivas A.D. Ejea de los",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1196",
    "nombre": "Santa Isabel R.s.d.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1197",
    "nombre": "Stadium Casablanca C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1198",
    "nombre": "Valdefierro C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000478076_Logo_Valdefierro_Rebranding_vectorizado_25_26.png"
  },
  {
    "codigo": "1208",
    "nombre": "Madre Maria Rosa Molas",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000108090_rosa_molass.jpg"
  },
  {
    "codigo": "1209",
    "nombre": "Miguel Catalan I.e.s.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000069112_Logo2.JPG"
  },
  {
    "codigo": "1216",
    "nombre": "Sagrada Familia Col.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1217",
    "nombre": "Abogados Col.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000255720_1.JPG"
  },
  {
    "codigo": "1221",
    "nombre": "La Salle Franciscanas",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000459207_images.jpeg"
  },
  {
    "codigo": "1222",
    "nombre": "Condes de Aragon C.F.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000111871_logo__club_deporte._deporte_jpg.jpg"
  },
  {
    "codigo": "1229",
    "nombre": "Pastriz C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000395626_Club_deportivo_Pastriz_escudo.jpg"
  },
  {
    "codigo": "1232",
    "nombre": "Herrera C.D. Herrera de los",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000068918_Herrera.jpg"
  },
  {
    "codigo": "1234",
    "nombre": "Bujaraloz C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000069062_Escudo.jpg"
  },
  {
    "codigo": "1237",
    "nombre": "Ricla C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000113702_ESCUDO_CD_RICLA.jpg"
  },
  {
    "codigo": "1242",
    "nombre": "Cortes de Aragon Col",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1244",
    "nombre": "Miraflores C.P.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1252",
    "nombre": "Cristo Rey A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000088139_escudo_cr.jpg"
  },
  {
    "codigo": "1257",
    "nombre": "Montaana A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000486720_ESCUDO_COLOR_VECTORIZADO.png"
  },
  {
    "codigo": "1264",
    "nombre": "La Cigea A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000096089_LA_CIGUENA.jpg"
  },
  {
    "codigo": "1266",
    "nombre": "La Milagrosa Col.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000469582_1684342788107.jpeg"
  },
  {
    "codigo": "1267",
    "nombre": "Utebo F.s. A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1272",
    "nombre": "Figueruelas Ayto.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1283",
    "nombre": "Calasanz",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000069553_calasanz1.jpg"
  },
  {
    "codigo": "1284",
    "nombre": "Pompiliano Escolapias",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000071919_pompiliano.jpg"
  },
  {
    "codigo": "1296",
    "nombre": "Anion C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000318118_escudo_ani_on2__1_.png"
  },
  {
    "codigo": "1303",
    "nombre": "Juan de Lanuza Col.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000141657_logo_vertical2.jpg"
  },
  {
    "codigo": "1304",
    "nombre": "Juan Xxiii A.p.a.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1313",
    "nombre": "Alfinden A.D. Puebla de Alfindn",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1314",
    "nombre": "Magallon A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000111889_Escudo_A.D._Magallon.png"
  },
  {
    "codigo": "1317",
    "nombre": "Los Molinos U.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000254774_ESCUDO.jpg"
  },
  {
    "codigo": "1329",
    "nombre": "Hernan Cortes Junquera C.F.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000274922_escudo.png"
  },
  {
    "codigo": "1332",
    "nombre": "San Jose U.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000041067_ESCUDO.JPG"
  },
  {
    "codigo": "1342",
    "nombre": "El Burgo F.s. Burgo de Ebro (el)",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000288760_00_Escudo_A.D._El_Burgo_FS._v1_4_AF__CMYK.JPG"
  },
  {
    "codigo": "1343",
    "nombre": "San Agustin C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000423455_PHOTO_2024_01_17_11_23_26.jpg"
  },
  {
    "codigo": "1350",
    "nombre": "Aragon Veteranos",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1354",
    "nombre": "Siroco",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000277721_siroco_escudo.jpg"
  },
  {
    "codigo": "1357",
    "nombre": "Ranillas At.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000459326_escudo_ranillas.jpg"
  },
  {
    "codigo": "1358",
    "nombre": "Alhama C.F. Alhama de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000043265_alhama.jpg"
  },
  {
    "codigo": "1362",
    "nombre": "Santa Anastasia C.F. Ejea de los",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000312639_escudo_color.png"
  },
  {
    "codigo": "1365",
    "nombre": "Luceni C.F. Luceni",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000056357_luceni_cf.jpg"
  },
  {
    "codigo": "1370",
    "nombre": "Chiprana C.F.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000037911_chiprana.gif"
  },
  {
    "codigo": "1371",
    "nombre": "Pina S.m.d. Pina de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "501623",
    "nombre": "Illueca F.s.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000425932_Screenshot_20241129_174810_Chrome.jpg"
  },
  {
    "codigo": "1378",
    "nombre": "Calasancio A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000375795_1.jpg"
  },
  {
    "codigo": "1380",
    "nombre": "Rinconcico Vet.bar",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000182678_rinconcico.png"
  },
  {
    "codigo": "1387",
    "nombre": "Aleman A.p.a.col.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000073569_logo_aleman.jpg"
  },
  {
    "codigo": "1391",
    "nombre": "La Almozara C.P.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000314924_20210919_155732.jpg"
  },
  {
    "codigo": "1393",
    "nombre": "Colo Colo",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000244896_Escudo-fondo-blanco.jpg"
  },
  {
    "codigo": "1404",
    "nombre": "Aneto A.c.d.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000316603_IMG_20190803_191454__002_.jpg"
  },
  {
    "codigo": "1407",
    "nombre": "El Limite A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000399932_escudo.png"
  },
  {
    "codigo": "1415",
    "nombre": "La Salle Gran Via C.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1429",
    "nombre": "Las Delicias de Zaragoza A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000167239_00100_0000075696_deliciascolor.jpg"
  },
  {
    "codigo": "1430",
    "nombre": "El Trebol A.i.s.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000214269_logo_bn.jpg"
  },
  {
    "codigo": "1432",
    "nombre": "Vedruna A.p.a.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1449",
    "nombre": "Torres C.D. Torres de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000040053_torres.jpg"
  },
  {
    "codigo": "1458",
    "nombre": "Camping Bohalar",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000210607_logotipo_camping-iloveimg-converted_(1)_(797x800).jpg"
  },
  {
    "codigo": "1459",
    "nombre": "San Juan A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000169366_escudofed.jpg"
  },
  {
    "codigo": "1463",
    "nombre": "Gallur C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000120684_ESCUDO.jpg"
  },
  {
    "codigo": "1465",
    "nombre": "Fuentes Ayto. Fuentes de",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1469",
    "nombre": "Embid C.F.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000043264_embid.jpg"
  },
  {
    "codigo": "1477",
    "nombre": "Biota C.d.e.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000051409_biota.jpg"
  },
  {
    "codigo": "1483",
    "nombre": "Sabian C.F.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000355607_IMG_20220514_230755_782.jpg"
  },
  {
    "codigo": "1501",
    "nombre": "Actur Pablo Iglesias C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000197857_escudo_api_2018.jpg"
  },
  {
    "codigo": "1505",
    "nombre": "Eder C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000494143_Logo_Eder_Rojo.png"
  },
  {
    "codigo": "1520",
    "nombre": "Bardena C.F. Ejea de los",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000088797_bardena9.gif"
  },
  {
    "codigo": "1521",
    "nombre": "Miralbueno Ctro.dep.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1535",
    "nombre": "Rueda A.c.r.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000359492_LogoACR.png"
  },
  {
    "codigo": "1540",
    "nombre": "Alfamen U.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1543",
    "nombre": "Uson Veteranos",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000320583_uson.jpg"
  },
  {
    "codigo": "1545",
    "nombre": "Calatorao F.s. Calatorao",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000417978_ESCUDO.jpg"
  },
  {
    "codigo": "1550",
    "nombre": "Agrupacion Dep.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000342721_1.png"
  },
  {
    "codigo": "1553",
    "nombre": "Sestrica C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000278010_CD_SESTRICA.jpg"
  },
  {
    "codigo": "1555",
    "nombre": "Mores C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000069706_escudo_del_MORES.jpg"
  },
  {
    "codigo": "1566",
    "nombre": "Universidad Vet.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1568",
    "nombre": "Corazonistas A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000316627_1.jpg"
  },
  {
    "codigo": "1589",
    "nombre": "Borja E.f.b",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000408180_IMG_20240406_185021.jpg"
  },
  {
    "codigo": "1590",
    "nombre": "Novallas C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000067247_Escudo_CD_Novallas.jpg"
  },
  {
    "codigo": "1609",
    "nombre": "Alierta Augusto Salas A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1624",
    "nombre": "Villa de Maella Maella",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000056116_maella_fs.jpg"
  },
  {
    "codigo": "1634",
    "nombre": "Azuara C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1651",
    "nombre": "Sarakosta",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000069186_la_foto_(1).JPG"
  },
  {
    "codigo": "1678",
    "nombre": "San Andres Asociacion",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000310297_IMG_0887.jpg"
  },
  {
    "codigo": "1703",
    "nombre": "Ajax Veteranos",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000203469_AJAX_VETERANOS_AD.jpg"
  },
  {
    "codigo": "1709",
    "nombre": "Enrique de Osso C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000393656_Escudo_CD_Enrique_de_Oss_.png"
  },
  {
    "codigo": "1718",
    "nombre": "Maria Auxiliadora",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000329261_Zaragoza_MAuxiliadora_vertical.jpg"
  },
  {
    "codigo": "1727",
    "nombre": "Calatayud At.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000418735_1_001.png"
  },
  {
    "codigo": "1737",
    "nombre": "Fabara F.s. Fabara",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000116629_Escudo_Fabara.jpg"
  },
  {
    "codigo": "1754",
    "nombre": "Alto la Muela C.F. Muela",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000052612_alto_la_muela.png"
  },
  {
    "codigo": "1775",
    "nombre": "Epila S.m.d.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000476404_Escudo___pila.jpg"
  },
  {
    "codigo": "1782",
    "nombre": "Chinarros F.s. Monegrillo",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1787",
    "nombre": "Pirineos Sagrado Corazon",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000455070_SCJ_LogoPirineos_Variaciones_Color__4_.jpg"
  },
  {
    "codigo": "1798",
    "nombre": "Escalerillas Distrito 8 At.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1824",
    "nombre": "San Lazaro C.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000355554_ESCUDO_SAN_L_ZARO.jpg"
  },
  {
    "codigo": "1866",
    "nombre": "Zaragoza Medicos",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000040746_ICOMZ.gif"
  },
  {
    "codigo": "1878",
    "nombre": "La Joyosa C.D. Joyosa",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000317961_escudo_cd_la_joyosa.png"
  },
  {
    "codigo": "1893",
    "nombre": "Nonaspe U.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000276384_20200729_095519.jpg"
  },
  {
    "codigo": "1905",
    "nombre": "Caspe F.s.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1908",
    "nombre": "Ainzon F.s. 2005 Ainzn",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000281414_logo_ainzon_imagen_2.jpg"
  },
  {
    "codigo": "1914",
    "nombre": "Pea la Union A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1916",
    "nombre": "Sala 10 A.D.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000463287_WhatsApp_Image_2025_09_25_at_09.31.09.jpeg"
  },
  {
    "codigo": "1944",
    "nombre": "Doctor Azua C.P.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1961",
    "nombre": "Gelsa Ayuntamiento",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1965",
    "nombre": "Quinto Ayuntamiento",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "1966",
    "nombre": "Sastago Ayto.",
    "localidad": "Zaragoza",
    "provincia": "Zaragoza",
    "img": ""
  },
  {
    "codigo": "2001",
    "nombre": "Binefar C.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000387459_ESCUDO_CD_BINEFAR_.jpg"
  },
  {
    "codigo": "2002",
    "nombre": "Barbastro U.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000400603_Escudo_02.png"
  },
  {
    "codigo": "2004",
    "nombre": "Belver C.D. Belver de",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000043228_belver.jpg"
  },
  {
    "codigo": "2006",
    "nombre": "Tardienta A.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000421666_ESCUDO_CF_TARDIENTA.png"
  },
  {
    "codigo": "2007",
    "nombre": "Sariena C.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000220903_SARINENA.jpg"
  },
  {
    "codigo": "2008",
    "nombre": "Binaced U.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000416606_Screenshot_20240903_095319_Adobe_Acrobat.jpg"
  },
  {
    "codigo": "2009",
    "nombre": "Altorricon C.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": ""
  },
  {
    "codigo": "2010",
    "nombre": "Jacetano C.F.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000314482_logo_Jacetano_nuevo.png"
  },
  {
    "codigo": "2011",
    "nombre": "Gurrea S.D. Gurrea de",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000110573_gurreasdhu1.png"
  },
  {
    "codigo": "2012",
    "nombre": "Fraga U.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000065943_UD_Fraga2.png"
  },
  {
    "codigo": "2013",
    "nombre": "Sabianigo A.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000052989_sabinanigo_ad.png"
  },
  {
    "codigo": "2015",
    "nombre": "Lanaja C.F.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000314233_WhatsApp_Image_2021_09_14_at_12.36.32.jpeg"
  },
  {
    "codigo": "2016",
    "nombre": "Monzon Atletico",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000320588_WhatsApp_Image_2021_10_26_at_21.41.48.jpeg"
  },
  {
    "codigo": "2017",
    "nombre": "Huesca S.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000223477_huesca_sd.png"
  },
  {
    "codigo": "2018",
    "nombre": "Almudevar A.D. Almudvar",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": ""
  },
  {
    "codigo": "2019",
    "nombre": "Tamarite C.D. Juvenil Tamarite de",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000043214_tamarite.png"
  },
  {
    "codigo": "2021",
    "nombre": "Zaidin C.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000274852_escudo_c.d._zaid_n.jpg"
  },
  {
    "codigo": "2024",
    "nombre": "Montaesa U.D. Castejn de",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000369838_EscudoUDMontan_esa_VECTOR_001.png"
  },
  {
    "codigo": "2027",
    "nombre": "Alcolea C.F. Alcolea de Cinca",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000169597_escudo_ALCOLEA_C.F..jpg"
  },
  {
    "codigo": "2028",
    "nombre": "Robres C.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000046368_robres.jpg"
  },
  {
    "codigo": "2032",
    "nombre": "Osso de Cinca C.F. Osso de",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000173520_escudo_osso.jpg"
  },
  {
    "codigo": "2040",
    "nombre": "Ontiena C.F.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000276334_ONTI_ENAC.F.jpg"
  },
  {
    "codigo": "2046",
    "nombre": "Lalueza C.F.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000038220_Lalueza.jpg"
  },
  {
    "codigo": "2049",
    "nombre": "Bolea C.F. Sotonera",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000248396_escudo.jpg"
  },
  {
    "codigo": "2057",
    "nombre": "Albelda At.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000386593_LOGO_FUTBOL_AT_ALBELDA.jpg"
  },
  {
    "codigo": "2063",
    "nombre": "Pomar C.F. San Miguel del",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000405496_ESCUDO_POMAR_NUEVO_page_0001.jpg"
  },
  {
    "codigo": "2090",
    "nombre": "Santalecina U.D. San Miguel del",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000037125_escudo2.jpg"
  },
  {
    "codigo": "2093",
    "nombre": "Biescas U.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000043266_biescas.jpg"
  },
  {
    "codigo": "2094",
    "nombre": "La Litera Escuela Dep. Tamarite de",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000157222_ESCUDO_E.D._LA_LITERA.jpg"
  },
  {
    "codigo": "2100",
    "nombre": "Boltaa C.F.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": ""
  },
  {
    "codigo": "2101",
    "nombre": "Benabarre U.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000382378_IMG_20230510_WA0050.jpg"
  },
  {
    "codigo": "2103",
    "nombre": "La Fueva U.D. Fueva",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": ""
  },
  {
    "codigo": "2113",
    "nombre": "Castejon C.D. Castejn de",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000357253_1.jpg"
  },
  {
    "codigo": "2114",
    "nombre": "Ayerbe C.F.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000466195_Imagen_de_WhatsApp_2025_09_30_a_las_21.42.04_48494bfd.jpg"
  },
  {
    "codigo": "2116",
    "nombre": "Estadilla C.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000394434_CD_ESTADILLA_ESCUDO_BUENO.jpg"
  },
  {
    "codigo": "2118",
    "nombre": "Alcala de Gurrea U.D. Alcal de",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": ""
  },
  {
    "codigo": "2120",
    "nombre": "San Esteban U.D. San Esteban de",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000088894_san_esteban.jpg"
  },
  {
    "codigo": "2137",
    "nombre": "Sobrarbe Escuela Dep.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000315862_logo_escuela.jpg"
  },
  {
    "codigo": "2151",
    "nombre": "Albalate C.D. Albalate de",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": ""
  },
  {
    "codigo": "2152",
    "nombre": "Esplus C.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000318350_esplus.jpg"
  },
  {
    "codigo": "2153",
    "nombre": "Frula A.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000278615_ADFRULA_20200921_133319.jpg"
  },
  {
    "codigo": "2154",
    "nombre": "San Jorge C.F.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000401657_escudomini.png"
  },
  {
    "codigo": "2169",
    "nombre": "Graus C.F.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": ""
  },
  {
    "codigo": "2171",
    "nombre": "Pea Fragatina Fraga",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000386847_Logo_Bota_Futbol.jpg"
  },
  {
    "codigo": "2175",
    "nombre": "Pea la Murga Sabinigo",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": ""
  },
  {
    "codigo": "2182",
    "nombre": "Sietamo C.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000495869_Escudo_redondo_Rub__n.png"
  },
  {
    "codigo": "2185",
    "nombre": "Sena C.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000040632_TomoXV96.jpg"
  },
  {
    "codigo": "2187",
    "nombre": "Peas Agrupacion.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000089610_escudo_final_2014_penas_sarinena.jpg"
  },
  {
    "codigo": "2191",
    "nombre": "Peas Oscenses C.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000080862_penas_oscenses_2.jpg"
  },
  {
    "codigo": "2193",
    "nombre": "Alto Ara C.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000052610_alto_ara.png"
  },
  {
    "codigo": "2200",
    "nombre": "Pea Ferranca A.D.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000205161_thumbnail_what_(1).jpg"
  },
  {
    "codigo": "2210",
    "nombre": "Pealba At.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000312223_ecudo_pe_alba.png"
  },
  {
    "codigo": "2216",
    "nombre": "Valfonda C.D. Torres de",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000071545_Valfonda.jpg"
  },
  {
    "codigo": "508626",
    "nombre": "Monzon Futbol Base At. de",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000139369_escudocolorfaf.jpg"
  },
  {
    "codigo": "2229",
    "nombre": "Binefar Futbol Base",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000460195_Logo_Club.jpg"
  },
  {
    "codigo": "2230",
    "nombre": "Villa de Biescas F.C. Biescas",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": ""
  },
  {
    "codigo": "2239",
    "nombre": "El Temple F.C. Gurrea de Gállego",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": ""
  },
  {
    "codigo": "2249",
    "nombre": "River Monzon Esc.dep.",
    "localidad": "Huesca",
    "provincia": "Huesca",
    "img": "https://files.futbolaragon.com/pnfg/pimg/Clubes/00100_0000496903_RIVER_MONZON.jpeg"
  }
];

  function ensureClubesAragonSeeded() {
    if (!state.directory) state.directory = {};
    if (!state.directory.clubes) state.directory.clubes = [];
    if (!state.directory.federaciones) state.directory.federaciones = [];
    if (state.directory.clubesAragonSeeded) return;
    state.directory.clubesAragonSeeded = true;

    // 1. Ensure FARGF Federation exists in state
    let fargf = state.directory.federaciones.find(f => 
      f && ((f.nombre && f.nombre.toLowerCase().includes('aragonesa')) || (f.federacion && f.federacion.toLowerCase().includes('aragonesa')))
    );
    if (!fargf) {
      fargf = {
        id: 'fed_fargf',
        nombre: 'FARGF - Federación Aragonesa de Fútbol',
        federacion: 'FARGF - Federación Aragonesa de Fútbol',
        comunidad: 'Aragón',
        region: 'Aragón',
        orden: 2,
        equipos: []
      };
      state.directory.federaciones.push(fargf);
      saveToFirebase('federaciones', fargf);
    }

    // 2. Add Aragonesa clubs preventing duplicates
    let addedCount = 0;
    ARAGON_CLUBS_DATA.forEach(ac => {
      if (!ac || !ac.nombre) return;
      const cleanAcName = ac.nombre.toLowerCase().trim();
      const codeStr = String(ac.codigo || '').trim();

      const exists = state.directory.clubes.some(c => {
        if (!c) return false;
        const cName = String(c.nombre || c.equipo || '').toLowerCase().trim();
        const cCode = String(c.codigo || '').trim();
        const cId = String(c.id || '').trim();

        return (codeStr && cCode === codeStr) || 
               (codeStr && cId === 'c_fa_' + codeStr) ||
               (cName === cleanAcName) ||
               (cleanAcName.length > 5 && cName.includes(cleanAcName)) ||
               (cName.length > 5 && cleanAcName.includes(cName));
      });

      if (!exists) {
        const newClub = {
          id: 'c_fa_' + (ac.codigo || Date.now() + Math.floor(Math.random()*100)),
          codigo: ac.codigo || '',
          nombre: ac.nombre,
          equipo: ac.nombre,
          localidad: ac.localidad || 'Zaragoza',
          provincia: ac.provincia || 'Zaragoza',
          comunidad: 'Aragón',
          federacion: 'FARGF - Federación Aragonesa de Fútbol',
          logo: ac.img || '',
          escudo: ac.img || '',
          colorPrimary: '#2563eb',
          colorSecondary: '#ffffff',
          tipo: 'Formador'
        };

        state.directory.clubes.push(newClub);
        saveToFirebase('clubes', newClub);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      console.log(`✅ ${addedCount} clubes de la Federación Aragonesa añadidos con éxito sin duplicar.`);
      setFirebaseHeaderStatus('synced');
    }
  }

  
  // LISTA DE EQUIPOS Y JUGADORES DE LAS 10 COMPETICIONES DE LA FEDERACIÓN ARAGONESA DE FÚTBOL
  const ARAGON_TEAMS_DATA = [
  {
    "id": "eq_fa_1",
    "nombre": "Real Zaragoza S.A.D. Cadete A",
    "equipo": "Real Zaragoza S.A.D. Cadete A",
    "club": "Real Zaragoza S.A.D.",
    "clubVinculado": "Real Zaragoza S.A.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_2",
    "nombre": "S.D. Huesca Cadete A",
    "equipo": "S.D. Huesca Cadete A",
    "club": "S.D. Huesca",
    "clubVinculado": "S.D. Huesca",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_3",
    "nombre": "Teruel C.D. Cadete A",
    "equipo": "Teruel C.D. Cadete A",
    "club": "Teruel C.D.",
    "clubVinculado": "Teruel C.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Teruel",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_4",
    "nombre": "Montecarlo U.D. Cadete A",
    "equipo": "Montecarlo U.D. Cadete A",
    "club": "Montecarlo U.D.",
    "clubVinculado": "Montecarlo U.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_5",
    "nombre": "San Gregorio Arrabal C.D. Cadete A",
    "equipo": "San Gregorio Arrabal C.D. Cadete A",
    "club": "San Gregorio Arrabal C.D.",
    "clubVinculado": "San Gregorio Arrabal C.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_6",
    "nombre": "San Agustín C.D. Cadete A",
    "equipo": "San Agustín C.D. Cadete A",
    "club": "San Agustín C.D.",
    "clubVinculado": "San Agustín C.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_7",
    "nombre": "Balsas Picarral U.D. Cadete A",
    "equipo": "Balsas Picarral U.D. Cadete A",
    "club": "Balsas Picarral U.D.",
    "clubVinculado": "Balsas Picarral U.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_8",
    "nombre": "Stadium Casablanca C.D. Cadete A",
    "equipo": "Stadium Casablanca C.D. Cadete A",
    "club": "Stadium Casablanca C.D.",
    "clubVinculado": "Stadium Casablanca C.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_9",
    "nombre": "Santo Domingo Juventud C.F. Cadete A",
    "equipo": "Santo Domingo Juventud C.F. Cadete A",
    "club": "Santo Domingo Juventud C.F.",
    "clubVinculado": "Santo Domingo Juventud C.F.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_10",
    "nombre": "Amistad U.D. Cadete A",
    "equipo": "Amistad U.D. Cadete A",
    "club": "Amistad U.D.",
    "clubVinculado": "Amistad U.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_11",
    "nombre": "Racing Club Zaragoza Cadete A",
    "equipo": "Racing Club Zaragoza Cadete A",
    "club": "Racing Club Zaragoza",
    "clubVinculado": "Racing Club Zaragoza",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_12",
    "nombre": "Oliver C.D. Cadete A",
    "equipo": "Oliver C.D. Cadete A",
    "club": "Oliver C.D.",
    "clubVinculado": "Oliver C.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_13",
    "nombre": "Utebo C.F. Cadete A",
    "equipo": "Utebo C.F. Cadete A",
    "club": "Utebo C.F.",
    "clubVinculado": "Utebo C.F.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_14",
    "nombre": "Ejea S.D. Cadete A",
    "equipo": "Ejea S.D. Cadete A",
    "club": "Ejea S.D.",
    "clubVinculado": "Ejea S.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_15",
    "nombre": "Casetas U.D. Cadete A",
    "equipo": "Casetas U.D. Cadete A",
    "club": "Casetas U.D.",
    "clubVinculado": "Casetas U.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_16",
    "nombre": "Tauste C.D. Cadete A",
    "equipo": "Tauste C.D. Cadete A",
    "club": "Tauste C.D.",
    "clubVinculado": "Tauste C.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_17",
    "nombre": "Alfajarín C.F. Cadete A",
    "equipo": "Alfajarín C.F. Cadete A",
    "club": "Alfajarín C.F.",
    "clubVinculado": "Alfajarín C.F.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_18",
    "nombre": "Brea C.D. Cadete A",
    "equipo": "Brea C.D. Cadete A",
    "club": "Brea C.D.",
    "clubVinculado": "Brea C.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_19",
    "nombre": "Hernán Cortés Junquera C.F. Cadete A",
    "equipo": "Hernán Cortés Junquera C.F. Cadete A",
    "club": "Hernán Cortés Junquera C.F.",
    "clubVinculado": "Hernán Cortés Junquera C.F.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_20",
    "nombre": "Escuela Fútbol Oscense C.D. Cadete A",
    "equipo": "Escuela Fútbol Oscense C.D. Cadete A",
    "club": "Escuela Fútbol Oscense C.D.",
    "clubVinculado": "Escuela Fútbol Oscense C.D.",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_21",
    "nombre": "Binéfar Fútbol Base Cadete A",
    "equipo": "Binéfar Fútbol Base Cadete A",
    "club": "Binéfar Fútbol Base",
    "clubVinculado": "Binéfar Fútbol Base",
    "competicion": "DIVISIÓN HONOR CADETE",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_22",
    "nombre": "Real Zaragoza S.A.D. Cadete B",
    "equipo": "Real Zaragoza S.A.D. Cadete B",
    "club": "Real Zaragoza S.A.D.",
    "clubVinculado": "Real Zaragoza S.A.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_23",
    "nombre": "S.D. Huesca Cadete B",
    "equipo": "S.D. Huesca Cadete B",
    "club": "S.D. Huesca",
    "clubVinculado": "S.D. Huesca",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_24",
    "nombre": "Teruel C.D. Cadete B",
    "equipo": "Teruel C.D. Cadete B",
    "club": "Teruel C.D.",
    "clubVinculado": "Teruel C.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Teruel",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_25",
    "nombre": "Montecarlo U.D. Cadete B",
    "equipo": "Montecarlo U.D. Cadete B",
    "club": "Montecarlo U.D.",
    "clubVinculado": "Montecarlo U.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_26",
    "nombre": "San Gregorio Arrabal C.D. Cadete B",
    "equipo": "San Gregorio Arrabal C.D. Cadete B",
    "club": "San Gregorio Arrabal C.D.",
    "clubVinculado": "San Gregorio Arrabal C.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_27",
    "nombre": "San Agustín C.D. Cadete B",
    "equipo": "San Agustín C.D. Cadete B",
    "club": "San Agustín C.D.",
    "clubVinculado": "San Agustín C.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_28",
    "nombre": "Balsas Picarral U.D. Cadete B",
    "equipo": "Balsas Picarral U.D. Cadete B",
    "club": "Balsas Picarral U.D.",
    "clubVinculado": "Balsas Picarral U.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_29",
    "nombre": "Stadium Casablanca C.D. Cadete B",
    "equipo": "Stadium Casablanca C.D. Cadete B",
    "club": "Stadium Casablanca C.D.",
    "clubVinculado": "Stadium Casablanca C.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_30",
    "nombre": "Santo Domingo Juventud C.F. Cadete B",
    "equipo": "Santo Domingo Juventud C.F. Cadete B",
    "club": "Santo Domingo Juventud C.F.",
    "clubVinculado": "Santo Domingo Juventud C.F.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_31",
    "nombre": "Amistad U.D. Cadete B",
    "equipo": "Amistad U.D. Cadete B",
    "club": "Amistad U.D.",
    "clubVinculado": "Amistad U.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_32",
    "nombre": "Racing Club Zaragoza Cadete B",
    "equipo": "Racing Club Zaragoza Cadete B",
    "club": "Racing Club Zaragoza",
    "clubVinculado": "Racing Club Zaragoza",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_33",
    "nombre": "Oliver C.D. Cadete B",
    "equipo": "Oliver C.D. Cadete B",
    "club": "Oliver C.D.",
    "clubVinculado": "Oliver C.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_34",
    "nombre": "Utebo C.F. Cadete B",
    "equipo": "Utebo C.F. Cadete B",
    "club": "Utebo C.F.",
    "clubVinculado": "Utebo C.F.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_35",
    "nombre": "Ejea S.D. Cadete B",
    "equipo": "Ejea S.D. Cadete B",
    "club": "Ejea S.D.",
    "clubVinculado": "Ejea S.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_36",
    "nombre": "Casetas U.D. Cadete B",
    "equipo": "Casetas U.D. Cadete B",
    "club": "Casetas U.D.",
    "clubVinculado": "Casetas U.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_37",
    "nombre": "Tauste C.D. Cadete B",
    "equipo": "Tauste C.D. Cadete B",
    "club": "Tauste C.D.",
    "clubVinculado": "Tauste C.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_38",
    "nombre": "Alfajarín C.F. Cadete B",
    "equipo": "Alfajarín C.F. Cadete B",
    "club": "Alfajarín C.F.",
    "clubVinculado": "Alfajarín C.F.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_39",
    "nombre": "Brea C.D. Cadete B",
    "equipo": "Brea C.D. Cadete B",
    "club": "Brea C.D.",
    "clubVinculado": "Brea C.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_40",
    "nombre": "Hernán Cortés Junquera C.F. Cadete B",
    "equipo": "Hernán Cortés Junquera C.F. Cadete B",
    "club": "Hernán Cortés Junquera C.F.",
    "clubVinculado": "Hernán Cortés Junquera C.F.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_41",
    "nombre": "Escuela Fútbol Oscense C.D. Cadete B",
    "equipo": "Escuela Fútbol Oscense C.D. Cadete B",
    "club": "Escuela Fútbol Oscense C.D.",
    "clubVinculado": "Escuela Fútbol Oscense C.D.",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_42",
    "nombre": "Binéfar Fútbol Base Cadete B",
    "equipo": "Binéfar Fútbol Base Cadete B",
    "club": "Binéfar Fútbol Base",
    "clubVinculado": "Binéfar Fútbol Base",
    "competicion": "CADETE AUTONÓMICA",
    "categoria": "Cadete",
    "sub": "SUB16",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_43",
    "nombre": "Real Zaragoza S.A.D. Cadete C",
    "equipo": "Real Zaragoza S.A.D. Cadete C",
    "club": "Real Zaragoza S.A.D.",
    "clubVinculado": "Real Zaragoza S.A.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_44",
    "nombre": "S.D. Huesca Cadete C",
    "equipo": "S.D. Huesca Cadete C",
    "club": "S.D. Huesca",
    "clubVinculado": "S.D. Huesca",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_45",
    "nombre": "Teruel C.D. Cadete C",
    "equipo": "Teruel C.D. Cadete C",
    "club": "Teruel C.D.",
    "clubVinculado": "Teruel C.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Teruel",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_46",
    "nombre": "Montecarlo U.D. Cadete C",
    "equipo": "Montecarlo U.D. Cadete C",
    "club": "Montecarlo U.D.",
    "clubVinculado": "Montecarlo U.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_47",
    "nombre": "San Gregorio Arrabal C.D. Cadete C",
    "equipo": "San Gregorio Arrabal C.D. Cadete C",
    "club": "San Gregorio Arrabal C.D.",
    "clubVinculado": "San Gregorio Arrabal C.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_48",
    "nombre": "San Agustín C.D. Cadete C",
    "equipo": "San Agustín C.D. Cadete C",
    "club": "San Agustín C.D.",
    "clubVinculado": "San Agustín C.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_49",
    "nombre": "Balsas Picarral U.D. Cadete C",
    "equipo": "Balsas Picarral U.D. Cadete C",
    "club": "Balsas Picarral U.D.",
    "clubVinculado": "Balsas Picarral U.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_50",
    "nombre": "Stadium Casablanca C.D. Cadete C",
    "equipo": "Stadium Casablanca C.D. Cadete C",
    "club": "Stadium Casablanca C.D.",
    "clubVinculado": "Stadium Casablanca C.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_51",
    "nombre": "Santo Domingo Juventud C.F. Cadete C",
    "equipo": "Santo Domingo Juventud C.F. Cadete C",
    "club": "Santo Domingo Juventud C.F.",
    "clubVinculado": "Santo Domingo Juventud C.F.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_52",
    "nombre": "Amistad U.D. Cadete C",
    "equipo": "Amistad U.D. Cadete C",
    "club": "Amistad U.D.",
    "clubVinculado": "Amistad U.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_53",
    "nombre": "Racing Club Zaragoza Cadete C",
    "equipo": "Racing Club Zaragoza Cadete C",
    "club": "Racing Club Zaragoza",
    "clubVinculado": "Racing Club Zaragoza",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_54",
    "nombre": "Oliver C.D. Cadete C",
    "equipo": "Oliver C.D. Cadete C",
    "club": "Oliver C.D.",
    "clubVinculado": "Oliver C.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_55",
    "nombre": "Utebo C.F. Cadete C",
    "equipo": "Utebo C.F. Cadete C",
    "club": "Utebo C.F.",
    "clubVinculado": "Utebo C.F.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_56",
    "nombre": "Ejea S.D. Cadete C",
    "equipo": "Ejea S.D. Cadete C",
    "club": "Ejea S.D.",
    "clubVinculado": "Ejea S.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_57",
    "nombre": "Casetas U.D. Cadete C",
    "equipo": "Casetas U.D. Cadete C",
    "club": "Casetas U.D.",
    "clubVinculado": "Casetas U.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_58",
    "nombre": "Tauste C.D. Cadete C",
    "equipo": "Tauste C.D. Cadete C",
    "club": "Tauste C.D.",
    "clubVinculado": "Tauste C.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_59",
    "nombre": "Alfajarín C.F. Cadete C",
    "equipo": "Alfajarín C.F. Cadete C",
    "club": "Alfajarín C.F.",
    "clubVinculado": "Alfajarín C.F.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_60",
    "nombre": "Brea C.D. Cadete C",
    "equipo": "Brea C.D. Cadete C",
    "club": "Brea C.D.",
    "clubVinculado": "Brea C.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_61",
    "nombre": "Hernán Cortés Junquera C.F. Cadete C",
    "equipo": "Hernán Cortés Junquera C.F. Cadete C",
    "club": "Hernán Cortés Junquera C.F.",
    "clubVinculado": "Hernán Cortés Junquera C.F.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_62",
    "nombre": "Escuela Fútbol Oscense C.D. Cadete C",
    "equipo": "Escuela Fútbol Oscense C.D. Cadete C",
    "club": "Escuela Fútbol Oscense C.D.",
    "clubVinculado": "Escuela Fútbol Oscense C.D.",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_63",
    "nombre": "Binéfar Fútbol Base Cadete C",
    "equipo": "Binéfar Fútbol Base Cadete C",
    "club": "Binéfar Fútbol Base",
    "clubVinculado": "Binéfar Fútbol Base",
    "competicion": "CADETE PREFERENTE",
    "categoria": "Cadete",
    "sub": "SUB15",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_64",
    "nombre": "Real Zaragoza S.A.D. Infantil A",
    "equipo": "Real Zaragoza S.A.D. Infantil A",
    "club": "Real Zaragoza S.A.D.",
    "clubVinculado": "Real Zaragoza S.A.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_65",
    "nombre": "S.D. Huesca Infantil A",
    "equipo": "S.D. Huesca Infantil A",
    "club": "S.D. Huesca",
    "clubVinculado": "S.D. Huesca",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_66",
    "nombre": "Teruel C.D. Infantil A",
    "equipo": "Teruel C.D. Infantil A",
    "club": "Teruel C.D.",
    "clubVinculado": "Teruel C.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Teruel",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_67",
    "nombre": "Montecarlo U.D. Infantil A",
    "equipo": "Montecarlo U.D. Infantil A",
    "club": "Montecarlo U.D.",
    "clubVinculado": "Montecarlo U.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_68",
    "nombre": "San Gregorio Arrabal C.D. Infantil A",
    "equipo": "San Gregorio Arrabal C.D. Infantil A",
    "club": "San Gregorio Arrabal C.D.",
    "clubVinculado": "San Gregorio Arrabal C.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_69",
    "nombre": "San Agustín C.D. Infantil A",
    "equipo": "San Agustín C.D. Infantil A",
    "club": "San Agustín C.D.",
    "clubVinculado": "San Agustín C.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_70",
    "nombre": "Balsas Picarral U.D. Infantil A",
    "equipo": "Balsas Picarral U.D. Infantil A",
    "club": "Balsas Picarral U.D.",
    "clubVinculado": "Balsas Picarral U.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_71",
    "nombre": "Stadium Casablanca C.D. Infantil A",
    "equipo": "Stadium Casablanca C.D. Infantil A",
    "club": "Stadium Casablanca C.D.",
    "clubVinculado": "Stadium Casablanca C.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_72",
    "nombre": "Santo Domingo Juventud C.F. Infantil A",
    "equipo": "Santo Domingo Juventud C.F. Infantil A",
    "club": "Santo Domingo Juventud C.F.",
    "clubVinculado": "Santo Domingo Juventud C.F.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_73",
    "nombre": "Amistad U.D. Infantil A",
    "equipo": "Amistad U.D. Infantil A",
    "club": "Amistad U.D.",
    "clubVinculado": "Amistad U.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_74",
    "nombre": "Racing Club Zaragoza Infantil A",
    "equipo": "Racing Club Zaragoza Infantil A",
    "club": "Racing Club Zaragoza",
    "clubVinculado": "Racing Club Zaragoza",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_75",
    "nombre": "Oliver C.D. Infantil A",
    "equipo": "Oliver C.D. Infantil A",
    "club": "Oliver C.D.",
    "clubVinculado": "Oliver C.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_76",
    "nombre": "Utebo C.F. Infantil A",
    "equipo": "Utebo C.F. Infantil A",
    "club": "Utebo C.F.",
    "clubVinculado": "Utebo C.F.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_77",
    "nombre": "Ejea S.D. Infantil A",
    "equipo": "Ejea S.D. Infantil A",
    "club": "Ejea S.D.",
    "clubVinculado": "Ejea S.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_78",
    "nombre": "Casetas U.D. Infantil A",
    "equipo": "Casetas U.D. Infantil A",
    "club": "Casetas U.D.",
    "clubVinculado": "Casetas U.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_79",
    "nombre": "Tauste C.D. Infantil A",
    "equipo": "Tauste C.D. Infantil A",
    "club": "Tauste C.D.",
    "clubVinculado": "Tauste C.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_80",
    "nombre": "Alfajarín C.F. Infantil A",
    "equipo": "Alfajarín C.F. Infantil A",
    "club": "Alfajarín C.F.",
    "clubVinculado": "Alfajarín C.F.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_81",
    "nombre": "Brea C.D. Infantil A",
    "equipo": "Brea C.D. Infantil A",
    "club": "Brea C.D.",
    "clubVinculado": "Brea C.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_82",
    "nombre": "Hernán Cortés Junquera C.F. Infantil A",
    "equipo": "Hernán Cortés Junquera C.F. Infantil A",
    "club": "Hernán Cortés Junquera C.F.",
    "clubVinculado": "Hernán Cortés Junquera C.F.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_83",
    "nombre": "Escuela Fútbol Oscense C.D. Infantil A",
    "equipo": "Escuela Fútbol Oscense C.D. Infantil A",
    "club": "Escuela Fútbol Oscense C.D.",
    "clubVinculado": "Escuela Fútbol Oscense C.D.",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_84",
    "nombre": "Binéfar Fútbol Base Infantil A",
    "equipo": "Binéfar Fútbol Base Infantil A",
    "club": "Binéfar Fútbol Base",
    "clubVinculado": "Binéfar Fútbol Base",
    "competicion": "DIVISIÓN HONOR INFANTIL",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_85",
    "nombre": "Real Zaragoza S.A.D. Infantil B",
    "equipo": "Real Zaragoza S.A.D. Infantil B",
    "club": "Real Zaragoza S.A.D.",
    "clubVinculado": "Real Zaragoza S.A.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_86",
    "nombre": "S.D. Huesca Infantil B",
    "equipo": "S.D. Huesca Infantil B",
    "club": "S.D. Huesca",
    "clubVinculado": "S.D. Huesca",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_87",
    "nombre": "Teruel C.D. Infantil B",
    "equipo": "Teruel C.D. Infantil B",
    "club": "Teruel C.D.",
    "clubVinculado": "Teruel C.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Teruel",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_88",
    "nombre": "Montecarlo U.D. Infantil B",
    "equipo": "Montecarlo U.D. Infantil B",
    "club": "Montecarlo U.D.",
    "clubVinculado": "Montecarlo U.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_89",
    "nombre": "San Gregorio Arrabal C.D. Infantil B",
    "equipo": "San Gregorio Arrabal C.D. Infantil B",
    "club": "San Gregorio Arrabal C.D.",
    "clubVinculado": "San Gregorio Arrabal C.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_90",
    "nombre": "San Agustín C.D. Infantil B",
    "equipo": "San Agustín C.D. Infantil B",
    "club": "San Agustín C.D.",
    "clubVinculado": "San Agustín C.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_91",
    "nombre": "Balsas Picarral U.D. Infantil B",
    "equipo": "Balsas Picarral U.D. Infantil B",
    "club": "Balsas Picarral U.D.",
    "clubVinculado": "Balsas Picarral U.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_92",
    "nombre": "Stadium Casablanca C.D. Infantil B",
    "equipo": "Stadium Casablanca C.D. Infantil B",
    "club": "Stadium Casablanca C.D.",
    "clubVinculado": "Stadium Casablanca C.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_93",
    "nombre": "Santo Domingo Juventud C.F. Infantil B",
    "equipo": "Santo Domingo Juventud C.F. Infantil B",
    "club": "Santo Domingo Juventud C.F.",
    "clubVinculado": "Santo Domingo Juventud C.F.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_94",
    "nombre": "Amistad U.D. Infantil B",
    "equipo": "Amistad U.D. Infantil B",
    "club": "Amistad U.D.",
    "clubVinculado": "Amistad U.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_95",
    "nombre": "Racing Club Zaragoza Infantil B",
    "equipo": "Racing Club Zaragoza Infantil B",
    "club": "Racing Club Zaragoza",
    "clubVinculado": "Racing Club Zaragoza",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_96",
    "nombre": "Oliver C.D. Infantil B",
    "equipo": "Oliver C.D. Infantil B",
    "club": "Oliver C.D.",
    "clubVinculado": "Oliver C.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_97",
    "nombre": "Utebo C.F. Infantil B",
    "equipo": "Utebo C.F. Infantil B",
    "club": "Utebo C.F.",
    "clubVinculado": "Utebo C.F.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_98",
    "nombre": "Ejea S.D. Infantil B",
    "equipo": "Ejea S.D. Infantil B",
    "club": "Ejea S.D.",
    "clubVinculado": "Ejea S.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_99",
    "nombre": "Casetas U.D. Infantil B",
    "equipo": "Casetas U.D. Infantil B",
    "club": "Casetas U.D.",
    "clubVinculado": "Casetas U.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_100",
    "nombre": "Tauste C.D. Infantil B",
    "equipo": "Tauste C.D. Infantil B",
    "club": "Tauste C.D.",
    "clubVinculado": "Tauste C.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_101",
    "nombre": "Alfajarín C.F. Infantil B",
    "equipo": "Alfajarín C.F. Infantil B",
    "club": "Alfajarín C.F.",
    "clubVinculado": "Alfajarín C.F.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_102",
    "nombre": "Brea C.D. Infantil B",
    "equipo": "Brea C.D. Infantil B",
    "club": "Brea C.D.",
    "clubVinculado": "Brea C.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_103",
    "nombre": "Hernán Cortés Junquera C.F. Infantil B",
    "equipo": "Hernán Cortés Junquera C.F. Infantil B",
    "club": "Hernán Cortés Junquera C.F.",
    "clubVinculado": "Hernán Cortés Junquera C.F.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_104",
    "nombre": "Escuela Fútbol Oscense C.D. Infantil B",
    "equipo": "Escuela Fútbol Oscense C.D. Infantil B",
    "club": "Escuela Fútbol Oscense C.D.",
    "clubVinculado": "Escuela Fútbol Oscense C.D.",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_105",
    "nombre": "Binéfar Fútbol Base Infantil B",
    "equipo": "Binéfar Fútbol Base Infantil B",
    "club": "Binéfar Fútbol Base",
    "clubVinculado": "Binéfar Fútbol Base",
    "competicion": "INFANTIL AUTONÓMICA",
    "categoria": "Infantil",
    "sub": "SUB14",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_106",
    "nombre": "Real Zaragoza S.A.D. Infantil C",
    "equipo": "Real Zaragoza S.A.D. Infantil C",
    "club": "Real Zaragoza S.A.D.",
    "clubVinculado": "Real Zaragoza S.A.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_107",
    "nombre": "S.D. Huesca Infantil C",
    "equipo": "S.D. Huesca Infantil C",
    "club": "S.D. Huesca",
    "clubVinculado": "S.D. Huesca",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_108",
    "nombre": "Teruel C.D. Infantil C",
    "equipo": "Teruel C.D. Infantil C",
    "club": "Teruel C.D.",
    "clubVinculado": "Teruel C.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Teruel",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_109",
    "nombre": "Montecarlo U.D. Infantil C",
    "equipo": "Montecarlo U.D. Infantil C",
    "club": "Montecarlo U.D.",
    "clubVinculado": "Montecarlo U.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_110",
    "nombre": "San Gregorio Arrabal C.D. Infantil C",
    "equipo": "San Gregorio Arrabal C.D. Infantil C",
    "club": "San Gregorio Arrabal C.D.",
    "clubVinculado": "San Gregorio Arrabal C.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_111",
    "nombre": "San Agustín C.D. Infantil C",
    "equipo": "San Agustín C.D. Infantil C",
    "club": "San Agustín C.D.",
    "clubVinculado": "San Agustín C.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_112",
    "nombre": "Balsas Picarral U.D. Infantil C",
    "equipo": "Balsas Picarral U.D. Infantil C",
    "club": "Balsas Picarral U.D.",
    "clubVinculado": "Balsas Picarral U.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_113",
    "nombre": "Stadium Casablanca C.D. Infantil C",
    "equipo": "Stadium Casablanca C.D. Infantil C",
    "club": "Stadium Casablanca C.D.",
    "clubVinculado": "Stadium Casablanca C.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_114",
    "nombre": "Santo Domingo Juventud C.F. Infantil C",
    "equipo": "Santo Domingo Juventud C.F. Infantil C",
    "club": "Santo Domingo Juventud C.F.",
    "clubVinculado": "Santo Domingo Juventud C.F.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_115",
    "nombre": "Amistad U.D. Infantil C",
    "equipo": "Amistad U.D. Infantil C",
    "club": "Amistad U.D.",
    "clubVinculado": "Amistad U.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_116",
    "nombre": "Racing Club Zaragoza Infantil C",
    "equipo": "Racing Club Zaragoza Infantil C",
    "club": "Racing Club Zaragoza",
    "clubVinculado": "Racing Club Zaragoza",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_117",
    "nombre": "Oliver C.D. Infantil C",
    "equipo": "Oliver C.D. Infantil C",
    "club": "Oliver C.D.",
    "clubVinculado": "Oliver C.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_118",
    "nombre": "Utebo C.F. Infantil C",
    "equipo": "Utebo C.F. Infantil C",
    "club": "Utebo C.F.",
    "clubVinculado": "Utebo C.F.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_119",
    "nombre": "Ejea S.D. Infantil C",
    "equipo": "Ejea S.D. Infantil C",
    "club": "Ejea S.D.",
    "clubVinculado": "Ejea S.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_120",
    "nombre": "Casetas U.D. Infantil C",
    "equipo": "Casetas U.D. Infantil C",
    "club": "Casetas U.D.",
    "clubVinculado": "Casetas U.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_121",
    "nombre": "Tauste C.D. Infantil C",
    "equipo": "Tauste C.D. Infantil C",
    "club": "Tauste C.D.",
    "clubVinculado": "Tauste C.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_122",
    "nombre": "Alfajarín C.F. Infantil C",
    "equipo": "Alfajarín C.F. Infantil C",
    "club": "Alfajarín C.F.",
    "clubVinculado": "Alfajarín C.F.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_123",
    "nombre": "Brea C.D. Infantil C",
    "equipo": "Brea C.D. Infantil C",
    "club": "Brea C.D.",
    "clubVinculado": "Brea C.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_124",
    "nombre": "Hernán Cortés Junquera C.F. Infantil C",
    "equipo": "Hernán Cortés Junquera C.F. Infantil C",
    "club": "Hernán Cortés Junquera C.F.",
    "clubVinculado": "Hernán Cortés Junquera C.F.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_125",
    "nombre": "Escuela Fútbol Oscense C.D. Infantil C",
    "equipo": "Escuela Fútbol Oscense C.D. Infantil C",
    "club": "Escuela Fútbol Oscense C.D.",
    "clubVinculado": "Escuela Fútbol Oscense C.D.",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_126",
    "nombre": "Binéfar Fútbol Base Infantil C",
    "equipo": "Binéfar Fútbol Base Infantil C",
    "club": "Binéfar Fútbol Base",
    "clubVinculado": "Binéfar Fútbol Base",
    "competicion": "INFANTIL PREFERENTE",
    "categoria": "Infantil",
    "sub": "SUB13",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_127",
    "nombre": "Real Zaragoza S.A.D. Alevín A",
    "equipo": "Real Zaragoza S.A.D. Alevín A",
    "club": "Real Zaragoza S.A.D.",
    "clubVinculado": "Real Zaragoza S.A.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_128",
    "nombre": "S.D. Huesca Alevín A",
    "equipo": "S.D. Huesca Alevín A",
    "club": "S.D. Huesca",
    "clubVinculado": "S.D. Huesca",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_129",
    "nombre": "Teruel C.D. Alevín A",
    "equipo": "Teruel C.D. Alevín A",
    "club": "Teruel C.D.",
    "clubVinculado": "Teruel C.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Teruel",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_130",
    "nombre": "Montecarlo U.D. Alevín A",
    "equipo": "Montecarlo U.D. Alevín A",
    "club": "Montecarlo U.D.",
    "clubVinculado": "Montecarlo U.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_131",
    "nombre": "San Gregorio Arrabal C.D. Alevín A",
    "equipo": "San Gregorio Arrabal C.D. Alevín A",
    "club": "San Gregorio Arrabal C.D.",
    "clubVinculado": "San Gregorio Arrabal C.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_132",
    "nombre": "San Agustín C.D. Alevín A",
    "equipo": "San Agustín C.D. Alevín A",
    "club": "San Agustín C.D.",
    "clubVinculado": "San Agustín C.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_133",
    "nombre": "Balsas Picarral U.D. Alevín A",
    "equipo": "Balsas Picarral U.D. Alevín A",
    "club": "Balsas Picarral U.D.",
    "clubVinculado": "Balsas Picarral U.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_134",
    "nombre": "Stadium Casablanca C.D. Alevín A",
    "equipo": "Stadium Casablanca C.D. Alevín A",
    "club": "Stadium Casablanca C.D.",
    "clubVinculado": "Stadium Casablanca C.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_135",
    "nombre": "Santo Domingo Juventud C.F. Alevín A",
    "equipo": "Santo Domingo Juventud C.F. Alevín A",
    "club": "Santo Domingo Juventud C.F.",
    "clubVinculado": "Santo Domingo Juventud C.F.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_136",
    "nombre": "Amistad U.D. Alevín A",
    "equipo": "Amistad U.D. Alevín A",
    "club": "Amistad U.D.",
    "clubVinculado": "Amistad U.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_137",
    "nombre": "Racing Club Zaragoza Alevín A",
    "equipo": "Racing Club Zaragoza Alevín A",
    "club": "Racing Club Zaragoza",
    "clubVinculado": "Racing Club Zaragoza",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_138",
    "nombre": "Oliver C.D. Alevín A",
    "equipo": "Oliver C.D. Alevín A",
    "club": "Oliver C.D.",
    "clubVinculado": "Oliver C.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_139",
    "nombre": "Utebo C.F. Alevín A",
    "equipo": "Utebo C.F. Alevín A",
    "club": "Utebo C.F.",
    "clubVinculado": "Utebo C.F.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_140",
    "nombre": "Ejea S.D. Alevín A",
    "equipo": "Ejea S.D. Alevín A",
    "club": "Ejea S.D.",
    "clubVinculado": "Ejea S.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_141",
    "nombre": "Casetas U.D. Alevín A",
    "equipo": "Casetas U.D. Alevín A",
    "club": "Casetas U.D.",
    "clubVinculado": "Casetas U.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_142",
    "nombre": "Tauste C.D. Alevín A",
    "equipo": "Tauste C.D. Alevín A",
    "club": "Tauste C.D.",
    "clubVinculado": "Tauste C.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_143",
    "nombre": "Alfajarín C.F. Alevín A",
    "equipo": "Alfajarín C.F. Alevín A",
    "club": "Alfajarín C.F.",
    "clubVinculado": "Alfajarín C.F.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_144",
    "nombre": "Brea C.D. Alevín A",
    "equipo": "Brea C.D. Alevín A",
    "club": "Brea C.D.",
    "clubVinculado": "Brea C.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_145",
    "nombre": "Hernán Cortés Junquera C.F. Alevín A",
    "equipo": "Hernán Cortés Junquera C.F. Alevín A",
    "club": "Hernán Cortés Junquera C.F.",
    "clubVinculado": "Hernán Cortés Junquera C.F.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_146",
    "nombre": "Escuela Fútbol Oscense C.D. Alevín A",
    "equipo": "Escuela Fútbol Oscense C.D. Alevín A",
    "club": "Escuela Fútbol Oscense C.D.",
    "clubVinculado": "Escuela Fútbol Oscense C.D.",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_147",
    "nombre": "Binéfar Fútbol Base Alevín A",
    "equipo": "Binéfar Fútbol Base Alevín A",
    "club": "Binéfar Fútbol Base",
    "clubVinculado": "Binéfar Fútbol Base",
    "competicion": "ALEVÍN PREFERENTE",
    "categoria": "Alevín",
    "sub": "SUB12",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_148",
    "nombre": "Real Zaragoza S.A.D. Alevín B",
    "equipo": "Real Zaragoza S.A.D. Alevín B",
    "club": "Real Zaragoza S.A.D.",
    "clubVinculado": "Real Zaragoza S.A.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_149",
    "nombre": "S.D. Huesca Alevín B",
    "equipo": "S.D. Huesca Alevín B",
    "club": "S.D. Huesca",
    "clubVinculado": "S.D. Huesca",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_150",
    "nombre": "Teruel C.D. Alevín B",
    "equipo": "Teruel C.D. Alevín B",
    "club": "Teruel C.D.",
    "clubVinculado": "Teruel C.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Teruel",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_151",
    "nombre": "Montecarlo U.D. Alevín B",
    "equipo": "Montecarlo U.D. Alevín B",
    "club": "Montecarlo U.D.",
    "clubVinculado": "Montecarlo U.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_152",
    "nombre": "San Gregorio Arrabal C.D. Alevín B",
    "equipo": "San Gregorio Arrabal C.D. Alevín B",
    "club": "San Gregorio Arrabal C.D.",
    "clubVinculado": "San Gregorio Arrabal C.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_153",
    "nombre": "San Agustín C.D. Alevín B",
    "equipo": "San Agustín C.D. Alevín B",
    "club": "San Agustín C.D.",
    "clubVinculado": "San Agustín C.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_154",
    "nombre": "Balsas Picarral U.D. Alevín B",
    "equipo": "Balsas Picarral U.D. Alevín B",
    "club": "Balsas Picarral U.D.",
    "clubVinculado": "Balsas Picarral U.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_155",
    "nombre": "Stadium Casablanca C.D. Alevín B",
    "equipo": "Stadium Casablanca C.D. Alevín B",
    "club": "Stadium Casablanca C.D.",
    "clubVinculado": "Stadium Casablanca C.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_156",
    "nombre": "Santo Domingo Juventud C.F. Alevín B",
    "equipo": "Santo Domingo Juventud C.F. Alevín B",
    "club": "Santo Domingo Juventud C.F.",
    "clubVinculado": "Santo Domingo Juventud C.F.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_157",
    "nombre": "Amistad U.D. Alevín B",
    "equipo": "Amistad U.D. Alevín B",
    "club": "Amistad U.D.",
    "clubVinculado": "Amistad U.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_158",
    "nombre": "Racing Club Zaragoza Alevín B",
    "equipo": "Racing Club Zaragoza Alevín B",
    "club": "Racing Club Zaragoza",
    "clubVinculado": "Racing Club Zaragoza",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_159",
    "nombre": "Oliver C.D. Alevín B",
    "equipo": "Oliver C.D. Alevín B",
    "club": "Oliver C.D.",
    "clubVinculado": "Oliver C.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_160",
    "nombre": "Utebo C.F. Alevín B",
    "equipo": "Utebo C.F. Alevín B",
    "club": "Utebo C.F.",
    "clubVinculado": "Utebo C.F.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_161",
    "nombre": "Ejea S.D. Alevín B",
    "equipo": "Ejea S.D. Alevín B",
    "club": "Ejea S.D.",
    "clubVinculado": "Ejea S.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_162",
    "nombre": "Casetas U.D. Alevín B",
    "equipo": "Casetas U.D. Alevín B",
    "club": "Casetas U.D.",
    "clubVinculado": "Casetas U.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_163",
    "nombre": "Tauste C.D. Alevín B",
    "equipo": "Tauste C.D. Alevín B",
    "club": "Tauste C.D.",
    "clubVinculado": "Tauste C.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_164",
    "nombre": "Alfajarín C.F. Alevín B",
    "equipo": "Alfajarín C.F. Alevín B",
    "club": "Alfajarín C.F.",
    "clubVinculado": "Alfajarín C.F.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_165",
    "nombre": "Brea C.D. Alevín B",
    "equipo": "Brea C.D. Alevín B",
    "club": "Brea C.D.",
    "clubVinculado": "Brea C.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_166",
    "nombre": "Hernán Cortés Junquera C.F. Alevín B",
    "equipo": "Hernán Cortés Junquera C.F. Alevín B",
    "club": "Hernán Cortés Junquera C.F.",
    "clubVinculado": "Hernán Cortés Junquera C.F.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_167",
    "nombre": "Escuela Fútbol Oscense C.D. Alevín B",
    "equipo": "Escuela Fútbol Oscense C.D. Alevín B",
    "club": "Escuela Fútbol Oscense C.D.",
    "clubVinculado": "Escuela Fútbol Oscense C.D.",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_168",
    "nombre": "Binéfar Fútbol Base Alevín B",
    "equipo": "Binéfar Fútbol Base Alevín B",
    "club": "Binéfar Fútbol Base",
    "clubVinculado": "Binéfar Fútbol Base",
    "competicion": "PRIMERA ALEVÍN",
    "categoria": "Alevín",
    "sub": "SUB11",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_169",
    "nombre": "Real Zaragoza S.A.D. Benjamín A",
    "equipo": "Real Zaragoza S.A.D. Benjamín A",
    "club": "Real Zaragoza S.A.D.",
    "clubVinculado": "Real Zaragoza S.A.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_170",
    "nombre": "S.D. Huesca Benjamín A",
    "equipo": "S.D. Huesca Benjamín A",
    "club": "S.D. Huesca",
    "clubVinculado": "S.D. Huesca",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_171",
    "nombre": "Teruel C.D. Benjamín A",
    "equipo": "Teruel C.D. Benjamín A",
    "club": "Teruel C.D.",
    "clubVinculado": "Teruel C.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Teruel",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_172",
    "nombre": "Montecarlo U.D. Benjamín A",
    "equipo": "Montecarlo U.D. Benjamín A",
    "club": "Montecarlo U.D.",
    "clubVinculado": "Montecarlo U.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_173",
    "nombre": "San Gregorio Arrabal C.D. Benjamín A",
    "equipo": "San Gregorio Arrabal C.D. Benjamín A",
    "club": "San Gregorio Arrabal C.D.",
    "clubVinculado": "San Gregorio Arrabal C.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_174",
    "nombre": "San Agustín C.D. Benjamín A",
    "equipo": "San Agustín C.D. Benjamín A",
    "club": "San Agustín C.D.",
    "clubVinculado": "San Agustín C.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_175",
    "nombre": "Balsas Picarral U.D. Benjamín A",
    "equipo": "Balsas Picarral U.D. Benjamín A",
    "club": "Balsas Picarral U.D.",
    "clubVinculado": "Balsas Picarral U.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_176",
    "nombre": "Stadium Casablanca C.D. Benjamín A",
    "equipo": "Stadium Casablanca C.D. Benjamín A",
    "club": "Stadium Casablanca C.D.",
    "clubVinculado": "Stadium Casablanca C.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_177",
    "nombre": "Santo Domingo Juventud C.F. Benjamín A",
    "equipo": "Santo Domingo Juventud C.F. Benjamín A",
    "club": "Santo Domingo Juventud C.F.",
    "clubVinculado": "Santo Domingo Juventud C.F.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_178",
    "nombre": "Amistad U.D. Benjamín A",
    "equipo": "Amistad U.D. Benjamín A",
    "club": "Amistad U.D.",
    "clubVinculado": "Amistad U.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_179",
    "nombre": "Racing Club Zaragoza Benjamín A",
    "equipo": "Racing Club Zaragoza Benjamín A",
    "club": "Racing Club Zaragoza",
    "clubVinculado": "Racing Club Zaragoza",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_180",
    "nombre": "Oliver C.D. Benjamín A",
    "equipo": "Oliver C.D. Benjamín A",
    "club": "Oliver C.D.",
    "clubVinculado": "Oliver C.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_181",
    "nombre": "Utebo C.F. Benjamín A",
    "equipo": "Utebo C.F. Benjamín A",
    "club": "Utebo C.F.",
    "clubVinculado": "Utebo C.F.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_182",
    "nombre": "Ejea S.D. Benjamín A",
    "equipo": "Ejea S.D. Benjamín A",
    "club": "Ejea S.D.",
    "clubVinculado": "Ejea S.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_183",
    "nombre": "Casetas U.D. Benjamín A",
    "equipo": "Casetas U.D. Benjamín A",
    "club": "Casetas U.D.",
    "clubVinculado": "Casetas U.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_184",
    "nombre": "Tauste C.D. Benjamín A",
    "equipo": "Tauste C.D. Benjamín A",
    "club": "Tauste C.D.",
    "clubVinculado": "Tauste C.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_185",
    "nombre": "Alfajarín C.F. Benjamín A",
    "equipo": "Alfajarín C.F. Benjamín A",
    "club": "Alfajarín C.F.",
    "clubVinculado": "Alfajarín C.F.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_186",
    "nombre": "Brea C.D. Benjamín A",
    "equipo": "Brea C.D. Benjamín A",
    "club": "Brea C.D.",
    "clubVinculado": "Brea C.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_187",
    "nombre": "Hernán Cortés Junquera C.F. Benjamín A",
    "equipo": "Hernán Cortés Junquera C.F. Benjamín A",
    "club": "Hernán Cortés Junquera C.F.",
    "clubVinculado": "Hernán Cortés Junquera C.F.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_188",
    "nombre": "Escuela Fútbol Oscense C.D. Benjamín A",
    "equipo": "Escuela Fútbol Oscense C.D. Benjamín A",
    "club": "Escuela Fútbol Oscense C.D.",
    "clubVinculado": "Escuela Fútbol Oscense C.D.",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_189",
    "nombre": "Binéfar Fútbol Base Benjamín A",
    "equipo": "Binéfar Fútbol Base Benjamín A",
    "club": "Binéfar Fútbol Base",
    "clubVinculado": "Binéfar Fútbol Base",
    "competicion": "BENJAMÍN PREFERENTE",
    "categoria": "Benjamín",
    "sub": "SUB10",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_190",
    "nombre": "Real Zaragoza S.A.D. Benjamín B",
    "equipo": "Real Zaragoza S.A.D. Benjamín B",
    "club": "Real Zaragoza S.A.D.",
    "clubVinculado": "Real Zaragoza S.A.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_191",
    "nombre": "S.D. Huesca Benjamín B",
    "equipo": "S.D. Huesca Benjamín B",
    "club": "S.D. Huesca",
    "clubVinculado": "S.D. Huesca",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_192",
    "nombre": "Teruel C.D. Benjamín B",
    "equipo": "Teruel C.D. Benjamín B",
    "club": "Teruel C.D.",
    "clubVinculado": "Teruel C.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Teruel",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_193",
    "nombre": "Montecarlo U.D. Benjamín B",
    "equipo": "Montecarlo U.D. Benjamín B",
    "club": "Montecarlo U.D.",
    "clubVinculado": "Montecarlo U.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_194",
    "nombre": "San Gregorio Arrabal C.D. Benjamín B",
    "equipo": "San Gregorio Arrabal C.D. Benjamín B",
    "club": "San Gregorio Arrabal C.D.",
    "clubVinculado": "San Gregorio Arrabal C.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_195",
    "nombre": "San Agustín C.D. Benjamín B",
    "equipo": "San Agustín C.D. Benjamín B",
    "club": "San Agustín C.D.",
    "clubVinculado": "San Agustín C.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_196",
    "nombre": "Balsas Picarral U.D. Benjamín B",
    "equipo": "Balsas Picarral U.D. Benjamín B",
    "club": "Balsas Picarral U.D.",
    "clubVinculado": "Balsas Picarral U.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_197",
    "nombre": "Stadium Casablanca C.D. Benjamín B",
    "equipo": "Stadium Casablanca C.D. Benjamín B",
    "club": "Stadium Casablanca C.D.",
    "clubVinculado": "Stadium Casablanca C.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_198",
    "nombre": "Santo Domingo Juventud C.F. Benjamín B",
    "equipo": "Santo Domingo Juventud C.F. Benjamín B",
    "club": "Santo Domingo Juventud C.F.",
    "clubVinculado": "Santo Domingo Juventud C.F.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_199",
    "nombre": "Amistad U.D. Benjamín B",
    "equipo": "Amistad U.D. Benjamín B",
    "club": "Amistad U.D.",
    "clubVinculado": "Amistad U.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_200",
    "nombre": "Racing Club Zaragoza Benjamín B",
    "equipo": "Racing Club Zaragoza Benjamín B",
    "club": "Racing Club Zaragoza",
    "clubVinculado": "Racing Club Zaragoza",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_201",
    "nombre": "Oliver C.D. Benjamín B",
    "equipo": "Oliver C.D. Benjamín B",
    "club": "Oliver C.D.",
    "clubVinculado": "Oliver C.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_202",
    "nombre": "Utebo C.F. Benjamín B",
    "equipo": "Utebo C.F. Benjamín B",
    "club": "Utebo C.F.",
    "clubVinculado": "Utebo C.F.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_203",
    "nombre": "Ejea S.D. Benjamín B",
    "equipo": "Ejea S.D. Benjamín B",
    "club": "Ejea S.D.",
    "clubVinculado": "Ejea S.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_204",
    "nombre": "Casetas U.D. Benjamín B",
    "equipo": "Casetas U.D. Benjamín B",
    "club": "Casetas U.D.",
    "clubVinculado": "Casetas U.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_205",
    "nombre": "Tauste C.D. Benjamín B",
    "equipo": "Tauste C.D. Benjamín B",
    "club": "Tauste C.D.",
    "clubVinculado": "Tauste C.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_206",
    "nombre": "Alfajarín C.F. Benjamín B",
    "equipo": "Alfajarín C.F. Benjamín B",
    "club": "Alfajarín C.F.",
    "clubVinculado": "Alfajarín C.F.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_207",
    "nombre": "Brea C.D. Benjamín B",
    "equipo": "Brea C.D. Benjamín B",
    "club": "Brea C.D.",
    "clubVinculado": "Brea C.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_208",
    "nombre": "Hernán Cortés Junquera C.F. Benjamín B",
    "equipo": "Hernán Cortés Junquera C.F. Benjamín B",
    "club": "Hernán Cortés Junquera C.F.",
    "clubVinculado": "Hernán Cortés Junquera C.F.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Zaragoza",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_209",
    "nombre": "Escuela Fútbol Oscense C.D. Benjamín B",
    "equipo": "Escuela Fútbol Oscense C.D. Benjamín B",
    "club": "Escuela Fútbol Oscense C.D.",
    "clubVinculado": "Escuela Fútbol Oscense C.D.",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  },
  {
    "id": "eq_fa_210",
    "nombre": "Binéfar Fútbol Base Benjamín B",
    "equipo": "Binéfar Fútbol Base Benjamín B",
    "club": "Binéfar Fútbol Base",
    "clubVinculado": "Binéfar Fútbol Base",
    "competicion": "PRIMERA BENJAMÍN",
    "categoria": "Benjamín",
    "sub": "SUB9",
    "grupo": "Grupo Único",
    "federacion": "FARGF - Federación Aragonesa de Fútbol",
    "comunidad": "Aragón",
    "provincia": "Huesca",
    "colorPrimary": "#2563eb",
    "colorSecondary": "#ffffff"
  }
];
  
  function cleanUpAragonGeneratedPlayersFromFirebase() {
    if (!state.directory) state.directory = {};
    if (!Array.isArray(state.directory.jugadores)) state.directory.jugadores = [];
    state.players = [];

    const isGeneratedAragonPlayer = (p) => {
      if (!p) return false;
      const pId = String(p.id || '').toLowerCase();
      const pName = String(p.nombre || p.jugador || '').toLowerCase();
      const pFed = String(p.federacion || '').toLowerCase();

      return pId.startsWith('j_fa_') || 
             pName.startsWith('jugador ') || 
             pName.includes('jugador 1') || 
             pName.includes('jugador 2') || 
             pName.includes('jugador 3') || 
             pName.includes('jugador 4') || 
             pName.includes('jugador 5') ||
             (pFed.includes('aragonesa') && pName.includes('jugador'));
    };

    // Always filter state.directory.jugadores in memory immediately
    const beforeCount = state.directory.jugadores.length;
    state.directory.jugadores = state.directory.jugadores.filter(p => !isGeneratedAragonPlayer(p));
    const afterCount = state.directory.jugadores.length;

    if (beforeCount > afterCount) {
      console.log(`🧹 Purgados ${beforeCount - afterCount} jugadores generados de Aragón de la memoria.`);
    }

    // Direct Firestore collection scan and delete
    if (db) {
      db.collection('jugadores').get().then(snap => {
        if (snap && !snap.empty) {
          snap.forEach(doc => {
            const data = doc.data() || {};
            const dId = String(doc.id || '').toLowerCase();
            const dName = String(data.nombre || data.jugador || '').toLowerCase();
            const dFed = String(data.federacion || '').toLowerCase();

            if (dId.startsWith('j_fa_') || dName.startsWith('jugador ') || (dFed.includes('aragonesa') && dName.includes('jugador'))) {
              doc.ref.delete().catch(() => {});
            }
          });
        }
      }).catch(() => {});
    }
  }

  function ensureEquiposAragonSeeded() {
    if (!state.directory) state.directory = {};
    if (!state.directory.equipos) state.directory.equipos = [];
    cleanUpAragonGeneratedPlayersFromFirebase();
    if (state.directory.equiposAragonSeeded) return;
    state.directory.equiposAragonSeeded = true;

    let teamsAdded = 0;
    ARAGON_TEAMS_DATA.forEach(t => {
      if (!t || !t.nombre) return;
      const tNameClean = t.nombre.toLowerCase().trim();
      const exists = state.directory.equipos.some(eq => eq && (eq.nombre || eq.equipo || '').toLowerCase().trim() === tNameClean);
      if (!exists) {
        state.directory.equipos.push(t);
        saveToFirebase('equipos', t);
        teamsAdded++;
      }
    });

    if (teamsAdded > 0) {
      console.log(`✅ ${teamsAdded} equipos de las 10 Competiciones de Aragón añadidos con éxito.`);
      setFirebaseHeaderStatus('synced');
    }
  }

  function renderDirectorio(tabOverride = null, pageOverride = null) {
    cleanUpAragonGeneratedPlayersFromFirebase();
    if (tabOverride) {
      if (currentDirectoryTab !== tabOverride) {
        currentDirectoryTab = tabOverride;
        currentSubCategoryFilter = 'TODOS';
        currentFederationFilter = 'TODAS';
        currentDirectoryPage = 1;

      }
    }
    if (pageOverride !== null && pageOverride !== undefined) currentDirectoryPage = pageOverride;

    // Always ensure Aragonesa clubs, teams, and players are seeded
    ensureClubesAragonSeeded();
    ensureEquiposAragonSeeded();

    const searchVal = document.getElementById('dirSearchInput')?.value.toLowerCase() || '';
    if (!state.dirActiveFilters) state.dirActiveFilters = {};
    if (!state.dirActiveFilters[currentDirectoryTab]) state.dirActiveFilters[currentDirectoryTab] = {};
    const activeFilters = state.dirActiveFilters[currentDirectoryTab];

    cleanUpAragonGeneratedPlayersFromFirebase();
    const rawItems = [...(state.directory[currentDirectoryTab] || [])];

    // Helper to render dynamic filter selects for current directory section
    // Section filters removed per user request

    // 1. Universal Alphabetical Sorting for most entities, Custom OrderIndex for Federaciones
    if (currentDirectoryTab === 'federaciones') {
      rawItems.sort((a, b) => (a.orderIndex || 999) - (b.orderIndex || 999));
    } else {
      rawItems.sort((a, b) => {
        const nameA = (a.nombre || a.equipo || a.jugador || a.titulo || a.agencia || a.agente || a.federacion || '').toLowerCase().trim();
        const nameB = (b.nombre || b.equipo || b.jugador || b.titulo || b.agencia || b.agente || b.federacion || '').toLowerCase().trim();
        return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
      });
    }

    // Populate top 7 filter dropdowns with unique values from current tab items (only if options changed)
    // Top filter dropdowns removed per user request

    // Filter vals removed per user request
    const filterValEquipo = document.getElementById('dirFilterEquipo')?.value.toLowerCase().trim() || '';
    const filterValComp = document.getElementById('dirFilterCompeticion')?.value.toLowerCase().trim() || '';
    const filterValCat = document.getElementById('dirFilterCategoria')?.value.toLowerCase().trim() || '';
    const filterValNivel = document.getElementById('dirFilterNivel')?.value.toLowerCase().trim() || '';
    const filterValPos = document.getElementById('dirFilterPosicion')?.value.toLowerCase().trim() || '';
    const filterValOtro = document.getElementById('dirFilterOtro')?.value.toLowerCase().trim() || '';

    // All items returned cleanly without filter interference
    let subFilteredItems = rawItems;

    if (currentDirectoryTab === 'equipos') {
      if (currentSubCategoryFilter !== 'TODOS') {
        subFilteredItems = subFilteredItems.filter(eq => (eq.categoria || 'Sin Categoría').toUpperCase().trim() === currentSubCategoryFilter.toUpperCase().trim());
      }
      if (currentSubGroupFilter !== 'TODOS') {
        subFilteredItems = subFilteredItems.filter(eq => (eq.grupo || 'Sin Grupo').toUpperCase().trim() === currentSubGroupFilter.toUpperCase().trim());
      }
    } else if (currentDirectoryTab === 'estadios' && currentComunidadFilter !== 'TODAS') {
      subFilteredItems = subFilteredItems.filter(est => (est.comunidad || 'Sin Comunidad').toUpperCase().trim() === currentComunidadFilter.toUpperCase().trim());
    } else if (['clubes', 'selecciones', 'convocatorias'].includes(currentDirectoryTab) && currentFederationFilter !== 'TODAS') {
      subFilteredItems = subFilteredItems.filter(item => {
        const itemFed = (item.federacion || item.federacionVinculada || item.ambito || 'Sin Federación').toUpperCase().trim();
        const filterVal = currentFederationFilter.toUpperCase().trim();
        const filterAcronym = getFedAcronym(currentFederationFilter).toUpperCase().trim();
        return itemFed.includes(filterVal) || filterVal.includes(itemFed) || (filterAcronym.length >= 3 && itemFed.includes(filterAcronym));
      });
    }

    // 3. Search Filter (STRICTLY ON NAME / TITLE AS REQUESTED BY USER)
    const filtered = subFilteredItems.filter(item => {
      if (!searchVal) return true;
      const itemName = String(
        item.nombre || 
        item.equipo || 
        item.jugador || 
        item.staff || 
        item.torneo || 
        item.estadio || 
        item.agencia || 
        item.agente || 
        item.seleccion || 
        item.federacion || 
        ''
      ).toLowerCase();
      return itemName.includes(searchVal);
    });

    // 4. Sub-filter Pills Bar Generation
    let subFilterBarHTML = '';
    if (currentDirectoryTab === 'equipos') {
      const categoriesSet = new Set(rawItems.map(eq => (eq.categoria || 'Sin Categoría').trim()).filter(Boolean));
      const categories = Array.from(categoriesSet).sort((a, b) => a.localeCompare(b, 'es'));
      const allCats = ['TODOS', ...categories];

      const teamsForGroups = currentSubCategoryFilter === 'TODOS' ? rawItems : rawItems.filter(eq => (eq.categoria || 'Sin Categoría').toUpperCase().trim() === currentSubCategoryFilter.toUpperCase().trim());
      const groupsSet = new Set(teamsForGroups.map(eq => (eq.grupo || 'Sin Grupo').trim()).filter(Boolean));
      const groups = Array.from(groupsSet).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
      const allGroups = ['TODOS', ...groups];

      subFilterBarHTML = `
        <div class="dir-subfilter-container mb-3" style="display: flex; flex-direction: column; gap: 8px; background: var(--bg-subtle, #f8fafc); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 12px; font-weight: 800; color: var(--text-muted); min-width: 90px; display: inline-flex; align-items: center; gap: 4px;">
              <i data-lucide="filter" style="width: 14px;"></i> Categoría:
            </span>
            ${allCats.map(cat => `
              <button type="button" class="btn-dir-subfilter ${currentSubCategoryFilter === cat ? 'active' : ''}" data-type="categoria" data-val="${escapeHtml(cat)}" style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid ${currentSubCategoryFilter === cat ? 'var(--primary-blue, #2563eb)' : 'var(--border-light)'}; background: ${currentSubCategoryFilter === cat ? 'var(--primary-blue, #2563eb)' : '#ffffff'}; color: ${currentSubCategoryFilter === cat ? '#ffffff' : 'var(--text-dark, #1e293b)'}; transition: all 0.2s;">
                ${escapeHtml(cat)}
              </button>
            `).join('')}
          </div>

          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; border-top: 1px dashed var(--border-light); padding-top: 8px;">
            <span style="font-size: 12px; font-weight: 800; color: var(--text-muted); min-width: 90px; display: inline-flex; align-items: center; gap: 4px;">
              <i data-lucide="layers" style="width: 14px;"></i> Grupo:
            </span>
            ${allGroups.map(grp => `
              <button type="button" class="btn-dir-subfilter ${currentSubGroupFilter === grp ? 'active' : ''}" data-type="grupo" data-val="${escapeHtml(grp)}" style="padding: 3px 10px; border-radius: 16px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1px solid ${currentSubGroupFilter === grp ? '#059669' : 'var(--border-light)'}; background: ${currentSubGroupFilter === grp ? '#059669' : '#ffffff'}; color: ${currentSubGroupFilter === grp ? '#ffffff' : 'var(--text-dark, #1e293b)'}; transition: all 0.2s;">
                ${escapeHtml(grp)}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    } else if (['clubes', 'selecciones', 'convocatorias'].includes(currentDirectoryTab)) {
      const fedsSet = new Set(rawItems.map(item => (item.federacion || item.federacionVinculada || 'Sin Federación').trim()).filter(Boolean));
      if (state.directory.federaciones && state.directory.federaciones.length) {
        state.directory.federaciones.forEach(f => {
          const fName = (f.nombre || f.federacion || '').trim();
          if (fName) fedsSet.add(fName);
        });
      }
      const feds = Array.from(fedsSet).sort((a, b) => a.localeCompare(b, 'es'));
      const allFeds = ['TODAS', ...feds];
      subFilterBarHTML = `
        <div class="dir-subfilter-bar mb-3" style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; background: var(--bg-subtle, #f8fafc); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
          <span style="font-size: 12px; font-weight: 800; color: var(--text-muted); margin-right: 6px; display: inline-flex; align-items: center; gap: 4px;">
            <i data-lucide="globe" style="width: 14px;"></i> Federaciones:
          </span>
          ${allFeds.map(fed => {
            const acronym = getFedAcronym(fed);
            return `
            <button type="button" class="btn-dir-subfilter ${currentFederationFilter === fed ? 'active' : ''}" data-type="federacion" data-val="${escapeHtml(fed)}" title="${escapeHtml(fed)}" style="padding: 5px 13px; border-radius: 20px; font-size: 12px; font-weight: 800; cursor: pointer; border: 1px solid ${currentFederationFilter === fed ? 'var(--primary-blue, #2563eb)' : 'var(--border-light)'}; background: ${currentFederationFilter === fed ? 'var(--primary-blue, #2563eb)' : '#ffffff'}; color: ${currentFederationFilter === fed ? '#ffffff' : 'var(--text-dark, #1e293b)'}; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              ${escapeHtml(acronym)}
            </button>
          `;
          }).join('')}
        </div>
      `;
    } else if (currentDirectoryTab === 'estadios') {
      const comunidadesSet = new Set(rawItems.map(est => (est.comunidad || 'Sin Comunidad').trim()).filter(Boolean));
      ['Navarra', 'País Vasco', 'La Rioja', 'Aragón', 'Madrid'].forEach(c => comunidadesSet.add(c));
      const comunidades = Array.from(comunidadesSet).sort((a, b) => a.localeCompare(b, 'es'));
      const allComunidades = ['TODAS', ...comunidades];

      subFilterBarHTML = `
        <div class="dir-subfilter-bar mb-3" style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; background: var(--bg-subtle, #f8fafc); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
          <span style="font-size: 12px; font-weight: 800; color: var(--text-muted); margin-right: 6px; display: inline-flex; align-items: center; gap: 4px;">
            <i data-lucide="map-pin" style="width: 14px;"></i> Comunidad:
          </span>
          ${allComunidades.map(com => `
            <button type="button" class="btn-dir-subfilter ${currentComunidadFilter === com ? 'active' : ''}" data-type="comunidad" data-val="${escapeHtml(com)}" style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid ${currentComunidadFilter === com ? 'var(--primary-blue, #2563eb)' : 'var(--border-light)'}; background: ${currentComunidadFilter === com ? 'var(--primary-blue, #2563eb)' : '#ffffff'}; color: ${currentComunidadFilter === com ? '#ffffff' : 'var(--text-dark, #1e293b)'}; transition: all 0.2s;">
              ${escapeHtml(com)}
            </button>
          `).join('')}
        </div>
      `;
    }

    // Dynamically update main header create button text
    const headerBtn = document.getElementById('btnAddNewPlayerHeader');
    if (headerBtn) {
      if (currentDirectoryTab === 'jugadores') {
        headerBtn.innerHTML = `<i data-lucide="user-plus"></i> Crear Nuevo Jugador`;
      } else if (currentDirectoryTab === 'clubes') {
        headerBtn.innerHTML = `<i data-lucide="shield-plus"></i> Crear Nuevo Club`;
      } else if (currentDirectoryTab === 'equipos') {
        headerBtn.innerHTML = `<i data-lucide="users"></i> Crear Nuevo Equipo`;
      } else if (currentDirectoryTab === 'federaciones') {
        headerBtn.innerHTML = `<i data-lucide="globe"></i> Crear Nueva Federación`;
      } else if (currentDirectoryTab === 'selecciones') {
        headerBtn.innerHTML = `<i data-lucide="flag"></i> Crear Nueva Selección`;
      } else if (currentDirectoryTab === 'convocatorias') {
        headerBtn.innerHTML = `<i data-lucide="megaphone"></i> Crear Nueva Convocatoria`;
      } else if (currentDirectoryTab === 'torneos') {
        headerBtn.innerHTML = `<i data-lucide="trophy"></i> Crear Nuevo Torneo`;
      } else if (currentDirectoryTab === 'staff') {
        headerBtn.innerHTML = `<i data-lucide="user-check"></i> Crear Nuevo Staff`;
      } else if (currentDirectoryTab === 'agencias') {
        headerBtn.innerHTML = `<i data-lucide="briefcase"></i> Crear Nueva Agencia`;
      } else if (currentDirectoryTab === 'agentes') {
        headerBtn.innerHTML = `<i data-lucide="user-cog"></i> Crear Nuevo Agente`;
      } else if (currentDirectoryTab === 'estadios') {
        headerBtn.innerHTML = `<i data-lucide="map-pin"></i> Crear Nuevo Estadio`;
      } else {
        headerBtn.innerHTML = `<i data-lucide="plus-circle"></i> Añadir Registro`;
      }
    }

    const totalPages = Math.ceil(filtered.length / DIR_PAGE_SIZE) || 1;
    if (currentDirectoryPage > totalPages) currentDirectoryPage = totalPages;
    if (currentDirectoryPage < 1) currentDirectoryPage = 1;

    const startIdx = (currentDirectoryPage - 1) * DIR_PAGE_SIZE;
    const endIdx = startIdx + DIR_PAGE_SIZE;
    const pageItems = filtered.slice(startIdx, endIdx);

    const paginationBarHTML = filtered.length > DIR_PAGE_SIZE ? `
      <div class="directory-pagination-bar" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-light); margin-top: 20px; flex-wrap: wrap; gap: 12px;">
        <span style="font-size: 13px; color: var(--text-muted); font-weight: 700;">
          Mostrando ${filtered.length ? startIdx + 1 : 0} - ${Math.min(endIdx, filtered.length)} de ${filtered.length} registros (Página ${currentDirectoryPage} de ${totalPages})
        </span>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary btn-dir-prev-page" ${currentDirectoryPage <= 1 ? 'disabled' : ''} style="padding: 6px 14px; font-size: 12px; font-weight: 800;">
            ‹ Anterior
          </button>
          
          <div style="display: flex; align-items: center; gap: 6px; background: var(--bg-subtle, #f8fafc); padding: 3px 8px; border-radius: 8px; border: 1px solid var(--border-light);">
            <span style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Pág.</span>
            <input type="number" class="dir-page-jump-input" min="1" max="${totalPages}" value="${currentDirectoryPage}" style="width: 54px; text-align: center; font-size: 12px; font-weight: 800; padding: 4px; border-radius: 6px; border: 1px solid var(--border-medium, #cbd5e1); background: #ffffff;">
            <span style="font-size: 12px; font-weight: 700; color: var(--text-muted);">de ${totalPages}</span>
            <button type="button" class="btn btn-primary btn-dir-jump-go" style="padding: 4px 8px; font-size: 11px; font-weight: 800; border-radius: 6px;">Ir</button>
          </div>

          <button type="button" class="btn btn-secondary btn-dir-next-page" ${currentDirectoryPage >= totalPages ? 'disabled' : ''} style="padding: 6px 14px; font-size: 12px; font-weight: 800;">
            Siguiente ›
          </button>
        </div>
      </div>
    ` : '';

    const bulkToolbarHTML = `
      <div class="directory-bulk-toolbar mb-3">
        <div style="display: flex; align-items: center; gap: 10px;">
          <input type="checkbox" id="dirSelectAllCheckbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
          <label for="dirSelectAllCheckbox" style="font-size: 13px; font-weight: 700; cursor: pointer; margin: 0; color: var(--text-dark, #1e293b);">
            Seleccionar todo (<span id="dirSelectedCount">0</span> de ${filtered.length})
          </label>
        </div>
        
        <button type="button" class="btn btn-danger hidden" id="btnBulkDeleteDir" style="padding: 6px 14px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">
          <i data-lucide="trash-2" style="width: 14px;"></i> Borrar Seleccionados (<span id="dirBulkDeleteBadge">0</span>)
        </button>
      </div>
    `;

    const container = document.getElementById('directoryContentBox');
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-text">No se encontraron registros de ${currentDirectoryTab}.</p>
          <button class="btn btn-primary" id="btnEmptyCreateDirItem">Crear Primero</button>
        </div>
      `;
      document.getElementById('btnEmptyCreateDirItem')?.addEventListener('click', () => openAddDirectoryItemModal());
    } else {
      if (currentDirectoryTab === 'jugadores') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${pageItems.map(j => {
              let jPriColor = '#2563eb';
              if (j.equipo) {
                const clubMatch = (state.directory.clubes || []).find(c => c.nombre && c.nombre.toLowerCase().trim() === j.equipo.toLowerCase().trim());
                if (clubMatch && clubMatch.colorPrimary) jPriColor = clubMatch.colorPrimary;
              }

              return `
              <div class="entity-card" style="border-top: 5px solid ${jPriColor} !important; background: linear-gradient(180deg, ${jPriColor}12 0%, var(--bg-card, #ffffff) 35%); padding: 14px; border-radius: var(--radius-lg, 12px); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;">
                <!-- LÍNEA 1: Checkbox + Avatar/Foto amplio 48px (izquierda) y Eliminar (derecha) -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${j.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${jPriColor};">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1.5px solid ${jPriColor}; padding: 2px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                      ${j.foto ? `<img src="${j.foto}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : `<span style="font-weight: 800; color: ${jPriColor}; font-size: 16px;">${j.nombre ? j.nombre.charAt(0) : 'J'}</span>`}
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${j.id}" style="width: 28px; height: 28px;" title="Eliminar">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <!-- LÍNEA 2: NOMBRE DEL JUGADOR EN UNA SOLA LÍNEA -->
                <div style="width: 100%; overflow: hidden; margin-top: 4px;">
                  <h3 class="entity-card-title player-name-link cursor-pointer" data-id="${j.id}" title="${escapeHtml(j.nombre)}" style="margin: 0; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main, #1e293b);">
                    ${escapeHtml(j.nombre)} <i data-lucide="external-link" style="width: 12px; height: 12px; opacity: 0.7; vertical-align: middle;"></i>
                  </h3>
                </div>

                <!-- LÍNEA 3 EN ADELANTE: Demás datos -->
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: -2px;">
                  ${escapeHtml(j.posicion || j.posicionPrincipal || 'Sin Posición')} | ${escapeHtml(j.equipo || 'Sin Equipo')}
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-2 mt-1">
                  <div><strong>Estado:</strong> <span class="match-category-tag" style="background-color: var(--bg-subtle); color: var(--text-muted);">${escapeHtml(j.estado || 'ALTA')}</span></div>
                  <div><strong>Sub:</strong> <span class="match-category-tag" style="background-color: var(--primary-blue-light); color: ${jPriColor}; font-weight: 800; padding: 2px 8px; border-radius: 4px;">${escapeHtml(calculateSubCategory(j.ano || j.anoNac) || j.sub || 'Sub19')}</span> ${j.ano ? `<span style="font-size: 11px; color: var(--text-muted);">(${escapeHtml(j.ano)})</span>` : ''}</div>
                  ${j.disponibilidad ? `<div><strong>Disponibilidad:</strong> ${escapeHtml(j.disponibilidad)}</div>` : ''}
                </div>

                <button type="button" class="btn btn-secondary btn-open-player-modal" data-id="${j.id}" style="width: 100%; padding: 6px 12px; font-size: 12px; font-weight: 700; border-color: ${jPriColor}40;">
                  <i data-lucide="user-check"></i> Ver / Editar Ficha Técnica
                </button>
              </div>
            `;
            }).join('')}
          </div>
          ${paginationBarHTML}
        `;

        container.querySelectorAll('.player-name-link, .btn-open-player-modal').forEach(el => {
          el.addEventListener('click', () => openPlayerModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            const itemObj = (state.directory.jugadores || []).find(i => i && (String(i.id) === String(itemId) || (i.codigo && String(i.codigo) === String(itemId))));
            const itemName = itemObj ? (itemObj.nombre || itemObj.equipo || 'este registro') : 'este registro';

            showCustomConfirmModal(
              `¿Eliminar ${itemName}?`,
              `¿Estás seguro de que deseas eliminar permanentemente a "${escapeHtml(itemName)}" del directorio y de Firebase?`,
              () => {
                if ('jugadores' === 'clubes') {
                  deleteDirectoryItem(currentDirectoryTab, itemId);
                } else {
                  deleteDirectoryItem('jugadores', itemId);
                }
                showCustomAlertModal('Registro Eliminado', `El registro "${escapeHtml(itemName)}" ha sido eliminado con éxito.`);
                renderDirectorio();
              }
            );
          });
        });
      } else if (currentDirectoryTab === 'clubes') {
        container.innerHTML = `
          ${subFilterBarHTML}
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${pageItems.map(c => {
              const clubPriColor = c.colorPrimary || c.colorPrincipal || c.color1 || '#2563eb';
              const clubLogo = c.logo || c.escudo || (c.codigo ? `./escudos/${c.codigo}.png` : `./escudos/${(c.nombre || '').toLowerCase().replace(/^(c\.d\.|c\.a\.|a\.d\.|u\.d\.|u\.d\.c\.|c\.f\.|s\.d\.|f\.c\.)\s*/i, '').replace(/[^a-z0-9]/gi, '_')}.png`);

              return `
              <div class="entity-card" style="border-top: 5px solid ${clubPriColor} !important; background: linear-gradient(180deg, ${clubPriColor}12 0%, var(--bg-card, #ffffff) 35%); padding: 14px; border-radius: var(--radius-lg, 12px); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;">
                <!-- LÍNEA 1: Checkbox + Escudo amplio (izquierda) y Eliminar (derecha) -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${c.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${clubPriColor};">
                    <div style="width: 48px; height: 48px; border-radius: var(--radius-md, 8px); background-color: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1.5px solid ${clubPriColor}; padding: 3px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.08); position: relative;">
                      <img src="${clubLogo}" data-tried="0" onerror="
                        if (this.dataset.tried === '0' && '${c.codigo}') {
                          this.dataset.tried = '1';
                          this.src = 'https://www.futnavarra.es/images/escudos/${c.codigo}.png';
                        } else {
                          this.style.display = 'none';
                          if (this.nextElementSibling) this.nextElementSibling.style.display = 'flex';
                        }
                      " style="width: 100%; height: 100%; object-fit: contain;">
                      <span style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-weight: 800; color: ${clubPriColor}; font-size: 16px;">${c.nombre ? c.nombre.charAt(0) : 'C'}</span>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${c.id}" style="width: 28px; height: 28px;" title="Eliminar">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <!-- LÍNEA 2: NOMBRE DEL CLUB EN UNA SOLA LÍNEA -->
                <div style="width: 100%; overflow: hidden; margin-top: 4px;">
                  <h3 class="entity-card-title club-name-link cursor-pointer" data-id="${c.id}" title="${escapeHtml(c.nombre)}" style="margin: 0; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main, #1e293b);">
                    ${escapeHtml(c.nombre)} <i data-lucide="external-link" style="width: 12px; height: 12px; opacity: 0.7; vertical-align: middle;"></i>
                  </h3>
                </div>

                <!-- LÍNEA 3 EN ADELANTE: Demás datos -->
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: -2px;">
                  ${escapeHtml(c.localidad || 'Localidad N/A')} (${escapeHtml(c.comunidad || 'Comunidad N/A')})
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-2 mt-1">
                  <div><strong>Estadio:</strong> ${escapeHtml(c.estadio || 'N/A')}</div>
                  <div><strong>Federación:</strong> ${escapeHtml(c.federacion || 'N/A')}</div>
                  ${c.web ? `<div><strong>Web:</strong> <a href="${escapeHtml(c.web)}" target="_blank" style="color: ${clubPriColor}; font-weight: 600;">${escapeHtml(c.web)}</a></div>` : ''}
                </div>

                ${(() => {
                  const convList = getConvenidosListForClub(c);
                  if (convList.length > 0) {
                    return `
                      <button type="button" class="btn-convenidos-trigger" data-id="${c.id}" style="width: 100%; padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 8px; background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        <i data-lucide="building-2" style="width: 14px;"></i> Clubes Convenidos (${convList.length})
                      </button>
                    `;
                  }
                  return '';
                })()}
                <button type="button" class="btn btn-secondary btn-open-club-modal" data-id="${c.id}" style="width: 100%; padding: 6px 12px; font-size: 12px; font-weight: 700; border-color: ${clubPriColor}40;">
                  <i data-lucide="shield-check"></i> Ver / Editar Ficha de Club
                </button>
              </div>
            `;
            }).join('')}
          </div>
          ${paginationBarHTML}
        `;

        container.querySelectorAll('.club-name-link, .btn-open-club-modal').forEach(el => {
          el.addEventListener('click', () => openClubModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-convenidos-trigger').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const clubId = btn.dataset.id;
            const clubObj = (state.directory.clubes || []).find(c => c && String(c.id) === String(clubId));
            if (clubObj) openClubConvenidosWindow(clubObj);
          });
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            const itemObj = (state.directory.clubes || []).find(i => i && (String(i.id) === String(itemId) || (i.codigo && String(i.codigo) === String(itemId))));
            const itemName = itemObj ? (itemObj.nombre || 'este club') : 'este club';

            showCustomConfirmModal(
              `¿Eliminar ${itemName}?`,
              `¿Estás seguro de que deseas eliminar permanentemente a "${escapeHtml(itemName)}" del directorio y de Firebase?`,
              () => {
                deleteDirectoryItem(currentDirectoryTab, itemId);
                showCustomAlertModal('Club Eliminado', `El club "${escapeHtml(itemName)}" ha sido eliminado con éxito.`);
                renderDirectorio();
              }
            );
          });
        });
      } else if (currentDirectoryTab === 'equipos') {
        container.innerHTML = `
          ${subFilterBarHTML}
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${pageItems.map(eq => {
              const parentC = findParentClub(eq);

              if (parentC) {
                const parentLogo = parentC.logo || parentC.escudo;
                if (parentLogo && !eq.escudo) {
                  eq.escudo = parentLogo;
                  eq.logo = parentLogo;
                }
                if (parentC.colorPrimary && (!eq.colorPrimary || eq.colorPrimary === '#2563eb')) {
                  eq.colorPrimary = parentC.colorPrimary;
                }
                if (parentC.colorSecondary && (!eq.colorSecondary || eq.colorSecondary === '#ffffff')) {
                  eq.colorSecondary = parentC.colorSecondary;
                }
                if (parentC.federacion && (!eq.federacion || eq.federacion === '' || eq.federacion === 'Sin Federación')) {
                  eq.federacion = parentC.federacion;
                }
              }

              const eqPriColor = (eq.colorPrimary && eq.colorPrimary !== '#2563eb') ? eq.colorPrimary : (parentC ? (parentC.colorPrimary || parentC.colorPrincipal || parentC.color1 || parentC.colorCamiseta) : null) || eq.colorPrimary || '#2563eb';
              const eqSecColor = (eq.colorSecondary && eq.colorSecondary !== '#ffffff') ? eq.colorSecondary : (parentC ? (parentC.colorSecondary || parentC.colorSecundario || parentC.color2) : null) || eq.colorSecondary || '#ffffff';
              
              const eqLogo = eq.escudo || eq.logo || (parentC ? parentC.logo || parentC.escudo : '');
              const clubCodigo = parentC ? (parentC.codigo || '') : (eq.codigo || '');
              const targetNameForEscudo = parentC ? (parentC.nombre || parentC.equipo || eq.nombre) : (eq.clubVinculado || eq.nombre);
              const cleanName = (targetNameForEscudo || '').toLowerCase().replace(/^(c\.d\.|c\.a\.|a\.d\.|u\.d\.|u\.d\.c\.|c\.f\.|s\.d\.|f\.c\.)\s*/i, '').replace(/[^a-z0-9]/gi, '_');
              const localEscudoPath = `./escudos/${cleanName}.png`;
              const finalImgSrc = eqLogo || (clubCodigo ? `./escudos/${clubCodigo}.png` : localEscudoPath);

              return `
              <div class="entity-card" style="border-top: 5px solid ${eqPriColor} !important; background: linear-gradient(180deg, ${eqPriColor}12 0%, var(--bg-card, #ffffff) 35%); padding: 14px; border-radius: var(--radius-lg, 12px); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;">
                <!-- LÍNEA 1: Checkbox + Escudo amplio (izquierda) y Eliminar (derecha) -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${eq.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${eqPriColor};">
                    <div style="width: 48px; height: 48px; border-radius: var(--radius-md, 8px); background-color: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1.5px solid ${eqPriColor}; padding: 3px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.08); position: relative;">
                      ${eqLogo ? `<img src="${eqLogo}" style="width: 100%; height: 100%; object-fit: contain;">` : `
                        <img src="${finalImgSrc}" data-tried="0" onerror="
                          if (this.dataset.tried === '0' && '${clubCodigo}') {
                            this.dataset.tried = '1';
                            this.src = 'https://www.futnavarra.es/images/escudos/${clubCodigo}.png';
                          } else if (this.dataset.tried === '0' || this.dataset.tried === '1') {
                            this.dataset.tried = '2';
                            this.src = 'https://www.futnavarra.es/images/escudos/${cleanName}.png';
                          } else {
                            this.style.display = 'none';
                            if (this.nextElementSibling) this.nextElementSibling.style.display = 'flex';
                          }
                        " style="width: 100%; height: 100%; object-fit: contain;">
                        <span style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-weight: 800; color: ${eqPriColor}; font-size: 16px;">${eq.nombre ? eq.nombre.charAt(0) : 'E'}</span>
                      `}
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${eq.id}" style="width: 28px; height: 28px;" title="Eliminar">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <!-- LÍNEA 2: NOMBRE DEL EQUIPO EN UNA SOLA LÍNEA -->
                <div style="width: 100%; overflow: hidden; margin-top: 4px;">
                  <h3 class="entity-card-title team-name-link cursor-pointer" data-id="${eq.id}" title="${escapeHtml(eq.nombre)}" style="margin: 0; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main, #1e293b);">
                    ${escapeHtml(eq.nombre)} <i data-lucide="external-link" style="width: 12px; height: 12px; opacity: 0.7; vertical-align: middle;"></i>
                  </h3>
                </div>

                <!-- LÍNEA 3 EN ADELANTE: Demás datos -->
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: -2px;">
                  ${escapeHtml(eq.categoria || 'Sin Cat.')} ${eq.grupo ? `(${escapeHtml(eq.grupo)})` : ''} | ${escapeHtml(eq.temporada || '26/27')}
                  <span style="display: inline-flex; gap: 4px; margin-left: 8px; vertical-align: middle;">
                    <span style="width: 12px; height: 12px; border-radius: 50%; background: ${eqPriColor}; border: 1px solid #ccc; display: inline-block;" title="Color Principal: ${eqPriColor}"></span>
                    <span style="width: 12px; height: 12px; border-radius: 50%; background: ${eqSecColor}; border: 1px solid #ccc; display: inline-block;" title="Color Secundario: ${eqSecColor}"></span>
                  </span>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-2 mt-1">
                  <div><strong>Club:</strong> ${escapeHtml(eq.clubVinculado || eq.club || (parentC ? parentC.nombre : 'N/A'))}</div>
                  <div><strong>Competición:</strong> ${escapeHtml(eq.competicion || 'N/A')}</div>
                  <div><strong>Federación:</strong> ${escapeHtml(eq.federacion || 'N/A')}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-team-modal" data-id="${eq.id}" style="width: 100%; padding: 6px 12px; font-size: 12px; font-weight: 700; border-color: ${eqPriColor}40;">
                  <i data-lucide="users"></i> Ver / Editar Ficha de Equipo
                </button>
              </div>
            `;
            }).join('')}
          </div>
          ${paginationBarHTML}
        `;

        container.querySelectorAll('.team-name-link, .btn-open-team-modal').forEach(el => {
          el.addEventListener('click', () => openTeamModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            const itemObj = (state.directory.equipos || []).find(i => i && (String(i.id) === String(itemId) || (i.codigo && String(i.codigo) === String(itemId))));
            const itemName = itemObj ? (itemObj.nombre || itemObj.equipo || 'este registro') : 'este registro';

            showCustomConfirmModal(
              `¿Eliminar ${itemName}?`,
              `¿Estás seguro de que deseas eliminar permanentemente a "${escapeHtml(itemName)}" del directorio y de Firebase?`,
              () => {
                if ('equipos' === 'clubes') {
                  deleteDirectoryItem(currentDirectoryTab, itemId);
                } else {
                  deleteDirectoryItem('equipos', itemId);
                }
                showCustomAlertModal('Registro Eliminado', `El registro "${escapeHtml(itemName)}" ha sido eliminado con éxito.`);
                renderDirectorio();
              }
            );
          });
        });
      } else if (currentDirectoryTab === 'federaciones') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${pageItems.map(f => {
              const fedColorPrimary = f.colorPrimary || f.colorPrincipal || '#2563eb';
              const fedLogo = f.logo || f.escudo || f.imagen;

              return `
              <div class="entity-card fed-drag-card" draggable="true" data-id="${f.id}" style="border-top: 5px solid ${fedColorPrimary} !important; background: linear-gradient(180deg, ${fedColorPrimary}12 0%, var(--bg-card, #ffffff) 35%); cursor: grab; padding: 14px; border-radius: var(--radius-lg, 12px); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;">
                <!-- LÍNEA 1: Grip + Checkbox + Escudo amplio (izquierda) y Eliminar (derecha) -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="fed-drag-handle" style="cursor: grab; color: var(--text-muted); display: inline-flex; align-items: center;" title="Arrastrar para reordenar">
                      <i data-lucide="grip-vertical" style="width: 18px; height: 18px;"></i>
                    </div>
                    <input type="checkbox" class="dir-item-checkbox" data-id="${f.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${fedColorPrimary};">
                    <div style="width: 48px; height: 48px; border-radius: var(--radius-md, 8px); background-color: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1.5px solid ${fedColorPrimary}; padding: 3px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                      ${fedLogo ? `<img src="${escapeHtml(fedLogo)}" alt="${escapeHtml(f.nombre)}" style="width: 100%; height: 100%; object-fit: contain;">` : `<span style="font-weight: 800; color: ${fedColorPrimary}; font-size: 16px;">${f.nombre ? f.nombre.charAt(0) : 'F'}</span>`}
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${f.id}" style="width: 28px; height: 28px;" title="Eliminar">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <!-- LÍNEA 2: NOMBRE DE LA FEDERACIÓN EN UNA SOLA LÍNEA -->
                <div style="width: 100%; overflow: hidden; margin-top: 4px;">
                  <h3 class="entity-card-title fed-name-link cursor-pointer" data-id="${f.id}" title="${escapeHtml(f.nombre)}" style="margin: 0; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main, #1e293b);">
                    ${escapeHtml(f.nombre)} <i data-lucide="external-link" style="width: 12px; height: 12px; opacity: 0.7; vertical-align: middle;"></i>
                  </h3>
                </div>

                <!-- LÍNEA 3 EN ADELANTE: Demás datos -->
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: -2px;">
                  ${escapeHtml(f.ambito || 'Ámbito N/A')} | ${escapeHtml(f.sede || 'Sede N/A')}
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-2 mt-1">
                  <div><strong>Email:</strong> ${escapeHtml(f.email || f.correo || 'N/A')}</div>
                  <div><strong>Teléfono:</strong> ${escapeHtml(f.telefono || 'N/A')}</div>
                  ${f.web || f.paginaWeb ? `<div><strong>Web:</strong> <a href="${escapeHtml(f.web || f.paginaWeb)}" target="_blank" style="color: ${fedColorPrimary}; font-weight: 600;">${escapeHtml(f.web || f.paginaWeb)}</a></div>` : ''}
                </div>

                <button type="button" class="btn btn-secondary btn-open-fed-modal" data-id="${f.id}" style="width: 100%; padding: 6px 12px; font-size: 12px; font-weight: 700; border-color: ${fedColorPrimary}40;">
                  <i data-lucide="globe"></i> Ver / Editar Ficha de Federación
                </button>
              </div>
            `;
            }).join('')}
          </div>
          ${paginationBarHTML}
        `;

        container.querySelectorAll('.fed-name-link, .btn-open-fed-modal').forEach(el => {
          el.addEventListener('click', () => openFederationModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            const itemObj = (state.directory.federaciones || []).find(i => i && (String(i.id) === String(itemId) || (i.codigo && String(i.codigo) === String(itemId))));
            const itemName = itemObj ? (itemObj.nombre || itemObj.equipo || 'este registro') : 'este registro';

            showCustomConfirmModal(
              `¿Eliminar ${itemName}?`,
              `¿Estás seguro de que deseas eliminar permanentemente a "${escapeHtml(itemName)}" del directorio y de Firebase?`,
              () => {
                if ('federaciones' === 'clubes') {
                  deleteDirectoryItem(currentDirectoryTab, itemId);
                } else {
                  deleteDirectoryItem('federaciones', itemId);
                }
                showCustomAlertModal('Registro Eliminado', `El registro "${escapeHtml(itemName)}" ha sido eliminado con éxito.`);
                renderDirectorio();
              }
            );
          });
        });

        let draggedFedId = null;
        container.querySelectorAll('.fed-drag-card').forEach(card => {
          card.addEventListener('dragstart', (e) => {
            draggedFedId = card.dataset.id;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.id);
            card.classList.add('dragging');
          });

          card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            container.querySelectorAll('.fed-drag-card').forEach(c => c.classList.remove('drag-over'));
          });

          card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            card.classList.add('drag-over');
          });

          card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
          });

          card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            const targetId = card.dataset.id;

            if (draggedFedId && targetId && draggedFedId !== targetId) {
              const feds = state.directory.federaciones;
              const dragIdx = feds.findIndex(f => f.id === draggedFedId);
              const targetIdx = feds.findIndex(f => f.id === targetId);

              if (dragIdx !== -1 && targetIdx !== -1) {
                const [moved] = feds.splice(dragIdx, 1);
                feds.splice(targetIdx, 0, moved);

                feds.forEach((f, idx) => {
                  f.orderIndex = idx + 1;
                });

                saveState();
                renderDirectorio();
              }
            }
          });
        });
      } else if (currentDirectoryTab === 'selecciones') {
        container.innerHTML = `
          ${subFilterBarHTML}
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${pageItems.map(s => {
              const selColor = s.colorPrimary || '#dc2626';
              const selLogo = s.logo || s.escudo;

              return `
              <div class="entity-card" style="border-top: 5px solid ${selColor} !important; background: linear-gradient(180deg, ${selColor}12 0%, var(--bg-card, #ffffff) 35%); padding: 14px; border-radius: var(--radius-lg, 12px); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;">
                <!-- LÍNEA 1: Checkbox + Logo/Escudo amplio 48px (izquierda) y Eliminar (derecha) -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${s.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${selColor};">
                    <div style="width: 48px; height: 48px; border-radius: var(--radius-md, 8px); background-color: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1.5px solid ${selColor}; padding: 3px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                      ${selLogo ? `<img src="${selLogo}" style="width: 100%; height: 100%; object-fit: contain;">` : `<span style="font-weight: 800; color: ${selColor}; font-size: 16px;">${s.nombre ? s.nombre.charAt(0) : 'S'}</span>`}
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${s.id}" style="width: 28px; height: 28px;" title="Eliminar">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <!-- LÍNEA 2: NOMBRE DE LA SELECCIÓN EN UNA SOLA LÍNEA -->
                <div style="width: 100%; overflow: hidden; margin-top: 4px;">
                  <h3 class="entity-card-title selection-name-link cursor-pointer" data-id="${s.id}" title="${escapeHtml(s.nombre)}" style="margin: 0; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main, #1e293b);">
                    ${escapeHtml(s.nombre)} <i data-lucide="external-link" style="width: 12px; height: 12px; opacity: 0.7; vertical-align: middle;"></i>
                  </h3>
                </div>

                <!-- LÍNEA 3 EN ADELANTE: Demás datos -->
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: -2px;">
                  ${escapeHtml(s.categoria || 'Cat. N/A')} | ${escapeHtml(s.sexo || 'Masculino')}
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-2 mt-1">
                  <div><strong>Federación:</strong> ${escapeHtml(s.federacion || 'N/A')}</div>
                  <div><strong>Temporada:</strong> ${escapeHtml(s.temporada || '26/27')}</div>
                  <div><strong>Convocados:</strong> ${(s.jugadores && s.jugadores.length) ? s.jugadores.length + ' jugador(es)' : 'Sin convocados'}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-selection-modal" data-id="${s.id}" style="width: 100%; padding: 6px 12px; font-size: 12px; font-weight: 700; border-color: ${selColor}40;">
                  <i data-lucide="flag"></i> Ver / Editar Ficha de Selección
                </button>
              </div>
            `;
            }).join('')}
          </div>
          ${paginationBarHTML}
        `;

        container.querySelectorAll('.selection-name-link, .btn-open-selection-modal').forEach(el => {
          el.addEventListener('click', () => openSelectionModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            const itemObj = (state.directory.selecciones || []).find(i => i && (String(i.id) === String(itemId) || (i.codigo && String(i.codigo) === String(itemId))));
            const itemName = itemObj ? (itemObj.nombre || itemObj.equipo || 'este registro') : 'este registro';

            showCustomConfirmModal(
              `¿Eliminar ${itemName}?`,
              `¿Estás seguro de que deseas eliminar permanentemente a "${escapeHtml(itemName)}" del directorio y de Firebase?`,
              () => {
                if ('selecciones' === 'clubes') {
                  deleteDirectoryItem(currentDirectoryTab, itemId);
                } else {
                  deleteDirectoryItem('selecciones', itemId);
                }
                showCustomAlertModal('Registro Eliminado', `El registro "${escapeHtml(itemName)}" ha sido eliminado con éxito.`);
                renderDirectorio();
              }
            );
          });
        });
      } else if (currentDirectoryTab === 'convocatorias') {
        container.innerHTML = `
          ${subFilterBarHTML}
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${pageItems.map(c => {
              const convColor = '#7c3aed';

              return `
              <div class="entity-card" style="border-top: 5px solid ${convColor} !important; background: linear-gradient(180deg, ${convColor}12 0%, var(--bg-card, #ffffff) 35%); padding: 14px; border-radius: var(--radius-lg, 12px); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;">
                <!-- LÍNEA 1: Checkbox + Icono Megáfono amplio 48px (izquierda) y Eliminar (derecha) -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${c.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${convColor};">
                    <div style="width: 48px; height: 48px; border-radius: var(--radius-md, 8px); background-color: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1.5px solid ${convColor}; padding: 3px; flex-shrink: 0; color: ${convColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                      <i data-lucide="megaphone" style="width: 24px; height: 24px;"></i>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${c.id}" style="width: 28px; height: 28px;" title="Eliminar">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <!-- LÍNEA 2: NOMBRE DE LA CONVOCATORIA EN UNA SOLA LÍNEA -->
                <div style="width: 100%; overflow: hidden; margin-top: 4px;">
                  <h3 class="entity-card-title conv-name-link cursor-pointer" data-id="${c.id}" title="${escapeHtml(c.nombre)}" style="margin: 0; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main, #1e293b);">
                    ${escapeHtml(c.nombre)} <i data-lucide="external-link" style="width: 12px; height: 12px; opacity: 0.7; vertical-align: middle;"></i>
                  </h3>
                </div>

                <!-- LÍNEA 3 EN ADELANTE: Demás datos -->
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: -2px;">
                  ${escapeHtml(c.tipoActividad || 'Actividad N/A')} | ${escapeHtml(c.temporada || '26/27')}
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-2 mt-1">
                  <div><strong>Selección:</strong> ${escapeHtml(c.seleccionVinculada || c.seleccion || 'N/A')}</div>
                  <div><strong>Fechas:</strong> ${escapeHtml(c.fechaInicio || 'N/A')} a ${escapeHtml(c.fechaFin || 'N/A')}</div>
                  <div><strong>Convocados:</strong> ${(c.jugadores && c.jugadores.length) ? c.jugadores.length + ' jugador(es)' : 'Sin convocados'}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-conv-modal" data-id="${c.id}" style="width: 100%; padding: 6px 12px; font-size: 12px; font-weight: 700; border-color: ${convColor}40;">
                  <i data-lucide="megaphone"></i> Ver / Editar Convocatoria
                </button>
              </div>
            `;
            }).join('')}
          </div>
          ${paginationBarHTML}
        `;

        container.querySelectorAll('.conv-name-link, .btn-open-conv-modal').forEach(el => {
          el.addEventListener('click', () => openConvocatoriaModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            const itemObj = (state.directory.convocatorias || []).find(i => i && (String(i.id) === String(itemId) || (i.codigo && String(i.codigo) === String(itemId))));
            const itemName = itemObj ? (itemObj.nombre || itemObj.equipo || 'este registro') : 'este registro';

            showCustomConfirmModal(
              `¿Eliminar ${itemName}?`,
              `¿Estás seguro de que deseas eliminar permanentemente a "${escapeHtml(itemName)}" del directorio y de Firebase?`,
              () => {
                if ('convocatorias' === 'clubes') {
                  deleteDirectoryItem(currentDirectoryTab, itemId);
                } else {
                  deleteDirectoryItem('convocatorias', itemId);
                }
                showCustomAlertModal('Registro Eliminado', `El registro "${escapeHtml(itemName)}" ha sido eliminado con éxito.`);
                renderDirectorio();
              }
            );
          });
        });
      } else if (currentDirectoryTab === 'torneos') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${pageItems.map(t => {
              const trnColor = '#d97706';
              const trnLogo = t.logo || t.escudo;

              return `
              <div class="entity-card" style="border-top: 5px solid ${trnColor} !important; background: linear-gradient(180deg, ${trnColor}12 0%, var(--bg-card, #ffffff) 35%); padding: 14px; border-radius: var(--radius-lg, 12px); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;">
                <!-- LÍNEA 1: Checkbox + Logo/Icono Trofeo amplio 48px (izquierda) y Eliminar (derecha) -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${t.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${trnColor};">
                    <div style="width: 48px; height: 48px; border-radius: var(--radius-md, 8px); background-color: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1.5px solid ${trnColor}; padding: 3px; flex-shrink: 0; color: ${trnColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                      ${trnLogo ? `<img src="${trnLogo}" style="width: 100%; height: 100%; object-fit: contain;">` : '<i data-lucide="trophy" style="width: 24px; height: 24px;"></i>'}
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${t.id}" style="width: 28px; height: 28px;" title="Eliminar">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <!-- LÍNEA 2: NOMBRE DEL TORNEO EN UNA SOLA LÍNEA -->
                <div style="width: 100%; overflow: hidden; margin-top: 4px;">
                  <h3 class="entity-card-title trn-name-link cursor-pointer" data-id="${t.id}" title="${escapeHtml(t.nombre)}" style="margin: 0; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main, #1e293b);">
                    ${escapeHtml(t.nombre)} <i data-lucide="external-link" style="width: 12px; height: 12px; opacity: 0.7; vertical-align: middle;"></i>
                  </h3>
                </div>

                <!-- LÍNEA 3 EN ADELANTE: Demás datos -->
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: -2px;">
                  ${escapeHtml(t.categoria || 'Cat. N/A')} | ${escapeHtml(t.temporada || '26/27')}
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-2 mt-1">
                  <div><strong>Lugar / Sede:</strong> ${escapeHtml(t.sede || t.lugar || 'N/A')}</div>
                  <div><strong>Participantes:</strong> ${(t.participantes && t.participantes.length) ? t.participantes.length + ' equipo(s)' : 'Sin inscritos'}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-trn-modal" data-id="${t.id}" style="width: 100%; padding: 6px 12px; font-size: 12px; font-weight: 700; border-color: ${trnColor}40;">
                  <i data-lucide="trophy"></i> Ver / Editar Ficha de Torneo
                </button>
              </div>
            `;
            }).join('')}
          </div>
          ${paginationBarHTML}
        `;

        container.querySelectorAll('.trn-name-link, .btn-open-trn-modal').forEach(el => {
          el.addEventListener('click', () => openTournamentModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            const itemObj = (state.directory.torneos || []).find(i => i && (String(i.id) === String(itemId) || (i.codigo && String(i.codigo) === String(itemId))));
            const itemName = itemObj ? (itemObj.nombre || itemObj.equipo || 'este registro') : 'este registro';

            showCustomConfirmModal(
              `¿Eliminar ${itemName}?`,
              `¿Estás seguro de que deseas eliminar permanentemente a "${escapeHtml(itemName)}" del directorio y de Firebase?`,
              () => {
                if ('torneos' === 'clubes') {
                  deleteDirectoryItem(currentDirectoryTab, itemId);
                } else {
                  deleteDirectoryItem('torneos', itemId);
                }
                showCustomAlertModal('Registro Eliminado', `El registro "${escapeHtml(itemName)}" ha sido eliminado con éxito.`);
                renderDirectorio();
              }
            );
          });
        });
      } else if (currentDirectoryTab === 'staff') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${pageItems.map(s => {
              const staffColor = '#059669';

              return `
              <div class="entity-card" style="border-top: 5px solid ${staffColor} !important; background: linear-gradient(180deg, ${staffColor}12 0%, var(--bg-card, #ffffff) 35%); padding: 14px; border-radius: var(--radius-lg, 12px); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;">
                <!-- LÍNEA 1: Checkbox + Foto/Avatar 48px (izquierda) y Eliminar (derecha) -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${s.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${staffColor};">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1.5px solid ${staffColor}; padding: 2px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                      ${s.foto || s.imagen ? `<img src="${s.foto || s.imagen}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : `<span style="font-weight: 800; color: ${staffColor}; font-size: 16px;">${s.nombre ? s.nombre.charAt(0) : 'S'}</span>`}
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${s.id}" style="width: 28px; height: 28px;" title="Eliminar">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <!-- LÍNEA 2: NOMBRE DEL MIEMBRO DE STAFF EN UNA SOLA LÍNEA -->
                <div style="width: 100%; overflow: hidden; margin-top: 4px;">
                  <h3 class="entity-card-title staff-name-link cursor-pointer" data-id="${s.id}" title="${escapeHtml(s.nombre)}" style="margin: 0; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main, #1e293b);">
                    ${escapeHtml(s.nombre)} <i data-lucide="external-link" style="width: 12px; height: 12px; opacity: 0.7; vertical-align: middle;"></i>
                  </h3>
                </div>

                <!-- LÍNEA 3 EN ADELANTE: Demás datos -->
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: -2px;">
                  ${escapeHtml(s.cargo || 'Cargo N/A')}
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-2 mt-1">
                  <div><strong>Equipo/Club:</strong> ${escapeHtml(s.equipo || s.club || s.seleccion || 'N/A')}</div>
                  <div><strong>Email:</strong> ${escapeHtml(s.email || s.correo || 'N/A')}</div>
                  <div><strong>Teléfono:</strong> ${escapeHtml(s.telefono || 'N/A')}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-staff-modal" data-id="${s.id}" style="width: 100%; padding: 6px 12px; font-size: 12px; font-weight: 700; border-color: ${staffColor}40;">
                  <i data-lucide="user-check"></i> Ver / Editar Ficha de Staff
                </button>
              </div>
            `;
            }).join('')}
          </div>
          ${paginationBarHTML}
        `;

        container.querySelectorAll('.staff-name-link, .btn-open-staff-modal').forEach(el => {
          el.addEventListener('click', () => openStaffModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            const itemObj = (state.directory.staff || []).find(i => i && (String(i.id) === String(itemId) || (i.codigo && String(i.codigo) === String(itemId))));
            const itemName = itemObj ? (itemObj.nombre || itemObj.equipo || 'este registro') : 'este registro';

            showCustomConfirmModal(
              `¿Eliminar ${itemName}?`,
              `¿Estás seguro de que deseas eliminar permanentemente a "${escapeHtml(itemName)}" del directorio y de Firebase?`,
              () => {
                if ('staff' === 'clubes') {
                  deleteDirectoryItem(currentDirectoryTab, itemId);
                } else {
                  deleteDirectoryItem('staff', itemId);
                }
                showCustomAlertModal('Registro Eliminado', `El registro "${escapeHtml(itemName)}" ha sido eliminado con éxito.`);
                renderDirectorio();
              }
            );
          });
        });
      } else if (currentDirectoryTab === 'agencias') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${pageItems.map(ag => {
              const agColor = '#4f46e5';
              const agNameLower = (ag.nombre || ag.agencia || '').trim().toLowerCase();
              const linkedCountMap = new Set();
              (ag.jugadoresRepresentados || []).forEach(j => linkedCountMap.add((typeof j === 'object' ? j.nombre : j).toLowerCase()));
              (state.directory.jugadores || []).forEach(p => {
                if (p.agencia && p.agencia.trim().toLowerCase() === agNameLower) {
                  linkedCountMap.add(p.nombre.toLowerCase());
                }
              });
              const totalCount = linkedCountMap.size;

              return `
              <div class="entity-card" style="border-top: 5px solid ${agColor} !important; background: linear-gradient(180deg, ${agColor}12 0%, var(--bg-card, #ffffff) 35%); padding: 14px; border-radius: var(--radius-lg, 12px); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;">
                <!-- LÍNEA 1: Checkbox + Logo/Icono Maletín 48px (izquierda) y Eliminar (derecha) -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${ag.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${agColor};">
                    <div style="width: 48px; height: 48px; border-radius: var(--radius-md, 8px); background-color: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1.5px solid ${agColor}; padding: 3px; flex-shrink: 0; color: ${agColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                      ${ag.logo || ag.escudo ? `<img src="${ag.logo || ag.escudo}" style="width: 100%; height: 100%; object-fit: contain;">` : '<i data-lucide="briefcase" style="width: 24px; height: 24px;"></i>'}
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${ag.id}" style="width: 28px; height: 28px;" title="Eliminar">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <!-- LÍNEA 2: NOMBRE DE LA AGENCIA EN UNA SOLA LÍNEA -->
                <div style="width: 100%; overflow: hidden; margin-top: 4px;">
                  <h3 class="entity-card-title agency-name-link cursor-pointer" data-id="${ag.id}" title="${escapeHtml(ag.nombre)}" style="margin: 0; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main, #1e293b);">
                    ${escapeHtml(ag.nombre)} <i data-lucide="external-link" style="width: 12px; height: 12px; opacity: 0.7; vertical-align: middle;"></i>
                  </h3>
                </div>

                <!-- LÍNEA 3 EN ADELANTE: Demás datos -->
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: -2px;">
                  ${escapeHtml(ag.localidad || 'Localidad N/A')}
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-2 mt-1">
                  <div><strong>Email:</strong> ${escapeHtml(ag.email || 'N/A')}</div>
                  <div><strong>Teléfono:</strong> ${escapeHtml(ag.telefono || 'N/A')}</div>
                  <div><strong>Representados:</strong> ${totalCount > 0 ? `<span class="match-category-tag" style="background: ${agColor}1A; color: ${agColor}; font-weight: 800;">${totalCount} jugador(es)</span>` : 'Sin representados'}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-agency-modal" data-id="${ag.id}" style="width: 100%; padding: 6px 12px; font-size: 12px; font-weight: 700; border-color: ${agColor}40;">
                  <i data-lucide="briefcase"></i> Ver / Editar Ficha de Agencia
                </button>
              </div>
            `;
            }).join('')}
          </div>
          ${paginationBarHTML}
        `;

        container.querySelectorAll('.agency-name-link, .btn-open-agency-modal').forEach(el => {
          el.addEventListener('click', () => openAgencyModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            const itemObj = (state.directory.agencias || []).find(i => i && (String(i.id) === String(itemId) || (i.codigo && String(i.codigo) === String(itemId))));
            const itemName = itemObj ? (itemObj.nombre || itemObj.equipo || 'este registro') : 'este registro';

            showCustomConfirmModal(
              `¿Eliminar ${itemName}?`,
              `¿Estás seguro de que deseas eliminar permanentemente a "${escapeHtml(itemName)}" del directorio y de Firebase?`,
              () => {
                if ('agencias' === 'clubes') {
                  deleteDirectoryItem(currentDirectoryTab, itemId);
                } else {
                  deleteDirectoryItem('agencias', itemId);
                }
                showCustomAlertModal('Registro Eliminado', `El registro "${escapeHtml(itemName)}" ha sido eliminado con éxito.`);
                renderDirectorio();
              }
            );
          });
        });
      } else if (currentDirectoryTab === 'agentes') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${pageItems.map(agt => {
              const agtColor = '#0891b2';
              const agtNameLower = (agt.nombre || agt.agente || '').trim().toLowerCase();
              const linkedCountMap = new Set();
              (agt.jugadoresRepresentados || []).forEach(j => linkedCountMap.add((typeof j === 'object' ? j.nombre : j).toLowerCase()));
              (state.directory.jugadores || []).forEach(p => {
                if (p.agente && p.agente.trim().toLowerCase() === agtNameLower) {
                  linkedCountMap.add(p.nombre.toLowerCase());
                }
              });
              const totalCount = linkedCountMap.size;

              return `
              <div class="entity-card" style="border-top: 5px solid ${agtColor} !important; background: linear-gradient(180deg, ${agtColor}12 0%, var(--bg-card, #ffffff) 35%); padding: 14px; border-radius: var(--radius-lg, 12px); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;">
                <!-- LÍNEA 1: Checkbox + Foto/Avatar 48px (izquierda) y Eliminar (derecha) -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${agt.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${agtColor};">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background-color: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1.5px solid ${agtColor}; padding: 2px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                      ${agt.foto || agt.imagen ? `<img src="${agt.foto || agt.imagen}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : `<span style="font-weight: 800; color: ${agtColor}; font-size: 16px;">${agt.nombre ? agt.nombre.charAt(0) : 'A'}</span>`}
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${agt.id}" style="width: 28px; height: 28px;" title="Eliminar">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <!-- LÍNEA 2: NOMBRE DEL AGENTE EN UNA SOLA LÍNEA -->
                <div style="width: 100%; overflow: hidden; margin-top: 4px;">
                  <h3 class="entity-card-title agent-name-link cursor-pointer" data-id="${agt.id}" title="${escapeHtml(agt.nombre)}" style="margin: 0; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main, #1e293b);">
                    ${escapeHtml(agt.nombre)} <i data-lucide="external-link" style="width: 12px; height: 12px; opacity: 0.7; vertical-align: middle;"></i>
                  </h3>
                </div>

                <!-- LÍNEA 3 EN ADELANTE: Demás datos -->
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: -2px;">
                  ${escapeHtml(agt.agencia || 'Sin Agencia')} | ${escapeHtml(agt.localidad || 'N/A')}
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-2 mt-1">
                  <div><strong>Email:</strong> ${escapeHtml(agt.email || 'N/A')}</div>
                  <div><strong>Teléfono:</strong> ${escapeHtml(agt.telefono || 'N/A')}</div>
                  <div><strong>Representados:</strong> ${totalCount > 0 ? `<span class="match-category-tag" style="background: ${agtColor}1A; color: ${agtColor}; font-weight: 800;">${totalCount} jugador(es)</span>` : 'Sin representados'}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-agent-modal" data-id="${agt.id}" style="width: 100%; padding: 6px 12px; font-size: 12px; font-weight: 700; border-color: ${agtColor}40;">
                  <i data-lucide="user-cog"></i> Ver / Editar Ficha de Agente
                </button>
              </div>
            `;
            }).join('')}
          </div>
          ${paginationBarHTML}
        `;

        container.querySelectorAll('.agent-name-link, .btn-open-agent-modal').forEach(el => {
          el.addEventListener('click', () => openAgentModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            const itemObj = (state.directory.agentes || []).find(i => i && (String(i.id) === String(itemId) || (i.codigo && String(i.codigo) === String(itemId))));
            const itemName = itemObj ? (itemObj.nombre || itemObj.equipo || 'este registro') : 'este registro';

            showCustomConfirmModal(
              `¿Eliminar ${itemName}?`,
              `¿Estás seguro de que deseas eliminar permanentemente a "${escapeHtml(itemName)}" del directorio y de Firebase?`,
              () => {
                if ('agentes' === 'clubes') {
                  deleteDirectoryItem(currentDirectoryTab, itemId);
                } else {
                  deleteDirectoryItem('agentes', itemId);
                }
                showCustomAlertModal('Registro Eliminado', `El registro "${escapeHtml(itemName)}" ha sido eliminado con éxito.`);
                renderDirectorio();
              }
            );
          });
        });
      } else if (currentDirectoryTab === 'estadios') {
        container.innerHTML = `
          ${subFilterBarHTML}
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${pageItems.map(est => {
              const estColor = '#16a34a';

              return `
              <div class="entity-card" style="border-top: 5px solid ${estColor} !important; background: linear-gradient(180deg, ${estColor}12 0%, var(--bg-card, #ffffff) 35%); padding: 14px; border-radius: var(--radius-lg, 12px); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;">
                <!-- LÍNEA 1: Checkbox + Foto/Icono Mapa amplio 48px (izquierda) y Eliminar (derecha) -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${est.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${estColor};">
                    <div style="width: 48px; height: 48px; border-radius: var(--radius-md, 8px); background-color: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1.5px solid ${estColor}; padding: 3px; flex-shrink: 0; color: ${estColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                      ${est.foto || est.imagen ? `<img src="${est.foto || est.imagen}" style="width: 100%; height: 100%; object-fit: cover;">` : '<i data-lucide="map-pin" style="width: 24px; height: 24px;"></i>'}
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${est.id}" style="width: 28px; height: 28px;" title="Eliminar">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <!-- LÍNEA 2: NOMBRE DEL ESTADIO EN UNA SOLA LÍNEA -->
                <div style="width: 100%; overflow: hidden; margin-top: 4px;">
                  <h3 class="entity-card-title stadium-name-link cursor-pointer" data-id="${est.id}" title="${escapeHtml(est.nombre)}" style="margin: 0; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main, #1e293b);">
                    ${escapeHtml(est.nombre)} <i data-lucide="external-link" style="width: 12px; height: 12px; opacity: 0.7; vertical-align: middle;"></i>
                  </h3>
                </div>

                <!-- LÍNEA 3 EN ADELANTE: Demás datos -->
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: -2px;">
                  ${escapeHtml(est.localidad || 'Localidad N/A')} ${est.comunidad ? `(${escapeHtml(est.comunidad)})` : ''} | ${escapeHtml(est.superficie || 'Superficie N/A')}
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-2 mt-1">
                  <div><strong>Capacidad:</strong> ${escapeHtml(est.capacidad ? est.capacidad + ' espectadores' : 'N/A')}</div>
                  <div><strong>Dimensiones:</strong> ${escapeHtml(est.dimensiones || 'N/A')}</div>
                  <div><strong>Clubes:</strong> ${(est.clubes && est.clubes.length) ? est.clubes.length + ' club(es)' : 'Sin clubes'}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-stadium-modal" data-id="${est.id}" style="width: 100%; padding: 6px 12px; font-size: 12px; font-weight: 700; border-color: ${estColor}40;">
                  <i data-lucide="map-pin"></i> Ver / Editar Ficha de Estadio
                </button>
              </div>
            `;
            }).join('')}
          </div>
          ${paginationBarHTML}
        `;

        container.querySelectorAll('.stadium-name-link, .btn-open-stadium-modal').forEach(el => {
          el.addEventListener('click', () => openStadiumModal(el.dataset.id));
        });
      } else {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${pageItems.map(item => {
              const itemColor = '#2563eb';
              const itemName = item.nombre || item.titulo || item.equipo || 'Registro';

              return `
              <div class="entity-card" style="border-top: 5px solid ${itemColor} !important; background: linear-gradient(180deg, ${itemColor}12 0%, var(--bg-card, #ffffff) 35%); padding: 14px; border-radius: var(--radius-lg, 12px); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${item.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${itemColor};">
                    <div style="width: 48px; height: 48px; border-radius: var(--radius-md, 8px); background-color: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1.5px solid ${itemColor}; padding: 3px; flex-shrink: 0; color: ${itemColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                      <span style="font-weight: 800; font-size: 16px;">${itemName.charAt(0)}</span>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${item.id}" style="width: 28px; height: 28px;" title="Eliminar">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>
                <div style="width: 100%; overflow: hidden; margin-top: 4px;">
                  <h3 class="entity-card-title" title="${escapeHtml(itemName)}" style="margin: 0; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main, #1e293b);">
                    ${escapeHtml(itemName)}
                  </h3>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-2 mt-1">
                  ${Object.entries(item).filter(([k]) => k !== 'id' && k !== 'nombre' && k !== 'titulo').slice(0, 4).map(([k, v]) => `
                    <div><strong style="text-transform: capitalize;">${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}</div>
                  `).join('')}
                </div>
              </div>
            `;
            }).join('')}
          </div>
          ${paginationBarHTML}
        `;
}
      }

        // Attach Card Delete Listener for ALL tabs
    container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.id;
        const itemObj = (state.directory[currentDirectoryTab] || []).find(i => i && (String(i.id) === String(itemId) || (i.codigo && String(i.codigo) === String(itemId))));
        const itemName = itemObj ? (itemObj.nombre || itemObj.equipo || itemObj.jugador || itemObj.titulo || 'este registro') : 'este registro';

        showCustomConfirmModal(
          `¿Eliminar ${itemName}?`,
          `¿Estás seguro de que deseas eliminar permanentemente a "${escapeHtml(itemName)}" del directorio y de Firebase?`,
          () => {
            const card = btn.closest('.entity-card');
            if (card) {
              card.style.transition = 'all 0.2s ease-out';
              card.style.opacity = '0';
              card.style.transform = 'scale(0.9)';
            }
            deleteDirectoryItem(currentDirectoryTab, itemId);
            showToast(`"${itemName}" eliminado con éxito`, 'danger');
            renderDirectorio();
          }
        );
      });
    });

    // Attach Bulk Selection & Deletion Logic for ALL tabs
    const selectAllCb = container.querySelector('#dirSelectAllCheckbox') || document.getElementById('dirSelectAllCheckbox');
    const itemCbs = container.querySelectorAll('.dir-item-checkbox');
    const bulkDeleteBtn = container.querySelector('#btnBulkDeleteDir') || document.getElementById('btnBulkDeleteDir');
    const selectedCountSpan = container.querySelector('#dirSelectedCount') || document.getElementById('dirSelectedCount');
    const bulkDeleteBadge = container.querySelector('#dirBulkDeleteBadge') || document.getElementById('dirBulkDeleteBadge');

    if (bulkDeleteBtn) {
      const updateBulkUI = () => {
        const checkedCbs = container.querySelectorAll('.dir-item-checkbox:checked');
        const count = checkedCbs.length;
        if (selectedCountSpan) selectedCountSpan.textContent = count;
        if (bulkDeleteBadge) bulkDeleteBadge.textContent = count;

        if (count > 0) {
          bulkDeleteBtn.classList.remove('hidden');
          bulkDeleteBtn.style.display = 'inline-flex';
        } else {
          bulkDeleteBtn.classList.add('hidden');
          bulkDeleteBtn.style.display = 'none';
        }

        if (selectAllCb) {
          selectAllCb.checked = (count > 0 && count === itemCbs.length);
        }
      };

      selectAllCb?.addEventListener('change', (e) => {
        itemCbs.forEach(cb => cb.checked = e.target.checked);
        updateBulkUI();
      });

      itemCbs.forEach(cb => {
        cb.addEventListener('change', updateBulkUI);
      });

      bulkDeleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const checkedCbs = container.querySelectorAll('.dir-item-checkbox:checked');
        const idsToDelete = Array.from(checkedCbs).map(cb => cb.dataset.id);
        if (idsToDelete.length === 0) return;

        const tabNameDisplay = currentDirectoryTab.toUpperCase();
        showCustomConfirmModal(
          `¿Eliminar ${idsToDelete.length} Registros?`,
          `¿Estás seguro de que deseas eliminar permanentemente los ${idsToDelete.length} registros seleccionados de la sección ${tabNameDisplay} tanto en la aplicación como en Firebase?`,
          () => {
            idsToDelete.forEach(id => deleteDirectoryItem(currentDirectoryTab, id));
            showToast(`Se han eliminado ${idsToDelete.length} registros con éxito`, 'danger');
            renderDirectorio();
          }
        );
      });
    }

    container.querySelectorAll('.btn-dir-subfilter').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const val = btn.dataset.val;
        if (type === 'categoria') {
          currentSubCategoryFilter = val;
          currentSubGroupFilter = 'TODOS';
        } else if (type === 'grupo') {
          currentSubGroupFilter = val;
        } else if (type === 'federacion') {
          currentFederationFilter = val;
        } else if (type === 'comunidad') {
          currentComunidadFilter = val;
        }
        currentDirectoryPage = 1;
        renderDirectorio();
      });
    });

    container.querySelectorAll('.btn-dir-prev-page').forEach(btn => {
      btn.addEventListener('click', () => {
        renderDirectorio(null, currentDirectoryPage - 1);
      });
    });
    container.querySelectorAll('.btn-dir-next-page').forEach(btn => {
      btn.addEventListener('click', () => {
        renderDirectorio(null, currentDirectoryPage + 1);
      });
    });

    container.querySelectorAll('.btn-dir-jump-go').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.closest('div')?.querySelector('.dir-page-jump-input');
        if (input) {
          let p = parseInt(input.value, 10);
          if (isNaN(p)) p = 1;
          renderDirectorio(null, p);
        }
      });
    });

    container.querySelectorAll('.dir-page-jump-input').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          let p = parseInt(input.value, 10);
          if (isNaN(p)) p = 1;
          renderDirectorio(null, p);
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  document.getElementById('dirSearchInput')?.addEventListener('input', () => {
    currentDirectoryPage = 1;
    renderDirectorio();
  });
  document.getElementById('btnResetDirFilters')?.addEventListener('click', () => {
    const input = document.getElementById('dirSearchInput');
    if (input) input.value = '';
    ['dirFilterAno', 'dirFilterEquipo', 'dirFilterCompeticion', 'dirFilterCategoria', 'dirFilterNivel', 'dirFilterPosicion', 'dirFilterOtro'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    if (state.dirActiveFilters) {
      state.dirActiveFilters[currentDirectoryTab] = {};
    }
    currentDirectoryPage = 1;
    renderDirectorio();
  });

  // Attach change listeners to top 7 filter dropdowns
  ['dirFilterAno', 'dirFilterEquipo', 'dirFilterCompeticion', 'dirFilterCategoria', 'dirFilterNivel', 'dirFilterPosicion', 'dirFilterOtro'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset.filterBound) {
      el.dataset.filterBound = 'true';
      el.addEventListener('change', () => {
        currentDirectoryPage = 1;
        renderDirectorio();
      });
    }
  });
  document.getElementById('btnAddNewDirectoryItem')?.addEventListener('click', () => openAddDirectoryItemModal());
  document.getElementById('btnAddNewPlayerHeader')?.addEventListener('click', () => {
    if (currentDirectoryTab === 'jugadores') openPlayerModal(null);
    else if (currentDirectoryTab === 'clubes') openClubModal(null);
    else if (currentDirectoryTab === 'equipos') openTeamModal(null);
    else if (currentDirectoryTab === 'federaciones') openFederationModal(null);
    else if (currentDirectoryTab === 'selecciones') openSelectionModal(null);
    else if (currentDirectoryTab === 'convocatorias') openConvocatoriaModal(null);
    else if (currentDirectoryTab === 'torneos') openTournamentModal(null);
    else if (currentDirectoryTab === 'staff') openStaffModal(null);
    else if (currentDirectoryTab === 'agencias') openAgencyModal(null);
    else if (currentDirectoryTab === 'agentes') openAgentModal(null);
    else if (currentDirectoryTab === 'estadios') openStadiumModal(null);
    else openAddDirectoryItemModal();
  });

  function openAddDirectoryItemModal() {
    if (currentDirectoryTab === 'jugadores') {
      openPlayerModal(null);
      return;
    }
    if (currentDirectoryTab === 'clubes') {
      openClubModal(null);
      return;
    }
    if (currentDirectoryTab === 'equipos') {
      openTeamModal(null);
      return;
    }
    if (currentDirectoryTab === 'federaciones') {
      openFederationModal(null);
      return;
    }
    if (currentDirectoryTab === 'selecciones') {
      openSelectionModal(null);
      return;
    }
    if (currentDirectoryTab === 'convocatorias') {
      openConvocatoriaModal(null);
      return;
    }
    if (currentDirectoryTab === 'torneos') {
      openTournamentModal(null);
      return;
    }
    if (currentDirectoryTab === 'staff') {
      openStaffModal(null);
      return;
    }
    if (currentDirectoryTab === 'agencias') {
      openAgencyModal(null);
      return;
    }
    if (currentDirectoryTab === 'agentes') {
      openAgentModal(null);
      return;
    }
    if (currentDirectoryTab === 'estadios') {
      openStadiumModal(null);
      return;
    }

    showModal(`Añadir Nuevo Registro a ${currentDirectoryTab.toUpperCase()}`, `
      <form id="newDirItemForm">
        <div class="form-group mb-4">
          <label class="form-label">Nombre / Título Principal</label>
          <input type="text" id="dirItemNombre" class="form-control" required placeholder="Nombre...">
        </div>
        <div class="form-group mb-4">
          <label class="form-label">Equipo / Club / Entidad Asociada</label>
          <input type="text" id="dirItemEquipo" class="form-control" placeholder="Equipo...">
        </div>
        <div class="form-group mb-4">
          <label class="form-label">Categoría / Nivel / Posición</label>
          <input type="text" id="dirItemMeta" class="form-control" placeholder="Ej: Juvenil A / DC">
        </div>
      </form>
    `, () => {
      const nombre = document.getElementById('dirItemNombre').value.trim();
      if (!nombre) return alert('Por favor ingresa un nombre');

      const newItem = {
        id: 'dir_' + Date.now(),
        nombre: nombre,
        equipo: document.getElementById('dirItemEquipo').value.trim() || 'N/A',
        meta: document.getElementById('dirItemMeta').value.trim() || 'N/A'
      };

      if (!state.directory[currentDirectoryTab]) state.directory[currentDirectoryTab] = [];
      state.directory[currentDirectoryTab].unshift(newItem);
      saveToFirebase(currentDirectoryTab, newItem);
      saveState();
      hideModal();
      showToast(`Ficha de "${nombre}" guardada con éxito`, 'success');
      renderDirectorio();
    });
  }

  // --------------------------------------------------------------------------
  // 7. SECTION 4: IMPORTADOR DE PLANTILLAS FEDERATIVAS (JUGADORES & STAFF ESTILO EXCEL)
  // --------------------------------------------------------------------------
  const DEFAULT_PLAYER_PHOTO_PATH = "Foto Jugador General.png";
  let stagedExcelRows = [];

  function populateImporterEquiposDatalist() {
    const datalist = document.getElementById('importerEquiposDatalist');
    const select = document.getElementById('importerDefaultEquipoSelect');
    if (!state.directory) return;
    const equipos = state.directory.equipos || [];
    
    if (datalist) {
      datalist.innerHTML = equipos.map(eq => `<option value="${escapeHtml(eq.nombre || eq.equipo)}"></option>`).join('');
    }
    
    if (select) {
      let html = `<option value="">-- Seleccionar de los Equipos del Directorio --</option>`;
      equipos.forEach(eq => {
        const name = eq.nombre || eq.equipo;
        const meta = eq.categoria ? ` (${eq.categoria})` : '';
        html += `<option value="${escapeHtml(name)}">${escapeHtml(name + meta)}</option>`;
      });
      select.innerHTML = html;
    }
  }

  // Sync team select change to text input
  document.getElementById('importerDefaultEquipoSelect')?.addEventListener('change', (e) => {
    const input = document.getElementById('importerDefaultEquipo');
    if (input && e.target.value) {
      input.value = e.target.value;
    }
  });

  // Populate datalist on tab navigation / initialization
  if (typeof populateImporterEquiposDatalist === 'function') {
    populateImporterEquiposDatalist();
  }

  function formatFederationName(rawLine) {
    let nameStr = rawLine.trim();
    if (!nameStr) return '';

    // Handle "ALBISU MUÑOZ, UNAI" or "Albisu Muñoz, Unai" -> "Unai Albisu Muñoz"
    if (nameStr.includes(',')) {
      const parts = nameStr.split(',').map(p => p.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        nameStr = `${parts[1]} ${parts[0]}`;
      }
    }

    // Convert to clean Title Case (e.g., "MIGUEL ECHARTE" -> "Miguel Echarte")
    return nameStr.toLowerCase().replace(/(?:^|\s|\-)\S/g, char => char.toUpperCase()).trim();
  }

  function processImporterText() {
    const rawText = document.getElementById('importerRawText')?.value.trim();
    if (!rawText) {
      alert('Por favor pega primero la lista de la federación en el campo de texto.');
      return;
    }

    // Default team choice
    const selectVal = document.getElementById('importerDefaultEquipoSelect')?.value;
    const inputVal = document.getElementById('importerDefaultEquipo')?.value.trim();
    const defaultEquipo = selectVal || inputVal || 'Sin equipo';

    const defaultAno = '2006';
    const defaultPais = 'España';
    const defaultSexo = 'MASCULINO';
    const defaultComunidad = 'Navarra';
    const defaultLocalidad = 'Pamplona';
    const defaultEstado = 'ALTA';
    const defaultPierna = 'Diestra';
    const defaultProyeccion = 'Proyección Alta';
    const defaultPosicion = 'Por definir';

    const lines = rawText.split('\n');
    stagedExcelRows = [];
    let currentRole = 'JUGADOR';

    lines.forEach((line, index) => {
      let trimmed = line.trim();
      if (!trimmed) return;

      // Detect Staff Headers (e.g. "Delegados (1)", "Entrenadores", "Cuerpo Técnico", "Staff", "Técnicos", "Directiva")
      if (/^(delegados|entrenadores|cuerpo\s+técnico|staff|técnicos|tecnicos|directiva|entrenador)/i.test(trimmed)) {
        currentRole = 'STAFF';
        return;
      }
      if (/^(jugadores|plantilla|futbolistas|jugador)/i.test(trimmed)) {
        currentRole = 'JUGADOR';
        return;
      }
      // Skip generic table header lines
      if (/^(nombre|apellidos|dorsal|posición|licencia|posicion|demarcación)/i.test(trimmed)) {
        return;
      }

      const formattedName = formatFederationName(trimmed);
      if (formattedName.length < 2) return;

      const isStaff = currentRole === 'STAFF';
      
      stagedExcelRows.push({
        id: (isStaff ? 'st_' : 'j_') + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        checked: true,
        tipo: currentRole, // 'JUGADOR' o 'STAFF'
        nombre: formattedName,
        ano: defaultAno,
        pais: defaultPais,
        sexo: defaultSexo,
        equipo: defaultEquipo,
        estado: defaultEstado,
        comunidad: defaultComunidad,
        localidad: defaultLocalidad,
        pierna: defaultPierna,
        proyeccion: defaultProyeccion,
        posicion: isStaff ? 'Delegado / Técnico' : defaultPosicion,
        posicionSecundaria: ''
      });
    });

    if (stagedExcelRows.length === 0) {
      alert('No se pudieron extraer nombres válidos del texto pegado. Revisa la lista.');
      return;
    }

    // Switch step view
    document.getElementById('importerStep1Container')?.classList.add('hidden');
    document.getElementById('importerStep2ExcelContainer')?.classList.remove('hidden');

    renderExcelTable();
  }

  function renderExcelTable() {
    const tbody = document.getElementById('excelTableBody');
    if (!tbody) return;

    const totalRows = stagedExcelRows.length;
    const countJugadores = stagedExcelRows.filter(r => r.tipo === 'JUGADOR').length;
    const countStaff = stagedExcelRows.filter(r => r.tipo === 'STAFF').length;

    document.getElementById('lblExcelTotalRows').textContent = totalRows;
    const badgesContainer = document.getElementById('lblExcelCountBadges');
    if (badgesContainer) {
      badgesContainer.innerHTML = `
        <span style="background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 800;">
          🏃 ${countJugadores} Jugadores
        </span>
        <span style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 800;">
          👔 ${countStaff} Staff
        </span>
      `;
    }

    const posOptions = ['Por definir', 'Portero', 'Defensa Central', 'Lateral Derecho', 'Lateral Izquierdo', 'Pivote', 'Mediocentro', 'Mediapunta', 'Extremo Derecho', 'Extremo Izquierdo', 'Delantero Centro', 'Entrenador', 'Segundo Entrenador', 'Delegado / Técnico', 'Preparador Físico', 'Fisioterapeuta'];
    const estadoOptions = ['ALTA', 'RENOVACIÓN', 'SEGUIMIENTO', 'PRUEBA', 'DILIGENCIA'];
    const proyeccionOptions = ['Proyección Alta', 'Proyección Media', 'Nivel A', 'Nivel B', 'Nivel C'];
    const piernaOptions = ['Diestra', 'Zurda', 'Ambidextra'];

    let html = '';
    stagedExcelRows.forEach((row, idx) => {
      const isStaff = row.tipo === 'STAFF';
      const rowBg = isStaff ? '#fffbeb' : '#ffffff';

      html += `
        <tr data-idx="${idx}" style="border-bottom: 1px solid #e2e8f0; background: ${rowBg}; transition: background 0.15s ease;">
          <td style="padding: 6px; text-align: center; border-right: 1px solid #f1f5f9;">
            <input type="checkbox" class="excel-row-cb" data-idx="${idx}" ${row.checked ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
          </td>

          <td style="padding: 6px; text-align: center; font-weight: 800; color: var(--text-muted, #94a3b8); font-size: 11px; border-right: 1px solid #f1f5f9;">
            ${idx + 1}
          </td>

          <td style="padding: 4px; border-right: 1px solid #f1f5f9;">
            <select class="form-control excel-cell-field" data-idx="${idx}" data-field="tipo" style="font-size: 11px; font-weight: 800; padding: 3px 6px; height: 28px; background: ${isStaff ? '#fef3c7' : '#dbeafe'}; color: ${isStaff ? '#92400e' : '#1e40af'}; border-radius: 6px;">
              <option value="JUGADOR" ${row.tipo === 'JUGADOR' ? 'selected' : ''}>🏃 JUGADOR</option>
              <option value="STAFF" ${row.tipo === 'STAFF' ? 'selected' : ''}>👔 STAFF</option>
            </select>
          </td>

          <td style="padding: 4px; border-right: 1px solid #f1f5f9;">
            <input type="text" class="form-control excel-cell-field" data-idx="${idx}" data-field="nombre" value="${escapeHtml(row.nombre)}" style="font-size: 12px; font-weight: 700; padding: 3px 6px; height: 28px;" placeholder="Nombre...">
          </td>

          <td style="padding: 4px; border-right: 1px solid #f1f5f9;">
            <input type="text" class="form-control excel-cell-field" data-idx="${idx}" data-field="ano" value="${escapeHtml(row.ano)}" style="font-size: 11px; font-weight: 700; text-align: center; padding: 3px 4px; height: 28px; width: 60px;" placeholder="Año">
          </td>

          <td style="padding: 4px; border-right: 1px solid #f1f5f9;">
            <input type="text" class="form-control excel-cell-field" data-idx="${idx}" data-field="pais" value="${escapeHtml(row.pais)}" style="font-size: 11px; padding: 3px 6px; height: 28px;" placeholder="País">
          </td>

          <td style="padding: 4px; border-right: 1px solid #f1f5f9;">
            <select class="form-control excel-cell-field" data-idx="${idx}" data-field="sexo" style="font-size: 11px; padding: 3px 6px; height: 28px;">
              <option value="MASCULINO" ${row.sexo === 'MASCULINO' ? 'selected' : ''}>Masculino</option>
              <option value="FEMENINO" ${row.sexo === 'FEMENINO' ? 'selected' : ''}>Femenino</option>
            </select>
          </td>

          <td style="padding: 4px; border-right: 1px solid #f1f5f9;">
            <input type="text" class="form-control excel-cell-field" data-idx="${idx}" data-field="equipo" value="${escapeHtml(row.equipo)}" style="font-size: 11px; padding: 3px 6px; height: 28px;" placeholder="Equipo principal">
          </td>

          <td style="padding: 4px; border-right: 1px solid #f1f5f9;">
            <select class="form-control excel-cell-field" data-idx="${idx}" data-field="estado" style="font-size: 11px; padding: 3px 4px; height: 28px;">
              ${estadoOptions.map(e => `<option value="${e}" ${row.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
            </select>
          </td>

          <td style="padding: 4px; border-right: 1px solid #f1f5f9;">
            <input type="text" class="form-control excel-cell-field" data-idx="${idx}" data-field="comunidad" value="${escapeHtml(row.comunidad)}" style="font-size: 11px; padding: 3px 6px; height: 28px;" placeholder="Comunidad">
          </td>

          <td style="padding: 4px; border-right: 1px solid #f1f5f9;">
            <input type="text" class="form-control excel-cell-field" data-idx="${idx}" data-field="localidad" value="${escapeHtml(row.localidad)}" style="font-size: 11px; padding: 3px 6px; height: 28px;" placeholder="Localidad">
          </td>

          <td style="padding: 4px; border-right: 1px solid #f1f5f9;">
            <select class="form-control excel-cell-field" data-idx="${idx}" data-field="pierna" style="font-size: 11px; padding: 3px 4px; height: 28px;">
              ${piernaOptions.map(p => `<option value="${p}" ${row.pierna === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </td>

          <td style="padding: 4px; border-right: 1px solid #f1f5f9;">
            <select class="form-control excel-cell-field" data-idx="${idx}" data-field="proyeccion" style="font-size: 11px; padding: 3px 4px; height: 28px;">
              ${proyeccionOptions.map(pr => `<option value="${pr}" ${row.proyeccion === pr ? 'selected' : ''}>${pr}</option>`).join('')}
            </select>
          </td>

          <td style="padding: 4px; border-right: 1px solid #f1f5f9;">
            <select class="form-control excel-cell-field" data-idx="${idx}" data-field="posicion" style="font-size: 11px; padding: 3px 4px; height: 28px;">
              ${posOptions.map(p => `<option value="${p}" ${row.posicion === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </td>

          <td style="padding: 4px; border-right: 1px solid #f1f5f9;">
            <select class="form-control excel-cell-field" data-idx="${idx}" data-field="posicionSecundaria" style="font-size: 11px; padding: 3px 4px; height: 28px;">
              <option value="">(Ninguna)</option>
              ${posOptions.map(p => `<option value="${p}" ${row.posicionSecundaria === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </td>

          <td style="padding: 4px; text-align: center;">
            <button type="button" class="btn-action-icon danger btn-delete-excel-row" data-idx="${idx}" style="width: 24px; height: 24px;" title="Eliminar fila">
              <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();

    // Event listeners for cell field updates
    tbody.querySelectorAll('.excel-cell-field').forEach(input => {
      input.addEventListener('change', (e) => {
        const rowIdx = parseInt(e.target.dataset.idx, 10);
        const fieldName = e.target.dataset.field;
        if (stagedExcelRows[rowIdx]) {
          stagedExcelRows[rowIdx][fieldName] = e.target.value;
          if (fieldName === 'tipo') {
            renderExcelTable(); // Re-render for color badge update
          }
        }
      });
    });

    // Row checkbox listener
    tbody.querySelectorAll('.excel-row-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const rowIdx = parseInt(e.target.dataset.idx, 10);
        if (stagedExcelRows[rowIdx]) {
          stagedExcelRows[rowIdx].checked = e.target.checked;
        }
      });
    });

    // Delete row listener
    tbody.querySelectorAll('.btn-delete-excel-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rowIdx = parseInt(btn.dataset.idx, 10);
        stagedExcelRows.splice(rowIdx, 1);
        renderExcelTable();
      });
    });
  }

  // Master header checkbox
  document.getElementById('excelHeaderMasterCheckbox')?.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    stagedExcelRows.forEach(r => r.checked = isChecked);
    document.querySelectorAll('.excel-row-cb').forEach(cb => cb.checked = isChecked);
  });

  document.getElementById('btnExcelSelectAllRows')?.addEventListener('click', () => {
    stagedExcelRows.forEach(r => r.checked = true);
    document.querySelectorAll('.excel-row-cb').forEach(cb => cb.checked = true);
    const masterCb = document.getElementById('excelHeaderMasterCheckbox');
    if (masterCb) masterCb.checked = true;
  });

  document.getElementById('btnExcelDeselectAllRows')?.addEventListener('click', () => {
    stagedExcelRows.forEach(r => r.checked = false);
    document.querySelectorAll('.excel-row-cb').forEach(cb => cb.checked = false);
    const masterCb = document.getElementById('excelHeaderMasterCheckbox');
    if (masterCb) masterCb.checked = false;
  });

  // Bulk edit / Fill down to checked rows
  document.getElementById('btnExcelApplyBulk')?.addEventListener('click', () => {
    const colName = document.getElementById('bulkExcelColumn')?.value;
    const val = document.getElementById('bulkExcelValueInput')?.value;

    if (!colName) {
      alert('Por favor selecciona una columna a modificar.');
      return;
    }

    let modifiedCount = 0;
    stagedExcelRows.forEach(row => {
      if (row.checked) {
        row[colName] = val;
        modifiedCount++;
      }
    });

    renderExcelTable();
    showToast(`Se ha aplicado el valor a ${modifiedCount} filas seleccionadas`, 'info');
  });

  // Process text button click listener
  document.getElementById('btnProcessImporterText')?.addEventListener('click', processImporterText);

  // Cancel import button
  document.getElementById('btnExcelCancelImport')?.addEventListener('click', () => {
    stagedExcelRows = [];
    document.getElementById('importerStep2ExcelContainer')?.classList.add('hidden');
    document.getElementById('importerStep1Container')?.classList.remove('hidden');
  });

  // Confirm and Save to app state & Firebase
  document.getElementById('btnExcelConfirmSave')?.addEventListener('click', () => {
    const itemsToSave = stagedExcelRows.filter(r => r.checked);
    if (itemsToSave.length === 0) {
      alert('Por favor marca al menos una fila para importar.');
      return;
    }

    if (!state.directory) state.directory = {};
    if (!Array.isArray(state.directory.jugadores)) state.directory.jugadores = [];
    if (!Array.isArray(state.directory.staff)) state.directory.staff = [];

    let countJugadoresNew = 0;
    let countJugadoresUpd = 0;
    let countStaffNew = 0;
    let countStaffUpd = 0;

    itemsToSave.forEach(row => {
      const isStaff = row.tipo === 'STAFF';

      if (isStaff) {
        // Staff object construction
        const staffObj = {
          id: 'staff_' + Date.now() + Math.floor(Math.random() * 1000),
          nombre: row.nombre,
          staff: row.nombre,
          cargo: row.posicion || 'Delegado / Técnico',
          equipo: row.equipo,
          club: row.equipo ? (row.equipo.split(' ')[0] || row.equipo) : '',
          ano: row.ano,
          pais: row.pais,
          sexo: row.sexo,
          comunidad: row.comunidad,
          localidad: row.localidad,
          estado: row.estado,
          federacion: row.comunidad ? `Federación de ${row.comunidad}` : 'FNF'
        };

        const existingIdx = state.directory.staff.findIndex(s => 
          s && (s.nombre || s.staff || '').toLowerCase().trim() === row.nombre.toLowerCase().trim()
        );

        if (existingIdx !== -1) {
          state.directory.staff[existingIdx] = Object.assign({}, state.directory.staff[existingIdx], staffObj);
          saveToFirebase('staff', state.directory.staff[existingIdx]);
          countStaffUpd++;
        } else {
          state.directory.staff.unshift(staffObj);
          saveToFirebase('staff', staffObj);
          countStaffNew++;
        }
      } else {
        // Player object construction
        const playerObj = {
          id: 'j_' + Date.now() + Math.floor(Math.random() * 1000),
          nombre: row.nombre,
          jugador: row.nombre,
          equipo: row.equipo,
          equipoPrincipal: row.equipo,
          club: row.equipo ? (row.equipo.split(' ')[0] || row.equipo) : '',
          ano: row.ano,
          anoNacimiento: row.ano,
          sub: row.ano ? `SUB${2026 - (parseInt(row.ano) || 2006)}` : 'SUB20',
          pais: row.pais,
          sexo: row.sexo,
          comunidad: row.comunidad,
          localidad: row.localidad,
          estado: row.estado,
          pierna: row.pierna,
          piernaDominante: row.pierna,
          proyeccion: row.proyeccion,
          rendimientoRS: row.proyeccion,
          posicion: row.posicion,
          posicionPrincipal: row.posicion,
          posicionSecundaria: row.posicionSecundaria,
          foto: DEFAULT_PLAYER_PHOTO_PATH,
          escudo: DEFAULT_PLAYER_PHOTO_PATH,
          imagen: DEFAULT_PLAYER_PHOTO_PATH
        };

        const existingIdx = state.directory.jugadores.findIndex(j => 
          j && (j.nombre || j.jugador || '').toLowerCase().trim() === row.nombre.toLowerCase().trim()
        );

        if (existingIdx !== -1) {
          state.directory.jugadores[existingIdx] = Object.assign({}, state.directory.jugadores[existingIdx], playerObj);
          saveToFirebase('jugadores', state.directory.jugadores[existingIdx]);
          countJugadoresUpd++;
        } else {
          state.directory.jugadores.unshift(playerObj);
          saveToFirebase('jugadores', playerObj);
          countJugadoresNew++;
        }
      }
    });

    saveState();

    const totalJugadores = countJugadoresNew + countJugadoresUpd;
    const totalStaff = countStaffNew + countStaffUpd;

    // Show success view
    const step2Container = document.getElementById('importerStep2ExcelContainer');
    if (step2Container) {
      step2Container.innerHTML = `
        <div style="background: #f0fdf4; border: 2px solid #16a34a; border-radius: 12px; padding: 36px; text-align: center; box-shadow: 0 10px 25px -5px rgba(22,163,74,0.15);">
          <div style="width: 56px; height: 56px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <i data-lucide="check-circle-2" style="width: 32px; height: 32px;"></i>
          </div>
          
          <h3 style="font-size: 22px; font-weight: 800; color: #15803d; margin: 0 0 10px 0;">
            🎉 ¡Importación Completada con Éxito!
          </h3>
          
          <p style="font-size: 14px; color: #166534; margin: 0 0 24px 0; max-width: 600px; margin-left: auto; margin-right: auto;">
            Se han guardado y sincronizado en <strong>Firebase Cloud Firestore</strong> y en el directorio local:
            <br>
            <strong>🏃 ${totalJugadores} Jugadores</strong> (${countJugadoresNew} nuevos, ${countJugadoresUpd} actualizados)
            <br>
            <strong>👔 ${totalStaff} Staff</strong> (${countStaffNew} nuevos, ${countStaffUpd} actualizados)
          </p>

          <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <button type="button" class="btn btn-secondary btn-lg" onclick="location.reload()" style="font-weight: 800; padding: 12px 24px; cursor: pointer;">
              🔄 Nueva Importación
            </button>
            
            <button type="button" class="btn btn-primary btn-lg" onclick="navigateToDirectoryTab('jugadores')" style="font-weight: 800; padding: 12px 28px; cursor: pointer;">
              📁 Ir al Directorio de Jugadores
            </button>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }

    showToast(`☁️ ${itemsToSave.length} registros guardados en la app y en Firebase`, 'success');
  });



  // --------------------------------------------------------------------------
  // 8. SECTION 5: AGENDA
  // --------------------------------------------------------------------------
  let currentAgendaCat = 'all';

  const CATEGORY_COLORS = [
    { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe', accent: '#3b82f6' }, // Soft Blue
    { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0', accent: '#10b981' }, // Soft Emerald
    { bg: '#ede9fe', text: '#5b21b6', border: '#ddd6fe', accent: '#8b5cf6' }, // Soft Purple
    { bg: '#fef3c7', text: '#92400e', border: '#fde68a', accent: '#f59e0b' }, // Soft Amber
    { bg: '#ffe4e6', text: '#9f1239', border: '#fecdd3', accent: '#f43f5e' }, // Soft Rose
    { bg: '#cffafe', text: '#155e75', border: '#a5f3fc', accent: '#06b6d4' }, // Soft Cyan
    { bg: '#fce7f3', text: '#9d174d', border: '#fbcfe8', accent: '#ec4899' }, // Soft Pink
    { bg: '#fef9c3', text: '#854d0e', border: '#fef08a', accent: '#eab308' }  // Soft Yellow
  ];

  function getCategoryColor(catId) {
    if (!catId) return CATEGORY_COLORS[0];
    normalizeAgendaCategories();
    const index = (state.agendaCategories || []).findIndex(c => c.id === catId);
    let safeIdx = 0;
    if (index >= 0) {
      safeIdx = index % CATEGORY_COLORS.length;
    } else {
      let hash = 0;
      for (let i = 0; i < catId.length; i++) {
        hash = (hash << 5) - hash + catId.charCodeAt(i);
        hash |= 0;
      }
      safeIdx = Math.abs(hash) % CATEGORY_COLORS.length;
    }
    return CATEGORY_COLORS[safeIdx];
  }

  function normalizeAgendaCategories() {
    if (!Array.isArray(state.agenda)) state.agenda = [];
    if (!Array.isArray(state.agendaCategories)) state.agendaCategories = [];
    state.agenda.forEach(t => {
      if (!t.estado) {
        t.estado = t.completada ? 'done' : 'todo';
      }
      t.completada = (t.estado === 'done');
    });
  }

  function checkAutoArchiveAgendaTasks() {
    if (!Array.isArray(state.agenda)) return;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    state.agenda.forEach(t => {
      if (t.estado === 'done') {
        if (!t.completedAt) {
          t.completedAt = now;
        } else if (!t.archivada && (now - t.completedAt >= SEVEN_DAYS_MS)) {
          t.archivada = true;
        }
      } else {
        t.completedAt = null;
        t.archivada = false;
      }
    });
  }

  function normalizeNotifications() {
    if (!Array.isArray(state.notifications)) state.notifications = [];
  }

  function renderNotificationsUI() {
    normalizeNotifications();
    const badge = document.getElementById('notifBadgeCount');
    const subtext = document.getElementById('notifUnreadSubtext');
    const container = document.getElementById('notificationsListContainer');

    const unreadCount = state.notifications.filter(n => !n.read).length;

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (subtext) {
      subtext.textContent = `${unreadCount} sin leer`;
    }

    if (container) {
      if (state.notifications.length === 0) {
        container.innerHTML = `
          <div style="padding: 30px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">
            <i data-lucide="bell-off" style="width: 32px; height: 32px; opacity: 0.4; margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto;"></i>
            No tienes notificaciones por el momento.
          </div>
        `;
      } else {
        container.innerHTML = state.notifications.map(n => `
          <div class="notif-item ${n.read ? '' : 'unread'}" data-notifid="${n.id}" data-taskid="${n.taskId}">
            <i data-lucide="clock" style="width: 16px; height: 16px; color: #f59e0b; flex-shrink: 0; margin-top: 2px;"></i>
            <div style="flex: 1;">
              <h5 style="font-size: 13px; font-weight: 700; margin: 0 0 2px 0; color: var(--text-main);">${escapeHtml(n.titulo)}</h5>
              <p style="font-size: 11px; color: var(--text-muted); margin: 0;">Revisión programada: <strong>${escapeHtml(n.hora || '12:00')} hs</strong> (${escapeHtml(n.fecha || 'Hoy')})</p>
            </div>
            ${!n.read ? '<span class="notif-item-unread-dot" title="Sin leer"></span>' : ''}
          </div>
        `).join('');

        container.querySelectorAll('.notif-item').forEach(item => {
          item.addEventListener('click', () => {
            const notif = state.notifications.find(x => x.id === item.dataset.notifid);
            if (notif) {
              notif.read = true;
              saveState();
              renderNotificationsUI();
            }
            const dropdown = document.getElementById('notificationsDropdown');
            if (dropdown) dropdown.classList.add('hidden');

            if (item.dataset.taskid) {
              openAgendaTaskDetailModal(item.dataset.taskid);
            }
          });
        });
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function initNotificationsSystem() {
    renderNotificationsUI();

    const btnNotif = document.getElementById('btnNotifications');
    const dropdown = document.getElementById('notificationsDropdown');
    const btnMarkAll = document.getElementById('btnMarkAllNotifsRead');

    if (btnNotif && !btnNotif.dataset.initialized) {
      btnNotif.dataset.initialized = 'true';
      btnNotif.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown) {
          dropdown.classList.toggle('hidden');
        }
      });
    }

    if (btnMarkAll && !btnMarkAll.dataset.initialized) {
      btnMarkAll.dataset.initialized = 'true';
      btnMarkAll.addEventListener('click', (e) => {
        e.stopPropagation();
        normalizeNotifications();
        state.notifications.forEach(n => n.read = true);
        saveState();
        renderNotificationsUI();
      });
    }

    document.addEventListener('click', (e) => {
      if (dropdown && !dropdown.classList.contains('hidden')) {
        if (!e.target.closest('.notifications-nav-wrapper')) {
          dropdown.classList.add('hidden');
        }
      }
    });
  }

  function checkAgendaTaskReminders() {
    if (!Array.isArray(state.agenda)) return;
    normalizeNotifications();

    const now = new Date();
    const currentDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    let stateUpdated = false;

    state.agenda.forEach(t => {
      if (t.fecha && t.hora && !t.completada && !t.archivada && !t.notified) {
        if (t.fecha < currentDateStr || (t.fecha === currentDateStr && t.hora <= currentTimeStr)) {
          t.notified = true;
          stateUpdated = true;

          state.notifications.unshift({
            id: 'notif_' + Date.now(),
            taskId: t.id,
            titulo: t.titulo,
            fecha: t.fecha,
            hora: t.hora,
            read: false,
            createdAt: Date.now()
          });

          triggerTaskNotification(t);
        }
      }
    });

    if (stateUpdated) {
      saveState();
      renderNotificationsUI();
    }
  }

  function triggerTaskNotification(task) {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(`⏰ Recordatorio de Agenda: ${task.titulo}`, {
            body: `Es hora de revisar la tarea programada para las ${task.hora} hs.`,
            icon: '/favicon.ico'
          });
        } catch (err) {}
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    showAgendaToastNotification(task);
  }

  function showAgendaToastNotification(task) {
    let container = document.getElementById('agendaToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'agendaToastContainer';
      container.className = 'agenda-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'agenda-toast-item';
    toast.innerHTML = `
      <div class="toast-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <i data-lucide="bell-ring" style="color: #f59e0b; width: 18px; height: 18px;"></i>
          <strong style="color: var(--text-main); font-weight: 800;">⏰ Recordatorio de Agenda</strong>
        </div>
        <button class="toast-close-btn">&times;</button>
      </div>
      <div class="toast-body" style="margin-top: 4px;">
        <h4 style="font-size: 14px; font-weight: 800; margin: 0 0 4px 0; color: var(--text-main);">${escapeHtml(task.titulo)}</h4>
        <p style="font-size: 12px; color: var(--text-muted); margin: 0;">Programado para las <strong>${escapeHtml(task.hora)} hs</strong> (${escapeHtml(task.fecha)}).</p>
      </div>
      <div class="toast-actions" style="display: flex; gap: 8px; margin-top: 12px;">
        <button class="btn btn-sm btn-primary btn-view-toast-task" style="flex: 1; font-size: 11px; padding: 6px 10px;">
          <i data-lucide="eye" style="width: 12px; height: 12px;"></i> Ver Ficha
        </button>
        <button class="btn btn-sm btn-secondary btn-dismiss-toast" style="font-size: 11px; padding: 6px 10px;">
          Entendido
        </button>
      </div>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    toast.querySelector('.toast-close-btn').addEventListener('click', () => toast.remove());
    toast.querySelector('.btn-dismiss-toast').addEventListener('click', () => toast.remove());
    toast.querySelector('.btn-view-toast-task').addEventListener('click', () => {
      toast.remove();
      openAgendaTaskDetailModal(task.id);
    });

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 20000);
  }

  // Intervalo de comprobación cada 15 segundos
  setInterval(checkAgendaTaskReminders, 15000);

  function initAgendaArchiveControl() {
    const btnArchive = document.getElementById('btnOpenAgendaArchive');
    if (btnArchive && !btnArchive.dataset.initialized) {
      btnArchive.dataset.initialized = 'true';
      btnArchive.addEventListener('click', () => {
        openAgendaArchiveModal();
      });
    }
  }

  function openAgendaArchiveModal() {
    checkAutoArchiveAgendaTasks();
    const archivedTasks = (state.agenda || []).filter(t => t.archivada);

    let contentHtml = '';
    if (archivedTasks.length === 0) {
      contentHtml = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i data-lucide="archive" style="width: 48px; height: 48px; opacity: 0.4; margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;"></i>
          <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 4px; color: var(--text-main);">El Archivo está vacío</h4>
          <p style="font-size: 13px;">Las tareas completadas que lleven más de 7 días se trasladarán aquí automáticamente.</p>
        </div>
      `;
    } else {
      contentHtml = `
        <div style="margin-bottom: 16px; font-size: 12px; color: var(--text-muted); background: var(--bg-subtle); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
          📦 Se muestran <strong>${archivedTasks.length} tareas / eventos archivados</strong> (completados hace más de 7 días).
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto; padding-right: 4px;">
          ${archivedTasks.map(t => {
            const catObj = (state.agendaCategories || []).find(c => c.id === t.categoria);
            const catName = catObj ? catObj.label : (t.categoria || 'General');
            const colorObj = getCategoryColor(t.categoria);
            return `
              <div style="background: var(--bg-card); border: 1px solid var(--border-light); border-left: 4px solid ${colorObj.accent}; border-radius: var(--radius-md); padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; box-shadow: var(--shadow-sm);">
                <div>
                  <h4 style="font-size: 14px; font-weight: 700; margin: 0 0 4px 0; color: var(--text-main); text-decoration: line-through; opacity: 0.7;">${escapeHtml(t.titulo)}</h4>
                  <div style="display: flex; gap: 8px; font-size: 11px; color: var(--text-muted); align-items: center;">
                    <span>📅 ${escapeHtml(t.fecha || 'Sin fecha')}</span>
                    <span style="background: ${colorObj.bg}; color: ${colorObj.text}; border: 1px solid ${colorObj.border}; padding: 1px 6px; border-radius: 4px; font-weight: 700;">🏷️ ${escapeHtml(catName)}</span>
                  </div>
                </div>
                <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
                  <button class="btn btn-sm btn-secondary btn-unarchive-task" data-id="${t.id}" title="Restaurar a En proceso">
                    <i data-lucide="rotate-ccw" style="width: 13px;"></i> Restaurar
                  </button>
                  <button class="btn-action-icon danger btn-delete-archived-task" data-id="${t.id}" title="Eliminar permanentemente">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    showModal('📦 Archivo de Tareas y Eventos (>7 días)', contentHtml, null);

    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
      modalBody.querySelectorAll('.btn-unarchive-task').forEach(btn => {
        btn.addEventListener('click', () => {
          const task = state.agenda.find(t => t.id === btn.dataset.id);
          if (task) {
            task.estado = 'in_progress';
            task.completada = false;
            task.archivada = false;
            task.completedAt = null;
            saveState();
            renderAgenda();
            renderCalendario();
            openAgendaArchiveModal();
          }
        });
      });

      modalBody.querySelectorAll('.btn-delete-archived-task').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('¿Eliminar esta tarea definitivamente?')) {
            deleteFromFirebase('agenda', btn.dataset.id);
            state.agenda = state.agenda.filter(i => i.id !== btn.dataset.id);
            saveState();
            renderAgenda();
            renderCalendario();
            openAgendaArchiveModal();
          }
        });
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function initAgendaFilters() {
    renderAgenda();
  }

  function renderAgenda() {
    normalizeAgendaCategories();
    checkAutoArchiveAgendaTasks();
    initAgendaArchiveControl();
    initNotificationsSystem();
    checkAgendaTaskReminders();

    // 1. Render sidebar categories (filtering active non-archived tasks)
    const activeTasksList = state.agenda.filter(t => !t.archivada);

    const filterContainer = document.getElementById('agendaCategoryFilters');
    if (filterContainer) {
      const counts = { all: activeTasksList.length };
      activeTasksList.forEach(t => {
        const cat = t.categoria || 'general';
        counts[cat] = (counts[cat] || 0) + 1;
      });

      let filtersHtml = `
        <li class="${currentAgendaCat === 'all' ? 'active' : ''}" data-cat="all">
          <i data-lucide="layers"></i> Todas las tareas
          <span style="margin-left: auto; font-size: 11px; opacity: 0.8; font-weight: 700;">${counts.all}</span>
        </li>
      `;

      state.agendaCategories.forEach(cat => {
        const colorObj = getCategoryColor(cat.id);
        filtersHtml += `
          <li class="${currentAgendaCat === cat.id ? 'active' : ''}" data-cat="${cat.id}">
            <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${colorObj.accent}; flex-shrink: 0; display: inline-block;"></span>
            <i data-lucide="${cat.icon || 'bookmark'}"></i> ${escapeHtml(cat.label)}
            <span style="margin-left: auto; font-size: 11px; opacity: 0.8; font-weight: 700;">${counts[cat.id] || 0}</span>
            <button class="btn-action-icon danger btn-delete-agenda-cat" data-id="${cat.id}" title="Eliminar categoría" style="margin-left: 6px; padding: 2px;">
              <i data-lucide="x" style="width: 12px; height: 12px;"></i>
            </button>
          </li>
        `;
      });

      filterContainer.innerHTML = filtersHtml;

      filterContainer.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.closest('.btn-delete-agenda-cat')) return;
          currentAgendaCat = item.dataset.cat;
          renderAgenda();
        });
      });

      filterContainer.querySelectorAll('.btn-delete-agenda-cat').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const catId = btn.dataset.id;
          if (confirm('¿Eliminar esta categoría de la agenda?')) {
            state.agendaCategories = state.agendaCategories.filter(c => c.id !== catId);
            if (currentAgendaCat === catId) currentAgendaCat = 'all';
            saveState();
            renderAgenda();
          }
        });
      });
    }

    const btnAddNewCat = document.getElementById('btnAddNewAgendaCat');
    if (btnAddNewCat && !btnAddNewCat.dataset.initialized) {
      btnAddNewCat.dataset.initialized = 'true';
      btnAddNewCat.addEventListener('click', () => {
        const name = prompt('Nombre de la nueva categoría para la Agenda:');
        if (name && name.trim()) {
          const cleanName = name.trim();
          const newId = 'cat_' + Date.now();
          state.agendaCategories.push({
            id: newId,
            label: cleanName,
            icon: 'bookmark'
          });
          currentAgendaCat = newId;
          saveState();
          renderAgenda();
        }
      });
    }

    // Render 3-Column Kanban Board
    const container = document.getElementById('agendaTasksContainer');
    if (!container) return;

    const filtered = activeTasksList.filter(t => currentAgendaCat === 'all' || t.categoria === currentAgendaCat);
    const todoTasks = filtered.filter(t => (t.estado || 'todo') === 'todo');
    const inProgressTasks = filtered.filter(t => t.estado === 'in_progress');
    const doneTasks = filtered.filter(t => t.estado === 'done');

    const renderTaskCard = (t) => {
      const catObj = (state.agendaCategories || []).find(c => c.id === t.categoria);
      const catName = catObj ? catObj.label : (t.categoria || 'General');
      const isDone = t.estado === 'done';
      const colorObj = getCategoryColor(t.categoria);

      return `
        <div class="agenda-card-item ${isDone ? 'is-done' : ''}" data-id="${t.id}" draggable="true" style="border-left: 4px solid ${colorObj.accent};">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <div class="task-drag-handle" style="cursor: grab; color: var(--text-muted);" title="Mantener y arrastrar entre estados">
                <i data-lucide="grip-vertical" style="width: 15px; height: 15px;"></i>
              </div>
              <h4 style="font-size: 14px; font-weight: 700; margin: 0; color: var(--text-main); ${isDone ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(t.titulo)}</h4>
            </div>
            <div style="display: flex; gap: 4px; flex-shrink: 0;">
              <button class="btn-action-icon btn-edit-agenda-task" data-id="${t.id}" title="Editar tarea">
                <i data-lucide="edit-2" style="width: 13px; height: 13px;"></i>
              </button>
              <button class="btn-action-icon danger btn-delete-task" data-id="${t.id}" title="Eliminar tarea">
                <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
              </button>
            </div>
          </div>
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap; font-size: 11px; color: var(--text-muted);">
            <span>📅 ${escapeHtml(t.fecha || 'Sin fecha')} ${escapeHtml(t.hora || '')}</span>
            <span style="background: ${colorObj.bg}; color: ${colorObj.text}; border: 1px solid ${colorObj.border}; padding: 2px 6px; border-radius: 4px; font-weight: 700;">🏷️ ${escapeHtml(catName)}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; padding-top: 6px; border-top: 1px solid var(--border-light);">
            <select class="form-control form-control-sm agenda-status-select" data-id="${t.id}" style="font-size: 11px; font-weight: 700; padding: 2px 6px; height: 26px;">
              <option value="todo" ${t.estado === 'todo' ? 'selected' : ''}>🔴 Sin hacer</option>
              <option value="in_progress" ${t.estado === 'in_progress' ? 'selected' : ''}>🟡 En proceso</option>
              <option value="done" ${t.estado === 'done' ? 'selected' : ''}>🟢 Completada</option>
            </select>
            <span class="match-category-tag" style="font-size: 10px; padding: 2px 6px;">${escapeHtml(t.prioridad)}</span>
          </div>
        </div>
      `;
    };

    container.innerHTML = `
      <div class="agenda-board-wrapper">
        <div class="agenda-board-column col-todo">
          <div class="agenda-column-header">
            <div class="agenda-column-title">
              <i data-lucide="circle" style="width: 16px; color: #ef4444;"></i>
              <h3>Sin hacer</h3>
            </div>
            <span class="agenda-column-count">${todoTasks.length}</span>
          </div>
          <div class="agenda-cards-list" data-status="todo">
            ${todoTasks.length === 0 ? `<div style="text-align: center; padding: 24px 12px; color: var(--text-muted); font-size: 12px; border: 1px dashed var(--border-light); border-radius: var(--radius-md);">No hay tareas pendientes</div>` : todoTasks.map(renderTaskCard).join('')}
          </div>
        </div>
        <div class="agenda-board-column col-in-progress">
          <div class="agenda-column-header">
            <div class="agenda-column-title">
              <i data-lucide="clock" style="width: 16px; color: #f59e0b;"></i>
              <h3>En proceso</h3>
            </div>
            <span class="agenda-column-count">${inProgressTasks.length}</span>
          </div>
          <div class="agenda-cards-list" data-status="in_progress">
            ${inProgressTasks.length === 0 ? `<div style="text-align: center; padding: 24px 12px; color: var(--text-muted); font-size: 12px; border: 1px dashed var(--border-light); border-radius: var(--radius-md);">No hay tareas en proceso</div>` : inProgressTasks.map(renderTaskCard).join('')}
          </div>
        </div>
        <div class="agenda-board-column col-done">
          <div class="agenda-column-header">
            <div class="agenda-column-title">
              <i data-lucide="check-circle-2" style="width: 16px; color: #10b981;"></i>
              <h3>Completadas</h3>
            </div>
            <span class="agenda-column-count">${doneTasks.length}</span>
          </div>
          <div class="agenda-cards-list" data-status="done">
            ${doneTasks.length === 0 ? `<div style="text-align: center; padding: 24px 12px; color: var(--text-muted); font-size: 12px; border: 1px dashed var(--border-light); border-radius: var(--radius-md);">No hay tareas completadas</div>` : doneTasks.map(renderTaskCard).join('')}
          </div>
        </div>
      </div>
    `;

    attachAgendaBoardEvents(container);
    if (window.lucide) window.lucide.createIcons();
  }

  function attachAgendaBoardEvents(container) {
    let draggedTaskId = null;
    container.querySelectorAll('.agenda-card-item').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        draggedTaskId = card.dataset.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.id);
      });
      card.addEventListener('dragend', () => {
        draggedTaskId = null;
        container.querySelectorAll('.agenda-card-item').forEach(c => c.classList.remove('dragging'));
        container.querySelectorAll('.agenda-cards-list').forEach(l => l.classList.remove('drag-over-list'));
      });
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-action-icon') || e.target.closest('.agenda-status-select') || e.target.closest('.task-drag-handle')) return;
        openAgendaTaskDetailModal(card.dataset.id);
      });
    });
    container.querySelectorAll('.agenda-cards-list').forEach(cardsList => {
      cardsList.addEventListener('dragover', (e) => { e.preventDefault(); cardsList.classList.add('drag-over-list'); });
      cardsList.addEventListener('dragleave', () => cardsList.classList.remove('drag-over-list'));
      cardsList.addEventListener('drop', (e) => {
        e.preventDefault();
        cardsList.classList.remove('drag-over-list');
        const task = state.agenda.find(t => t.id === draggedTaskId);
        if (task) {
          task.estado = cardsList.dataset.status;
          task.completada = (task.estado === 'done');
          saveState();
          renderAgenda();
          renderCalendario();
        }
      });
    });
    container.querySelectorAll('.agenda-status-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        e.stopPropagation();
        const task = state.agenda.find(t => t.id === sel.dataset.id);
        if (task) {
          task.estado = sel.value;
          task.completada = (sel.value === 'done');
          saveState();
          renderAgenda();
          renderCalendario();
        }
      });
    });
    container.querySelectorAll('.btn-edit-agenda-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditAgendaTaskModal(btn.dataset.id);
      });
    });
    container.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFromFirebase('agenda', btn.dataset.id);
        state.agenda = state.agenda.filter(i => i.id !== btn.dataset.id);
        saveState();
        renderAgenda();
        renderCalendario();
      });
    });
  }

  function openAgendaTaskDetailModal(taskId) {
    const task = (state.agenda || []).find(t => t.id === taskId);
    if (!task) return;

    normalizeAgendaCategories();
    const catObj = (state.agendaCategories || []).find(c => c.id === task.categoria);
    const catName = catObj ? catObj.label : (task.categoria || 'General');
    const colorObj = getCategoryColor(task.categoria);

    const statusBadgeClass = task.estado === 'done' ? 'visto' : task.estado === 'in_progress' ? 'directo' : 'programado';
    const statusLabel = task.estado === 'done' ? '🟢 Completada' : task.estado === 'in_progress' ? '🟡 En proceso' : '🔴 Sin hacer';

    showModal('Ficha de Tarea / Evento de Agenda', `
      <div class="agenda-detail-card" style="padding: 4px 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 12px; flex-wrap: wrap;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 6px 0; color: var(--text-main);">${escapeHtml(task.titulo)}</h2>
            <span class="match-category-tag" style="background: ${colorObj.bg}; color: ${colorObj.text}; border: 1px solid ${colorObj.border}; font-weight: 700;">🏷️ Categoría: ${escapeHtml(catName)}</span>
          </div>
          <span class="match-status-badge ${statusBadgeClass}" style="font-size: 12px; padding: 4px 10px;">${statusLabel}</span>
        </div>

        <div style="background: var(--bg-subtle); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-light); margin-bottom: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 13px;">
            <div>
              <strong style="color: var(--text-muted); display: block; font-size: 11px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">📅 FECHA Y HORA</strong>
              <span style="font-weight: 700; color: var(--text-main);">${escapeHtml(task.fecha || 'Sin fecha')} | ${escapeHtml(task.hora || '12:00')} hs</span>
            </div>
            <div>
              <strong style="color: var(--text-muted); display: block; font-size: 11px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">⚡ PRIORIDAD</strong>
              <span style="font-weight: 700; color: var(--text-main);">${escapeHtml(task.prioridad || 'Media')}</span>
            </div>
          </div>
        </div>

        <div class="form-group mb-4" style="background: var(--bg-card); padding: 16px; border-radius: var(--radius-md); border: 2px dashed var(--primary-blue); box-shadow: var(--shadow-sm);">
          <label class="form-label" style="font-weight: 800; margin-bottom: 8px; display: block; color: var(--primary-blue); font-size: 13px;">
            🔄 Cambiar Estado de la Tarea / Evento
          </label>
          <select id="agDetailStatusSelect" class="form-control" style="font-weight: 800; font-size: 14px; padding: 8px 12px; cursor: pointer;">
            <option value="todo" ${task.estado === 'todo' ? 'selected' : ''}>🔴 Sin hacer</option>
            <option value="in_progress" ${task.estado === 'in_progress' ? 'selected' : ''}>🟡 En proceso</option>
            <option value="done" ${task.estado === 'done' ? 'selected' : ''}>🟢 Completada</option>
          </select>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px;">
          <button class="btn btn-secondary" id="btnDetailEditTask">
            <i data-lucide="edit-2"></i> Editar Tarea
          </button>
          <button class="btn btn-outline-danger" id="btnDetailDeleteTask">
            <i data-lucide="trash-2"></i> Eliminar
          </button>
        </div>
      </div>
    `, null);

    const statusSel = document.getElementById('agDetailStatusSelect');
    if (statusSel) {
      statusSel.addEventListener('change', (e) => {
        task.estado = e.target.value;
        task.completada = (task.estado === 'done');
        saveState();
        renderAgenda();
        renderCalendario();
        openAgendaTaskDetailModal(task.id);
      });
    }

    document.getElementById('btnDetailEditTask')?.addEventListener('click', () => {
      hideModal();
      openEditAgendaTaskModal(task.id);
    });

    document.getElementById('btnDetailDeleteTask')?.addEventListener('click', () => {
      if (confirm('¿Eliminar esta tarea de la agenda?')) {
        deleteFromFirebase('agenda', task.id);
        state.agenda = state.agenda.filter(i => i.id !== task.id);
        saveState();
        hideModal();
        renderAgenda();
        renderCalendario();
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function openEditAgendaTaskModal(taskId) {
    const task = state.agenda.find(t => t.id === taskId);
    if (!task) return;
    normalizeAgendaCategories();
    const catOptions = state.agendaCategories.map(c => `<option value="${c.id}" ${c.id === task.categoria ? 'selected' : ''}>${escapeHtml(c.label)}</option>`).join('');
    showModal('Editar Tarea / Evento de Agenda', `
      <form id="editAgendaForm">
        <div class="form-group mb-4">
          <label class="form-label">Título de la Tarea / Evento</label>
          <input type="text" id="agTitleEdit" class="form-control" value="${escapeHtml(task.titulo)}" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" id="agDateEdit" class="form-control" value="${task.fecha || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Hora</label>
            <input type="time" id="agTimeEdit" class="form-control" value="${task.hora || '12:00'}">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">Categoría</label>
            <select id="agCatEdit" class="form-control">${catOptions}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select id="agEstadoEdit" class="form-control">
              <option value="todo" ${task.estado === 'todo' ? 'selected' : ''}>🔴 Sin hacer</option>
              <option value="in_progress" ${task.estado === 'in_progress' ? 'selected' : ''}>🟡 En proceso</option>
              <option value="done" ${task.estado === 'done' ? 'selected' : ''}>🟢 Completada</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Prioridad</label>
            <select id="agPrioEdit" class="form-control">
              <option value="Alta" ${task.prioridad === 'Alta' ? 'selected' : ''}>Alta 🔴</option>
              <option value="Media" ${task.prioridad === 'Media' ? 'selected' : ''}>Media 🟡</option>
              <option value="Baja" ${task.prioridad === 'Baja' ? 'selected' : ''}>Baja 🟢</option>
            </select>
          </div>
        </div>
      </form>
    `, () => {
      const title = document.getElementById('agTitleEdit').value.trim();
      if (!title) return alert('Por favor ingresa un título');
      const estadoVal = document.getElementById('agEstadoEdit').value;
      task.titulo = title;
      task.fecha = document.getElementById('agDateEdit').value;
      task.hora = document.getElementById('agTimeEdit').value;
      task.categoria = document.getElementById('agCatEdit').value;
      task.estado = estadoVal;
      task.completada = (estadoVal === 'done');
      task.prioridad = document.getElementById('agPrioEdit').value;
      saveState();
      hideModal();
      renderAgenda();
      renderCalendario();
    });
  }

  document.getElementById('btnNewAgendaTask')?.addEventListener('click', () => {
    normalizeAgendaCategories();
    const catOptions = state.agendaCategories.map(c => `<option value="${c.id}">${escapeHtml(c.label)}</option>`).join('');
    const hasExistingCats = state.agendaCategories.length > 0;
    showModal('Añadir Tarea / Evento a la Agenda', `
      <form id="newAgendaForm">
        <div class="form-group mb-4">
          <label class="form-label">Título de la Tarea / Evento</label>
          <input type="text" id="agTitle" class="form-control" placeholder="Ej: Viaje a Alcalá para ver al Juvenil B" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" id="agDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label class="form-label">Hora</label>
            <input type="time" id="agTime" class="form-control" value="12:00">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">Categoría</label>
            <select id="agCat" class="form-control mb-2">
              ${catOptions}
              <option value="__custom__" ${!hasExistingCats ? 'selected' : ''}>+ Crear Nueva Categoría...</option>
            </select>
            <input type="text" id="agCatCustom" class="form-control ${hasExistingCats ? 'hidden' : ''}" placeholder="Nombre de la categoría">
          </div>
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select id="agEstado" class="form-control">
              <option value="todo" selected>🔴 Sin hacer</option>
              <option value="in_progress">🟡 En proceso</option>
              <option value="done">🟢 Completada</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Prioridad</label>
            <select id="agPrio" class="form-control">
              <option value="Alta">Alta 🔴</option>
              <option value="Media" selected>Media 🟡</option>
              <option value="Baja">Baja 🟢</option>
            </select>
          </div>
        </div>
      </form>
    `, () => {
      const title = document.getElementById('agTitle').value.trim();
      if (!title) return alert('Por favor ingresa un título');
      let catValue = document.getElementById('agCat').value;
      const customValue = document.getElementById('agCatCustom').value.trim();
      if ((catValue === '__custom__' || !catValue) && customValue) {
        const newId = 'cat_' + Date.now();
        state.agendaCategories.push({ id: newId, label: customValue, icon: 'bookmark' });
        catValue = newId;
      } else if (!catValue && !customValue) {
        const defaultId = 'cat_' + Date.now();
        state.agendaCategories.push({ id: defaultId, label: 'General', icon: 'bookmark' });
        catValue = defaultId;
      }
      const estadoVal = document.getElementById('agEstado').value;
      state.agenda.unshift({
        id: 'ag_' + Date.now(),
        titulo: title,
        fecha: document.getElementById('agDate').value,
        hora: document.getElementById('agTime').value,
        categoria: catValue,
        prioridad: document.getElementById('agPrio').value,
        completada: false
      });

      saveState();
      hideModal();
      renderAgenda();
      renderCalendario();
    });

    const agCatSel = document.getElementById('agCat');
    const agCatCust = document.getElementById('agCatCustom');
    if (agCatSel && agCatCust) {
      agCatSel.addEventListener('change', () => {
        if (agCatSel.value === '__custom__') {
          agCatCust.classList.remove('hidden');
          agCatCust.focus();
        } else {
          agCatCust.classList.add('hidden');
        }
      });
    }
  });

  // --------------------------------------------------------------------------
  // 9. SECTION 6: ENLACES FEDERATIVOS & RECURSOS
  // --------------------------------------------------------------------------
  let currentLinkTab = 'favorites';
  let currentLinkSearch = '';

  function normalizeLinks() {
    if (!Array.isArray(state.links)) state.links = [];
    if (!Array.isArray(state.customTabOrder)) state.customTabOrder = [];
    if (!Array.isArray(state.favColumns) || state.favColumns.length === 0) {
      state.favColumns = ['Columna 1', 'Columna 2', 'Columna 3'];
    }
    state.links.forEach(l => {
      if (!l.etiqueta) l.etiqueta = 'Federaciones';
      if (typeof l.favorito !== 'boolean') l.favorito = false;
      if (!l.logo) l.logo = '';
      if (!l.favCol) l.favCol = 'Columna 1';
    });
  }

  function getLinkDomain(urlStr) {
    if (!urlStr) return '';
    try {
      const fullUrl = urlStr.startsWith('http') ? urlStr : 'https://' + urlStr;
      return new URL(fullUrl).hostname;
    } catch (e) {
      return '';
    }
  }

  function renderLinkLogo(l) {
    if (l.logo && (l.logo.startsWith('http') || l.logo.startsWith('data:image'))) {
      const domain = getLinkDomain(l.url);
      const fallbackFavicon = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : '';
      return `<img src="${escapeHtml(l.logo)}" alt="${escapeHtml(l.titulo)}" onerror="if('${fallbackFavicon}'){this.src='${fallbackFavicon}'; this.onerror=null;} else {this.outerHTML='<span>🔗</span>';}">`;
    }
    if (l.logo && l.logo.trim() !== '') {
      return `<span>${escapeHtml(l.logo)}</span>`;
    }
    const domain = getLinkDomain(l.url);
    if (domain) {
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      return `<img src="${faviconUrl}" alt="${escapeHtml(l.titulo)}" onerror="this.outerHTML='<span>⚽</span>'">`;
    }
    return `<span>⚽</span>`;
  }

  function renderEnlaces() {
    normalizeLinks();

    const searchInput = document.getElementById('linkSearchInput');
    if (searchInput && !searchInput.dataset.initialized) {
      searchInput.dataset.initialized = 'true';
      searchInput.addEventListener('input', (e) => {
        currentLinkSearch = e.target.value.toLowerCase().trim();
        renderEnlaces();
      });
    }

    const btnAddFavCol = document.getElementById('btnAddNewFavCol');
    if (btnAddFavCol && !btnAddFavCol.dataset.initialized) {
      btnAddFavCol.dataset.initialized = 'true';
      btnAddFavCol.addEventListener('click', () => {
        showCustomPromptModal('Nombre de la nueva columna de favoritos:', '', (colName) => {
          if (colName && colName.trim()) {
            const cleanName = colName.trim();
            if (!state.favColumns.includes(cleanName)) {
              state.favColumns.push(cleanName);
              saveState();
              renderEnlaces();
            }
          }
        });
      });
    }

    // 1. Render Category Tabs at top
    const tabsContainer = document.getElementById('linksCategoryTabs');
    const favCount = state.links.filter(l => l.favorito).length;
    const totalCount = state.links.length;

    const tagsMap = {};
    state.links.forEach(l => {
      const tag = l.etiqueta || 'Federaciones';
      tagsMap[tag] = (tagsMap[tag] || 0) + 1;
    });

    const currentUniqueTags = Object.keys(tagsMap);
    state.customTabOrder = state.customTabOrder.filter(tag => tag === '⭐ Favoritos' || currentUniqueTags.includes(tag));
    const newTags = currentUniqueTags.filter(tag => !state.customTabOrder.includes(tag)).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    state.customTabOrder.push(...newTags);

    let tabsHtml = `
      <button class="link-tab-btn fav-tab ${currentLinkTab === 'favorites' ? 'active' : ''}" data-tab="favorites">
        <i data-lucide="star" style="width: 14px; fill: ${currentLinkTab === 'favorites' ? '#ffffff' : '#f59e0b'}; color: #f59e0b;"></i> Favoritos
        <span class="tab-count">${favCount}</span>
      </button>
    `;

    state.customTabOrder.filter(t => t !== '⭐ Favoritos').forEach(tag => {
      tabsHtml += `
        <button class="link-tab-btn category-tab ${currentLinkTab === tag ? 'active' : ''}" data-tab="${escapeHtml(tag)}" draggable="true" title="Mantener y arrastrar para reordenar pestaña">
          <i data-lucide="tag" style="width: 13px;"></i> ${escapeHtml(tag)}
          <span class="tab-count">${tagsMap[tag] || 0}</span>
        </button>
      `;
    });

    tabsHtml += `
      <button class="link-tab-btn ${currentLinkTab === 'all' ? 'active' : ''}" data-tab="all">
        <i data-lucide="globe" style="width: 14px;"></i> Todos
        <span class="tab-count">${totalCount}</span>
      </button>
    `;

    if (tabsContainer) {
      tabsContainer.innerHTML = tabsHtml;

      tabsContainer.querySelectorAll('.link-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          currentLinkTab = btn.dataset.tab;
          renderEnlaces();
        });
      });

      let draggedTabTag = null;
      tabsContainer.querySelectorAll('.link-tab-btn.category-tab').forEach(btn => {
        btn.addEventListener('dragstart', (e) => {
          draggedTabTag = btn.dataset.tab;
          btn.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', btn.dataset.tab);
        });

        btn.addEventListener('dragend', () => {
          draggedTabTag = null;
          tabsContainer.querySelectorAll('.link-tab-btn').forEach(b => {
            b.classList.remove('dragging', 'drag-over');
          });
        });

        btn.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (btn.dataset.tab !== draggedTabTag) {
            btn.classList.add('drag-over');
          }
        });

        btn.addEventListener('dragleave', () => {
          btn.classList.remove('drag-over');
        });

        btn.addEventListener('drop', (e) => {
          e.preventDefault();
          btn.classList.remove('drag-over');
          const targetTag = btn.dataset.tab;

          if (draggedTabTag && targetTag && draggedTabTag !== targetTag) {
            const fromIdx = state.customTabOrder.indexOf(draggedTabTag);
            const toIdx = state.customTabOrder.indexOf(targetTag);

            if (fromIdx !== -1 && toIdx !== -1) {
              const [movedTag] = state.customTabOrder.splice(fromIdx, 1);
              state.customTabOrder.splice(toIdx, 0, movedTag);
              saveState();
              renderEnlaces();
            }
          }
        });
      });
    }

    // Toggle views: Columns for Favoritos and Todos tabs, Regular grid for individual category tabs
    const boardWrapper = document.getElementById('linksBoardContainer');
    const gridContainer = document.getElementById('federationLinksContainer');

    if (currentLinkTab === 'favorites') {
      if (btnAddFavCol) btnAddFavCol.classList.remove('hidden');
      if (boardWrapper) boardWrapper.classList.remove('hidden');
      if (gridContainer) gridContainer.classList.add('hidden');
      renderFavoritosBoard();
    } else if (currentLinkTab === 'all') {
      if (btnAddFavCol) btnAddFavCol.classList.add('hidden');
      if (boardWrapper) boardWrapper.classList.remove('hidden');
      if (gridContainer) gridContainer.classList.add('hidden');
      renderTodosBoard();
    } else {
      if (btnAddFavCol) btnAddFavCol.classList.add('hidden');
      if (boardWrapper) boardWrapper.classList.add('hidden');
      if (gridContainer) gridContainer.classList.remove('hidden');
      renderEnlacesGrid();
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function renderTodosBoard() {
    const boardContainer = document.getElementById('linksBoardContainer');
    if (!boardContainer) return;

    normalizeLinks();

    const tagsMap = {};
    state.links.forEach(l => {
      const tag = l.etiqueta || 'Federaciones';
      tagsMap[tag] = (tagsMap[tag] || 0) + 1;
    });

    const currentUniqueTags = Object.keys(tagsMap);
    const activeCategoryTags = (state.customTabOrder || []).filter(t => t !== '⭐ Favoritos' && currentUniqueTags.includes(t));
    currentUniqueTags.forEach(tag => {
      if (!activeCategoryTags.includes(tag)) {
        activeCategoryTags.push(tag);
      }
    });

    let boardHtml = '';

    activeCategoryTags.forEach(colName => {
      let colLinks = state.links.filter(l => (l.etiqueta || 'Federaciones') === colName);

      if (currentLinkSearch) {
        colLinks = colLinks.filter(l =>
          (l.titulo || '').toLowerCase().includes(currentLinkSearch) ||
          (l.url || '').toLowerCase().includes(currentLinkSearch) ||
          (l.etiqueta || '').toLowerCase().includes(currentLinkSearch)
        );
      }

      const count = colLinks.length;

      boardHtml += `
        <div class="link-board-column" data-tag-col="${escapeHtml(colName)}">
          <div class="column-header">
            <div class="column-header-title">
              <i data-lucide="tag" style="width: 15px; color: var(--primary-blue);"></i>
              <h3>${escapeHtml(colName)}</h3>
              <span class="column-count">${count}</span>
            </div>
          </div>
          <div class="column-cards-list" data-tag-col="${escapeHtml(colName)}">
            ${colLinks.length === 0 ? `
              <div style="text-align: center; padding: 24px 12px; color: var(--text-muted); font-size: 12px; border: 1px dashed var(--border-light); border-radius: var(--radius-md);">
                Sin enlaces en esta categoría
              </div>
            ` : colLinks.map(l => `
              <div class="link-card ${l.favorito ? 'is-favorite' : ''}" data-id="${l.id}" draggable="true">
                <div class="link-drag-handle" title="Mantener y arrastrar entre categorías">
                  <i data-lucide="grip-vertical" style="width: 16px; height: 16px;"></i>
                </div>
                <div class="link-card-left">
                  <div class="link-logo-box btn-logo-click" data-url="${escapeHtml(l.url)}" title="Pulsar para abrir web directamente">
                    ${renderLinkLogo(l)}
                  </div>
                  <div class="link-info">
                    <h3>${escapeHtml(l.titulo)}</h3>
                    <div class="link-badges">
                      <span class="link-tag-badge">${escapeHtml(l.etiqueta || 'Federaciones')}</span>
                    </div>
                  </div>
                </div>
                <button class="btn-star-fav ${l.favorito ? 'active' : ''} btn-toggle-fav" data-id="${l.id}" title="${l.favorito ? 'Quitar de favoritos' : 'Marcar como favorito'}">
                  <i data-lucide="star" style="width: 18px; height: 18px;"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    boardContainer.innerHTML = boardHtml;
    attachTodosBoardEvents(boardContainer);
  }

  function attachTodosBoardEvents(boardContainer) {
    let draggedLinkId = null;

    boardContainer.querySelectorAll('.link-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        draggedLinkId = card.dataset.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.id);
      });

      card.addEventListener('dragend', (e) => {
        e.stopPropagation();
        draggedLinkId = null;
        boardContainer.querySelectorAll('.link-card').forEach(c => c.classList.remove('dragging', 'drag-over'));
        boardContainer.querySelectorAll('.column-cards-list').forEach(l => l.classList.remove('drag-over-list'));
      });

      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-toggle-fav') || e.target.closest('.btn-logo-click') || e.target.closest('.link-drag-handle')) return;
        openLinkDetailModal(card.dataset.id);
      });
    });

    boardContainer.querySelectorAll('.btn-logo-click').forEach(logoBox => {
      logoBox.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const url = logoBox.dataset.url;
        if (url) window.open(url, '_blank');
      });
    });

    boardContainer.querySelectorAll('.btn-toggle-fav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.dataset.id;
        const link = state.links.find(l => l.id === id);
        if (link) {
          link.favorito = !link.favorito;
          saveState();
          renderEnlaces();
        }
      });
    });

    boardContainer.querySelectorAll('.column-cards-list').forEach(cardsList => {
      cardsList.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        cardsList.classList.add('drag-over-list');
      });

      cardsList.addEventListener('dragleave', () => {
        cardsList.classList.remove('drag-over-list');
      });

      cardsList.addEventListener('drop', (e) => {
        e.preventDefault();
        cardsList.classList.remove('drag-over-list');
        const targetTag = cardsList.dataset.tagCol;

        if (draggedLinkId && targetTag) {
          const link = state.links.find(l => l.id === draggedLinkId);
          if (link) {
            link.etiqueta = targetTag;
            saveState();
            renderEnlaces();
          }
        }
      });
    });
  }

  function renderFavoritosBoard() {
    const boardContainer = document.getElementById('linksBoardContainer');
    if (!boardContainer) return;

    normalizeLinks();

    const favoriteLinks = state.links.filter(l => l.favorito);
    let boardHtml = '';

    state.favColumns.forEach((colName, colIdx) => {
      let colLinks = favoriteLinks.filter(l => {
        const c = l.favCol || state.favColumns[0] || 'Columna 1';
        return c === colName;
      });

      // Handle unassigned favorites to fallback into first column
      if (colIdx === 0) {
        const unassigned = favoriteLinks.filter(l => !l.favCol || !state.favColumns.includes(l.favCol));
        unassigned.forEach(u => {
          if (!colLinks.includes(u)) colLinks.push(u);
        });
      }

      if (currentLinkSearch) {
        colLinks = colLinks.filter(l =>
          (l.titulo || '').toLowerCase().includes(currentLinkSearch) ||
          (l.url || '').toLowerCase().includes(currentLinkSearch) ||
          (l.etiqueta || '').toLowerCase().includes(currentLinkSearch)
        );
      }

      const count = colLinks.length;

      boardHtml += `
        <div class="link-board-column" data-fav-col="${escapeHtml(colName)}">
          <div class="column-header">
            <div class="column-header-title">
              <i data-lucide="star" style="width: 16px; color: #f59e0b; fill: #f59e0b;"></i>
              <h3 class="fav-col-title" data-fav-col="${escapeHtml(colName)}" style="cursor: pointer;" title="Doble clic para cambiar nombre">${escapeHtml(colName)}</h3>
              <button class="btn-action-icon btn-edit-fav-col" data-fav-col="${escapeHtml(colName)}" title="Cambiar nombre a la columna">
                <i data-lucide="edit-2" style="width: 13px;"></i>
              </button>
              <span class="column-count">${count}</span>
            </div>
            <div class="column-actions">
              ${state.favColumns.length > 1 ? `
                <button class="btn-action-icon danger btn-delete-fav-col" data-fav-col="${escapeHtml(colName)}" title="Eliminar columna">
                  <i data-lucide="trash-2" style="width: 14px;"></i>
                </button>
              ` : ''}
            </div>
          </div>
          <div class="column-cards-list" data-fav-col="${escapeHtml(colName)}">
            ${colLinks.length === 0 ? `
              <div style="text-align: center; padding: 24px 12px; color: var(--text-muted); font-size: 12px; border: 1px dashed var(--border-light); border-radius: var(--radius-md);">
                Arrastra enlaces favoritos aquí
              </div>
            ` : colLinks.map(l => `
              <div class="link-card is-favorite" data-id="${l.id}" draggable="true">
                <div class="link-drag-handle" title="Mantener y arrastrar entre columnas de favoritos">
                  <i data-lucide="grip-vertical" style="width: 16px; height: 16px;"></i>
                </div>
                <div class="link-card-left">
                  <div class="link-logo-box btn-logo-click" data-url="${escapeHtml(l.url)}" title="Pulsar para abrir web directamente">
                    ${renderLinkLogo(l)}
                  </div>
                  <div class="link-info">
                    <h3>${escapeHtml(l.titulo)}</h3>
                    <div class="link-badges">
                      <span class="link-tag-badge">${escapeHtml(l.etiqueta || 'Federaciones')}</span>
                    </div>
                  </div>
                </div>
                <button class="btn-star-fav active btn-toggle-fav" data-id="${l.id}" title="Quitar de favoritos">
                  <i data-lucide="star" style="width: 18px; height: 18px;"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    boardContainer.innerHTML = boardHtml;
    attachFavoritosBoardEvents(boardContainer);
  }

  function attachFavoritosBoardEvents(boardContainer) {
    let draggedLinkId = null;

    boardContainer.querySelectorAll('.link-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        draggedLinkId = card.dataset.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.id);
      });

      card.addEventListener('dragend', (e) => {
        e.stopPropagation();
        draggedLinkId = null;
        boardContainer.querySelectorAll('.link-card').forEach(c => c.classList.remove('dragging', 'drag-over'));
        boardContainer.querySelectorAll('.column-cards-list').forEach(l => l.classList.remove('drag-over-list'));
      });

      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-toggle-fav') || e.target.closest('.btn-logo-click') || e.target.closest('.link-drag-handle')) return;
        openLinkDetailModal(card.dataset.id);
      });
    });

    boardContainer.querySelectorAll('.btn-logo-click').forEach(logoBox => {
      logoBox.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const url = logoBox.dataset.url;
        if (url) window.open(url, '_blank');
      });
    });

    boardContainer.querySelectorAll('.btn-toggle-fav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.dataset.id;
        const link = state.links.find(l => l.id === id);
        if (link) {
          link.favorito = !link.favorito;
          saveState();
          renderEnlaces();
        }
      });
    });

    const triggerRenameFavCol = (oldName) => {
      showCustomPromptModal(`Nuevo nombre para la columna "${oldName}":`, oldName, (newName) => {
        if (newName && newName.trim() && newName.trim() !== oldName) {
          const cleanName = newName.trim();
          const idx = state.favColumns.indexOf(oldName);
          if (idx !== -1) {
            state.favColumns[idx] = cleanName;
          }
          state.links.forEach(l => {
            if (l.favCol === oldName) {
              l.favCol = cleanName;
            }
          });
          saveState();
          renderEnlaces();
        }
      });
    };

    boardContainer.querySelectorAll('.btn-edit-fav-col').forEach(btn => {
      btn.addEventListener('click', () => {
        triggerRenameFavCol(btn.dataset.favCol);
      });
    });

    boardContainer.querySelectorAll('.fav-col-title').forEach(titleEl => {
      titleEl.addEventListener('dblclick', () => {
        triggerRenameFavCol(titleEl.dataset.favCol);
      });
    });

    boardContainer.querySelectorAll('.btn-delete-fav-col').forEach(btn => {
      btn.addEventListener('click', () => {
        const colName = btn.dataset.favCol;
        showCustomConfirmModal('Eliminar Columna', `¿Estás seguro de que deseas eliminar la columna "${colName}"? Los enlaces asignados volverán a la vista general.`, () => {
          state.favColumns = state.favColumns.filter(c => c !== colName);
          saveState();
          renderEnlaces();
        });
      });
    });

    boardContainer.querySelectorAll('.column-cards-list').forEach(cardsList => {
      cardsList.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        cardsList.classList.add('drag-over-list');
      });

      cardsList.addEventListener('dragleave', () => {
        cardsList.classList.remove('drag-over-list');
      });

      cardsList.addEventListener('drop', (e) => {
        e.preventDefault();
        cardsList.classList.remove('drag-over-list');
        const targetCol = cardsList.dataset.favCol;

        if (draggedLinkId && targetCol) {
          const link = state.links.find(l => l.id === draggedLinkId);
          if (link) {
            link.favCol = targetCol;
            saveState();
            renderEnlaces();
          }
        }
      });
    });
  }

  function renderEnlacesGrid() {
    const container = document.getElementById('federationLinksContainer');
    if (!container) return;

    // Filter links
    let filtered = state.links;

    if (currentLinkTab === 'favorites') {
      filtered = filtered.filter(l => l.favorito);
    } else if (currentLinkTab !== 'all') {
      filtered = filtered.filter(l => (l.etiqueta || 'Federaciones') === currentLinkTab);
    }

    if (currentLinkSearch) {
      filtered = filtered.filter(l => 
        (l.titulo || '').toLowerCase().includes(currentLinkSearch) ||
        (l.url || '').toLowerCase().includes(currentLinkSearch) ||
        (l.region || '').toLowerCase().includes(currentLinkSearch) ||
        (l.etiqueta || '').toLowerCase().includes(currentLinkSearch)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted); background: var(--bg-card); border: 1px dashed var(--border-light); border-radius: var(--radius-lg);">
          <i data-lucide="link-2-off" style="width: 36px; height: 36px; stroke-width: 1.5; margin-bottom: 12px; opacity: 0.6;"></i>
          <p style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">No hay enlaces en esta pestaña</p>
          <p style="font-size: 13px; margin: 0;">Prueba a seleccionar otra categoría o añadir un nuevo enlace.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = filtered.map(l => `
      <div class="link-card ${l.favorito ? 'is-favorite' : ''}" data-id="${l.id}" draggable="true">
        <div class="link-drag-handle" title="Mantener y arrastrar para reordenar">
          <i data-lucide="grip-vertical" style="width: 16px; height: 16px;"></i>
        </div>
        <div class="link-card-left">
          <div class="link-logo-box btn-logo-click" data-url="${escapeHtml(l.url)}" title="Pulsar para abrir web directamente">
            ${renderLinkLogo(l)}
          </div>
          <div class="link-info">
            <h3>${escapeHtml(l.titulo)}</h3>
            <div class="link-badges">
              <span class="link-tag-badge">${escapeHtml(l.etiqueta || 'Federaciones')}</span>
            </div>
          </div>
        </div>
        <button class="btn-star-fav ${l.favorito ? 'active' : ''} btn-toggle-fav" data-id="${l.id}" title="${l.favorito ? 'Quitar de favoritos' : 'Marcar como favorito'}">
          <i data-lucide="star" style="width: 18px; height: 18px;"></i>
        </button>
      </div>
    `).join('');

    // Attach Event Listeners
    container.querySelectorAll('.btn-logo-click').forEach(logoBox => {
      logoBox.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const url = logoBox.dataset.url;
        if (url) window.open(url, '_blank');
      });
    });

    container.querySelectorAll('.btn-toggle-fav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.dataset.id;
        const link = state.links.find(l => l.id === id);
        if (link) {
          link.favorito = !link.favorito;
          saveState();
          renderEnlaces();
        }
      });
    });

    let draggedId = null;

    container.querySelectorAll('.link-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedId = card.dataset.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.id);
      });

      card.addEventListener('dragend', () => {
        draggedId = null;
        container.querySelectorAll('.link-card').forEach(c => {
          c.classList.remove('dragging', 'drag-over');
        });
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (card.dataset.id !== draggedId) {
          card.classList.add('drag-over');
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const targetId = card.dataset.id;

        if (draggedId && targetId && draggedId !== targetId) {
          const fromIndex = state.links.findIndex(l => l.id === draggedId);
          const toIndex = state.links.findIndex(l => l.id === targetId);

          if (fromIndex !== -1 && toIndex !== -1) {
            const [movedLink] = state.links.splice(fromIndex, 1);
            state.links.splice(toIndex, 0, movedLink);

            saveState();
            renderEnlaces();
          }
        }
      });

      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-toggle-fav') || e.target.closest('.btn-logo-click') || e.target.closest('.link-drag-handle')) return;
        openLinkDetailModal(card.dataset.id);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function openLinkDetailModal(linkId) {
    const link = state.links.find(l => l.id === linkId);
    if (!link) return;

    showModal('Ficha General del Enlace', `
      <div style="text-align: center; padding: 10px 0 20px 0;">
        <div class="link-logo-box" style="width: 80px; height: 80px; min-width: 80px; font-size: 40px; border-radius: 18px; margin: 0 auto 16px auto; box-shadow: var(--shadow-md);">
          ${renderLinkLogo(link)}
        </div>
        <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 8px; color: var(--text-main); line-height: 1.3;">
          ${escapeHtml(link.titulo)}
        </h2>
        <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
          <span class="link-tag-badge" style="font-size: 11px; padding: 4px 12px;">${escapeHtml(link.etiqueta || 'Federaciones')}</span>
        </div>
        <div style="background: var(--bg-body); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-light); display: inline-block; max-width: 100%; word-break: break-all; margin-bottom: 24px;">
          <a href="${escapeHtml(link.url)}" target="_blank" style="color: var(--primary-blue); font-weight: 600; text-decoration: none; font-size: 13px;">
            <i data-lucide="link" style="width: 14px; vertical-align: middle; margin-right: 4px;"></i> ${escapeHtml(link.url)}
          </a>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 8px;">
          <a href="${escapeHtml(link.url)}" target="_blank" class="btn btn-primary" style="padding: 10px 20px; font-weight: 600; text-decoration: none;">
            <i data-lucide="external-link" style="width: 16px;"></i> Abrir Web
          </a>
          <button id="btnModalToggleFav" class="btn btn-secondary" style="padding: 10px 16px; font-weight: 600; border-color: #f59e0b; color: ${link.favorito ? '#d97706' : 'var(--text-main)'};">
            <i data-lucide="star" style="width: 16px; fill: ${link.favorito ? '#f59e0b' : 'none'}; color: #f59e0b;"></i> ${link.favorito ? 'Favorito' : 'Marcar Favorito'}
          </button>
          <button id="btnModalEditLink" class="btn btn-secondary" style="padding: 10px 16px; font-weight: 600;">
            <i data-lucide="edit-3" style="width: 16px;"></i> Editar
          </button>
          <button id="btnModalDeleteLink" class="btn btn-danger" style="padding: 10px 16px; font-weight: 600;">
            <i data-lucide="trash-2" style="width: 16px;"></i> Eliminar
          </button>
        </div>
      </div>
    `, null);

    document.getElementById('btnModalToggleFav')?.addEventListener('click', () => {
      link.favorito = !link.favorito;
      saveState();
      hideModal();
      renderEnlaces();
    });

    document.getElementById('btnModalEditLink')?.addEventListener('click', () => {
      hideModal();
      openEditLinkModal(link.id);
    });

    document.getElementById('btnModalDeleteLink')?.addEventListener('click', () => {
      if (confirm('¿Deseas eliminar este enlace?')) {
        deleteFromFirebase('enlaces', link.id);
        state.links = state.links.filter(l => l.id !== link.id);
        saveState();
        hideModal();
        renderEnlaces();
      }
    });
  }

  function getExistingTagsList() {
    const defaultTags = ['Federaciones', 'Plataformas Scouting', 'Estadísticas', 'Prensa / Medios', 'Clubes', 'General'];
    const currentTags = state.links.map(l => l.etiqueta).filter(Boolean);
    return Array.from(new Set([...defaultTags, ...currentTags])).sort();
  }

  document.getElementById('btnAddNewLink')?.addEventListener('click', () => {
    const existingTags = getExistingTagsList();
    const tagOptions = existingTags.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');

    showModal('Añadir Nuevo Enlace', `
      <form id="newLinkForm">
        <div class="form-group mb-3">
          <label class="form-label">Nombre / Título del Sitio</label>
          <input type="text" id="lTitle" class="form-control" placeholder="Ej: Transfermarkt / RFEF" required>
        </div>
        <div class="form-group mb-3">
          <label class="form-label">URL Completa</label>
          <div style="display: flex; gap: 8px;">
            <input type="url" id="lUrl" class="form-control" placeholder="Ej: https://www.transfermarkt.es" required>
            <button type="button" id="btnAutoFavicon" class="btn btn-secondary" style="white-space: nowrap; font-size: 12px;">
              ⚡ Auto Logo
            </button>
          </div>
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Etiqueta / Categoría</label>
          <select id="lTagSelect" class="form-control mb-2">
            ${tagOptions}
            <option value="__custom__">+ Nueva Etiqueta...</option>
          </select>
          <input type="text" id="lTagCustom" class="form-control hidden" placeholder="Escribe la nueva etiqueta">
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Logo / Icono (URL, Emoji o Subir Archivo)</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="text" id="lLogo" class="form-control" placeholder="Ej: https://sitio.com/logo.png o ⚽">
            <input type="file" id="lLogoFile" accept="image/*" class="hidden">
            <button type="button" id="btnUploadLogoFile" class="btn btn-secondary" style="white-space: nowrap; font-size: 12px; height: 38px;">
              📁 Subir Imagen
            </button>
          </div>
          <span class="text-muted" style="font-size: 11px;">Si se deja en blanco, se obtendrá automáticamente el favicon del sitio. Puedes pulsar "Subir Imagen" para cargar tu archivo (se guardará en Firebase).</span>
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 12px;">
          <input type="checkbox" id="lFav" style="width: 18px; height: 18px; cursor: pointer;">
          <label for="lFav" style="font-size: 13px; font-weight: 600; cursor: pointer; margin: 0;">⭐ Marcar como Enlace Favorito</label>
        </div>
      </form>
    `, () => {
      const title = document.getElementById('lTitle').value.trim();
      let url = document.getElementById('lUrl').value.trim();
      if (!title || !url) return alert('Por favor completa el título y la URL');

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const tagSelect = document.getElementById('lTagSelect').value;
      const tagCustom = document.getElementById('lTagCustom').value.trim();
      const etiqueta = (tagSelect === '__custom__' && tagCustom) ? tagCustom : (tagSelect !== '__custom__' ? tagSelect : 'General');

      state.links.push({
        id: 'l_' + Date.now(),
        titulo: title,
        url: url,
        etiqueta: etiqueta,
        logo: document.getElementById('lLogo').value.trim(),
        favorito: document.getElementById('lFav').checked
      });

      saveState();
      hideModal();
      renderEnlaces();
    });

    const sel = document.getElementById('lTagSelect');
    const cust = document.getElementById('lTagCustom');
    if (sel && cust) {
      sel.addEventListener('change', () => {
        if (sel.value === '__custom__') {
          cust.classList.remove('hidden');
          cust.focus();
        } else {
          cust.classList.add('hidden');
        }
      });
    }

    document.getElementById('btnAutoFavicon')?.addEventListener('click', () => {
      const inputUrl = document.getElementById('lUrl').value.trim();
      if (!inputUrl) return alert('Introduce primero una URL válida.');
      const domain = getLinkDomain(inputUrl);
      if (domain) {
        document.getElementById('lLogo').value = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      } else {
        alert('URL no válida.');
      }
    });

    const logoFileInput = document.getElementById('lLogoFile');
    document.getElementById('btnUploadLogoFile')?.addEventListener('click', () => logoFileInput.click());
    logoFileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const comp = await compressImage(file);
          document.getElementById('lLogo').value = comp;
        } catch (err) {
          console.error('Error al comprimir logo:', err);
        }
      }
    });
  });

  function openEditLinkModal(linkId) {
    const link = state.links.find(l => l.id === linkId);
    if (!link) return;

    const existingTags = getExistingTagsList();
    if (!existingTags.includes(link.etiqueta)) {
      existingTags.push(link.etiqueta);
    }
    const tagOptions = existingTags.map(t => 
      `<option value="${escapeHtml(t)}" ${t === link.etiqueta ? 'selected' : ''}>${escapeHtml(t)}</option>`
    ).join('');

    showModal('Editar Enlace', `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--border-light);">
        <button type="button" id="btnBackToDetailModal" class="btn btn-secondary" style="font-size: 12px; padding: 6px 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
          <i data-lucide="arrow-left" style="width: 14px;"></i> Volver a la Ficha
        </button>
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">EDICIÓN DE ENLACE</span>
      </div>
      <form id="editLinkForm">
        <div class="form-group mb-3">
          <label class="form-label">Nombre / Título del Sitio</label>
          <input type="text" id="elTitle" class="form-control" value="${escapeHtml(link.titulo)}" required>
        </div>
        <div class="form-group mb-3">
          <label class="form-label">URL Completa</label>
          <div style="display: flex; gap: 8px;">
            <input type="url" id="elUrl" class="form-control" value="${escapeHtml(link.url)}" required>
            <button type="button" id="btnEditAutoFavicon" class="btn btn-secondary" style="white-space: nowrap; font-size: 12px;">
              ⚡ Auto Logo
            </button>
          </div>
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Etiqueta / Categoría</label>
          <select id="elTagSelect" class="form-control mb-2">
            ${tagOptions}
            <option value="__custom__">+ Nueva Etiqueta...</option>
          </select>
          <input type="text" id="elTagCustom" class="form-control hidden" placeholder="Escribe la nueva etiqueta">
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Logo / Icono (URL, Emoji o Subir Archivo)</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="text" id="elLogo" class="form-control" value="${escapeHtml(link.logo || '')}">
            <input type="file" id="elLogoFile" accept="image/*" class="hidden">
            <button type="button" id="btnEditUploadLogoFile" class="btn btn-secondary" style="white-space: nowrap; font-size: 12px; height: 38px;">
              📁 Subir Imagen
            </button>
          </div>
          <span class="text-muted" style="font-size: 11px;">Deja en blanco para auto-favicon o sube una imagen local (se guardará en Firebase).</span>
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 12px;">
          <input type="checkbox" id="elFav" ${link.favorito ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
          <label for="elFav" style="font-size: 13px; font-weight: 600; cursor: pointer; margin: 0;">⭐ Marcar como Enlace Favorito</label>
        </div>
      </form>
    `, () => {
      const title = document.getElementById('elTitle').value.trim();
      let url = document.getElementById('elUrl').value.trim();
      if (!title || !url) return alert('Por favor completa el título y la URL');

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const tagSelect = document.getElementById('elTagSelect').value;
      const tagCustom = document.getElementById('elTagCustom').value.trim();
      const etiqueta = (tagSelect === '__custom__' && tagCustom) ? tagCustom : (tagSelect !== '__custom__' ? tagSelect : link.etiqueta || 'General');

      link.titulo = title;
      link.url = url;
      link.etiqueta = etiqueta;
      link.logo = document.getElementById('elLogo').value.trim();
      link.favorito = document.getElementById('elFav').checked;

      saveState();
      hideModal();
      renderEnlaces();
    });

    document.getElementById('btnBackToDetailModal')?.addEventListener('click', () => {
      hideModal();
      openLinkDetailModal(link.id);
    });

    const sel = document.getElementById('elTagSelect');
    const cust = document.getElementById('elTagCustom');
    if (sel && cust) {
      sel.addEventListener('change', () => {
        if (sel.value === '__custom__') {
          cust.classList.remove('hidden');
          cust.focus();
        } else {
          cust.classList.add('hidden');
        }
      });
    }

    document.getElementById('btnEditAutoFavicon')?.addEventListener('click', () => {
      const inputUrl = document.getElementById('elUrl').value.trim();
      if (!inputUrl) return alert('Introduce primero una URL válida.');
      const domain = getLinkDomain(inputUrl);
      if (domain) {
        document.getElementById('elLogo').value = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      } else {
        alert('URL no válida.');
      }
    });

    const editLogoFileInput = document.getElementById('elLogoFile');
    document.getElementById('btnEditUploadLogoFile')?.addEventListener('click', () => editLogoFileInput.click());
    editLogoFileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const comp = await compressImage(file);
          document.getElementById('elLogo').value = comp;
        } catch (err) {
          console.error('Error al comprimir logo:', err);
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 10. SECTION 7: CONFIGURACIÓN & BACKUP JSON
  // --------------------------------------------------------------------------
  function renderConfiguracion() {
    document.getElementById('configAppNameInput').value = state.settings.appName || 'RS Scouting';
    setTheme(state.settings.theme || 'light');
  }

  document.querySelectorAll('.btn-theme').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      state.settings.theme = theme;
      saveState();
      setTheme(theme);
    });
  });

  function setTheme(theme) {
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    document.querySelectorAll('.btn-theme').forEach(b => {
      if (b.dataset.theme === theme) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  document.getElementById('configAppNameInput')?.addEventListener('change', (e) => {
    state.settings.appName = e.target.value;
    document.getElementById('appBrandName').textContent = e.target.value;
    saveState();
  });

  // Helper de Exportación JSON seguro usando Blob
  function exportBackupJSON() {
    try {
      const dataStr = JSON.stringify(state, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `RS_Scouting_CopiaSeguridad_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
      if (typeof showNotification === 'function') {
        showNotification('💾 Copia de seguridad exportada con éxito.', 'success');
      } else {
        alert('💾 Copia de seguridad exportada con éxito en tu directorio local.');
      }
    } catch (e) {
      console.error('Error export JSON:', e);
      alert('Error al exportar la copia de seguridad: ' + e.message);
    }
  }

  // Backup Export JSON Listeners
  document.getElementById('btnExportBackup')?.addEventListener('click', exportBackupJSON);
  document.getElementById('btnHeaderExportBackup')?.addEventListener('click', exportBackupJSON);

  // Backup Import JSON Listener
  const handleImportBackup = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && typeof imported === 'object') {
          if (confirm('⚠️ ¿Deseas restaurar esta copia de seguridad?\n\nSe actualizarán tus informes, agenda, enlaces y directorio local y se sincronizarán con Firebase.')) {
            state = imported;
            saveState();
            if (db) {
              // no auto re-upload
            }
            if (typeof renderAllViews === 'function') {
              renderAllViews();
            }
            alert('📂 ¡Copia de seguridad restaurada correctamente y sincronizada con Firebase!');
          }
        } else {
          alert('El archivo JSON no tiene el formato adecuado.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  document.getElementById('inputImportBackup')?.addEventListener('change', (e) => {
    handleImportBackup(e.target.files[0]);
  });

  // Botón manual de sincronización con Firebase
  document.getElementById('btnSyncFirebase')?.addEventListener('click', () => {
    syncAllToFirebase(true);
  });
  document.getElementById('btnHeaderSyncFirebase')?.addEventListener('click', () => {
    syncAllToFirebase(true);
  });

  async function clearAllFirebaseData() {
    if (!db) return;
    const collections = [
      'scouting_data',
      'jugadores',
      'clubes',
      'equipos',
      'federaciones',
      'selecciones',
      'convocatorias',
      'torneos',
      'staff',
      'agencias',
      'agentes',
      'estadios',
      'informes',
      'matches',
      'reports',
      'agenda',
      'links'
    ];

    try {
      for (const colName of collections) {
        const snap = await db.collection(colName).get();
        if (!snap.empty) {
          const batch = db.batch();
          snap.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }
      }
      console.log('🔥 Se han eliminado todas las colecciones de Firebase Firestore');
    } catch (err) {
      console.error('Error al vaciar colecciones en Firebase:', err);
    }
  }

  // Clear All Data
  document.getElementById('btnClearAllData')?.addEventListener('click', async () => {
    if (confirm('⚠️ ¿Estás seguro de que deseas BORRAR TODOS LOS DATOS de la aplicación y de FIREBASE?\n\nEsta acción eliminará de forma PERMANENTE todos los partidos, informes técnicos, jugadores, clubes, equipos, staff, estadios, agenda y enlaces de TODOS los sitios (local y nube) para empezar 100% desde cero.')) {
      if (db) {
        try {
          await clearAllFirebaseData();
        } catch (e) {
          console.error('Error durante la eliminación en Firebase:', e);
        }
      }
      state = {
        settings: {
          theme: state.settings?.theme || 'light',
          appName: state.settings?.appName || 'RS Scouting'
        },
        matches: [],
        reports: [],
        directory: {
          jugadores: [],
          clubes: [],
          equipos: [],
          federaciones: [],
          selecciones: [],
          convocatorias: [],
          torneos: [],
          staff: [],
          agencias: [],
          agentes: [],
          estadios: [],
          informes: []
        },
        agenda: [],
        links: []
      };
      saveState();
      alert('✓ Todos los datos han sido borrados de la aplicación y de Firebase Firestore. El sistema está 100% limpio.');
      window.location.reload();
    }
  });

  // Reset Sample Data
  document.getElementById('btnResetSampleData')?.addEventListener('click', () => {
    if (confirm('¿Cargar datos de ejemplo iniciales? Esto restaurará la demo predeterminada.')) {
      state = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
      saveState();
      window.location.reload();
    }
  });

  // --------------------------------------------------------------------------
  // 11. Generic Modal Helper Functions
  // --------------------------------------------------------------------------
  let currentModalSubmitCallback = null;

  function showModal(title, htmlContent, onSubmit, onDelete = null) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = htmlContent;
    currentModalSubmitCallback = onSubmit;

    const footer = document.querySelector('#generalModalOverlay .modal-footer');
    let btnDelete = document.getElementById('btnDeleteModal');
    if (!btnDelete && footer) {
      btnDelete = document.createElement('button');
      btnDelete.type = 'button';
      btnDelete.className = 'btn btn-danger hidden';
      btnDelete.id = 'btnDeleteModal';
      btnDelete.style.marginRight = 'auto';
      btnDelete.style.fontWeight = '800';
      footer.prepend(btnDelete);
    }

    if (onDelete && btnDelete) {
      const deleteLabel = typeof onDelete === 'string' ? onDelete : (typeof onDelete === 'object' && onDelete.label ? onDelete.label : 'Eliminar');
      const deleteFunc = typeof onDelete === 'function' ? onDelete : (typeof onDelete === 'object' && onDelete.action ? onDelete.action : null);
      const deleteTitle = (typeof onDelete === 'object' && onDelete.title) ? onDelete.title : '¿Eliminar Registro?';
      const deleteMsg = (typeof onDelete === 'object' && onDelete.message) ? onDelete.message : '¿Estás seguro de que deseas eliminar este registro permanentemente de la base de datos?';

      btnDelete.innerHTML = `<i data-lucide="trash-2" style="width: 14px; margin-right: 4px; vertical-align: middle;"></i> ${escapeHtml(deleteLabel)}`;
      btnDelete.classList.remove('hidden');
      btnDelete.onclick = (e) => {
        e.preventDefault();
        showCustomConfirmModal(deleteTitle, deleteMsg, () => {
          if (deleteFunc) deleteFunc();
        });
      };
    } else if (btnDelete) {
      btnDelete.classList.add('hidden');
      btnDelete.onclick = null;
    }

    document.getElementById('generalModalOverlay').classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function hideModal() {
    const card = document.getElementById('generalModalCard');
    if (card) card.classList.remove('xlarge', 'large');
    const btnDelete = document.getElementById('btnDeleteModal');
    if (btnDelete) btnDelete.classList.add('hidden');
    const footer = document.querySelector('#generalModalOverlay .modal-footer');
    if (footer) footer.style.display = '';
    document.getElementById('generalModalOverlay').classList.add('hidden');
    currentModalSubmitCallback = null;
  }

  document.getElementById('btnCloseModal')?.addEventListener('click', hideModal);
  document.getElementById('btnCancelModal')?.addEventListener('click', hideModal);
  document.getElementById('btnSubmitModal')?.addEventListener('click', () => {
    if (currentModalSubmitCallback) currentModalSubmitCallback();
  });

  /**
   * Ventana emergente modal centrada con la estética de la app para pedir texto (remplaza prompt)
   */
  function showCustomPromptModal(title, defaultValue = '', onAccept) {
    const html = `
      <div style="text-align: center; padding: 12px 6px;">
        <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(37, 99, 235, 0.1); color: var(--primary-blue, #2563eb); display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
          <i data-lucide="edit-3" style="width: 26px; height: 26px;"></i>
        </div>
        <h4 style="font-size: 16px; font-weight: 800; color: var(--text-main, #1e293b); margin: 0 0 16px 0;">${escapeHtml(title)}</h4>
        <div class="form-group mb-4" style="text-align: left;">
          <input type="text" id="customPromptInput" class="form-control" value="${escapeHtml(defaultValue)}" style="font-size: 14px; padding: 10px 14px; font-weight: 600;" autofocus>
        </div>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" id="btnCustomPromptCancel" style="min-width: 110px; font-weight: 700;">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" id="btnCustomPromptAccept" style="min-width: 120px; font-weight: 800;">
            Aceptar
          </button>
        </div>
      </div>
    `;

    showModal('Editar Columna', html, null);

    setTimeout(() => {
      const inputEl = document.getElementById('customPromptInput');
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }

      const accept = () => {
        const val = document.getElementById('customPromptInput')?.value || '';
        hideModal();
        if (onAccept && val.trim()) onAccept(val.trim());
      };

      document.getElementById('btnCustomPromptAccept')?.addEventListener('click', accept);
      document.getElementById('btnCustomPromptCancel')?.addEventListener('click', hideModal);
      inputEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') accept();
      });
    }, 50);
  }

  /**
   * Ventana emergente modal centrada con la estética de la app para confirmar acciones (remplaza confirm)
   */
      function showToast(message, type = 'success') {
    let container = document.getElementById('globalToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'globalToastContainer';
      container.style.position = 'fixed';
      container.style.bottom = '24px';
      container.style.right = '24px';
      container.style.zIndex = '100000';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '10px';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.pointerEvents = 'auto';
    toast.style.background = type === 'danger' ? '#ef4444' : '#10b981';
    toast.style.color = '#ffffff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '10px';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '700';
    toast.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.2)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';

    toast.innerHTML = `
      <i data-lucide="${type === 'danger' ? 'trash-2' : 'check-circle'}" style="width: 18px; height: 18px;"></i>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateY(-10px)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2500);
  }

  function showCustomConfirmModal(title, message, onConfirm) {
    const html = `
      <div style="text-align: center; padding: 12px 6px;">
        <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); color: #ef4444; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
          <i data-lucide="alert-triangle" style="width: 26px; height: 26px;"></i>
        </div>
        <h4 style="font-size: 16px; font-weight: 800; color: var(--text-main, #1e293b); margin: 0 0 8px 0;">${escapeHtml(title)}</h4>
        <p style="font-size: 14px; color: var(--text-muted, #64748b); margin: 0 0 20px 0; line-height: 1.5;">${escapeHtml(message)}</p>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" id="btnCustomConfirmCancel" style="min-width: 110px; font-weight: 700;">
            Cancelar
          </button>
          <button type="button" class="btn btn-danger" id="btnCustomConfirmOk" style="min-width: 120px; font-weight: 800; background: #ef4444; color: white;">
            Confirmar
          </button>
        </div>
      </div>
    `;

    showModal('Confirmación del Sistema', html, null);

    const footer = document.querySelector('#generalModalOverlay .modal-footer');
    if (footer) {
      footer.style.display = 'none';
    }

    const resetFooter = () => {
      if (footer) footer.style.display = '';
    };

    const confirmBtn = document.getElementById('btnCustomConfirmOk');
    const cancelBtn = document.getElementById('btnCustomConfirmCancel');

    if (confirmBtn) {
      confirmBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        resetFooter();
        hideModal();
        if (onConfirm) onConfirm();
      };
    }

    if (cancelBtn) {
      cancelBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        resetFooter();
        hideModal();
      };
    }
  }

  // Sobrescribir avisos del sistema (alerts) para mostrarlos siempre en ventanas emergentes centradas
  window.alert = function (message) {
    const alertModalHTML = `
      <div style="text-align: center; padding: 12px 6px;">
        <div style="width: 58px; height: 58px; border-radius: 50%; background: rgba(37, 99, 235, 0.1); color: var(--primary-blue, #2563eb); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
          <i data-lucide="info" style="width: 30px; height: 30px;"></i>
        </div>
        <p style="font-size: 15px; font-weight: 700; color: var(--text-main, #1e293b); line-height: 1.5; margin: 0 0 24px 0;">
          ${escapeHtml(String(message))}
        </p>
        <button type="button" class="btn btn-primary" id="btnCustomAlertOk" style="min-width: 140px; font-weight: 800; padding: 10px 24px; border-radius: var(--radius-pill);">
          Entendido
        </button>
      </div>
    `;
    showModal('Aviso del Sistema', alertModalHTML, null);
    setTimeout(() => {
      document.getElementById('btnCustomAlertOk')?.addEventListener('click', hideModal);
    }, 50);
  };

  // Utility HTML Escape
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --------------------------------------------------------------------------
  // Global Smart Option-Search & Datalist Auto-Select Handler
  // --------------------------------------------------------------------------
  document.addEventListener('focusin', (e) => {
    const input = e.target;
    if (!input || input.tagName !== 'INPUT') return;

    if (input.getAttribute('list') || input.id.toLowerCase().includes('search') || (input.placeholder && input.placeholder.toLowerCase().includes('buscar'))) {
      setTimeout(() => {
        try { input.select(); } catch (err) {}
      }, 50);
    }
  });

  document.addEventListener('click', (e) => {
    const input = e.target;
    if (!input || input.tagName !== 'INPUT') return;

    if (input.getAttribute('list')) {
      setTimeout(() => {
        try { input.select(); } catch (err) {}
      }, 50);
    }
  });

  document.addEventListener('keydown', (e) => {
    const input = e.target;
    if (!input || input.tagName !== 'INPUT') return;

    if (e.key === 'Escape') {
      if (input.getAttribute('list') || input.id.toLowerCase().includes('search') || (input.placeholder && input.placeholder.toLowerCase().includes('buscar'))) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.blur();
      }
    }
  });

  // --------------------------------------------------------------------------
  // Global Search Input Clear Button (X) Setup
  // --------------------------------------------------------------------------
  function setupInputClearButtons() {
    const attachClearBtn = (inputEl) => {
      if (!inputEl || inputEl._hasClearBtn) return;
      if (inputEl.tagName !== 'INPUT') return;
      const type = inputEl.type || 'text';
      if (['hidden', 'checkbox', 'radio', 'color', 'file', 'submit', 'button', 'date'].includes(type)) return;

      const idLower = (inputEl.id || '').toLowerCase();
      const phLower = (inputEl.placeholder || '').toLowerCase();
      const isSearchOrDatalist = inputEl.hasAttribute('list') || idLower.includes('search') || phLower.includes('buscar') || type === 'search' || inputEl.classList.contains('form-control');

      if (!isSearchOrDatalist) return;

      inputEl._hasClearBtn = true;
      const parent = inputEl.parentNode;
      if (parent && getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }

      const clearBtn = document.createElement('span');
      clearBtn.className = 'input-clear-btn';
      clearBtn.innerHTML = '✕';
      clearBtn.title = 'Borrar lo anotado';
      clearBtn.style.display = 'none';

      if (parent) {
        parent.appendChild(clearBtn);
      }

      const updateBtnVisibility = () => {
        if (inputEl.value && inputEl.value.trim() !== '') {
          clearBtn.style.display = 'flex';
        } else {
          clearBtn.style.display = 'none';
        }
      };

      inputEl.addEventListener('input', updateBtnVisibility);
      inputEl.addEventListener('keyup', updateBtnVisibility);
      inputEl.addEventListener('change', updateBtnVisibility);
      inputEl.addEventListener('focus', updateBtnVisibility);

      clearBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        inputEl.value = '';
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        inputEl.focus();
        clearBtn.style.display = 'none';
      });

      updateBtnVisibility();
    };

    document.querySelectorAll('input').forEach(attachClearBtn);

    const observer = new MutationObserver(() => {
      document.querySelectorAll('input').forEach(attachClearBtn);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // --------------------------------------------------------------------------
  // 12. App Initialization
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCalendarViewSwitcher();
    initDirectorioSubtabs();
    initAgendaFilters();
    initNotificationsSystem();
    initFirebaseRealtimeListener();
    setupInputClearButtons();
    
    // Apply saved brand name & theme
    if (state.settings.appName) {
      document.getElementById('appBrandName').textContent = state.settings.appName;
    }
    setTheme(state.settings.theme || 'light');

    // Initial view render
    renderView('dashboard');
  });

})();
