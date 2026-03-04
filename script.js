// ===================
// PLAYER VARIABLES
// ===================

let health = 100;
let temperature = 100;
let aggression = 0;
let biotokens = 0;
let quadrant = 1;
let suit = "Survey Suit";
let weapon = "Thermal Cutter";

// Load saved data
function loadGame() {
  if (localStorage.getItem("cyclersave")) {
    const save = JSON.parse(localStorage.getItem("cyclersave"));
    health = save.health;
    temperature = save.temperature;
    aggression = save.aggression;
    biotokens = save.biotokens;
  }
  updateStats();
}

// Save game
function saveGame() {
  localStorage.setItem("cyclersave", JSON.stringify({
    health,
    temperature,
    aggression,
    biotokens
  }));
}

// ===================
// UI UPDATES
// ===================

function updateStats() {
  document.getElementById("healthStat").textContent = health;
  document.getElementById("tempStat").textContent = temperature;
  document.getElementById("aggroStat").textContent = aggression;
  document.getElementById("bioStat").textContent = biotokens;
}

function setText(text) {
  document.getElementById("eventText").textContent = text;
}

// ===================
// GAME ACTIONS
// ===================

function travel() {
  let roll = Math.random();

  if (roll < 0.3) {
    setText("Snowstorm detected. Temperature dropping.");
    temperature -= 20;
  } else if (roll < 0.6) {
    setText("Movement under the snow.");
    if (aggression > 3) {
      setText("Hostile encounter. You are overwhelmed.");
      die();
      return;
    } else {
      setText("Creeper observed. It retreats.");
    }
  } else {
    setText("New mineral deposit found.");
    biotokens += 5;
  }

  checkStatus();
}

function observe() {
  setText("You remain still. Environmental data logged.");
  biotokens += 2;
  saveGame();
  updateStats();
}

function goHome() {
  setText("Returning to base. Data secured.");
  saveGame();
}

// ===================
// STATUS CHECK
// ===================

function checkStatus() {
  if (temperature <= 0 || health <= 0) {
    die();
  }
  updateStats();
  saveGame();
}

// ===================
// DEATH + CYCLER
// ===================

function die() {
  document.getElementById("cyclerOverlay").classList.remove("hidden");

  let logText = `
CYCLER LOG ENTRY

Last Ocular Connection: Quadrant ${quadrant}
Loadout: ${suit} / ${weapon}
Vital Drop Cause: Unknown
Aggression Index: ${aggression}

Cycling new instance...
  `;

  document.getElementById("cyclerLog").textContent = logText;
}

function respawn() {
  health = 100;
  temperature = 100;
  document.getElementById("cyclerOverlay").classList.add("hidden");
  setText("Instance activated. Continue mapping.");
  updateStats();
  saveGame();
}

// ===================
// START GAME
// ===================

loadGame();
setText("Instance activated. Objective: Map surrounding area.");
