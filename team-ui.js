
// --- team-ui.js : Team Builder UI & Events ---

function updateTeamDropdown() {
    const select = document.getElementById('teamSelect');
    if (select) select.innerHTML = allData.teams.map((t, i) => `<option value="${i}" ${i === currentTeamIndex ? 'selected' : ''}>${t.name}</option>`).join('');
}

function firstEmptySlot() { return team.findIndex(s => !s.pokemonId) }
function addToTeam(id) { const i = firstEmptySlot(); if (i === -1) { alert('Your team is full. Clear a slot before adding another Pokémon.'); return } team[i].pokemonId = id; saveTeam(); renderTeamSlots() }

function setStat(slot, kind, stat, value, el) { 
    if (kind === 'iv') {
        const clean = value === '' ? '' : String(Math.max(0, Math.min(31, Number(value) || 0)));
        team[slot][kind][stat] = clean;
        if (el && el.value !== clean) el.value = clean;
    } else if (kind === 'ev') {
        let otherEvTotal = 0;
        TEAM_STATS.forEach(s => { if (s !== stat) otherEvTotal += Number(team[slot].ev[s]) || 0; });
        const maxAllowed = Math.min(252, 510 - otherEvTotal);
        const clean = value === '' ? '' : String(Math.max(0, Math.min(maxAllowed, Number(value) || 0)));
        team[slot][kind][stat] = clean;
        if (el && el.value !== clean) el.value = clean;
    }
    saveTeam(); 
}

function setMoveType(slot, move, value) { team[slot].moves[move] = value; saveTeam(); if (team[slot].calc) renderTeamSlots() } 
function setMoveCat(slot, move, value) { team[slot].moveCats[move] = value; saveTeam(); if (team[slot].calc) renderTeamSlots() } 
function setMoveName(slot, move, value) { const info = MOVE_INFO[value] || {}; team[slot].moveNames[move] = value; team[slot].moves[move] = info.type || ''; team[slot].moveCats[move] = info.cat || ''; saveTeam(); renderTeamSlots() }
function setMeta(slot, field, value) { team[slot][field] = value; saveTeam(); if (field === 'nature') renderTeamSlots() }
function natureClass(nature, stat) { const e = TEAM_NATURE_EFFECTS[nature]; if (!e) return ''; return e[0] === stat ? 'boost' : e[1] === stat ? 'drop' : '' }
function clearSlot(i) { team[i] = EMPTY_SLOT(); saveTeam(); renderTeamSlots() }
function calcTeam() { return team.map((slot, i) => ({ slot, i, p: POKE.find(x => x.id === slot.pokemonId) })).filter(x => x.slot.pokemonId && x.slot.calc && x.p).slice(0, 6) }
function toggleCalc(i) { if (!team[i].pokemonId) return; if (!team[i].calc && calcTeam().length >= 6) { alert('You can calculate up to 6 Pokémon at a time.'); return } team[i].calc = !team[i].calc; saveTeam(); renderTeamSlots() }

function calcPanel() { 
    const selected = calcTeam(); 
    if (!selected.length) return `<div class="calcPanel"><div class="calcHead"><strong>Battle Calculate</strong><span>0/6 selected</span></div><div class="calcEmpty">Use Add to calculate on up to 6 Pokémon.</div></div>`; 
    
    const moveEntries = selected.flatMap(x => x.slot.moves.map((type, i) => ({ type, cat: x.slot.moveCats[i] || '', name: x.p.name })).filter(m => m.type)); 
    const damaging = moveEntries.filter(m => m.cat !== 'status'); 
    const scored = damaging.filter(m => m.cat === 'physical' || m.cat === 'special'); 
    const coverageMoves = scored.length ? scored : damaging; 
    const moveTypes = [...new Set(coverageMoves.map(m => m.type))]; 
    const typeCoverage = moveTypes.length ? AT.map(t => ({ t, best: Math.max(...moveTypes.map(m => EFF[m][t] ?? 1)) })) : AT.map(t => ({ t, best: 0 })); 
    const strong = typeCoverage.filter(x => x.best > 1); 
    const struggle = moveTypes.length ? typeCoverage.filter(x => x.best <= 1) : []; 
    
    const threats = AT.map(t => { 
        const hits = selected.map(x => ({ name: x.p.name, m: multAtkVsTypes(t, x.p.types) })).filter(x => x.m > 1); 
        return { t, hits, count: hits.length, max: hits.reduce((a, x) => Math.max(a, x.m), 1) } 
    }).filter(x => x.count).sort((a, b) => b.count - a.count || b.max - a.max || a.t.localeCompare(b.t)); 
    
    const defenseSafe = AT.filter(t => selected.some(x => multAtkVsTypes(t, x.p.types) < 1)); 
    const offenseScore = strong.length, defenseScore = defenseSafe.length; 
    const missingCoverage = struggle.map(x => x.t); 
    const sharedWeak = threats.filter(x => x.count >= Math.max(2, Math.ceil(selected.length / 2))).map(x => x.t); 
    const x4Threats = threats.filter(x => x.max >= 4).map(x => x.t); 
    
    const physicalCount = scored.filter(m => m.cat === 'physical').length;
    const specialCount = scored.filter(m => m.cat === 'special').length;
    const statusCount = moveEntries.filter(m => m.cat === 'status').length;
    const uncategorized = moveEntries.filter(m => !m.cat).length; 
    
    const notes = []; 
    if (uncategorized) notes.push(`Set Physical/Special/Status on ${uncategorized} move${uncategorized > 1 ? 's' : ''} for a more accurate score.`); 
    if (scored.length && physicalCount === 0) notes.push('No physical attacking pressure selected.'); 
    if (scored.length && specialCount === 0) notes.push('No special attacking pressure selected.'); 
    if (moveTypes.length && missingCoverage.length) notes.push(`Missing coverage: ${missingCoverage.slice(0, 8).join(', ')}${missingCoverage.length > 8 ? '...' : ''}`); 
    if (sharedWeak.length) notes.push(`Many team members are weak to: ${sharedWeak.slice(0, 6).join(', ')}`); 
    if (x4Threats.length) notes.push(`Watch x4 weaknesses from: ${x4Threats.slice(0, 6).join(', ')}`); 
    if (moveTypes.length && !notes.length) notes.push('Coverage and attack categories look balanced for the selected team.'); 
    
    const chips = list => list.length ? list.map(x => tb(x.t || x, 'calcBadge')).join('') : '<span class="calcNone">none</span>'; 
    const threatHtml = threats.length ? threats.slice(0, 10).map(x => `<span class="calcThreat" style="border-color:${TC[x.t] || '#888'}"><span style="background:${TC[x.t] || '#888'}">${x.t}</span>${x.count} weak${x.max >= 4 ? ` · x${x.max}` : ''}</span>`).join('') : '<span class="calcNone">No obvious type weaknesses.</span>'; 
    
    return `<div class="calcPanel"><div class="calcHead"><strong>Battle Calculate</strong><span>${selected.length}/6 selected</span></div><div class="calcScores"><div><span>Offense</span><strong>${offenseScore}/18</strong></div><div><span>Defense</span><strong>${defenseScore}/18</strong></div><div><span>Physical</span><strong>${physicalCount}</strong></div><div><span>Special</span><strong>${specialCount}</strong></div></div><div class="calcNotes">${notes.length ? notes.map(n => `<p>${n}</p>`).join('') : '<p>Choose move types first to score offense.</p>'}</div><div class="calcSelected">${selected.map(x => `<span>#${String(x.p.id).padStart(4, '0')} ${x.p.name.replace(/-/g, ' ')}</span>`).join('')}</div><div class="calcRows"><div><b>Attack advantage</b><div class="calcBadges">${moveTypes.length ? chips(strong) : '<span class="calcNone">Choose damaging move types first.</span>'}</div></div><div><b>Attack struggles</b><div class="calcBadges">${moveTypes.length ? chips(struggle) : '<span class="calcNone">Choose damaging move types first.</span>'}</div></div><div><b>Defensive threats</b><div class="calcBadges">${threatHtml}</div></div></div></div>`;
} 

function renderTeamList() { 
    const el = document.getElementById('teamList'), q = teamQuery.toLowerCase().trim(); 
    const list = POKE.filter(p => !q || p.name.replace(/-/g, ' ').includes(q) || String(p.id).includes(q) || p.types.some(t => t.includes(q))).slice(0, 160); 
    el.innerHTML = list.map(p => `<button class="pickMon" type="button" data-id="${p.id}">${spriteImg(p)}<span><span class="pickName">#${String(p.id).padStart(4, '0')} ${p.name.replace(/-/g, ' ')}</span><span class="pickTypes">${p.types.map(t => tb(t)).join('')}</span></span></button>`).join('') || '<div class="emptyTeam">No Pokémon found.</div>';
}

function renderTeamSlots() { 
    const el = document.getElementById('teamSlots'), filled = team.map((slot, i) => ({ slot, i })).filter(x => x.slot.pokemonId); 
    if (!filled.length) { 
        el.innerHTML = calcPanel() + '<div class="emptyTeam">No Pokémon in your team yet.</div>'; 
        return;
    } 
    
    const moveCategories = {
        physical: '<img src="https://play.pokemonshowdown.com/sprites/categories/Physical.png" title="Physical Attack" alt="Physical" style="height:14px; image-rendering:pixelated; box-shadow:0 1px 2px rgba(0,0,0,0.4); border-radius:2px; cursor:help;">',
        special: '<img src="https://play.pokemonshowdown.com/sprites/categories/Special.png" title="Special Attack" alt="Special" style="height:14px; image-rendering:pixelated; box-shadow:0 1px 2px rgba(0,0,0,0.4); border-radius:2px; cursor:help;">',
        status: '<img src="https://play.pokemonshowdown.com/sprites/categories/Status.png" title="Status Move" alt="Status" style="height:14px; image-rendering:pixelated; box-shadow:0 1px 2px rgba(0,0,0,0.4); border-radius:2px; cursor:help;">'
    };

    el.innerHTML = calcPanel() + filled.map(({ slot, i }, displayIndex) => { 
        const p = POKE.find(x => x.id === slot.pokemonId); 
        if (!p) return ''; 
        const head = `<div class="slotImg">${spriteImg(p)}</div><div><div class="slotNum">Team ${displayIndex + 1}/${TEAM_SIZE} · #${String(p.id).padStart(4, '0')}</div><div class="slotName">${p.name.replace(/-/g, ' ')}</div><div class="slotTypes">${p.types.map(t => tb(t)).join('')}</div></div>`; 
        
        const meta = `<div class="metaGrid">
            <label>Level
                <input type="number" min="1" max="100" value="${slot.level}" data-slot="${i}" data-field="level" style="width:100%; min-width:0; background:var(--bg); border:1px solid var(--brd); border-radius:7px; color:var(--txt); font:800 12px 'Nunito',sans-serif; padding:6px; outline:none; text-align:center;">
            </label>
            <label>Nature<select data-slot="${i}" data-field="nature"><option value="">Select nature</option>${TEAM_NATURES.map(n => `<option value="${n}" ${slot.nature === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label>Ability<select data-slot="${i}" data-field="ability"><option value="">Select ability</option>${(ABILITIES[String(p.id)] || []).map(a => `<option value="${a}" ${slot.ability === a ? 'selected' : ''}>${a.replace(/-/g, ' ')}</option>`).join('')}</select></label>
            <label>Held Item<select data-slot="${i}" data-field="item"><option value="">No item</option>${HELD_ITEMS.map(item => `<option value="${item}" ${slot.item === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
        </div>`; 
        
        const stats = TEAM_STATS.map(st => { const nc = natureClass(slot.nature, st), ivClass = nc ? `iv${nc[0].toUpperCase() + nc.slice(1)}` : ""; return `<div class="statBox ${nc}"><label>${st}</label><div class="statInputs"><span>IV</span><span>EV</span><input class="${ivClass}" type="number" min="0" max="31" value="${slot.iv[st]}" data-slot="${i}" data-kind="iv" data-stat="${st}" placeholder="0"><input type="number" min="0" max="252" value="${slot.ev[st]}" data-slot="${i}" data-kind="ev" data-stat="${st}" placeholder="0"></div></div>` }).join(''); 
        const moveList = MOVES_BY_POKEMON[String(p.id)] || []; 
        
        const moves = `<div class="movesGrid">${[0, 1, 2, 3].map(m => {
            const moveName = slot.moveNames[m] || '';
            const moveType = slot.moves[m] || '';
            const moveCat = slot.moveCats[m] || '';
            
            const typeHtml = moveType ? tb(moveType) : '<span class="cat-badge cat-empty">Type</span>';
            const catHtml = moveCat && moveCategories[moveCat] ? moveCategories[moveCat] : '<span class="cat-badge cat-empty">Cat</span>';

            return `<div class="movePair">
                <label>Move ${m + 1}
                    <select data-slot="${i}" data-move-name="${m}">
                        <option value="">Select move...</option>
                        ${moveList.map(name => `<option value="${name}" ${moveName === name ? 'selected' : ''}>${name.replace(/-/g, ' ')}</option>`).join('')}
                    </select>
                </label>
                <div class="moveInfo">
                    ${typeHtml}
                    ${catHtml}
                </div>
            </div>`;
        }).join('')}</div>`; 
        
        return `<article class="slot"><div class="slotHead">${head}<div class="slotActions"><button class="calcToggle ${slot.calc ? 'on' : ''}" type="button" data-calc="${i}">${slot.calc ? 'In calculate' : 'Add to calculate'}</button><button class="clearSlot" type="button" data-clear="${i}" title="Clear slot">×</button></div></div>${meta}<div class="statGrid">${stats}</div>${moves}</article>` 
    }).join('');
}

function setView(view) { 
    const teamView = view === 'team'; 
    document.body.classList.toggle('team-view', teamView); 
    document.body.classList.toggle('dex-view', !teamView); 
    document.getElementById('myTeamBtn').classList.toggle('on', teamView); 
    document.getElementById('dexViewBtn').classList.toggle('on', !teamView); 
    document.getElementById('teamOverlay').setAttribute('aria-hidden', teamView ? 'false' : 'true');
    
    if (teamView) { 
        renderTeamList(); 
        renderTeamSlots(); 
        updateTeamDropdown(); 
    }
}

function openTeam() { setView('team') }
function closeTeam() { setView('dex') }
function openDex() { setView('dex'); if(typeof renderDex === 'function') renderDex() }

// --- Event Listeners Setup ---
document.getElementById('myTeamBtn').addEventListener('click', openTeam); 
document.getElementById('dexViewBtn').addEventListener('click', openDex); 
document.getElementById('teamExport').addEventListener('click', exportTeam); 
document.getElementById('teamImport').addEventListener('change', e => { importTeamFile(e.target.files[0]); e.target.value = '' }); 
document.getElementById('teamClose').addEventListener('click', closeTeam); 
document.getElementById('teamOverlay').addEventListener('click', e => { if (e.target.id === 'teamOverlay' && document.body.classList.contains('dex-view')) closeTeam() }); 
document.getElementById('teamSearch').addEventListener('input', e => { teamQuery = e.target.value; renderTeamList() }); 
document.getElementById('teamList').addEventListener('click', e => { const btn = e.target.closest('.pickMon'); if (btn) addToTeam(Number(btn.dataset.id)) }); 

document.getElementById('teamSlots').addEventListener('input', e => { 
    if (e.target.matches('input[data-slot][data-kind]')) {
        setStat(Number(e.target.dataset.slot), e.target.dataset.kind, e.target.dataset.stat, e.target.value, e.target);
    } else if (e.target.matches('input[data-field="level"]')) {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 100) val = 100;
        setMeta(Number(e.target.dataset.slot), 'level', val);
    }
});

document.getElementById('teamSlots').addEventListener('change', e => { 
    if (e.target.matches('select[data-field]')) setMeta(Number(e.target.dataset.slot), e.target.dataset.field, e.target.value); 
    if (e.target.matches('select[data-move-name]')) setMoveName(Number(e.target.dataset.slot), Number(e.target.dataset.moveName), e.target.value); 
    if (e.target.matches('select[data-move]')) setMoveType(Number(e.target.dataset.slot), Number(e.target.dataset.move), e.target.value); 
    if (e.target.matches('select[data-move-cat]')) setMoveCat(Number(e.target.dataset.slot), Number(e.target.dataset.moveCat), e.target.value);
}); 

document.getElementById('teamSlots').addEventListener('click', e => { 
    const calc = e.target.closest('[data-calc]'); 
    if (calc) { toggleCalc(Number(calc.dataset.calc)); return } 
    const btn = e.target.closest('[data-clear]'); 
    if (btn) clearSlot(Number(btn.dataset.clear));
}); 

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTeam() });

document.getElementById('teamSelect')?.addEventListener('change', e => {
    currentTeamIndex = Number(e.target.value);
    team = allData.teams[currentTeamIndex].slots;
    saveTeam();
    renderTeamSlots();
});

document.getElementById('addTeamBtn')?.addEventListener('click', () => {
    const name = prompt('Όνομα νέας ομάδας (π.χ. PvP, Catchers, Farm):', 'New Team');
    if (name) {
        allData.teams.push({ name: name, slots: Array.from({ length: TEAM_SIZE }, () => EMPTY_SLOT()) });
        currentTeamIndex = allData.teams.length - 1;
        team = allData.teams[currentTeamIndex].slots;
        saveTeam();
        updateTeamDropdown();
        renderTeamSlots();
    }
});

document.getElementById('renameTeamBtn')?.addEventListener('click', () => {
    const name = prompt('Νέο όνομα για αυτή την ομάδα:', allData.teams[currentTeamIndex].name);
    if (name) {
        allData.teams[currentTeamIndex].name = name;
        saveTeam();
        updateTeamDropdown();
    }
});

document.getElementById('teamReset').addEventListener('click', () => { 
    if (!confirm('Clear this team?')) return; 
    team = Array.from({ length: TEAM_SIZE }, () => EMPTY_SLOT()); 
    saveTeam(); 
    renderTeamSlots(); 
});

document.getElementById('autoTeamBtn')?.addEventListener('click', autoRecommendTeam);

// Inject Showdown Paste Button dynamically
(function injectPasteButton() {
    const autoBtn = document.getElementById('autoTeamBtn');
    if (!autoBtn) return;
    const btn = document.createElement('button');
    btn.className = 'teamTool';
    btn.type = 'button';
    btn.id = 'sdPasteBtn';
    btn.textContent = '📋 Paste Pokemon';
    btn.style.cssText = 'border-color:#4dabf7; color:#4dabf7; background:rgba(77,171,247,0.1); margin-right: 5px;';
    btn.addEventListener('click', () => window._openShowdownModal && window._openShowdownModal());
    autoBtn.parentNode.insertBefore(btn, autoBtn);
})();

// Start initialization
openTeam();
