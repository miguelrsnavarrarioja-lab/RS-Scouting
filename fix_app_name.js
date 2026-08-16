const fs = require('fs');

const path = '/Users/miguelsobejano/Desktop/Home/Proyectos/RS Scouting/app.js';
let content = fs.readFileSync(path, 'utf8');

// Replace all occurrences of RS Scouting with MS Fútbol Scout
content = content.replace(/RS Scouting/g, 'MS Fútbol Scout');
content = content.replace(/RS_SCOUTING_APP_NAME/g, 'MS_FUTBOL_SCOUT_APP_NAME');
content = content.replace(/RS_Scouting_CopiaSeguridad/g, 'MS_Futbol_Scout_CopiaSeguridad');

// Remove the logic block for btnSaveAppName (lines ~19900 - 19957)
const startBlock = "const configInputEl = document.getElementById('configAppNameInput');";
const endBlock = "    });\n  }\n";
const startIndex = content.indexOf(startBlock);
const endIndex = content.indexOf(endBlock, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + content.slice(endIndex + endBlock.length);
  console.log("Successfully removed btnSaveAppName logic.");
} else {
  console.log("Could not find the bounds of btnSaveAppName logic.");
}

fs.writeFileSync(path, content, 'utf8');
console.log("File saved.");
