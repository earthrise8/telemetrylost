document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const devResetBtn = document.getElementById('dev-reset-btn');
    const mainWrapper = document.getElementById('main-wrapper');
    const ocularInterface = document.getElementById('ocular-interface');
    const eventText = document.getElementById('event-text');
    const characterNameEl = document.getElementById('character-name');
    const healthEl = document.getElementById('health');
    const temperatureEl = document.getElementById('temperature');
    const kCalsEl = document.getElementById('kcals');
    const aggressionEl = document.getElementById('aggression');
    const timeEl = document.getElementById('time');
    const playerSuitEl = document.getElementById('player-suit');
    const playerToolEl = document.getElementById('player-tool');
    const backpackEl = document.getElementById('backpack-items');
    const actionButtons = document.getElementById('action-buttons');
    const mapContainer = document.getElementById('map-container');
    const mapGrid = document.getElementById('map-grid');
    const chatLog = document.getElementById('chat-log');
    const cyclerOverlay = document.getElementById('cyclerOverlay');
    const cyclerIdLogEl = document.getElementById('cycler-id-log');
    const failureCauseLogEl = document.getElementById('failure-cause-log');
    const failureCodeLogEl = document.getElementById('failure-code-log');
    const kCalsBankedLogEl = document.getElementById('kcals-banked-log');
    const cycleBtn = document.getElementById('cycleBtn');
    const storeOverlay = document.getElementById('store-overlay');
    const storeKcalsEl = document.getElementById('store-kcals');
    const storeItemsEl = document.getElementById('store-items');
    const closeStoreBtn = document.getElementById('close-store-btn');
    const setupScreen = document.getElementById('setup-screen');
    const characterNameInput = document.getElementById('character-name-input');
    const suitSelectionContainer = document.getElementById('suit-selection');
    const toolSelectionContainer = document.getElementById('tool-selection');
    const startExpeditionBtn = document.getElementById('start-expedition-btn');

    // Game State
    let player = {};
    let globalState = {};
    let playerLoadout = {};
    let currentCoords = { x: 4, y: 5 };
    let gameTime = 420;
    let mapState = { scale: 1, x: 0, y: 0, isPanning: false, startX: 0, startY: 0 };

    const initialGlobalState = {
        bankedkCals: 500,
        deaths: 0,
        exploredTiles: ['4,5'],
        ownedItems: ['Survey', 'Thermal Cutter'],
    };

    const failureCodes = { "Starvation": "FC-STV-001", "Vital Signs Lost": "FC-VSL-002", "Thermal Failure": "FC-THF-003", "Unknown": "FC-UNX-000" };
    const poiMap = { 'landingZone': { x: 4, y: 5, name: 'Base' }, 'glacier': { x: 4, y: 4, name: 'Glacier' }, 'iceFields': { x: 3, y: 5, name: 'Fields' }, 'rockyOutcrop': { x: 5, y: 5, name: 'Outcrop' }, 'crevasse': { x: 4, y: 6, name: 'Crevasse' }, 'thermalVents': { x: 3, y: 4, name: 'Vents' }, 'crystalCave': { x: 1, y: 8, name: 'Cave' } };
    const itemData = {
        'Survey': { type: 'suit', cost: 0, desc: 'Health: 100, Temp: 100. Standard issue.' },
        'Insulated': { type: 'suit', cost: 800, desc: 'Health: 100, Temp: 150. Better for cold zones.' },
        'Reinforced': { type: 'suit', cost: 800, desc: 'Health: 150, Temp: 100. Offers more protection.' },
        'Thermal Cutter': { type: 'tool', cost: 0, desc: 'Standard issue tool for obstacles.' },
        'Kinetic Sidearm': { type: 'tool', cost: 1200, desc: 'A reliable projectile weapon.' },
        'Sonic Deterrent': { type: 'tool', cost: 1000, desc: 'Deters aggressive fauna.' },
        'Geological Scanner': { type: 'sample', sell: 200, desc: 'Data on rock composition.' },
        'Ice Core Sample': { type: 'sample', sell: 150, desc: 'A pristine ice core.' },
        'Alien Microbe': { type: 'sample', sell: 500, desc: 'A potentially groundbreaking discovery.' }
    };
    const loadoutModifiers = { suits: { 'Survey': { health: 100, temperature: 100 }, 'Insulated': { health: 100, temperature: 150 }, 'Reinforced': { health: 150, temperature: 100 } }, tools: { 'Thermal Cutter': {}, 'Kinetic Sidearm': {}, 'Sonic Deterrent': {} } };
    const events = {
        landingZone: [{ text: "Base is quiet. All samples and kCal reserves have been banked.", actions: [{ label: "Requisition Gear", func: openStore }] }],
        glacier: [{ text: "A massive, creaking glacier stretches before you.", actions: [{ label: "Scan for anomalies", func: scanArea }] }],
        iceFields: [{ text: "Vast, flat ice fields stretch to the horizon.", actions: [{ label: "Scan the area", func: scanArea }] }],
        crevasse: [{ text: "A deep, dark crevasse splits the ice sheet.", actions: [{ label: "Peer into the darkness", func: scanArea }] }],
        thermalVents: [{ text: "Plumes of steam rise from cracks in the ice.", actions: [{ label: "Approach Vents", func: approachVents }] }],
        crystalCave: [{ text: "A vast cavern of shimmering crystals.", actions: [{ label: "Collect Crystal Sample", func: collectCrystalSample }] }],
        wasteland: [{ text: "A vast, snowy wasteland stretches in all directions.", actions: [{ label: "Scan Area", func: scanArea }] }]
    };
    const missions = [{ id: "findCave", sender: "Mission Control", message: "Anomalous energy readings from (1, 8). Investigate.", trigger: () => globalState.deaths > 0, isComplete: () => globalState.exploredTiles.includes('1,8') }];

    function getPoiKeyByCoords(x, y) { return Object.keys(poiMap).find(key => poiMap[key].x === x && poiMap[key].y === y); }

    // --- Core Functions ---
    function init() {
        loadGlobalState();
        setupEventListeners();
        showSetupScreen();
        updateMap();
    }

    function resetGameData() {
        if (confirm("Are you sure? This will wipe all local progress.")) {
            localStorage.removeItem('telemetryLostGlobalState');
            location.reload();
        }
    }

    function loadGlobalState() {
        const savedState = localStorage.getItem('telemetryLostGlobalState');
        globalState = savedState ? JSON.parse(savedState) : JSON.parse(JSON.stringify(initialGlobalState));
        if (!globalState.exploredTiles) { globalState.exploredTiles = ['4,5']; }
    }

    function saveGlobalState() {
        localStorage.setItem('telemetryLostGlobalState', JSON.stringify(globalState));
    }

    function showSetupScreen() {
        mainWrapper.classList.add('hidden');
        cyclerOverlay.classList.add('hidden');
        storeOverlay.classList.add('hidden');
        setupScreen.classList.remove('hidden');
        characterNameInput.value = "";

        playerLoadout = {
            suit: globalState.ownedItems.includes('Survey') ? 'Survey' : null,
            tool: globalState.ownedItems.includes('Thermal Cutter') ? 'Thermal Cutter' : null,
        };

        suitSelectionContainer.innerHTML = '<h2>Choose a Suit</h2>';
        toolSelectionContainer.innerHTML = '<h2>Choose a Tool</h2>';

        Object.entries(itemData).forEach(([itemName, itemDef]) => {
            if (itemDef.type !== 'suit' && itemDef.type !== 'tool') return;
            const container = itemDef.type === 'suit' ? suitSelectionContainer : toolSelectionContainer;
            const optionDiv = document.createElement('div');
            optionDiv.className = 'loadout-option';
            const isOwned = globalState.ownedItems.includes(itemName);
            const button = document.createElement('button');
            button.className = `${itemDef.type}-btn`;
            button.dataset[itemDef.type] = itemName;
            button.textContent = itemName;
            button.disabled = !isOwned;
            if ((itemDef.type === 'suit' && playerLoadout.suit === itemName) || (itemDef.type === 'tool' && playerLoadout.tool === itemName)) {
                button.classList.add('selected');
            }
            const desc = document.createElement('div');
            desc.className = 'option-desc';
            desc.textContent = itemDef.desc + (!isOwned ? ` (Not Owned)` : ``);
            optionDiv.appendChild(button);
            optionDiv.appendChild(desc);
            container.appendChild(optionDiv);
        });
    }

    function startExpedition() {
        if (!playerLoadout.suit || !playerLoadout.tool || !characterNameInput.value) {
            alert("Please enter a Cycler ID and select an owned suit and tool.");
            return;
        }

        setupScreen.classList.add('hidden');
        mainWrapper.classList.remove('hidden');

        player = { 
            name: characterNameInput.value, 
            health: loadoutModifiers.suits[playerLoadout.suit].health, 
            temperature: loadoutModifiers.suits[playerLoadout.suit].temperature, 
            kCals: 5000, 
            aggression: 0,
            backpack: []
        };
        gameTime = 420;
        currentCoords = { x: 4, y: 5 };

        chatLog.innerHTML = '';
        addChatMessage("Mission Control", `Welcome, Cycler ${player.name}. Explore, gather data, stay alive.`);
        checkMissions();
        updateMap();
        updateStatsDisplay();
        triggerEvent();
    }

    function logEvent(text) {
        eventText.innerHTML = text;
        actionButtons.innerHTML = '';
    }

    function triggerEvent() {
        advanceTime(10);
        const poiKey = getPoiKeyByCoords(currentCoords.x, currentCoords.y);
        let eventPool = events.wasteland;
        if (poiKey && events[poiKey]) { eventPool = events[poiKey]; }
        
        const event = eventPool[Math.floor(Math.random() * eventPool.length)];

        if (poiKey === 'landingZone') {
            let bankedValue = player.kCals;
            let samplesValue = 0;
            if (player.backpack) {
                player.backpack.forEach(item => {
                    if(itemData[item] && itemData[item].sell) {
                        samplesValue += itemData[item].sell;
                    }
                });
            }
            bankedValue += samplesValue;
            globalState.bankedkCals += bankedValue;
            player.kCals = 0;
            player.backpack = [];
            saveGlobalState();
            let logMessage = `kCal and sample reserves banked. Current total: ${globalState.bankedkCals}.`;
            if (samplesValue > 0) {
                 addChatMessage("Mission Control", `Received biological and geological samples. Your account has been credited ${samplesValue} kCal.`);
            }
            logEvent(`${logMessage} ${event.text}`);
        } else {
            logEvent(event.text);
        }

        const directions = ['North', 'South', 'East', 'West'];
        directions.forEach(direction => {
            const button = document.createElement('button');
            button.textContent = `Go ${direction}`;
            button.onclick = () => moveDirection(direction.toLowerCase());
            actionButtons.appendChild(button);
        });

        if (poiKey !== 'landingZone') {
            const returnButton = document.createElement('button');
            returnButton.textContent = "Return to Base";
            returnButton.onclick = () => moveTo(4, 5);
            actionButtons.appendChild(returnButton);
        }

        if (event.actions) {
            event.actions.forEach(action => {
                const button = document.createElement('button');
                button.textContent = action.label;
                button.onclick = action.func;
                actionButtons.appendChild(button);
            });
        }
        updateStatsDisplay();
    }

    function setupEventListeners() {
        devResetBtn.addEventListener('click', resetGameData);
        startExpeditionBtn.addEventListener('click', startExpedition);
        cycleBtn.addEventListener('click', () => location.reload());
        closeStoreBtn.addEventListener('click', closeStore);

        suitSelectionContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.suit-btn');
            if (button && !button.disabled) {
                playerLoadout.suit = button.dataset.suit;
                document.querySelectorAll('.suit-btn').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
            }
        });

        toolSelectionContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.tool-btn');
            if (button && !button.disabled) {
                playerLoadout.tool = button.dataset.tool;
                document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
            }
        });

        mapContainer.addEventListener('wheel',e=>{e.preventDefault();mapState.scale+=e.deltaY*-0.001;mapState.scale=Math.min(Math.max(0.5,mapState.scale),4);updateMap();});
        mapContainer.addEventListener('mousedown',e=>{if(e.button!==2)return;e.preventDefault();mapState.isPanning=true;mapContainer.style.cursor='grabbing';mapState.startX=e.clientX-mapState.x;mapState.startY=e.clientY-mapState.y;});
        window.addEventListener('mouseup',e=>{if(e.button!==2||!mapState.isPanning)return;mapState.isPanning=false;mapContainer.style.cursor='grab';});
        window.addEventListener('mousemove',e=>{if(!mapState.isPanning)return;e.preventDefault();mapState.x=e.clientX-mapState.startX;mapState.y=e.clientY-mapState.startY;updateMap();});
        mapContainer.addEventListener('contextmenu',e=>e.preventDefault());
    }
    
    function handleDeath(cause) {
        mainWrapper.classList.add('hidden');
        cyclerOverlay.classList.remove('hidden');
        globalState.deaths++;
        globalState.bankedkCals += player.kCals; // Bank remaining kcals, not samples
        saveGlobalState();

        cyclerIdLogEl.textContent = player.name;
        failureCauseLogEl.textContent = cause;
        failureCodeLogEl.textContent = failureCodes[cause] || failureCodes["Unknown"];
        kCalsBankedLogEl.textContent = player.kCals;
    }

    // Helper functions
    function updateStatsDisplay(){
        if(!player||!playerLoadout.suit)return;
        characterNameEl.textContent=player.name;
        healthEl.textContent=player.health;
        temperatureEl.textContent=player.temperature;
        kCalsEl.textContent=player.kCals;
        aggressionEl.textContent=player.aggression;
        timeEl.textContent=`${String(Math.floor(gameTime/60)).padStart(2,'0')}:${String(gameTime%60).padStart(2,'0')}`;
        playerSuitEl.textContent=playerLoadout.suit;
        playerToolEl.textContent=playerLoadout.tool;
        updateBackpackDisplay();
        if(player.health<=0||player.temperature<=0){handleDeath(player.health<=0?"Vital Signs Lost":"Thermal Failure");}
    }

    function updateBackpackDisplay() {
        if (!backpackEl) return; 
        backpackEl.innerHTML = '';
        if (player.backpack && player.backpack.length > 0) {
            const items = {};
            player.backpack.forEach(item => { items[item] = (items[item] || 0) + 1; });
            for(const item in items) {
                const li = document.createElement('li');
                li.textContent = `${item} (x${items[item]})`;
                backpackEl.appendChild(li);
            }
        } else {
            backpackEl.innerHTML = '<li>Empty</li>';
        }
    }

    function standardContinue(){
        updateStatsDisplay();
        actionButtons.innerHTML = '';
        const b = document.createElement('button');
        b.textContent = "Continue";
        b.onclick = triggerEvent;
        actionButtons.appendChild(b);
    }
    
    function moveDirection(direction) {
        let targetX = currentCoords.x;
        let targetY = currentCoords.y;

        if (direction === 'north') targetY--;
        if (direction === 'south') targetY++;
        if (direction === 'east') targetX++;
        if (direction === 'west') targetX--;

        if (targetX < 0 || targetX > 9 || targetY < 0 || targetY > 9) {
            logEvent("You are at the edge of the designated survey area.");
            addChatMessage("Mission Control", "Further deviation from the survey zone is not authorized. Return to the designated grid.");
            standardContinue();
            return;
        }
        moveTo(targetX, targetY);
    }

    function moveTo(x, y) {
        const newCoordString = `${x},${y}`;
        const isFirstVisit = !globalState.exploredTiles.includes(newCoordString);
        
        if (isFirstVisit) {
            globalState.exploredTiles.push(newCoordString);
            const poiKey = getPoiKeyByCoords(x, y);
            if (poiKey === 'crystalCave') {
                addChatMessage("Mission Control","Unique energy signature logged. Compensation added.");
                globalState.bankedkCals += 1500;
            }
            saveGlobalState();
        }

        advanceTime(60);
        currentCoords = { x, y };
        const poiKey = getPoiKeyByCoords(x, y);
        let destinationName = "a known wasteland";
        if (poiKey) {
            destinationName = poiMap[poiKey].name;
        } else if (isFirstVisit) {
            destinationName = "an unknown sector";
        }

        logEvent(`Traveling to ${destinationName}...`);
        setTimeout(()=>{updateMap();triggerEvent();}, 1500);
    }

    function openStore(){storeKcalsEl.textContent=globalState.bankedkCals;storeItemsEl.innerHTML='';Object.entries(itemData).forEach(([name,item])=>{if(item.type!=='suit'&&item.type!=='tool'||item.cost===0)return;const div=document.createElement('div');div.className='item';const btn=globalState.ownedItems.includes(name)?`<span>Owned</span>`:`<button class="store-button" onclick="window.telemetryGame.buyItem('${name}')" ${globalState.bankedkCals<item.cost?'disabled':''}>Buy (${item.cost} kCal)</button>`;div.innerHTML=`<div><strong>${name}</strong><br><em>${item.desc}</em></div>${btn}`;storeItemsEl.appendChild(div);});storeOverlay.classList.remove('hidden');}
    function buyItem(itemName){const item=itemData[itemName];if(globalState.bankedkCals>=item.cost&&!globalState.ownedItems.includes(itemName)){globalState.bankedkCals-=item.cost;globalState.ownedItems.push(itemName);saveGlobalState();openStore();}}
    
    function updateMap() {
        mapGrid.style.transform = `translate(${mapState.x}px, ${mapState.y}px) scale(${mapState.scale})`;
        mapGrid.innerHTML = '';
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const cell = document.createElement('div');
                cell.classList.add('map-cell');
                const label = document.createElement('div');
                label.classList.add('map-cell-label');

                const coordString = `${x},${y}`;
                const isExplored = globalState.exploredTiles.includes(coordString);
                const poiKey = getPoiKeyByCoords(x, y);
                const isCurrent = currentCoords.x === x && currentCoords.y === y;
                
                if (isCurrent) { cell.classList.add('current'); }

                if (isExplored) {
                    cell.classList.add('unlocked');
                    if (poiKey) {
                        cell.classList.add('poi');
                        label.textContent = poiMap[poiKey].name;
                        if (poiKey === 'landingZone') { cell.classList.add('base'); }
                    } else {
                        label.textContent = '';
                    }
                } else {
                    label.textContent = '?';
                }
                
                cell.appendChild(label);
                mapGrid.appendChild(cell);
            }
        }
    }

    function addChatMessage(sender,message){const d=document.createElement('div');d.className='chat-message';d.innerHTML=`<span class="sender">${sender}:</span> <span class="message">"${message}"</span>`;chatLog.appendChild(d);chatLog.scrollTop=chatLog.scrollHeight;}
    function checkMissions(){missions.forEach(m=>{if(!m.isComplete()&&m.trigger()){addChatMessage(m.sender,m.message);}})}
    function closeStore(){storeOverlay.classList.add('hidden');}
    function advanceTime(minutes){gameTime+=minutes;player.kCals-=Math.floor(minutes/10);updateStatsDisplay();}
    
    function scanArea() {
        let message = "Scanning... nothing of interest in the immediate vicinity. The wind howls.";
        if (Math.random() < 0.2) { // 20% chance to find something
            const foundItem = ['Geological Scanner', 'Ice Core Sample'][Math.floor(Math.random() * 2)];
            if(player.backpack) player.backpack.push(foundItem);
            message = `Scanning... your device chirps. You've found a ${foundItem}.`;
        }
        logEvent(message);
        standardContinue();
    }

    function approachVents(){logEvent("The warmth is inviting. Temp +20.");player.temperature=Math.min(player.temperature+20,loadoutModifiers.suits[playerLoadout.suit].temperature);standardContinue();}
    
    function collectCrystalSample(){
        let message = "You carefully extract a crystal. It pulses with a soft light. +300 kCals.";
        player.kCals += 300;
        if (Math.random() < 0.5) { // 50% chance to get a special sample
            if(player.backpack) player.backpack.push('Alien Microbe');
            message += " You manage to secure a sample containing a strange, resilient microbe.";
        }
        logEvent(message);
        standardContinue();
    }
    
    window.telemetryGame = { buyItem };

    init();
});