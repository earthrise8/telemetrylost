document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const devResetBtn = document.getElementById('dev-reset-btn');
    const mainWrapper = document.getElementById('main-wrapper');
    const ocularInterface = document.getElementById('ocular-interface');
    const eventText = document.getElementById('event-text');
    const characterNameEl = document.getElementById('character-name');
    const healthEl = document.getElementById('health');
    const bankedKcalsEl = document.getElementById('banked-kcals');
    const carriedKcalsEl = document.getElementById('carried-kcals');
    const energyEl = document.getElementById('energy');
    const suitWarmerTimeEl = document.getElementById('suit-warmer-time');
    const timeEl = document.getElementById('time');
    const coordinatesEl = document.getElementById('coordinates');
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
    const nameScreen = document.getElementById('name-screen');
    const newCharacterNameInput = document.getElementById('new-character-name-input');
    const startGameBtn = document.getElementById('start-game-btn');

    // Game State
    let player = {};
    let globalState = {};
    let playerLoadout = {};
    let currentCoords = { x: 4, y: 5 };
    let gameTime = 420;
    let mapState = { scale: 1, x: 0, y: 0, isPanning: false, startX: 0, startY: 0 };
    let storyIndex = 0;
    let coldInterval = null;
    const backstory = [
        "The year is 2242. You are a Cycler, a clone consciousness uploaded into a new body every time you die.",
        "Your mission is to explore the frozen world of Niflheim, a planet with the potential for human colonization.",
        "You are disposable. Your memories are backed up, but your life is not. Each cycle is a new chance to complete your mission.",
        "You\'ve just been recycled. Your previous iteration... failed. Now it\'s your turn. Good luck, Cycler."
    ];

    const initialGlobalState = {
        bankedkCals: 500,
        deaths: 0,
        exploredTiles: ['4,5'],
        ownedItems: [],
        consumables: { 'Ration Pack': 0, 'Warmer Unit': 0 },
        crystalCave_crystals: Math.floor(Math.random() * 4) + 2, // 2 to 5 crystals
        dailyMission: null,
    };

    const failureCodes = { "Starvation": "FC-STV-001", "Vital Signs Lost": "FC-VSL-002", "Exhaustion": "FC-EXH-004", "Hypothermia": "FC-HYP-003", "Unknown": "FC-UNX-000" };
    const poiMap = { 'landingZone': { x: 4, y: 5, name: 'Base' }, 'glacier': { x: 4, y: 4, name: 'Glacier', isCold: true }, 'iceFields': { x: 3, y: 5, name: 'Fields', isCold: true }, 'rockyOutcrop': { x: 5, y: 5, name: 'Outcrop' }, 'crevasse': { x: 4, y: 6, name: 'Crevasse' }, 'thermalVents': { x: 3, y: 4, name: 'Vents' }, 'crystalCave': { x: 1, y: 8, name: 'Cave' }, 'boulderPass': { x: 6, y: 5, name: 'Boulder Pass' } };
    const itemData = {
        'Survey Gear': { type: 'suit', cost: 0, desc: 'Reduced travel distance and energy consumption for movement.' },
        'Thermal Gear': { type: 'suit', cost: 800, desc: 'Allows for further exploration with slightly increased energy consumption.' },
        'Armoured Gear': { type: 'suit', cost: 800, desc: 'Maximum protection and reduced energy for manual labor, but high energy consumption for movement.' },
        'Thermal Cutter': { type: 'tool', cost: 0, desc: 'Standard issue tool for obstacles.' },
        'Kinetic Sidearm': { type: 'tool', cost: 1200, desc: 'A reliable projectile weapon.' },
        'Sonic Deterrent': { type: 'tool', cost: 1000, desc: 'Deters aggressive fauna.' },
        'Geological Scanner': { type: 'sample', sell: 200, desc: 'Data on rock composition.' },
        'Ice Core Sample': { type: 'sample', sell: 150, desc: 'A pristine ice core.' },
        'Alien Microbe': { type: 'sample', sell: 500, desc: 'A potentially groundbreaking discovery.' },
        'Strange Artifact': { type: 'misc', desc: 'A strange, pulsating artifact. It feels warm to the touch.' },
        'Damaged Logbook': { type: 'misc', desc: 'A damaged logbook. Most of it is unreadable, but you can make out a few words: "...unforeseen...not alone..."' },
        'Ration Pack': { type: 'consumable', cost: 100, desc: 'A high-energy food pack. Restores 50 energy.' },
        'Warmer Unit': { type: 'consumable', cost: 250, desc: 'An add-on for the Survey Gear that provides 5 minutes of protection from extreme cold.' },
    };
    const loadoutModifiers = { 
        suits: { 
            'Survey Gear': { health: 100, maxDistance: 3, moveEnergy: -2, actionEnergy: 0 }, 
            'Thermal Gear': { health: 120, maxDistance: 5, moveEnergy: 2, actionEnergy: 2, providesWarmth: true }, 
            'Armoured Gear': { health: 150, maxDistance: 4, moveEnergy: 5, actionEnergy: -5 } 
        }, 
        tools: { 'Thermal Cutter': {}, 'Kinetic Sidearm': {}, 'Sonic Deterrent': {} } 
    };
    const events = {
        landingZone: [{ text: "Base is quiet. All samples and kCal reserves have been banked.", actions: [{ label: "Requisition Gear", func: openStore }, { label: "Sleep", func: sleep }] }],
        glacier: [{ text: "A massive, creaking glacier stretches before you.", actions: [{ label: "Scan for anomalies", func: scanArea }] }],
        iceFields: [{ text: "Vast, flat ice fields stretch to the horizon.", actions: [{ label: "Scan the area", func: scanArea }] }],
        crevasse: [{ text: "A deep, dark crevasse splits the ice sheet.", actions: [{ label: "Peer into the darkness", func: scanArea }] }],
        thermalVents: [{ text: "Plumes of steam rise from cracks in the ice.", actions: [{ label: "Approach Vents", func: approachVents }] }],
        crystalCave: [{ text: "A vast cavern of shimmering crystals.", actions: [{ label: "Collect Crystal Sample", func: collectCrystalSample }] }],
        boulderPass: [{ text: "A massive boulder blocks the path.", actions: [{ label: "Clear Boulder", func: clearBoulder }] }],
        wasteland: [{ text: "A vast, snowy wasteland stretches in all directions.", actions: [{ label: "Scan Area", func: scanArea }] }]
    };
    const missions = [{ id: "findCave", sender: "Mission Control", message: "Anomalous energy readings from (1, 8). Investigate.", coords: {x: 1, y: 8}, trigger: () => globalState.deaths > 0, isComplete: () => globalState.exploredTiles.includes('1,8') }];
    const missionTemplates = [
        ...Object.keys(poiMap).filter(p => p !== 'landingZone').map(p => ({ type: 'explore', target: p, reward: 500, penalty: 200, text: `Scout the ${poiMap[p].name} at (${poiMap[p].x}, ${poiMap[p].y}).`})),
        ...Object.keys(itemData).filter(i => itemData[i].type === 'sample').map(i => ({ type: 'collect', target: i, reward: 750, penalty: 350, text: `Acquire a sample of "${i}".`}))
    ];

    function getPoiKeyByCoords(x, y) { return Object.keys(poiMap).find(key => poiMap[key].x === x && poiMap[key].y === y); }

    // --- Core Functions ---
    function init() {
        loadGlobalState();
        setupEventListeners();
        const hasPlayedBefore = localStorage.getItem('hasPlayedBefore');
        if (hasPlayedBefore) {
            showSetupScreen(false);
        } else {
            showNameInput();
        }
    }

    function showNameInput() {
        mainWrapper.classList.add('hidden');
        setupScreen.classList.add('hidden');
        nameScreen.classList.remove('hidden');
    }

    function startBackstory() {
        const playerName = newCharacterNameInput.value;
        if (!playerName) {
            alert("Please enter a Cycler ID.");
            return;
        }
        localStorage.setItem('playerName', playerName);
        player.name = playerName;
        nameScreen.classList.add('hidden');
        mainWrapper.classList.remove('hidden');
        ocularInterface.classList.remove('hidden');
        showStory();
    }

    function showStory() {
        if (storyIndex < backstory.length) {
            logEvent(backstory[storyIndex]);
            const continueBtn = document.createElement('button');
            continueBtn.textContent = "Continue";
            continueBtn.onclick = () => {
                storyIndex++;
                showStory();
            };
            actionButtons.appendChild(continueBtn);
        } else {
            showSetupScreen(true);
        }
    }

    function resetGameData() {
        if (confirm("Are you sure? This will wipe all local progress.")) {
            localStorage.removeItem('telemetryLostGlobalState');
            localStorage.removeItem('hasPlayedBefore');
            localStorage.removeItem('playerName');
            location.reload();
        }
    }

    function loadGlobalState() {
        const savedState = localStorage.getItem('telemetryLostGlobalState');
        globalState = savedState ? JSON.parse(savedState) : JSON.parse(JSON.stringify(initialGlobalState));
        if (!globalState.exploredTiles) { globalState.exploredTiles = ['4,5']; }
        if (globalState.crystalCave_crystals === undefined) {
            globalState.crystalCave_crystals = Math.floor(Math.random() * 4) + 2; // 2 to 5 crystals
        }
        if (globalState.dailyMission === undefined) {
            globalState.dailyMission = null;
        }
        if (globalState.consumables === undefined) {
            globalState.consumables = { 'Ration Pack': 0, 'Warmer Unit': 0 };
        }
        const playerName = localStorage.getItem('playerName');
        if (playerName) {
            player.name = playerName;
        }
    }

    function saveGlobalState() {
        localStorage.setItem('telemetryLostGlobalState', JSON.stringify(globalState));
    }

    function showSetupScreen(isFirstTime) {
        mainWrapper.classList.add('hidden');
        nameScreen.classList.add('hidden');
        setupScreen.classList.remove('hidden');
        characterNameInput.value = player.name || "";

        playerLoadout = {
            suit: null,
            tool: null,
        };

        suitSelectionContainer.innerHTML = '<h2>Choose a Suit</h2>';
        toolSelectionContainer.innerHTML = '<h2>Choose a Tool</h2>';

        Object.entries(itemData).forEach(([itemName, itemDef]) => {
            if (itemDef.type !== 'suit' && itemDef.type !== 'tool') return;
            const container = itemDef.type === 'suit' ? suitSelectionContainer : toolSelectionContainer;
            const optionDiv = document.createElement('div');
            optionDiv.className = 'loadout-option';
            const isOwned = globalState.ownedItems.includes(itemName);
            const isFree = itemDef.cost === 0;

            if (isFirstTime && !isFree) return;

            const button = document.createElement('button');
            button.className = `${itemDef.type}-btn`;
            button.dataset[itemDef.type] = itemName;
            button.textContent = itemName;
            button.disabled = !isFirstTime && !isOwned;

            if ((itemDef.type === 'suit' && playerLoadout.suit === itemName) || (itemDef.type === 'tool' && playerLoadout.tool === itemName)) {
                button.classList.add('selected');
            }

            const desc = document.createElement('div');
            desc.className = 'option-desc';
            desc.textContent = itemDef.desc + (!isOwned && !isFirstTime ? ` (Not Owned)` : ``);
            optionDiv.appendChild(button);
            optionDiv.appendChild(desc);
            container.appendChild(optionDiv);
        });
    }

    function checkMissionCompletion(eventData) {
        const mission = globalState.dailyMission;
        if (!mission || mission.status !== 'assigned') {
            return;
        }

        let missionComplete = false;
        if (mission.type === 'explore' && eventData.type === 'location') {
            const poiKey = getPoiKeyByCoords(eventData.coords.x, eventData.coords.y);
            if (mission.target === poiKey) {
                missionComplete = true;
            }
        } else if (mission.type === 'collect' && eventData.type === 'item' && mission.target === eventData.item) {
            missionComplete = true;
        }

        if (missionComplete) {
            mission.status = 'completed';
            globalState.bankedkCals += mission.reward;
            saveGlobalState();
            addChatMessage("Mission Control", `Objective complete: ${mission.text}. Your account has been credited ${mission.reward} kCal.`);
        }
    }

    function assignDailyMission() {
        const today = Math.floor(gameTime / 1440);

        if (globalState.dailyMission && globalState.dailyMission.status === 'assigned' && globalState.dailyMission.dayAssigned < today) {
            globalState.bankedkCals -= globalState.dailyMission.penalty;
            addChatMessage("Mission Control", `Objective failed: ${globalState.dailyMission.text}. Your account has been docked ${globalState.dailyMission.penalty} kCal.`);
        }

        const newMissionTemplate = missionTemplates[Math.floor(Math.random() * missionTemplates.length)];
        globalState.dailyMission = {
            ...newMissionTemplate,
            status: 'assigned',
            dayAssigned: today
        };
        saveGlobalState();
        addChatMessage("Mission Control", `New daily objective: ${globalState.dailyMission.text}`);
    }

    function startExpedition() {
        if (!playerLoadout.suit || !playerLoadout.tool) {
            alert("Please select a suit and a tool.");
            return;
        }

        const isFirstTime = !localStorage.getItem('hasPlayedBefore');

        if (isFirstTime) {
            localStorage.setItem('hasPlayedBefore', 'true');
            globalState.ownedItems.push(playerLoadout.suit, playerLoadout.tool);
            globalState.consumables['Ration Pack'] = 2;
            globalState.consumables['Warmer Unit'] = 1;
            saveGlobalState();
        }

        setupScreen.classList.add('hidden');
        mainWrapper.classList.remove('hidden');

        player = { 
            name: player.name || characterNameInput.value,
            health: loadoutModifiers.suits[playerLoadout.suit].health, 
            kCals: 0, 
            energy: 100,
            suitWarmerTime: 0,
            backpack: []
        };

        gameTime = 420;
        currentCoords = { x: 4, y: 5 };

        chatLog.innerHTML = '';
        addChatMessage("Mission Control", `Welcome, Cycler ${player.name}. Explore, gather data, stay alive.`);
        assignDailyMission();
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
        checkColdDamage();
        checkMissionCompletion({ type: 'location', coords: currentCoords });
        const poiKey = getPoiKeyByCoords(currentCoords.x, currentCoords.y);
        let eventPool = events.wasteland;
        if (poiKey && events[poiKey]) { eventPool = events[poiKey]; }
        
        const event = eventPool[Math.floor(Math.random() * eventPool.length)];

        if (poiKey === 'landingZone') {
            let samplesValue = 0;
            const remainingBackpack = [];

            if (player.backpack) {
                player.backpack.forEach(item => {
                    if (itemData[item] && itemData[item].sell) {
                        samplesValue += itemData[item].sell;
                    } else {
                        remainingBackpack.push(item);
                    }
                });
            }

            const bankedKCal = player.kCals;
            globalState.bankedkCals += bankedKCal + samplesValue;
            player.kCals = 0;
            player.backpack = remainingBackpack; 

            saveGlobalState();

            let logMessage = `Returned to Base.`;
            if (bankedKCal > 0) {
                addChatMessage("Mission Control", `Banked ${bankedKCal} kCal from your expedition.`);
            }
            if (samplesValue > 0) {
                addChatMessage("Mission Control", `Received and processed samples for ${samplesValue} kCal.`);
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
        const backpackButton = document.createElement('button');
        backpackButton.textContent = "Backpack";
        backpackButton.onclick = openBackpack;
        actionButtons.appendChild(backpackButton);
        updateStatsDisplay();
    }

    function setupEventListeners() {
        devResetBtn.addEventListener('click', resetGameData);
        startExpeditionBtn.addEventListener('click', startExpedition);
        startGameBtn.addEventListener('click', startBackstory);
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
        const bankedAmount = player.kCals;
        globalState.bankedkCals += bankedAmount;
        
        cyclerIdLogEl.textContent = player.name;
        failureCauseLogEl.textContent = cause;
        failureCodeLogEl.textContent = failureCodes[cause] || failureCodes["Unknown"];
        kCalsBankedLogEl.textContent = `${bankedAmount} (Samples Lost)`;
        
        saveGlobalState();
    }

    // Helper functions
    function updateStatsDisplay(){
        if(!player||!globalState)return;
        characterNameEl.textContent=player.name || '';
        healthEl.textContent=player.health || 0;
        bankedKcalsEl.textContent = globalState.bankedkCals || 0;
        carriedKcalsEl.textContent = player.kCals || 0;
        energyEl.textContent = player.energy || 0;
        suitWarmerTimeEl.textContent = `${Math.floor(player.suitWarmerTime / 60)}m ${player.suitWarmerTime % 60}s`;
        timeEl.textContent = `Day-${String(Math.floor(gameTime/1440)).padStart(3,'0')} ${String(Math.floor((gameTime % 1440)/60)).padStart(2,'0')}:${String(gameTime%60).padStart(2,'0')}`;
        coordinatesEl.textContent = `${currentCoords.x}, ${currentCoords.y}`;
        playerSuitEl.textContent=playerLoadout.suit || 'N/A';
        playerToolEl.textContent=playerLoadout.tool || 'N/A';
        updateBackpackDisplay();
        if(player.health<=0){handleDeath("Vital Signs Lost");}
        if (player.energy <= 0) { handleDeath("Exhaustion"); }
        if (player.energy < 5) {
            addChatMessage("Mission Control", "Energy levels critical. Return to base for recovery.");
        }
    }

    function updateBackpackDisplay() {
        if (!backpackEl) return;
        backpackEl.innerHTML = '';
        
        const items = {};
        if (player.backpack && player.backpack.length > 0) {
            player.backpack.forEach(item => { items[item] = (items[item] || 0) + 1; });
        }

        Object.entries(globalState.consumables).forEach(([name, count]) => {
            if (count > 0) {
                items[name] = count;
            }
        });

        if (Object.keys(items).length > 0) {
             for (const item in items) {
                const li = document.createElement('li');
                li.textContent = `${item} (x${items[item]})`;
                backpackEl.appendChild(li);
            }
        } else {
            backpackEl.innerHTML = '<li>Empty</li>';
        }
    }

    function openBackpack() {
        eventText.innerHTML = '<h2>Inventory</h2>';
        actionButtons.innerHTML = '';
    
        const backpackItems = player.backpack || [];
        const consumableItems = Object.entries(globalState.consumables).filter(([, count]) => count > 0).map(([name]) => name);
        const inventoryItems = new Set(backpackItems.concat(consumableItems));
    
        if (inventoryItems.size > 0) {
            const list = document.createElement('ul');
            list.style.cssText = "list-style: none; padding: 0; margin-top: 10px; text-align: left;";
    
            inventoryItems.forEach(itemName => {
                const itemDef = itemData[itemName];
                if (itemDef) {
                    const li = document.createElement('li');
    
                    const countInBackpack = (player.backpack || []).filter(i => i === itemName).length;
                    const countOfConsumable = globalState.consumables[itemName] || 0;

                    let displayText = itemName;
                    if (itemDef.type === 'consumable') {
                        displayText += ` (x${countOfConsumable})`;
                    } else if (countInBackpack > 0) {
                        displayText += ` (x${countInBackpack})`;
                    }
    
                    li.textContent = displayText;
                    li.style.cursor = 'pointer';
                    li.style.color = '#0CF';
                    li.style.marginBottom = '5px';
                    li.onmouseover = () => { li.style.color = '#0FF'; };
                    li.onmouseout = () => { li.style.color = '#0CF'; };
    
                    li.onclick = () => {
                        eventText.innerHTML = `<h2>${itemName}</h2><p>${itemDef.desc}</p>`;
                        actionButtons.innerHTML = '';

                        if (itemDef.type === 'consumable') {
                            const useButton = document.createElement('button');
                            useButton.textContent = 'Use';
                            useButton.onclick = () => useConsumable(itemName);
                            actionButtons.appendChild(useButton);
                        }

                        if ((itemDef.type === 'suit' && playerLoadout.suit !== itemName && globalState.ownedItems.includes(itemName)) || 
                            (itemDef.type === 'tool' && playerLoadout.tool !== itemName && globalState.ownedItems.includes(itemName))) {
                            const equipButton = document.createElement('button');
                            equipButton.textContent = 'Equip';
                            equipButton.onclick = () => {
                                if (itemDef.type === 'suit') {
                                    const oldSuit = playerLoadout.suit;
                                    const oldSuitMaxHealth = loadoutModifiers.suits[oldSuit].health;
                                    const healthPercentage = player.health / oldSuitMaxHealth;

                                    playerLoadout.suit = itemName;

                                    const newSuitMaxHealth = loadoutModifiers.suits[itemName].health;
                                    player.health = Math.round(newSuitMaxHealth * healthPercentage);
                                } else if (itemDef.type === 'tool') {
                                    playerLoadout.tool = itemName;
                                }
                                updateStatsDisplay();
                                openBackpack(); // Refresh backpack view
                            };
                            actionButtons.appendChild(equipButton);
                        }
    
                        const backToInventoryButton = document.createElement('button');
                        backToInventoryButton.textContent = 'Back to Inventory';
                        backToInventoryButton.onclick = openBackpack;
                        actionButtons.appendChild(backToInventoryButton);
                    };
                    list.appendChild(li);
                }
            });
            eventText.appendChild(list);
        } else {
            eventText.innerHTML += '<p>Your inventory is empty.</p>';
        }
    
        const backToGameButton = document.createElement('button');
        backToGameButton.textContent = 'Back to Game';
        backToGameButton.onclick = triggerEvent;
        actionButtons.appendChild(backToGameButton);
    }

    function useConsumable(itemName) {
        if (globalState.consumables[itemName] > 0) {
            if (itemName === 'Ration Pack') {
                player.energy = Math.min(100, player.energy + 50);
                globalState.consumables[itemName]--;
                logEvent("You consume a Ration Pack, restoring 50 energy.");
                saveGlobalState();
                setTimeout(openBackpack, 1500);
            } else if (itemName === 'Warmer Unit') {
                if (playerLoadout.suit !== 'Survey Gear') {
                    logEvent("Warmer Units are only compatible with standard issue Survey Gear.");
                    setTimeout(openBackpack, 1500);
                    return;
                }
                player.suitWarmerTime += 300; // 5 minutes
                globalState.consumables[itemName]--;
                logEvent("You activate a Warmer Unit. You feel a comforting warmth spread through your suit.");
                saveGlobalState();
                setTimeout(openBackpack, 1500); 
            }
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

        const distance = Math.abs(targetX - 4) + Math.abs(targetY - 5);
        const suit = playerLoadout.suit;
        if (distance > loadoutModifiers.suits[suit].maxDistance) {
            logEvent("Your suit doesn\'t have the range to go that far.");
            addChatMessage("Mission Control", "Exceeding suit\'s operational range is not advised. Return to a closer distance to base.");
            standardContinue();
            return;
        }

        if (targetX < 0 || targetX > 9 || targetY < 0 || targetY > 9) {
            logEvent("You are at the edge of the designated survey area.");
            addChatMessage("Mission Control", "Further deviation from the survey zone is not authorized. Return to the designated grid.");
            standardContinue();
            return;
        }
        moveTo(targetX, targetY);
    }

    function moveTo(x, y) {
        const suit = playerLoadout.suit;
        const moveEnergyCost = 5 + loadoutModifiers.suits[suit].moveEnergy;
        player.energy -= moveEnergyCost;

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

        logEvent(`Traveling to ${destinationName}... (-${moveEnergyCost} Energy)`);
        setTimeout(()=>{updateMap();triggerEvent();}, 1500);
    }

    function openStore() {
        storeKcalsEl.textContent = globalState.bankedkCals;
        const storeTable = document.createElement('table');
        storeItemsEl.innerHTML = '';
        storeItemsEl.appendChild(storeTable);

        const suits = Object.entries(itemData).filter(([name, item]) => item.type === 'suit' && item.cost > 0);
        const tools = Object.entries(itemData).filter(([name, item]) => item.type === 'tool' && item.cost > 0);
        const consumables = Object.entries(itemData).filter(([name, item]) => item.type === 'consumable');

        let suitHtml = '<tr class="category-header"><th colspan="3">Suits</th></tr>';
        suits.forEach(([name, item]) => {
            const btn = globalState.ownedItems.includes(name)
                ? `<span>Owned</span>`
                : `<button class="store-button" onclick="window.telemetryGame.buyItem('${name}')" ${globalState.bankedkCals < item.cost ? 'disabled' : ''}>Buy</button>`;
            suitHtml += `
                <tr>
                    <td>
                        <div class="item-name">${name}</div>
                        <div class="item-desc">${item.desc}</div>
                    </td>
                    <td class="item-price">${item.cost} kCal</td>
                    <td class="item-action">${btn}</td>
                </tr>
            `;
        });

        let toolHtml = '<tr class="category-header"><th colspan="3">Tools</th></tr>';
        tools.forEach(([name, item]) => {
            const btn = globalState.ownedItems.includes(name)
                ? `<span>Owned</span>`
                : `<button class="store-button" onclick="window.telemetryGame.buyItem('${name}')" ${globalState.bankedkCals < item.cost ? 'disabled' : ''}>Buy</button>`;
            toolHtml += `
                <tr>
                    <td>
                        <div class="item-name">${name}</div>
                        <div class="item-desc">${item.desc}</div>
                    </td>
                    <td class="item-price">${item.cost} kCal</td>
                    <td class="item-action">${btn}</td>
                </tr>
            `;
        });

        let consumableHtml = '<tr class="category-header"><th colspan="3">Consumables</th></tr>';
        consumables.forEach(([name, item]) => {
            const count = globalState.consumables[name] || 0;
            consumableHtml += `
                <tr>
                    <td>
                        <div class="item-name">${name} (Owned: ${count})</div>
                        <div class="item-desc">${item.desc}</div>
                    </td>
                    <td class="item-price">${item.cost} kCal</td>
                    <td class="item-action"><button class="store-button" onclick="window.telemetryGame.buyItem('${name}')" ${globalState.bankedkCals < item.cost ? 'disabled' : ''}>Buy</button></td>
                </tr>
            `;
        });

        storeTable.innerHTML = suitHtml + toolHtml + consumableHtml;
        storeOverlay.classList.remove('hidden');
    }

    function buyItem(itemName) {
        const item = itemData[itemName];
        if (globalState.bankedkCals >= item.cost) {
            globalState.bankedkCals -= item.cost;
            if (item.type === 'consumable') {
                if (!globalState.consumables[itemName]) {
                    globalState.consumables[itemName] = 0;
                }
                globalState.consumables[itemName]++;
            } else if (!globalState.ownedItems.includes(itemName)) {
                globalState.ownedItems.push(itemName);
            }
            saveGlobalState();
            openStore();
            updateStatsDisplay();
        }
    }
    
    function updateMap() {
        mapGrid.style.transform = `translate(${mapState.x}px, ${mapState.y}px) scale(${mapState.scale})`;
        mapGrid.innerHTML = '';
        const activeMission = missions.find(m => !m.isComplete() && m.trigger());

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
                        if (poiMap[poiKey].isCold) cell.classList.add('cold');
                        label.textContent = poiMap[poiKey].name;
                        if (poiKey === 'landingZone') { cell.classList.add('base'); }
                    } else {
                        label.textContent = '';
                    }
                } else {
                    label.textContent = '?';
                }

                if (activeMission && activeMission.coords && x === activeMission.coords.x && y === activeMission.coords.y) {
                    cell.classList.add('mission-objective');
                }
                
                cell.appendChild(label);
                mapGrid.appendChild(cell);
            }
        }
    }

    function addChatMessage(sender,message){const d=document.createElement('div');d.className='chat-message';d.innerHTML=`<span class="sender">${sender}:</span> <span class="message">"${message}"</span>`;chatLog.appendChild(d);chatLog.scrollTop=chatLog.scrollHeight;}
    function checkMissions(){missions.forEach(m=>{if(!m.isComplete()&&m.trigger()){addChatMessage(m.sender,m.message);}})}
    function closeStore(){storeOverlay.classList.add('hidden');}
    
    function advanceTime(minutes){
        const oldDay = Math.floor(gameTime / 1440);
        gameTime+=minutes;
        const newDay = Math.floor(gameTime / 1440);

        if (newDay > oldDay) {
            assignDailyMission();
        }

        if (player.suitWarmerTime > 0) {
            player.suitWarmerTime = Math.max(0, player.suitWarmerTime - (minutes * 60)); // Time is in seconds
            if(player.suitWarmerTime === 0) {
                addChatMessage("Mission Control", "Suit warmer depleted. Exposure to extreme cold is now a critical threat.");
            }
        }

        // kCal consumption over time seems to be removed in favor of energy
        // player.kCals-=Math.floor(minutes/10);
        updateStatsDisplay();
    }

    function checkColdDamage() {
        const poiKey = getPoiKeyByCoords(currentCoords.x, currentCoords.y);
        const suit = playerLoadout.suit;
        const providesWarmth = loadoutModifiers.suits[suit].providesWarmth || false;

        if (poiKey && poiMap[poiKey].isCold && player.suitWarmerTime <= 0 && !providesWarmth) {
             if (!coldInterval) {
                addChatMessage("Mission Control", "Warning: Extreme cold detected. Suit integrity failing. Activate a warmer unit or equip Thermal Gear.");
                coldInterval = setInterval(() => {
                    player.health -= 5;
                    updateStatsDisplay();
                    if (player.health <= 0) {
                        handleDeath('Hypothermia');
                        clearInterval(coldInterval);
                        coldInterval = null;
                    }
                }, 5000); // 5 damage every 5 seconds
            }
        } else {
            if (coldInterval) {
                addChatMessage("Mission Control", "Temperature levels stabilized.");
                clearInterval(coldInterval);
                coldInterval = null;
            }
        }
    }
    
    function scanArea() {
        const suit = playerLoadout.suit;
        const energyCost = 2 + loadoutModifiers.suits[suit].actionEnergy;
        let message = "Scanning... nothing of interest in the immediate vicinity. The wind howls.";
        player.energy -= energyCost;
        if (Math.random() < 0.2) { // 20% chance to find something
            const foundItem = ['Geological Scanner', 'Ice Core Sample', 'Strange Artifact', 'Damaged Logbook'][Math.floor(Math.random() * 4)];
            if(player.backpack) player.backpack.push(foundItem);
            checkMissionCompletion({ type: 'item', item: foundItem });
            message = `Scanning... your device chirps. You\'ve found a ${foundItem}.`;
        }
        logEvent(message + ` (-${energyCost} Energy)`);
        standardContinue();
    }

    function approachVents(){logEvent("The warmth is inviting, but it offers no real benefit.");standardContinue();}
    
    function collectCrystalSample() {
        const requiredTool = 'Thermal Cutter';
    
        if (playerLoadout.tool !== requiredTool) {
            if (globalState.ownedItems.includes(requiredTool)) {
                // Player owns the tool, but it's not equipped.
                logEvent(`You need the ${requiredTool} to harvest these crystals. Would you like to equip it?`);
                actionButtons.innerHTML = '';
    
                const equipButton = document.createElement('button');
                equipButton.textContent = `Equip ${requiredTool}`;
                equipButton.onclick = () => {
                    playerLoadout.tool = requiredTool;
                    updateStatsDisplay();
                    collectCrystalSample(); // Re-run the function with the tool equipped.
                };
                actionButtons.appendChild(equipButton);
    
                const backButton = document.createElement('button');
                backButton.textContent = "Back";
                backButton.onclick = triggerEvent; // Go back to the main event loop
                actionButtons.appendChild(backButton);
    
            } else {
                // Player does not own the tool.
                logEvent("You try to harvest the material, but it is incredibly tough. Perhaps a Thermal Cutter would be able to cut this.");
                standardContinue();
            }
            return;
        }
        const suit = playerLoadout.suit;
        const energyCost = 10 + loadoutModifiers.suits[suit].actionEnergy;
    
        if (globalState.crystalCave_crystals > 0) {
            globalState.crystalCave_crystals--;
            saveGlobalState();
    
            let message = "You carefully extract a crystal. It pulses with a soft light.";
            player.kCals += 300; // Directly add to carried kCals
            player.energy -= energyCost;
    
            if (Math.random() < 0.5) { // 50% chance to get a special sample
                if (player.backpack) player.backpack.push('Alien Microbe');
                checkMissionCompletion({ type: 'item', item: 'Alien Microbe' });
                message += " You manage to secure a sample containing a strange, resilient microbe.";
            }
    
            message += ` There are ${globalState.crystalCave_crystals} harvestable crystals remaining.`;
            if (globalState.crystalCave_crystals === 0) {
                message += " The cave seems to be depleted of easily accessible crystals.";
            }
            
            logEvent(message + ` (+300 kCals, -${energyCost} Energy)`);
            standardContinue();
    
        } else {
            logEvent("You've already harvested all the accessible crystals from this area. There are no more to collect.");
            standardContinue();
        }
    }

    function sleep() {
        const sleepHours = Math.floor(Math.random() * (10 - 3 + 1)) + 3;
        const energyGained = sleepHours * 10;
        player.energy = Math.min(100, player.energy + energyGained);
        advanceTime(sleepHours * 60);
        logEvent(`You sleep for ${sleepHours} hours and recover ${energyGained} energy. You feel rested.`);
        standardContinue();
    }

    function clearBoulder() {
        const requiredTool = 'Thermal Cutter';
        const suit = playerLoadout.suit;
        const energyCost = 25 + loadoutModifiers.suits[suit].actionEnergy;
    
        if (playerLoadout.tool !== requiredTool) {
            if (globalState.ownedItems.includes(requiredTool)) {
                // Player owns the tool, but it's not equipped.
                logEvent(`You need the ${requiredTool} to clear this boulder. Would you like to equip it?`);
                actionButtons.innerHTML = '';
    
                const equipButton = document.createElement('button');
                equipButton.textContent = `Equip ${requiredTool}`;
                equipButton.onclick = () => {
                    playerLoadout.tool = requiredTool;
                    updateStatsDisplay();
                    clearBoulder(); // Re-run the function with the tool equipped.
                };
                actionButtons.appendChild(equipButton);
    
                const backButton = document.createElement('button');
                backButton.textContent = "Back";
                backButton.onclick = triggerEvent; // Go back to the main event loop
                actionButtons.appendChild(backButton);
    
            } else {
                // Player does not own the tool.
                logEvent("You try to clear the boulder, but it is too large and dense. Perhaps a Thermal Cutter could break it down.");
                standardContinue();
            }
            return;
        }
    
    
        if (player.energy > energyCost) {
            player.energy -= energyCost;
            logEvent(`You use the Thermal Cutter and spend a significant amount of energy to clear the boulder. (-${energyCost} Energy)`);
            events.boulderPass = [{ text: "The path you cleared previously.", actions: [] }];
            standardContinue();
        } else {
            logEvent(`You don\'t have enough energy to clear the boulder. You need at least ${energyCost} energy.`);
            standardContinue();
        }
    }
    
    window.telemetryGame = { buyItem };

    init();
});