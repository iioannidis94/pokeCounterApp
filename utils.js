
// --- utils.js : Κοινές Βοηθητικές Συναρτήσεις ---

// Υπολογισμός Αδυναμιών/Αντιστάσεων ενός Pokémon
function dmgR(types) {
    const x4 = [], x2 = [], half = [], qtr = [], imm = [];
    for (const a of AT) {
        let m = 1; 
        for (const d of types) m *= (EFF[a][d] ?? 1);
        if (m === 4) x4.push(a); 
        else if (m === 2) x2.push(a);
        else if (m === .5) half.push(a); 
        else if (m === .25) qtr.push(a);
        else if (m === 0) imm.push(a);
    }
    return { x4, x2, half, qtr, imm };
}

// Δημιουργία HTML Badges για Types
const tb = (t, c = 'tb') => `<span class="${c}" style="background:${TC[t] || '#888'}">${t}</span>`;
const dbw = (t, l) => `<span class="dbw" style="background:${TC[t] || '#888'}">${t}<span class="mx">${l}</span></span>`;
const dbs = t => `<span class="dbs" style="background:${TC[t] || '#888'}">${t}</span>`;

// Δημιουργία HTML UI για το Damage Breakdown
function dmgH(types) {
    const { x4, x2, half, qtr, imm } = dmgR(types); let h = '';
    if (x4.length) h += `<div class="dr"><span class="dl w">x4</span><div class="dt">${x4.map(t => dbw(t, 'x4')).join('')}</div></div>`;
    if (x2.length) h += `<div class="dr"><span class="dl w">x2</span><div class="dt">${x2.map(t => dbs(t)).join('')}</div></div>`;
    if (half.length) h += `<div class="dr"><span class="dl r">x0.5</span><div class="dt">${half.map(t => dbs(t)).join('')}</div></div>`;
    if (qtr.length) h += `<div class="dr"><span class="dl r">x0.25</span><div class="dt">${qtr.map(t => dbw(t, '¼')).join('')}</div></div>`;
    if (imm.length) h += `<div class="dr"><span class="dl im">x0</span><div class="dt">${imm.map(t => dbs(t)).join('')}</div></div>`;
    if (!h) h = '<div class="ntrl">No Weaknesses or Resistances</div>';
    return h;
}

// Πολλαπλασιαστής επίθεσης ενάντια σε συγκεκριμένα Types
function multAtkVsTypes(atk, types) { 
    return types.reduce((m, d) => m * (EFF[atk][d] ?? 1), 1); 
}

// Επιστροφή Base64 Sprite ως HTML img
function spriteImg(p, cls = '') { 
    const b64 = SPRITES[String(p.id)] || ''; 
    return b64 ? `<img class="${cls}" src="data:image/png;base64,${b64}" alt="${p.name}">` : '?'; 
}
