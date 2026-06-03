// --- team-io.js : Showdown Parser & Import/Export ---

function exportTeam() { 
    const filled = team.filter(s => s.pokemonId); 
    const payload = { version: 1, exportedAt: new Date().toISOString(), team: filled }; 
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); 
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = `pokedex-team-${new Date().toISOString().slice(0, 10)}.json`; 
    a.click(); 
    setTimeout(() => URL.revokeObjectURL(a.href), 1000); 
    alert(`Exported ${filled.length} Pokémon to JSON.`); 
}

function importTeamFile(file) { 
    if (!file) return; 
    const reader = new FileReader(); 
    reader.onload = () => { 
        try { 
            const data = JSON.parse(reader.result); 
            const raw = Array.isArray(data) ? data : data.team; 
            if (!Array.isArray(raw)) throw new Error('No team array found'); 
            team = Array.from({ length: TEAM_SIZE }, (_, i) => normalizeSlot(raw[i])); 
            saveTeam(); 
            if (typeof renderTeamSlots === 'function') renderTeamSlots(); 
            alert('Team imported successfully.') 
        } catch (e) { 
            alert('Could not import this team JSON.') 
        } 
    }; 
    reader.readAsText(file) 
}

const SD_STAT_MAP = {
    hp: 'HP', atk: 'ATK', def: 'DEF',
    spa: 'SPATK', spd: 'SPDEF', spe: 'SPD',
    'special-attack': 'SPATK', 'special-defense': 'SPDEF', speed: 'SPD'
};

// --- Ενισχυμένος Showdown Parser ---
function parseShowdownBlock(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length);
    if (!lines.length) return null;

    const slot = EMPTY_SLOT();
    const moveNames = [];

    // 1. Διάβασμα Ονόματος και Item
    const firstLine = lines[0];
    const atIdx = firstLine.indexOf('@'); // Πιο forgiving, χωρίς να απαιτεί κενά γύρω από το @
    let rawName = atIdx !== -1 ? firstLine.slice(0, atIdx).trim() : firstLine.trim();
    if (atIdx !== -1) {
        slot.item = firstLine.slice(atIdx + 1).trim();
    }

    rawName = rawName.replace(/\s*\((M|F)\)\s*$/, '').trim(); // Αφαίρεση (M) / (F)

    const nicknameMatch = rawName.match(/^.+\((.+)\)\s*$/);
    if (nicknameMatch) rawName = nicknameMatch[1].trim();

    const normalised = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    let pokemon = POKE.find(p => p.name === normalised)
        || POKE.find(p => p.name.startsWith(normalised))
        || POKE.find(p => normalised.startsWith(p.name))
        || POKE.find(p => p.name.replace(/-/g, '') === normalised.replace(/-/g, ''));

    if (!pokemon) return null;   
    slot.pokemonId = pokemon.id;

    // 2. Διάβασμα υπολοίπων γραμμών
    for (let li = 1; li < lines.length; li++) {
        const line = lines[li];

        // LEVEL: Πιάνει το "Level: 50" ή "Level:50"
        const lvMatch = line.match(/^Level:\s*(\d+)/i);
        if (lvMatch) { 
            slot.level = parseInt(lvMatch[1], 10); 
            continue; 
        }

        // NATURE: Πιάνει το "Timid Nature"
        const natMatch = line.match(/^([a-zA-Z]+)\s+nature/i);
        if (natMatch) {
            const nat = natMatch[1].trim();
            // Μετατροπή στο σωστό format (π.χ. "Timid")
            slot.nature = nat.charAt(0).toUpperCase() + nat.slice(1).toLowerCase();
            continue;
        }


// ABILITY: Πιάνει το "Ability: Swift Swim"
        const abilMatch = line.match(/^Ability:\s*(.+)/i);
        if (abilMatch) { 
            // Μετατροπή σε πεζά και αντικατάσταση κενών με παύλες για να ταιριάζει με το data.js
            slot.ability = abilMatch[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'); 
            continue; 
        }

        // EVs: Πιάνει το "EVs: 252 SpA / 4 SpD / 252 Spe"
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

        // IVs: Πιάνει το "IVs: 0 Atk"
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

        // MOVES: Πιάνει το "- Thunderbolt"
        if (line.startsWith('- ')) {
            moveNames.push(line.slice(2).trim());
            continue;
        }
    }

    // Καταχώρηση κινήσεων
    slot.moveNames = Array.from({ length: 4 }, (_, i) => moveNames[i] || '');
    slot.moveNames.forEach((mn, i) => {
        if (!mn) return;
        const key = mn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const info = typeof MOVE_INFO !== 'undefined' ? (MOVE_INFO[mn] || MOVE_INFO[key] || {}) : {};
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
    if (typeof renderTeamSlots === 'function') renderTeamSlots();
    return added;
}

// Ενσωμάτωση του Modal Popup για Showdown
(function injectShowdownModal() {
    const overlay = document.createElement('div');
    overlay.id = 'sdImportOverlay';
    overlay.style.cssText = [
        'display:none', 'position:fixed', 'inset:0', 'z-index:9999',
        'background:rgba(0,0,0,.75)', 'backdrop-filter:blur(4px)',
        'align-items:center', 'justify-content:center', 'padding:16px'
    ].join(';');


    overlay.innerHTML = `
      <div style="background:#13132a; border:1.5px solid #252545; border-radius:14px; width:100%; max-width:560px; padding:24px; position:relative; font-family:'Nunito',sans-serif; color:#e8e8ff;">
        <button id="sdClose" style="position:absolute; top:14px; right:14px; background:#1a1a30; border:1px solid #252545; color:#7070aa; border-radius:50%; width:28px; height:28px; cursor:pointer; font-size:15px; display:flex; align-items:center; justify-content:center;" title="Close">✕</button>
        <h3 style="font-family:'Press Start 2P',monospace; font-size:11px; color:#ffcc00; margin-bottom:4px; letter-spacing:1px;">📋 PASTE FROM SHOWDOWN</h3>
        <p style="font-size:11px; color:#7070aa; margin-bottom:14px;">Paste one or more Pokémon in Showdown export format. Multiple Pokémon should be separated by a blank line.</p>
        <textarea id="sdPasteArea" rows="12" spellcheck="false" style="width:100%; background:#1a1a30; border:1.5px solid #252545; border-radius:8px; color:#e8e8ff; font-family:monospace; font-size:12px; padding:10px 12px; outline:none; resize:vertical; line-height:1.5;" placeholder="Pikachu @ Light Ball\nAbility: Static\nLevel: 50\nTimid Nature\nEVs: 252 SpA / 4 SpD / 252 Spe\n- Thunderbolt\n- Volt Switch\n- Surf\n- Grass Knot"></textarea>
        <div style="display:flex; gap:10px; margin-top:12px; align-items:center;">
          <button id="sdImportBtn" style="padding:9px 22px; border-radius:50px; border:none; cursor:pointer; background:#ffcc00; color:#0d0d1a; font-family:'Nunito',sans-serif; font-size:13px; font-weight:900; transition:filter .15s;">⬇️ Import to Team</button>
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
        if (!parsed.length) { alert('Could not recognise any Pokémon in the pasted text. Check your spelling or formatting.'); return; }
        const added = importFromShowdown(parsed);
        const msg = document.getElementById('sdMsg');
        if (added === 0) { alert('Your team is full! Clear a slot first.'); return; }
        msg.textContent = `✓ Added ${added} Pokémon!`;
        msg.style.opacity = '1';
        setTimeout(() => { msg.style.opacity = '0'; }, 2500);
        setTimeout(closeModal, 1400);
    });

    window._openShowdownModal = openModal;
})();

    // --- ΝΕΟ: SHAREABLE TEAM LINKS ---

// 1. Δημιουργία και αντιγραφή του Share Link
function generateShareLink() {
    const filled = team.filter(s => s.pokemonId);
    if (!filled.length) { alert('Your team is empty! Add some Pokémon before sharing.'); return; }
    
    try {
        const json = JSON.stringify(filled);
        const b64 = btoa(encodeURIComponent(json)); // Μετατροπή σε Base64, ασφαλές για URL
        const url = window.location.origin + window.location.pathname + '#team=' + b64;
        
        navigator.clipboard.writeText(url).then(() => {
            alert('🔗 Share Link copied to clipboard!\n\nSend this link to your friends, and they will instantly see your exact team setup.');
        }).catch(() => {
            // Αν ο browser μπλοκάρει το clipboard
            prompt('Copy this link to share your team:', url);
        });
    } catch (e) {
        alert('An error occurred while generating the link.');
    }
}

// 2. Έλεγχος κατά το άνοιγμα της σελίδας: Αν υπάρχει link, φόρτωσε την ομάδα
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash.startsWith('#team=')) {
        try {
            const b64 = window.location.hash.slice(6); // Παίρνει ότι είναι μετά το "#team="
            const json = decodeURIComponent(atob(b64));
            const parsed = JSON.parse(json);
            
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Δημιουργούμε ένα νέο "Tab" για την εισαγόμενη ομάδα
                const newTeamName = "Shared Team " + Math.floor(Math.random() * 1000);
                allData.teams.push({ name: newTeamName, slots: Array.from({ length: TEAM_SIZE }, () => EMPTY_SLOT()) });
                currentTeamIndex = allData.teams.length - 1;
                team = allData.teams[currentTeamIndex].slots;
                
                // Γεμίζουμε τα slots
                parsed.forEach((slotData, i) => {
                    if (i < TEAM_SIZE) team[i] = normalizeSlot(slotData);
                });
                
                saveTeam();
                
                // Καθαρίζουμε το URL για να μην ξαναφορτωθεί στο επόμενο refresh
                window.history.replaceState(null, null, window.location.pathname);
                
                // Ανοίγουμε το Team Builder αυτόματα
                setTimeout(() => {
                    if (typeof openTeam === 'function') openTeam();
                    if (typeof updateTeamDropdown === 'function') updateTeamDropdown();
                    if (typeof renderTeamSlots === 'function') renderTeamSlots();
                }, 300);
            }
        } catch (e) {
            console.error('Link Error:', e);
            alert('The shared team link is invalid or corrupted.');
            window.history.replaceState(null, null, window.location.pathname);
        }
    }
});

// 3. Δημιουργία του Κουμπιού "Share Link" δυναμικά
(function injectShareButton() {
    window.addEventListener('DOMContentLoaded', () => {
        const exportBtn = document.getElementById('teamExport');
        if (!exportBtn) return;
        
        const shareBtn = document.createElement('button');
        shareBtn.className = 'teamTool';
        shareBtn.type = 'button';
        shareBtn.id = 'shareLinkBtn';
        shareBtn.innerHTML = '🔗 Share Link';
        shareBtn.style.cssText = 'border-color:#b197fc; color:#b197fc; background:rgba(177,151,252,0.1); margin-right: 5px;';
        
        shareBtn.addEventListener('click', generateShareLink);
        
        // Το βάζουμε δίπλα στο κουμπί Export
        exportBtn.parentNode.insertBefore(shareBtn, exportBtn);
    });
})();
