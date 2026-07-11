import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createBench } from '../engine/props.js';
import { createSnowman, createFireplaceHut, createMug, createPenguin, createVillageHouse } from '../engine/themeProps.js';

export class SnowflakeVillageLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [
      { speaker: 'Mochi', text: 'Brrrr...' },
      { speaker: 'Mochi', text: "Let's warm everyone up!" },
    ];
  }

  buildTasks() {
    return [
      { key: 'cocoa', label: 'Deliver Hot Chocolate', current: 0, target: 3 },
      { key: 'snowbunnies', label: 'Build Snow Bunnies', current: 0, target: 3 },
      { key: 'fireplaces', label: 'Light the Fireplaces', current: 0, target: 3 },
      { key: 'penguins', label: 'Help the Penguins', current: 0, target: 3 },
    ];
  }

  buildScene() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(46, 46, 32, 32), new THREE.MeshStandardMaterial({ color: 0xf3f7ff, roughness: 0.85 }));
    const pos = ground.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.random() * 0.06);
    ground.geometry.computeVertexNormals();
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    const houseSpots = [[-9, -8], [9, -8]];
    houseSpots.forEach(([x, z]) => {
      const h = createVillageHouse(0x9fd6e8);
      h.traverse((o) => { if (o.isMesh && o.material.color) o.material.color.offsetHSL(0, 0, 0.1); });
      h.position.set(x, 0, z);
      this.group.add(h);
      this.collision.add(x, z, 1.1);
    });

    for (let i = 0; i < 14; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.3 + this.rand() * 0.5, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
      s.position.set((this.rand() - 0.5) * 34, 0.15, (this.rand() - 0.5) * 34);
      s.castShadow = true; s.receiveShadow = true;
      this.group.add(s);
    }
    const bench = createBench();
    bench.traverse((o) => { if (o.isMesh) o.material.color.offsetHSL(0, -0.1, 0.15); });
    bench.position.set(0, 0, 6);
    this.group.add(bench);
    this.collision.add(0, 6, 0.9);

    this.particles.addSakuraField({ minX: -19, maxX: 19, minZ: -19, maxZ: 19, minY: 2, maxY: 9 }, 40); // reused as falling snow

    this._spawnCocoa();
    this._spawnSnowBunnies();
    this._spawnFireplaces();
    this._spawnPenguins();
    this._spawnMug();
  }

  _spawnCocoa() {
    const spots = [[-6, -3], [6, -3], [0, -10]];
    spots.forEach(([x, z]) => {
      const mug = createMug();
      mug.position.set(x, 0.4, z);
      this.group.add(mug);
      this.addTrigger(mug, x, z, 0.6, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(mug.position, 0xff9f45);
        this.chime();
        this.bumpTask('cocoa');
      });
    });
  }

  _spawnSnowBunnies() {
    const spots = [[-3, 3], [3, 3], [0, 10]];
    spots.forEach(([x, z]) => {
      const bunny = createSnowman();
      bunny.scale.setScalar(0.7);
      bunny.position.set(x, 0, z);
      this.group.add(bunny);
      this.collision.add(x, z, 0.4);
      this.addTrigger(bunny, x, z, 0.7, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(bunny.position.clone().add(new THREE.Vector3(0, 0.3, 0)), 0xffffff);
        this.pop();
        this.bumpTask('snowbunnies');
      });
    });
  }

  _spawnFireplaces() {
    const spots = [[-13, -3], [13, -3], [0, -14]];
    spots.forEach(([x, z]) => {
      const hut = createFireplaceHut();
      hut.position.set(x, 0, z);
      hut.traverse((o) => { if (o.isMesh) o.material.emissiveIntensity = 0; });
      const light = hut.children.find((c) => c.isLight);
      if (light) light.intensity = 0;
      this.group.add(hut);
      this.collision.add(x, z, 0.9);
      this.addTrigger(hut, x, z, 1.1, (entity) => {
        entity.done = true;
        hut.traverse((o) => { if (o.isMesh && o.material.emissive) o.material.emissiveIntensity = 1.4; });
        if (light) light.intensity = 1;
        this.particles.sparkleBurst(hut.position.clone().add(new THREE.Vector3(0, 0.5, 0.7)), 0xff9f45);
        this.chime();
        this.bumpTask('fireplaces');
      });
    });
  }

  _spawnPenguins() {
    const spots = [[-5, -12], [5, -12], [0, 4]];
    spots.forEach(([x, z]) => {
      const p = createPenguin();
      p.position.set(x, 0, z);
      this.group.add(p);
      this.addTrigger(p, x, z, 0.7, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(p.position, 0xbfe3ff);
        this.pop();
        this.bumpTask('penguins');
      });
    });
  }

  _spawnMug() {
    const mug = createMug();
    mug.scale.setScalar(1.3);
    mug.position.set(-9, 0.7, -8.9);
    this.group.add(mug);
    this.addTrigger(mug, -9, -8, 1, (entity) => {
      entity.done = true;
      this.particles.heartBurst(mug.position.clone().add(new THREE.Vector3(0, 0.3, 0)), 0xff8fab);
      this.say([
        { speaker: 'Letter', text: 'The warmest place has always been beside you.' },
        { speaker: 'Mochi', text: 'Some memories never get cold.' },
      ]);
    });
  }
}
