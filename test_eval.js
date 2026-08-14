const fs = require('fs');
const code = fs.readFileSync('app.js', 'utf8');

// Find the function start and the NEXT function start
const startIdx = code.indexOf('function parseCalendarText(');
const nextFuncIdx = code.indexOf('function generateMatchesPDF()', startIdx);
const fnString = code.substring(startIdx, nextFuncIdx);

try {
  // Let's create a dummy environment
  global.window = {};
  global.document = {
    getElementById: () => ({ value: '' })
  };
  global.state = { cartelera: { matches: [] } };
  global.calendarios = [];
  global.ensureCarteleraState = () => {};
  global.saveState = () => {};
  global.renderCarteleraFiltros = () => {};
  global.renderCarteleraMatches = () => {};
  global.showToast = () => {};

  eval(fnString);
  parseCalendarText("Jornada 1\\n12/10/2026\\nLocal vs Visitante", "Test");
  console.log("SUCCESS! matches:", global.state.cartelera.matches.length);
} catch (e) {
  console.log("ERROR EXECUTING:", e.stack);
}
