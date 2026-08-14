const fs = require('fs');
const code = fs.readFileSync('app.js', 'utf8');

const parseFuncStart = code.indexOf('function parseCalendarText(');
const parseFuncEnd = code.indexOf('function ensureCarteleraState', parseFuncStart);
const fnCode = code.substring(parseFuncStart, parseFuncEnd);

const testEnv = `
let calendarios = [];
const state = { cartelera: { matches: [] } };
const saveState = () => {};
const renderCarteleraMatches = () => {};
const renderCarteleraFiltros = () => {};
const showToast = () => {};
function escapeHtml(s) { return s; }
function hideModal() {}

${fnCode}

parseCalendarText("Jornada 1 - 12-10-2025\\nLocal vs Visitante", "Test", "Fed", "Grp");
console.log(state.cartelera.matches);
`;

try {
  eval(testEnv);
} catch (e) {
  console.log('Error caught:', e);
}
