const fs = require('fs');
const file = '/Users/miguelsobejano/Desktop/Home/Proyectos/RS Scouting/app.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace globals
content = content.replace(
  /let selectedCarteleraCalendar = 'all';\s*let selectedCarteleraJornada = 'all';\s*let selectedCarteleraInterest = 'priority';\s*let selectedCarteleraFedTab = 'all';\s*let selectedCarteleraCompTab = 'all';/g,
  `let selectedCarteleraCategoria = 'all';
  let selectedCarteleraFederacion = 'all';
  let selectedCarteleraJornada = 'all';
  let selectedCarteleraFecha = 'all';
  let selectedCarteleraInteres = 'priority';
  let selectedCarteleraEquipo = 'all';`
);

// 2. Replace renderCartelera body
content = content.replace(
  /renderCarteleraSelectors\(\);\s*renderCarteleraFilterPills\(\);/g,
  `renderCarteleraFilters();`
);

// 3. Remove old functions and insert renderCarteleraFilters
const pilsStart = content.indexOf('function renderCarteleraFilterPills() {');
const matchesStart = content.indexOf('function renderCarteleraMatches() {');
if (pilsStart !== -1 && matchesStart !== -1) {
  const newFilters = `function renderCarteleraFilters() {
    const calendarios = state.cartelera.calendarios || [];
    const fedSet = new Set();
    const compSet = new Set();
    const jorSet = new Set();
    const fechaSet = new Set();
    const equipoSet = new Set();

    calendarios.forEach(cal => {
      (cal.partidos || []).forEach(m => {
        const fed = (m.federacion || cal.federacion || 'General').trim();
        const comp = (m.competicion || cal.nombre || 'General').trim();
        const jor = (m.jornada || '').trim();
        const fecha = (m.fecha || '').trim();
        const loc = (m.local || '').trim();
        const vis = (m.visitante || '').trim();
        
        if (fed) fedSet.add(fed);
        if (comp) compSet.add(comp);
        if (jor) jorSet.add(jor);
        if (fecha) fechaSet.add(fecha);
        if (loc) equipoSet.add(loc);
        if (vis) equipoSet.add(vis);
      });
    });

    const populateSelect = (id, optionsSet, selectedValue, defaultLabel) => {
      const el = document.getElementById(id);
      if (!el) return;
      
      const arr = Array.from(optionsSet).sort((a,b) => {
        if (id === 'carteleraFilterJornada') {
           const numA = parseInt((a.match(/\\d+/) || [0])[0]);
           const numB = parseInt((b.match(/\\d+/) || [0])[0]);
           return numA - numB;
        }
        return a.localeCompare(b);
      });
      
      let html = \`<option value="all">\${defaultLabel}</option>\`;
      arr.forEach(val => {
        let label = val;
        if (id === 'carteleraFilterFederacion') {
           label = label.replace('FNF - Federación Navarra de Fútbol', 'FNF');
        }
        if (id === 'carteleraFilterJornada') {
           label = label.replace(/jornada\\s*/i, '');
        }
        if (id === 'carteleraFilterFecha') {
           const parts = label.split('-');
           if (parts.length === 3) label = \`\${parts[2]}/\${parts[1]}/\${parts[0]}\`;
        }
        html += \`<option value="\${escapeHtml(val)}" \${selectedValue === val ? 'selected' : ''}>\${escapeHtml(label)}</option>\`;
      });
      el.innerHTML = html;
    };

    populateSelect('carteleraFilterCategoria', compSet, selectedCarteleraCategoria, '🏆 Todas');
    populateSelect('carteleraFilterFederacion', fedSet, selectedCarteleraFederacion, 'Todas');
    populateSelect('carteleraFilterJornada', jorSet, selectedCarteleraJornada, 'Todas');
    populateSelect('carteleraFilterFecha', fechaSet, selectedCarteleraFecha, 'Todas');
    populateSelect('carteleraFilterEquipo', equipoSet, selectedCarteleraEquipo, 'Todos');
    
    const intEl = document.getElementById('carteleraFilterInteres');
    if (intEl) intEl.value = selectedCarteleraInteres;
  }

  `;
  content = content.slice(0, pilsStart) + newFilters + content.slice(matchesStart);
}

// 4. Update initCarteleraListeners
const initStart = content.indexOf("const calSelect = document.getElementById('carteleraCalendarSelect');");
const initEnd = content.indexOf("const btnExportPdf = document.getElementById('btnExportCarteleraPDF');");
if (initStart !== -1 && initEnd !== -1) {
  const newInit = `const bindSelect = (id, setter) => {
      const el = document.getElementById(id);
      if (el && !el.dataset.initialized) {
        el.dataset.initialized = 'true';
        el.onchange = (e) => {
          setter(e.target.value);
          renderCarteleraMatches();
        };
      }
    };
    
    bindSelect('carteleraFilterCategoria', val => selectedCarteleraCategoria = val);
    bindSelect('carteleraFilterFederacion', val => selectedCarteleraFederacion = val);
    bindSelect('carteleraFilterJornada', val => selectedCarteleraJornada = val);
    bindSelect('carteleraFilterFecha', val => selectedCarteleraFecha = val);
    bindSelect('carteleraFilterInteres', val => selectedCarteleraInteres = val);
    bindSelect('carteleraFilterEquipo', val => selectedCarteleraEquipo = val);

    `;
  content = content.slice(0, initStart) + newInit + content.slice(initEnd);
}

// 5. Update renderCarteleraMatches filtering
// Find the start of filtering
const filterStart = content.indexOf('// Apply Federación filter (Level 1)');
const filterEnd = content.indexOf('// IF SUBVIEW IS JORNADAS');
if (filterStart !== -1 && filterEnd !== -1) {
  const newFilter = `// Apply Categoria filter
    if (selectedCarteleraCategoria !== 'all') {
      allMatches = allMatches.filter(m => m.competicion === selectedCarteleraCategoria);
    }
    // Apply Federación filter
    if (selectedCarteleraFederacion !== 'all') {
      allMatches = allMatches.filter(m => (m.federacion || 'General') === selectedCarteleraFederacion);
    }
    // Apply Jornada filter
    if (selectedCarteleraJornada !== 'all') {
      allMatches = allMatches.filter(m => m.jornada === selectedCarteleraJornada);
    }
    // Apply Fecha filter
    if (selectedCarteleraFecha !== 'all') {
      allMatches = allMatches.filter(m => m.fecha === selectedCarteleraFecha);
    }
    // Apply Equipo filter
    if (selectedCarteleraEquipo !== 'all') {
      allMatches = allMatches.filter(m => m.local === selectedCarteleraEquipo || m.visitante === selectedCarteleraEquipo);
    }
    // Apply Buscador Rápido search filter
    if (searchVal) {
      allMatches = allMatches.filter(m => {
        const text = \`\${m.local} \${m.visitante} \${m.jornada} \${m.competicion} \${m.federacion || ''} \${m.estadio || ''} \${m.fecha || ''}\`.toLowerCase();
        return text.includes(searchVal);
      });
    }
    // Apply Interest filter
    if (selectedCarteleraInteres === 'priority') {
      allMatches = allMatches.filter(m => m.isHighInterest);
    }

    `;
  content = content.slice(0, filterStart) + newFilter + content.slice(filterEnd);
}

// Also, the previous matches map used selectedCarteleraCalendar to filter.
// We must remove that because we now show all calendars and filter by categoria/fed.
content = content.replace(
  /if \(selectedCarteleraCalendar === 'all' \|\| selectedCarteleraCalendar === cal\.id\) {([\s\S]*?)}\s*}\);/g,
  `$1});`
);

fs.writeFileSync(file, content);
console.log('Done refactoring!');
