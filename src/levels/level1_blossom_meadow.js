import * as THREE from 'three';
import { createGroundPatch, createCherryTree, createFlower, createBench, createWindmill, createPond, createFencePost, createRock, createMailbox, createGrassField } from '../engine/props.js';
import { createCat, createChick } from '../characters/critters.js';
import { Dialogue } from '../systems/dialogue.js';
import { Audio } from '../systems/audio.js';

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export class BlossomMeadowLevel {
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

    this.tasks = [
      { key: 'flowers', label: 'Collect 20 Pink Flowers', current: 0, target: 20 },
      { key: 'chicks', label: 'Help the Lost Chicks', current: 0, target: 3 },
      { key: 'cats', label: 'Pet Every Cat', current: 0, target: 3 },
      { key: 'feed', label: 'Feed Mochi', current: 0, target: 1 },
    ];
  }

  load() {
    this.scene.add(this.group);
    this.collision.clear();

    const ground = createGroundPatch(50, 0x9fdf9a);
    this.group.add(ground);

    const rand = seededRand(7);
    // Cherry trees ringing the meadow
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const r = 18 + rand() * 4;
      const t = createCherryTree(0xffb6d9);
      t.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r);
      t.scale.setScalar(0.9 + rand() * 0.4);
      this.group.add(t);
      this.collision.add(t.position.x, t.position.z, 0.6);
    }

    // Windmill landmark
    const windmill = createWindmill();
    windmill.position.set(9, 0, -9);
    this.group.add(windmill);
    this.collision.add(9, -9, 1.6);
    this.animated.push((dt) => windmill.userData.spin(dt));

    // Pond
    const pond = createPond(3.6);
    pond.position.set(-9, 0, -8);
    this.group.add(pond);
    this.collision.add(-9, -8, 3.4);
    this.animated.push((dt, t) => pond.userData.ripple(t));

    // Benches
    for (const [x, z, ry] of [[-6, 6, 0.4], [7, 6, -0.6]]) {
      const bench = createBench();
      bench.position.set(x, 0, z);
      bench.rotation.y = ry;
      this.group.add(bench);
      this.collision.add(x, z, 0.9);
    }

    // Mailbox near spawn (nod to the opening cutscene mailbox)
    const mailbox = createMailbox();
    mailbox.position.set(-2, 0, 9);
    this.group.add(mailbox);
    this.collision.add(-2, 9, 0.3);

    // Fence line + rocks for texture
    for (let i = -4; i <= 4; i++) {
      const post = createFencePost();
      post.position.set(-20, 0, i * 1.2 - 14);
      this.group.add(post);
    }
    for (let i = 0; i < 6; i++) {
      const rock = createRock(0.8 + rand() * 0.6);
      rock.position.set((rand() - 0.5) * 30, 0, (rand() - 0.5) * 30);
      this.group.add(rock);
    }

    this._spawnFlowers(rand);
    this._spawnChicks();
    this._spawnCats();
    this._spawnFeedBowl();

    const grass = createGrassField(
      { minX: -23, maxX: 23, minZ: -23, maxZ: 23 },
      2600,
      0x6bb35a,
      [
        { x: 9, z: -9, radius: 2.2 },
        { x: -9, z: -8, radius: 4.2 },
        { x: -6, z: 6, radius: 1.4 },
        { x: 7, z: 6, radius: 1.4 },
        { x: -2, z: 9, radius: 1 },
        { x: 2, z: 6.5, radius: 1 },
      ]
    );
    this.group.add(grass);
    this.animated.push((dt, t) => grass.userData.update(t));

    this.particles.addSakuraField({ minX: -22, maxX: 22, minZ: -22, maxZ: 22, minY: 0, maxY: 9 }, 36);
    this.fireflies = this.particles.addFireflyField({ minX: -20, maxX: 20, minZ: -20, maxZ: 20, minY: 0.4, maxY: 2 }, 16);
    this.fireflies.mesh.visible = false;
  }

  _spawnFlowers(rand) {
    const positions = [];
    let attempts = 0;
    while (positions.length < 19 && attempts < 400) {
      attempts++;
      const x = (rand() - 0.5) * 32;
      const z = (rand() - 0.5) * 32;
      if (Math.hypot(x - 9, z + 9) < 3) continue;
      if (Math.hypot(x + 9, z + 8) < 5) continue;
      if (Math.hypot(x + 2, z - 9) < 1.5) continue;
      let ok = true;
      for (const p of positions) if (Math.hypot(p[0] - x, p[1] - z) < 1.6) { ok = false; break; }
      if (ok) positions.push([x, z]);
    }

    positions.forEach((p, i) => this._addFlower(p[0], p[1], false));
    // The hidden flower: tucked near the fence line, glowing, found last.
    this._addFlower(-17, -11, true);
  }

  _addFlower(x, z, isHidden) {
    const flower = createFlower(isHidden ? 2 : null, isHidden);
    flower.position.set(x, 0, z);
    if (isHidden) flower.scale.setScalar(1.3);
    this.group.add(flower);
    this.interactables.push({
      object3D: flower, x, z, radius: 0.45, auto: true, kind: 'flower',
      onInteract: () => this._onFlowerPicked(flower, isHidden),
    });
  }

  _onFlowerPicked(flower, isHidden) {
    this.group.remove(flower);
    this.particles.sparkleBurst(flower.position, 0xffe066);
    Audio.playChime();
    const t = this._task('flowers');
    t.current++;
    this.hud.updateTasks(this.tasks);
    this.hud.bumpResource('flowers', 1);

    if (isHidden) {
      Dialogue.startSequence([
        { speaker: 'Mochi', text: 'This flower waited for someone.' },
        { speaker: 'Mochi', text: 'Someone who always notices the little things.' },
        { speaker: 'Letter', text: 'Just a little flower for the prettiest girl. 🌸' },
      ]);
    } else if (t.current % 5 === 0 && !this._milestoneFired.has(t.current)) {
      this._milestoneFired.add(t.current);
      Dialogue.startSequence([{ speaker: 'Mochi', text: "You're making this place beautiful already!" }]);
    }
    this._checkComplete();
  }

  _spawnChicks() {
    const spots = [[-14, 4], [16, -3], [4, 14]];
    spots.forEach(([x, z]) => {
      const chick = createChick();
      chick.position.set(x, 0, z);
      this.group.add(chick);
      this.animated.push((dt, t) => chick.userData.update(dt, t + x));
      this.interactables.push({
        object3D: chick, x, z, radius: 0.7, kind: 'chick', found: false,
        onInteract: (entity) => this._onChickFound(entity, chick),
      });
    });
  }

  _onChickFound(entity, chick) {
    if (entity.found) return;
    entity.found = true;
    this.group.remove(chick);
    this.particles.sparkleBurst(chick.position, 0xffe066);
    Audio.playPop();
    const t = this._task('chicks');
    t.current++;
    this.hud.updateTasks(this.tasks);
    if (t.current < t.target) {
      Dialogue.startSequence([{ speaker: 'Mochi', text: 'Cheep!' }]);
    } else {
      Dialogue.startSequence([
        { speaker: 'Mochi', text: 'Cheep!' },
        { speaker: 'Mother Chick', text: 'Thank you for bringing my little ones home.' },
      ]);
    }
    this._checkComplete();
  }

  _spawnCats() {
    const spots = [[-6.6, 5.3], [7.6, 5.3], [-3, -3]];
    spots.forEach(([x, z]) => {
      const cat = createCat();
      cat.position.set(x, 0, z);
      cat.rotation.y = Math.random() * Math.PI * 2;
      this.group.add(cat);
      this.animated.push((dt, t) => cat.userData.update(dt, t + x));
      this.interactables.push({
        object3D: cat, x, z, radius: 0.7, kind: 'cat', petted: false,
        onInteract: (entity) => this._onCatPetted(entity, cat),
      });
    });
  }

  _onCatPetted(entity, cat) {
    if (entity.petted) return;
    entity.petted = true;
    this.particles.heartBurst(new THREE.Vector3(cat.position.x, 0.4, cat.position.z), 0xff8fab);
    Audio.playChime();
    const t = this._task('cats');
    t.current++;
    this.hud.updateTasks(this.tasks);
    Dialogue.startSequence([{ speaker: 'Mochi', text: "Looks like you've made a new friend." }]);
    this._checkComplete();
  }

  _spawnFeedBowl() {
    const bowlMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.2, 0.14, 12),
      new THREE.MeshStandardMaterial({ color: 0xffb6c9, roughness: 0.6 })
    );
    const carrot = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.32, 8),
      new THREE.MeshStandardMaterial({ color: 0xff9f45, roughness: 0.5 })
    );
    carrot.rotation.x = Math.PI;
    carrot.position.set(0, 0.22, 0);
    const group = new THREE.Group();
    group.add(bowlMesh, carrot);
    group.position.set(2, 0, 6.5);
    group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.group.add(group);

    this.interactables.push({
      object3D: group, x: 2, z: 6.5, radius: 0.8, kind: 'feed', done: false,
      onInteract: (entity) => this._onFeedMochi(entity, group),
    });
  }

  _onFeedMochi(entity, group) {
    if (entity.done) return;
    entity.done = true;
    this.particles.sparkleBurst(group.position, 0xff9f45);
    Audio.playPop();
    const t = this._task('feed');
    t.current = 1;
    this.hud.updateTasks(this.tasks);
    Dialogue.startSequence([
      { speaker: 'Mochi', text: 'Best carrot ever.' },
      { speaker: 'Mochi', text: "...Don't tell the others." },
    ]);
    this._checkComplete();
  }

  _task(key) {
    return this.tasks.find((t) => t.key === key);
  }

  _checkComplete() {
    if (this.completed) return;
    const done = this.tasks.every((t) => t.current >= t.target);
    if (done) {
      this.completed = true;
      if (this.onComplete) this.onComplete();
    }
  }

  /** Called once, after the arrival flythrough finishes and the player gains control. */
  playArrivalDialogue(onDone) {
    Dialogue.startSequence([
      { speaker: 'Mochi', text: 'Uh...' },
      { speaker: 'Mochi', text: "Let's pretend you didn't see that." },
      { speaker: 'Mochi', text: "Hi! I'm Mochi!" },
      { speaker: 'Mochi', text: "I'm so happy you're here!" },
    ], onDone);
  }

  playCompletionDialogue(onDone) {
    Dialogue.startSequence([
      { speaker: 'Mochi', text: 'One memory restored.' },
      { speaker: 'Mochi', text: "Let's see where the next one is hiding." },
    ], onDone);
  }

  /** Nearest interactable within range that still needs interacting (excludes auto-pickup flowers). */
  findInteractable(px, pz, range = 1.1) {
    let best = null;
    let bestDist = range;
    for (const e of this.interactables) {
      if (e.auto) continue;
      if (e.found || e.petted || e.done) continue;
      const d = Math.hypot(px - e.x, pz - e.z);
      if (d < bestDist) { bestDist = d; best = e; }
    }
    return best;
  }

  /** Auto-pickup flowers when the player walks close enough. */
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

  update(dt, t) {
    for (const fn of this.animated) fn(dt, t);
  }

  unload() {
    this.scene.remove(this.group);
    this.interactables = [];
    this.animated = [];
  }
}
