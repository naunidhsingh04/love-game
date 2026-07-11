import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createCherryTree, createGrassField, createBench } from '../engine/props.js';
import { createInstrument, createBell, createVillageHouse } from '../engine/themeProps.js';

export class MelodyVillageLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [
      { speaker: 'Mochi', text: 'Looks like the village forgot its music...' },
      { speaker: 'Mochi', text: "Let's help everyone find it again." },
    ];
  }

  buildTasks() {
    return [
      { key: 'instruments', label: 'Restore the Instruments', current: 0, target: 4 },
      { key: 'song', label: "Help the Children's Song", current: 0, target: 1 },
      { key: 'bells', label: 'Ring the Magical Bells', current: 0, target: 5 },
    ];
  }

  buildScene() {
    const ground = createGroundPatch(46, 0xd6c9e8);
    this.group.add(ground);

    const houseSpots = [[-10, -6, 0xff8fab], [10, -6, 0x7fd8e8], [-10, 6, 0xffd166], [10, 6, 0xa78bfa]];
    houseSpots.forEach(([x, z, c]) => {
      const h = createVillageHouse(c);
      h.position.set(x, 0, z);
      this.group.add(h);
      this.collision.add(x, z, 1.1);
    });

    for (let i = 0; i < 8; i++) {
      const t = createCherryTree(0xe8b6d9);
      const ang = (i / 8) * Math.PI * 2;
      t.position.set(Math.cos(ang) * 20, 0, Math.sin(ang) * 20);
      this.group.add(t);
      this.collision.add(t.position.x, t.position.z, 0.6);
    }
    const bench = createBench();
    bench.position.set(0, 0, 8);
    this.group.add(bench);
    this.collision.add(0, 8, 0.9);

    const grass = createGrassField({ minX: -21, maxX: 21, minZ: -21, maxZ: 21 }, 2200, 0xc9d68a, [{ x: -10, z: -6, radius: 1.5 }, { x: 10, z: -6, radius: 1.5 }, { x: -10, z: 6, radius: 1.5 }, { x: 10, z: 6, radius: 1.5 }]);
    this.group.add(grass);
    this.animated.push((dt, t) => grass.userData.update(t));
    this.particles.addSakuraField({ minX: -19, maxX: 19, minZ: -19, maxZ: 19, minY: 0, maxY: 8 }, 24);

    this._spawnInstruments();
    this._spawnSongChildren();
    this._spawnBells();
    this._spawnMusicSheet();
  }

  _spawnInstruments() {
    const spots = [[-3, -2], [3, -2], [-3, 2], [3, 2]];
    spots.forEach(([x, z]) => {
      const inst = createInstrument();
      inst.position.set(x, 0, z);
      this.group.add(inst);
      this.collision.add(x, z, 0.6);
      this.addTrigger(inst, x, z, 0.9, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(inst.position.clone().add(new THREE.Vector3(0, 0.4, 0)), 0xffd166);
        this.chime();
        this.bumpTask('instruments');
      });
    });
  }

  _spawnSongChildren() {
    const notes = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: 0xff8fab, emissive: 0xff8fab, emissiveIntensity: 0.6 }));
      n.position.set(i * 0.3 - 0.45, 0.5 + Math.sin(i) * 0.15, 0);
      notes.add(n);
    }
    notes.position.set(0, 0, -4);
    this.group.add(notes);
    this.animated.push((dt, t) => { notes.children.forEach((n, i) => { n.position.y = 0.5 + Math.sin(t * 2 + i) * 0.15; }); });
    this.addTrigger(notes, 0, -4, 1.2, (entity) => {
      entity.done = true;
      this.particles.sparkleBurst(notes.position, 0xff8fab);
      this.chime();
      this.bumpTask('song');
      this.say([{ speaker: 'Mochi', text: 'The final tune is one that reminds you both of a special memory.' }]);
    });
  }

  _spawnBells() {
    const spots = [[-6, -10], [6, -10], [-6, 10], [6, 10], [0, -16]];
    spots.forEach(([x, z]) => {
      const bell = createBell();
      bell.position.set(x, 1.2, z);
      this.group.add(bell);
      this.addTrigger(bell, x, z, 0.9, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(bell.position, 0xffd166);
        this.pop();
        this.bumpTask('bells');
      });
    });
  }

  _spawnMusicSheet() {
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0xfff8f0, emissive: 0xfff8f0, emissiveIntensity: 0, side: THREE.DoubleSide }));
    sheet.position.set(-10, 0.9, -6.9);
    this.group.add(sheet);
    this.addTrigger(sheet, -10, -6, 1, (entity) => {
      entity.done = true;
      sheet.material.emissiveIntensity = 0.6;
      this.particles.sparkleBurst(sheet.position, 0xffe6f0);
      this.say([
        { speaker: 'Letter', text: 'Every beautiful memory has its own melody.' },
        { speaker: 'Mochi', text: 'Maybe... this one reminds someone of you.' },
      ]);
    });
  }
}
