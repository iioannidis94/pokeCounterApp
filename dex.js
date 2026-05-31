// --- dex.js : Κεντρικό Pokédex & Αναζήτηση ---

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

document.getElementById('search').addEventListener('input', e => { q = e.target.value; render() });
render();