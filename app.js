function dmgR(types) {
    const x4 = [], x2 = [], half = [], qtr = [], imm = [];
    for (const a of AT) {
        let m = 1; for (const d of types) m *= (EFF[a][d] ?? 1);
        if (m === 4) x4.push(a); else if (m === 2) x2.push(a);
        else if (m === .5) half.push(a); else if (m === .25) qtr.push(a);
        else if (m === 0) imm.push(a);
    }
    return { x4, x2, half, qtr, imm };
}

const tb = (t, c = 'tb') => `<span class="${c}" style="background:${TC[t] || '#888'}">${t}</span>`;
const dbw = (t, l) => `<span class="dbw" style="background:${TC[t] || '#888'}">${t}<span class="mx">${l}</span></span>`;
const dbs = t => `<span class="dbs" style="background:${TC[t] || '#888'}">${t}</span>`;

function dmgH(types) {
    const { x4, x2, half, qtr, imm } = dmgR(types); let h = '';
    if (x4.length) h += `<div class="dr"><span class="dl w">×4 🔥</span><span class="dt">${x4.map(t => dbw(t, '×4')).join('')}</span></div>`;
    if (x2.length) h += `<div class="dr"><span class="dl w">×2 ⚡</span><span class="dt">${x2.map(t => dbw(t, '×2')).join('')}</span></div>`;
    const res = [...qtr.map(t => dbw(t, '×¼')), ...half.map(t => dbw(t, '×½'))];
    if (res.length) h += `<div class="dr"><span class="dl r">↓ Resist</span><span class="dt">${res.join('')}</span></div>`;
    if (imm.length) h += `<div class="dr"><span class="dl im">✕ Immune</span><span class="dt">${imm.map(dbs).join('')}</span></div>`;
    if (!h) h = '<div class="ntrl">No special weaknesses</div>';
    return h;
}

function card(p) {
    const { id, name, types } = p;
    const col = TC[types[0]] || '#888';
    const num = String(id).padStart(4, '0');
    const b64 = SPRITES[String(id)] || '';
    const src = b64 ? `data:image/png;base64,${b64}` : '';
    const img = src ? `<img src="${src}" alt="${name}">` : '<span style="color:var(--dim);font-size:22px">?</span>';
    return `<div class="card">
    <div class="ab" style="background:${col}"></div>
    <div class="sw2">${img}</div>
    <div class="info">
      <div class="ph"><span class="num">#${num}</span><span class="pn">${name.replace(/-/g, ' ')}</span></div>
      <div class="tr">${types.map(t => tb(t)).join('')}</div>
      <div class="db">${dmgH(types)}</div>
    </div>
  </div>`;
}

const tfEl = document.getElementById('tf');
let activeT = null;
AT.forEach(t => {
    const b = document.createElement('button');
    b.className = 'tf'; b.textContent = t;
    b.style.color = TC[t]; b.style.borderColor = TC[t];
    b.dataset.t = t;
    b.addEventListener('click', () => {
        if (activeT === t) { activeT = null; b.classList.remove('on') }
        else { tfEl.querySelectorAll('.tf').forEach(x => x.classList.remove('on')); activeT = t; b.classList.add('on') }
        render();
    });
    tfEl.appendChild(b);
});

const grid = document.getElementById('grid');
const cntEl = document.getElementById('cnt');
let q = '';

function render() {
    const ql = q.toLowerCase().trim();
    let list = POKE;
    if (ql) list = list.filter(p => p.name.replace(/-/g, ' ').includes(ql) || String(p.id).includes(ql) || p.types.some(t => t.includes(ql)));
    if (activeT) list = list.filter(p => p.types.includes(activeT));
    cntEl.innerHTML = `Showing <strong>${list.length}</strong> / ${POKE.length} Pokémon`;
    if (!list.length) {
        grid.innerHTML = '<div class="nores"><div class="em">😴</div><p>No Pokémon found for "' + ql + '"</p></div>';
        return;
    }
    grid.innerHTML = list.map(card).join('');
}

(function teamBootstrap() {
    const TEAM_KEY = 'pokedex_my_team_v1', TEAM_SIZE = 50, TEAM_STATS = ['HP', 'ATK', 'DEF', 'SPATK', 'SPDEF', 'SPD'], TEAM_NATURES = ['Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty', 'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax', 'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive', 'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash', 'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'];
    const HELD_ITEMS = ['Leftovers', 'Choice Band', 'Choice Scarf', 'Choice Specs', 'Life Orb', 'Focus Sash', 'Assault Vest', 'Heavy-Duty Boots', 'Eviolite', 'Rocky Helmet', 'Black Sludge', 'Sitrus Berry', 'Lum Berry', 'Weakness Policy', 'Expert Belt', 'Air Balloon', 'Throat Spray', 'Loaded Dice', 'Covert Cloak', 'Clear Amulet', 'Booster Energy', 'Terrain Extender', 'Light Clay', 'Damp Rock', 'Heat Rock', 'Icy Rock', 'Smooth Rock', 'Safety Goggles', 'Power Herb', 'Mental Herb', 'White Herb', 'Red Card', 'Eject Button', 'Eject Pack', 'Mirror Herb', 'Punching Glove', 'Muscle Band', 'Wise Glasses', 'Shell Bell', 'Metronome', 'Flame Orb', 'Toxic Orb'];
    const TEAM_NATURE_EFFECTS = { Lonely: ['ATK', 'DEF'], Brave: ['ATK', 'SPD'], Adamant: ['ATK', 'SPATK'], Naughty: ['ATK', 'SPDEF'], Bold: ['DEF', 'ATK'], Relaxed: ['DEF', 'SPD'], Impish: ['DEF', 'SPATK'], Lax: ['DEF', 'SPDEF'], Timid: ['SPD', 'ATK'], Hasty: ['SPD', 'DEF'], Jolly: ['SPD', 'SPATK'], Naive: ['SPD', 'SPDEF'], Modest: ['SPATK', 'ATK'], Mild: ['SPATK', 'DEF'], Quiet: ['SPATK', 'SPD'], Rash: ['SPATK', 'SPDEF'], Calm: ['SPDEF', 'ATK'], Gentle: ['SPDEF', 'DEF'], Sassy: ['SPDEF', 'SPD'], Careful: ['SPDEF', 'SPATK'] };
    
    const EMPTY_SLOT = () => ({ pokemonId: null, nature: '', ability: '', item: '', calc: false, moveNames: ['', '', '', ''], moves: ['', '', '', ''], moveCats: ['', '', '', ''], iv: { HP: '', ATK: '', DEF: '', SPATK: '', SPDEF: '', SPD: '' }, ev: { HP: '', ATK: '', DEF: '', SPATK: '', SPDEF: '', SPD: '' } });
    
    const MULTI_TEAM_KEY = 'pokedex_multiteam_v1';
    let allData = loadAllTeams(), teamQuery = '';
    let currentTeamIndex = allData.activeIndex;
    let team = allData.teams[currentTeamIndex].slots;

    function loadAllTeams() {
        try {
            const raw = JSON.parse(localStorage.getItem(MULTI_TEAM_KEY));
            if (raw && raw.teams && raw.teams.length > 0) return raw;
        } catch (e) {}
        
        let oldTeam = Array.from({ length: TEAM_SIZE }, () => EMPTY_SLOT());
        try {
            const oldRaw = JSON.parse(localStorage.getItem(TEAM_KEY));
            if (Array.isArray(oldRaw)) oldTeam = Array.from({ length: TEAM_SIZE }, (_, i) => normalizeSlot(oldRaw[i]));
        } catch (e) {}
        
        return { activeIndex: 0, teams: [{ name: 'Main Team', slots: oldTeam }] };
    }

    function normalizeSlot(slot) { const base = EMPTY_SLOT(); if (!slot || typeof slot !== 'object') return base; base.pokemonId = slot.pokemonId ? Number(slot.pokemonId) : null; base.nature = slot.nature ? String(slot.nature) : ''; base.ability = slot.ability ? String(slot.ability) : ''; base.item = slot.item ? String(slot.item) : ''; base.calc = !!slot.calc; base.moveNames = Array.from({ length: 4 }, (_, i) => slot.moveNames && slot.moveNames[i] ? String(slot.moveNames[i]) : ''); base.moves = Array.from({ length: 4 }, (_, i) => slot.moves && slot.moves[i] ? String(slot.moves[i]) : ''); base.moveCats = Array.from({ length: 4 }, (_, i) => slot.moveCats && slot.moveCats[i] ? String(slot.moveCats[i]) : ''); TEAM_STATS.forEach(st => { base.iv[st] = slot.iv && slot.iv[st] !== undefined ? String(slot.iv[st]) : ''; base.ev[st] = slot.ev && slot.ev[st] !== undefined ? String(slot.ev[st]) : '' }); return base }

    function saveTeam() {
        allData.teams[currentTeamIndex].slots = team;
        allData.activeIndex = currentTeamIndex;
        localStorage.setItem(MULTI_TEAM_KEY, JSON.stringify(allData));
    }

    function updateTeamDropdown() {
        const select = document.getElementById('teamSelect');
        if (select) select.innerHTML = allData.teams.map((t, i) => `<option value="${i}" ${i === currentTeamIndex ? 'selected' : ''}>${t.name}</option>`).join('');
    }
    
    function spriteImg(p, cls = '') { const b64 = SPRITES[String(p.id)] || ''; return b64 ? `<img class="${cls}" src="data:image/png;base64,${b64}" alt="${p.name}">` : '?' }
    function firstEmptySlot() { return team.findIndex(s => !s.pokemonId) }
    function addToTeam(id) { const i = firstEmptySlot(); if (i === -1) { alert('Your team is full. Clear a slot before adding another Pokémon.'); return } team[i].pokemonId = id; saveTeam(); renderTeamSlots() }
    function setStat(slot, kind, stat, value) { const max = kind === 'iv' ? 31 : 252; const clean = value === '' ? '' : String(Math.max(0, Math.min(max, Number(value) || 0))); team[slot][kind][stat] = clean; saveTeam() }
    function setMoveType(slot, move, value) { team[slot].moves[move] = value; saveTeam(); if (team[slot].calc) renderTeamSlots() } function setMoveCat(slot, move, value) { team[slot].moveCats[move] = value; saveTeam(); if (team[slot].calc) renderTeamSlots() } function setMoveName(slot, move, value) { const info = MOVE_INFO[value] || {}; team[slot].moveNames[move] = value; team[slot].moves[move] = info.type || ''; team[slot].moveCats[move] = info.cat || ''; saveTeam(); renderTeamSlots() }
    function setMeta(slot, field, value) { team[slot][field] = value; saveTeam(); if (field === 'nature') renderTeamSlots() }
    function natureClass(nature, stat) { const e = TEAM_NATURE_EFFECTS[nature]; if (!e) return ''; return e[0] === stat ? 'boost' : e[1] === stat ? 'drop' : '' }
    function clearSlot(i) { team[i] = EMPTY_SLOT(); saveTeam(); renderTeamSlots() }
    function calcTeam() { return team.map((slot, i) => ({ slot, i, p: POKE.find(x => x.id === slot.pokemonId) })).filter(x => x.slot.pokemonId && x.slot.calc && x.p).slice(0, 6) }
    function toggleCalc(i) { if (!team[i].pokemonId) return; if (!team[i].calc && calcTeam().length >= 6) { alert('You can calculate up to 6 Pokémon at a time.'); return } team[i].calc = !team[i].calc; saveTeam(); renderTeamSlots() }
    function multAtkVsTypes(atk, types) { return types.reduce((m, d) => m * (EFF[atk][d] ?? 1), 1) }
    function calcPanel() { const selected = calcTeam(); if (!selected.length) return `<div class="calcPanel"><div class="calcHead"><strong>Battle Calculate</strong><span>0/6 selected</span></div><div class="calcEmpty">Use Add to calculate on up to 6 Pokémon.</div></div>`; const moveEntries = selected.flatMap(x => x.slot.moves.map((type, i) => ({ type, cat: x.slot.moveCats[i] || '', name: x.p.name })).filter(m => m.type)); const damaging = moveEntries.filter(m => m.cat !== 'status'); const scored = damaging.filter(m => m.cat === 'physical' || m.cat === 'special'); const coverageMoves = scored.length ? scored : damaging; const moveTypes = [...new Set(coverageMoves.map(m => m.type))]; const typeCoverage = moveTypes.length ? AT.map(t => ({ t, best: Math.max(...moveTypes.map(m => EFF[m][t] ?? 1)) })) : AT.map(t => ({ t, best: 0 })); const strong = typeCoverage.filter(x => x.best > 1); const struggle = moveTypes.length ? typeCoverage.filter(x => x.best <= 1) : []; const threats = AT.map(t => { const hits = selected.map(x => ({ name: x.p.name, m: multAtkVsTypes(t, x.p.types) })).filter(x => x.m > 1); return { t, hits, count: hits.length, max: hits.reduce((a, x) => Math.max(a, x.m), 1) } }).filter(x => x.count).sort((a, b) => b.count - a.count || b.max - a.max || a.t.localeCompare(b.t)); const defenseSafe = AT.filter(t => selected.some(x => multAtkVsTypes(t, x.p.types) < 1)); const offenseScore = strong.length, defenseScore = defenseSafe.length; const missingCoverage = struggle.map(x => x.t); const sharedWeak = threats.filter(x => x.count >= Math.max(2, Math.ceil(selected.length / 2))).map(x => x.t); const x4Threats = threats.filter(x => x.max >= 4).map(x => x.t); const physicalCount = scored.filter(m => m.cat === 'physical').length, specialCount = scored.filter(m => m.cat === 'special').length, statusCount = moveEntries.filter(m => m.cat === 'status').length, uncategorized = moveEntries.filter(m => !m.cat).length; const notes = []; if (uncategorized) notes.push(`Set Physical/Special/Status on ${uncategorized} move${uncategorized > 1 ? 's' : ''} for a more accurate score.`); if (scored.length && physicalCount === 0) notes.push('No physical attacking pressure selected.'); if (scored.length && specialCount === 0) notes.push('No special attacking pressure selected.'); if (moveTypes.length && missingCoverage.length) notes.push(`Missing coverage: ${missingCoverage.slice(0, 8).join(', ')}${missingCoverage.length > 8 ? '...' : ''}`); if (sharedWeak.length) notes.push(`Many team members are weak to: ${sharedWeak.slice(0, 6).join(', ')}`); if (x4Threats.length) notes.push(`Watch x4 weaknesses from: ${x4Threats.slice(0, 6).join(', ')}`); if (moveTypes.length && !notes.length) notes.push('Coverage and attack categories look balanced for the selected team.'); const chips = list => list.length ? list.map(x => tb(x.t || x, 'calcBadge')).join('') : '<span class="calcNone">none</span>'; const threatHtml = threats.length ? threats.slice(0, 10).map(x => `<span class="calcThreat" style="border-color:${TC[x.t] || '#888'}"><span style="background:${TC[x.t] || '#888'}">${x.t}</span>${x.count} weak${x.max >= 4 ? ` · x${x.max}` : ''}</span>`).join('') : '<span class="calcNone">No obvious type weaknesses.</span>'; return `<div class="calcPanel"><div class="calcHead"><strong>Battle Calculate</strong><span>${selected.length}/6 selected</span></div><div class="calcScores"><div><span>Offense</span><strong>${offenseScore}/18</strong></div><div><span>Defense</span><strong>${defenseScore}/18</strong></div><div><span>Physical</span><strong>${physicalCount}</strong></div><div><span>Special</span><strong>${specialCount}</strong></div></div><div class="calcNotes">${notes.length ? notes.map(n => `<p>${n}</p>`).join('') : '<p>Choose move types first to score offense.</p>'}</div><div class="calcSelected">${selected.map(x => `<span>#${String(x.p.id).padStart(4, '0')} ${x.p.name.replace(/-/g, ' ')}</span>`).join('')}</div><div class="calcRows"><div><b>Attack advantage</b><div class="calcBadges">${moveTypes.length ? chips(strong) : '<span class="calcNone">Choose damaging move types first.</span>'}</div></div><div><b>Attack struggles</b><div class="calcBadges">${moveTypes.length ? chips(struggle) : '<span class="calcNone">Choose damaging move types first.</span>'}</div></div><div><b>Defensive threats</b><div class="calcBadges">${threatHtml}</div></div></div></div>` } function exportTeam() { const filled = team.filter(s => s.pokemonId); const payload = { version: 1, exportedAt: new Date().toISOString(), team }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pokedex-team-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); alert(`Exported ${filled.length} Pokémon to JSON.`) }
    function importTeamFile(file) { if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const data = JSON.parse(reader.result); const raw = Array.isArray(data) ? data : data.team; if (!Array.isArray(raw)) throw new Error('No team array found'); team = Array.from({ length: TEAM_SIZE }, (_, i) => normalizeSlot(raw[i])); saveTeam(); renderTeamSlots(); alert('Team imported successfully.') } catch (e) { alert('Could not import this team JSON.') } }; reader.readAsText(file) } function renderTeamList() { const el = document.getElementById('teamList'), q = teamQuery.toLowerCase().trim(); const list = POKE.filter(p => !q || p.name.replace(/-/g, ' ').includes(q) || String(p.id).includes(q) || p.types.some(t => t.includes(q))).slice(0, 160); el.innerHTML = list.map(p => `<button class="pickMon" type="button" data-id="${p.id}">${spriteImg(p)}<span><span class="pickName">#${String(p.id).padStart(4, '0')} ${p.name.replace(/-/g, ' ')}</span><span class="pickTypes">${p.types.map(t => tb(t)).join('')}</span></span></button>`).join('') || '<div class="emptyTeam">No Pokémon found.</div>' }
    function renderTeamSlots() { const el = document.getElementById('teamSlots'), filled = team.map((slot, i) => ({ slot, i })).filter(x => x.slot.pokemonId); if (!filled.length) { el.innerHTML = calcPanel() + '<div class="emptyTeam">No Pokémon in your team yet.</div>'; return } el.innerHTML = calcPanel() + filled.map(({ slot, i }, displayIndex) => { const p = POKE.find(x => x.id === slot.pokemonId); if (!p) return ''; const head = `<div class="slotImg">${spriteImg(p)}</div><div><div class="slotNum">Team ${displayIndex + 1}/${TEAM_SIZE} · #${String(p.id).padStart(4, '0')}</div><div class="slotName">${p.name.replace(/-/g, ' ')}</div><div class="slotTypes">${p.types.map(t => tb(t)).join('')}</div></div>`; const meta = `<div class="metaGrid"><label>Nature<select data-slot="${i}" data-field="nature"><option value="">Select nature</option>${TEAM_NATURES.map(n => `<option value="${n}" ${slot.nature === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label>Ability<select data-slot="${i}" data-field="ability"><option value="">Select ability</option>${(ABILITIES[String(p.id)] || []).map(a => `<option value="${a}" ${slot.ability === a ? 'selected' : ''}>${a.replace(/-/g, ' ')}</option>`).join('')}</select></label><label>Held Item<select data-slot="${i}" data-field="item"><option value="">No item</option>${HELD_ITEMS.map(item => `<option value="${item}" ${slot.item === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label></div>`; const stats = TEAM_STATS.map(st => { const nc = natureClass(slot.nature, st), ivClass = nc ? `iv${nc[0].toUpperCase() + nc.slice(1)}` : ""; return `<div class="statBox ${nc}"><label>${st}</label><div class="statInputs"><span>IV</span><span>EV</span><input class="${ivClass}" type="number" min="0" max="31" value="${slot.iv[st]}" data-slot="${i}" data-kind="iv" data-stat="${st}" placeholder="0"><input type="number" min="0" max="252" value="${slot.ev[st]}" data-slot="${i}" data-kind="ev" data-stat="${st}" placeholder="0"></div></div>` }).join(''); const moveList = MOVES_BY_POKEMON[String(p.id)] || []; const moves = `<div class="movesGrid">${[0, 1, 2, 3].map(m => `<div class="movePair"><label>Move ${m + 1}<select data-slot="${i}" data-move-name="${m}"><option value="">Select move</option>${moveList.map(name => `<option value="${name}" ${slot.moveNames[m] === name ? 'selected' : ''}>${name.replace(/-/g, ' ')}</option>`).join('')}</select></label><label>Type<select disabled><option value="">Type</option>${AT.map(t => `<option value="${t}" ${slot.moves[m] === t ? 'selected' : ''} style="color:${TC[t] || '#888'}">${t}</option>`).join('')}</select></label><label>Category<select disabled><option value="">Damage kind</option><option value="physical" ${slot.moveCats[m] === 'physical' ? 'selected' : ''}>Physical</option><option value="special" ${slot.moveCats[m] === 'special' ? 'selected' : ''}>Special</option><option value="status" ${slot.moveCats[m] === 'status' ? 'selected' : ''}>Status</option></select></label></div>`).join('')}</div>`; return `<article class="slot"><div class="slotHead">${head}<div class="slotActions"><button class="calcToggle ${slot.calc ? 'on' : ''}" type="button" data-calc="${i}">${slot.calc ? 'In calculate' : 'Add to calculate'}</button><button class="clearSlot" type="button" data-clear="${i}" title="Clear slot">×</button></div></div>${meta}<div class="statGrid">${stats}</div>${moves}</article>` }).join('') }
    
    // Διορθωμένη setView
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
    function openDex() { setView('dex'); render() }
    
    // Όλα τα Events
    document.getElementById('myTeamBtn').addEventListener('click', openTeam); 
    document.getElementById('dexViewBtn').addEventListener('click', openDex); 
    document.getElementById('teamExport').addEventListener('click', exportTeam); 
    document.getElementById('teamImport').addEventListener('change', e => { importTeamFile(e.target.files[0]); e.target.value = '' }); 
    document.getElementById('teamClose').addEventListener('click', closeTeam); 
    document.getElementById('teamOverlay').addEventListener('click', e => { if (e.target.id === 'teamOverlay' && document.body.classList.contains('dex-view')) closeTeam() }); 
    document.getElementById('teamSearch').addEventListener('input', e => { teamQuery = e.target.value; renderTeamList() }); 
    document.getElementById('teamList').addEventListener('click', e => { const btn = e.target.closest('.pickMon'); if (btn) addToTeam(Number(btn.dataset.id)) }); 
    document.getElementById('teamSlots').addEventListener('input', e => { if (e.target.matches('input[data-slot]')) setStat(Number(e.target.dataset.slot), e.target.dataset.kind, e.target.dataset.stat, e.target.value) }); 
    document.getElementById('teamSlots').addEventListener('change', e => { if (e.target.matches('select[data-field]')) setMeta(Number(e.target.dataset.slot), e.target.dataset.field, e.target.value); if (e.target.matches('select[data-move-name]')) setMoveName(Number(e.target.dataset.slot), Number(e.target.dataset.moveName), e.target.value); if (e.target.matches('select[data-move]')) setMoveType(Number(e.target.dataset.slot), Number(e.target.dataset.move), e.target.value); if (e.target.matches('select[data-move-cat]')) setMoveCat(Number(e.target.dataset.slot), Number(e.target.dataset.moveCat), e.target.value) }); 
    document.getElementById('teamSlots').addEventListener('click', e => { const calc = e.target.closest('[data-calc]'); if (calc) { toggleCalc(Number(calc.dataset.calc)); return } const btn = e.target.closest('[data-clear]'); if (btn) clearSlot(Number(btn.dataset.clear)) }); 
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTeam() });

    // Events για Πολλαπλές Ομάδες (Διορθωμένα)
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

    // Διορθωμένο Reset
    document.getElementById('teamReset').addEventListener('click', () => { 
        if (!confirm('Clear this team?')) return; 
        team = Array.from({ length: TEAM_SIZE }, () => EMPTY_SLOT()); 
        saveTeam(); 
        renderTeamSlots(); 
    });

    openTeam();
})()

document.getElementById('search').addEventListener('input', e => { q = e.target.value; render() });
render();