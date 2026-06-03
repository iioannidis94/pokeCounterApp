// --- team.js : Μηχανισμός Team Builder ---

(function teamBootstrap() {
    const TEAM_KEY = 'pokedex_my_team_v1', TEAM_SIZE = 50, TEAM_STATS = ['HP', 'ATK', 'DEF', 'SPATK', 'SPDEF', 'SPD'], TEAM_NATURES = ['Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty', 'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax', 'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive', 'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash', 'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'];
    const HELD_ITEMS = ['Leftovers', 'Choice Band', 'Choice Scarf', 'Choice Specs', 'Life Orb', 'Focus Sash', 'Assault Vest', 'Heavy-Duty Boots', 'Eviolite', 'Rocky Helmet', 'Black Sludge', 'Sitrus Berry', 'Lum Berry', 'Weakness Policy', 'Expert Belt', 'Air Balloon', 'Throat Spray', 'Loaded Dice', 'Covert Cloak', 'Clear Amulet', 'Booster Energy', 'Terrain Extender', 'Light Clay', 'Damp Rock', 'Heat Rock', 'Icy Rock', 'Smooth Rock', 'Safety Goggles', 'Power Herb', 'Mental Herb', 'White Herb', 'Red Card', 'Eject Button', 'Eject Pack', 'Mirror Herb', 'Punching Glove', 'Muscle Band', 'Wise Glasses', 'Shell Bell', 'Metronome', 'Flame Orb', 'Toxic Orb'];
    const TEAM_NATURE_EFFECTS = { Lonely: ['ATK', 'DEF'], Brave: ['ATK', 'SPD'], Adamant: ['ATK', 'SPATK'], Naughty: ['ATK', 'SPDEF'], Bold: ['DEF', 'ATK'], Relaxed: ['DEF', 'SPD'], Impish: ['DEF', 'SPATK'], Lax: ['DEF', 'SPDEF'], Timid: ['SPD', 'ATK'], Hasty: ['SPD', 'DEF'], Jolly: ['SPD', 'SPATK'], Naive: ['SPD', 'SPDEF'], Modest: ['SPATK', 'ATK'], Mild: ['SPATK', 'DEF'], Quiet: ['SPATK', 'SPD'], Rash: ['SPATK', 'SPDEF'], Calm: ['SPDEF', 'ATK'], Gentle: ['SPDEF', 'DEF'], Sassy: ['SPDEF', 'SPD'], Careful: ['SPDEF', 'SPATK'] };
    
    // ΠΡΟΣΘΗΚΗ: level: 100 στο EMPTY_SLOT
    const EMPTY_SLOT = () => ({ pokemonId: null, level: 100, nature: '', ability: '', item: '', calc: false, moveNames: ['', '', '', ''], moves: ['', '', '', ''], moveCats: ['', '', '', ''], iv: { HP: '', ATK: '', DEF: '', SPATK: '', SPDEF: '', SPD: '' }, ev: { HP: '', ATK: '', DEF: '', SPATK: '', SPDEF: '', SPD: '' } });
    
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

    // ΠΡΟΣΘΗΚΗ: φόρτωση του base.level στη normalizeSlot
    function normalizeSlot(slot) { const base = EMPTY_SLOT(); if (!slot || typeof slot !== 'object') return base; base.pokemonId = slot.pokemonId ? Number(slot.pokemonId) : null; base.level = slot.level !== undefined ? Number(slot.level) : 100; base.nature = slot.nature ? String(slot.nature) : ''; base.ability = slot.ability ? String(slot.ability) : ''; base.item = slot.item ? String(slot.item) : ''; base.calc = !!slot.calc; base.moveNames = Array.from({ length: 4 }, (_, i) => slot.moveNames && slot.moveNames[i] ? String(slot.moveNames[i]) : ''); base.moves = Array.from({ length: 4 }, (_, i) => slot.moves && slot.moves[i] ? String(slot.moves[i]) : ''); base.moveCats = Array.from({ length: 4 }, (_, i) => slot.moveCats && slot.moveCats[i] ? String(slot.moveCats[i]) : ''); TEAM_STATS.forEach(st => { base.iv[st] = slot.iv && slot.iv[st] !== undefined ? String(slot.iv[st]) : ''; base.ev[st] = slot.ev && slot.ev[st] !== undefined ? String(slot.ev[st]) : '' }); return base }

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
    
    function setStat(slot, kind, stat, value, el) { 
        if (kind === 'iv') {
            const clean = value === '' ? '' : String(Math.max(0, Math.min(31, Number(value) || 0)));
            team[slot][kind][stat] = clean;
            if (el && el.value !== clean) el.value = clean;
        } else if (kind === 'ev') {
            let otherEvTotal = 0;
            TEAM_STATS.forEach(s => {
                if (s !== stat) {
                    otherEvTotal += Number(team[slot].ev[s]) || 0;
                }
            });
            const maxAllowed = Math.min(252, 510 - otherEvTotal);
            const clean = value === '' ? '' : String(Math.max(0, Math.min(maxAllowed, Number(value) || 0)));
            team[slot][kind][stat] = clean;
            if (el && el.value !== clean) el.value = clean;
        }
        saveTeam(); 
    }

    function setMoveType(slot, move, value) { team[slot].moves[move] = value; saveTeam(); if (team[slot].calc) renderTeamSlots() } function setMoveCat(slot, move, value) { team[slot].moveCats[move] = value; saveTeam(); if (team[slot].calc) renderTeamSlots() } function setMoveName(slot, move, value) { const info = MOVE_INFO[value] || {}; team[slot].moveNames[move] = value; team[slot].moves[move] = info.type || ''; team[slot].moveCats[move] = info.cat || ''; saveTeam(); renderTeamSlots() }
    function setMeta(slot, field, value) { team[slot][field] = value; saveTeam(); if (field === 'nature') renderTeamSlots() }
    function natureClass(nature, stat) { const e = TEAM_NATURE_EFFECTS[nature]; if (!e) return ''; return e[0] === stat ? 'boost' : e[1] === stat ? 'drop' : '' }
    function clearSlot(i) { team[i] = EMPTY_SLOT(); saveTeam(); renderTeamSlots() }
    function calcTeam() { return team.map((slot, i) => ({ slot, i, p: POKE.find(x => x.id === slot.pokemonId) })).filter(x => x.slot.pokemonId && x.slot.calc && x.p).slice(0, 6) }
    function toggleCalc(i) { if (!team[i].pokemonId) return; if (!team[i].calc && calcTeam().length >= 6) { alert('You can calculate up to 6 Pokémon at a time.'); return } team[i].calc = !team[i].calc; saveTeam(); renderTeamSlots() }
    function multAtkVsTypes(atk, types) { return types.reduce((m, d) => m * (EFF[atk][d] ?? 1), 1) }

    // --- ΑΛΓΟΡΙΘΜΟΣ ΑΥΤΟΜΑΤΗΣ ΕΠΙΛΟΓΗΣ (AI) ---
    function autoRecommendTeam() {
        const pool = team.map((slot, i) => ({ slot, i, p: POKE.find(x => x.id === slot.pokemonId) })).filter(x => x.slot.pokemonId);
        if (pool.length === 0) { alert('Πρόσθεσε μερικά Pokémon πρώτα!'); return; }
        if (pool.length <= 6) { pool.forEach(x => x.slot.calc = true); saveTeam(); renderTeamSlots(); return; }

        team.forEach(s => s.calc = false);
        let bestTeam = [];
        
     const getRole = (slot, p) => {
    // 1. Προτεραιότητα στα EVs αν υπάρχουν
    let hp = Number(slot.ev.HP)||0, def = Number(slot.ev.DEF)||0, spd = Number(slot.ev.SPDEF)||0;
    let atk = Number(slot.ev.ATK)||0, spa = Number(slot.ev.SPATK)||0;
    
    if (hp + def + spd >= 250) return 'tank';
    if (atk > spa && atk > 100) return 'physical';
    if (spa > atk && spa > 100) return 'special';

    // 2. Αν δεν υπάρχουν EVs, χρησιμοποίησε τα Base Stats από το data.js
    // Αν δεν υπάρχει το BASE_STATS object, επιστρέφει mixed
    if (typeof BASE_STATS !== 'undefined') {
        const stats = BASE_STATS[p.id];
        if (stats) {
            if (stats.def > 100 || stats.spd > 100) return 'tank';
            if (stats.atk > stats.spa + 20) return 'physical';
            if (stats.spa > stats.atk + 20) return 'special';
        }
    }
    return 'mixed';
}; 

        while (bestTeam.length < 6 && bestTeam.length < pool.length) {
            let bestScore = -Infinity, bestCandidate = null;
            pool.filter(x => !bestTeam.includes(x)).forEach(candidate => {
                let score = 0;
                let cTypes = candidate.p.types;
                let cRole = getRole(candidate.slot, candidate.p); 

                if (typeof BASE_STATS !== 'undefined') {
                    const stats = BASE_STATS[candidate.p.id];
                    if (stats) {
                        let bst = stats.hp + stats.atk + stats.def + stats.spa + stats.spd + stats.spe;
                        score += (bst - 300) / 10;
                    }
                }

                if (bestTeam.length === 0) {
                    score += candidate.slot.moves.filter(m => m).length * 10;
                    if (score > bestScore) { bestScore = score; bestCandidate = candidate; }
                    return;
                }

                let teamWeaknesses = {};
                AT.forEach(t => teamWeaknesses[t] = 0);
                bestTeam.forEach(member => {
                    AT.forEach(t => {
                        let mult = multAtkVsTypes(t, member.p.types);
                        if (mult > 1) teamWeaknesses[t] += 1;
                        if (mult < 1) teamWeaknesses[t] -= 1;
                    });
                });

                AT.forEach(t => {
                    let cMult = multAtkVsTypes(t, cTypes);
                    if (teamWeaknesses[t] > 0) {
                        if (cMult < 1) score += 30; 
                        if (cMult === 0) score += 60; 
                        if (cMult > 1) score -= 50; 
                    }
                });

                let teamMoveTypes = new Set(bestTeam.flatMap(m => m.slot.moves).filter(x => x));
                candidate.slot.moves.filter(x => x).forEach(mt => {
                    if (!teamMoveTypes.has(mt)) score += 15; 
                });

                let teamRoles = bestTeam.map(m => getRole(m.slot, m.p));
                let tanks = teamRoles.filter(r => r === 'tank').length;
                let phys = teamRoles.filter(r => r === 'physical').length;
                let spec = teamRoles.filter(r => r === 'special').length;

                if (cRole === 'tank' && tanks < 2) score += 20;
                if (cRole === 'physical' && phys < 2) score += 20;
                if (cRole === 'special' && spec < 2) score += 20;
                if (cRole === 'physical' && phys >= 3) score -= 30; 
                if (cRole === 'special' && spec >= 3) score -= 30;  

                if (score > bestScore) { bestScore = score; bestCandidate = candidate; }
            });
            bestTeam.push(bestCandidate);
        }

        bestTeam.forEach(x => team[x.i].calc = true);
        saveTeam(); renderTeamSlots();
        alert('Ο Αλγόριθμος επέλεξε την ιδανική 6άδα με βάση τις αδυναμίες, τα EVs και τις επιθέσεις σας!');
    }

    function calcPanel() { const selected = calcTeam(); if (!selected.length) return `<div class="calcPanel"><div class="calcHead"><strong>Battle Calculate</strong><span>0/6 selected</span></div><div class="calcEmpty">Use Add to calculate on up to 6 Pokémon.</div></div>`; const moveEntries = selected.flatMap(x => x.slot.moves.map((type, i) => ({ type, cat: x.slot.moveCats[i] || '', name: x.p.name })).filter(m => m.type)); const damaging = moveEntries.filter(m => m.cat !== 'status'); const scored = damaging.filter(m => m.cat === 'physical' || m.cat === 'special'); const coverageMoves = scored.length ? scored : damaging; const moveTypes = [...new Set(coverageMoves.map(m => m.type))]; const typeCoverage = moveTypes.length ? AT.map(t => ({ t, best: Math.max(...moveTypes.map(m => EFF[m][t] ?? 1)) })) : AT.map(t => ({ t, best: 0 })); const strong = typeCoverage.filter(x => x.best > 1); const struggle = moveTypes.length ? typeCoverage.filter(x => x.best <= 1) : []; const threats = AT.map(t => { const hits = selected.map(x => ({ name: x.p.name, m: multAtkVsTypes(t, x.p.types) })).filter(x => x.m > 1); return { t, hits, count: hits.length, max: hits.reduce((a, x) => Math.max(a, x.m), 1) } }).filter(x => x.count).sort((a, b) => b.count - a.count || b.max - a.max || a.t.localeCompare(b.t)); const defenseSafe = AT.filter(t => selected.some(x => multAtkVsTypes(t, x.p.types) < 1)); const offenseScore = strong.length, defenseScore = defenseSafe.length; const missingCoverage = struggle.map(x => x.t); const sharedWeak = threats.filter(x => x.count >= Math.max(2, Math.ceil(selected.length / 2))).map(x => x.t); const x4Threats = threats.filter(x => x.max >= 4).map(x => x.t); const physicalCount = scored.filter(m => m.cat === 'physical').length, specialCount = scored.filter(m => m.cat === 'special').length, statusCount = moveEntries.filter(m => m.cat === 'status').length, uncategorized = moveEntries.filter(m => !m.cat).length; const notes = []; if (uncategorized) notes.push(`Set Physical/Special/Status on ${uncategorized} move${uncategorized > 1 ? 's' : ''} for a more accurate score.`); if (scored.length && physicalCount === 0) notes.push('No physical attacking pressure selected.'); if (scored.length && specialCount === 0) notes.push('No special attacking pressure selected.'); if (moveTypes.length && missingCoverage.length) notes.push(`Missing coverage: ${missingCoverage.slice(0, 8).join(', ')}${missingCoverage.length > 8 ? '...' : ''}`); if (sharedWeak.length) notes.push(`Many team members are weak to: ${sharedWeak.slice(0, 6).join(', ')}`); if (x4Threats.length) notes.push(`Watch x4 weaknesses from: ${x4Threats.slice(0, 6).join(', ')}`); if (moveTypes.length && !notes.length) notes.push('Coverage and attack categories look balanced for the selected team.'); const chips = list => list.length ? list.map(x => tb(x.t || x, 'calcBadge')).join('') : '<span class="calcNone">none</span>'; const threatHtml = threats.length ? threats.slice(0, 10).map(x => `<span class="calcThreat" style="border-color:${TC[x.t] || '#888'}"><span style="background:${TC[x.t] || '#888'}">${x.t}</span>${x.count} weak${x.max >= 4 ? ` · x${x.max}` : ''}</span>`).join('') : '<span class="calcNone">No obvious type weaknesses.</span>'; return `<div class="calcPanel"><div class="calcHead"><strong>Battle Calculate</strong><span>${selected.length}/6 selected</span></div><div class="calcScores"><div><span>Offense</span><strong>${offenseScore}/18</strong></div><div><span>Defense</span><strong>${defenseScore}/18</strong></div><div><span>Physical</span><strong>${physicalCount}</strong></div><div><span>Special</span><strong>${specialCount}</strong></div></div><div class="calcNotes">${notes.length ? notes.map(n => `<p>${n}</p>`).join('') : '<p>Choose move types first to score offense.</p>'}</div><div class="calcSelected">${selected.map(x => `<span>#${String(x.p.id).padStart(4, '0')} ${x.p.name.replace(/-/g, ' ')}</span>`).join('')}</div><div class="calcRows"><div><b>Attack advantage</b><div class="calcBadges">${moveTypes.length ? chips(strong) : '<span class="calcNone">Choose damaging move types first.</span>'}</div></div><div><b>Attack struggles</b><div class="calcBadges">${moveTypes.length ? chips(struggle) : '<span class="calcNone">Choose damaging move types first.</span>'}</div></div><div><b>Defensive threats</b><div class="calcBadges">${threatHtml}</div></div></div></div>` } 
    function exportTeam() { const filled = team.filter(s => s.pokemonId); const payload = { version: 1, exportedAt: new Date().toISOString(), team }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pokedex-team-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); alert(`Exported ${filled.length} Pokémon to JSON.`) }
    function importTeamFile(file) { if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const data = JSON.parse(reader.result); const raw = Array.isArray(data) ? data : data.team; if (!Array.isArray(raw)) throw new Error('No team array found'); team = Array.from({ length: TEAM_SIZE }, (_, i) => normalizeSlot(raw[i])); saveTeam(); renderTeamSlots(); alert('Team imported successfully.') } catch (e) { alert('Could not import this team JSON.') } }; reader.readAsText(file) } 
    function renderTeamList() { const el = document.getElementById('teamList'), q = teamQuery.toLowerCase().trim(); const list = POKE.filter(p => !q || p.name.replace(/-/g, ' ').includes(q) || String(p.id).includes(q) || p.types.some(t => t.includes(q))).slice(0, 160); el.innerHTML = list.map(p => `<button class="pickMon" type="button" data-id="${p.id}">${spriteImg(p)}<span><span class="pickName">#${String(p.id).padStart(4, '0')} ${p.name.replace(/-/g, ' ')}</span><span class="pickTypes">${p.types.map(t => tb(t)).join('')}</span></span></button>`).join('') || '<div class="emptyTeam">No Pokémon found.</div>' }
    
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
            
            // ΠΡΟΣΘΗΚΗ: Level Input μέσα στο metaGrid
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
        }).join('') 
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
    function openDex() { setView('dex'); render() }
    
    document.getElementById('myTeamBtn').addEventListener('click', openTeam); 
    document.getElementById('dexViewBtn').addEventListener('click', openDex); 
    document.getElementById('teamExport').addEventListener('click', exportTeam); 
    document.getElementById('teamImport').addEventListener('change', e => { importTeamFile(e.target.files[0]); e.target.value = '' }); 
    document.getElementById('teamClose').addEventListener('click', closeTeam); 
    document.getElementById('teamOverlay').addEventListener('click', e => { if (e.target.id === 'teamOverlay' && document.body.classList.contains('dex-view')) closeTeam() }); 
    document.getElementById('teamSearch').addEventListener('input', e => { teamQuery = e.target.value; renderTeamList() }); 
    document.getElementById('teamList').addEventListener('click', e => { const btn = e.target.closest('.pickMon'); if (btn) addToTeam(Number(btn.dataset.id)) }); 
    
    // ΠΡΟΣΘΗΚΗ: Event Listener για το Level Input
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
    
    document.getElementById('teamSlots').addEventListener('change', e => { if (e.target.matches('select[data-field]')) setMeta(Number(e.target.dataset.slot), e.target.dataset.field, e.target.value); if (e.target.matches('select[data-move-name]')) setMoveName(Number(e.target.dataset.slot), Number(e.target.dataset.moveName), e.target.value); if (e.target.matches('select[data-move]')) setMoveType(Number(e.target.dataset.slot), Number(e.target.dataset.move), e.target.value); if (e.target.matches('select[data-move-cat]')) setMoveCat(Number(e.target.dataset.slot), Number(e.target.dataset.moveCat), e.target.value) }); 
    document.getElementById('teamSlots').addEventListener('click', e => { const calc = e.target.closest('[data-calc]'); if (calc) { toggleCalc(Number(calc.dataset.calc)); return } const btn = e.target.closest('[data-clear]'); if (btn) clearSlot(Number(btn.dataset.clear)) }); 
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

    // ─────────────────────────────────────────────────────────────────
    // SHOWDOWN PASTE IMPORT
    // ─────────────────────────────────────────────────────────────────

    const SD_STAT_MAP = {
        hp: 'HP', atk: 'ATK', def: 'DEF',
        spa: 'SPATK', spd: 'SPDEF', spe: 'SPD',
        'special-attack': 'SPATK', 'special-defense': 'SPDEF', speed: 'SPD'
    };

    function parseShowdownBlock(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length);
        if (!lines.length) return null;

        const slot = EMPTY_SLOT();
        const moveNames = [];

        const firstLine = lines[0];
        const atIdx = firstLine.indexOf(' @ ');
        let rawName = atIdx !== -1 ? firstLine.slice(0, atIdx).trim() : firstLine.trim();
        if (atIdx !== -1) slot.item = firstLine.slice(atIdx + 3).trim();

        rawName = rawName.replace(/\s*\((M|F)\)\s*$/, '').trim();

        const nicknameMatch = rawName.match(/^.+\((.+)\)\s*$/);
        if (nicknameMatch) rawName = nicknameMatch[1].trim();

        const normalised = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        let pokemon = POKE.find(p => p.name === normalised)
            || POKE.find(p => p.name.startsWith(normalised))
            || POKE.find(p => normalised.startsWith(p.name))
            || POKE.find(p => p.name.replace(/-/g, '') === normalised.replace(/-/g, ''));

        if (!pokemon) return null;   
        slot.pokemonId = pokemon.id;

        for (let li = 1; li < lines.length; li++) {
            const line = lines[li];

            // Υποστήριξη Level
            const lvMatch = line.match(/^Level:\s*(\d+)/i);
            if (lvMatch) { slot.level = parseInt(lvMatch[1], 10); continue; }

            const natMatch = line.match(/^(\w+)\s+Nature$/i);
            if (natMatch) {
                const nat = natMatch[1];
                slot.nature = nat.charAt(0).toUpperCase() + nat.slice(1).toLowerCase();
                continue;
            }

            const abilMatch = line.match(/^Ability:\s*(.+)/i);
            if (abilMatch) { slot.ability = abilMatch[1].trim(); continue; }

            const evMatch = line.match(/^EVs:\s*(.+)/i);
            if (evMatch) {
                evMatch[1].split('/').forEach(part => {
                    const m = part.trim().match(/^(\d+)\s+(\S+)/);
                    if (!m) return;
                    const key = SD_STAT_MAP[m[2].toLowerCase()];
                    if (key) slot.ev[key] = String(Math.min(252, Math.max(0, parseInt(m[1], 10))));
                });
                continue;
            }

            const ivMatch = line.match(/^IVs:\s*(.+)/i);
            if (ivMatch) {
                ivMatch[1].split('/').forEach(part => {
                    const m = part.trim().match(/^(\d+)\s+(\S+)/);
                    if (!m) return;
                    const key = SD_STAT_MAP[m[2].toLowerCase()];
                    if (key) slot.iv[key] = String(Math.min(31, Math.max(0, parseInt(m[1], 10))));
                });
                continue;
            }

            if (line.startsWith('- ')) {
                moveNames.push(line.slice(2).trim());
                continue;
            }
        }

        slot.moveNames = Array.from({ length: 4 }, (_, i) => moveNames[i] || '');
        slot.moveNames.forEach((mn, i) => {
            if (!mn) return;
            const key = mn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const info = MOVE_INFO[mn] || MOVE_INFO[key] || {};
            slot.moves[i]    = info.type || '';
            slot.moveCats[i] = info.cat  || '';
        });

        return slot;
    }

    function parseShowdownPaste(text) {
        const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length);
        return blocks.map(parseShowdownBlock).filter(Boolean);
    }

    function importFromShowdown(slots) {
        let added = 0;
        for (const parsed of slots) {
            const idx = team.findIndex(s => !s.pokemonId);
            if (idx === -1) break;
            team[idx] = normalizeSlot(parsed);
            added++;
        }
        saveTeam();
        renderTeamSlots();
        return added;
    }

    (function injectShowdownModal() {
        const overlay = document.createElement('div');
        overlay.id = 'sdImportOverlay';
        overlay.style.cssText = [
            'display:none', 'position:fixed', 'inset:0', 'z-index:9999',
            'background:rgba(0,0,0,.75)', 'backdrop-filter:blur(4px)',
            'align-items:center', 'justify-content:center', 'padding:16px'
        ].join(';');

        overlay.innerHTML = `
          <div style="
            background:#13132a; border:1.5px solid #252545; border-radius:14px;
            width:100%; max-width:560px; padding:24px; position:relative;
            font-family:'Nunito',sans-serif; color:#e8e8ff;
          ">
            <button id="sdClose" style="
              position:absolute; top:14px; right:14px; background:#1a1a30;
              border:1px solid #252545; color:#7070aa; border-radius:50%;
              width:28px; height:28px; cursor:pointer; font-size:15px;
              display:flex; align-items:center; justify-content:center;
            " title="Close">✕</button>

            <h3 style="font-family:'Press Start 2P',monospace; font-size:11px;
              color:#ffcc00; margin-bottom:4px; letter-spacing:1px;">
              📋 PASTE FROM SHOWDOWN
            </h3>
            <p style="font-size:11px; color:#7070aa; margin-bottom:14px;">
              Paste one or more Pokémon in Showdown export format. Multiple Pokémon
              should be separated by a blank line.
            </p>

            <textarea id="sdPasteArea" rows="12" spellcheck="false" style="
              width:100%; background:#1a1a30; border:1.5px solid #252545;
              border-radius:8px; color:#e8e8ff; font-family:monospace;
              font-size:12px; padding:10px 12px; outline:none; resize:vertical;
              line-height:1.5;
            " placeholder="Floatzel @ Leftovers
Level: 63
Bashful Nature
Ability: Swift Swim
EVs: 92 HP / 109 Atk / 69 Def / 87 SpA / 43 SpD / 110 Spe
IVs: 31 HP / 26 Atk / 19 Def / 12 SpA / 11 SpD / 28 Spe
- Dig
- Liquidation
- Waterfall
- Surf"></textarea>

            <div style="display:flex; gap:10px; margin-top:12px; align-items:center;">
              <button id="sdImportBtn" style="
                padding:9px 22px; border-radius:50px; border:none; cursor:pointer;
                background:#ffcc00; color:#0d0d1a; font-family:'Nunito',sans-serif;
                font-size:13px; font-weight:900; transition:filter .15s;
              ">⬇️ Import to Team</button>
              <span id="sdMsg" style="font-size:12px; font-weight:800; color:#51cf66; opacity:0; transition:opacity .3s;"></span>
            </div>
          </div>`;

        document.body.appendChild(overlay);

        function openModal() {
            overlay.style.display = 'flex';
            document.getElementById('sdPasteArea').focus();
        }
        function closeModal() {
            overlay.style.display = 'none';
            document.getElementById('sdPasteArea').value = '';
            document.getElementById('sdMsg').style.opacity = '0';
        }

        overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
        document.getElementById('sdClose').addEventListener('click', closeModal);
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.style.display === 'flex') closeModal(); });

        document.getElementById('sdImportBtn').addEventListener('click', () => {
            const text = document.getElementById('sdPasteArea').value.trim();
            if (!text) { alert('Please paste some Pokémon data first.'); return; }

            const parsed = parseShowdownPaste(text);
            if (!parsed.length) {
                alert('Could not recognise any Pokémon in the pasted text.\nMake sure you use the Showdown export format.');
                return;
            }

            const added = importFromShowdown(parsed);
            const msg = document.getElementById('sdMsg');

            if (added === 0) {
                alert('Your team is full! Clear a slot first.');
                return;
            }

            msg.textContent = `✓ Added ${added} Pokémon!`;
            msg.style.opacity = '1';
            setTimeout(() => { msg.style.opacity = '0'; }, 2500);

            setTimeout(closeModal, 1400);
        });

        window._openShowdownModal = openModal;
    })();

    (function injectPasteButton() {
        const autoBtn = document.getElementById('autoTeamBtn');
        if (!autoBtn) return;
        const btn = document.createElement('button');
        btn.className = 'teamTool';
        btn.type = 'button';
        btn.id = 'sdPasteBtn';
        btn.textContent = '📋 Paste Pokemon';
        btn.style.cssText = 'border-color:#4dabf7; color:#4dabf7; background:rgba(77,171,247,0.1);';
        btn.addEventListener('click', () => window._openShowdownModal && window._openShowdownModal());
        autoBtn.parentNode.insertBefore(btn, autoBtn);
    })();

    openTeam();
})();
