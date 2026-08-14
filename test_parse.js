const fs = require('fs');
const file = '/Users/miguelsobejano/Desktop/Home/Proyectos/RS Scouting/app.js';
const content = fs.readFileSync(file, 'utf8');

const parseFuncStart = content.indexOf('function parseCalendarText');
const parseFuncEnd = content.indexOf('function ensureCarteleraState', parseFuncStart);

const parseFuncStr = content.slice(parseFuncStart, parseFuncEnd);

// Mock required global variables/functions for the test
const window = {
  showToast: console.log
};
const state = {
  cartelera: { matches: [] }
};
const saveState = () => console.log('saveState called');
const renderCarteleraMatches = () => console.log('renderCarteleraMatches called');
const renderCarteleraFiltros = () => console.log('renderCarteleraFiltros called');
const showToast = console.log;

const testCode = `
${parseFuncStr}

try {
  parseCalendarText("Jornada 1 - 12/10/2025\\nLocal vs Visitante", "Test", "Fed", "Grp");
  console.log("Success:", state.cartelera.matches);
} catch (e) {
  console.error("Error:", e);
}
`;

fs.writeFileSync('run_test_parse.js', testCode);
