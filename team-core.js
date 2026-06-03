
// --- team-core.js : Διαχείριση State & Μνήμης Ομάδας ---

const TEAM_KEY = 'pokedex_my_team_v1';
const MULTI_TEAM_KEY = 'pokedex_multiteam_v1';
const TEAM_SIZE = 50;
const TEAM_STATS = ['HP', 'ATK', 'DEF', 'SPATK', 'SPDEF', 'SPD'];
const TEAM_NATURES = ['Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty', 'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax', 'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive', 'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash', 'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'];
const HELD_ITEMS = ['Leftovers', 'Choice Band', 'Choice Scarf', 'Choice Specs', 'Life Orb', 'Focus Sash', 'Assault Vest', 'Heavy-Duty Boots', 'Eviolite', 'Rocky Helmet', 'Black Sludge', 'Sitrus Berry', 'Lum Berry', 'Weakness Policy', 'Expert Belt', 'Air Balloon', 'Throat Spray', 'Loaded Dice', 'Covert Cloak', 'Clear Amulet', 'Booster Energy', 'Terrain Extender', 'Light Clay', 'Damp Rock', 'Heat Rock', 'Icy Rock', 'Smooth Rock', 'Safety Goggles', 'Power Herb', 'Mental Herb', 'White Herb', 'Red Card', 'Eject Button', 'Eject Pack', 'Mirror Herb', 'Punching Glove', 'Muscle Band', 'Wise Glasses', 'Shell Bell', 'Metronome', 'Flame Orb', 'Toxic Orb'];
const TEAM_NATURE_EFFECTS = { Lonely: ['ATK', 'DEF'], Brave: ['ATK', 'SPD'], Adamant: ['ATK', 'SPATK'], Naughty: ['ATK', 'SPDEF'], Bold: ['DEF', 'ATK'], Relaxed: ['DEF', 'SPD'], Impish: ['DEF', 'SPATK'], Lax: ['DEF', 'SPDEF'], Timid: ['SPD', 'ATK'], Hasty: ['SPD', 'DEF'], Jolly: ['SPD', 'SPATK'], Naive: ['SPD', 'SPDEF'], Modest: ['SPATK', 'ATK'], Mild: ['SPATK', 'DEF'], Quiet: ['SPATK', 'SPD'], Rash: ['SPATK', 'SPDEF'], Calm: ['SPDEF', 'ATK'], Gentle: ['SPDEF', 'DEF'], Sassy: ['SPDEF', 'SPD'], Careful: ['SPDEF', 'SPATK'] };

// Δομή ενός κενού Slot (Πλέον συμπεριλαμβάνει το Level!)
const EMPTY_SLOT = () => ({ pokemonId: null, level: 100, nature: '', ability: '', item: '', calc: false, moveNames: ['', '', '', ''], moves: ['', '', '', ''], moveCats: ['', '', '', ''], iv: { HP: '', ATK: '', DEF: '', SPATK: '', SPDEF: '', SPD: '' }, ev: { HP: '', ATK: '', DEF: '', SPATK: '', SPDEF: '', SPD: '' } });

// Κανονικοποίηση δεδομένων slot (αν λείπουν πεδία από παλιά saves)
function normalizeSlot(slot) { 
    const base = EMPTY_SLOT(); 
    if (!slot || typeof slot !== 'object') return base; 
    base.pokemonId = slot.pokemonId ? Number(slot.pokemonId) : null; 
    base.level = slot.level !== undefined ? Number(slot.level) : 100; 
    base.nature = slot.nature ? String(slot.nature) : ''; 
    base.ability = slot.ability ? String(slot.ability) : ''; 
    base.item = slot.item ? String(slot.item) : ''; 
    base.calc = !!slot.calc; 
    base.moveNames = Array.from({ length: 4 }, (_, i) => slot.moveNames && slot.moveNames[i] ? String(slot.moveNames[i]) : ''); 
    base.moves = Array.from({ length: 4 }, (_, i) => slot.moves && slot.moves[i] ? String(slot.moves[i]) : ''); 
    base.moveCats = Array.from({ length: 4 }, (_, i) => slot.moveCats && slot.moveCats[i] ? String(slot.moveCats[i]) : ''); 
    TEAM_STATS.forEach(st => { base.iv[st] = slot.iv && slot.iv[st] !== undefined ? String(slot.iv[st]) : ''; base.ev[st] = slot.ev && slot.ev[st] !== undefined ? String(slot.ev[st]) : '' }); 
    return base; 
}

// --- Global State Variables ---
let allData, teamQuery = '';
let currentTeamIndex, team;

// Φόρτωση δεδομένων από LocalStorage
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

// Εκκίνηση State
function initTeamState() {
    allData = loadAllTeams();
    currentTeamIndex = allData.activeIndex;
    team = allData.teams[currentTeamIndex].slots;
}

// Αποθήκευση στο LocalStorage
function saveTeam() {
    allData.teams[currentTeamIndex].slots = team;
    allData.activeIndex = currentTeamIndex;
    localStorage.setItem(MULTI_TEAM_KEY, JSON.stringify(allData));
}

initTeamState();
