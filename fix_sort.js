const fs = require('fs');
const file = '/Users/miguelsobejano/Desktop/Home/Proyectos/RS Scouting/app.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix generateMatchesPDF sorting
const oldPdfSort = \`matchesList.sort((a, b) => {
      const dateA = new Date((a.fecha || '9999-12-31') + 'T' + (a.hora || '00:00'));
      const dateB = new Date((b.fecha || '9999-12-31') + 'T' + (b.hora || '00:00'));
      return dateA - dateB;
    });\`;

const newPdfSort = \`matchesList.sort((a, b) => {
      // 1. Sort by Jornada (numerical)
      const jorA = parseInt((a.jornada || '').match(/\\d+/) || [999]);
      const jorB = parseInt((b.jornada || '').match(/\\d+/) || [999]);
      if (jorA !== jorB) return jorA - jorB;

      // 2. Sort chronologically by date and time
      const dateA = new Date((a.fecha || '9999-12-31') + 'T' + (a.hora || '00:00'));
      const dateB = new Date((b.fecha || '9999-12-31') + 'T' + (b.hora || '00:00'));
      return dateA - dateB;
    });\`;

content = content.replace(oldPdfSort, newPdfSort);

// 2. Fix renderCarteleraJornadasGrid sorting
const gridSortStartStr = "const grouped = allMatches.reduce((acc, m) => {";
const gridRenderIdx = content.indexOf('function renderCarteleraJornadasGrid(');
if (gridRenderIdx !== -1) {
  // Let's find how it sorts the keys
  // It probably does Object.keys(grouped).sort()
  const oldGridSort1 = "const sortedJornadas = Object.keys(grouped).sort((a, b) => a.localeCompare(b));";
  const oldGridSort2 = "Object.keys(grouped).sort((a, b) => a.localeCompare(b)).forEach(jor => {";
  
  const newGridSort = "const sortedJornadas = Object.keys(grouped).sort((a, b) => { const numA = parseInt(a.match(/\\d+/) || [999]); const numB = parseInt(b.match(/\\d+/) || [999]); return numA - numB; });";
  
  if (content.includes(oldGridSort1)) {
    content = content.replace(oldGridSort1, newGridSort);
  } else if (content.includes("Object.keys(grouped).sort(")) {
    // We will just do a targeted replace using regex
    content = content.replace(
      /Object\.keys\(grouped\)\.sort\([^)]*\)/g,
      "Object.keys(grouped).sort((a, b) => { const numA = parseInt(a.match(/\\d+/) || [999]); const numB = parseInt(b.match(/\\d+/) || [999]); return numA - numB; })"
    );
  }
}

// 3. Fix main table sorting in renderCarteleraMatches?
// "ordena siempre los apridos por jornada, despues por fecha y hora, el color ya diferencia si es prioritario o no."
// Wait, renderCarteleraMatches has a sort logic at the end for 'destacados' subview.
const oldMatchSort = \`allMatches.sort((a, b) => {
      if (a.isClash && !b.isClash) return -1;
      if (!a.isClash && b.isClash) return 1;
      if (a.isHighInterest && !b.isHighInterest) return -1;
      if (!a.isHighInterest && b.isHighInterest) return 1;
      return 0;
    });\`;

const newMatchSort = \`allMatches.sort((a, b) => {
      // 1. Sort by Jornada numerically
      const jorA = parseInt((a.jornada || '').match(/\\d+/) || [999]);
      const jorB = parseInt((b.jornada || '').match(/\\d+/) || [999]);
      if (jorA !== jorB) return jorA - jorB;

      // 2. Sort chronologically
      const dateA = new Date((a.fecha || '9999-12-31') + 'T' + (a.hora || '00:00'));
      const dateB = new Date((b.fecha || '9999-12-31') + 'T' + (b.hora || '00:00'));
      return dateA - dateB;
    });\`;

if (content.includes("if (a.isClash && !b.isClash) return -1;")) {
  content = content.replace(/allMatches\.sort\(\(a, b\) => {[\s\S]*?return 0;\s*}\);/g, newMatchSort);
}

fs.writeFileSync(file, content);
console.log('Fixed sorts');
