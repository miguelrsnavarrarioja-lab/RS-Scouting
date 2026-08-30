let stagedExcelRows = [];
let currentImporterType = 'plantillas';
let lastHoveredClubDropdownIndex = null;
let dropdownsInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    const radios = document.querySelectorAll('input[name="importerType"]');
    radios.forEach(r => {
        if (r.checked) currentImporterType = r.value;
        r.addEventListener('change', (e) => {
            currentImporterType = e.target.value;
        });
    });

    const btnProcess = document.getElementById('btnProcessImporterText');
    if (btnProcess) btnProcess.addEventListener('click', processRawText);

    const btnCancel = document.getElementById('btnExcelCancelImport');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            document.getElementById('importerStep2ExcelContainer').classList.add('hidden');
            document.getElementById('importerRawText').value = '';
            stagedExcelRows = [];
        });
    }

    const btnSelectAll = document.getElementById('btnExcelSelectAllRows');
    if (btnSelectAll) btnSelectAll.addEventListener('click', () => toggleAllRows(true));
    
    const btnDeselectAll = document.getElementById('btnExcelDeselectAllRows');
    if (btnDeselectAll) btnDeselectAll.addEventListener('click', () => toggleAllRows(false));

    const btnApplyBulk = document.getElementById('btnExcelApplyBulk');
    if (btnApplyBulk) btnApplyBulk.addEventListener('click', applyMassEdit);

    const btnConfirmSave = document.getElementById('btnExcelConfirmSave');
    if (btnConfirmSave) btnConfirmSave.addEventListener('click', saveExcelToDirectory);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.club-vinculado-input') && !e.target.closest('.club-suggestions')) {
            document.querySelectorAll('.club-suggestions').forEach(el => el.classList.add('hidden'));
        }
        if (!e.target.closest('.equipo-vinculado-input') && !e.target.closest('.equipo-suggestions')) {
            document.querySelectorAll('.equipo-suggestions').forEach(el => el.classList.add('hidden'));
        }
    });

    const checkState = setInterval(() => {
        const d = window.state?.directory;
        if (d && !dropdownsInitialized) {
            const hasData = (d.federaciones && d.federaciones.length > 0) || (d.equipos && d.equipos.length > 0) || (d.clubes && d.clubes.length > 0);
            if (hasData) {
                initImporterDropdowns();
                dropdownsInitialized = true;
                clearInterval(checkState);
            }
        }
    }, 500);
    
    setTimeout(() => {
        if (!dropdownsInitialized) {
            initImporterDropdowns();
            dropdownsInitialized = true;
            clearInterval(checkState);
        }
    }, 5000); // 5 segundos de gracia para cargar Firebase
});

function initImporterDropdowns() {
    const LISTA_TEMPORADAS = [
        '2018/2019', '2019/2020', '2020/2021', '2021/2022', '2022/2023',
        '2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028',
        '2028/2029', '2029/2030'
    ];
    const LISTA_CATEGORIAS = [
        '1 DIV', '2 DIV', '1 RFEF', '2 RFEF', '3 RFEF', 'AUT', 'PREF', 'REG',
        'DHJ', 'LNJ', 'JAU', 'JPR', '2J', 'CV', 'CH', 'CPR', '2C', 'IH', 'ITX',
        'ALV', 'ALVB', 'BEN', 'BENB', 'PREBEN', 'ESCUELA', 'BAF', 'ICF', 'CJF',
        '1 RFEF FEM', '2 RFEF FEM', '3 RFEF FEM'
    ];

    let competiciones = new Set();
    if (window.state && window.state.directory && window.state.directory.equipos) {
        window.state.directory.equipos.forEach(e => {
            if (e.competicion) competiciones.add(e.competicion);
        });
    }

    let federaciones = [];
    if (window.state && window.state.directory && window.state.directory.federaciones) {
        federaciones = window.state.directory.federaciones.map(f => (f.nombre || f.federacion || '').trim()).filter(n => n);
    }

    populateSelect('importerEquipoTemporada', LISTA_TEMPORADAS, '-- Temporada --');
    populateSelect('importerEquipoCategoria', LISTA_CATEGORIAS, '-- Categoría --');
    populateSelect('importerEquipoCompeticion', Array.from(competiciones).sort(), '-- Competición --');
    populateSelect('importerDefaultFederacionSelect', federaciones.sort(), '-- Seleccionar Federación --');
}

function populateSelect(id, items, defaultText) {
    const sel = document.getElementById(id);
    if (!sel) return;
    
    const currentVal = sel.value;
    
    sel.innerHTML = `<option value="">${defaultText}</option>`;
    items.forEach(item => {
        sel.innerHTML += `<option value="${item}">${item}</option>`;
    });
    sel.innerHTML += `<option value="__NEW__" style="font-weight:bold; color: blue;">➕ Añadir nueva...</option>`;
    
    if (items.includes(currentVal)) {
        sel.value = currentVal;
    }

    sel.removeEventListener('change', handleNewOption);
    sel.addEventListener('change', handleNewOption);
}

function handleNewOption(e) {
    if (e.target.value === '__NEW__') {
        const newVal = prompt("Introduce la nueva opción:");
        if (newVal && newVal.trim() !== '') {
            const opt = document.createElement('option');
            opt.value = newVal.trim();
            opt.textContent = newVal.trim();
            e.target.insertBefore(opt, e.target.lastElementChild);
            e.target.value = opt.value;
        } else {
            e.target.value = "";
        }
    }
}

function processRawText() {
    const rawText = document.getElementById('importerRawText').value;
    if (!rawText.trim()) {
        alert("Por favor, pega el texto primero.");
        return;
    }

    stagedExcelRows = [];
    if (currentImporterType === 'equipos') processEquiposImport(rawText);
    else if (currentImporterType === 'clubes') processClubesImport(rawText);
    else processPlantillasImport(rawText);

    document.getElementById('importerStep2ExcelContainer').classList.remove('hidden');
    renderExcelTable();
}

function processEquiposImport(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const defaultTemporada = document.getElementById('importerEqTemp')?.value || document.getElementById('importerEquipoTemporada')?.value || '';
    const defaultCategoria = document.getElementById('importerEqCat')?.value || document.getElementById('importerEquipoCategoria')?.value || '';
    const defaultCompeticion = document.getElementById('importerEqComp')?.value || document.getElementById('importerEquipoCompeticion')?.value || '';
    const defaultFederacion = document.getElementById('importerEqFed')?.value || '';
    
    const findClub = (raw) => {
        const normalize = (str) => {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
                      .replace(/\./g, '') // remove dots completely
                      .replace(/-/g, ' ') // replace hyphens with space
                      .replace(/\s+/g, ' ') // remove multiple spaces
                      .trim().toLowerCase();
        };

        let normRaw = normalize(raw);
        let sortedRaw = normRaw.split(' ').sort().join(' ');
        
        let allClubNames = new Set();
        
        if (window.state?.directory?.clubes) {
            window.state.directory.clubes.forEach(c => {
                if (c.nombre) allClubNames.add(c.nombre);
                if (c.equipo) allClubNames.add(c.equipo);
                if (c.club) allClubNames.add(c.club);
            });
        }
        if (window.state?.directory?.equipos) {
            window.state.directory.equipos.forEach(eq => {
                if (eq.clubVinculado) allClubNames.add(eq.clubVinculado);
                if (eq.club) allClubNames.add(eq.club);
            });
        }

        let clubList = Array.from(allClubNames).filter(n => n);

        // Primera pasada: coincidencia exacta normalizada
        for (let realName of clubList) {
            let normCName = normalize(realName);
            if (normCName === normRaw) return realName;
        }
        
        // Segunda pasada: coincidencia con palabras desordenadas
        for (let realName of clubList) {
            let normCName = normalize(realName);
            let sortedCName = normCName.split(' ').sort().join(' ');
            if (sortedCName === sortedRaw) return realName;
        }

        // Tercera pasada: coincidencias parciales
        for (let realName of clubList) {
            let normCName = normalize(realName);
            let rawWords = normRaw.split(' ');
            let cNameWords = normCName.split(' ');
            
            if (normRaw.length > 2 && normCName.includes(normRaw)) return realName;
            
            let importantRaw = rawWords.filter(w => w.length > 2);
            let importantCName = cNameWords.filter(w => w.length > 2);
            
            if (importantRaw.length > 0 && importantRaw.every(w => normCName.includes(w))) return realName;
            if (importantCName.length > 0 && importantCName.every(w => normRaw.includes(w))) return realName;
        }
        
        // But keep acronyms uppercase
        let cleanRaw = raw.replace(/\./g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
        let words = cleanRaw.split(' ');
        let titleCase = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        titleCase = titleCase.replace(/\b(Ud|Cf|Cd|Sd|Fc|Fb|Efb|Ad|Ce|Ue|Rc|Rd|Ipc|Sad|Rcd)\b/ig, match => match.toUpperCase());
        
        return titleCase;
    };
    
    let i = 0;
    while (i < lines.length) {
        let line = lines[i];
        if (line.match(/^\d+$/)) {
            i++;
            if (i < lines.length) {
                let rawNombreBruto = lines[i].replace(/^\d+\s+/, '').replace(/(?:\s+\d+)+$/, '').replace(/\[|\]/g, '').split('(')[0].trim();
                let nombreBruto = findClub(rawNombreBruto);
                stagedExcelRows.push(createEquipoObj(nombreBruto, defaultCategoria, defaultTemporada, defaultCompeticion, defaultFederacion));
            }
        } else {
            let rawNombreBruto = line.replace(/^\d+\s+/, '').replace(/(?:\s+\d+)+$/, '').replace(/\[|\]/g, '').split('(')[0].trim();
            let nombreBruto = findClub(rawNombreBruto);
            stagedExcelRows.push(createEquipoObj(nombreBruto, defaultCategoria, defaultTemporada, defaultCompeticion, defaultFederacion));
        }
        i++;
    }
}

function createEquipoObj(clubBase, cat, temp, comp, fed) {
    return {
        _checked: true,
        clubVinculado: clubBase,
        categoria: cat,
        temporada: temp,
        competicion: comp,
        federacion: fed,
        grupo: '',
        nombreOficial: `${clubBase} ${cat} ${temp}`.trim()
    };
}

function processClubesImport(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    lines.forEach(line => {
        const parts = line.split('\t');
        if (parts.length > 1) {
            stagedExcelRows.push({ _checked: true, codigo: parts[0], nombre: parts[1] || '', localidad: parts[2] || '' });
        } else {
            stagedExcelRows.push({ _checked: true, nombre: line });
        }
    });
}

function processPlantillasImport(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    const capitalize = (str) => {
        if (!str) return '';
        return str.toString().toLowerCase().replace(/(?:^|\s|\-)\S/g, char => char.toUpperCase()).trim();
    };

    const selectVal = document.getElementById('importerDefaultEquipoSelect')?.value;
    const inputVal = document.getElementById('importerDefaultEquipo')?.value.trim();
    const defaultEquipo = capitalize(selectVal || inputVal || '');

    const normalize = (name) => name ? name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[.,]/g, '').trim() : '';

    lines.forEach(line => {
        let nombreJugador = line;
        if (line.includes(',')) {
            let parts = line.split(',');
            nombreJugador = `${parts[1] || ''} ${parts[0]}`.trim();
        }
        nombreJugador = capitalize(nombreJugador);

        const isDuplicate = window.state?.directory?.jugadores?.some(j => normalize(j.nombre || j.jugador) === normalize(nombreJugador));

        const baseObj = { 
            _checked: !isDuplicate, 
            nombre: nombreJugador, 
            rol: 'Jugador',
            ano: '',
            equipo: defaultEquipo,
            comunidad: '',
            poblacion: '',
            lateralidad: '',
            dorsal: ''
        };

        stagedExcelRows.push(baseObj);
    });
}

function renderExcelTable() {
    const tbody = document.getElementById('excelTableBody');
    const thead = document.getElementById('excelTableHeader');
    const lblTotal = document.getElementById('lblExcelTotalRows');
    const bulkColSelect = document.getElementById('bulkExcelColumn');
    
    if (!tbody || !thead) return;

    lblTotal.textContent = stagedExcelRows.length;
    
    if (stagedExcelRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px;">No hay filas extraídas.</td></tr>';
        thead.innerHTML = '';
        return;
    }

    const keys = Object.keys(stagedExcelRows[0]).filter(k => k !== '_checked');
    
    if (bulkColSelect) {
        bulkColSelect.innerHTML = '<option value="">-- Columna --</option>';
        keys.forEach(k => {
            if (k !== 'nombreOficial') {
                let displayK = k === 'ano' ? 'Año' : k;
                bulkColSelect.innerHTML += `<option value="${k}">${displayK.toUpperCase()}</option>`;
            }
        });
    }

    let headHtml = '<tr>';
    headHtml += '<th style="padding: 10px; border: 1px solid var(--border-medium); background: var(--bg-subtle); width: 40px; text-align: center;">Sel</th>';
    keys.forEach(k => {
        let displayK = k === 'ano' ? 'Año' : k;
        headHtml += `<th style="padding: 10px; border: 1px solid var(--border-medium); background: var(--bg-subtle); text-transform: capitalize;">${displayK}</th>`;
    });
    headHtml += '<th style="padding: 10px; border: 1px solid var(--border-medium); background: var(--bg-subtle); width: 40px; text-align: center;"></th>'; // Empty header for trash icon
    headHtml += '</tr>';
    thead.innerHTML = headHtml;

    let tempOptionsHTML = '<option value="">--</option>';

    if (currentImporterType === 'equipos') {
        if (!document.getElementById('categoriaList')) {
            let catListHTML = '<datalist id="categoriaList">';
            const LISTA_CATEGORIAS_EQUIPO = window.LISTA_CATEGORIAS_EQUIPO || ['PREBEN', 'BEN', 'ALV', 'INF', 'CAD', 'JUV', 'REG', 'AUT', 'PREF', '3 RFEF', '2 RFEF', '1 RFEF', 'LALIGA 2', 'LALIGA', '1 RFEF FEM', '2 RFEF FEM', '3 RFEF FEM'];
            LISTA_CATEGORIAS_EQUIPO.forEach(c => { catListHTML += `<option value="${c}">`; });
            catListHTML += '</datalist>';
            document.body.insertAdjacentHTML('beforeend', catListHTML);
        }
        
        ['24/25', '25/26', '26/27', '27/28'].forEach(t => { tempOptionsHTML += `<option value="${t}">${t}</option>`; });

        if (!document.getElementById('competicionesList')) {
            let compListHTML = '<datalist id="competicionesList">';
            if (window.state?.directory?.equipos) {
                const comps = new Set();
                window.state.directory.equipos.forEach(eq => { if (eq.competicion) comps.add(eq.competicion); });
                comps.forEach(c => { compListHTML += `<option value="${c}">`; });
            }
            compListHTML += '</datalist>';
            document.body.insertAdjacentHTML('beforeend', compListHTML);
        }
    }

    let bodyHtml = '';
    stagedExcelRows.forEach((row, rowIndex) => {
        let isDuplicate = false;
        
        if (currentImporterType === 'equipos' && window.state?.directory?.equipos) {
            isDuplicate = window.state.directory.equipos.some(e => e.nombre.toLowerCase() === (row.nombreOficial || '').toLowerCase());
        } else if (currentImporterType === 'clubes' && window.state?.directory?.clubes) {
            isDuplicate = window.state.directory.clubes.some(c => c.nombre.toLowerCase() === (row.nombre || '').toLowerCase());
        } else if (currentImporterType !== 'equipos' && currentImporterType !== 'clubes' && window.state?.directory?.jugadores) {
            const normalize = (name) => name ? name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[.,]/g, '').trim() : '';
            isDuplicate = window.state.directory.jugadores.some(j => normalize(j.nombre || j.jugador) === normalize(row.nombre));
        }

        let bgStyle = isDuplicate ? 'background-color: #fee2e2;' : '';
        let titleAttr = isDuplicate ? 'title="Este registro ya existe (marcado en rojo)"' : '';

        bodyHtml += `<tr style="${bgStyle}" ${titleAttr}>`;
        bodyHtml += `<td style="padding: 8px; border: 1px solid var(--border-light); text-align: center;">
                        <input type="checkbox" ${row._checked ? 'checked' : ''} onchange="toggleRowCheck(${rowIndex})">
                     </td>`;
        
        keys.forEach(k => {
            if (k === 'clubVinculado') {
                bodyHtml += `<td style="padding: 0; border: 1px solid var(--border-light); position: relative;">
                                <input type="search" value="${row[k] || ''}" 
                                    oninput="updateRowField(${rowIndex}, '${k}', this.value); showClubSuggestions(this, ${rowIndex});" 
                                    class="form-control excel-cell-field club-vinculado-input" style="border:none; border-radius:0; height:100%; width:100%; padding:8px; ${isDuplicate ? 'color: #dc2626; font-weight:bold;' : ''}" 
                                    onfocus="showClubSuggestions(this, ${rowIndex})" autocomplete="off">
                                <div class="club-suggestions hidden" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ccc; max-height: 200px; overflow-y: auto; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>
                             </td>`;
            } else if (k === 'nombreOficial') {
                bodyHtml += `<td style="padding: 8px; border: 1px solid var(--border-light); font-weight: bold; background: #f8fafc; color: ${isDuplicate ? '#dc2626' : 'inherit'}">
                                ${row[k]}
                             </td>`;
            } else if (currentImporterType === 'equipos' && k === 'categoria') {
                bodyHtml += `<td style="padding: 0; border: 1px solid var(--border-light);">
                                <input list="categoriaList" type="text" value="${row[k] || ''}" oninput="updateRowField(${rowIndex}, '${k}', this.value)" class="form-control excel-cell-field" style="border:none; border-radius:0; height:100%; width:100%; padding:8px; ${isDuplicate ? 'color: #dc2626;' : ''}">
                             </td>`;
            } else if (currentImporterType === 'equipos' && k === 'temporada') {
                let currentSelect = tempOptionsHTML;
                if (row[k]) currentSelect = currentSelect.replace(`value="${row[k]}"`, `value="${row[k]}" selected`);
                bodyHtml += `<td style="padding: 0; border: 1px solid var(--border-light);">
                                <select onchange="updateRowField(${rowIndex}, '${k}', this.value)" class="form-control excel-cell-field" style="border:none; border-radius:0; height:100%; width:100%; padding:8px; ${isDuplicate ? 'color: #dc2626;' : ''}">
                                    ${currentSelect}
                                </select>
                             </td>`;
            } else if (currentImporterType === 'equipos' && k === 'competicion') {
                bodyHtml += `<td style="padding: 0; border: 1px solid var(--border-light);">
                                <input list="competicionesList" type="text" value="${row[k] || ''}" oninput="updateRowField(${rowIndex}, '${k}', this.value)" class="form-control excel-cell-field" style="border:none; border-radius:0; height:100%; width:100%; padding:8px; ${isDuplicate ? 'color: #dc2626;' : ''}">
                             </td>`;
            } else if (k === 'lateralidad') {
                const latOptions = ['', 'Derecha', 'Izquierda', 'Ambidiestro'];
                let selectHtml = `<select onchange="updateRowField(${rowIndex}, '${k}', this.value)" class="form-control excel-cell-field" style="border:none; border-radius:0; height:100%; width:100%; padding:8px; ${isDuplicate ? 'color: #dc2626;' : ''}">`;
                latOptions.forEach(p => {
                    // Match case-insensitively just in case it was imported or mass-edited differently
                    selectHtml += `<option value="${p}" ${(row[k] || '').toLowerCase() === p.toLowerCase() ? 'selected' : ''}>${p}</option>`;
                });
                selectHtml += `</select>`;
                bodyHtml += `<td style="padding: 0; border: 1px solid var(--border-light);">${selectHtml}</td>`;
            } else if (k === 'rol') {
                const rolOptions = ['Jugador', 'Director Deportivo', 'Secretaría Técnica', 'Analista', 'Primer Entrenador', 'Segundo Entrenador', 'Entrenador Porteros', 'Preparador Físico', 'Delegado / Técnico', 'Fisioterapeuta', 'Readaptador', 'Médico', 'Directivo', 'Otro'];
                let selectHtml = `<select onchange="updateRowField(${rowIndex}, '${k}', this.value)" class="form-control excel-cell-field" style="border:none; border-radius:0; height:100%; width:100%; padding:8px; ${isDuplicate ? 'color: #dc2626;' : ''}">`;
                rolOptions.forEach(p => {
                    selectHtml += `<option value="${p}" ${(row[k] || '').toLowerCase() === p.toLowerCase() ? 'selected' : ''}>${p}</option>`;
                });
                selectHtml += `</select>`;
                bodyHtml += `<td style="padding: 0; border: 1px solid var(--border-light);">${selectHtml}</td>`;
            } else if (k === 'equipo') {
                bodyHtml += `<td style="padding: 0; border: 1px solid var(--border-light); position: relative;">
                                <input type="search" value="${row[k] || ''}" 
                                    oninput="updateRowField(${rowIndex}, '${k}', this.value); showEquipoSuggestions(this, ${rowIndex});" 
                                    class="form-control excel-cell-field equipo-vinculado-input" style="border:none; border-radius:0; height:100%; width:100%; padding:8px; ${isDuplicate ? 'color: #dc2626;' : ''}" 
                                    onfocus="showEquipoSuggestions(this, ${rowIndex})" autocomplete="off">
                                <div class="equipo-suggestions hidden" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ccc; max-height: 200px; overflow-y: auto; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>
                             </td>`;
            } else {
                bodyHtml += `<td style="padding: 0; border: 1px solid var(--border-light);">
                                <input type="text" value="${row[k] || ''}" oninput="updateRowField(${rowIndex}, '${k}', this.value)" 
                                    class="form-control excel-cell-field" style="border:none; border-radius:0; height:100%; width:100%; padding:8px; ${isDuplicate ? 'color: #dc2626;' : ''}">
                             </td>`;
            }
        });
        
        // Add delete button at the end
        bodyHtml += `<td style="padding: 8px; border: 1px solid var(--border-light); text-align: center;">
                        <button style="background: none; border: none; cursor: pointer; padding: 4px; color: #ef4444; display: flex; align-items: center; justify-content: center; width: 100%;" onclick="deleteExcelRow(${rowIndex})" title="Borrar fila">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                        </button>
                     </td>`;
                     
        bodyHtml += '</tr>';
    });

    tbody.innerHTML = bodyHtml;
}

window.showClubSuggestions = function(input, rowIndex) {
    document.querySelectorAll('.club-suggestions').forEach(el => el.classList.add('hidden'));
    
    // Fallback: si no hay clubes cargados en el directorio, los extraemos de los equipos
    let listaClubes = [];
    if (window.state?.directory?.clubes && window.state.directory.clubes.length > 0) {
        listaClubes = window.state.directory.clubes;
    } else if (window.state?.directory?.equipos) {
        const uniqueClubs = new Set();
        window.state.directory.equipos.forEach(e => {
            if (e.club) uniqueClubs.add(e.club);
            else if (e.clubVinculado) uniqueClubs.add(e.clubVinculado);
        });
        listaClubes = Array.from(uniqueClubs).map(nombre => ({ nombre }));
    }
    
    if (listaClubes.length === 0) return;
    
    // Filtrado sin tener en cuenta puntos
    const val = input.value.toLowerCase().replace(/\./g, '');
    const sugCont = input.nextElementSibling;
    
    let filtered = listaClubes;
    if (val) {
        filtered = filtered.filter(c => (c.nombre || '').toLowerCase().replace(/\./g, '').includes(val));
    }
    
    if (filtered.length === 0) {
        sugCont.innerHTML = '<div style="padding: 8px 12px; font-size: 12px; color: #666;">No hay coincidencias en tu base de datos</div>';
        sugCont.classList.remove('hidden');
        return;
    }
    
    filtered.sort((a,b) => (a.nombre || '').localeCompare(b.nombre || ''));
    
    sugCont.innerHTML = filtered.slice(0, 50).map(c => 
        `<div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 12px;" 
            onmousedown="selectClubSuggestion(${rowIndex}, '${(c.nombre || '').replace(/'/g, "\\'")}')"
            onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
            ${c.nombre}
        </div>`
    ).join('');
    
    sugCont.classList.remove('hidden');
}

window.selectClubSuggestion = function(rowIndex, clubName) {
    stagedExcelRows[rowIndex].clubVinculado = clubName;
    updateOfficialName(rowIndex);
    renderExcelTable();
}

window.showEquipoSuggestions = function(input, rowIndex) {
    document.querySelectorAll('.equipo-suggestions').forEach(el => el.classList.add('hidden'));
    
    let listaEquipos = [];
    if (window.state?.directory?.equipos && window.state.directory.equipos.length > 0) {
        listaEquipos = window.state.directory.equipos;
    }
    
    if (listaEquipos.length === 0) return;
    
    const val = input.value.toLowerCase().replace(/\./g, '');
    const sugCont = input.nextElementSibling;
    
    let filtered = listaEquipos;
    if (val) {
        filtered = filtered.filter(e => (e.nombre || '').toLowerCase().replace(/\./g, '').includes(val));
    }
    
    if (filtered.length === 0) {
        sugCont.innerHTML = '<div style="padding: 8px 12px; font-size: 12px; color: #666;">No hay coincidencias en tu base de datos</div>';
        sugCont.classList.remove('hidden');
        return;
    }
    
    filtered.sort((a,b) => (a.nombre || '').localeCompare(b.nombre || ''));
    
    sugCont.innerHTML = filtered.slice(0, 50).map(e => 
        `<div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 12px;" 
            onmousedown="selectEquipoSuggestion(${rowIndex}, '${(e.nombre || '').replace(/'/g, "\\'")}')"
            onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
            ${e.nombre}
        </div>`
    ).join('');
    
    sugCont.classList.remove('hidden');
}

window.selectEquipoSuggestion = function(rowIndex, equipoName) {
    stagedExcelRows[rowIndex].equipo = equipoName;
    renderExcelTable();
}

window.updateRowField = function(index, field, value) {
    if (typeof value === 'string' && field !== 'id') {
        value = value.toLowerCase().replace(/(?:^|\s|\-)\S/g, char => char.toUpperCase()).trim();
    }
    stagedExcelRows[index][field] = value;
    if (['clubVinculado', 'categoria', 'temporada'].includes(field)) {
        updateOfficialName(index);
    }
}

window.deleteExcelRow = function(index) {
    if (window.showCustomConfirmModal) {
        window.showCustomConfirmModal('Eliminar fila', '¿Estás seguro de que deseas eliminar esta fila antes de importar?', () => {
            stagedExcelRows.splice(index, 1);
            renderExcelTable();
        });
    } else {
        if (confirm('¿Eliminar esta fila?')) {
            stagedExcelRows.splice(index, 1);
            renderExcelTable();
        }
    }
}

function updateOfficialName(index) {
    const r = stagedExcelRows[index];
    if (r && typeof r.nombreOficial !== 'undefined') {
        const club = r.clubVinculado || '';
        const cat = r.categoria || '';
        const temp = r.temporada || '';
        r.nombreOficial = `${club} ${cat} ${temp}`.trim();
        
        const tbody = document.getElementById('excelTableBody');
        if(tbody && tbody.children[index]) {
            const rowEl = tbody.children[index];
            const cells = rowEl.querySelectorAll('td');
            const keys = Object.keys(r).filter(k => k !== '_checked');
            const officialIdx = keys.indexOf('nombreOficial');
            if(officialIdx > -1 && cells[officialIdx + 1]) {
                cells[officialIdx + 1].innerHTML = r.nombreOficial;
            }
        }
    }
}

window.toggleRowCheck = function(index) {
    stagedExcelRows[index]._checked = !stagedExcelRows[index]._checked;
}

window.toggleAllRows = function(check) {
    stagedExcelRows.forEach(r => r._checked = check);
    renderExcelTable();
}

function applyMassEdit() {
    const colSelect = document.getElementById('bulkExcelColumn');
    const valInput = document.getElementById('bulkExcelValueInput');
    if (!colSelect || !valInput) return;
    
    const col = colSelect.value;
    const val = valInput.value;
    
    if (!col) return alert('Selecciona una columna.');
    
    stagedExcelRows.forEach((r, idx) => {
        if (r._checked && col in r) {
            r[col] = val;
            updateOfficialName(idx);
        }
    });
    renderExcelTable();
}

function saveExcelToDirectory() {
    if (!stagedExcelRows.length) return;
    if (!window.state) window.state = { directory: {} };
    if (!window.state.directory) window.state.directory = {};

    let added = 0;
    const toSave = stagedExcelRows.filter(r => r._checked);

    if (currentImporterType === 'equipos') {
        if (!window.state.directory.equipos) window.state.directory.equipos = [];
        toSave.forEach(r => {
            const newObj = {
                id: 'eq_' + Date.now() + Math.random().toString(36).substr(2, 9),
                nombre: r.nombreOficial,
                club: r.clubVinculado,
                categoria: r.categoria,
                temporada: r.temporada,
                grupo: r.grupo,
                competicion: r.competicion,
                federacion: r.federacion || '',
                fechaCreacion: new Date().toISOString()
            };
            window.state.directory.equipos.push(newObj);
            if (typeof window.saveToFirebase === 'function') {
                window.saveToFirebase('equipos', newObj);
            }
            added++;
        });
    } else if (currentImporterType === 'clubes') {
        if (!window.state.directory.clubes) window.state.directory.clubes = [];
        toSave.forEach(r => {
            const newClub = {
                id: 'cl_' + Date.now() + Math.random().toString(36).substr(2, 9),
                nombre: r.nombre,
                codigo: r.codigo || '',
                localidad: r.localidad || ''
            };
            window.state.directory.clubes.push(newClub);
            if (typeof window.saveToFirebase === 'function') {
                window.saveToFirebase('clubes', newClub);
            }
            added++;
        });
    } else {
        if (!window.state.directory.jugadores) window.state.directory.jugadores = [];
        if (!window.state.directory.staff) window.state.directory.staff = [];
        toSave.forEach(r => {
            const isStaff = r.rol && r.rol.toLowerCase() !== 'jugador';
            
            const newObj = {
                id: (isStaff ? 'st_' : 'j_') + Date.now() + Math.random().toString(36).substr(2, 9),
                nombre: r.nombre,
                [isStaff ? 'staff' : 'jugador']: r.nombre,
                rol: r.rol || 'Jugador',
                cargo: isStaff ? r.rol : '',
                equipo: r.equipo || '',
                equipoPrincipal: r.equipo || '',
                club: r.equipo ? (r.equipo.split(' ')[0] || r.equipo) : '',
                ano: r.ano || '',
                anoNac: r.ano || '',
                anoNacimiento: r.ano || '',
                anyo: r.ano || '',
                comunidad: r.comunidad || '',
                poblacion: r.poblacion || '',
                lateralidad: !isStaff ? (r.lateralidad || '') : '',
                dorsal: !isStaff ? (r.dorsal || '') : '',
                pais: 'España',
                sexo: 'MASCULINO',
                estado: 'ACTIVO'
            };
            
            if (isStaff) {
                window.state.directory.staff.push(newObj);
                if (typeof window.saveToFirebase === 'function') {
                    window.saveToFirebase('staff', newObj);
                }
            } else {
                const normalizeStr = (str) => {
                    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\.,]/g, '').toLowerCase().trim() : '';
                };
                const existingIdx = window.state.directory.jugadores.findIndex(j => normalizeStr(j.nombre || j.jugador) === normalizeStr(r.nombre));
                
                if (existingIdx !== -1) {
                    // Update existing
                    const existing = window.state.directory.jugadores[existingIdx];
                    Object.keys(newObj).forEach(k => {
                        if (newObj[k] && newObj[k] !== '' && k !== 'id') {
                            existing[k] = newObj[k];
                        }
                    });
                    if (typeof window.saveToFirebase === 'function') {
                        window.saveToFirebase('jugadores', existing);
                    }
                } else {
                    window.state.directory.jugadores.push(newObj);
                    if (typeof window.saveToFirebase === 'function') {
                        window.saveToFirebase('jugadores', newObj);
                    }
                }
            }
            added++;
        });
    }

    if (typeof window.saveState === 'function') window.saveState();
    if (typeof window.renderDirectorio === 'function') window.renderDirectorio();
    
    alert(`¡Éxito! Se han importado ${added} registros.`);
    
    stagedExcelRows = [];
    document.getElementById('importerStep2ExcelContainer').classList.add('hidden');
    document.getElementById('importerRawText').value = '';
}
