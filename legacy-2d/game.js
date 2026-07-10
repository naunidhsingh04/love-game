/* ==========================================
   Cozy Game Engine & Loop Coordinator
   ========================================== */

import { Audio } from './audio.js?v=6';
import { Assets, PALETTE } from './assets.js?v=6';
import { Particles } from './particles.js?v=6';
import { Cam } from './camera.js?v=6';
import { Dialogue } from './dialogue.js?v=6';
import { WorldMapScreen, MAP_WIDTH, MAP_HEIGHT } from './worldmap.js?v=6';
import { LevelManager, TILE_SIZE, MAP_COLS, MAP_ROWS } from './levels.js?v=6';

// Game States
const STATE = {
  START_SCREEN: 'start_screen',
  OPENING_CINEMATIC: 'opening_cinematic',
  WORLD_MAP: 'world_map',
  LEVEL_PLAY: 'level_play',
  TRANSITION_OUT: 'transition_out',
  TRANSITION_IN: 'transition_in',
  ENDING_WALK: 'ending_walk',
  SCRAPBOOK: 'scrapbook'
};

class GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.currentState = STATE.START_SCREEN;
    
    // Player Mochi state
    this.player = {
      x: 300,
      y: 300,
      vx: 0,
      vy: 0,
      speed: 3.2,
      size: 24,
      sprite: 'mochi_down_0',
      direction: 'down',
      isMoving: false,
      hopY: 0,
      hopVY: 0
    };

    // Keyboard poll
    this.keys = {};

    // Animation times
    this.time = 0;
    this.lastTime = 0;
    
    // Grayscale level
    this.grayscaleFactor = 0; // 0 (color) to 100 (grayscale)

    // Opening cinematic timeline
    this.introTime = 0;
    this.introPhase = 0;
    this.introHearts = []; // particles for intro
    this.cinematicHeartY = 220;
    this.cinematicHeartCrack = 0; // 0 to 5

    // Progress
    this.unlockedLevelIndex = 0; // 0 to 14
    this.hiddenMemoriesFound = {}; // tracking levels where memory was read

    // UI overlays
    this.hud = null;
    this.titleCard = null;
    this.scrapbookOverlay = null;
  }

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Set dynamic sizing initial values
    this.resizeCanvas();

    this.hud = null;
    this.titleCard = document.getElementById('level-title-card');
    this.scrapbookOverlay = document.getElementById('scrapbook-overlay');

    // Register Assets
    Assets.init();
    Dialogue.init();

    // Load progress
    this.loadProgress();

    // Event Bindings
    this.bindEvents();

    // Start gameloop
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      
      // Update camera dimensions
      Cam.width = this.canvas.width;
      Cam.height = this.canvas.height;
    }
  }

  loadProgress() {
    const savedLvl = localStorage.getItem('lovequest_lvl');
    if (savedLvl !== null) {
      this.unlockedLevelIndex = parseInt(savedLvl, 10);
    }
    const savedMems = localStorage.getItem('lovequest_mems');
    if (savedMems !== null) {
      this.hiddenMemoriesFound = JSON.parse(savedMems);
    }
    WorldMapScreen.init(this.unlockedLevelIndex);
  }

  saveProgress() {
    localStorage.setItem('lovequest_lvl', this.unlockedLevelIndex);
    localStorage.setItem('lovequest_mems', JSON.stringify(this.hiddenMemoriesFound));
  }

  bindEvents() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;

      // Prevent scrolling
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key)) {
        e.preventDefault();
      }

      // Spacebar for dialogue or interaction
      if (e.key === ' ' || e.key === 'Spacebar') {
        this.handleActionInput();
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;
    });

    // Touch / Click interactions
    this.canvas.addEventListener('mousedown', (e) => {
      this.handleActionInput();
    });

    // Button controls
    document.getElementById('start-game-btn').addEventListener('click', () => {
      this.startGame();
    });

    // HUD overlays toggle buttons
    const settingsOverlay = document.getElementById('settings-overlay');
    const inventoryOverlay = document.getElementById('inventory-overlay');
    const helpOverlay = document.getElementById('help-overlay');
    const notiOverlay = document.getElementById('hud-notification');

    document.getElementById('btn-settings-toggle').addEventListener('click', () => {
      settingsOverlay.classList.remove('hidden');
      Audio.playPageFlip();
    });
    document.getElementById('close-settings-btn').addEventListener('click', () => {
      settingsOverlay.classList.add('hidden');
      Audio.playPageFlip();
    });

    document.getElementById('btn-help').addEventListener('click', () => {
      helpOverlay.classList.remove('hidden');
      Audio.playPageFlip();
    });
    document.getElementById('close-help-btn').addEventListener('click', () => {
      helpOverlay.classList.add('hidden');
      Audio.playPageFlip();
    });

    document.getElementById('btn-bag-toggle').addEventListener('click', () => {
      this.updateInventoryGrid();
      inventoryOverlay.classList.remove('hidden');
      Audio.playPageFlip();
    });
    document.getElementById('close-inventory-btn').addEventListener('click', () => {
      inventoryOverlay.classList.add('hidden');
      Audio.playPageFlip();
    });

    // Notification OK button
    document.getElementById('btn-noti-ok').addEventListener('click', () => {
      notiOverlay.classList.add('hidden');
      Audio.playPop();
    });

    // Volume Sliders
    const musicSlider = document.getElementById('slider-volume-music');
    const sfxSlider = document.getElementById('slider-volume-sfx');

    musicSlider.addEventListener('input', (e) => {
      Audio.setMusicVolume(parseFloat(e.target.value) / 100);
    });
    sfxSlider.addEventListener('input', (e) => {
      Audio.setSfxVolume(parseFloat(e.target.value) / 100);
    });

    // Dev HUD buttons
    document.getElementById('btn-skip-level-hud').addEventListener('click', () => {
      settingsOverlay.classList.add('hidden');
      this.skipActiveLevel();
    });
    document.getElementById('btn-reset-game-hud').addEventListener('click', () => {
      if (confirm("Reset your cozy memories progress?")) {
        localStorage.clear();
        location.reload();
      }
    });

    // Virtual D-pad Movement Simulation
    const bindDpad = (btnId, key) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('mousedown', () => { this.keys[key] = true; });
        btn.addEventListener('mouseup', () => { this.keys[key] = false; });
        btn.addEventListener('mouseleave', () => { this.keys[key] = false; });
        
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; });
      }
    };
    bindDpad('dpad-up', 'w');
    bindDpad('dpad-down', 's');
    bindDpad('dpad-left', 'a');
    bindDpad('dpad-right', 'd');

    // Virtual Action buttons
    document.getElementById('btn-action-interact').addEventListener('click', () => {
      this.handleActionInput();
    });
    document.getElementById('btn-action-tool').addEventListener('click', () => {
      this.handleActionInput();
    });
    document.getElementById('btn-action-pet').addEventListener('click', () => {
      // Pet Mochi: Trigger Hop + Sparkles + Pop sound!
      if (this.player.hopY === 0) {
        this.player.hopVY = -7;
        Audio.playPop();
        Particles.spawnSparkles(this.player.x, this.player.y - 16, 8, '#ff80ab');
      }
    });

    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });

    document.getElementById('close-scrapbook-btn').addEventListener('click', () => {
      this.scrapbookOverlay.classList.add('hidden');
      if (this.currentState === STATE.SCRAPBOOK) {
        Cam.clearBounds();
        this.currentState = STATE.WORLD_MAP;
      }
    });
  }

  startGame() {
    document.getElementById('start-overlay').classList.add('fade-out');
    Audio.resume();

    // Start with the opening cinematic
    this.currentState = STATE.OPENING_CINEMATIC;
    this.introTime = 0;
    this.introPhase = 0;
    this.grayscaleFactor = 0;
    Audio.startWind(); // Start wind noise
  }

  skipActiveLevel() {
    if (this.currentState !== STATE.LEVEL_PLAY) return;
    LevelManager.completed = true;
    LevelManager.foundMemory = true; // force count for testing
    this.hiddenMemoriesFound[LevelManager.meta.id] = true;
    this.saveProgress();
    this.completeLevelHeart();
  }

  handleActionInput() {
    // If dialogue is active, advance it
    if (Dialogue.isActive()) {
      Dialogue.next();
      return;
    }

    if (this.currentState === STATE.WORLD_MAP) {
      if (WorldMapScreen.isTransitioning) return;
      // Load current active level
      this.enterActiveLevel();
    } else if (this.currentState === STATE.LEVEL_PLAY) {
      // Find nearby interactive entity
      const interactRadius = 40;
      let closest = null;
      let minDist = Infinity;

      for (const ent of LevelManager.entities) {
        if (!ent.interactive) continue;
        const dist = Math.hypot(this.player.x - ent.x, this.player.y - ent.y);
        if (dist < interactRadius && dist < minDist) {
          minDist = dist;
          closest = ent;
        }
      }

      if (closest) {
        if (closest.onInteract) {
          const lines = closest.onInteract(this.player, closest);
          if (lines) {
            Dialogue.startSequence(lines);
          }
        } else if (closest.dialogues) {
          Dialogue.startSequence(closest.dialogues);
        }
        
        // Save memory progress
        if (closest.type === 'hidden_memory') {
          this.hiddenMemoriesFound[LevelManager.meta.id] = true;
          this.saveProgress();
        }
      }
    }
  }

  enterActiveLevel() {
    this.currentState = STATE.TRANSITION_IN;
    Cam.setZoom(0.3);
    Cam.setTarget(WorldMapScreen.mochiX, WorldMapScreen.mochiY);
    
    // Soft camera zoom down sequence
    setTimeout(() => {
      try {
        // Initialize Player in the level
        this.player.x = 80;
        this.player.y = 11 * TILE_SIZE; // Middle lane
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.sprite = 'mochi_right_0';
        this.player.direction = 'right';

        LevelManager.load(WorldMapScreen.activeNodeIndex + 1);
        Cam.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
        Cam.setTarget(this.player.x, this.player.y);
        Cam.setZoom(1.5); // Close zoom in levels

        // Show level title card
        const card = document.getElementById('level-title-card');
        document.getElementById('level-title-text').textContent = LevelManager.meta.name;
        document.getElementById('level-theme-text').textContent = LevelManager.meta.theme;
        card.classList.remove('hidden');
        
        this.currentState = STATE.LEVEL_PLAY;

        // Update background music tier
        // Tier 1: Level 1-5
        // Tier 2: Level 6-10 (Flute)
        // Tier 3: Level 11-15 (Orchestral)
        let bgmType = 1;
        if (LevelManager.meta.id > 10) bgmType = 3;
        else if (LevelManager.meta.id > 5) bgmType = 2;
        
        Audio.stopWind();
        Audio.startBGM(bgmType);

        // Hide title card after 4.5 seconds
        setTimeout(() => {
          card.classList.add('hidden');
        }, 4500);

        // Trigger level arrival dialogue
        this.triggerLevelArrivalDialogue();
      } catch (err) {
        alert("CRASH during level loading: " + err.message + "\n" + err.stack);
        console.error(err);
      }
    }, 800);
  }

  triggerLevelArrivalDialogue() {
    let arrivalText = "";
    if (LevelManager.meta.id === 1) {
      arrivalText = "Looks like Blossom Meadow lost its color and warmth... Let's pick flowers and help the animals!";
    } else if (LevelManager.meta.id === 2) {
      arrivalText = "The River of Wishes is blocked! Let's repair the bridges and help the ducklings cross.";
    } else if (LevelManager.meta.id === 6) {
      arrivalText = "Looks like the village forgot its music... Let's help everyone find it again.";
    } else if (LevelManager.meta.id === 15) {
      // Final Garden has specialized sequence
      this.currentState = STATE.ENDING_WALK;
      Cam.setZoom(1.2);
      this.triggerEndingSequence();
      return;
    } else {
      arrivalText = `Welcome to ${LevelManager.meta.name}. Let's solve the cozy tasks in this area!`;
    }

    Dialogue.startSequence([
      { speaker: "Mochi", text: arrivalText, expression: "idle" }
    ]);
  }

  completeLevelHeart() {
    this.currentState = STATE.TRANSITION_OUT;
    Dialogue.close();
    Audio.stopBGM();
    Audio.playHeartCrack(); // shattered sound
    Cam.shake(500, 8);

    // Heart rising particle sequence
    Particles.spawnHearts(this.player.x, this.player.y - 30, 12, '#ff6b6b');

    Dialogue.startSequence([
      { speaker: "Mochi", text: "One memory restored! ❤️", expression: "happy" },
      { speaker: "Mochi", text: "Let's see where the next one is hiding." }
    ], () => {
      // Zoom out to map
      Cam.setZoom(0.5);
      
      setTimeout(() => {
        Cam.clearBounds();
        this.currentState = STATE.WORLD_MAP;
        
        // Progress unlock index
        const oldIndex = this.unlockedLevelIndex;
        const newIndex = Math.min(oldIndex + 1, 14);
        this.unlockedLevelIndex = newIndex;
        this.saveProgress();

        // Trigger map hop animation
        WorldMapScreen.startHopTransition(oldIndex, newIndex, () => {
          // Finished transition
        });
      }, 1000);
    });
  }

  // Master Loop
  loop(timestamp) {
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.time = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // 1. Update Camera
    Cam.update(dt);

    // 2. Update Particles
    Particles.update(this.time);

    // 3. Game state logic
    if (this.currentState === STATE.OPENING_CINEMATIC) {
      this.updateOpeningCinematic(dt);
    } else if (this.currentState === STATE.WORLD_MAP) {
      WorldMapScreen.update(dt, this.time);
      
      // Keep HUD hidden on map
      this.setHUDVisible(false);
    } else if (this.currentState === STATE.LEVEL_PLAY) {
      this.updateLevelPlay(dt);
      
      // Render HUD
      this.updateHUD();
    } else if (this.currentState === STATE.ENDING_WALK) {
      this.updateEndingWalk(dt);
    }
  }

  updateOpeningCinematic(dt) {
    this.introTime += dt;

    if (this.introPhase === 0) {
      // Black screen wind sound (5 seconds)
      this.grayscaleFactor = 100;
      if (this.introTime > 5000) {
        this.introPhase = 1;
        this.introTime = 0;
      }
    } else if (this.introPhase === 1) {
      // Heart appears and cracks
      if (this.introTime > 3000 && this.cinematicHeartCrack === 0) {
        this.cinematicHeartCrack = 1;
        Audio.playTypewriter();
      }
      if (this.introTime > 4500 && this.cinematicHeartCrack === 1) {
        this.cinematicHeartCrack = 2;
        Audio.playTypewriter();
      }
      if (this.introTime > 6000 && this.cinematicHeartCrack === 2) {
        // Shatters!
        this.cinematicHeartCrack = 3;
        Audio.playHeartCrack();
        Cam.shake(600, 10);
        
        // Spawn 15 hearts flying away
        const hX = this.canvas.width / 2;
        const hY = this.canvas.height / 2 - 50;
        for (let i = 0; i < 15; i++) {
          const angle = (i / 15) * Math.PI * 2;
          this.introHearts.push({
            x: hX,
            y: hY,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3 - 2,
            life: 1.0
          });
        }
        this.introPhase = 2;
        this.introTime = 0;
      }
    } else if (this.introPhase === 2) {
      // Grayscale colors take over world
      // Update intro hearts
      for (const h of this.introHearts) {
        h.x += h.vx;
        h.y += h.vy;
        h.life -= 0.01;
      }
      if (this.introTime > 3500) {
        this.introPhase = 3;
        this.introTime = 0;
        Audio.stopWind();
        
        // Pan down to Mochi sleeping
        Dialogue.startSequence([
          { speaker: "Narrator", text: "The entire world slowly lost its color...", expression: "sad" },
          { speaker: "Narrator", text: "Leaves fell, flowers closed, and the Memory Tree stood cold and gray." },
          { speaker: "Mochi", text: "*yawn*... Huh? What happened to the trees?", expression: "sleeping" },
          { speaker: "Mochi", text: "Wait, a letter in the mailbox!", expression: "embarrassed" },
          { speaker: "Letter", text: "\"Find her.\"" },
          { speaker: "Mochi", text: "I've been waiting for you. Let's go!", expression: "happy" }
        ], () => {
          // Go to world map
          Cam.clearBounds();
          this.currentState = STATE.WORLD_MAP;
          this.unlockedLevelIndex = 0;
          this.saveProgress();
          WorldMapScreen.init(0);
        });
      }
    }
  }

  updateLevelPlay(dt) {
    if (Dialogue.isActive()) return;

    // Movement axes
    let dx = 0;
    let dy = 0;

    if (this.keys['w'] || this.keys['arrowup']) dy = -1;
    if (this.keys['s'] || this.keys['arrowdown']) dy = 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx = -1;
    if (this.keys['d'] || this.keys['arrowright']) dx = 1;

    // Normalize diagonal speed
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    this.player.isMoving = (dx !== 0 || dy !== 0);

    if (this.player.isMoving) {
      // Move speed
      this.player.vx = dx * this.player.speed;
      this.player.vy = dy * this.player.speed;

      // Collision tests
      const nextX = this.player.x + this.player.vx;
      const nextY = this.player.y + this.player.vy;

      // Boundaries
      const limitW = MAP_COLS * TILE_SIZE;
      const limitH = MAP_ROWS * TILE_SIZE;

      let canMoveX = (nextX >= 16 && nextX <= limitW - 16);
      let canMoveY = (nextY >= 16 && nextY <= limitH - 16);

      // Tiled floor collisions (water is blocked)
      const tileCol = Math.floor(nextX / TILE_SIZE);
      const tileRow = Math.floor(nextY / TILE_SIZE);
      if (tileCol >= 0 && tileCol < MAP_COLS && tileRow >= 0 && tileRow < MAP_ROWS) {
        const tile = LevelManager.grid[tileRow][tileCol];
        if (tile === 'w') {
          // Water tile block (except repaired bridges)
          let onRepairedBridge = false;
          for (const ent of LevelManager.entities) {
            if (ent.type === 'bridge' && ent.repaired) {
              // check inside bounds
              if (nextX >= ent.x && nextX <= ent.x + ent.width && nextY >= ent.y && nextY <= ent.y + ent.height) {
                onRepairedBridge = true;
              }
            }
          }
          if (!onRepairedBridge) {
            canMoveX = false;
            canMoveY = false;
          }
        }
      }

      if (canMoveX) this.player.x = nextX;
      if (canMoveY) this.player.y = nextY;

      // Update Mochi direction sprite
      if (Math.abs(dx) > Math.abs(dy)) {
        this.player.direction = dx > 0 ? 'right' : 'left';
      } else {
        this.player.direction = dy > 0 ? 'down' : 'up';
      }

      const walkFrame = Math.floor((this.time / 150) % 2);
      if (this.player.direction === 'down') this.player.sprite = `mochi_down_${walkFrame}`;
      else if (this.player.direction === 'up') this.player.sprite = 'mochi_up_0';
      else if (this.player.direction === 'left') this.player.sprite = `mochi_left_${walkFrame}`;
      else if (this.player.direction === 'right') this.player.sprite = `mochi_right_${walkFrame}`;

      // Update chick follow logic
      for (const ent of LevelManager.entities) {
        if ((ent.type === 'chick' || ent.type === 'duckling') && ent.following) {
          // Follow player lagging behind slightly
          const targetDist = 28;
          const dist = Math.hypot(ent.x - this.player.x, ent.y - this.player.y);
          if (dist > targetDist) {
            const angle = Math.atan2(this.player.y - ent.y, this.player.x - ent.x);
            ent.x += Math.cos(angle) * (this.player.speed * 0.9);
            ent.y += Math.sin(angle) * (this.player.speed * 0.9);
            ent.sprite = walkFrame === 0 ? ent.type : `${ent.type}`; // simple anim
          }
        }
      }
    } else {
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.sprite = this.player.direction === 'up' ? 'mochi_up_0' : `mochi_${this.player.direction}_0`;
    }

    // Hop physics
    if (this.player.hopY < 0 || this.player.hopVY !== 0) {
      this.player.hopY += this.player.hopVY;
      this.player.hopVY += 0.8; // gravity
      if (this.player.hopY >= 0) {
        this.player.hopY = 0;
        this.player.hopVY = 0;
      }
    }

    // Camera follow player
    Cam.setTarget(this.player.x, this.player.y);

    // If level objectives are all completed, restore memory heart!
    if (LevelManager.completed && !Dialogue.isActive()) {
      this.completeLevelHeart();
    }
  }

  updateEndingWalk(dt) {
    if (Dialogue.isActive()) return;

    // Force player to walk right slowly
    this.player.isMoving = true;
    this.player.x += 1.2;
    this.player.sprite = `mochi_right_${Math.floor((this.time / 180) % 2)}`;
    Cam.setTarget(this.player.x, this.player.y);

    // Guiding butterfly flies ahead
    let bf = LevelManager.entities.find(e => e.type === 'guiding_butterfly');
    if (bf) {
      bf.x = this.player.x + 40 + Math.sin(this.time * 0.003) * 15;
      bf.y = this.player.y - 12 + Math.cos(this.time * 0.003) * 10;
    }

    // Check milestones
    for (const ent of LevelManager.entities) {
      if (ent.type === 'milestone' && !ent.activated) {
        const dist = Math.hypot(this.player.x - ent.x, this.player.y - ent.y);
        if (dist < 30) {
          ent.activated = true;
          ent.x = -200; // hide
          Particles.spawnSparkles(this.player.x, this.player.y, 8, PALETTE['pink']);
          Audio.playChime();
        }
      }
    }

    // Reached final tree
    const targetX = 940;
    if (this.player.x >= targetX) {
      this.player.isMoving = false;
      this.player.sprite = 'mochi_right_0';
      this.currentState = STATE.SCRAPBOOK; // trigger dialog ending
      this.triggerGrandReunionSequence();
    }
  }

  triggerEndingSequence() {
    Dialogue.startSequence([
      { speaker: "Mochi", text: "We've come so far...", expression: "idle" },
      { speaker: "Mochi", text: "There's only one memory left.", expression: "happy" }
    ]);
  }

  triggerGrandReunionSequence() {
    Audio.stopBGM();
    Audio.playChime();
    
    Dialogue.startSequence([
      { speaker: "Mochi", text: "Do you know why the world chose you?", expression: "blush" },
      { speaker: "Mochi", text: "Because every place you visited was carrying a memory..." },
      { speaker: "Mochi", text: "...A memory of someone who loves you." },
      { speaker: "Girlfriend", text: "You found every single Memory Heart." },
      { speaker: "Girlfriend", text: "Thank you for every laugh." },
      { speaker: "Girlfriend", text: "Every silly conversation." },
      { speaker: "Girlfriend", text: "Every hug." },
      { speaker: "Girlfriend", text: "Every little moment that became a memory." },
      { speaker: "Girlfriend", text: "If I had to start this adventure all over again..." },
      { speaker: "Girlfriend", text: "...I'd still hope it leads me to you." }
    ], () => {
      // Trigger blooming visual celebration fireworks!
      this.grayscaleFactor = 0;
      Particles.spawnHearts(500, 200, 30, '#ff6b6b');
      Cam.shake(800, 10);
      Audio.playExplode();

      // Spawn periodic fireworks
      let fireworkCount = 0;
      const fInterval = setInterval(() => {
        if (fireworkCount >= 6) {
          clearInterval(fInterval);
          // Show scrapbook final modal!
          this.showScrapbookModal();
        } else {
          Audio.playExplode();
          Particles.spawnSparkles(200 + Math.random() * 600, 100 + Math.random() * 200, 20, PALETTE['yellow']);
          fireworkCount++;
        }
      }, 1000);
    });
  }

  showScrapbookModal() {
    Audio.playPageFlip();
    this.scrapbookOverlay.classList.remove('hidden');

    const container = document.getElementById('scrapbook-pages-container');
    container.innerHTML = ''; // reset

    // Polaroids listing notes/sketches from levels
    const scrapbookPages = [
      { lvl: 1, cap: "Blossom Meadow", note: "\"Just a little flower for the prettiest girl. 🌸\"" },
      { lvl: 2, cap: "River of Wishes", note: "\"My favorite wish already came true. ❤️\"" },
      { lvl: 3, cap: "Whispering Forest", note: "\"He talks about you more than you think. 🌳\"" },
      { lvl: 4, cap: "Bloom Garden", note: "\"If I had to choose one flower... I'd choose you. 🌷\"" },
      { lvl: 5, cap: "Cozy Castle", note: "\"Everything tastes sweeter when it's shared. 🧁\"" },
      { lvl: 6, cap: "Melody Village", note: "\"Every beautiful memory has its own melody. 🎵\"" },
      { lvl: 7, cap: "Snowflake Village", note: "\"The warmest place has always been beside you. ❄️\"" },
      { lvl: 8, cap: "Star Observatory", note: "\"Some stars only shine for the right people. 🌌\"" },
      { lvl: 9, cap: "Color Workshop", note: "\"Chibi sketch: walking together in the rain. 🎨\"" },
      { lvl: 10, cap: "Courage Mountain", note: "\"Wish you were here... Oh wait, you are. ⛰️\"" },
      { lvl: 11, cap: "Festival of Smiles", note: "\"Someone is always cheering for you! 🎪\"" },
      { lvl: 12, cap: "Dream Islands", note: "\"Some moments don't need words. ☁️\"" },
      { lvl: 13, base: true, cap: "Memory Grove", note: "\"I hope we always find our way back to each other.\"" },
      { lvl: 14, base: true, cap: "Heart Kingdom", note: "\"Welcome Home. 👑\"" }
    ];

    // Count found memories
    let totalMemsFound = Object.keys(this.hiddenMemoriesFound).length;
    const isSecretEnding = totalMemsFound >= 14;

    scrapbookPages.forEach((page) => {
      // Only display polaroid if player found it, or if it is the 100% completion secret ending
      const found = this.hiddenMemoriesFound[page.lvl] || isSecretEnding;

      const polaroid = document.createElement('div');
      polaroid.className = 'polaroid';
      
      const frame = document.createElement('div');
      frame.className = 'polaroid-img-frame';
      
      // Mini canvas inside photo
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      // Draw cozy sketches on the polaroid programmatically
      if (found) {
        ctx.fillStyle = '#ffb7b2';
        ctx.fillRect(0, 0, 64, 64);
        Assets.draw(ctx, 'mochi_sleeping', 16, 16, 32, 32);
        Assets.draw(ctx, 'flower_red', 4, 4, 12, 12);
        Assets.draw(ctx, 'flower_blue', 48, 48, 12, 12);
      } else {
        ctx.fillStyle = '#b0bec5';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#37474f';
        ctx.font = 'bold 24px Quicksand';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 32, 32);
      }

      frame.appendChild(canvas);
      polaroid.appendChild(frame);

      const cap = document.createElement('div');
      cap.className = 'polaroid-caption';
      cap.textContent = page.cap;
      polaroid.appendChild(cap);

      const note = document.createElement('div');
      note.className = 'polaroid-note';
      note.textContent = found ? page.note : "[Locked memory]";
      polaroid.appendChild(note);

      container.appendChild(polaroid);
    });

    if (isSecretEnding) {
      document.getElementById('scrapbook-final-message').textContent = 
        "⭐ SECRET ENDING UNLOCKED: The greatest memory wasn't hidden in the game... it was every moment we've shared together. Thank you for being my favorite person. ❤️";
    } else {
      document.getElementById('scrapbook-final-message').textContent = 
        `Thank you for being my favorite adventure. ❤️ (${totalMemsFound}/14 hidden memories found)`;
    }
  }

  updateHUD() {
    // 1. Update Top Bar Resources
    const flowerTask = LevelManager.tasks.find(t => t.id === 'pick_flowers');
    const flowersCount = flowerTask ? flowerTask.current : 0;
    
    // Total memories found serves as Gems count
    const gemsCount = this.hiddenMemoriesFound ? Object.keys(this.hiddenMemoriesFound).length : 0;
    
    // Level serves as dynamic gold multiplier
    const levelId = LevelManager.meta.id;
    const coinsCount = 120 + levelId * 15 + flowersCount * 5;

    document.getElementById('res-flowers-text').textContent = flowersCount;
    document.getElementById('res-gems-text').textContent = gemsCount;
    document.getElementById('res-coins-text').textContent = coinsCount;
    
    // Update badge level indicator
    const badges = document.querySelectorAll('.hud-level-badge');
    badges.forEach(b => b.textContent = levelId);

    // 2. Update HP & Stamina Bars
    document.getElementById('hud-hp-bar').style.width = '100%';
    
    // Stamina is proportional to task completion ratio in level
    const totalTarget = LevelManager.tasks.reduce((sum, t) => sum + t.target, 0);
    const totalCurrent = LevelManager.tasks.reduce((sum, t) => sum + t.current, 0);
    const staminaPct = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 100;
    
    document.getElementById('hud-stamina-bar').style.width = `${staminaPct}%`;
    document.getElementById('hud-stamina-bar').nextElementSibling.textContent = `${totalCurrent}/${totalTarget}`;

    // 3. Update Left Quest Checklist Panel
    const list = document.getElementById('quest-panel-list');
    list.innerHTML = '';

    LevelManager.tasks.forEach((task) => {
      const li = document.createElement('li');
      if (task.current >= task.target) {
        li.className = 'completed';
      }
      
      const checkSymbol = task.current >= task.target ? '🌸' : '⬜';
      li.innerHTML = `<span class="checkbox-custom-symbol">${checkSymbol}</span><span>${task.label} (${task.current}/${task.target})</span>`;
      list.appendChild(li);
    });

    const levelInfoCards = document.querySelectorAll('.hud-level-info-card');
    levelInfoCards.forEach(c => c.textContent = `Stage ${levelId}/15`);
  }

  setHUDVisible(visible) {
    const elements = [
      document.getElementById('hud-top-bar'),
      document.getElementById('hud-quest-panel'),
      document.getElementById('hud-virtual-controls')
    ];
    elements.forEach(el => {
      if (el) {
        if (visible) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });
  }

  updateInventoryGrid() {
    const grid = document.getElementById('inventory-grid-container');
    grid.innerHTML = '';

    const addSlot = (emoji, count, label) => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.title = label;
      slot.textContent = emoji;
      
      const badge = document.createElement('span');
      badge.className = 'inventory-count';
      badge.textContent = count;
      slot.appendChild(badge);
      grid.appendChild(slot);
    };

    let addedAny = false;
    LevelManager.tasks.forEach(task => {
      let emoji = '📦';
      let label = task.label;
      if (task.id === 'pick_flowers') emoji = '🌸';
      else if (task.id === 'lost_chicks') emoji = '🐤';
      else if (task.id === 'pet_cats') emoji = '🐱';
      else if (task.id === 'feed_mochi') emoji = '🥕';
      else if (task.id === 'repair_bridges') emoji = '🪵';
      else if (task.id === 'lost_ducklings') emoji = '🦆';
      else if (task.id === 'paper_boats') emoji = '⛵';
      else if (task.id === 'feed_fish') emoji = '🐟';
      else if (task.id === 'melody_notes') emoji = '🎵';
      else if (task.id === 'flute_repairs') emoji = '🎶';
      
      if (task.current > 0) {
        addSlot(emoji, task.current, label);
        addedAny = true;
      }
    });

    if (!addedAny) {
      const p = document.createElement('p');
      p.style.gridColumn = 'span 4';
      p.style.fontSize = '0.9rem';
      p.style.opacity = '0.6';
      p.style.padding = '20px';
      p.textContent = 'Bag is empty. Start collecting items!';
      grid.appendChild(p);
    }
  }

  showNotification(title, desc, icon = '🏆') {
    const noti = document.getElementById('hud-notification');
    document.getElementById('noti-title').textContent = title;
    document.getElementById('noti-desc').textContent = desc;
    document.getElementById('noti-icon').textContent = icon;
    noti.classList.remove('hidden');
    Audio.playChime();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.currentState === STATE.START_SCREEN) {
      // Soft start overlay renders via HTML. Just a blank background behind
      this.ctx.fillStyle = '#1c1524';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    if (this.currentState === STATE.OPENING_CINEMATIC) {
      this.renderOpeningCinematic();
      return;
    }

    // Apply grayscale filter based on progress (restoring color)
    if (this.currentState === STATE.LEVEL_PLAY && LevelManager.meta.grayscale) {
      this.ctx.filter = 'grayscale(100%)';
    } else if (this.currentState === STATE.WORLD_MAP && this.unlockedLevelIndex === 0) {
      this.ctx.filter = 'grayscale(80%)';
    } else {
      this.ctx.filter = 'none';
    }

    // Apply Camera
    Cam.apply(this.ctx);

    if (this.currentState === STATE.WORLD_MAP) {
      WorldMapScreen.draw(this.ctx, this.time);
    } else if (this.currentState === STATE.LEVEL_PLAY || this.currentState === STATE.ENDING_WALK || this.currentState === STATE.SCRAPBOOK) {
      this.renderLevelScreen();
    }

    // Draw active Particles (world coordinates)
    Particles.draw(this.ctx, Cam.x, Cam.y);

    // Restore Camera
    Cam.restore(this.ctx);

    // Draw camera-static overlays if any
    this.ctx.filter = 'none';
  }

  renderOpeningCinematic() {
    const ctx = this.ctx;
    
    // Grayscale background
    ctx.fillStyle = '#1e1a24';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.introPhase === 1 || this.introPhase === 2) {
      // 1. Draw glowing fading heart
      const hX = this.canvas.width / 2;
      const hY = this.canvas.height / 2 - 50;
      const size = 30 + Math.sin(this.time * 0.005) * 2;
      
      ctx.save();
      // Glow filter
      ctx.shadowColor = '#ff4081';
      ctx.shadowBlur = 20;
      
      ctx.fillStyle = '#ff4081';
      ctx.beginPath();
      ctx.moveTo(hX, hY);
      ctx.bezierCurveTo(hX - size/2, hY - size/2, hX - size, hY, hX, hY + size);
      ctx.bezierCurveTo(hX + size, hY, hX + size/2, hY - size/2, hX, hY);
      ctx.fill();
      ctx.restore();

      // Render cracks lines
      if (this.cinematicHeartCrack >= 1) {
        ctx.strokeStyle = '#2b2730';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hX, hY - 10);
        ctx.lineTo(hX - 5, hY + 10);
        ctx.stroke();
      }
      if (this.cinematicHeartCrack >= 2) {
        ctx.beginPath();
        ctx.moveTo(hX - 5, hY + 10);
        ctx.lineTo(hX + 8, hY + 20);
        ctx.stroke();
      }

      // Draw intro hearts flying away (vector circles)
      for (const h of this.introHearts) {
        ctx.fillStyle = `rgba(255, 64, 129, ${h.life})`;
        ctx.beginPath();
        ctx.arc(h.x, h.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderLevelScreen() {
    const ctx = this.ctx;
    const mapW = MAP_COLS * TILE_SIZE;
    const mapH = MAP_ROWS * TILE_SIZE;

    // Draw the high-resolution, realistic background image!
    let bgImg = Assets.images['meadow_bg'];
    if (LevelManager.meta.id === 3 || LevelManager.meta.id === 13) {
      bgImg = Assets.images['forest_bg'];
    } else if (LevelManager.meta.id === 7) {
      bgImg = Assets.images['snow_bg'];
    } else if (LevelManager.meta.id === 8) {
      bgImg = Assets.images['star_bg'];
    }

    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.drawImage(bgImg, 0, 0, mapW, mapH);
    } else {
      // Fallback solid green fill while loading
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(0, 0, mapW, mapH);
    }

    // Draw Floor Grid overlay (only for paths, water, stones, etc. to keep functionality)
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const tile = LevelManager.grid[r][c];
        if (tile === 'g') continue; // Let the gorgeous background show through!
        
        const dx = c * TILE_SIZE;
        const dy = r * TILE_SIZE;
        
        let sprite = 'tile_grass';
        if (tile === 'd') sprite = 'tile_dirt';
        else if (tile === 'w') sprite = 'tile_water';
        else if (tile === 's') sprite = 'tile_stone';
        else if (tile === 'o') sprite = 'tile_wood';
        else if (tile === 'x') sprite = 'tile_snow';
        
        if (tile === 'w') {
          Assets.drawWaterRipple(ctx, dx, dy, TILE_SIZE, TILE_SIZE, this.time);
        } else {
          Assets.draw(ctx, sprite, dx, dy, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Draw Bridges, Fences and Static Props
    for (const ent of LevelManager.entities) {
      if (ent.type === 'bridge') {
        const sprite = ent.repaired ? 'tile_wood' : 'tile_dirt';
        // fill rect of bridge
        for (let bx = 0; bx < ent.width; bx += TILE_SIZE) {
          Assets.draw(ctx, sprite, ent.x + bx, ent.y, TILE_SIZE, TILE_SIZE);
        }
        if (!ent.repaired) {
          // Draw broken wood markers
          ctx.fillStyle = '#795548';
          ctx.fillRect(ent.x + 10, ent.y + 10, 8, 8);
          ctx.fillRect(ent.x + ent.width - 18, ent.y + 20, 8, 8);
        }
      }
    }

    // Sort entities by Y coordinate to achieve proper depth layering (y-sorting)
    const drawables = [
      ...LevelManager.entities.filter(e => e.type !== 'bridge'),
      {
        x: this.player.x,
        y: this.player.y,
        size: this.player.size,
        sprite: this.player.sprite,
        type: 'player'
      }
    ];

    drawables.sort((a, b) => a.y - b.y);

    for (const d of drawables) {
      if (d.type === 'player') {
        // Draw Mochi shadow
        ctx.fillStyle = PALETTE['shadow'];
        ctx.beginPath();
        ctx.ellipse(d.x, d.y + 2, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Player Sprite
        Assets.draw(ctx, d.sprite, d.x - d.size/2, d.y - d.size + 4 + this.player.hopY, d.size, d.size);
      } else if (d.type === 'final_tree') {
        // Render giant Memory Tree
        Assets.drawTree(ctx, this.unlockedLevelIndex >= 14 ? 'blooming' : 'gray', d.x - 32, d.y - 80, 64, 96, this.time);
      } else if (d.type === 'bench') {
        Assets.draw(ctx, d.sprite, d.x - 24, d.y - 12, 48, 24);
      } else if (d.type === 'bench_occupied_1') {
        Assets.draw(ctx, 'bench', d.x - 24, d.y - 12, 48, 24);
        // Draw little cat and chick sitting on it
        Assets.draw(ctx, 'cat_sleep', d.x - 16, d.y - 18, 16, 16);
        Assets.draw(ctx, 'chick', d.x + 4, d.y - 14, 12, 12);
      } else if (d.type === 'bench_occupied_2') {
        Assets.draw(ctx, 'bench', d.x - 24, d.y - 12, 48, 24);
        // Draw owl and duck
        Assets.draw(ctx, 'owl', d.x - 16, d.y - 20, 16, 16);
        Assets.draw(ctx, 'mama_duck', d.x + 2, d.y - 22, 16, 16);
      } else {
        // Draw standard entity
        Assets.draw(ctx, d.sprite, d.x - d.size/2, d.y - d.size/2, d.size, d.size);

        // Draw glowing light overlays for firefly objects, lanterns, stars
        if (d.sprite === 'lantern' || d.sprite === 'glowing_flower' || d.type === 'hidden_memory' || d.type === 'fireplace') {
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          const grad = ctx.createRadialGradient(d.x, d.y, 2, d.x, d.y, 24);
          grad.addColorStop(0, 'rgba(255, 224, 130, 0.4)');
          grad.addColorStop(1, 'rgba(255, 224, 130, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(d.x, d.y, 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }
}

// Instantiate and start engine
const game = new GameEngine();
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  game.init();
} else {
  window.addEventListener('load', () => game.init());
}
