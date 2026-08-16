const fs = require('fs');
const path = '/Users/miguelsobejano/Desktop/Home/Proyectos/RS Scouting/app.js';
let content = fs.readFileSync(path, 'utf8');

const helperFunc = `
function savePriorityTeamsToFirebase() {
  if (typeof db !== 'undefined' && db && state.cartelera && Array.isArray(state.cartelera.priorityTeams)) {
    db.collection('configuracion').doc('app_settings').set({ 
      cartelera: { priorityTeams: state.cartelera.priorityTeams } 
    }, { merge: true }).catch(e => console.error("Error al guardar equipos prioritarios en Firebase", e));
  }
}
`;

// Insert the helper function near saveToFirebase
if (!content.includes('function savePriorityTeamsToFirebase')) {
  content = content.replace('function saveToFirebase(collectionName, item) {', helperFunc + '\n  function saveToFirebase(collectionName, item) {');
}

// 1. Where a team is removed (state.cartelera.priorityTeams.filter)
// Search for state.cartelera.priorityTeams = state.cartelera.priorityTeams.filter(t => t !== teamToRemove);
content = content.replace(
  /state\.cartelera\.priorityTeams = state\.cartelera\.priorityTeams\.filter\(t => t !== teamToRemove\);[\s\S]*?saveState\(\);/g,
  "state.cartelera.priorityTeams = state.cartelera.priorityTeams.filter(t => t !== teamToRemove);\n          saveState();\n          savePriorityTeamsToFirebase();"
);

// 2. Where a team is added (push)
// In openAddPriorityTeamModal logic:
content = content.replace(
  /state\.cartelera\.priorityTeams\.push\(t\);/g,
  "state.cartelera.priorityTeams.push(t);\n          savePriorityTeamsToFirebase();"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully injected savePriorityTeamsToFirebase logic.");
