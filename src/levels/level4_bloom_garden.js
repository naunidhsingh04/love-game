import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createCherryTree, createFlower, createGrassField, createBench, createRock } from '../engine/props.js';
import { createFountain, createBee, createGiantSunflower, createRainbowArc } from '../engine/themeProps.js';

export class BloomGardenLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [{ speaker: 'Mochi', text: 'Even flowers need a little love.' }];
  }

  buildTasks() {
    return [
      { key: 'water', label: 'Water the Flowers', current: 0, target: 8 },
      { key: 'bees', label: 'Guide the Bees Home', current: 0, target: 3 },
      { key: 'fountain', label: 'Repair the Fountain', current: 0, target: 1 },
      { key: 'sunflower', label: 'Grow the Giant Sunflower', current: 0, target: 1 },
    ];
  }

  buildScene() {
    const ground = createGroundPatch(46, 0x9fe0a0);
    this.group.add(ground);

    const fountain = createFountain();
    fountain.position.set(0, 0, 0);
    this.group.add(fountain);
    this.collision.add(0, 0, 1.4);
    this.addTrigger(fountain, 0, 0, 1.8, (entity) => {
      entity.done = true;
      this.particles.sparkleBurst(new THREE.Vector3(0, 1, 0), 0x9fd6e8);
      this.chime();
      this.bumpTask('fountain');
      this.say([{ speaker: 'Mochi', text: 'Listen to it trickle again!' }]);
    });

    const rainbow = createRainbowArc();
    rainbow.position.set(0, 0, -14);
    this.group.add(rainbow);
    this.rainbow = rainbow;

    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      const t = createCherryTree(0xffd6e8);
      t.position.set(Math.cos(ang) * 19, 0, Math.sin(ang) * 19);
      t.scale.setScalar(0.9 + this.rand() * 0.3);
      this.group.add(t);
      this.collision.add(t.position.x, t.position.z, 0.6);
    }
    for (let i = 0; i < 5; i++) {
      const rock = createRock(0.6 + this.rand() * 0.4);
      rock.position.set((this.rand() - 0.5) * 30, 0, (this.rand() - 0.5) * 30);
      this.group.add(rock);
    }
    const bench = createBench();
    bench.position.set(-6, 0, 4);
    this.group.add(bench);
    this.collision.add(-6, 4, 0.9);

    const grass = createGrassField({ minX: -21, maxX: 21, minZ: -21, maxZ: 21 }, 2400, 0x7fd68a, [{ x: 0, z: 0, radius: 2 }]);
    this.group.add(grass);
    this.animated.push((dt, t) => grass.userData.update(t));

    this.particles.addSakuraField({ minX: -19, maxX: 19, minZ: -19, maxZ: 19, minY: 0, maxY: 8 }, 30);

    this._spawnFlowersToWater();
    this._spawnBees();
    this._spawnSunflower();
  }

  _spawnFlowersToWater() {
    const positions = [];
    let attempts = 0;
    while (positions.length < 7 && attempts < 300) {
      attempts++;
      const x = (this.rand() - 0.5) * 30;
      const z = (this.rand() - 0.5) * 30;
      if (Math.hypot(x, z) < 3) continue;
      let ok = true;
      for (const p of positions) if (Math.hypot(p[0] - x, p[1] - z) < 2) { ok = false; break; }
      if (ok) positions.push([x, z]);
    }
    positions.forEach(([x, z]) => this._addWaterFlower(x, z, false));
    this._addWaterFlower(12, 12, true); // the shy flower that needs two visits
  }

  _addWaterFlower(x, z, special) {
    const flower = createFlower(special ? 0 : null, false);
    flower.position.set(x, 0, z);
    flower.scale.setScalar(special ? 0.01 : 1);
    this.group.add(flower);
    const state = { visits: 0 };
    this.addTrigger(flower, x, z, 0.6, (entity) => {
      if (special) {
        state.visits++;
        if (state.visits === 1) {
          this.pop();
          this.say([{ speaker: 'Mochi', text: 'This one seems shy. Try again?' }]);
          return;
        }
        entity.done = true;
        flower.scale.setScalar(1);
        this.particles.sparkleBurst(flower.position, 0xff6fa5);
        this.chime();
        this.bumpTask('water');
        this.say([{ speaker: 'Letter', text: "If I had to choose one flower... I'd still choose the one that reminds me of you." }, { speaker: 'Mochi', text: 'Some flowers bloom only for the right person.' }]);
        return;
      }
      entity.done = true;
      this.particles.sparkleBurst(flower.position, 0x8fd694);
      this.pop();
      this.bumpTask('water');
    });
  }

  _spawnBees() {
    const spots = [[-9, -8], [8, -10], [0, 8]];
    spots.forEach(([x, z]) => {
      const bee = createBee();
      bee.position.set(x, 1, z);
      this.group.add(bee);
      this.animated.push((dt, t) => {
        bee.position.set(x + Math.sin(t * 2 + x) * 0.4, 1 + Math.sin(t * 5) * 0.1, z + Math.cos(t * 2 + z) * 0.4);
        bee.rotation.y += dt * 4;
      });
      this.addTrigger(bee, x, z, 1.1, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(bee.position, 0xffd166);
        this.pop();
        this.bumpTask('bees');
      });
    });
  }

  _spawnSunflower() {
    const sunflower = createGiantSunflower();
    sunflower.position.set(-14, 0, -12);
    this.group.add(sunflower);
    this.collision.add(-14, -12, 0.6);
    this.addTrigger(sunflower, -14, -12, 1.5, (entity) => {
      entity.done = true;
      const start = performance.now();
      this.animated.push((dt, t) => {
        const p = Math.min((performance.now() - start) / 2000, 1);
        sunflower.scale.setScalar(0.05 + p * 0.95);
      });
      this.chime();
      this.bumpTask('sunflower');
      this.say([{ speaker: 'Mochi', text: 'Wow... look at it grow!' }]);
    });
  }
}
