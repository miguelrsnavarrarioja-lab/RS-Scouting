const fs = require('fs');
const file = '/Users/miguelsobejano/Desktop/Home/Proyectos/RS Scouting/app.js';
let content = fs.readFileSync(file, 'utf8');

const startStr = "function generateMatchesPDF() {";
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

    const fmtDate = (d) => {
      if (!d) return 'Sin fecha';
      const p = d.split('-');
      if (p.length === 3) return \`\${p[2]}/\${p[1]}/\${p[0]}\`;
      return d;
    };

    const rowsHtml = matchesList.map((m, idx) => \`
      <tr style="\${(m.isHighInterest || m.isPriority) ? 'background-color: #f0fdf4;' : (idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;')}">
        <td style="padding: 12px 16px; font-weight: 600; white-space: nowrap; border-bottom: 1px solid #e2e8f0; color: #334155;">
          \${fmtDate(m.fecha)}<br>
          <span style="font-size: 11px; color: #2563eb; font-weight: 700;">\${m.hora || '17:00'} hs</span>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
          <strong style="font-size: 14px; color: #0f172a;">\${escapeHtml(m.local || m.localTeam || 'Local')}</strong> 
          <span style="color: #94a3b8; font-size: 12px; margin: 0 4px;">vs</span> 
          <strong style="font-size: 14px; color: #0f172a;">\${escapeHtml(m.visitante || m.visitanteTeam || 'Visitante')}</strong>
          \${(m.isHighInterest || m.isPriority) ? '<span style="background: #22c55e; color: #fff; font-size: 10px; padding: 3px 8px; border-radius: 9999px; font-weight: 800; margin-left: 8px; display: inline-block; vertical-align: middle;">⭐ PRIORITARIO</span>' : ''}
        </td>
        <td style="padding: 12px 16px; font-size: 12px; color: #475569; border-bottom: 1px solid #e2e8f0;">
          <strong style="color: #334155;">\${escapeHtml(m.competicion || 'Liga')}</strong><br>
          <span style="color: #64748b;">\${escapeHtml(m.jornada || '')}</span>
        </td>
        <td style="padding: 12px 16px; font-size: 12px; color: #475569; border-bottom: 1px solid #e2e8f0;">
          \${m.estadio ? \`\${escapeHtml(m.estadio)}\` : '-'}
        </td>
      </tr>
    \`).join('');

    const logoHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield" style="color: #2563eb; margin-right: 8px;"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>';

    printWin.document.write(\`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cartelera de Scouting</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { 
            font-family: 'Inter', system-ui, -apple-system, sans-serif; 
            color: #0f172a; 
            margin: 0; 
            background: #ffffff; 
            padding: 40px;
          }
          .header {
            display: flex;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          h2 { 
            margin: 0; 
            color: #1e293b; 
            font-size: 24px; 
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          table { 
            width: 100%; 
            border-collapse: separate; 
            border-spacing: 0;
            margin-top: 10px; 
            font-size: 13px; 
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          th { 
            background-color: #f8fafc; 
            padding: 14px 16px; 
            text-align: left; 
            font-weight: 700; 
            color: #64748b;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0; 
          }
          td { 
            padding: 10px; 
          }
          tr:last-child td {
            border-bottom: none;
          }
          @media print {
            body { padding: 0; margin: 20px; }
            @page { margin: 1cm; size: A4 portrait; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          \${logoHtml}
          <h2>RS Scouting - Cartelera de Partidos</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Fecha / Hora</th>
              <th style="width: 45%;">Partido</th>
              <th style="width: 20%;">Categoría / Jornada</th>
              <th style="width: 20%;">Ubicación</th>
            </tr>
          </thead>
          <tbody>
            \${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onafterprint = function() {
            window.close();
          };
          // Pequeño retardo para asegurar que la fuente Inter y el SVG se rendericen
          setTimeout(() => {
            window.print();
          }, 600);
        </script>
      </body>
      </html>
    \`);
    printWin.document.close();
  }

`;
  content = content.slice(0, startIdx) + newFuncs + content.slice(endIdx);
  fs.writeFileSync(file, content);
  console.log('Fixed PDF style.');
} else {
  console.log('Markers not found');
}
