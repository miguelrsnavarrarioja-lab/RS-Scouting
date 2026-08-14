const fs = require('fs');
const file = '/Users/miguelsobejano/Desktop/Home/Proyectos/RS Scouting/app.js';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `matchesList.sort((a, b) => {
      const dateA = new Date((a.fecha || '9999-12-31') + 'T' + (a.hora || '00:00'));
      const dateB = new Date((b.fecha || '9999-12-31') + 'T' + (b.hora || '00:00'));
      return dateA - dateB;
    });`;

const newStr = `matchesList.sort((a, b) => {
      const jorA = parseInt((a.jornada || '').match(/\\d+/) || [999]);
      const jorB = parseInt((b.jornada || '').match(/\\d+/) || [999]);
      if (jorA !== jorB) return jorA - jorB;

      const dateA = new Date((a.fecha || '9999-12-31') + 'T' + (a.hora || '00:00'));
      const dateB = new Date((b.fecha || '9999-12-31') + 'T' + (b.hora || '00:00'));
      return dateA - dateB;
    });`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content);
  console.log('Fixed PDF sort');
} else {
  console.log('Not found');
}
