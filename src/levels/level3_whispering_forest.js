import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createCherryTree, createRock, createGrassField, createBench } from '../engine/props.js';
import { createMushroom, createOwl, createHedgehog, createMouseCritter } from '../engine/themeProps.js';

export class WhisperingForestLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [
      { speaker: 'Mochi', text: 'Listen...' },
      { speaker: 'Mochi', text: 'This forest whispers stories.' },
    ];
  }

  buildTasks() {
    return [
      { key: 'mushrooms', label: 'Gather Glowing Mushrooms', current: 0, target: 8 },
      { key: 'squirrels', label: 'Feed the Squirrels', current: 0, target: 3 },
      { key: 'owl', label: 'Wake the Sleepy Owl', current: 0, target: 1 },
      { key: 'hedgehog', label: 'Help the Hedgehog', current: 0, target: 1 },
    ];
  }

  buildScene() {
    const ground = createGroundPatch(50, 0x5a8f5a);
    this.group.add(ground);

    for (let i = 0; i < 26; i++) {
      const ang = this.rand() * Math.PI * 2;
      const r = 3 + this.rand() * 21;
      const t = createCherryTree(0x7a9e6a);
      t.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r);
      t.scale.setScalar(1 + this.rand() * 0.5);
      this.group.add(t);
      this.collision.add(t.position.x, t.position.z, 0.65);
    }
    for (let i = 0; i < 8; i++) {
      const rock = createRock(0.6 + this.rand() * 0.5);
      rock.position.set((this.rand() - 0.5) * 30, 0, (this.rand() - 0.5) * 30);
      this.group.add(rock);
    }
    const bench = createBench();
    bench.position.set(4, 0, 6);
    bench.rotation.y = -0.4;
    this.group.add(bench);
    this.collision.add(4, 6, 0.9);

    const grass = createGrassField({ minX: -22, maxX: 22, minZ: -22, maxZ: 22 }, 2000, 0x4c7a4a, []);
    this.group.add(grass);
    this.animated.push((dt, t) => grass.userData.update(t));

    this.particles.addSakuraField({ minX: -20, maxX: 20, minZ: -20, maxZ: 20, minY: 0, maxY: 7 }, 20);
    this.fireflies = this.particles.addFireflyField({ minX: -18, maxX: 18, minZ: -18, maxZ: 18, minY: 0.3, maxY: 2 }, 18);

    this._spawnMushrooms();
    this._spawnSquirrels();
    this._spawnOwl();
    this._spawnHedgehog();
    this._spawnAncientTree();
  }

  _spawnMushrooms() {
    const positions = [];
    let attempts = 0;
    while (positions.length < 8 && attempts < 300) {
      attempts++;
      const x = (this.rand() - 0.5) * 34;
      const z = (this.rand() - 0.5) * 34;
      if (Math.hypot(x, z) < 2.5) continue;
      let ok = true;
      for (const p of positions) if (Math.hypot(p[0] - x, p[1] - z) < 2.2) { ok = false; break; }
      if (ok) positions.push([x, z]);
    }
    positions.forEach(([x, z]) => {
      const m = createMushroom(true);
      m.position.set(x, 0, z);
      this.group.add(m);
      this.addAutoPickup(m, x, z, 0.4, () => {
        this.group.remove(m);
        this.particles.sparkleBurst(m.position, 0x9be8ff);
        this.chime();
        const c = this.bumpTask('mushrooms');
        if (c === 8) this.say([{ speaker: 'Mochi', text: 'That should light the whole path home.' }]);
      });
    });
  }

  _spawnSquirrels() {
    const spots = [[-8, 5], [10, -6], [-4, -12]];
    spots.forEach(([x, z]) => {
      const squirrel = createMouseCritter();
      squirrel.position.set(x, 0, z);
      this.group.add(squirrel);
      this.animated.push((dt, t) => { squirrel.position.y = Math.abs(Math.sin(t * 4 + x)) * 0.04; });
      this.addTrigger(squirrel, x, z, 0.7, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(squirrel.position, 0xffd166);
        this.pop();
        this.bumpTask('squirrels');
      });
    });
  }

  _spawnOwl() {
    const owl = createOwl();
    owl.position.set(-14, 2.6, 3);
    this.group.add(owl);
    this.addTrigger(owl, -14, 3, 1.2, (entity) => {
      entity.done = true;
      this.say([
        { speaker: 'Owl', text: 'Five more minutes...' },
      ], () => {
        this.pop();
        this.bumpTask('owl');
      });
    });
  }

  _spawnHedgehog() {
    const hh = createHedgehog();
    hh.position.set(9, 0, 10);
    this.group.add(hh);
    this.addTrigger(hh, 9, 10, 0.7, (entity) => {
      entity.done = true;
      this.particles.sparkleBurst(hh.position, 0xffb6d9);
      this.pop();
      this.bumpTask('hedgehog');
      this.say([{ speaker: 'Mochi', text: 'All curled up, safe and warm.' }]);
    });
  }

  _spawnAncientTree() {
    const tree = createCherryTree(0x9a7a5a);
    tree.position.set(0, 0, -16);
    tree.scale.setScalar(1.8);
    this.group.add(tree);
    this.collision.add(0, -16, 1.2);
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: 0xfff2a8, emissive: 0xfff2a8, emissiveIntensity: 0 }));
      eye.position.set(side * 0.2, 3.4, -16 + 1.1);
      this.group.add(eye);
      tree.userData['eye' + side] = eye;
    }
    this.addTrigger(tree, 0, -16, 2, (entity) => {
      entity.done = true;
      for (const side of [-1, 1]) tree.userData['eye' + side].material.emissiveIntensity = 1.4;
      this.say([{ speaker: 'Tree', text: 'He talks about you more than you think.' }]);
    });
  }
}
