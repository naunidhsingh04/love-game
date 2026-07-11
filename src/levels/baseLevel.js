import * as THREE from 'three';
import { Dialogue } from '../systems/dialogue.js';
import { Audio } from '../systems/audio.js';

export function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Shared machinery for every level: task tracking, interactable registry, proximity
 * auto-pickup, dialogue helpers, and the animate/unload lifecycle. A subclass only needs to
 * implement buildTasks() and buildScene(), and set this.arrivalLines / this.completionLines.
 */
export class BaseLevel {
  constructor(scene, particles, collision, hud) {
    this.scene = scene;
    this.particles = particles;
    this.collision = collision;
    this.hud = hud;
    this.group = new THREE.Group();
    this.interactables = [];
    this.animated = [];
    this.completed = false;
    this._milestoneFired = new Set();
    this.tasks = [];
    this.arrivalLines = [];
    this.completionLines = [
      { speaker: 'Mochi', text: 'One memory restored.' },
      { speaker: 'Mochi', text: "Let's see where the next one is hiding." },
    ];
    this.rand = seededRand(this.seed ?? 11);
  }

  load() {
    this.scene.add(this.group);
    this.collision.clear();
    this.tasks = this.buildTasks();
    this.buildScene();
  }

  buildTasks() { return []; }
  buildScene() {}

  task(key) { return this.tasks.find((t) => t.key === key); }

  addInteractable(entity) {
    this.interactables.push(entity);
    return entity;
  }

  /** Auto-pickup entities (flowers, keepsakes) collected just by walking near them. */
  addAutoPickup(object3D, x, z, radius, onPick) {
    const entity = { object3D, x, z, radius, auto: true, onInteract: () => onPick(entity) };
    this.interactables.push(entity);
    return entity;
  }

  /** Interact-triggered entities (critters, machines) requiring the player to press E. */
  addTrigger(object3D, x, z, radius, onInteract) {
    const entity = { object3D, x, z, radius, done: false, onInteract: () => onInteract(entity) };
    this.interactables.push(entity);
    return entity;
  }

  findInteractable(px, pz, range = 1.1) {
    let best = null;
    let bestDist = range;
    for (const e of this.interactables) {
      if (e.auto || e.done) continue;
      const d = Math.hypot(px - e.x, pz - e.z);
      if (d < bestDist) { bestDist = d; best = e; }
    }
    return best;
  }

  checkAutoPickups(px, pz) {
    for (const e of [...this.interactables]) {
      if (!e.auto) continue;
      const d = Math.hypot(px - e.x, pz - e.z);
      if (d < e.radius + 0.5) {
        this.interactables.splice(this.interactables.indexOf(e), 1);
        e.onInteract(e);
      }
    }
  }

  bumpTask(key, amount = 1) {
    const t = this.task(key);
    if (!t) return 0;
    t.current = Math.min(t.target, t.current + amount);
    this.hud.updateTasks(this.tasks);
    this._checkComplete();
    return t.current;
  }

  milestone(id, lines) {
    if (this._milestoneFired.has(id)) return;
    this._milestoneFired.add(id);
    Dialogue.startSequence(lines);
  }

  say(lines, onDone) {
    Dialogue.startSequence(lines, onDone);
  }

  chime() { Audio.playChime(); }
  pop() { Audio.playPop(); }

  _checkComplete() {
    if (this.completed) return;
    if (this.tasks.length && this.tasks.every((t) => t.current >= t.target)) {
      this.completed = true;
      if (this.onComplete) this.onComplete();
    }
  }

  playArrivalDialogue(onDone) {
    Dialogue.startSequence(this.arrivalLines, onDone);
  }

  playCompletionDialogue(onDone) {
    Dialogue.startSequence(this.completionLines, onDone);
  }

  update(dt, t) {
    for (const fn of this.animated) fn(dt, t);
  }

  unload() {
    this.scene.remove(this.group);
    this.interactables = [];
    this.animated = [];
  }
}
