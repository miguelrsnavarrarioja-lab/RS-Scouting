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
    matches: [
      {
        id: 'm1',
        local: 'Real Madrid Juvenil A',
        visitante: 'Atlético de Madrid Juvenil A',
        categoria: 'División de Honor',
        competicion: 'Liga Juvenil Grupo 5',
        fecha: '2026-08-08',
        hora: '17:00',
        estadio: 'Ciudad Real Madrid (Campo 7)',
        estado: 'programado', // 'visto', 'programado', 'directo'
        reportId: 'rep1'
      },
      {
        id: 'm2',
        local: 'FC Barcelona Juvenil A',
        visitante: 'RCD Espanyol Juvenil A',
        categoria: 'División de Honor',
        competicion: 'Liga Juvenil Grupo 3',
        fecha: '2026-08-04',
        hora: '18:00',
        estadio: 'Ciutat Esportiva Joan Gamper',
        estado: 'visto',
        reportId: null
      },
      {
        id: 'm3',
        local: 'Valencia CF Mestalla',
        visitante: 'Villarreal CF B',
        categoria: 'Senior',
        competicion: 'Segunda RFEF',
        fecha: '2026-08-09',
        hora: '12:00',
        estadio: 'Antonio Puchades',
        estado: 'programado',
        reportId: null
      }
    ],
    reports: [
      {
        id: 'rep1',
        localTeam: 'Real Madrid Juvenil A',
        visitanteTeam: 'Atlético de Madrid Juvenil A',
        localScore: 2,
        visitanteScore: 1,
        date: '2026-08-04',
        time: '17:00',
        estadio: 'Ciudad Real Madrid',
        clima: 'Soleado, 26°C',
        competicion: 'División de Honor Juvenil',
        categoria: 'Juvenil A',
        federacion: 'RFFM',
        localFormation: '1-4-3-3',
        visitanteFormation: '1-4-4-2',
        localDifficulty: 4,
        visitanteDifficulty: 3,
        localEstiloJuego: 'Presión alta, posesión rápida',
        visitanteEstiloJuego: 'Bloque medio, contraataque directo',
        localABP: 'Saques de esquina en corto',
        visitanteABP: 'Faltas laterales al segundo palo',
        localComentario: 'Equipo muy organizado en salida de balón.',
        visitanteComentario: 'Peligrosos en transiciones rápidas.',
        generalAnalysis: 'Partido de alto nivel táctico. Destacaron los extremos interiores y el mediocentro defensivo local en la recuperación de balones.',
        localTitulares: [
          { num: 1, name: 'Hugo Álvaro', pos: 'POR' },
          { num: 2, name: 'Marcos Rubio', pos: 'LD' },
          { num: 4, name: 'David Alonso', pos: 'DFC' },
          { num: 5, name: 'Gabriel Torres', pos: 'DFC' },
          { num: 3, name: 'Pablo Soria', pos: 'LI' },
          { num: 6, name: 'Lucas Vega', pos: 'MCD' },
          { num: 8, name: 'Mateo Gil', pos: 'MC' },
          { num: 10, name: 'Adrián Serrano', pos: 'MCO' },
          { num: 7, name: 'Iker Martín', pos: 'ED' },
          { num: 11, name: 'Gonzalo Fernández', pos: 'EI' },
          { num: 9, name: 'Álvaro Leiva', pos: 'DC' }
        ],
        localSuplentes: [
          { num: 13, name: 'Jaime Rivas', pos: 'POR' },
          { num: 14, name: 'Carlos Blanco', pos: 'DFC' },
          { num: 15, name: 'Enrique Santos', pos: 'MC' },
          { num: 16, name: 'Sergio Cano', pos: 'DC' }
        ],
        visitanteTitulares: [
          { num: 1, name: 'Daniel Prieto', pos: 'POR' },
          { num: 2, name: 'Javier Roca', pos: 'LD' },
          { num: 4, name: 'Alejandro Ramos', pos: 'DFC' },
          { num: 5, name: 'Mario Navarro', pos: 'DFC' },
          { num: 3, name: 'Nicolás Ortíz', pos: 'LI' },
          { num: 8, name: 'Samuel Molina', pos: 'MC' },
          { num: 6, name: 'Tomás Crespo', pos: 'MC' },
          { num: 7, name: 'Raúl Benítez', pos: 'ED' },
          { num: 11, name: 'Diego Guerrero', pos: 'EI' },
          { num: 9, name: 'Rodrigo Sanz', pos: 'DC' },
          { num: 10, name: 'Christian Mora', pos: 'DC' }
        ],
        visitanteSuplentes: [
          { num: 12, name: 'Óscar Iglesias', pos: 'POR' },
          { num: 14, name: 'Manuel Marín', pos: 'LD' },
          { num: 15, name: 'Felipe Domínguez', pos: 'MC' }
        ]
      }
    ],
    directory: {
      jugadores: [
        { id: 'j1', nombre: 'Álvaro Leiva', equipo: 'Real Madrid Juvenil A', posicion: 'DC', ano: '2007', categoria: 'Juvenil', nivel: 'Élite', nacio: 'España' },
        { id: 'j2', nombre: 'Adrián Serrano', equipo: 'Real Madrid Juvenil A', posicion: 'MCO', ano: '2007', categoria: 'Juvenil', nivel: 'Élite', nacio: 'España' },
        { id: 'j3', nombre: 'Rodrigo Sanz', equipo: 'Atlético de Madrid Juvenil A', posicion: 'DC', ano: '2006', categoria: 'Juvenil', nivel: 'Élite', nacio: 'España' },
        { id: 'j4', nombre: 'Pau Cubarsí Jr.', equipo: 'FC Barcelona Juvenil A', posicion: 'DFC', ano: '2007', categoria: 'Juvenil', nivel: 'Élite', nacio: 'España' }
      ],
      clubes: [
        { id: 'c1', nombre: 'Real Madrid CF', ciudad: 'Madrid', estadio: 'Santiago Bernabéu / Valdebebas', fundado: '1902' },
        { id: 'c2', nombre: 'Club Atlético de Madrid', ciudad: 'Madrid', estadio: 'Cívitas Metropolitano', fundado: '1903' },
        { id: 'c3', nombre: 'FC Barcelona', ciudad: 'Barcelona', estadio: 'Spotify Camp Nou', fundado: '1899' }
      ],
      equipos: [
        { id: 'eq1', nombre: 'Real Madrid Juvenil A', club: 'Real Madrid CF', categoria: 'División de Honor', grupo: 'Grupo 5' },
        { id: 'eq2', nombre: 'Atlético de Madrid Juvenil A', club: 'Club Atlético de Madrid', categoria: 'División de Honor', grupo: 'Grupo 5' }
      ],
      federaciones: [
        { id: 'f1', nombre: 'RFEF - Real Federación Española de Fútbol', sede: 'Las Rozas, Madrid' },
        { id: 'f2', nombre: 'RFFM - Real Federación de Fútbol de Madrid', sede: 'Madrid' },
        { id: 'f3', nombre: 'FCF - Federació Catalana de Futbol', sede: 'Barcelona' }
      ],
      selecciones: [
        { id: 'sel1', nombre: 'España Sub-19', entrenador: 'José Lana', categoria: 'Sub-19' },
        { id: 'sel2', nombre: 'España Sub-17', entrenador: 'Hernán Pérez', categoria: 'Sub-17' }
      ],
      convocatorias: [
        { id: 'conv1', titulo: 'Convocatoria Sub-19 Minitorneo Elite', fecha: '2026-09-15', seleccion: 'España Sub-19' }
      ],
      torneos: [
        { id: 't1', nombre: 'División de Honor Juvenil Grupo 5', temporada: '2025/2026' },
        { id: 't2', nombre: 'UEFA Youth League', temporada: '2025/2026' }
      ],
      staff: [
        { id: 'st1', nombre: 'Álvaro Arbeloa', rol: 'Entrenador Principal', equipo: 'Real Madrid Juvenil A' }
      ],
      agencias: [
        { id: 'ag1', nombre: 'Stellar Group Sports', sede: 'Madrid / Londres', agentesCount: 15 }
      ],
      agentes: [
        { id: 'agente1', nombre: 'Carlos García', agencia: 'Stellar Group', contacto: 'carlos@stellargroup.com' }
      ],
      estadios: [
        { id: 'est1', nombre: 'Ciudad Real Madrid Campo 7', capacidad: '3.000', césped: 'Natural' },
        { id: 'est2', nombre: 'Centro de Alto Rendimiento Alcalá', capacidad: '2.500', césped: 'Natural' }
      ],
      informes: []
    },
    agenda: [
      { id: 'ag_t1', titulo: 'Ver partido Real Madrid vs Atlético Juvenil A', fecha: '2026-08-08', hora: '17:00', categoria: 'partido', prioridad: 'Alta', completada: false },
      { id: 'ag_t2', titulo: 'Reunión con agente de Álvaro Leiva', fecha: '2026-08-10', hora: '11:30', categoria: 'contacto', prioridad: 'Media', completada: false },
      { id: 'ag_t3', titulo: 'Redactar informe consolidado de la jornada 1', fecha: '2026-08-11', hora: '16:00', categoria: 'nota', prioridad: 'Baja', completada: false }
    ],
    links: [
      { id: 'l1', titulo: 'RFEF - Real Federación Española de Fútbol', url: 'https://rfef.es', region: 'Nacional', etiqueta: 'Federaciones', logo: 'https://rfef.es/sites/default/files/rfef-logo.png', favorito: true },
      { id: 'l2', titulo: 'RFFM - Real Federación de Fútbol de Madrid', url: 'https://www.rffm.es', region: 'Madrid', etiqueta: 'Federaciones', logo: '🏛️', favorito: true },
      { id: 'l3', titulo: 'FCF - Federació Catalana de Futbol', url: 'https://www.fcf.cat', region: 'Cataluña', etiqueta: 'Federaciones', logo: '🟡', favorito: false },
      { id: 'l4', titulo: 'FFCV - Federació de Futbol Comunitat Valenciana', url: 'https://ffcv.es', region: 'C. Valenciana', etiqueta: 'Federaciones', logo: '🦇', favorito: false },
      { id: 'l5', titulo: 'RFAF - Real Federación Andaluza de Fútbol', url: 'https://www.rfaf.es', region: 'Andalucía', etiqueta: 'Federaciones', logo: '🌴', favorito: false },
      { id: 'l6', titulo: 'EFF-FVF - Federación Vasca de Fútbol', url: 'https://euskalfutbol.eus', region: 'País Vasco', etiqueta: 'Federaciones', logo: '🟢', favorito: false }
    ]
  };

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

  function deleteFromFirebase(collectionName, docId) {
    if (!db || !docId) return;
    db.collection(collectionName).doc(docId).delete()
      .then(() => console.log(`🔥 Documento ${docId} eliminado de '${collectionName}' en Firebase`))
      .catch(err => console.error(`Error al borrar ${docId} de Firebase (${collectionName}):`, err));
  }

  function deleteMultipleFromFirebase(collectionName, docIdsArray) {
    if (!db || !Array.isArray(docIdsArray) || docIdsArray.length === 0) return;
    const batch = db.batch();
    docIdsArray.forEach(id => {
      if (id) {
        const ref = db.collection(collectionName).doc(id);
        batch.delete(ref);
      }
    });
    batch.commit()
      .then(() => console.log(`🔥 ${docIdsArray.length} documentos eliminados en lote de '${collectionName}' en Firebase`))
      .catch(err => console.error(`Error al borrar lote en Firebase (${collectionName}):`, err));
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading from localStorage, using default state:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
  }

  let state = loadState();

  function saveState() {
    // 1. Guardado rápido local en localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }

    // 2. Sincronización automática en la nube con Firebase Cloud Firestore
    if (db) {
      // Documento principal unificado
      db.collection('scouting_data').doc('main_state').set(state)
        .then(() => console.log('☁️ Estado general sincronizado en Firestore'))
        .catch(err => console.error('Error al guardar en Firebase:', err));

      // Colección 'jugadores' en Firestore
      if (state.directory && state.directory.jugadores) {
        state.directory.jugadores.forEach(j => {
          if (j.id) {
            db.collection('jugadores').doc(j.id).set(j, { merge: true })
              .catch(e => console.warn('Error sync jugador:', e));
          }
        });
      }

      // Colección 'clubes' en Firestore
      if (state.directory && state.directory.clubes) {
        state.directory.clubes.forEach(c => {
          if (c.id) {
            db.collection('clubes').doc(c.id).set(c, { merge: true })
              .catch(e => console.warn('Error sync club:', e));
          }
        });
      }

      // Colección 'equipos' en Firestore
      if (state.directory && state.directory.equipos) {
        state.directory.equipos.forEach(eq => {
          if (eq.id) {
            db.collection('equipos').doc(eq.id).set(eq, { merge: true })
              .catch(e => console.warn('Error sync equipo:', e));
          }
        });
      }

      // Colección 'federaciones' en Firestore
      if (state.directory && state.directory.federaciones) {
        state.directory.federaciones.forEach(f => {
          if (f.id) {
            db.collection('federaciones').doc(f.id).set(f, { merge: true })
              .catch(e => console.warn('Error sync federación:', e));
          }
        });
      }

      // Colección 'selecciones' en Firestore
      if (state.directory && state.directory.selecciones) {
        state.directory.selecciones.forEach(sel => {
          if (sel.id) {
            db.collection('selecciones').doc(sel.id).set(sel, { merge: true })
              .catch(e => console.warn('Error sync selección:', e));
          }
        });
      }

      // Colección 'convocatorias' en Firestore
      if (state.directory && state.directory.convocatorias) {
        state.directory.convocatorias.forEach(c => {
          if (c.id) {
            db.collection('convocatorias').doc(c.id).set(c, { merge: true })
              .catch(e => console.warn('Error sync convocatoria:', e));
          }
        });
      }

      // Colección 'torneos' en Firestore
      if (state.directory && state.directory.torneos) {
        state.directory.torneos.forEach(t => {
          if (t.id) {
            db.collection('torneos').doc(t.id).set(t, { merge: true })
              .catch(e => console.warn('Error sync torneo:', e));
          }
        });
      }

      // Colección 'staff' en Firestore
      if (state.directory && state.directory.staff) {
        state.directory.staff.forEach(st => {
          if (st.id) {
            db.collection('staff').doc(st.id).set(st, { merge: true })
              .catch(e => console.warn('Error sync staff:', e));
          }
        });
      }

      // Colección 'agencias' en Firestore
      if (state.directory && state.directory.agencias) {
        state.directory.agencias.forEach(ag => {
          if (ag.id) {
            db.collection('agencias').doc(ag.id).set(ag, { merge: true })
              .catch(e => console.warn('Error sync agencia:', e));
          }
        });
      }

      // Colección 'agentes' en Firestore
      if (state.directory && state.directory.agentes) {
        state.directory.agentes.forEach(agt => {
          if (agt.id) {
            db.collection('agentes').doc(agt.id).set(agt, { merge: true })
              .catch(e => console.warn('Error sync agente:', e));
          }
        });
      }

      // Colección 'estadios' en Firestore
      if (state.directory && state.directory.estadios) {
        state.directory.estadios.forEach(est => {
          if (est.id) {
            db.collection('estadios').doc(est.id).set(est, { merge: true })
              .catch(e => console.warn('Error sync estadio:', e));
          }
        });
      }

      // Colección 'partidos' en Firestore
      if (state.matches) {
        state.matches.forEach(m => {
          if (m.id) {
            db.collection('partidos').doc(m.id).set(m, { merge: true })
              .catch(e => console.warn('Error sync partido:', e));
          }
        });
      }

      // Colección 'informes' en Firestore
      if (state.reports) {
        state.reports.forEach(r => {
          if (r.id) {
            db.collection('informes').doc(r.id).set(r, { merge: true })
              .catch(e => console.warn('Error sync informe:', e));
          }
        });
      }

      // Colección 'enlaces' en Firestore
      if (state.links) {
        state.links.forEach(l => {
          if (l.id) {
            db.collection('enlaces').doc(l.id).set(l, { merge: true })
              .catch(e => console.warn('Error sync enlace:', e));
          }
        });
      }
    }
  }

  function initFirebaseRealtimeListener() {
    if (!db) return;
    db.collection('scouting_data').doc('main_state').onSnapshot((doc) => {
      if (doc.exists) {
        const cloudData = doc.data();
        if (cloudData && Object.keys(cloudData).length > 0) {
          state = cloudData;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          } catch (e) {}
          if (typeof renderAllViews === 'function') {
            renderAllViews();
          }
        }
      }
    }, (error) => {
      console.warn('Firebase Firestore Listener info:', error);
    });
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
    '1-4-3-3': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MVD', 'MC', 'MVZ', 'MBD', 'MBZ', 'AC'],
    '1-4-4-2': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MBD', 'MCD', 'MCZ', 'MBZ', 'ACD', 'ACZ'],
    '1-4-4-2 (Rombo)': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MCD', 'MVD', 'MVZ', 'MP', 'ACD', 'ACZ'],
    '1-4-2-3-1': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MCD', 'MCZ', 'MBD', 'MP', 'MBZ', 'AC'],
    '1-4-1-4-1': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MCD', 'MBD', 'MVD', 'MVZ', 'MBZ', 'AC'],
    '1-4-3-2-1': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MVD', 'MC', 'MVZ', 'MPD', 'MPZ', 'AC'],
    '1-4-3-1-2': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MVD', 'MC', 'MVZ', 'MP', 'ACD', 'ACZ'],
    '1-4-5-1': ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MBD', 'MCD', 'MC', 'MCZ', 'MBZ', 'AC'],
    '1-3-5-2': ['PO', 'DCD', 'DC', 'DCZ', 'MBD', 'MVD', 'MC', 'MVZ', 'MBZ', 'ACD', 'ACZ'],
    '1-3-4-3': ['PO', 'DCD', 'DC', 'DCZ', 'MBD', 'MCD', 'MCZ', 'MBZ', 'MBD', 'MBZ', 'AC'],
    '1-3-4-2-1': ['PO', 'DCD', 'DC', 'DCZ', 'MBD', 'MCD', 'MCZ', 'MBZ', 'MPD', 'MPZ', 'AC'],
    '1-3-4-1-2': ['PO', 'DCD', 'DC', 'DCZ', 'MBD', 'MCD', 'MCZ', 'MBZ', 'MP', 'ACD', 'ACZ'],
    '1-3-3-3-1': ['PO', 'DCD', 'DC', 'DCZ', 'MVD', 'MC', 'MVZ', 'MBD', 'MP', 'MBZ', 'AC'],
    '1-5-3-2': ['PO', 'DBD', 'DCD', 'DC', 'DCZ', 'DBZ', 'MVD', 'MC', 'MVZ', 'ACD', 'ACZ'],
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
    
    const scheduledMatches = matches.filter(m => m.estado === 'programado').length;
    const pendingTasks = agenda.filter(a => !a.completada);
    const highPriorityTasks = pendingTasks.filter(a => a.prioridad === 'Alta').length;

    const elTotalMatches = document.getElementById('kpiTotalMatches');
    const elScheduledMatches = document.getElementById('kpiScheduledMatches');
    const elTotalReports = document.getElementById('kpiTotalReports');
    const elTotalPlayers = document.getElementById('kpiTotalPlayers');
    const elPendingTasks = document.getElementById('kpiPendingTasks');
    const elHighPriorityTasks = document.getElementById('kpiHighPriorityTasks');

    if (elTotalMatches) elTotalMatches.textContent = matches.length;
    if (elScheduledMatches) elScheduledMatches.textContent = `${scheduledMatches} programados`;
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

    document.getElementById('counterTotalVistos').textContent = totalVistos;
    document.getElementById('counterTotalProgramados').textContent = totalProgramados;
    document.getElementById('counterTotalDirecto').textContent = totalDirecto;
    document.getElementById('counterTotalInformes').textContent = totalInformes;

    // Filter matches
    const searchVal = document.getElementById('calendarSearchInput').value.toLowerCase();
    const statusVal = document.getElementById('calendarFilterStatus').value;
    const catVal = document.getElementById('calendarFilterCategory').value;

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
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 60px;">
          <i data-lucide="calendar-x" style="width: 48px; height: 48px; color: var(--text-subtle);"></i>
          <p class="empty-state-text">No hay partidos en el calendario con los filtros seleccionados.</p>
          <button class="btn btn-primary" id="btnEmptyScheduleMatch">Programar Primer Partido</button>
        </div>
      `;
      document.getElementById('btnEmptyScheduleMatch')?.addEventListener('click', () => openNewMatchModal());
    } else {
      container.innerHTML = filtered.map(m => `
        <div class="match-card">
          <div class="match-card-header">
            <span class="match-category-tag">${escapeHtml(m.categoria)}</span>
            <span class="match-status-badge ${m.estado}">${m.estado === 'visto' ? '✓ Visto' : m.estado === 'directo' ? '🔴 En Directo' : '📅 Programado'}</span>
          </div>

          <div class="match-card-teams">
            <span class="match-team-name">${escapeHtml(m.local)}</span>
            <span class="match-vs">VS</span>
            <span class="match-team-name text-right">${escapeHtml(m.visitante)}</span>
          </div>

          <div class="match-card-details">
            <div><i data-lucide="calendar" style="width: 14px;"></i> ${escapeHtml(m.fecha)} | ${escapeHtml(m.hora)} hs</div>
            <div><i data-lucide="map-pin" style="width: 14px;"></i> ${escapeHtml(m.estadio || 'Estadio no especificado')}</div>
            <div><i data-lucide="trophy" style="width: 14px;"></i> ${escapeHtml(m.competicion || 'Competición')}</div>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 6px;">
            ${m.reportId ? `
              <button class="btn btn-primary btn-open-report" data-repid="${m.reportId}" data-mid="${m.id}" style="width: 100%;">
                <i data-lucide="file-text"></i> Ver Informe Técnico
              </button>
            ` : `
              <button class="btn btn-secondary btn-create-report-from-match" data-mid="${m.id}" style="width: 100%;">
                <i data-lucide="plus"></i> Crear Informe Técnico
              </button>
            `}
          </div>
        </div>
      `).join('');

      container.querySelectorAll('.btn-open-report').forEach(btn => {
        btn.addEventListener('click', () => {
          const match = state.matches.find(m => m.id === btn.dataset.mid || m.reportId === btn.dataset.repid);
          openMatchReportEditor(btn.dataset.repid, match);
        });
      });
      container.querySelectorAll('.btn-create-report-from-match').forEach(btn => {
        btn.addEventListener('click', () => createReportFromMatch(btn.dataset.mid));
      });
    }
  }

  function renderCalendarMonthView(filteredMatches) {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('monthTitleDisplay').textContent = `${monthNames[month]} ${year}`;

    // Days in current month & start day offset (Monday = 0)
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Matches in selected month/year
    const monthMatches = filteredMatches.filter(m => {
      if (!m.fecha) return false;
      const d = new Date(m.fecha);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    document.getElementById('monthMatchCountDisplay').textContent = monthMatches.length;

    const grid = document.getElementById('monthDaysGrid');
    let cellsHTML = '';

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDayNum = prevMonthDays - i;
      cellsHTML += `
        <div class="month-day-cell other-month">
          <span class="day-number">${prevDayNum}</span>
        </div>
      `;
    }

    // 2. Current month days
    const today = new Date();
    const isCurrentRealMonth = today.getFullYear() === year && today.getMonth() === month;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const isToday = isCurrentRealMonth && today.getDate() === day;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const dayMatches = filteredMatches.filter(m => m.fecha === dateStr);

      cellsHTML += `
        <div class="month-day-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
          <span class="day-number">${day}</span>
          <div class="day-matches-list">
            ${dayMatches.map(m => `
              <div class="day-match-pill ${m.estado}" data-mid="${m.id}" title="${escapeHtml(m.local)} vs ${escapeHtml(m.visitante)}">
                <span>${escapeHtml(m.local.split(' ')[0])} v ${escapeHtml(m.visitante.split(' ')[0])}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 3. Next month trailing days to complete grid
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

    // Click handler for day cells to add match or open existing
    grid.querySelectorAll('.month-day-cell:not(.other-month)').forEach(cell => {
      cell.addEventListener('click', (e) => {
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
            <input type="text" id="mCompeticion" class="form-control" placeholder="Ej: Liga Juvenil Grupo 5">
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
        if (match) {
          if (match.reportId) {
            repData = state.reports.find(r => r.id === match.reportId);
          }
          if (!repData) {
            prefillMatch = match;
          }
        }
      }
    } else if (prefillMatch) {
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
      const compSet = new Set();
      (state.directory.equipos || []).forEach(e => { if (e.liga) compSet.add(e.liga); if (e.competicion) compSet.add(e.competicion); });
      (state.directory.torneos || []).forEach(t => { if (t.nombre) compSet.add(t.nombre); if (t.torneo) compSet.add(t.torneo); });
      ['Liga', 'Copa del Rey', 'Champions League', 'Europa League', 'Supercopa', 'Amistoso'].forEach(c => compSet.add(c));
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
        list.push({
          num: parseInt(r.querySelector('.num').value) || 0,
          name: r.querySelector('.name').value.trim(),
          pos: r.querySelector('.pos').value
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
      const numVal = (p.num !== undefined && p.num !== null) ? p.num : '';
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

    // Suplentes (9 suplentes) - Default position empty
    const supContainer = document.getElementById(`${team}SuplentesRows`);
    let supHTML = '';
    for (let i = 0; i < 9; i++) {
      const p = suplentes[i] || { num: '', name: '', pos: '' };
      const numVal = (p.num !== undefined && p.num !== null) ? p.num : '';
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

      const numVal = numInput ? numInput.value.trim() : '';
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

        const numVal = numInput ? numInput.value.trim() : '';
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
                  <i data-lucide="log-in" style="width: 14px;"></i> ${pEval.entra ? ('ENTRÓ (' + (pEval.minutoEntrada || 0) + '\')') : 'ENTRA'}
                </button>
                <button type="button" class="btn-salir-toggle ${pEval.sustituido ? 'active' : ''}" id="pmBtnSalir" title="Marcar minuto de salida">
                  <i data-lucide="log-out" style="width: 14px;"></i> ${pEval.sustituido ? ('SUSTITUIDO (' + (pEval.minutoSalida || 0) + '\')') : 'SALIR'}
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

  // Save Report Handler
  document.getElementById('btnSaveMatchReport')?.addEventListener('click', () => {
    const localTeam = document.getElementById('reportLocalTeam').value.trim() || 'Equipo Local';
    const visitanteTeam = document.getElementById('reportVisitanteTeam').value.trim() || 'Equipo Visitante';

    // Ensure active role tab states are saved
    saveCurrentTacticalRoleState('local');
    saveCurrentTacticalRoleState('visitante');

    // Auto-fill 90 minutes for un-substituted starters on saving match report & sync to directory
    const repId = currentEditingReportId || ('rep_' + Date.now());
    if (!state.matchPlayerEvaluations) state.matchPlayerEvaluations = {};
    ['local', 'visitante'].forEach(t => {
      const rows = document.querySelectorAll(`#${t}TitularesRows .lineup-row, #${t}SuplentesRows .lineup-row`);
      rows.forEach((r, idx) => {
        const pNum = r.querySelector('input.num')?.value;
        const pName = r.querySelector('input.name')?.value.trim();
        const evalKey = `${repId}_${t}_${pNum}`;
        if (state.matchPlayerEvaluations[evalKey]) {
          if (r.parentElement.id.includes('Titulares') && !state.matchPlayerEvaluations[evalKey].sustituido) {
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
      localScore: parseInt(document.getElementById('reportLocalScore').value) || 0,
      visitanteScore: parseInt(document.getElementById('reportVisitanteScore').value) || 0,
      date: document.getElementById('reportDate').value,
      time: document.getElementById('reportTime').value,
      estadio: document.getElementById('reportEstadio').value,
      clima: document.getElementById('reportClima').value,
      competicion: document.getElementById('reportCompeticion').value,
      categoria: document.getElementById('reportCategoria').value,
      federacion: document.getElementById('reportFederacion').value,

      localSystems: matchTacticalSystems.local,
      visitanteSystems: matchTacticalSystems.visitante,

      localFormation: matchTacticalSystems.local.principal?.formation || document.getElementById('localFormationSelect').value,
      visitanteFormation: matchTacticalSystems.visitante.principal?.formation || document.getElementById('visitanteFormationSelect').value,
      localDifficulty: getDifficultyRating('local'),
      visitanteDifficulty: getDifficultyRating('visitante'),
      localEstiloJuego: document.getElementById('localEstiloJuego').value,
      visitanteEstiloJuego: document.getElementById('visitanteEstiloJuego').value,
      
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
          const val = document.getElementById(`localABP_${k}`)?.value.trim();
          if (val) parts.push(`${ABP_LABELS[k]}: ${val}`);
        });
        return parts.join('\n');
      })(),
      visitanteABP: (function() {
        const parts = [];
        ABP_KEYS.forEach(k => {
          const val = document.getElementById(`visitanteABP_${k}`)?.value.trim();
          if (val) parts.push(`${ABP_LABELS[k]}: ${val}`);
        });
        return parts.join('\n');
      })(),
      localComentario: document.getElementById('localComentario').value,
      visitanteComentario: document.getElementById('visitanteComentario').value,

      localEntrenador: document.getElementById('localEntrenador')?.value || '',
      visitanteEntrenador: document.getElementById('visitanteEntrenador')?.value || '',
      localCoachRating: getCoachRating('local'),
      visitanteCoachRating: getCoachRating('visitante'),
      localComentarioEntrenador: document.getElementById('localComentarioEntrenador')?.value || '',
      visitanteComentarioEntrenador: document.getElementById('visitanteComentarioEntrenador')?.value || '',
      localKirolSport: document.getElementById('localBtnKirolSport')?.classList.contains('active') || false,
      visitanteKirolSport: document.getElementById('visitanteBtnKirolSport')?.classList.contains('active') || false,

      generalAnalysis: document.getElementById('reportGeneralAnalysis').value,
      localTitulares: matchTacticalSystems.local.principal?.titulares || [],
      localSuplentes: matchTacticalSystems.local.principal?.suplentes || [],
      visitanteTitulares: matchTacticalSystems.visitante.principal?.titulares || [],
      visitanteSuplentes: matchTacticalSystems.visitante.principal?.suplentes || []
    };

    if (currentEditingReportId) {
      const idx = state.reports.findIndex(r => r.id === currentEditingReportId);
      if (idx !== -1) state.reports[idx] = reportObj;
      else state.reports.push(reportObj);
    } else {
      state.reports.unshift(reportObj);
    }

    // Link reportId to corresponding match in state.matches
    const matchingMatch = state.matches.find(m => 
      (m.local.toLowerCase() === reportObj.localTeam.toLowerCase() && m.visitante.toLowerCase() === reportObj.visitanteTeam.toLowerCase()) ||
      (m.reportId === reportObj.id)
    );
    if (matchingMatch) {
      matchingMatch.reportId = reportObj.id;
      matchingMatch.estado = 'visto';
    }

    // Also auto-add/update players into directory!
    [...reportObj.localTitulares, ...reportObj.visitanteTitulares].forEach(p => {
      if (p.name && !state.directory.jugadores.some(j => j.nombre.toLowerCase() === p.name.toLowerCase())) {
        state.directory.jugadores.push({
          id: 'j_' + Date.now() + Math.random().toString(36).substr(2, 4),
          nombre: p.name,
          equipo: reportObj.localTitulares.includes(p) ? reportObj.localTeam : reportObj.visitanteTeam,
          posicion: p.pos,
          ano: '2006',
          categoria: reportObj.categoria || 'Senior',
          nivel: 'Propecto'
        });
      }
    });

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

    saveState();
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
    alert('¡Informe Técnico de Partido guardado con éxito!');
    closeReportEditor();
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
      'Barcelona', 'L\'Hospitalet de Llobregat', 'Terrassa', 'Badalona', 'Sabadell', 'Lleida',
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
        renderDirectorio();
      });
    });
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
    const fechaNac = player.fechaNac || '';
    const sexo = player.sexo || 'MASCULINO';
    const pais = player.pais || 'España';
    const comunidad = player.comunidad || 'Navarra';
    const localidad = player.localidad || 'Pamplona';

    const pierna = player.pierna || 'DERECHA';
    const disponibilidad = player.disponibilidad || 'LIBRE (POTENCIAL FICHAJE)';
    const proyeccion = player.proyeccion || '-';
    const posicionPrincipal = player.posicion || player.posicionPrincipal || '';
    const posicionSecundaria = player.posicionSecundaria || '';
    const lesiones = player.lesiones || '';

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
          ${(state.directory.clubes || []).map(c => `<option value="${escapeHtml(c.nombre)}"></option>`).join('')}
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
                    <label class="form-label">AÑO NAC.</label>
                    <input type="text" id="pfAnoNac" class="form-control" placeholder="YYYY" value="${escapeHtml(anoNac)}">
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
                  <div class="form-group">
                    <label class="form-label">PAÍS</label>
                    <select id="pfPais" class="form-control">
                      <option value="">Seleccionar...</option>
                      ${LISTA_PAISES.map(p => `<option value="${escapeHtml(p)}" ${pais === p ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}
                      ${!LISTA_PAISES.includes(pais) && pais ? `<option value="${escapeHtml(pais)}" selected>${escapeHtml(pais)}</option>` : ''}
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

            <div class="form-group">
              <label class="form-label">LESIONES (HISTORIAL)</label>
              <select id="pfLesiones" class="form-control">
                <option value="">Seleccionar o sin lesiones...</option>
                ${(state.customLesiones || []).map(l => `<option value="${escapeHtml(l)}" ${lesiones === l ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('')}
                ${lesiones && !(state.customLesiones || []).includes(lesiones) ? `<option value="${escapeHtml(lesiones)}" selected>${escapeHtml(lesiones)}</option>` : ''}
                <option value="__NEW_LESION__" style="font-weight: bold; color: var(--primary-blue);">+ Crear nueva lesión...</option>
              </select>
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
      const nameVal = document.getElementById('pfNombre').value.trim();
      if (!nameVal) return alert('Por favor ingresa el nombre del jugador');

      let selectedEstado = 'ALTA';
      document.querySelectorAll('#pfEstadoGroup .status-pill-btn').forEach(btn => {
        if (btn.classList.contains('active')) selectedEstado = btn.dataset.val;
      });

      const checkedControl = [];
      document.querySelectorAll('#pfControlGroup input[type="checkbox"]:checked').forEach(chk => {
        checkedControl.push(chk.value);
      });

      const eqPrincipal = document.getElementById('pfEquipo').value.trim();
      const eqSecundario = document.getElementById('pfEquipoSecundario').value.trim();
      const selecNombre = document.getElementById('pfSeleccion').value.trim();

      const updatedPlayer = {
        id: isEdit ? playerId : 'j_' + Date.now(),
        nombre: nameVal,
        dorsal: document.getElementById('pfDorsal').value.trim(),
        estado: selectedEstado,
        equipo: eqPrincipal,
        equipoSecundario: eqSecundario,
        seleccion: selecNombre,
        anoNac: document.getElementById('pfAnoNac').value.trim(),
        ano: document.getElementById('pfAnoNac').value.trim() || '2006',
        fechaNac: document.getElementById('pfFechaNac').value,
        sexo: document.getElementById('pfSexo').value,
        pais: document.getElementById('pfPais').value.trim(),
        comunidad: document.getElementById('pfComunidad').value.trim(),
        localidad: document.getElementById('pfLocalidad').value.trim(),

        pierna: document.getElementById('pfPierna').value,
        disponibilidad: document.getElementById('pfDisponibilidad').value.trim(),
        proyeccion: document.getElementById('pfProyeccion').value.trim(),
        posicionPrincipal: document.getElementById('pfPosPrincipal').value.trim(),
        posicion: document.getElementById('pfPosPrincipal').value.trim() || 'DC',
        posicionSecundaria: document.getElementById('pfPosSecundaria').value.trim(),
        lesiones: document.getElementById('pfLesiones').value.trim(),

        finContrato: document.getElementById('pfFinContrato').value.trim(),
        agencia: document.getElementById('pfAgencia').value.trim(),
        agente: document.getElementById('pfAgente').value.trim(),
        instagram: document.getElementById('pfInstagram').value.trim(),
        twitter: document.getElementById('pfTwitter').value.trim(),
        transfermarkt: document.getElementById('pfTransfermarkt').value.trim(),
        besoccer: document.getElementById('pfBesoccer').value.trim(),
        telefono: document.getElementById('pfTelefono').value.trim(),

        controlSeguimiento: checkedControl,
        rendimientoAcumulado: document.getElementById('pfRendAcumulado').value,
        potencial: document.getElementById('pfPotencial').value,
        minutos: document.getElementById('pfMinutos').value.trim(),
        rendimientoRS: document.getElementById('pfRendRS').value.trim(),
        descFisica: document.getElementById('pfDescFisica').value.trim(),
        descTecnica: document.getElementById('pfDescTecnica').value.trim(),
        descEmocional: document.getElementById('pfDescEmocional').value.trim(),
        perfilRS: document.getElementById('pfPerfilRS').value.trim(),
        comentarioGeneral: document.getElementById('pfComentarioGeneral').value.trim(),

        trayectoria: localTrayectoria,
        historialEntrenadores: document.getElementById('pfHistorialEntrenadores').value.trim(),
        opinionTecnica: document.getElementById('pfOpinionTecnica').value.trim(),

        foto: photoData
      };

      if (!state.directory.jugadores) state.directory.jugadores = [];
      if (isEdit) {
        const idx = state.directory.jugadores.findIndex(j => j.id === playerId);
        if (idx !== -1) state.directory.jugadores[idx] = updatedPlayer;
      } else {
        state.directory.jugadores.unshift(updatedPlayer);
      }

      // Bidirectional sync: link player to target equipos and selecciones in state.directory
      const syncPlayerToTeam = (teamName) => {
        if (!teamName || !state.directory.equipos) return;
        let targetTeam = state.directory.equipos.find(eq => 
          (eq.nombre && eq.nombre.toLowerCase() === teamName.toLowerCase()) || 
          (eq.equipo && eq.equipo.toLowerCase() === teamName.toLowerCase())
        );
        if (!targetTeam) {
          targetTeam = {
            id: 'eq_' + Date.now() + Math.floor(Math.random()*100),
            nombre: teamName,
            equipo: teamName,
            categoria: 'General',
            temporada: '26/27',
            plantilla: []
          };
          state.directory.equipos.unshift(targetTeam);
        }
        if (!targetTeam.plantilla) targetTeam.plantilla = [];
        const exists = targetTeam.plantilla.some(p => (typeof p === 'string' ? p : p.nombre) === nameVal);
        if (!exists) {
          targetTeam.plantilla.push({ id: updatedPlayer.id, nombre: nameVal });
        }
      };

      const syncPlayerToSeleccion = (selName) => {
        if (!selName || !state.directory.selecciones) return;
        let targetSel = state.directory.selecciones.find(s => 
          (s.nombre && s.nombre.toLowerCase() === selName.toLowerCase()) ||
          (s.seleccion && s.seleccion.toLowerCase() === selName.toLowerCase())
        );
        if (!targetSel) {
          targetSel = {
            id: 'sel_' + Date.now() + Math.floor(Math.random()*100),
            nombre: selName,
            seleccion: selName,
            categoria: 'General',
            jugadores: []
          };
          state.directory.selecciones.unshift(targetSel);
        }
        if (!targetSel.jugadores) targetSel.jugadores = [];
        const exists = targetSel.jugadores.some(j => (typeof j === 'string' ? j : j.nombre) === nameVal);
        if (!exists) {
          targetSel.jugadores.push({ id: updatedPlayer.id, nombre: nameVal });
        }
      };

      const syncPlayerToAgencia = (agName) => {
        if (!agName || !state.directory.agencias) return;
        let targetAg = state.directory.agencias.find(a => 
          (a.nombre && a.nombre.toLowerCase() === agName.toLowerCase()) ||
          (a.agencia && a.agencia.toLowerCase() === agName.toLowerCase())
        );
        if (!targetAg) {
          targetAg = {
            id: 'ag_' + Date.now() + Math.floor(Math.random()*100),
            nombre: agName,
            agencia: agName,
            jugadores: []
          };
          state.directory.agencias.unshift(targetAg);
        }
        if (!targetAg.jugadores) targetAg.jugadores = [];
        const exists = targetAg.jugadores.some(j => (typeof j === 'string' ? j : j.nombre) === nameVal);
        if (!exists) {
          targetAg.jugadores.push({ id: updatedPlayer.id, nombre: nameVal });
        }
      };

      const syncPlayerToAgente = (agtName) => {
        if (!agtName || !state.directory.agentes) return;
        let targetAgt = state.directory.agentes.find(a => 
          (a.nombre && a.nombre.toLowerCase() === agtName.toLowerCase()) ||
          (a.agente && a.agente.toLowerCase() === agtName.toLowerCase())
        );
        if (!targetAgt) {
          targetAgt = {
            id: 'agt_' + Date.now() + Math.floor(Math.random()*100),
            nombre: agtName,
            agente: agtName,
            jugadoresRepresentados: []
          };
          state.directory.agentes.unshift(targetAgt);
        }
        if (!targetAgt.jugadoresRepresentados) targetAgt.jugadoresRepresentados = [];
        const exists = targetAgt.jugadoresRepresentados.some(j => (typeof j === 'string' ? j : j.nombre) === nameVal);
        if (!exists) {
          targetAgt.jugadoresRepresentados.push({ id: updatedPlayer.id, nombre: nameVal });
        }
      };

      syncPlayerToTeam(eqPrincipal);
      syncPlayerToTeam(eqSecundario);
      syncPlayerToSeleccion(selecNombre);
      syncPlayerToAgencia(document.getElementById('pfAgencia').value.trim());
      syncPlayerToAgente(document.getElementById('pfAgente').value.trim());

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    });

    // PDF Export Event Listener for Player Profile (5 Pages)
    document.getElementById('btnExportPlayerPdf')?.addEventListener('click', () => {
      let selectedEstado = 'ALTA';
      document.querySelectorAll('#pfEstadoGroup .status-pill-btn').forEach(btn => {
        if (btn.classList.contains('active')) selectedEstado = btn.dataset.val;
      });

      const checkedControl = [];
      document.querySelectorAll('#pfControlGroup input[type="checkbox"]:checked').forEach(chk => {
        checkedControl.push(chk.value);
      });

      const pData = {
        nombre: document.getElementById('pfNombre')?.value.trim() || nombre || 'Jugador',
        dorsal: document.getElementById('pfDorsal')?.value.trim() || dorsal || '',
        estado: selectedEstado,
        equipo: document.getElementById('pfEquipo')?.value.trim() || equipo || '',
        equipoSecundario: document.getElementById('pfEquipoSecundario')?.value.trim() || equipoSecundario || '',
        seleccion: document.getElementById('pfSeleccion')?.value.trim() || seleccion || '',
        anoNac: document.getElementById('pfAnoNac')?.value.trim() || anoNac || '',
        ano: document.getElementById('pfAnoNac')?.value.trim() || anoNac || '',
        fechaNac: document.getElementById('pfFechaNac')?.value || fechaNac || '',
        sexo: document.getElementById('pfSexo')?.value || sexo || '',
        pais: document.getElementById('pfPais')?.value.trim() || pais || '',
        comunidad: document.getElementById('pfComunidad')?.value.trim() || comunidad || '',
        localidad: document.getElementById('pfLocalidad')?.value.trim() || localidad || '',

        posicionPrincipal: document.getElementById('pfPosPrincipal')?.value.trim() || posicionPrincipal || '',
        posicion: document.getElementById('pfPosPrincipal')?.value.trim() || posicionPrincipal || '',
        posicionSecundaria: document.getElementById('pfPosSecundaria')?.value.trim() || posicionSecundaria || '',
        pierna: document.getElementById('pfPierna')?.value || pierna || '',
        disponibilidad: document.getElementById('pfDisponibilidad')?.value.trim() || disponibilidad || '',
        proyeccion: document.getElementById('pfProyeccion')?.value.trim() || proyeccion || '',
        lesiones: document.getElementById('pfLesiones')?.value.trim() || lesiones || '',
        agencia: document.getElementById('pfAgencia')?.value.trim() || agencia || '',
        agente: document.getElementById('pfAgente')?.value.trim() || agente || '',
        finContrato: document.getElementById('pfFinContrato')?.value.trim() || finContrato || '',

        telefono: document.getElementById('pfTelefono')?.value.trim() || telefono || '',
        instagram: document.getElementById('pfInstagram')?.value.trim() || instagram || '',
        twitter: document.getElementById('pfTwitter')?.value.trim() || twitter || '',
        transfermarkt: document.getElementById('pfTransfermarkt')?.value.trim() || transfermarkt || '',
        besoccer: document.getElementById('pfBesoccer')?.value.trim() || besoccer || '',
        gestorRebound: gestorRebound || '',
        controlSeguimiento: checkedControl,

        rendimientoAcumulado: document.getElementById('pfRendAcumulado')?.value || rendimientoAcumulado || '',
        potencial: document.getElementById('pfPotencial')?.value || potencial || '',
        minutos: document.getElementById('pfMinutos')?.value.trim() || minutos || '',
        rendimientoRS: document.getElementById('pfRendRS')?.value.trim() || rendimientoRS || '',
        descFisica: document.getElementById('pfDescFisica')?.value.trim() || descFisica || '',
        descTecnica: document.getElementById('pfDescTecnica')?.value.trim() || descTecnica || '',
        descEmocional: document.getElementById('pfDescEmocional')?.value.trim() || descEmocional || '',
        perfilRS: document.getElementById('pfPerfilRS')?.value.trim() || perfilRS || '',
        comentarioGeneral: document.getElementById('pfComentarioGeneral')?.value.trim() || comentarioGeneral || '',

        trayectoria: localTrayectoria,
        historialEntrenadores: document.getElementById('pfHistorialEntrenadores')?.value.trim() || historialEntrenadores || '',
        opinionTecnica: document.getElementById('pfOpinionTecnica')?.value.trim() || opinionTecnica || '',
        foto: photoData
      };

      const printWin = window.open('', '_blank');
      const pdfTitle = `Ficha_${pData.nombre.replace(/\s+/g, '_')}`;

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${escapeHtml(pdfTitle)}</title>
          <style>
            @media print {
              @page { size: A4; margin: 12mm; }
              .page-break { page-break-after: always; break-after: page; }
              .page-break:last-child { page-break-after: avoid; break-after: avoid; }
            }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #fff; line-height: 1.4; }
            .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
            .header-title { font-size: 20px; font-weight: 800; color: #1e293b; }
            .header-sub { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 2px; }
            .page-tag { background: #2563eb; color: #fff; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; }
            
            .profile-hero { display: flex; gap: 20px; align-items: flex-start; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
            .player-photo { width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 2px solid #cbd5e1; }
            .photo-placeholder { width: 120px; height: 120px; background: #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 40px; color: #94a3b8; }
            
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
            
            .field-card { background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0; }
            .field-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 3px; }
            .field-val { font-size: 13px; font-weight: 700; color: #0f172a; word-break: break-word; }
            
            .section-title { font-size: 13px; font-weight: 800; color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-top: 18px; margin-bottom: 12px; text-transform: uppercase; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
            th { background: #f1f5f9; padding: 8px 12px; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 10px; font-weight: 800; color: #475569; }
            td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          </style>
        </head>
        <body>
          <!-- HOJA 1: PERFIL GENERAL -->
          <div class="page-break">
            <div class="header-bar">
              <div>
                <div class="header-title">RS Scouting • Ficha Oficial de Jugador</div>
                <div class="header-sub">${escapeHtml(pData.nombre)} ${pData.dorsal ? '(DORSAL #'+escapeHtml(pData.dorsal)+')' : ''}</div>
              </div>
              <span class="page-tag">Hoja 1 • Perfil General</span>
            </div>

            <div class="profile-hero">
              ${pData.foto ? `<img src="${pData.foto}" class="player-photo">` : `<div class="photo-placeholder">👤</div>`}
              <div style="flex: 1;">
                <div style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">${escapeHtml(pData.nombre)}</div>
                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                  <span style="background: #2563eb; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;">${escapeHtml(pData.estado || 'ALTA')}</span>
                  ${pData.dorsal ? `<span style="background: #e2e8f0; color: #1e293b; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;">DORSAL #${escapeHtml(pData.dorsal)}</span>` : ''}
                </div>
                <div class="grid-2">
                  <div class="field-card"><div class="field-label">Equipo Principal</div><div class="field-val">${escapeHtml(pData.equipo || '-')}</div></div>
                  <div class="field-card"><div class="field-label">Equipo Secundario</div><div class="field-val">${escapeHtml(pData.equipoSecundario || '-')}</div></div>
                </div>
              </div>
            </div>

            <div class="section-title">DATOS DE IDENTIFICACIÓN & SELECCIÓN</div>
            <div class="grid-3">
              <div class="field-card"><div class="field-label">Selección Vinculada</div><div class="field-val">${escapeHtml(pData.seleccion || '-')}</div></div>
              <div class="field-card"><div class="field-label">Año Nacimiento</div><div class="field-val">${escapeHtml(pData.anoNac || pData.ano || '-')}</div></div>
              <div class="field-card"><div class="field-label">Fecha de Nacimiento</div><div class="field-val">${escapeHtml(pData.fechaNac || '-')}</div></div>
            </div>
            <div class="grid-3">
              <div class="field-card"><div class="field-label">Sexo</div><div class="field-val">${escapeHtml(pData.sexo || 'MASCULINO')}</div></div>
              <div class="field-card"><div class="field-label">País</div><div class="field-val">${escapeHtml(pData.pais || '-')}</div></div>
              <div class="field-card"><div class="field-label">Comunidad / Localidad</div><div class="field-val">${escapeHtml(pData.comunidad || '')} ${pData.localidad ? '('+escapeHtml(pData.localidad)+')' : ''}</div></div>
            </div>
          </div>

          <!-- HOJA 2: DATOS DEPORTIVOS -->
          <div class="page-break">
            <div class="header-bar">
              <div>
                <div class="header-title">RS Scouting • Ficha Oficial de Jugador</div>
                <div class="header-sub">${escapeHtml(pData.nombre)}</div>
              </div>
              <span class="page-tag">Hoja 2 • Datos Deportivos</span>
            </div>

            <div class="section-title">DEMARCACIÓN & ATRIBUTOS DE JUEGO</div>
            <div class="grid-3">
              <div class="field-card"><div class="field-label">Posición Principal</div><div class="field-val">${escapeHtml(pData.posicionPrincipal || pData.posicion || '-')}</div></div>
              <div class="field-card"><div class="field-label">Posición Secundaria</div><div class="field-val">${escapeHtml(pData.posicionSecundaria || '-')}</div></div>
              <div class="field-card"><div class="field-label">Pierna Hábil</div><div class="field-val">${escapeHtml(pData.pierna || '-')}</div></div>
            </div>
            <div class="grid-3">
              <div class="field-card"><div class="field-label">Disponibilidad / Fichaje</div><div class="field-val">${escapeHtml(pData.disponibilidad || '-')}</div></div>
              <div class="field-card"><div class="field-label">Proyección</div><div class="field-val">${escapeHtml(pData.proyeccion || '-')}</div></div>
              <div class="field-card"><div class="field-label">Historial de Lesiones</div><div class="field-val">${escapeHtml(pData.lesiones || 'Sin lesiones graves')}</div></div>
            </div>

            <div class="section-title">REPRESENTACIÓN & SITUACIÓN CONTRACTUAL</div>
            <div class="grid-3">
              <div class="field-card"><div class="field-label">Agencia de Representación</div><div class="field-val">${escapeHtml(pData.agencia || '-')}</div></div>
              <div class="field-card"><div class="field-label">Agente Representante</div><div class="field-val">${escapeHtml(pData.agente || '-')}</div></div>
              <div class="field-card"><div class="field-label">Fin de Contrato</div><div class="field-val">${escapeHtml(pData.finContrato || '-')}</div></div>
            </div>
          </div>

          <!-- HOJA 3: INFO EXTRA -->
          <div class="page-break">
            <div class="header-bar">
              <div>
                <div class="header-title">RS Scouting • Ficha Oficial de Jugador</div>
                <div class="header-sub">${escapeHtml(pData.nombre)}</div>
              </div>
              <span class="page-tag">Hoja 3 • Info Extra</span>
            </div>

            <div class="section-title">DATOS DE CONTACTO & ENLACES EXTERNOS</div>
            <div class="grid-2">
              <div class="field-card"><div class="field-label">Teléfono de Contacto</div><div class="field-val">${escapeHtml(pData.telefono || '-')}</div></div>
              <div class="field-card"><div class="field-label">Instagram / Redes</div><div class="field-val">${escapeHtml(pData.instagram || '-')}</div></div>
            </div>
            <div class="grid-2">
              <div class="field-card"><div class="field-label">Twitter / X</div><div class="field-val">${escapeHtml(pData.twitter || '-')}</div></div>
              <div class="field-card"><div class="field-label">Enlace Transfermarkt</div><div class="field-val">${escapeHtml(pData.transfermarkt || '-')}</div></div>
            </div>
            <div class="grid-2">
              <div class="field-card"><div class="field-label">Enlace BeSoccer</div><div class="field-val">${escapeHtml(pData.besoccer || '-')}</div></div>
              <div class="field-card"><div class="field-label">Gestor / Rebound</div><div class="field-val">${escapeHtml(pData.gestorRebound || '-')}</div></div>
            </div>

            <div class="section-title">CONTROL Y SEGUIMIENTO</div>
            <div class="field-card" style="min-height: 60px;">
              <div class="field-label">Opciones de seguimiento activas</div>
              <div class="field-val">${Array.isArray(pData.controlSeguimiento) && pData.controlSeguimiento.length > 0 ? pData.controlSeguimiento.map(c => '✔ ' + escapeHtml(c)).join(' &nbsp;|&nbsp; ') : 'Sin marcas de seguimiento'}</div>
            </div>
          </div>

          <!-- HOJA 4: RENDIMIENTO -->
          <div class="page-break">
            <div class="header-bar">
              <div>
                <div class="header-title">RS Scouting • Ficha Oficial de Jugador</div>
                <div class="header-sub">${escapeHtml(pData.nombre)}</div>
              </div>
              <span class="page-tag">Hoja 4 • Rendimiento</span>
            </div>

            <div class="section-title">MÉTRICAS & VALORACIÓN DE RENDIMIENTO</div>
            <div class="grid-3">
              <div class="field-card"><div class="field-label">Rendimiento Acumulado</div><div class="field-val">${escapeHtml(pData.rendimientoAcumulado || '-')}</div></div>
              <div class="field-card"><div class="field-label">Potencial Estimado</div><div class="field-val">${escapeHtml(pData.potencial || '-')} / 5 ⭐</div></div>
              <div class="field-card"><div class="field-label">Minutos Jugados</div><div class="field-val">${escapeHtml(pData.minutos || '-')}</div></div>
            </div>
            <div class="grid-2">
              <div class="field-card"><div class="field-label">Rating RS Scouting</div><div class="field-val">${escapeHtml(pData.rendimientoRS || '-')}</div></div>
              <div class="field-card"><div class="field-label">Perfil RS</div><div class="field-val">${escapeHtml(pData.perfilRS || '-')}</div></div>
            </div>

            <div class="section-title">DESCRIPCIÓN DE ATRIBUTOS</div>
            <div class="grid-3">
              <div class="field-card"><div class="field-label">Cualidades Físicas</div><div class="field-val">${escapeHtml(pData.descFisica || '-')}</div></div>
              <div class="field-card"><div class="field-label">Cualidades Técnicas</div><div class="field-val">${escapeHtml(pData.descTecnica || '-')}</div></div>
              <div class="field-card"><div class="field-label">Aspectos Emocionales</div><div class="field-val">${escapeHtml(pData.descEmocional || '-')}</div></div>
            </div>

            <div class="section-title">COMENTARIO GENERAL DE RENDIMIENTO</div>
            <div class="field-card" style="min-height: 80px;">
              <div class="field-val" style="font-weight: 500; white-space: pre-wrap;">${escapeHtml(pData.comentarioGeneral || 'Sin comentarios registrados.')}</div>
            </div>
          </div>

          <!-- HOJA 5: TRAYECTORIA Y OPINIÓN -->
          <div class="page-break">
            <div class="header-bar">
              <div>
                <div class="header-title">RS Scouting • Ficha Oficial de Jugador</div>
                <div class="header-sub">${escapeHtml(pData.nombre)}</div>
              </div>
              <span class="page-tag">Hoja 5 • Trayectoria & Opinión</span>
            </div>

            <div class="section-title">TRAYECTORIA DEPORTIVA EN CLUBES</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 100px;">TEMPORADA</th>
                  <th>EQUIPO / CLUB</th>
                  <th>ENTRENADOR</th>
                </tr>
              </thead>
              <tbody>
                ${(pData.trayectoria || []).length > 0 ? pData.trayectoria.map(t => `
                  <tr>
                    <td style="font-weight: 700;">${escapeHtml(t.ano || '-')}</td>
                    <td>${escapeHtml(t.club || '-')}</td>
                    <td>${escapeHtml(t.entrenador || '-')}</td>
                  </tr>
                `).join('') : '<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 16px;">Sin historial de trayectoria registrado</td></tr>'}
              </tbody>
            </table>

            <div class="section-title" style="margin-top: 24px;">HISTORIAL DE ENTRENADORES</div>
            <div class="field-card mb-4">
              <div class="field-val" style="font-weight: 500; white-space: pre-wrap;">${escapeHtml(pData.historialEntrenadores || 'Sin información de entrenadores anteriores.')}</div>
            </div>

            <div class="section-title">INFORME DE SCOUTING & OPINIÓN TÉCNICA FINAL</div>
            <div class="field-card" style="min-height: 120px; background: #eff6ff; border-color: #bfdbfe;">
              <div class="field-val" style="font-weight: 600; color: #1e3a8a; white-space: pre-wrap;">${escapeHtml(pData.opinionTecnica || 'Sin informe de opinión técnica registrado.')}</div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
        </html>
      `);
      printWin.document.close();
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
    inputPhoto?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          photoData = ev.target.result;
          document.getElementById('btnUploadPhoto').innerHTML = `<img src="${photoData}" class="photo-upload-preview">`;
        };
        reader.readAsDataURL(file);
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

    // Handle creation of new custom lesión
    const lesSelect = document.getElementById('pfLesiones');
    lesSelect?.addEventListener('change', (e) => {
      if (e.target.value === '__NEW_LESION__') {
        const newLesName = prompt('Introduce la especificación de la nueva lesión:');
        if (newLesName && newLesName.trim()) {
          const trimmed = newLesName.trim();
          if (!state.customLesiones) state.customLesiones = [];
          if (!state.customLesiones.includes(trimmed)) {
            state.customLesiones.push(trimmed);
            saveState();
          }
          const opt = document.createElement('option');
          opt.value = trimmed;
          opt.textContent = trimmed;
          opt.selected = true;
          lesSelect.insertBefore(opt, lesSelect.lastElementChild);
          lesSelect.value = trimmed;
        } else {
          lesSelect.value = '';
        }
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
    const tipo = club.tipo || '';
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
                    <label class="form-label">TIPO DE CLUB</label>
                    <select id="cfTipo" class="form-control">
                      <option value="">Seleccionar tipo...</option>
                      <option value="Profesional" ${tipo === 'Profesional' ? 'selected' : ''}>Profesional</option>
                      <option value="Formador" ${tipo === 'Formador' ? 'selected' : ''}>Formador</option>
                      <option value="Escuela" ${tipo === 'Escuela' ? 'selected' : ''}>Escuela</option>
                      <option value="Juvenil+Senior" ${tipo === 'Juvenil+Senior' ? 'selected' : ''}>Juvenil+Senior</option>
                      <option value="Solo Senior" ${tipo === 'Solo Senior' ? 'selected' : ''}>Solo Senior</option>
                      <option value="Captador" ${tipo === 'Captador' ? 'selected' : ''}>Captador</option>
                      <option value="Nivel Bajo" ${tipo === 'Nivel Bajo' ? 'selected' : ''}>Nivel Bajo</option>
                      <option value="Nivel Medio" ${tipo === 'Nivel Medio' ? 'selected' : ''}>Nivel Medio</option>
                      <option value="Nivel Alto" ${tipo === 'Nivel Alto' ? 'selected' : ''}>Nivel Alto</option>
                      ${tipo && !['Profesional', 'Formador', 'Escuela', 'Juvenil+Senior', 'Solo Senior', 'Captador', 'Nivel Bajo', 'Nivel Medio', 'Nivel Alto'].includes(tipo) ? `<option value="${escapeHtml(tipo)}" selected>${escapeHtml(tipo)}</option>` : ''}
                    </select>
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

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                  <div class="form-group">
                    <label class="form-label">ES CLUB CONVENIDO DE...</label>
                    <input type="text" id="cfConvenidoDe" list="clubesDatalistOptions" class="form-control" placeholder="Buscar club..." value="${escapeHtml(convenidoDe)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">CLUBES CONVENIDOS VINCULADOS</label>
                    <input type="text" id="cfConvenidosVinculados" list="clubesDatalistOptions" class="form-control" placeholder="Buscar club..." value="${escapeHtml(convenidosVinculados)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">PATROCINADOR DE</label>
                    <input type="text" id="cfPatrocinadorDe" list="clubesDatalistOptions" class="form-control" placeholder="Buscar club..." value="${escapeHtml(patrocinadorDe)}">
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
      const nameVal = document.getElementById('cfNombre').value.trim();
      if (!nameVal) return alert('Por favor ingresa el nombre del club');

      const updatedClub = {
        id: isEdit ? clubId : 'c_' + Date.now(),
        nombre: nameVal,
        equipo: nameVal,
        tipo: document.getElementById('cfTipo').value.trim(),
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
        const idx = state.directory.clubes.findIndex(c => c.id === clubId);
        if (idx !== -1) state.directory.clubes[idx] = updatedClub;
      } else {
        state.directory.clubes.unshift(updatedClub);
      }

      // Bidirectional sync for Federación, Estadio, Convenidos & Patrocinador
      const fedVal = updatedClub.federacion;
      const estVal = updatedClub.estadio;
      const convDeVal = updatedClub.convenidoDe;
      const convVincVal = updatedClub.convenidosVinculados;
      const patVal = updatedClub.patrocinadorDe;

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
      syncClubToClub(patVal, 'convenidosVinculados');

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
    });

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
    inputLogo?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          logoData = ev.target.result;
          document.getElementById('btnUploadClubLogo').innerHTML = `<img src="${logoData}" class="photo-upload-preview">`;
        };
        reader.readAsDataURL(file);
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

  function openTeamModal(teamId = null) {
    const isEdit = !!teamId;
    const team = isEdit ? (state.directory.equipos.find(eq => eq.id === teamId) || {}) : {};

    const nombre = team.nombre || team.equipo || '';
    let clubVinculado = team.clubVinculado || team.club || '';
    const categoria = team.categoria || '';
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

    const allPlayersList = (state.directory && state.directory.jugadores && state.directory.jugadores.length) ? state.directory.jugadores : (state.players || []);

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
    let colorPrimary = team.colorPrimary || '#2563eb';
    let colorSecondary = team.colorSecondary || '#ffffff';

    const titleText = isEdit ? `👥 Ficha de ${escapeHtml(nombre)}` : '👥 Nuevo Equipo';

    const modalHTML = `
      <div class="team-modal-wrapper">
        <p class="modal-subtitle mb-2" style="font-size: 12px; color: var(--text-muted);">Configura la identidad y estructura técnica profesional</p>

        <div class="player-modal-subtabs mb-4">
          <button type="button" class="player-subtab active" data-ttab="tecnica">FICHA TÉCNICA</button>
          <button type="button" class="player-subtab" data-ttab="cuerpo">CUERPO TÉCNICO</button>
          <button type="button" class="player-subtab" data-ttab="estilo">ESTILO Y COMP.</button>
          <button type="button" class="player-subtab" data-ttab="plantilla">PLANTILLA</button>
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

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
                  <div class="form-group">
                    <label class="form-label">CATEGORÍA</label>
                    <select id="tfCategoria" class="form-control">
                      <option value="">Seleccionar categoría...</option>
                      ${LISTA_CATEGORIAS_EQUIPO.map(cat => `<option value="${escapeHtml(cat)}" ${categoria === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`).join('')}
                      ${categoria && !LISTA_CATEGORIAS_EQUIPO.includes(categoria) ? `<option value="${escapeHtml(categoria)}" selected>${escapeHtml(categoria)}</option>` : ''}
                    </select>
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
                      ${(state.customCompeticiones || ['Primera Regional Navarra', 'Liga Nacional', 'División de Honor', 'Liga RFEF', 'Primera División', 'Segunda División']).map(c => `<option value="${escapeHtml(c)}" ${competicionVal === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
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
              <span style="font-size: 12px; color: var(--primary-blue); font-weight: 700;" id="lblSelectedPlayersCount">0 en plantilla</span>
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
        </form>
      </div>
    `;

    const card = document.getElementById('generalModalCard');
    card.classList.add('large');

    showModal(titleText, modalHTML, () => {
      const nameVal = document.getElementById('tfNombre').value.trim();
      if (!nameVal) return alert('Por favor ingresa el nombre del equipo');

      const updatedTeam = {
        id: isEdit ? teamId : 'eq_' + Date.now(),
        nombre: nameVal,
        equipo: nameVal,
        clubVinculado: document.getElementById('tfClubVinculado').value.trim(),
        club: document.getElementById('tfClubVinculado').value.trim(),
        categoria: document.getElementById('tfCategoria').value.trim(),
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

        escudo: escudoData,
        logo: escudoData,
        colorPrimary: document.getElementById('tfColorPrimary')?.value || '#2563eb',
        colorSecondary: document.getElementById('tfColorSecondary')?.value || '#ffffff'
      };

      if (!state.directory.equipos) state.directory.equipos = [];
      if (isEdit) {
        const idx = state.directory.equipos.findIndex(eq => eq.id === teamId);
        if (idx !== -1) state.directory.equipos[idx] = updatedTeam;
      } else {
        state.directory.equipos.unshift(updatedTeam);
      }

      // Bidirectional sync for Club Vinculado
      const targetClubName = updatedTeam.clubVinculado;
      if (targetClubName && state.directory.clubes) {
        let parentC = state.directory.clubes.find(c => 
          (c.nombre && c.nombre.toLowerCase() === targetClubName.toLowerCase()) ||
          (c.equipo && c.equipo.toLowerCase() === targetClubName.toLowerCase())
        );
        if (!parentC) {
          parentC = {
            id: 'c_' + Date.now() + Math.floor(Math.random()*100),
            nombre: targetClubName,
            equipo: targetClubName,
            equiposList: []
          };
          state.directory.clubes.unshift(parentC);
        }
        if (!parentC.equiposList) parentC.equiposList = [];
        const exists = parentC.equiposList.some(eq => (typeof eq === 'string' ? eq : eq.nombre) === nameVal);
        if (!exists) parentC.equiposList.push({ id: updatedTeam.id, nombre: nameVal });
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

      // Bidirectional sync for Plantilla (Players)
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

          if (!targetPlayer) {
            targetPlayer = {
              id: 'pl_' + Date.now() + Math.floor(Math.random()*100),
              nombre: playerName,
              jugador: playerName,
              equipoPrincipal: nameVal,
              equipo: nameVal
            };
            playersStore.unshift(targetPlayer);
          } else {
            targetPlayer.equipoPrincipal = nameVal;
            targetPlayer.equipo = nameVal;
          }

          // Also sync with state.players if present
          if (state.players && Array.isArray(state.players)) {
            let pInPlayers = state.players.find(p => 
              (p.nombre && p.nombre.toLowerCase() === playerName.toLowerCase()) ||
              (p.jugador && p.jugador.toLowerCase() === playerName.toLowerCase()) ||
              (p.name && p.name.toLowerCase() === playerName.toLowerCase())
            );
            if (pInPlayers) {
              pInPlayers.equipoPrincipal = nameVal;
              pInPlayers.equipo = nameVal;
            } else {
              state.players.unshift(JSON.parse(JSON.stringify(targetPlayer)));
            }
          }
        });
      }

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    });

    // Auto sync escudo and colors when Club Vinculado is selected
    const inputClubVinc = document.getElementById('tfClubVinculado');
    const inputColorPri = document.getElementById('tfColorPrimary');
    const inputColorSec = document.getElementById('tfColorSecondary');
    const boxEscudo = document.getElementById('btnUploadTeamEscudo');

    const updateFromClub = () => {
      const selectedClubName = inputClubVinc?.value.trim() || '';
      if (!selectedClubName || !state.directory.clubes) return;

      const foundClub = state.directory.clubes.find(c => 
        (c.nombre && c.nombre.toLowerCase() === selectedClubName.toLowerCase()) ||
        (c.equipo && c.equipo.toLowerCase() === selectedClubName.toLowerCase())
      );

      if (foundClub) {
        const clubLogo = foundClub.logo || foundClub.escudo;
        if (clubLogo) {
          escudoData = clubLogo;
          if (boxEscudo) {
            boxEscudo.innerHTML = `<img src="${clubLogo}" class="photo-upload-preview"><input type="file" id="inputTeamEscudo" accept="image/*" class="hidden">`;
          }
        }
        if (foundClub.colorPrimary && inputColorPri) {
          inputColorPri.value = foundClub.colorPrimary;
        }
        if (foundClub.colorSecondary && inputColorSec) {
          inputColorSec.value = foundClub.colorSecondary;
        }
      }
    };

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

      const playersPool = (state.directory && state.directory.jugadores && state.directory.jugadores.length) ? state.directory.jugadores : (state.players || []);
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
      const playersPool = (state.directory && state.directory.jugadores && state.directory.jugadores.length) ? state.directory.jugadores : (state.players || []);

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
      if (window.lucide) window.lucide.createIcons();
    }
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
    inputEscudo?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          escudoData = ev.target.result;
          document.getElementById('btnUploadTeamEscudo').innerHTML = `<img src="${escudoData}" class="photo-upload-preview">`;
        };
        reader.readAsDataURL(file);
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
        const idx = state.directory.federaciones.findIndex(f => f.id === federationId);
        if (idx !== -1) state.directory.federaciones[idx] = updatedFed;
      } else {
        state.directory.federaciones.unshift(updatedFed);
      }

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
    });

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
    inputLogo?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          logoData = ev.target.result;
          document.getElementById('btnUploadFedLogo').innerHTML = `<img src="${logoData}" class="photo-upload-preview">`;
        };
        reader.readAsDataURL(file);
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
          ${((state.directory && state.directory.jugadores) || state.players || []).map(p => `<option value="${escapeHtml(p.nombre || p.jugador || p.name)}"></option>`).join('')}
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
        const idx = state.directory.selecciones.findIndex(s => s.id === selectionId);
        if (idx !== -1) state.directory.selecciones[idx] = updatedSel;
      } else {
        state.directory.selecciones.unshift(updatedSel);
      }

      // Bidirectional sync for Jugadores
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

          if (!targetPlayer) {
            targetPlayer = {
              id: 'p_' + Date.now() + Math.floor(Math.random()*100),
              nombre: playerName,
              jugador: playerName,
              seleccion: nameVal,
              equipoPrincipal: nameVal
            };
            state.directory.jugadores.unshift(targetPlayer);
          } else {
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
    });

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
        const allPlayers = (state.directory && state.directory.jugadores) || state.players || [];
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
    inputLogo?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          logoData = ev.target.result;
          document.getElementById('btnUploadSelLogo').innerHTML = `<img src="${logoData}" class="photo-upload-preview">`;
        };
        reader.readAsDataURL(file);
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
          ${((state.directory && state.directory.jugadores) || state.players || []).map(p => `<option value="${escapeHtml(p.nombre || p.jugador || p.name)}"></option>`).join('')}
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
        const idx = state.directory.convocatorias.findIndex(c => c.id === convocatoriaId);
        if (idx !== -1) state.directory.convocatorias[idx] = updatedConv;
      } else {
        state.directory.convocatorias.unshift(updatedConv);
      }

      // Bidirectional sync for Jugadores
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

          if (!targetPlayer) {
            targetPlayer = {
              id: 'p_' + Date.now() + Math.floor(Math.random()*100),
              nombre: playerName,
              jugador: playerName,
              convocatoria: nameVal,
              seleccion: updatedConv.seleccionVinculada || ''
            };
            state.directory.jugadores.unshift(targetPlayer);
          } else {
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
    });

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
        const allPlayers = (state.directory && state.directory.jugadores) || state.players || [];
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
        const idx = state.directory.torneos.findIndex(t => t.id === tournamentId);
        if (idx !== -1) state.directory.torneos[idx] = updatedTrn;
      } else {
        state.directory.torneos.unshift(updatedTrn);
      }

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
    });

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
    inputLogo?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          logoData = ev.target.result;
          document.getElementById('btnUploadTrnLogo').innerHTML = `<img src="${logoData}" class="photo-upload-preview">`;
        };
        reader.readAsDataURL(file);
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
        const idx = state.directory.staff.findIndex(s => s.id === staffId);
        if (idx !== -1) state.directory.staff[idx] = updatedStaff;
      } else {
        state.directory.staff.unshift(updatedStaff);
      }

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
    });

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
    inputFoto?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          fotoData = ev.target.result;
          document.getElementById('btnUploadStaffFoto').innerHTML = `<img src="${fotoData}" class="photo-upload-preview">`;
        };
        reader.readAsDataURL(file);
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
          ${((state.directory && state.directory.jugadores) || state.players || []).map(p => `<option value="${escapeHtml(p.nombre || p.jugador || p.name)}"></option>`).join('')}
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
        const idx = state.directory.agencias.findIndex(a => a.id === agencyId);
        if (idx !== -1) state.directory.agencias[idx] = updatedAgency;
      } else {
        state.directory.agencias.unshift(updatedAgency);
      }

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

      // Bidirectional sync for Jugadores
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

          if (!targetPl) {
            targetPl = {
              id: 'p_' + Date.now() + Math.floor(Math.random()*100),
              nombre: jName,
              jugador: jName,
              agencia: nameVal,
              agenciaVinculada: nameVal
            };
            state.directory.jugadores.unshift(targetPl);
          } else {
            targetPl.agencia = nameVal;
            targetPl.agenciaVinculada = nameVal;
          }
        });
      }

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    });

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
      ul.innerHTML = localJugadoresList.map((j, idx) => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-bottom: 4px;">
          <span>${escapeHtml(typeof j === 'string' ? j : j.nombre)}</span>
          <button type="button" class="btn-action-icon danger btn-del-ag-jugador" data-idx="${idx}" style="width: 22px; height: 22px;">
            <i data-lucide="trash-2" style="width: 12px;"></i>
          </button>
        </li>
      `).join('');
      ul.querySelectorAll('.btn-del-ag-jugador').forEach(btn => {
        btn.addEventListener('click', () => {
          localJugadoresList.splice(parseInt(btn.dataset.idx, 10), 1);
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
    inputLogo?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          logoData = ev.target.result;
          document.getElementById('btnUploadAgencyLogo').innerHTML = `<img src="${logoData}" class="photo-upload-preview">`;
        };
        reader.readAsDataURL(file);
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
          ${((state.directory && state.directory.jugadores) || state.players || []).map(p => `<option value="${escapeHtml(p.nombre || p.jugador || p.name)}"></option>`).join('')}
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
        const idx = state.directory.agentes.findIndex(a => a.id === agentId);
        if (idx !== -1) state.directory.agentes[idx] = updatedAgent;
      } else {
        state.directory.agentes.unshift(updatedAgent);
      }

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

      // Bidirectional sync for Jugadores
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

          if (!targetPl) {
            targetPl = {
              id: 'p_' + Date.now() + Math.floor(Math.random()*100),
              nombre: jName,
              jugador: jName,
              agente: nameVal,
              agencia: updatedAgent.agencia || ''
            };
            state.directory.jugadores.unshift(targetPl);
          } else {
            targetPl.agente = nameVal;
            if (updatedAgent.agencia) targetPl.agencia = updatedAgent.agencia;
          }
        });
      }

      saveState();
      card.classList.remove('large');
      hideModal();
      renderDirectorio();
    });

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
      ul.innerHTML = localJugadoresList.map((j, idx) => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-bottom: 4px;">
          <span>${escapeHtml(typeof j === 'string' ? j : j.nombre)}</span>
          <button type="button" class="btn-action-icon danger btn-del-agt-jugador" data-idx="${idx}" style="width: 22px; height: 22px;">
            <i data-lucide="trash-2" style="width: 12px;"></i>
          </button>
        </li>
      `).join('');
      ul.querySelectorAll('.btn-del-agt-jugador').forEach(btn => {
        btn.addEventListener('click', () => {
          localJugadoresList.splice(parseInt(btn.dataset.idx, 10), 1);
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
    inputFoto?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          fotoData = ev.target.result;
          document.getElementById('btnUploadAgentFoto').innerHTML = `<img src="${fotoData}" class="photo-upload-preview">`;
        };
        reader.readAsDataURL(file);
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
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="mb-4">
              <div class="form-group">
                <label class="form-label">LOCALIDAD</label>
                <input type="text" id="estLocalidad" class="form-control" placeholder="Ej: Madrid" value="${escapeHtml(localidad)}">
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
        const idx = state.directory.estadios.findIndex(e => e.id === stadiumId);
        if (idx !== -1) state.directory.estadios[idx] = updatedStadium;
      } else {
        state.directory.estadios.unshift(updatedStadium);
      }

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
    });

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
    inputFoto?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          fotoData = ev.target.result;
          document.getElementById('btnUploadStadiumFoto').innerHTML = `<img src="${fotoData}" class="photo-upload-preview">`;
        };
        reader.readAsDataURL(file);
      }
    });

    const removeLargeClass = () => card.classList.remove('large');
    document.getElementById('btnCloseModal')?.addEventListener('click', removeLargeClass, { once: true });
    document.getElementById('btnCancelModal')?.addEventListener('click', removeLargeClass, { once: true });
  }

  function renderDirectorio() {
    const searchVal = document.getElementById('dirSearchInput')?.value.toLowerCase() || '';
    const items = state.directory[currentDirectoryTab] || [];

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

    const filtered = items.filter(item => {
      const text = Object.values(item).join(' ').toLowerCase();
      return !searchVal || text.includes(searchVal);
    });

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
            ${filtered.map(j => `
              <div class="entity-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;" class="mb-2">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${j.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background-color: var(--primary-blue-light); color: var(--primary-blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; overflow: hidden; border: 1px solid var(--border-light);">
                      ${j.foto ? `<img src="${j.foto}" style="width: 100%; height: 100%; object-fit: cover;">` : (j.nombre ? j.nombre.charAt(0) : 'J')}
                    </div>
                    <div>
                      <h3 class="entity-card-title player-name-link cursor-pointer" data-id="${j.id}" title="Ver Ficha Técnica de ${escapeHtml(j.nombre)}" style="margin: 0; font-size: 15px;">
                        ${escapeHtml(j.nombre)} <i data-lucide="external-link" style="width: 12px; opacity: 0.7;"></i>
                      </h3>
                      <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(j.posicion || j.posicionPrincipal || 'Sin Posición')} | ${escapeHtml(j.equipo || 'Sin Equipo')}</span>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${j.id}" style="width: 28px; height: 28px;">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-3">
                  <div><strong>Estado:</strong> <span class="match-category-tag" style="background-color: var(--bg-subtle); color: var(--text-muted);">${escapeHtml(j.estado || 'ALTA')}</span></div>
                  <div><strong>Año / Cat:</strong> ${escapeHtml(j.ano || j.anoNac || '2006')} (${escapeHtml(j.categoria || 'Senior')})</div>
                  ${j.disponibilidad ? `<div><strong>Disponibilidad:</strong> ${escapeHtml(j.disponibilidad)}</div>` : ''}
                </div>

                <button type="button" class="btn btn-secondary btn-open-player-modal" data-id="${j.id}" style="width: 100%; padding: 6px 12px; font-size: 12px;">
                  <i data-lucide="user-check"></i> Ver / Editar Ficha Técnica
                </button>
              </div>
            `).join('')}
          </div>
        `;

        container.querySelectorAll('.player-name-link, .btn-open-player-modal').forEach(el => {
          el.addEventListener('click', () => openPlayerModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            deleteFromFirebase('jugadores', itemId);
            state.directory.jugadores = state.directory.jugadores.filter(i => i.id !== itemId);
            saveState();
            renderDirectorio();
          });
        });
      } else if (currentDirectoryTab === 'clubes') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${filtered.map(c => `
              <div class="entity-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;" class="mb-2">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${c.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
                    <div style="width: 42px; height: 42px; border-radius: var(--radius-md); background-color: var(--primary-blue-light); color: var(--primary-blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; overflow: hidden; border: 1px solid var(--border-light); flex-shrink: 0; position: relative;">
                      <img src="${c.logo || c.escudo || (c.codigo ? `./escudos/${c.codigo}.png` : `./escudos/${(c.nombre || '').toLowerCase().replace(/^(c\.d\.|c\.a\.|a\.d\.|u\.d\.|u\.d\.c\.|c\.f\.|s\.d\.|f\.c\.)\s*/i, '').replace(/[^a-z0-9]/gi, '_')}.png`)}" data-tried="0" onerror="
                        if (this.dataset.tried === '0' && '${c.codigo}') {
                          this.dataset.tried = '1';
                          this.src = 'https://www.futnavarra.es/images/escudos/${c.codigo}.png';
                        } else {
                          this.style.display = 'none';
                          if (this.nextElementSibling) this.nextElementSibling.style.display = 'flex';
                        }
                      " style="width: 100%; height: 100%; object-fit: contain;">
                      <span style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center;">${c.nombre ? c.nombre.charAt(0) : 'C'}</span>
                    </div>
                    <div>
                      <h3 class="entity-card-title club-name-link cursor-pointer" data-id="${c.id}" title="Ver Ficha de ${escapeHtml(c.nombre)}" style="margin: 0; font-size: 15px;">
                        ${escapeHtml(c.nombre)} <i data-lucide="external-link" style="width: 12px; opacity: 0.7;"></i>
                      </h3>
                      <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(c.localidad || 'Localidad N/A')} (${escapeHtml(c.comunidad || 'Comunidad N/A')})</span>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${c.id}" style="width: 28px; height: 28px;">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-3">
                  <div><strong>Estadio:</strong> ${escapeHtml(c.estadio || 'N/A')}</div>
                  <div><strong>Federación:</strong> ${escapeHtml(c.federacion || 'N/A')}</div>
                  ${c.web ? `<div><strong>Web:</strong> <a href="${escapeHtml(c.web)}" target="_blank" style="color: var(--primary-blue);">${escapeHtml(c.web)}</a></div>` : ''}
                </div>

                <button type="button" class="btn btn-secondary btn-open-club-modal" data-id="${c.id}" style="width: 100%; padding: 6px 12px; font-size: 12px;">
                  <i data-lucide="shield-check"></i> Ver / Editar Ficha de Club
                </button>
              </div>
            `).join('')}
          </div>
        `;

        container.querySelectorAll('.club-name-link, .btn-open-club-modal').forEach(el => {
          el.addEventListener('click', () => openClubModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            deleteFromFirebase('clubes', itemId);
            state.directory.clubes = state.directory.clubes.filter(i => i.id !== itemId);
            saveState();
            renderDirectorio();
          });
        });
      } else if (currentDirectoryTab === 'equipos') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${filtered.map(eq => `
              <div class="entity-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;" class="mb-2">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${eq.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
                    <div style="width: 38px; height: 38px; border-radius: var(--radius-md); background-color: var(--primary-blue-light); color: var(--primary-blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; overflow: hidden; border: 1px solid var(--border-light);">
                      ${eq.escudo || eq.logo ? `<img src="${eq.escudo || eq.logo}" style="width: 100%; height: 100%; object-fit: contain;">` : (eq.nombre ? eq.nombre.charAt(0) : 'E')}
                    </div>
                    <div>
                      <h3 class="entity-card-title team-name-link cursor-pointer" data-id="${eq.id}" title="Ver Ficha de ${escapeHtml(eq.nombre)}" style="margin: 0; font-size: 15px;">
                        ${escapeHtml(eq.nombre)} <i data-lucide="external-link" style="width: 12px; opacity: 0.7;"></i>
                      </h3>
                      <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(eq.categoria || 'Sin Cat.')} | ${escapeHtml(eq.temporada || '26/27')}</span>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${eq.id}" style="width: 28px; height: 28px;">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-3">
                  <div><strong>Club:</strong> ${escapeHtml(eq.clubVinculado || eq.club || 'N/A')}</div>
                  <div><strong>Competición:</strong> ${escapeHtml(eq.competicion || 'N/A')}</div>
                  <div><strong>Federación:</strong> ${escapeHtml(eq.federacion || 'N/A')}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-team-modal" data-id="${eq.id}" style="width: 100%; padding: 6px 12px; font-size: 12px;">
                  <i data-lucide="users"></i> Ver / Editar Ficha de Equipo
                </button>
              </div>
            `).join('')}
          </div>
        `;

        container.querySelectorAll('.team-name-link, .btn-open-team-modal').forEach(el => {
          el.addEventListener('click', () => openTeamModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            deleteFromFirebase('equipos', itemId);
            state.directory.equipos = state.directory.equipos.filter(i => i.id !== itemId);
            saveState();
            renderDirectorio();
          });
        });
      } else if (currentDirectoryTab === 'federaciones') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${filtered.map(f => `
              <div class="entity-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;" class="mb-2">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${f.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
                    <div style="width: 38px; height: 38px; border-radius: var(--radius-md); background-color: var(--primary-blue-light); color: var(--primary-blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; overflow: hidden; border: 1px solid var(--border-light);">
                      ${f.logo || f.escudo ? `<img src="${f.logo || f.escudo}" style="width: 100%; height: 100%; object-fit: contain;">` : (f.nombre ? f.nombre.charAt(0) : 'F')}
                    </div>
                    <div>
                      <h3 class="entity-card-title fed-name-link cursor-pointer" data-id="${f.id}" title="Ver Ficha de ${escapeHtml(f.nombre)}" style="margin: 0; font-size: 15px;">
                        ${escapeHtml(f.nombre)} <i data-lucide="external-link" style="width: 12px; opacity: 0.7;"></i>
                      </h3>
                      <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(f.ambito || 'Ámbito N/A')} | ${escapeHtml(f.sede || 'Sede N/A')}</span>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${f.id}" style="width: 28px; height: 28px;">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-3">
                  <div><strong>Email:</strong> ${escapeHtml(f.email || f.correo || 'N/A')}</div>
                  <div><strong>Teléfono:</strong> ${escapeHtml(f.telefono || 'N/A')}</div>
                  ${f.web || f.paginaWeb ? `<div><strong>Web:</strong> <a href="${escapeHtml(f.web || f.paginaWeb)}" target="_blank" style="color: var(--primary-blue);">${escapeHtml(f.web || f.paginaWeb)}</a></div>` : ''}
                </div>

                <button type="button" class="btn btn-secondary btn-open-fed-modal" data-id="${f.id}" style="width: 100%; padding: 6px 12px; font-size: 12px;">
                  <i data-lucide="globe"></i> Ver / Editar Ficha de Federación
                </button>
              </div>
            `).join('')}
          </div>
        `;

        container.querySelectorAll('.fed-name-link, .btn-open-fed-modal').forEach(el => {
          el.addEventListener('click', () => openFederationModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            deleteFromFirebase('federaciones', itemId);
            state.directory.federaciones = state.directory.federaciones.filter(i => i.id !== itemId);
            saveState();
            renderDirectorio();
          });
        });
      } else if (currentDirectoryTab === 'selecciones') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${filtered.map(s => `
              <div class="entity-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;" class="mb-2">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${s.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
                    <div style="width: 38px; height: 38px; border-radius: var(--radius-md); background-color: var(--primary-blue-light); color: var(--primary-blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; overflow: hidden; border: 1px solid var(--border-light);">
                      ${s.logo || s.escudo ? `<img src="${s.logo || s.escudo}" style="width: 100%; height: 100%; object-fit: contain;">` : (s.nombre ? s.nombre.charAt(0) : 'S')}
                    </div>
                    <div>
                      <h3 class="entity-card-title selection-name-link cursor-pointer" data-id="${s.id}" title="Ver Ficha de ${escapeHtml(s.nombre)}" style="margin: 0; font-size: 15px;">
                        ${escapeHtml(s.nombre)} <i data-lucide="external-link" style="width: 12px; opacity: 0.7;"></i>
                      </h3>
                      <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(s.categoria || 'Cat. N/A')} | ${escapeHtml(s.sexo || 'Masculino')}</span>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${s.id}" style="width: 28px; height: 28px;">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-3">
                  <div><strong>Federación:</strong> ${escapeHtml(s.federacion || 'N/A')}</div>
                  <div><strong>Temporada:</strong> ${escapeHtml(s.temporada || '26/27')}</div>
                  <div><strong>Convocados:</strong> ${(s.jugadores && s.jugadores.length) ? s.jugadores.length + ' jugador(es)' : 'Sin convocados'}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-selection-modal" data-id="${s.id}" style="width: 100%; padding: 6px 12px; font-size: 12px;">
                  <i data-lucide="flag"></i> Ver / Editar Ficha de Selección
                </button>
              </div>
            `).join('')}
          </div>
        `;

        container.querySelectorAll('.selection-name-link, .btn-open-selection-modal').forEach(el => {
          el.addEventListener('click', () => openSelectionModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            deleteFromFirebase('selecciones', itemId);
            state.directory.selecciones = state.directory.selecciones.filter(i => i.id !== itemId);
            saveState();
            renderDirectorio();
          });
        });
      } else if (currentDirectoryTab === 'convocatorias') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${filtered.map(c => `
              <div class="entity-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;" class="mb-2">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${c.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
                    <div style="width: 38px; height: 38px; border-radius: var(--radius-md); background-color: var(--primary-blue-light); color: var(--primary-blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; overflow: hidden; border: 1px solid var(--border-light);">
                      <i data-lucide="megaphone" style="width: 18px;"></i>
                    </div>
                    <div>
                      <h3 class="entity-card-title conv-name-link cursor-pointer" data-id="${c.id}" title="Ver Ficha de ${escapeHtml(c.nombre)}" style="margin: 0; font-size: 15px;">
                        ${escapeHtml(c.nombre)} <i data-lucide="external-link" style="width: 12px; opacity: 0.7;"></i>
                      </h3>
                      <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(c.tipoActividad || 'Actividad N/A')} | ${escapeHtml(c.temporada || '26/27')}</span>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${c.id}" style="width: 28px; height: 28px;">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-3">
                  <div><strong>Selección:</strong> ${escapeHtml(c.seleccionVinculada || c.seleccion || 'N/A')}</div>
                  <div><strong>Fechas:</strong> ${escapeHtml(c.fechaInicio || 'N/A')} a ${escapeHtml(c.fechaFin || 'N/A')}</div>
                  <div><strong>Convocados:</strong> ${(c.jugadores && c.jugadores.length) ? c.jugadores.length + ' jugador(es)' : 'Sin convocados'}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-conv-modal" data-id="${c.id}" style="width: 100%; padding: 6px 12px; font-size: 12px;">
                  <i data-lucide="megaphone"></i> Ver / Editar Convocatoria
                </button>
              </div>
            `).join('')}
          </div>
        `;

        container.querySelectorAll('.conv-name-link, .btn-open-conv-modal').forEach(el => {
          el.addEventListener('click', () => openConvocatoriaModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            deleteFromFirebase('convocatorias', itemId);
            state.directory.convocatorias = state.directory.convocatorias.filter(i => i.id !== itemId);
            saveState();
            renderDirectorio();
          });
        });
      } else if (currentDirectoryTab === 'torneos') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${filtered.map(t => `
              <div class="entity-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;" class="mb-2">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${t.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
                    <div style="width: 38px; height: 38px; border-radius: var(--radius-md); background-color: var(--primary-blue-light); color: var(--primary-blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; overflow: hidden; border: 1px solid var(--border-light);">
                      ${t.logo || t.escudo ? `<img src="${t.logo || t.escudo}" style="width: 100%; height: 100%; object-fit: contain;">` : '<i data-lucide="trophy" style="width: 18px;"></i>'}
                    </div>
                    <div>
                      <h3 class="entity-card-title trn-name-link cursor-pointer" data-id="${t.id}" title="Ver Ficha de ${escapeHtml(t.nombre)}" style="margin: 0; font-size: 15px;">
                        ${escapeHtml(t.nombre)} <i data-lucide="external-link" style="width: 12px; opacity: 0.7;"></i>
                      </h3>
                      <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(t.categoria || 'Cat. N/A')} | ${escapeHtml(t.temporada || '26/27')}</span>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${t.id}" style="width: 28px; height: 28px;">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-3">
                  <div><strong>Lugar / Sede:</strong> ${escapeHtml(t.sede || t.lugar || 'N/A')}</div>
                  <div><strong>Participantes:</strong> ${(t.participantes && t.participantes.length) ? t.participantes.length + ' equipo(s)' : 'Sin inscritos'}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-trn-modal" data-id="${t.id}" style="width: 100%; padding: 6px 12px; font-size: 12px;">
                  <i data-lucide="trophy"></i> Ver / Editar Ficha de Torneo
                </button>
              </div>
            `).join('')}
          </div>
        `;

        container.querySelectorAll('.trn-name-link, .btn-open-trn-modal').forEach(el => {
          el.addEventListener('click', () => openTournamentModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            deleteFromFirebase('torneos', itemId);
            state.directory.torneos = state.directory.torneos.filter(i => i.id !== itemId);
            saveState();
            renderDirectorio();
          });
        });
      } else if (currentDirectoryTab === 'staff') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${filtered.map(s => `
              <div class="entity-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;" class="mb-2">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${s.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
                    <div style="width: 38px; height: 38px; border-radius: var(--radius-md); background-color: var(--primary-blue-light); color: var(--primary-blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; overflow: hidden; border: 1px solid var(--border-light);">
                      ${s.foto || s.imagen ? `<img src="${s.foto || s.imagen}" style="width: 100%; height: 100%; object-fit: cover;">` : (s.nombre ? s.nombre.charAt(0) : 'S')}
                    </div>
                    <div>
                      <h3 class="entity-card-title staff-name-link cursor-pointer" data-id="${s.id}" title="Ver Ficha de ${escapeHtml(s.nombre)}" style="margin: 0; font-size: 15px;">
                        ${escapeHtml(s.nombre)} <i data-lucide="external-link" style="width: 12px; opacity: 0.7;"></i>
                      </h3>
                      <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(s.cargo || 'Cargo N/A')}</span>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${s.id}" style="width: 28px; height: 28px;">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-3">
                  <div><strong>Equipo/Club:</strong> ${escapeHtml(s.equipo || s.club || s.seleccion || 'N/A')}</div>
                  <div><strong>Email:</strong> ${escapeHtml(s.email || s.correo || 'N/A')}</div>
                  <div><strong>Teléfono:</strong> ${escapeHtml(s.telefono || 'N/A')}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-staff-modal" data-id="${s.id}" style="width: 100%; padding: 6px 12px; font-size: 12px;">
                  <i data-lucide="user-check"></i> Ver / Editar Ficha de Staff
                </button>
              </div>
            `).join('')}
          </div>
        `;

        container.querySelectorAll('.staff-name-link, .btn-open-staff-modal').forEach(el => {
          el.addEventListener('click', () => openStaffModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            deleteFromFirebase('staff', itemId);
            state.directory.staff = state.directory.staff.filter(i => i.id !== itemId);
            saveState();
            renderDirectorio();
          });
        });
      } else if (currentDirectoryTab === 'agencias') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${filtered.map(ag => `
              <div class="entity-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;" class="mb-2">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${ag.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
                    <div style="width: 38px; height: 38px; border-radius: var(--radius-md); background-color: var(--primary-blue-light); color: var(--primary-blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; overflow: hidden; border: 1px solid var(--border-light);">
                      ${ag.logo || ag.escudo ? `<img src="${ag.logo || ag.escudo}" style="width: 100%; height: 100%; object-fit: contain;">` : '<i data-lucide="briefcase" style="width: 18px;"></i>'}
                    </div>
                    <div>
                      <h3 class="entity-card-title agency-name-link cursor-pointer" data-id="${ag.id}" title="Ver Ficha de ${escapeHtml(ag.nombre)}" style="margin: 0; font-size: 15px;">
                        ${escapeHtml(ag.nombre)} <i data-lucide="external-link" style="width: 12px; opacity: 0.7;"></i>
                      </h3>
                      <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(ag.localidad || 'Localidad N/A')}</span>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${ag.id}" style="width: 28px; height: 28px;">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-3">
                  <div><strong>Email:</strong> ${escapeHtml(ag.email || 'N/A')}</div>
                  <div><strong>Teléfono:</strong> ${escapeHtml(ag.telefono || 'N/A')}</div>
                  <div><strong>Representados:</strong> ${(ag.jugadoresRepresentados && ag.jugadoresRepresentados.length) ? ag.jugadoresRepresentados.length + ' jugador(es)' : 'Sin representados'}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-agency-modal" data-id="${ag.id}" style="width: 100%; padding: 6px 12px; font-size: 12px;">
                  <i data-lucide="briefcase"></i> Ver / Editar Ficha de Agencia
                </button>
              </div>
            `).join('')}
          </div>
        `;

        container.querySelectorAll('.agency-name-link, .btn-open-agency-modal').forEach(el => {
          el.addEventListener('click', () => openAgencyModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            deleteFromFirebase('agencias', itemId);
            state.directory.agencias = state.directory.agencias.filter(i => i.id !== itemId);
            saveState();
            renderDirectorio();
          });
        });
      } else if (currentDirectoryTab === 'agentes') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${filtered.map(agt => `
              <div class="entity-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;" class="mb-2">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${agt.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
                    <div style="width: 38px; height: 38px; border-radius: var(--radius-md); background-color: var(--primary-blue-light); color: var(--primary-blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; overflow: hidden; border: 1px solid var(--border-light);">
                      ${agt.foto || agt.imagen ? `<img src="${agt.foto || agt.imagen}" style="width: 100%; height: 100%; object-fit: cover;">` : (agt.nombre ? agt.nombre.charAt(0) : 'A')}
                    </div>
                    <div>
                      <h3 class="entity-card-title agent-name-link cursor-pointer" data-id="${agt.id}" title="Ver Ficha de ${escapeHtml(agt.nombre)}" style="margin: 0; font-size: 15px;">
                        ${escapeHtml(agt.nombre)} <i data-lucide="external-link" style="width: 12px; opacity: 0.7;"></i>
                      </h3>
                      <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(agt.agencia || 'Sin Agencia')} | ${escapeHtml(agt.localidad || 'N/A')}</span>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${agt.id}" style="width: 28px; height: 28px;">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-3">
                  <div><strong>Email:</strong> ${escapeHtml(agt.email || 'N/A')}</div>
                  <div><strong>Teléfono:</strong> ${escapeHtml(agt.telefono || 'N/A')}</div>
                  <div><strong>Representados:</strong> ${(agt.jugadoresRepresentados && agt.jugadoresRepresentados.length) ? agt.jugadoresRepresentados.length + ' jugador(es)' : 'Sin representados'}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-agent-modal" data-id="${agt.id}" style="width: 100%; padding: 6px 12px; font-size: 12px;">
                  <i data-lucide="user-cog"></i> Ver / Editar Ficha de Agente
                </button>
              </div>
            `).join('')}
          </div>
        `;

        container.querySelectorAll('.agent-name-link, .btn-open-agent-modal').forEach(el => {
          el.addEventListener('click', () => openAgentModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            deleteFromFirebase('agentes', itemId);
            state.directory.agentes = state.directory.agentes.filter(i => i.id !== itemId);
            saveState();
            renderDirectorio();
          });
        });
      } else if (currentDirectoryTab === 'estadios') {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${filtered.map(est => `
              <div class="entity-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;" class="mb-2">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${est.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
                    <div style="width: 38px; height: 38px; border-radius: var(--radius-md); background-color: var(--primary-blue-light); color: var(--primary-blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; overflow: hidden; border: 1px solid var(--border-light);">
                      ${est.foto || est.imagen ? `<img src="${est.foto || est.imagen}" style="width: 100%; height: 100%; object-fit: cover;">` : '<i data-lucide="map-pin" style="width: 18px;"></i>'}
                    </div>
                    <div>
                      <h3 class="entity-card-title stadium-name-link cursor-pointer" data-id="${est.id}" title="Ver Ficha de ${escapeHtml(est.nombre)}" style="margin: 0; font-size: 15px;">
                        ${escapeHtml(est.nombre)} <i data-lucide="external-link" style="width: 12px; opacity: 0.7;"></i>
                      </h3>
                      <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(est.localidad || 'N/A')} | ${escapeHtml(est.superficie || 'Superficie N/A')}</span>
                    </div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${est.id}" style="width: 28px; height: 28px;">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;" class="mb-3">
                  <div><strong>Capacidad:</strong> ${escapeHtml(est.capacidad ? est.capacidad + ' espectadores' : 'N/A')}</div>
                  <div><strong>Dimensiones:</strong> ${escapeHtml(est.dimensiones || 'N/A')}</div>
                  <div><strong>Clubes:</strong> ${(est.clubes && est.clubes.length) ? est.clubes.length + ' club(es)' : 'Sin clubes'}</div>
                </div>

                <button type="button" class="btn btn-secondary btn-open-stadium-modal" data-id="${est.id}" style="width: 100%; padding: 6px 12px; font-size: 12px;">
                  <i data-lucide="map-pin"></i> Ver / Editar Ficha de Estadio
                </button>
              </div>
            `).join('')}
          </div>
        `;

        container.querySelectorAll('.stadium-name-link, .btn-open-stadium-modal').forEach(el => {
          el.addEventListener('click', () => openStadiumModal(el.dataset.id));
        });

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            deleteFromFirebase('estadios', itemId);
            state.directory.estadios = state.directory.estadios.filter(i => i.id !== itemId);
            saveState();
            renderDirectorio();
          });
        });
      } else {
        container.innerHTML = `
          ${bulkToolbarHTML}
          <div class="directory-cards-grid">
            ${filtered.map(item => `
              <div class="entity-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" class="dir-item-checkbox" data-id="${item.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-blue, #2563eb);">
                    <div class="entity-card-title">${escapeHtml(item.nombre || item.titulo || item.equipo || 'Registro')}</div>
                  </div>
                  <button class="btn-action-icon danger btn-delete-dir-item" data-id="${item.id}" style="width: 28px; height: 28px;">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                  </button>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 2px;">
                  ${Object.entries(item).filter(([k]) => k !== 'id' && k !== 'nombre').slice(0, 4).map(([k, v]) => `
                    <div><strong style="text-transform: capitalize;">${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}</div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `;

        container.querySelectorAll('.btn-delete-dir-item').forEach(btn => {
          btn.addEventListener('click', () => {
            const itemId = btn.dataset.id;
            deleteFromFirebase(currentDirectoryTab, itemId);
            state.directory[currentDirectoryTab] = state.directory[currentDirectoryTab].filter(i => i.id !== itemId);
            saveState();
            renderDirectorio();
          });
        });
      }

      // Attach Bulk Selection & Deletion Logic
      const selectAllCb = document.getElementById('dirSelectAllCheckbox');
      const itemCbs = container.querySelectorAll('.dir-item-checkbox');
      const bulkDeleteBtn = document.getElementById('btnBulkDeleteDir');
      const selectedCountSpan = document.getElementById('dirSelectedCount');
      const bulkDeleteBadge = document.getElementById('dirBulkDeleteBadge');

      const updateBulkUI = () => {
        const checkedCbs = container.querySelectorAll('.dir-item-checkbox:checked');
        const count = checkedCbs.length;
        if (selectedCountSpan) selectedCountSpan.textContent = count;
        if (bulkDeleteBadge) bulkDeleteBadge.textContent = count;
        
        if (count > 0) {
          bulkDeleteBtn?.classList.remove('hidden');
        } else {
          bulkDeleteBtn?.classList.add('hidden');
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

      bulkDeleteBtn?.addEventListener('click', () => {
        const checkedCbs = container.querySelectorAll('.dir-item-checkbox:checked');
        const idsToDelete = Array.from(checkedCbs).map(cb => cb.dataset.id);
        if (idsToDelete.length === 0) return;

        const tabNameDisplay = currentDirectoryTab.toUpperCase();
        if (confirm(`¿Estás seguro de que deseas eliminar permanentemente los ${idsToDelete.length} registros seleccionados de la sección ${tabNameDisplay}?`)) {
          if (state.directory && Array.isArray(state.directory[currentDirectoryTab])) {
            deleteMultipleFromFirebase(currentDirectoryTab, idsToDelete);
            state.directory[currentDirectoryTab] = state.directory[currentDirectoryTab].filter(item => !idsToDelete.includes(item.id));
            saveState();
            alert(`¡Se han eliminado ${idsToDelete.length} registros del Directorio y de Firebase con éxito!`);
            renderDirectorio();
          }
        }
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  document.getElementById('dirSearchInput')?.addEventListener('input', renderDirectorio);
  document.getElementById('btnResetDirFilters')?.addEventListener('click', () => {
    const input = document.getElementById('dirSearchInput');
    if (input) input.value = '';
    renderDirectorio();
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
      saveState();
      hideModal();
      renderDirectorio();
    });
  }

  // --------------------------------------------------------------------------
  // 7. SECTION 4: IMPORTADOR INTELIGENTE
  // --------------------------------------------------------------------------
  function extractStadiumFromFederationLine(line) {
    if (!line || !line.trim()) return null;
    const s = line.trim();

    // Skip table header
    if (/^(nombre|dirección|localidad|provincia|superficie|tipo)/i.test(s)) return null;

    // Split by tab or 2+ spaces
    const parts = line.trim().split(/\t|\s{2,}/).map(p => p.trim()).filter(Boolean);
    if (parts.length < 2) return null;

    const nombre = parts[0];
    const direccion = parts[1] || '';
    let localidad = parts[2] || '';
    const provincia = parts[3] || 'Navarra';
    const superficie = parts[4] || 'Hierba Artificial';
    const tipo = parts[5] || 'Fútbol 11';

    if (/^\d{5}$/.test(localidad)) {
      localidad = 'Navarra';
    }

    if (!nombre || nombre.length < 2) return null;

    return {
      id: 'est_' + Date.now() + Math.random().toString(36).substr(2, 4),
      nombre: nombre,
      direccion: direccion,
      localidad: localidad,
      comunidad: provincia,
      superficie: superficie,
      tipo: tipo
    };
  }

  function extractClubFromFederationLine(line) {
    if (!line || !line.trim()) return null;
    let s = line.trim().replace(/\u00A0/g, ' ');

    // Skip table header
    if (/^(código|codigo|club|nombre|localidad|provincia|federación)/i.test(s)) {
      return null;
    }

    let codigo = '';
    let nombre = '';
    let localidad = '';
    let comunidad = '';
    let numEquipos = '';

    // First try splitting by tab or 2+ whitespace characters
    let parts = s.split(/\t|\s{2,}/).map(p => p.trim()).filter(Boolean);

    if (parts.length >= 2) {
      if (/^\d+$/.test(parts[0])) {
        codigo = parts[0];
        nombre = parts[1] || '';
        localidad = parts[2] || '';
        comunidad = parts[3] || '';
        numEquipos = parts[4] || '';
      } else {
        nombre = parts[0];
        localidad = parts[1] || '';
        comunidad = parts[2] || '';
        numEquipos = parts[3] || '';
      }
    } else {
      // Single spaces fallback (e.g. "1001 Club Atlético Osasuna Pamplona Navarra 19")
      const codeMatch = s.match(/^(\d{3,6})\s+(.+)$/);
      if (codeMatch) {
        codigo = codeMatch[1];
        s = codeMatch[2].trim();
      }

      const teamsMatch = s.match(/^(.+?)\s+(\d{1,3})$/);
      if (teamsMatch) {
        numEquipos = teamsMatch[2];
        s = teamsMatch[1].trim();
      }

      const provMatch = s.match(/^(.+?)\s+(Navarra|La Rioja|Aragón|País Vasco|Gipuzkoa|Bizkaia|Álava)$/i);
      if (provMatch) {
        comunidad = provMatch[2];
        s = provMatch[1].trim();
      }

      const words = s.split(/\s+/);
      if (words.length >= 2) {
        localidad = words.pop();
        nombre = words.join(' ');
      } else {
        nombre = s;
      }
    }

    if (!nombre || nombre.length < 2) return null;

    const logoUrl = codigo ? `https://www.futnavarra.es/images/escudos/${codigo}.png` : '';

    return {
      id: 'c_' + (codigo || Date.now() + Math.random().toString(36).substr(2, 4)),
      codigo: codigo,
      nombre: nombre,
      localidad: localidad || 'Pamplona',
      comunidad: comunidad || 'Navarra',
      federacion: comunidad === 'La Rioja' ? 'Federación Riojana de Fútbol' : 'Federación Navarra de Fútbol',
      numEquipos: numEquipos || '1',
      logo: logoUrl,
      escudo: logoUrl
    };
  }

  function extractFullTeamNameFromStandingsLine(line) {
    if (!line || !line.trim()) return null;
    let s = line.trim();

    // Skip table headers (Pos, Equipo, PJ, PG, PE, PP, GF, GC, Ptos)
    if (/^(pos|equipo|club|pj|pg|pe|pp|gf|gc|pts|puntos|clasificación|tabla)/i.test(s)) {
      return null;
    }

    // 1. If line is tab-separated (standard federative copy-paste from FNF/RFEF)
    if (line.includes('\t')) {
      const tabParts = line.split('\t').map(p => p.trim()).filter(Boolean);
      for (let i = 0; i < tabParts.length; i++) {
        const part = tabParts[i];
        // Look for the column containing letters (team name)
        if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(part) && part.length > 2) {
          const cleanName = part.replace(/^\d+[\s\.\-\)\:ºª]+/, '').trim();
          if (cleanName.length > 2) return cleanName;
        }
      }
    }

    // 2. Fallback space-separated parser
    // Strip leading ranking numbers (e.g., "1. ", "12 - ", "1 ", "1º ")
    s = s.replace(/^\s*\d+[\s\.\-\)\:ºª]+/, '').trim();

    // Strip trailing standings statistics (e.g. "38 12 4 2 24 10 40", "0,0000 0 0 0 0 0 0")
    s = s.replace(/(\s+[\d\,\.]+|\s+\-){2,}\s*$/, '').trim();
    s = s.replace(/\s+[\d\,\.]+\s*$/, '').trim();

    // Strip surrounding quotes or parentheses
    s = s.replace(/^["'\(\[]+|["'\)\]]+$/g, '').trim();

    if (s.length < 2 || !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(s)) return null;

    return s;
  }

  function autoMatchClubName(teamName) {
    if (!teamName || !state.directory || !state.directory.clubes) return teamName;
    const cleanTeam = teamName.toLowerCase().replace(/^(c\.d\.|c\.a\.|a\.d\.|u\.d\.|u\.d\.c\.|c\.f\.|s\.d\.|f\.c\.)\s*/, '').trim();

    const matched = state.directory.clubes.find(c => {
      const cleanClub = c.nombre.toLowerCase().replace(/^(c\.d\.|c\.a\.|a\.d\.|u\.d\.|u\.d\.c\.|c\.f\.|s\.d\.|f\.c\.)\s*/, '').trim();
      return cleanClub === cleanTeam || c.nombre.toLowerCase().trim() === teamName.toLowerCase().trim();
    });

    return matched ? matched.nombre : teamName;
  }

  function populateImporterTeamSelect() {
    const sel = document.getElementById('importerTargetEquipo');
    if (!sel || !state.directory) return;

    const equipos = state.directory.equipos || [];
    if (equipos.length === 0) {
      sel.innerHTML = `
        <option value="" disabled selected>-- No hay equipos en el Directorio (Importa primero Equipos) --</option>
        <option value="MANUAL">✍️ Escribir nombre del equipo manualmente...</option>
      `;
      return;
    }

    let html = `<option value="" disabled selected>-- Selecciona un Equipo del Directorio --</option>`;
    equipos.forEach(eq => {
      const label = `${eq.nombre} (${eq.categoria || 'Senior'} - ${eq.temporada || '2026/2027'})`;
      html += `<option value="${escapeHtml(eq.id)}" data-nombre="${escapeHtml(eq.nombre)}" data-categoria="${escapeHtml(eq.categoria || 'Senior')}" data-temporada="${escapeHtml(eq.temporada || '2026/2027')}">${escapeHtml(label)}</option>`;
    });
    html += `<option value="MANUAL">✍️ Otro equipo no listado (Manual)...</option>`;
    sel.innerHTML = html;
  }

  document.getElementById('importerTargetEquipo')?.addEventListener('change', (e) => {
    const manualInput = document.getElementById('importerManualEquipoInput');
    const catContainer = document.getElementById('importerCatContainer');
    const tempContainer = document.getElementById('importerTempContainer');

    if (e.target.value === 'MANUAL') {
      manualInput?.classList.remove('hidden');
      catContainer?.classList.remove('hidden');
      tempContainer?.classList.remove('hidden');
    } else {
      manualInput?.classList.add('hidden');
      catContainer?.classList.add('hidden');
      tempContainer?.classList.add('hidden');
    }
  });

  function updateImporterContextVisibility() {
    const entityType = document.getElementById('importerEntityType')?.value;
    const contextBox = document.getElementById('importerContextOptions');
    const catContainer = document.getElementById('importerCatContainer');
    const tempContainer = document.getElementById('importerTempContainer');
    const manualInput = document.getElementById('importerManualEquipoInput');

    if (!contextBox) return;

    if (entityType === 'plantilla' || entityType === 'jugadores' || entityType === 'staff') {
      contextBox.classList.remove('hidden');
      populateImporterTeamSelect();
      manualInput?.classList.add('hidden');
      // Hide category & season by default since they are inherited from team
      catContainer?.classList.add('hidden');
      tempContainer?.classList.add('hidden');
    } else if (entityType === 'equipos') {
      contextBox.classList.remove('hidden');
      const teamSel = document.getElementById('importerTargetEquipo');
      if (teamSel) teamSel.closest('.form-group').style.display = 'none';
      catContainer?.classList.remove('hidden');
      tempContainer?.classList.remove('hidden');
    } else {
      contextBox.classList.add('hidden');
    }
  }

  document.getElementById('importerEntityType')?.addEventListener('change', updateImporterContextVisibility);

  let stagedImportItems = [];
  let stagedEntityType = 'equipos';

  document.getElementById('btnRunImporter')?.addEventListener('click', () => {
    const rawText = document.getElementById('importerRawContent').value.trim();
    const entityType = document.getElementById('importerEntityType').value;
    
    let targetEquipoName = 'Sin equipo';
    let categoria = document.getElementById('importerCategoria')?.value || 'Senior';
    let temporada = document.getElementById('importerTemporada')?.value || '2026/2027';

    const targetEquipoSel = document.getElementById('importerTargetEquipo');
    const manualEquipoInput = document.getElementById('importerManualEquipoInput');

    if (entityType === 'plantilla' || entityType === 'jugadores' || entityType === 'staff') {
      if (targetEquipoSel && targetEquipoSel.value && targetEquipoSel.value !== 'MANUAL') {
        const opt = targetEquipoSel.options[targetEquipoSel.selectedIndex];
        targetEquipoName = opt.dataset.nombre || opt.text;
        categoria = opt.dataset.categoria || 'Senior';
        temporada = opt.dataset.temporada || '2026/2027';
      } else if (targetEquipoSel && targetEquipoSel.value === 'MANUAL' && manualEquipoInput && manualEquipoInput.value.trim()) {
        targetEquipoName = manualEquipoInput.value.trim();
        categoria = document.getElementById('importerCategoria')?.value || 'Senior';
        temporada = document.getElementById('importerTemporada')?.value || '2026/2027';
      } else if (targetEquipoSel && targetEquipoSel.value === 'MANUAL') {
        return alert('Por favor escribe el nombre del nuevo equipo manual');
      } else {
        return alert('Por favor selecciona primero un Equipo del Directorio para vincular la plantilla');
      }
    }

    if (!rawText) return alert('Pega primero el texto o tabla copiada de la web federativa');

    const lines = rawText.split('\n');
    stagedImportItems = [];
    stagedEntityType = entityType;

    if (entityType === 'plantilla' || entityType === 'jugadores' || entityType === 'staff') {
      let currentSection = 'Jugadores';

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Header check: "Jugadores (12)", "Delegados (1)", "Auxiliares (3)", "Entrenadores (2)"
        const headerMatch = trimmed.match(/^([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)\s*\(\d+\)$/i);
        if (headerMatch) {
          currentSection = headerMatch[1].trim();
          return;
        }

        // Skip generic table headers
        if (/^(nombre|apellidos|dorsal|posición|licencia)/i.test(trimmed)) return;

        // Format "Apellidos, Nombre" -> "Nombre Apellidos"
        let formattedName = trimmed;
        if (trimmed.includes(',')) {
          const parts = trimmed.split(',').map(p => p.trim());
          if (parts.length === 2 && parts[0] && parts[1]) {
            formattedName = `${parts[1]} ${parts[0]}`;
          }
        }

        // Title Case conversion
        formattedName = formattedName.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());

        if (formattedName.length < 2) return;

        const isStaff = /delegado|auxiliar|entrenador|tecnico|técnico|preparador|medico|médico|fisioterapeuta|encargado/i.test(currentSection);

        if (isStaff || entityType === 'staff') {
          let cargo = 'Técnico';
          if (/delegado/i.test(currentSection)) cargo = 'Delegado';
          else if (/auxiliar/i.test(currentSection)) cargo = 'Auxiliar';
          else if (/entrenador/i.test(currentSection)) cargo = 'Entrenador';
          else if (/preparador/i.test(currentSection)) cargo = 'Preparador Físico';
          else if (/médico|medico/i.test(currentSection)) cargo = 'Médico';
          else if (/fisio/i.test(currentSection)) cargo = 'Fisioterapeuta';

          let existing = state.directory.staff?.find(item => 
            (item.nombre || item.staff || '').toLowerCase().trim() === formattedName.toLowerCase().trim()
          );

          stagedImportItems.push({
            id: 'st_' + Date.now() + Math.random().toString(36).substr(2, 4),
            nombre: formattedName,
            staff: formattedName,
            cargo: cargo,
            equipo: targetEquipoName,
            categoria: categoria,
            temporada: temporada,
            tipoEntidad: 'staff',
            seccionLabel: `📋 Staff (${cargo})`,
            isDuplicate: !!existing
          });
        } else {
          let existing = state.directory.jugadores?.find(item => 
            (item.nombre || '').toLowerCase().trim() === formattedName.toLowerCase().trim()
          );

          stagedImportItems.push({
            id: 'j_' + Date.now() + Math.random().toString(36).substr(2, 4),
            nombre: formattedName,
            posicion: 'Por definir',
            equipo: targetEquipoName,
            categoria: categoria,
            temporada: temporada,
            tipoEntidad: 'jugadores',
            seccionLabel: '🏃 Jugador',
            isDuplicate: !!existing
          });
        }
      });
    } else {
      lines.forEach(line => {
        if (entityType === 'clubes') {
          const clubData = extractClubFromFederationLine(line);
          if (clubData) {
            let existing = state.directory.clubes?.find(item => 
              (item.codigo && clubData.codigo && item.codigo === clubData.codigo) ||
              item.nombre.toLowerCase().trim() === clubData.nombre.toLowerCase().trim()
            );
            clubData.tipoEntidad = 'clubes';
            clubData.seccionLabel = '🛡️ Club';
            clubData.isDuplicate = !!existing;
            stagedImportItems.push(clubData);
          }
        } else if (entityType === 'estadios') {
          const estData = extractStadiumFromFederationLine(line);
          if (estData) {
            let existing = state.directory.estadios?.find(item => 
              (item.nombre || item.estadio || '').toLowerCase().trim() === estData.nombre.toLowerCase().trim()
            );
            estData.tipoEntidad = 'estadios';
            estData.seccionLabel = '🏟️ Estadio';
            estData.isDuplicate = !!existing;
            stagedImportItems.push(estData);
          }
        } else if (entityType === 'equipos') {
          const teamName = extractFullTeamNameFromStandingsLine(line);
          if (teamName) {
            const linkedClub = autoMatchClubName(teamName);
            let existing = state.directory.equipos?.find(item => 
              item.nombre.toLowerCase().trim() === teamName.toLowerCase().trim() &&
              (item.categoria || '').toLowerCase().trim() === categoria.toLowerCase().trim()
            );
            stagedImportItems.push({
              id: 'eq_' + Date.now() + Math.random().toString(36).substr(2, 4),
              nombre: teamName,
              categoria: categoria,
              club: linkedClub,
              temporada: temporada,
              tipoEntidad: 'equipos',
              seccionLabel: '👕 Equipo',
              isDuplicate: !!existing
            });
          }
        }
      });
    }

    if (stagedImportItems.length === 0) return alert('No se pudieron extraer registros automáticamente. Revisa el texto e intenta de nuevo.');

    renderStagedImporterReview();
  });

  function renderStagedImporterReview() {
    const resultsContainer = document.getElementById('importerResultsContainer');
    if (!resultsContainer) return;
    resultsContainer.classList.remove('hidden');

    const countNew = stagedImportItems.filter(i => !i.isDuplicate).length;
    const countExisting = stagedImportItems.filter(i => i.isDuplicate).length;

    let tableRowsHtml = '';
    stagedImportItems.forEach((item, idx) => {
      tableRowsHtml += `
        <tr style="border-bottom: 1px solid var(--border-light); background: ${item.isDuplicate ? '#fffbeb' : 'var(--bg-card)'};">
          <td style="padding: 10px; text-align: center;">
            <input type="checkbox" class="staged-item-cb" data-idx="${idx}" checked style="width: 16px; height: 16px; cursor: pointer;">
          </td>
          <td style="padding: 10px;">
            <span style="font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 12px; ${item.isDuplicate ? 'background: #fef3c7; color: #b45309; border: 1px solid #fcd34d;' : 'background: #dcfce7; color: #15803d; border: 1px solid #86efac;'}">
              ${item.isDuplicate ? '⚠️ YA EXISTE' : '✨ NUEVO'}
            </span>
          </td>
          <td style="padding: 10px;">
            <span style="font-size: 11px; font-weight: 700; background: var(--bg-subtle); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-light);">
              ${escapeHtml(item.seccionLabel || 'Registro')}
            </span>
          </td>
          <td style="padding: 10px; font-weight: 700;">
            ${escapeHtml(item.nombre)}
          </td>
          <td style="padding: 10px;">
            ${(item.equipo || item.club) ? `
              <span style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">
                🛡️ ${escapeHtml(item.equipo || item.club)}
              </span>
            ` : (item.localidad ? escapeHtml(item.localidad + ', ' + item.comunidad) : 'N/A')}
          </td>
          <td style="padding: 10px; font-size: 12px; color: var(--text-muted);">
            ${item.categoria ? `${escapeHtml(item.categoria)} (${escapeHtml(item.temporada)})` : (item.codigo ? `Cód: ${item.codigo}` : 'N/A')}
          </td>
        </tr>
      `;
    });

    resultsContainer.innerHTML = `
      <div class="importador-card" style="border: 2px solid var(--primary); shadow: var(--shadow-lg);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 17px; font-weight: 800; margin: 0; color: var(--primary);">📋 Paso 2: Revisar y Confirmar Datos Extraídos</h3>
            <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">Verifica que los clubes vinculados y nombres son correctos antes de guardar en el Directorio.</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <span style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800;">
              ✨ ${countNew} Nuevos
            </span>
            ${countExisting > 0 ? `
              <span style="background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800;">
                ⚠️ ${countExisting} Existentes (Se actualizarán)
              </span>
            ` : ''}
          </div>
        </div>
        <div style="max-height: 380px; overflow-y: auto; border: 1px solid var(--border-light); border-radius: var(--radius-md); margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: var(--bg-subtle); border-bottom: 2px solid var(--border-light); text-align: left;">
                <th style="padding: 10px; text-align: center; width: 40px;">
                  <input type="checkbox" id="stagedSelectAllCb" checked style="width: 16px; height: 16px; cursor: pointer;">
                </th>
                <th style="padding: 10px;">ESTADO</th>
                <th style="padding: 10px;">SECCIÓN</th>
                <th style="padding: 10px;">NOMBRE EXTRAÍDO</th>
                <th style="padding: 10px;">EQUIPO / CLUB VINCULADO</th>
                <th style="padding: 10px;">CATEGORÍA / DATOS</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <button type="button" class="btn btn-outline-danger" id="btnCancelStagedImporter">
            <i data-lucide="x"></i> Cancelar / Descartar
          </button>
          <button type="button" class="btn btn-success btn-lg" id="btnConfirmStagedImporter" style="font-weight: 800; padding: 12px 24px;">
            <i data-lucide="check-circle-2"></i> 💾 Confirmar y Guardar en el Directorio
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Attach listeners
    const selectAllCb = document.getElementById('stagedSelectAllCb');
    const itemCbs = resultsContainer.querySelectorAll('.staged-item-cb');
    selectAllCb?.addEventListener('change', (e) => {
      itemCbs.forEach(cb => cb.checked = e.target.checked);
    });

    document.getElementById('btnCancelStagedImporter')?.addEventListener('click', () => {
      stagedImportItems = [];
      resultsContainer.classList.add('hidden');
    });

    document.getElementById('btnConfirmStagedImporter')?.addEventListener('click', () => {
      const checkedIndices = Array.from(itemCbs).filter(cb => cb.checked).map(cb => parseInt(cb.dataset.idx));
      if (checkedIndices.length === 0) return alert('Selecciona al menos un registro para guardar');

      const itemsToSave = checkedIndices.map(idx => stagedImportItems[idx]);

      let savedNew = 0;
      let updatedExisting = 0;

      if (stagedEntityType === 'clubes') {
        if (!state.directory.clubes) state.directory.clubes = [];
        itemsToSave.forEach(c => {
          let existing = state.directory.clubes.find(item => 
            (item.codigo && c.codigo && item.codigo === c.codigo) ||
            item.nombre.toLowerCase().trim() === c.nombre.toLowerCase().trim()
          );
          const crestUrl = c.logo || c.escudo || (c.codigo ? `https://www.futnavarra.es/images/escudos/${c.codigo}.png` : '');
          if (existing) {
            existing.localidad = c.localidad || existing.localidad;
            existing.comunidad = c.comunidad || existing.comunidad;
            if (c.codigo) existing.codigo = c.codigo;
            if (c.numEquipos) existing.numEquipos = c.numEquipos;
            if (crestUrl && (!existing.logo || !existing.escudo)) {
              existing.logo = crestUrl;
              existing.escudo = crestUrl;
            }
            updatedExisting++;
          } else {
            savedNew++;
            state.directory.clubes.unshift({
              id: c.id,
              codigo: c.codigo,
              nombre: c.nombre,
              localidad: c.localidad,
              comunidad: c.comunidad,
              federacion: c.federacion,
              numEquipos: c.numEquipos,
              logo: crestUrl,
              escudo: crestUrl,
              estadio: '',
              web: ''
            });
          }
        });
      } else if (stagedEntityType === 'equipos') {
        if (!state.directory.equipos) state.directory.equipos = [];
        itemsToSave.forEach(eq => {
          let existing = state.directory.equipos.find(item => 
            item.nombre.toLowerCase().trim() === eq.nombre.toLowerCase().trim() &&
            (item.categoria || '').toLowerCase().trim() === eq.categoria.toLowerCase().trim()
          );
          if (existing) {
            existing.club = eq.club;
            existing.temporada = eq.temporada;
            updatedExisting++;
          } else {
            savedNew++;
            state.directory.equipos.unshift({
              id: eq.id,
              nombre: eq.nombre,
              categoria: eq.categoria,
              club: eq.club,
              temporada: eq.temporada,
              estiloJuego: '',
              abp: ''
            });
          }
        });
      } else if (stagedEntityType === 'estadios') {
        if (!state.directory.estadios) state.directory.estadios = [];
        itemsToSave.forEach(st => {
          let existing = state.directory.estadios.find(item => 
            (item.nombre || item.estadio || '').toLowerCase().trim() === st.nombre.toLowerCase().trim()
          );
          if (existing) {
            existing.direccion = st.direccion || existing.direccion;
            existing.localidad = st.localidad || existing.localidad;
            existing.superficie = st.superficie || existing.superficie;
            if (st.tipo) existing.tipo = st.tipo;
            updatedExisting++;
          } else {
            savedNew++;
            state.directory.estadios.unshift({
              id: st.id,
              nombre: st.nombre,
              estadio: st.nombre,
              direccion: st.direccion,
              localidad: st.localidad,
              comunidad: st.comunidad,
              superficie: st.superficie,
              tipo: st.tipo,
              capacidad: '',
              dimensiones: '',
              notas: ''
            });
          }
        });
      } else {
        itemsToSave.forEach(item => {
          const targetTab = item.tipoEntidad || stagedEntityType;
          if (!state.directory[targetTab]) state.directory[targetTab] = [];

          let existing = state.directory[targetTab].find(existingItem => 
            (existingItem.nombre || existingItem.staff || '').toLowerCase().trim() === item.nombre.toLowerCase().trim()
          );
          if (existing) {
            if (item.equipo) existing.equipo = item.equipo;
            if (item.cargo) existing.cargo = item.cargo;
            if (item.categoria) existing.categoria = item.categoria;
            updatedExisting++;
          } else {
            savedNew++;
            state.directory[targetTab].unshift(item);
          }
        });
      }

      saveState();

      const destinationTab = stagedEntityType === 'plantilla' ? 'jugadores' : stagedEntityType;
      resultsContainer.innerHTML = `
        <div class="importador-card" style="border-color: var(--accent-green, #10b981); background: #f0fdf4; text-align: center; padding: 24px;">
          <i data-lucide="check-circle-2" style="width: 48px; height: 48px; color: #15803d; margin: 0 auto 12px auto; display: block;"></i>
          <h3 style="font-size: 18px; font-weight: 800; color: #15803d; margin-bottom: 8px;">¡Importación Guardada con Éxito!</h3>
          <p style="font-size: 14px; color: #166534; margin-bottom: 16px;">Se han guardado <strong>${itemsToSave.length} registros</strong> en el Directorio y sincronizado con Firebase Cloud Firestore (${savedNew} nuevos, ${updatedExisting} actualizados).</p>
          <button type="button" class="btn btn-primary btn-lg" onclick="navigateToDirectoryTab('${destinationTab}')" style="font-weight: 800; padding: 12px 24px; cursor: pointer;">
            <i data-lucide="folder"></i> Ir al Directorio (${destinationTab.toUpperCase()}) para ver los datos
          </button>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    });
  }

  // --------------------------------------------------------------------------
  // 8. SECTION 5: AGENDA
  // --------------------------------------------------------------------------
  let currentAgendaCat = 'all';

  function initAgendaFilters() {
    const list = document.querySelectorAll('#agendaCategoryFilters li');
    list.forEach(item => {
      item.addEventListener('click', () => {
        list.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentAgendaCat = item.dataset.cat;
        renderAgenda();
      });
    });
  }

  function renderAgenda() {
    const filtered = state.agenda.filter(t => currentAgendaCat === 'all' || t.categoria === currentAgendaCat);
    const container = document.getElementById('agendaTasksContainer');

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 40px; background-color: var(--bg-card); border-radius: var(--radius-lg);">
          <p class="empty-state-text">No hay tareas o notas en esta categoría.</p>
        </div>
      `;
    } else {
      container.innerHTML = filtered.map(t => `
        <div class="task-item">
          <div style="display: flex; align-items: center; gap: 12px;">
            <input type="checkbox" ${t.completada ? 'checked' : ''} class="btn-toggle-task" data-id="${t.id}" style="width: 18px; height: 18px; cursor: pointer;">
            <div>
              <h4 style="font-size: 14px; font-weight: 700; ${t.completada ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(t.titulo)}</h4>
              <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(t.fecha)} ${escapeHtml(t.hora)}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="match-category-tag" style="background-color: var(--bg-subtle); color: var(--text-muted);">${escapeHtml(t.prioridad)}</span>
            <button class="btn-action-icon danger btn-delete-task" data-id="${t.id}" style="width: 28px; height: 28px;">
              <i data-lucide="trash-2" style="width: 14px;"></i>
            </button>
          </div>
        </div>
      `).join('');

      container.querySelectorAll('.btn-toggle-task').forEach(chk => {
        chk.addEventListener('change', () => {
          const item = state.agenda.find(i => i.id === chk.dataset.id);
          if (item) {
            item.completada = chk.checked;
            saveState();
            renderAgenda();
          }
        });
      });

      container.querySelectorAll('.btn-delete-task').forEach(btn => {
        btn.addEventListener('click', () => {
          deleteFromFirebase('agenda', btn.dataset.id);
          state.agenda = state.agenda.filter(i => i.id !== btn.dataset.id);
          saveState();
          renderAgenda();
        });
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  document.getElementById('btnNewAgendaTask')?.addEventListener('click', () => {
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
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">Categoría</label>
            <select id="agCat" class="form-control">
              <option value="scouting">Viaje Scouting</option>
              <option value="partido">Partido a Seguir</option>
              <option value="contacto">Contacto Agente</option>
              <option value="nota">Nota de Campo</option>
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

      state.agenda.unshift({
        id: 'ag_' + Date.now(),
        titulo: title,
        fecha: document.getElementById('agDate').value,
        hora: document.getElementById('agTime').value,
        categoria: document.getElementById('agCat').value,
        prioridad: document.getElementById('agPrio').value,
        completada: false
      });

      saveState();
      hideModal();
      renderAgenda();
    });
  });

  // --------------------------------------------------------------------------
  // 9. SECTION 6: ENLACES FEDERATIVOS & RECURSOS
  // --------------------------------------------------------------------------
  let currentLinkTab = 'all'; // 'all', 'favorites', or tag string
  let currentLinkSearch = '';

  function normalizeLinks() {
    if (!Array.isArray(state.links)) state.links = [];
    state.links.forEach(l => {
      if (!l.etiqueta) l.etiqueta = 'Federaciones';
      if (typeof l.favorito !== 'boolean') l.favorito = false;
      if (!l.logo) l.logo = '';
      if (!l.region) l.region = 'General';
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

    const container = document.getElementById('federationLinksContainer');
    const tabsContainer = document.getElementById('linksCategoryTabs');
    const searchInput = document.getElementById('linkSearchInput');

    if (searchInput && !searchInput.dataset.initialized) {
      searchInput.dataset.initialized = 'true';
      searchInput.addEventListener('input', (e) => {
        currentLinkSearch = e.target.value.toLowerCase().trim();
        renderEnlacesGrid();
      });
    }

    // 1. Build Category Tabs
    const favCount = state.links.filter(l => l.favorito).length;
    const totalCount = state.links.length;

    // Collect unique tags
    const tagsMap = {};
    state.links.forEach(l => {
      const tag = l.etiqueta || 'Federaciones';
      tagsMap[tag] = (tagsMap[tag] || 0) + 1;
    });
    const uniqueTags = Object.keys(tagsMap).sort();

    let tabsHtml = `
      <button class="link-tab-btn ${currentLinkTab === 'all' ? 'active' : ''}" data-tab="all">
        <i data-lucide="globe" style="width: 14px;"></i> Todos
        <span class="tab-count">${totalCount}</span>
      </button>
      <button class="link-tab-btn fav-tab ${currentLinkTab === 'favorites' ? 'active' : ''}" data-tab="favorites">
        <i data-lucide="star" style="width: 14px; fill: ${currentLinkTab === 'favorites' ? '#ffffff' : '#f59e0b'}; color: #f59e0b;"></i> Favoritos
        <span class="tab-count">${favCount}</span>
      </button>
    `;

    uniqueTags.forEach(tag => {
      tabsHtml += `
        <button class="link-tab-btn ${currentLinkTab === tag ? 'active' : ''}" data-tab="${escapeHtml(tag)}">
          <i data-lucide="tag" style="width: 13px;"></i> ${escapeHtml(tag)}
          <span class="tab-count">${tagsMap[tag]}</span>
        </button>
      `;
    });

    if (tabsContainer) {
      tabsContainer.innerHTML = tabsHtml;
      tabsContainer.querySelectorAll('.link-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          currentLinkTab = btn.dataset.tab;
          renderEnlaces();
        });
      });
    }

    renderEnlacesGrid();
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
      <div class="link-card ${l.favorito ? 'is-favorite' : ''}">
        <div class="link-card-left">
          <div class="link-logo-box">
            ${renderLinkLogo(l)}
          </div>
          <div class="link-info">
            <h3>${escapeHtml(l.titulo)}</h3>
            <p>${escapeHtml(l.url)}</p>
            <div class="link-badges">
              <span class="link-tag-badge">${escapeHtml(l.etiqueta || 'Federaciones')}</span>
              ${l.region ? `<span class="link-region-badge">${escapeHtml(l.region)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="link-actions">
          <button class="btn-star-fav ${l.favorito ? 'active' : ''} btn-toggle-fav" data-id="${l.id}" title="${l.favorito ? 'Quitar de favoritos' : 'Marcar como favorito'}">
            <i data-lucide="star" style="width: 16px; height: 16px;"></i>
          </button>
          <a href="${escapeHtml(l.url)}" target="_blank" class="btn btn-primary" style="padding: 6px 10px; font-size: 12px; height: 34px;" title="Abrir Enlace">
            <i data-lucide="external-link" style="width: 14px;"></i>
          </a>
          <button class="btn-action-icon btn-edit-link" data-id="${l.id}" style="width: 34px; height: 34px;" title="Editar">
            <i data-lucide="edit-3" style="width: 14px;"></i>
          </button>
          <button class="btn-action-icon danger btn-delete-link" data-id="${l.id}" style="width: 34px; height: 34px;" title="Eliminar">
            <i data-lucide="trash-2" style="width: 14px;"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Attach Event Listeners
    container.querySelectorAll('.btn-toggle-fav').forEach(btn => {
      btn.addEventListener('click', (e) => {
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

    container.querySelectorAll('.btn-edit-link').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditLinkModal(btn.dataset.id);
      });
    });

    container.querySelectorAll('.btn-delete-link').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('¿Deseas eliminar este enlace?')) {
          deleteFromFirebase('enlaces', btn.dataset.id);
          state.links = state.links.filter(l => l.id !== btn.dataset.id);
          saveState();
          renderEnlaces();
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
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
        <div class="grid-2-col mb-3">
          <div class="form-group">
            <label class="form-label">Etiqueta / Categoría</label>
            <select id="lTagSelect" class="form-control mb-2">
              ${tagOptions}
              <option value="__custom__">+ Nueva Etiqueta...</option>
            </select>
            <input type="text" id="lTagCustom" class="form-control hidden" placeholder="Escribe la nueva etiqueta">
          </div>
          <div class="form-group">
            <label class="form-label">Región / Ámbito</label>
            <input type="text" id="lRegion" class="form-control" placeholder="Ej: España / Internacional / Madrid">
          </div>
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
        region: document.getElementById('lRegion').value.trim() || 'General',
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
    logoFileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          alert('La imagen no debe superar los 2MB');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('lLogo').value = ev.target.result;
        };
        reader.readAsDataURL(file);
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
        <div class="grid-2-col mb-3">
          <div class="form-group">
            <label class="form-label">Etiqueta / Categoría</label>
            <select id="elTagSelect" class="form-control mb-2">
              ${tagOptions}
              <option value="__custom__">+ Nueva Etiqueta...</option>
            </select>
            <input type="text" id="elTagCustom" class="form-control hidden" placeholder="Escribe la nueva etiqueta">
          </div>
          <div class="form-group">
            <label class="form-label">Región / Ámbito</label>
            <input type="text" id="elRegion" class="form-control" value="${escapeHtml(link.region || '')}">
          </div>
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
      link.region = document.getElementById('elRegion').value.trim() || 'General';
      link.logo = document.getElementById('elLogo').value.trim();
      link.favorito = document.getElementById('elFav').checked;

      saveState();
      hideModal();
      renderEnlaces();
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
    editLogoFileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          alert('La imagen no debe superar los 2MB');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('elLogo').value = ev.target.result;
        };
        reader.readAsDataURL(file);
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

  // Backup Export JSON
  document.getElementById('btnExportBackup')?.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `RS_Scouting_CopiaSeguridad_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  // Backup Import JSON
  document.getElementById('inputImportBackup')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.matches && imported.reports && imported.directory) {
          state = imported;
          saveState();
          alert('¡Copia de seguridad restaurada correctamente!');
          window.location.reload();
        } else {
          alert('El archivo JSON no tiene la estructura adecuada de RS Scouting');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
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

  function showModal(title, htmlContent, onSubmit) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = htmlContent;
    currentModalSubmitCallback = onSubmit;
    document.getElementById('generalModalOverlay').classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function hideModal() {
    const card = document.getElementById('generalModalCard');
    if (card) card.classList.remove('xlarge');
    document.getElementById('generalModalOverlay').classList.add('hidden');
    currentModalSubmitCallback = null;
  }

  document.getElementById('btnCloseModal')?.addEventListener('click', hideModal);
  document.getElementById('btnCancelModal')?.addEventListener('click', hideModal);
  document.getElementById('btnSubmitModal')?.addEventListener('click', () => {
    if (currentModalSubmitCallback) currentModalSubmitCallback();
  });

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
  // 12. App Initialization
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCalendarViewSwitcher();
    initDirectorioSubtabs();
    initAgendaFilters();
    initFirebaseRealtimeListener();
    
    // Apply saved brand name & theme
    if (state.settings.appName) {
      document.getElementById('appBrandName').textContent = state.settings.appName;
    }
    setTheme(state.settings.theme || 'light');

    // Initial view render
    renderView('dashboard');
  });

})();
