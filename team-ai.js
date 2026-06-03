
// --- team-ai.js : Εξελιγμένος Αλγόριθμος AI ---

function autoRecommendTeam() {
    const pool = team.map((slot, i) => ({ slot, i, p: POKE.find(x => x.id === slot.pokemonId) })).filter(x => x.slot.pokemonId);
    if (pool.length === 0) { alert('Πρόσθεσε μερικά Pokémon στο ρόστερ (Slot) πρώτα!'); return; }
    if (pool.length <= 6) { pool.forEach(x => x.slot.calc = true); saveTeam(); renderTeamSlots(); return; }

    team.forEach(s => s.calc = false);
    let bestTeam = [];

    const getRealStat = (base, iv, ev, level, isHP, natureMult) => {
        base = base || 80; 
        iv = (iv === '' || iv === undefined) ? 31 : parseInt(iv); 
        ev = (ev === '' || ev === undefined) ? 0 : parseInt(ev);
        level = parseInt(level) || 100;

        if (isHP) {
            return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
        } else {
            let stat = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
            return Math.floor(stat * natureMult);
        }
    };

    const getNatureMultiplier = (nature, statName) => {
        if (!nature) return 1;
        const effects = TEAM_NATURE_EFFECTS[nature];
        if (!effects) return 1;
        if (effects[0] === statName) return 1.1; 
        if (effects[1] === statName) return 0.9; 
        return 1;
    };

    const getRoleDetails = (slot, p) => {
        let bs = (typeof BASE_STATS !== 'undefined' && BASE_STATS[p.id]) ? BASE_STATS[p.id] : {hp:80, atk:80, def:80, spa:80, spd:80, spe:80};
        
        let rHP = getRealStat(bs.hp, slot.iv.HP, slot.ev.HP, slot.level, true, 1);
        let rAtk = getRealStat(bs.atk, slot.iv.ATK, slot.ev.ATK, slot.level, false, getNatureMultiplier(slot.nature, 'ATK'));
        let rDef = getRealStat(bs.def, slot.iv.DEF, slot.ev.DEF, slot.level, false, getNatureMultiplier(slot.nature, 'DEF'));
        let rSpa = getRealStat(bs.spa, slot.iv.SPATK, slot.ev.SPATK, slot.level, false, getNatureMultiplier(slot.nature, 'SPATK'));
        let rSpd = getRealStat(bs.spd, slot.iv.SPDEF, slot.ev.SPDEF, slot.level, false, getNatureMultiplier(slot.nature, 'SPDEF'));
        let rSpe = getRealStat(bs.spe, slot.iv.SPD, slot.ev.SPD, slot.level, false, getNatureMultiplier(slot.nature, 'SPD')); 

        let bstReal = rHP + rAtk + rDef + rSpa + rSpd + rSpe; 
        let bulk = rHP + rDef + rSpd; 
        
        let role = 'mixed';
        if (bulk > (bstReal * 0.54)) role = 'tank';
        else if (rAtk > rSpa * 1.15) role = 'physical';
        else if (rSpa > rAtk * 1.15) role = 'special';

        return { role, bstReal, rAtk, rSpa, bulk };
    };

    while (bestTeam.length < 6 && bestTeam.length < pool.length) {
        let bestScore = -Infinity, bestCandidate = null;

        pool.filter(x => !bestTeam.includes(x)).forEach(candidate => {
            let score = 0;
            let cTypes = candidate.p.types;
            let details = getRoleDetails(candidate.slot, candidate.p);

            score += (details.bstReal / 40); 

            if (candidate.slot.item) score += 15;
            if (candidate.slot.ability) score += 10;
            if (candidate.slot.nature) score += 5;
            
            let validMoves = candidate.slot.moves.filter(m => m);
            score += validMoves.length * 10; 

            if (bestTeam.length === 0) {
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
                    if (cMult < 1) score += 45; 
                    if (cMult === 0) score += 75; 
                    if (cMult > 1) score -= 60; 
                }
            });

            let teamMoveTypes = new Set(bestTeam.flatMap(m => m.slot.moves).filter(x => x));
            validMoves.forEach(mt => {
                if (!teamMoveTypes.has(mt)) score += 25; 
            });

            let teamRoles = bestTeam.map(m => getRoleDetails(m.slot, m.p).role);
            let tanks = teamRoles.filter(r => r === 'tank').length;
            let phys = teamRoles.filter(r => r === 'physical').length;
            let spec = teamRoles.filter(r => r === 'special').length;

            if (details.role === 'tank' && tanks < 2) score += 35; 
            if (details.role === 'physical' && phys < 2) score += 35; 
            if (details.role === 'special' && spec < 2) score += 35; 
            
            if (details.role === 'physical' && phys >= 3) score -= 45; 
            if (details.role === 'special' && spec >= 3) score -= 45;  
            if (details.role === 'tank' && tanks >= 3) score -= 40; 

            if (score > bestScore) { bestScore = score; bestCandidate = candidate; }
        });
        bestTeam.push(bestCandidate);
    }

    bestTeam.forEach(x => team[x.i].calc = true);
    saveTeam(); 
    if (typeof renderTeamSlots === 'function') renderTeamSlots();
    alert('✨ Η Τεχνητή Νοημοσύνη (AI) ανέλυσε τα Levels, EVs/IVs, Movesets και Type Synergies και επέλεξε την ιδανική 6άδα!');
}
