// --- utils.js : Κοινές Βοηθητικές Συναρτήσεις ---

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

// Τροποποίηση: Το tb (Type Badge) είναι πλέον clickable και ανοίγει το Type Chart
const tb = (t, c = 'tb') => `<span class="${c}" style="background:${TC[t] || '#888'}; cursor:pointer; transition:transform 0.1s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="showTypeChart('${t}')" title="Click to view Type Chart">${t}</span>`;
const dbw = (t, l) => `<span class="dbw" style="background:${TC[t] || '#888'}; cursor:pointer;" onclick="showTypeChart('${t}')">${t}<span class="mx">${l}</span></span>`;
const dbs = t => `<span class="dbs" style="background:${TC[t] || '#888'}; cursor:pointer;" onclick="showTypeChart('${t}')">${t}</span>`;

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

function multAtkVsTypes(atk, types) { 
    return types.reduce((m, d) => m * (EFF[atk][d] ?? 1), 1); 
}

function spriteImg(p, cls = '') { 
    const b64 = SPRITES[String(p.id)] || ''; 
    return b64 ? `<img class="${cls}" src="data:image/png;base64,${b64}" alt="${p.name}">` : '?'; 
}

// --- ΝΕΟ: TYPE CHART MODAL ---
function showTypeChart(type) {
    let overlay = document.getElementById('typeModalOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'typeModalOverlay';
        overlay.style.cssText = 'display:flex; position:fixed; inset:0; z-index:10000; background:rgba(0,0,0,0.85); backdrop-filter:blur(5px); align-items:center; justify-content:center; padding:20px;';
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
        document.body.appendChild(overlay);
    }

    // Υπολογισμός Επιθετικών (Offense)
    const offDouble = AT.filter(t => (EFF[type][t] ?? 1) === 2);
    const offHalf = AT.filter(t => (EFF[type][t] ?? 1) === 0.5);
    const offZero = AT.filter(t => (EFF[type][t] ?? 1) === 0);

    // Υπολογισμός Αμυντικών (Defense)
    const defDouble = AT.filter(t => (EFF[t][type] ?? 1) === 2);
    const defHalf = AT.filter(t => (EFF[t][type] ?? 1) === 0.5);
    const defZero = AT.filter(t => (EFF[t][type] ?? 1) === 0);

    const formatList = list => list.length ? list.map(t => tb(t)).join(' ') : '<span style="color:var(--dim); font-size:11px;">None</span>';

    overlay.innerHTML = `
        <div style="background:var(--surf); border:2px solid ${TC[type]}; border-radius:12px; width:100%; max-width:420px; padding:20px; position:relative; box-shadow:0 15px 40px rgba(0,0,0,0.6);">
            <button onclick="document.getElementById('typeModalOverlay').style.display='none'" style="position:absolute; top:12px; right:12px; background:var(--surf2); border:1px solid var(--brd); color:var(--txt); border-radius:50%; width:30px; height:30px; cursor:pointer; font-weight:bold;">✕</button>
            
            <h3 style="margin-bottom:15px; font-family:'Press Start 2P',monospace; font-size:16px; text-transform:uppercase; color:${TC[type]}; text-shadow:0 0 10px ${TC[type]}88;">${type}</h3>
            
            <div style="margin-bottom: 18px; background:var(--surf2); padding:10px; border-radius:8px; border:1px solid var(--brd);">
                <strong style="color:#ff6b6b; font-size:12px; display:block; margin-bottom:8px;">⚔️ ATTACKING (Does damage to)</strong>
                <div style="font-size:12px; margin-bottom:6px; display:flex; align-items:center; gap:8px;"><b style="min-width:90px;">x2 (Super):</b> <div>${formatList(offDouble)}</div></div>
                <div style="font-size:12px; margin-bottom:6px; display:flex; align-items:center; gap:8px;"><b style="min-width:90px; color:var(--dim)">x0.5 (Not Very):</b> <div>${formatList(offHalf)}</div></div>
                <div style="font-size:12px; display:flex; align-items:center; gap:8px;"><b style="min-width:90px; color:var(--dim)">x0 (No Effect):</b> <div>${formatList(offZero)}</div></div>
            </div>

            <div style="background:var(--surf2); padding:10px; border-radius:8px; border:1px solid var(--brd);">
                <strong style="color:#63d471; font-size:12px; display:block; margin-bottom:8px;">🛡️ DEFENDING (Takes damage from)</strong>
                <div style="font-size:12px; margin-bottom:6px; display:flex; align-items:center; gap:8px;"><b style="min-width:90px; color:#ff6b6b">x2 (Weak):</b> <div>${formatList(defDouble)}</div></div>
                <div style="font-size:12px; margin-bottom:6px; display:flex; align-items:center; gap:8px;"><b style="min-width:90px;">x0.5 (Resist):</b> <div>${formatList(defHalf)}</div></div>
                <div style="font-size:12px; display:flex; align-items:center; gap:8px;"><b style="min-width:90px;">x0 (Immune):</b> <div>${formatList(defZero)}</div></div>
            </div>
            
            <p style="text-align:center; font-size:10px; color:var(--dim); margin-top:12px; font-weight:bold;">💡 Tip: Click on any type above to navigate!</p>
        </div>
    `;
    overlay.style.display = 'flex';
}
