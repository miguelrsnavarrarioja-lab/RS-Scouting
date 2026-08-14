const fs = require('fs');
const file = '/Users/miguelsobejano/Desktop/Home/Proyectos/RS Scouting/app.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add helper to parseCalendarText
const helperFn = `
    const convertFechaReal = (f) => {
        if (!f) return '';
        const p = f.split(/[\\/\\-\\.]/);
        if (p.length === 3) {
            let [d, m, y] = p;
            if (y.length === 2) y = (parseInt(y) > 50 ? '19' : '20') + y;
            d = d.padStart(2, '0');
            m = m.padStart(2, '0');
            return \`\${y}-\${m}-\${d}\`;
        }
        return '';
    };
`;

if (content.includes("let currentFechaReal = '';")) {
  content = content.replace("let currentFechaReal = '';", "let currentFechaReal = '';\n" + helperFn);
}

// 2. Replace the hardcoded ISO strings inside parseCalendarText
const target1 = "fecha: new Date().toISOString().split('T')[0],";
const target2 = "fecha: convertFechaReal(currentFechaReal) || new Date().toISOString().split('T')[0],";

// Replace only the ones inside parseCalendarText, let's just do a string replace because they are identical inside that block.
// Wait, we can just replace them directly if we know exactly where they are. 
// They are at line 16973 and 16992 (roughly).
// I will just use regex to target the matches.push blocks inside parseCalendarText.
content = content.replace(
  /matches\.push\(\{\s*id:[^,]+,\s*jornada:[^,]+,\s*fechaRealJornada:[^,]+,\s*fecha:\s*new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\],/g,
  (match) => match.replace("new Date().toISOString().split('T')[0]", "convertFechaReal(currentFechaReal) || new Date().toISOString().split('T')[0]")
);

fs.writeFileSync(file, content);
console.log('Fixed text import');
