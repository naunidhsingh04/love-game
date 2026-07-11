import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createCherryTree, createGrassField, createBench } from '../engine/props.js';
import { createLantern, createKeepsakeChest } from '../engine/themeProps.js';

export class MemoryGroveLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [{ speaker: 'Mochi', text: 'Every lantern holds someone’s favorite memory.' }];
  }

  buildTasks() {
    return [
      { key: 'lanterns', label: 'Light the Forgotten Lanterns', current: 0, target: 8 },
      { key: 'keepsakes', label: 'Return the Keepsakes', current: 0, target: 3 },
      { key: 'fragments', label: 'Find Memory Fragments', current: 0, target: 4 },
      { key: 'photos', label: 'Restore Old Photographs', current: 0, target: 2 },
    ];
  }

  buildScene() {
    const ground = createGroundPatch(46, 0x6a8f5e);
    this.group.add(ground);

    for (let i = 0; i < 22; i++) {
      const ang = this.rand() * Math.PI * 2;
      const r = 4 + this.rand() * 20;
      const t = createCherryTree(0x8a9e6a);
      t.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r);
      t.scale.setScalar(1 + this.rand() * 0.4);
      this.group.add(t);
      this.collision.add(t.position.x, t.position.z, 0.6);
    }
    const bench = createBench();
    bench.position.set(0, 0, -8);
    this.group.add(bench);
    this.collision.add(0, -8, 0.9);
    this._memoryBench = bench;

    const grass = createGrassField({ minX: -21, maxX: 21, minZ: -21, maxZ: 21 }, 1800, 0x5a7f4e, []);
    this.group.add(grass);
    this.animated.push((dt, t) => grass.userData.update(t));

    this.fireflies = this.particles.addFireflyField({ minX: -19, maxX: 19, minZ: -19, maxZ: 19, minY: 0.4, maxY: 3 }, 26);
    this.particles.addSakuraField({ minX: -19, maxX: 19, minZ: -19, maxZ: 19, minY: 0, maxY: 8 }, 22);

    this._spawnLanterns();
    this._spawnKeepsakes();
    this._spawnFragments();
    this._spawnPhotos();
    this._spawnMemoryBench();
  }

  _spawnLanterns() {
    const positions = [];
    let attempts = 0;
    while (positions.length < 8 && attempts < 300) {
      attempts++;
      const x = (this.rand() - 0.5) * 30;
      const z = (this.rand() - 0.5) * 30;
      if (Math.hypot(x, z + 8) < 2.5) continue;
      let ok = true;
      for (const p of positions) if (Math.hypot(p[0] - x, p[1] - z) < 3) { ok = false; break; }
      if (ok) positions.push([x, z]);
    }
    positions.forEach(([x, z]) => {
      const lantern = createLantern(false);
      lantern.traverse((o) => { if (o.isMesh && o.material.emissive) { o.material = o.material.clone(); o.material.emissiveIntensity = 0; } });
      lantern.position.set(x, 0, z);
      this.group.add(lantern);
      this.addTrigger(lantern, x, z, 0.8, (entity) => {
        entity.done = true;
        lantern.traverse((o) => { if (o.isMesh) o.material.emissiveIntensity = 1.3; });
        this.particles.sparkleBurst(lantern.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xffd166);
        this.pop();
        const c = this.bumpTask('lanterns');
        if (c === 8) this.say([{ speaker: 'Mochi', text: 'The whole grove is glowing now.' }]);
      });
    });
  }

  _spawnKeepsakes() {
    const spots = [[-10, 6], [10, 6], [0, 14]];
    spots.forEach(([x, z]) => {
      const chest = createKeepsakeChest();
      chest.position.set(x, 0, z);
      this.group.add(chest);
      this.addTrigger(chest, x, z, 0.7, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(chest.position, 0xffb6d9);
        this.chime();
        this.bumpTask('keepsakes');
        this.say([{ speaker: 'Mochi', text: 'Some things become priceless because of who gave them.' }]);
      });
    });
  }

  _spawnFragments() {
    const spots = [[-6, -2], [6, -2], [-4, 10], [4, -14]];
    spots.forEach(([x, z]) => {
      const frag = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xffe066, emissiveIntensity: 1 }));
      frag.position.set(x, 0.6, z);
      this.group.add(frag);
      this.animated.push((dt, t) => { frag.rotation.y += dt; });
      this.addAutoPickup(frag, x, z, 0.5, () => {
        this.group.remove(frag);
        this.particles.sparkleBurst(frag.position, 0xffe066);
        this.pop();
        this.bumpTask('fragments');
      });
    });
  }

  _spawnPhotos() {
    const spots = [[-14, -4], [14, -4]];
    spots.forEach(([x, z]) => {
      const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), new THREE.MeshStandardMaterial({ color: 0xd8d0c0, side: THREE.DoubleSide }));
      photo.position.set(x, 1, z);
      this.group.add(photo);
      this.addTrigger(photo, x, z, 0.9, (entity) => {
        entity.done = true;
        photo.material.color.setHex(0xfff8f0);
        photo.material.emissive = new THREE.Color(0xffe6d0);
        photo.material.emissiveIntensity = 0.2;
        this.particles.sparkleBurst(photo.position, 0xfff2a8);
        this.chime();
        this.bumpTask('photos');
      });
    });
  }

  _spawnMemoryBench() {
    this.addTrigger(this._memoryBench, 0, -8, 1.2, (entity) => {
      entity.done = true;
      this.say([{ speaker: 'Letter', text: 'No matter where life takes us... I hope we always find our way back to each other.' }]);
    });
  }
}
