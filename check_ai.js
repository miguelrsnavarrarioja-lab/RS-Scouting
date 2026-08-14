const fs = require('fs');
const file = '/Users/miguelsobejano/Desktop/Home/Proyectos/RS Scouting/app.js';
const content = fs.readFileSync(file, 'utf8');

const idx = content.indexOf('async function processAICalendarExtraction(');
if (idx !== -1) {
    console.log(content.slice(idx, idx + 1500));
} else {
    console.log('Not found');
}
