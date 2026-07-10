import '../style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { setupLighting, initFog, setFogRange } from './engine/lighting.js';
import { DayNightCycle } from './engine/dayNightCycle.js';
import { GameCamera } from './engine/camera.js';
import { CollisionWorld } from './engine/collision.js';
import { ParticleSystem } from './engine/particles.js';
import { createGirlCharacter } from './characters/girl.js';
import { createMochi } from './characters/mochi.js';
import { Dialogue } from './systems/dialogue.js';
import { Audio } from './systems/audio.js';
import { Save } from './systems/save.js';
import { Hud } from './systems/hud.js';
import { STATE } from './systems/state.js';
import { WorldMap } from './worldmap/worldmap.js';
import { BlossomMeadowLevel } from './levels/level1_blossom_meadow.js';
import { LEVEL_DATA, getLevel } from './levels/levelData.js';

const SUPPORTED_LEVELS = new Set([1]);

class Game {
  constructor() {
    this.uiRoot = document.getElementById('ui-root');
    this.canvas = document.getElementById('scene-canvas');

    this.clock = new THREE.Clock();
    this.state = STATE.START_SCREEN;

    this._buildBootFade();
    this._buildStartScreen();
    this._initThree();

    this.hud = new Hud(this.uiRoot);
    Dialogue.mount(this.uiRoot);

    this.collision = new CollisionWorld();
    this.particles = new ParticleSystem(this.scene);

    this.player = createGirlCharacter();
    this.player.root.position.set(-1.5, 0, 8);
    this.scene.add(this.player.root);
    this.playerYaw = Math.PI;
    this.playerState = { position: new THREE.Vector3(-1.5, 0, 8), yaw: Math.PI };

    this.mochi = createMochi();
    this.mochi.root.position.set(-2.6, 0, 8.6);
    this.scene.add(this.mochi.root);

    this.worldMap = new WorldMap(this.scene, this.uiRoot);
    this.worldMap.onNodeClick = (id) => this._onMapNodeClick(id);

    this.keys = new Set();
    this._bindInput();

    // Adaptive quality: sample real frame rate for the first couple seconds and
    // step down bloom/shadow/pixel-ratio once if the device can't keep up, so
    // "smooth" wins over "maximum fidelity" on weaker phones/laptops.
    this._perfSamples = 0;
    this._perfAccum = 0;
    this._perfDowngraded = false;

    this.level = null;
    this.levelId = 1;

    // The world exists and is alive (day/night, petals, windmill, critters) behind the
    // start screen from the very first frame, instead of a blank card on a flat gradient.
    this._preloadOpeningScene();

    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
    window.addEventListener('resize', () => this._onResize());
  }

  _buildBootFade() {
    const fade = document.createElement('div');
    fade.className = 'boot-fade';
    document.getElementById('app').appendChild(fade);
    requestAnimationFrame(() => {
      setTimeout(() => {
        fade.style.opacity = '0';
        setTimeout(() => fade.remove(), 1400);
      }, 250);
    });
  }

  _initThree() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    initFog(this.scene, 0xd8ecff, 22, 70);
    const lights = setupLighting(this.scene);
    this._levelFog = { near: 22, far: 70 };
    this._mapFog = { near: 55, far: 160 };

    this.gameCamera = new GameCamera(window.innerWidth / window.innerHeight);

    // Real day/night cycle: one full 24h loop every 15 real minutes, driving sun position/color,
    // sky gradient, stars, moon, fog tint, and exposure — starts mid-morning.
    this.dayNight = new DayNightCycle(this.scene, lights, this.renderer, { dayDurationSeconds: 900, startT: 0.32 });

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.gameCamera.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.5, 0.82);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  _preloadOpeningScene() {
    setFogRange(this.scene, this._levelFog.near, this._levelFog.far);
    this.level = new BlossomMeadowLevel(this.scene, this.particles, this.collision, this.hud);
    this.level.onComplete = () => this._onLevelComplete();
    this.level.load();
    this._resetPlayerToSpawn();
    this.hud.setLevelBadge(1);
    this.hud.updateTasks(this.level.tasks);
    this.gameCamera.startOrbit([1, 1.2, -2], 16, 8.5, 0.045);
  }

  _resetPlayerToSpawn() {
    this.player.root.position.set(-1.5, 0, 8);
    this.playerState.position.set(-1.5, 0, 8);
    this.playerYaw = Math.PI;
    this.mochi.root.position.set(-2.6, 0, 8.6);
  }

  _onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.gameCamera.setAspect(w / h);
  }

  _buildStartScreen() {
    const el = document.createElement('div');
    el.className = 'start-screen';
    el.innerHTML = `
      <div class="start-logo-row">
        <div class="start-heart">💗</div>
        <div class="start-game-title">Love Quest</div>
        <div class="start-game-subtitle">The Lost Memories</div>
      </div>
      <div class="start-card">
        <div class="start-tagline">"...I've been waiting for you."</div>
        <button class="start-btn">Begin the Journey</button>
        <div class="start-hint">🌸 A cozy story adventure, made for you</div>
      </div>
    `;
    document.getElementById('app').appendChild(el);
    el.querySelector('.start-btn').addEventListener('click', () => {
      Audio.resume();
      Audio.playPop();
      el.remove();
      this._startGame();
    });
    this.startScreenEl = el;
  }

  _bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'KeyE' && this.state === STATE.LEVEL_PLAY) this._tryInteract();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    // Minimal touch controls for mobile
    const touch = document.createElement('div');
    touch.className = 'touch-controls';
    touch.innerHTML = `
      <div class="dpad">
        <button class="dpad-btn dpad-up" data-k="KeyW">▲</button>
        <button class="dpad-btn dpad-down" data-k="KeyS">▼</button>
        <button class="dpad-btn dpad-left" data-k="KeyA">◀</button>
        <button class="dpad-btn dpad-right" data-k="KeyD">▶</button>
      </div>
      <div class="action-buttons"><button class="action-btn" id="touch-interact">✋</button></div>
    `;
    this.uiRoot.appendChild(touch);
    touch.querySelectorAll('.dpad-btn').forEach((btn) => {
      const k = btn.dataset.k;
      const on = (e) => { e.preventDefault(); this.keys.add(k); };
      const off = (e) => { e.preventDefault(); this.keys.delete(k); };
      btn.addEventListener('touchstart', on);
      btn.addEventListener('touchend', off);
      btn.addEventListener('mousedown', on);
      btn.addEventListener('mouseup', off);
    });
    touch.querySelector('#touch-interact').addEventListener('click', () => this._tryInteract());
  }

  async _startGame() {
    this.hud.setLoading(0, true);
    let p = 0;
    const step = () => {
      p += 26 + Math.random() * 18;
      this.hud.setLoading(Math.min(p, 100), true);
      if (p < 100) setTimeout(step, 70);
      else setTimeout(() => {
        this.hud.setLoading(100, false);
        Audio.startBGM(1);
        this._beginArrivalSequence(getLevel(1));
      }, 150);
    };
    step();
  }

  /** Full (re)build of a level's scene — used when jumping in from the world map. */
  _enterLevel(id) {
    this.levelId = id;
    const meta = getLevel(id);
    this.worldMap.hide();
    setFogRange(this.scene, this._levelFog.near, this._levelFog.far);

    if (this.level) this.level.unload();
    this.level = new BlossomMeadowLevel(this.scene, this.particles, this.collision, this.hud);
    this.level.onComplete = () => this._onLevelComplete();
    this.level.load();
    this.level.group.visible = true;

    this._resetPlayerToSpawn();
    this.hud.setLevelBadge(id);
    this.hud.updateTasks(this.level.tasks);
    Audio.startBGM(1);

    this._beginArrivalSequence(meta);
  }

  _beginArrivalSequence(meta) {
    this.state = STATE.LEVEL_ARRIVAL;
    this.gameCamera.snapTo(new THREE.Vector3(-1.5, 14, 26), new THREE.Vector3(-1.5, 0, 8));
    this.gameCamera.playPath(
      [
        { pos: [-1.5, 14, 26], look: [-1.5, 2, 8] },
        { pos: [10, 8, 4], look: [4, 1, -2] },
        { pos: [-6, 6, 2], look: [-2, 1, 6] },
        { pos: [-3.6, 4, 11.4], look: [-1.5, 1.4, 8] },
      ],
      4.2,
      () => this._onArrivalFlythroughDone(meta)
    );
  }

  _onArrivalFlythroughDone(meta) {
    this.hud.showLevelTitle(meta.name.toUpperCase(), meta.theme);
    this.hud.showGameplayUI();
    setTimeout(() => {
      this.level.playArrivalDialogue(() => { this.state = STATE.LEVEL_PLAY; });
    }, 1200);
  }

  _tryInteract() {
    if (this.state !== STATE.LEVEL_PLAY || !this.level || Dialogue.isOpen) return;
    const p = this.playerState.position;
    const target = this.level.findInteractable(p.x, p.z, 1.3);
    if (target) target.onInteract(target);
  }

  _onLevelComplete() {
    this.state = STATE.LEVEL_COMPLETE;
    Audio.playHeartCrack();
    this.particles.heartBurst(this.player.root.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xff4d94);
    this.hud.memoryRestoredNotif();
    setTimeout(() => {
      this.level.playCompletionDialogue(() => this._transitionToMap());
    }, 900);
  }

  _transitionToMap() {
    this.state = STATE.TRANSITION_TO_MAP;
    this.hud.hideGameplayUI();
    Audio.stopBGM();

    const from = this.gameCamera.camera.position.clone();
    this.gameCamera.playPath(
      [
        { pos: [from.x, from.y, from.z], look: [-1.5, 1, 4] },
        { pos: [-6, 18, 18], look: [-10, 0, 10] },
        { pos: [-2, 30, 24], look: [-2, 0, 4] },
      ],
      2.2,
      () => {
        if (this.level) this.level.group.visible = false;
        setFogRange(this.scene, this._mapFog.near, this._mapFog.far);
        this.worldMap.show(this.gameCamera);
        const prevUnlocked = Save.getUnlockedLevel();
        this.worldMap.setUnlocked(prevUnlocked);
        Save.setUnlockedLevel(prevUnlocked + 1);
        const newUnlocked = Save.getUnlockedLevel();
        this.state = STATE.WORLD_MAP;
        if (newUnlocked !== prevUnlocked) {
          this.worldMap.startHop(prevUnlocked, newUnlocked, () => {
            this.worldMap.setUnlocked(newUnlocked);
          });
        }
      }
    );
  }

  _enterMapAtCurrent() {
    this.state = STATE.WORLD_MAP;
    this.hud.hideGameplayUI();
    this.worldMap.show(this.gameCamera);
    this.worldMap.setUnlocked(Save.getUnlockedLevel());
  }

  _onMapNodeClick(id) {
    if (this.state !== STATE.WORLD_MAP) return;
    const unlocked = Save.getUnlockedLevel();
    if (id > unlocked) {
      this.hud.notify('Locked', 'Restore the memory before this one first.', '🔒');
      return;
    }
    if (SUPPORTED_LEVELS.has(id)) {
      this._enterLevel(id);
      return;
    }
    this.worldMap.startHop(this.worldMap.currentId, id, () => {
      this.worldMap.setUnlocked(unlocked);
      this.hud.notify('More memories coming soon...', `${getLevel(id).name} is still being written.`, '🚧');
    });
  }

  _updatePlayer(dt) {
    const fwd = new THREE.Vector3();
    this.gameCamera.camera.getWorldDirection(fwd);
    fwd.y = 0; fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).negate();

    let mx = 0, mz = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) { mx += fwd.x; mz += fwd.z; }
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) { mx -= fwd.x; mz -= fwd.z; }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) { mx += right.x; mz += right.z; }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) { mx -= right.x; mz -= right.z; }

    const moving = (mx !== 0 || mz !== 0) && this.state === STATE.LEVEL_PLAY && !Dialogue.isOpen;
    if (moving) {
      const len = Math.hypot(mx, mz) || 1;
      mx /= len; mz /= len;
      const speed = 4.6;
      let nx = this.playerState.position.x + mx * speed * dt;
      let nz = this.playerState.position.z + mz * speed * dt;
      const resolved = this.collision.resolve(nx, nz, 0.4);
      this.playerState.position.x = resolved.x;
      this.playerState.position.z = resolved.z;

      const targetYaw = Math.atan2(mx, mz);
      let diff = targetYaw - this.playerYaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.playerYaw += diff * Math.min(1, dt * 10);
    }

    this.player.root.position.copy(this.playerState.position);
    this.player.root.rotation.y = this.playerYaw;
    this.player.update(dt, moving);
    this.playerState.yaw = this.playerYaw;

    // Mochi trails behind and to the side
    const behind = this.playerState.position.clone().addScaledVector(fwd, -1.5).addScaledVector(right, -0.7);
    const dist = this.mochi.root.position.distanceTo(behind);
    const mochiMoving = dist > 0.08;
    this.mochi.root.position.lerp(behind, Math.min(1, dt * 4));
    if (mochiMoving) {
      const lookDir = behind.clone().sub(this.mochi.root.position);
      if (lookDir.lengthSq() > 0.001) this.mochi.root.rotation.y = Math.atan2(lookDir.x, lookDir.z) + Math.PI;
    }
    this.mochi.update(dt, mochiMoving && moving);

    if (this.state === STATE.LEVEL_PLAY && this.level) {
      this.level.checkAutoPickups(this.playerState.position.x, this.playerState.position.z);
      const near = this.level.findInteractable(this.playerState.position.x, this.playerState.position.z, 1.3);
      this.hud.showInteractPrompt(!!near && !Dialogue.isOpen);
    }
  }

  _updatePerfGuard(rawDt) {
    if (this._perfDowngraded || this.state === STATE.START_SCREEN) return;
    this._perfSamples++;
    this._perfAccum += rawDt;
    if (this._perfSamples < 90) return;
    const avgFps = this._perfSamples / this._perfAccum;
    this._perfDowngraded = true;
    if (avgFps < 40) {
      this.bloomPass.enabled = false;
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1);
    }
  }

  _loop() {
    requestAnimationFrame(this._loop);
    const rawDt = this.clock.getDelta();
    this._updatePerfGuard(rawDt);
    const dt = Math.min(rawDt, 0.05);
    const t = this.clock.elapsedTime;

    this.dayNight.update(dt, this.playerState.position);
    this.particles.update(dt);
    if (this.level && this.level.group.visible) {
      this.level.update(dt, t);
      if (this.level.fireflies) this.level.fireflies.mesh.visible = this.dayNight.isNight();
    }

    if (this.state === STATE.START_SCREEN) {
      this.player.update(dt, false);
      this.mochi.update(dt, false);
    } else {
      this._updatePlayer(dt);
      if (this.state === STATE.WORLD_MAP) this.worldMap.update(dt, this.renderer);
    }
    this.gameCamera.update(dt, this.playerState);

    this.composer.render();
  }
}

const game = new Game();
if (import.meta.env.DEV) window.__game = game;
