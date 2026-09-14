import re

file_path = '/Users/miguelsobejano/Desktop/Home/Proyectos/RS-Scouting-main/app.js'
with open(file_path, 'r') as f:
    content = f.read()

migration_func = """
  // --- MIGRATION FOR NEW POSITION ACRONYMS ---
  function migratePositions(stateObj) {
    if (!stateObj || !stateObj.directory || !stateObj.directory.jugadores) return stateObj;
    
    // Check if migration is needed by looking for old DC (which meant Defensa Central)
    // Actually it's safer to just migrate everything blindly because we might have old files.
    // However, if it was already migrated, Delantero Centro would be 'DC'.
    // How to distinguish an old DC (Defensa Central) from a new DC (Delantero Centro)?
    // The only reliable way is a migration flag in the state settings, OR we assume any state
    // without the flag needs migration.
    
    if (stateObj.settings && stateObj.settings.migratedPositionsV1) {
      return stateObj;
    }
    
    const mapping = {
      'PO': 'PT',
      'DBD': 'LTD',
      'DBZ': 'LTI',
      'DCD': 'CTD',
      'DCZ': 'CTI',
      'DC': 'CT', // OLD DC (Defensa Central) -> CT
      'MCD': 'MC',
      'MCZ': 'MC',
      'MVD': 'INT',
      'MVZ': 'INT',
      'MPD': 'MP',
      'MPZ': 'MP',
      'MBD': 'ED',
      'MBZ': 'EI',
      'AC': 'DC', // OLD AC (Delantero Centro) -> DC
      'ACD': 'DC',
      'ACZ': 'DC'
    };
    
    function mapPos(val) {
      if (!val) return val;
      const upper = val.toUpperCase().trim();
      return mapping[upper] || val; // Fallback to original if not found
    }
    
    stateObj.directory.jugadores.forEach(j => {
      j.posicionPrincipal = mapPos(j.posicionPrincipal);
      j.posicionSecundaria = mapPos(j.posicionSecundaria);
      j.pos = mapPos(j.pos);
      j.posicion = mapPos(j.posicion);
      if (j.posicionesAlternativas && Array.isArray(j.posicionesAlternativas)) {
        j.posicionesAlternativas = j.posicionesAlternativas.map(mapPos);
      }
    });
    
    // Also migrate positions mapped in team squad or campograma if they exist explicitly? 
    // Usually they are computed dynamically from player data, so migrating players is enough.
    
    if (!stateObj.settings) stateObj.settings = {};
    stateObj.settings.migratedPositionsV1 = true;
    
    return stateObj;
  }
"""

# Insert migration_func before loadState
if "function loadState()" in content and "migratePositions" not in content:
    content = content.replace("  function loadState() {", migration_func + "\n  function loadState() {")

# Apply migration inside loadState
if "return initialState;" in content:
    # There are multiple returns, but loadState has one at the end
    # Let's be precise.
    # We want to wrap the return of loadState() if possible, or just call migrate in the caller.
    pass

# The easiest is to migrate at the caller: let state = loadState();
# Change it to: let state = migratePositions(loadState());
content = re.sub(r"(let state = loadState\(\);)", r"\1\n  state = migratePositions(state);", content)

# Now, we also need to apply it on JSON import.
# Line 31147: state = imported; -> state = migratePositions(imported);
content = content.replace("state = imported;", "state = migratePositions(imported);")

with open(file_path, 'w') as f:
    f.write(content)
print("Migration function added.")
