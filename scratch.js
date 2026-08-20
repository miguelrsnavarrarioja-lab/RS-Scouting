  function showPlayerAutocompleteDropdown(team, inputElement) {
    let dropdown = document.getElementById('lineupAutocompleteDropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'lineupAutocompleteDropdown';
      dropdown.style.position = 'absolute';
      dropdown.style.zIndex = '9999';
      dropdown.style.background = 'white';
      dropdown.style.border = '1px solid var(--border-color)';
      dropdown.style.borderRadius = '4px';
      dropdown.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
      dropdown.style.maxHeight = '250px';
      dropdown.style.overflowY = 'auto';
      dropdown.style.width = inputElement.offsetWidth + 'px';
      document.body.appendChild(dropdown);
    } else {
      dropdown.style.display = 'block';
      dropdown.style.width = inputElement.offsetWidth + 'px';
    }

    const rect = inputElement.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';

    const teamName = document.getElementById(team === 'local' ? 'reportLocalTeam' : 'reportVisitanteTeam')?.value.trim().toLowerCase() || '';
    if (!teamName) {
      dropdown.style.display = 'none';
      return;
    }

    const jugadores = state.directory.jugadores || [];
    const equipos = state.directory.equipos || [];
    const targetTeam = equipos.find(t => t.nombre && t.nombre.toLowerCase() === teamName);
    
    const enteredNames = [];
    document.querySelectorAll(`#${team}TitularesRows input.name, #${team}SuplentesRows input.name`).forEach(input => {
      if (input !== inputElement) {
        const val = input.value.trim().toLowerCase();
        if (val) enteredNames.push(val);
      }
    });

    let teamPlayersSet = new Set();
    let html = '';
    const filterText = inputElement.value.trim().toLowerCase();

    const addOption = (name) => {
      if (name && !enteredNames.includes(name.toLowerCase()) && !teamPlayersSet.has(name.toLowerCase())) {
        if (!filterText || name.toLowerCase().includes(filterText)) {
          teamPlayersSet.add(name.toLowerCase());
          html += `<div class="autocomplete-item" style="padding: 10px; cursor: pointer; border-bottom: 1px solid var(--border-color); font-size: 14px; transition: background 0.2s;" onmouseover="this.style.background='#f1f5f9';" onmouseout="this.style.background='transparent';" data-val="${escapeHtml(name)}">${escapeHtml(name)}</div>`;
        }
      }
    };

    jugadores.forEach(p => {
      const pTeam = (p.equipo || p.equipoVinculado || p.club || '').toLowerCase();
      let matchesTeam = pTeam === teamName || pTeam.includes(teamName) || teamName.includes(pTeam);
      const pName = (p.nombre || p.jugador || p.name || '');
      
      if (!matchesTeam && targetTeam && targetTeam.plantilla) {
        matchesTeam = targetTeam.plantilla.some(item => {
          const itemName = (typeof item === 'string' ? item : (item.nombre || item.jugador || '')).toLowerCase();
          return itemName === pName.toLowerCase();
        });
      }

      if (matchesTeam) {
        addOption(pName);
      }
    });

    if (targetTeam && targetTeam.plantilla) {
      targetTeam.plantilla.forEach(item => {
        const itemName = (typeof item === 'string' ? item : (item.nombre || item.jugador || ''));
        addOption(itemName);
      });
    }

    // Always append filial option
    html += `<div class="autocomplete-item special" style="padding: 10px; cursor: pointer; background: #f8fafc; border-top: 1px solid #cbd5e1; font-weight: 600; color: var(--primary-color); font-size: 13px; text-align: center; transition: background 0.2s;" onmouseover="this.style.background='#f1f5f9';" onmouseout="this.style.background='#f8fafc';" data-val="FILIAL">--- BUSCAR EN FILIAL U OTRO EQUIPO ---</div>`;

    dropdown.innerHTML = html;

    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // prevent blur
        const val = item.getAttribute('data-val');
        if (val === 'FILIAL') {
          inputElement.value = '';
          dropdown.style.display = 'none';
          openFilialSelectorModal(team, inputElement);
        } else {
          inputElement.value = val;
          dropdown.style.display = 'none';
          renderPitchPins(team);
        }
      });
    });
  }
