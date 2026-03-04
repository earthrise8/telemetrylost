// Persistent globals (kept between deaths)
const PERSIST_KEY = 'ocular_persist_v1';
let persist = {
  aggression: 0,
  bankedBiotokens: 0,
  deaths: 0,
  creepersKilled: 0,
  unlocked: { quadrants: 3, tunnel: false }
};

// Instance state (reset on respawn)
let state = {
  health: 100,
  temperature: 100,
  aggressionGain: 0,
  runBiotokens: 0,
  suit: null,
  tool: null,
  quadrant: 0,
  mapped: new Set()
};

const SUITS = {
  Survey: { tempResist: 0, hp: 0 },
  Insulated: { tempResist: 0.25, hp: -5 },
  Reinforced: { tempResist: -0.05, hp: 20 }
};

const TOOLS = {
  'Thermal Cutter': { scanBonus: 1.2, combat: 0.9 },
  'Kinetic Sidearm': { scanBonus: 1.0, combat: 1.1 },
  'Sonic Deterrent': { scanBonus: 0.9, combat: 0.8, deter: 0.6 }
};

const QUADRANTS = ['Glacial Shelf','Abyssic Ridge','Icy Flats','Crystal Scar','Fog Basin','Sulfur Dunes'];

// Event pools
function rollEvent(qIndex){
  // base weights
  const pool = [];
  pool.push('hazard');
  pool.push('scan');
  pool.push('creeper');
  // tier up with quadrant index
  if(qIndex >= 3) pool.push('rare');
  return pool[Math.floor(Math.random()*pool.length)];
}

// --- Persistence ---
function loadPersist(){
  const raw = localStorage.getItem(PERSIST_KEY);
  if(raw) Object.assign(persist, JSON.parse(raw));
  document.getElementById('bankedBio').textContent = persist.bankedBiotokens;
  document.getElementById('deathCount').textContent = persist.deaths;
}

function savePersist(){
  localStorage.setItem(PERSIST_KEY, JSON.stringify(persist));
}

// --- UI helpers ---
function setText(html){ document.getElementById('eventText').textContent = html; }
function updateStats(){
  document.getElementById('healthStat').textContent = Math.max(0, Math.round(state.health));
  document.getElementById('tempStat').textContent = Math.max(0, Math.round(state.temperature));
  document.getElementById('aggroStat').textContent = Math.round(persist.aggression + state.aggressionGain);
  document.getElementById('bioStat').textContent = Math.round(state.runBiotokens);
}

// --- Setup UI ---
function makeChoices(){
  const suits = document.getElementById('suitChoices'); suits.innerHTML='';
  Object.keys(SUITS).forEach(s=>{
    const b=document.createElement('button'); b.textContent=s; b.onclick=()=>selectSuit(s,b);
    suits.appendChild(b);
  });
  const tools = document.getElementById('toolChoices'); tools.innerHTML='';
  Object.keys(TOOLS).forEach(t=>{
    const b=document.createElement('button'); b.textContent=t; b.onclick=()=>selectTool(t,b);
    tools.appendChild(b);
  });
  document.getElementById('startBtn').onclick=startInstance;
}

function selectSuit(name, btn){ state.suit=name; Array.from(btn.parentNode.children).forEach(x=>x.classList.remove('selected')); btn.classList.add('selected'); }
function selectTool(name, btn){ state.tool=name; Array.from(btn.parentNode.children).forEach(x=>x.classList.remove('selected')); btn.classList.add('selected'); }

function startInstance(){
  if(!state.suit || !state.tool) return setText('Select suit and tool first.');
  // apply suit HP modifier
  state.health = 100 + (SUITS[state.suit].hp||0);
  state.temperature = 100;
  state.runBiotokens = 0;
  state.aggressionGain = 0;
  state.quadrant = 0;
  state.mapped = new Set();
  document.getElementById('loadout').classList.add('hidden');
  document.getElementById('actions').classList.remove('hidden');
  buildQuadrantButtons();
  buildActionButtons();
  setText('Instance deployed. Choose a quadrant to travel to.');
  updateStats();
}

function buildQuadrantButtons(){
  const cb=document.getElementById('quadrantButtons'); cb.innerHTML='';
  for(let i=0;i<persist.unlocked.quadrants;i++){
    const b=document.createElement('button'); b.textContent=QUADRANTS[i]; b.onclick=()=>travelTo(i);
    cb.appendChild(b);
  }
}

function buildActionButtons(){
  const ab=document.getElementById('actionButtons'); ab.innerHTML='';
  ['Observe','Scan','Evade','Engage','Return'].forEach(a=>{
    const b=document.createElement('button'); b.textContent=a; b.onclick=()=>handleAction(a.toLowerCase()); ab.appendChild(b);
  });
}

// --- Actions and event resolution ---
function travelTo(index){
  state.quadrant=index;
  state.mapped.add(index);
  const ev=rollEvent(index);
  if(ev==='hazard') hazardEvent(index);
  else if(ev==='scan') scanEvent(index);
  else if(ev==='creeper') creeperEncounter(index);
  else rareEvent(index);
  postTick();
}

function handleAction(action){
  if(action==='observe'){ observeAction(); }
  else if(action==='scan'){ scanEvent(state.quadrant); }
  else if(action==='evade'){ evadeAction(); }
  else if(action==='engage'){ engageAction(); }
  else if(action==='return'){ returnToBase(); }
}

function hazardEvent(q){
  const baseDamage = 15 + q*5;
  const tempLoss = 10 + q*5 - (SUITS[state.suit].tempResist||0)*30;
  state.health -= baseDamage * (Math.random()*0.6+0.7);
  state.temperature -= tempLoss*(Math.random()*0.8+0.6);
  setText(`Environmental hazard in ${QUADRANTS[q]}. Systems degraded.`);
}

function scanEvent(q){
  const tool = TOOLS[state.tool];
  const gain = Math.round(3 * (tool.scanBonus||1) * (1 + q*0.2));
  state.runBiotokens += gain;
  setText(`Scan successful in ${QUADRANTS[q]}. Biotokens +${gain}.`);
}

function creeperEncounter(q){
  // chance of aggressive response influenced by persist.aggression
  const base = 0.4 + persist.aggression*0.06;
  if(Math.random() < base){
    // hostile
    setText(`A native creeper attacks in ${QUADRANTS[q]}! Choose: Evade or Engage.`);
    // store encounter state
    state.lastEncounter = { type:'creeper', q };
  } else {
    setText(`A native entity observed in ${QUADRANTS[q]}. It watches cautiously.`);
    // observation reduces aggression
    persist.aggression = Math.max(0, persist.aggression - 0.5);
  }
}

function rareEvent(q){
  const gain = 10 + Math.round(q*3);
  state.runBiotokens += gain;
  setText(`Unusual find: intact bio-structure. Biotokens +${gain}.`);
}

function observeAction(){
  if(state.lastEncounter && state.lastEncounter.type==='creeper'){
    setText('You observe the native, collect behavioral data. Aggression decreases.');
    persist.aggression = Math.max(0, persist.aggression - 1);
    state.runBiotokens += 2;
    state.lastEncounter = null;
  } else {
    setText('Careful observation of the environment.');
    state.runBiotokens += 1;
  }
}

function evadeAction(){
  if(state.lastEncounter && state.lastEncounter.type==='creeper'){
    const chance = 0.7 - (persist.aggression*0.02) + (SUITS[state.suit].tempResist||0)*0.1;
    if(Math.random() < chance){ setText('Evaded contact successfully.'); persist.aggression = Math.max(0, persist.aggression - 0.2); }
    else { setText('Evade failed; you take damage.'); state.health -= 20; }
    state.lastEncounter = null;
  } else { setText('No immediate threat to evade.'); }
}

function engageAction(){
  if(state.lastEncounter && state.lastEncounter.type==='creeper'){
    const tool = TOOLS[state.tool];
    const chanceKill = (tool.combat||1) * (0.5 + Math.random()*0.5);
    if(Math.random() < chanceKill){
      setText('Engagement succeeded. Creeper neutralized.');
      persist.creepersKilled += 1; persist.aggression += 1.5; state.runBiotokens += 3; state.lastEncounter=null;
    } else {
      setText('Engagement failed; you were injured escaping.'); state.health -= 30; persist.aggression += 0.8; state.lastEncounter=null;
    }
  } else { setText('No target to engage.'); }
}

function returnToBase(){
  persist.bankedBiotokens += Math.round(state.runBiotokens);
  state.runBiotokens = 0;
  // unlock rule: mapping all unlocked quadrants opens tunnel
  state.mapped.forEach(i=>persist.unlocked[i]=true);
  if(persist.unlocked.quadrants === QUADRANTS.length) persist.unlocked.tunnel = true;
  savePersist();
  setText('Returned to base. Biotokens banked. Instance cycled.');
  // cycle instance without counting as death
  resetInstance(false);
}

function postTick(){
  // natural temp decay
  state.temperature -= 0.5;
  // check death
  if(state.health <= 0 || state.temperature <= 0){
    handleDeath(); return;
  }
  updateStats();
}

// --- Death and respawn ---
function handleDeath(){
  persist.deaths += 1;
  savePersist();
  document.getElementById('cyclerOverlay').classList.remove('hidden');
  const cause = state.temperature <=0 ? 'Hypothermia' : (state.health<=0 ? 'Traumatic Injury' : 'Unknown');
  const log = `CYCLER LOG ENTRY\n\nLast Ocular Connection: ${QUADRANTS[state.quadrant] || 'Unknown'}\nLoadout: ${state.suit} / ${state.tool}\nVital Drop Cause: ${cause}\nAggression Index: ${Math.round(persist.aggression)}\nCreepers Killed: ${persist.creepersKilled}\n\nCycling new instance...`;
  document.getElementById('cyclerLog').textContent = log;
  document.getElementById('cycleBtn').onclick = respawn;
  updateStats();
}

function respawn(){ resetInstance(true); }

function resetInstance(asDeath){
  // preserve persistent values
  state = { health:100, temperature:100, aggressionGain:0, runBiotokens:0, suit:null, tool:null, quadrant:0, mapped:new Set() };
  document.getElementById('cyclerOverlay').classList.add('hidden');
  document.getElementById('loadout').classList.remove('hidden');
  document.getElementById('actions').classList.add('hidden');
  makeChoices();
  loadPersist();
  setText(asDeath? 'New instance deployed. Learn and adapt.' : 'Instance ready. Configure loadout.');
  updateStats();
}

// --- Init ---
loadPersist();
makeChoices();
setText('Welcome to Last Ocular Connection. Configure suit and tool.');
updateStats();
