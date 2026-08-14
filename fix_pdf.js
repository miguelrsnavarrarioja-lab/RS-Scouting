const fs = require('fs');
const file = '/Users/miguelsobejano/Desktop/Home/Proyectos/RS Scouting/app.js';
let content = fs.readFileSync(file, 'utf8');

const startStr = "function openExportMatchesPDFModal() {";
const endStr = "  function initCarteleraListeners() {";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const newFuncs = `function generateMatchesPDF() {
    let matchesList = [...(currentCarteleraFilteredMatches || [])];

    if (matchesList.length === 0) {
      showToast('⚠️ No hay partidos en la tabla filtrada actual para exportar.');
      return;
    }

    // Deduplicate matches just in case
    const seen = new Set();
    matchesList = matchesList.filter(m => {
      const key = \`\${m.local}_\${m.visitante}_\${m.fecha}\`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort chronologically by date and time
    matchesList.sort((a, b) => {
      const dateA = new Date((a.fecha || '9999-12-31') + 'T' + (a.hora || '00:00'));
      const dateB = new Date((b.fecha || '9999-12-31') + 'T' + (b.hora || '00:00'));
      return dateA - dateB;
    });

    const printWin = window.open('', '_blank');
    if (!printWin) return alert('Por favor permite las ventanas emergentes en tu navegador para generar el PDF');

    const rowsHtml = matchesList.map((m, idx) => \`
      <tr style="\${(m.isHighInterest || m.isPriority) ? 'background-color: #fffbeb;' : (idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;')}">
        <td style="padding: 10px 12px; font-weight: 700; white-space: nowrap; border: 1px solid #000;">
          \${m.fecha ? formatDateSpanish(m.fecha) : 'Sin fecha'}<br>
          <span style="font-size: 11px; color: #2563eb;">⏰ \${m.hora || '17:00'} hs</span>
        </td>
        <td style="padding: 10px 12px; border: 1px solid #000;">
          <strong style="font-size: 14px; color: #0f172a;">\${escapeHtml(m.local || m.localTeam || 'Local')}</strong> vs 
          <strong style="font-size: 14px; color: #0f172a;">\${escapeHtml(m.visitante || m.visitanteTeam || 'Visitante')}</strong>
          \${(m.isHighInterest || m.isPriority) ? '<span style="background: #f59e0b; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 800; margin-left: 6px; border: 1px solid #000;">⭐ PRIORITARIO</span>' : ''}
        </td>
        <td style="padding: 10px 12px; font-size: 12px; color: #475569; border: 1px solid #000;">
          <strong>\${escapeHtml(m.competicion || 'Liga')}</strong><br>
          <span style="color: #64748b;">\${escapeHtml(m.jornada || '')}</span>
        </td>
        <td style="padding: 10px 12px; font-size: 12px; color: #475569; border: 1px solid #000;">
          \${m.estadio ? \`📍 \${escapeHtml(m.estadio)}\` : '-'}
        </td>
      </tr>
    \`).join('');

    printWin.document.write(\`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cartelera de Partidos Filtrada</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 30px; background: #ffffff; }
          h2 { margin-top: 0; color: #1e293b; font-size: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th { background-color: #f1f5f9; padding: 12px; text-align: left; font-weight: 800; border: 1px solid #000; }
          td { border: 1px solid #000; padding: 10px; }
          @media print {
            body { margin: 0; padding: 20px; }
            @page { margin: 1cm; size: A4 portrait; }
          }
        </style>
      </head>
      <body>
        <h2>Cartelera de Partidos Filtrada</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Fecha / Hora</th>
              <th style="width: 45%;">Encuentro</th>
              <th style="width: 20%;">Categoría / Jornada</th>
              <th style="width: 20%;">Ubicación</th>
            </tr>
          </thead>
          <tbody>
            \${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    \`);
    printWin.document.close();
  }

`;
  content = content.slice(0, startIdx) + newFuncs + content.slice(endIdx);
  fs.writeFileSync(file, content);
  console.log('Fixed PDF logic successfully.');
} else {
  console.log('Markers not found');
}
