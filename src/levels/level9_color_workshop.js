import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createCherryTree, createGrassField, createBench } from '../engine/props.js';
import { createVillageHouse, createEasel, createRainbowArc } from '../engine/themeProps.js';

export class ColorWorkshopLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [{ speaker: 'Mochi', text: 'Looks like someone forgot the colors.' }];
  }

  buildTasks() {
    return [
      { key: 'houses', label: 'Paint the Houses', current: 0, target: 3 },
      { key: 'murals', label: 'Restore the Murals', current: 0, target: 2 },
      { key: 'butterflies', label: 'Color the Butterflies', current: 0, target: 3 },
      { key: 'bridge', label: 'Repair the Rainbow Bridge', current: 0, target: 1 },
    ];
  }

  buildScene() {
    const ground = createGroundPatch(46, 0xaaaaaa);
    this.group.add(ground);

    const treeColors = [0x9a9a9a, 0x9a9a9a, 0x9a9a9a];
    for (let i = 0; i < 8; i++) {
      const t = createCherryTree(0x9a9a9a);
      const ang = (i / 8) * Math.PI * 2;
      t.position.set(Math.cos(ang) * 19, 0, Math.sin(ang) * 19);
      this.group.add(t);
      this.collision.add(t.position.x, t.position.z, 0.6);
    }
    this._giantTree = createCherryTree(0x9a9a9a);
    this._giantTree.scale.setScalar(1.5);
    this._giantTree.position.set(0, 0, -14);
    this.group.add(this._giantTree);
    this.collision.add(0, -14, 1.2);

    const bench = createBench();
    bench.traverse((o) => { if (o.isMesh) o.material.color.setHex(0x9a9a9a); });
    bench.position.set(6, 0, 4);
    this.group.add(bench);
    this.collision.add(6, 4, 0.9);

    const grass = createGrassField({ minX: -21, maxX: 21, minZ: -21, maxZ: 21 }, 1800, 0x8a8a8a, []);
    this.group.add(grass);
    this.animated.push((dt, t) => grass.userData.update(t));

    this._spawnHouses();
    this._spawnMurals();
    this._spawnButterflies();
    this._spawnBridge();
    this._spawnHiddenCanvas();
  }

  _spawnHouses() {
    const spots = [[-9, -4, 0xff8fab], [9, -4, 0x7fd8e8], [0, -10, 0xffd166]];
    spots.forEach(([x, z, color]) => {
      const house = createVillageHouse(0x9a9a9a);
      house.traverse((o) => { if (o.isMesh) o.material.color.setHex(0x9a9a9a); });
      house.position.set(x, 0, z);
      this.group.add(house);
      this.collision.add(x, z, 1.1);
      this.addTrigger(house, x, z, 1.3, (entity) => {
        entity.done = true;
        house.traverse((o) => { if (o.isMesh) o.material.color.setHex(color); });
        this.particles.sparkleBurst(house.position.clone().add(new THREE.Vector3(0, 1, 0)), color);
        this.chime();
        this.bumpTask('houses');
      });
    });
  }

  _spawnMurals() {
    const spots = [[-14, 0.9, -2, 0xff6fa5], [14, 0.9, -2, 0xffd166]];
    spots.forEach(([x, y, z, color]) => {
      const mural = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.4), new THREE.MeshStandardMaterial({ color: 0x9a9a9a, side: THREE.DoubleSide }));
      mural.position.set(x, y, z);
      mural.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
      this.group.add(mural);
      this.addTrigger(mural, x, z, 1.2, (entity) => {
        entity.done = true;
        mural.material.color.setHex(color);
        mural.material.emissive.setHex(color);
        mural.material.emissiveIntensity = 0.3;
        this.particles.sparkleBurst(mural.position, color);
        this.chime();
        this.bumpTask('murals');
      });
    });
  }

  _spawnButterflies() {
    const colors = [0xff6fa5, 0x7fd8e8, 0xffd166];
    const spots = [[-5, 1.4, 3], [5, 1.4, 3], [0, 1.6, 8]];
    spots.forEach(([x, y, z], i) => {
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, side: THREE.DoubleSide });
      const b = new THREE.Group();
      const w1 = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), wingMat);
      w1.position.x = -0.08;
      const w2 = w1.clone();
      w2.position.x = 0.08;
      b.add(w1, w2);
      b.position.set(x, y, z);
      this.group.add(b);
      this.animated.push((dt, t) => {
        b.position.y = y + Math.sin(t * 3 + i) * 0.15;
        b.rotation.y = Math.sin(t * 2 + i) * 0.5;
      });
      this.addTrigger(b, x, z, 1, (entity) => {
        entity.done = true;
        wingMat.color.setHex(colors[i]);
        this.particles.sparkleBurst(b.position, colors[i]);
        this.pop();
        this.bumpTask('butterflies');
      });
    });
  }

  _spawnBridge() {
    const bridge = createRainbowArc();
    bridge.traverse((o) => { if (o.isMesh) { o.material.opacity = 0.15; o.material.color.setHex(0x9a9a9a); } });
    bridge.position.set(0, 0, 14);
    this.group.add(bridge);
    this.addTrigger(bridge, 0, 14, 3, (entity) => {
      entity.done = true;
      const colors = [0xff6b6b, 0xffb347, 0xffe066, 0x8fd694, 0x7fd8e8, 0xa78bfa];
      bridge.children.forEach((c, i) => { c.material.opacity = 0.85; c.material.color.setHex(colors[i % colors.length]); });
      this.particles.sparkleBurst(bridge.position, 0xffd166);
      this.chime();
      this.bumpTask('bridge');
    });
  }

  _spawnHiddenCanvas() {
    const easel = createEasel();
    easel.position.set(-4, 0, -8);
    this.group.add(easel);
    const canvas = easel.children[0];
    canvas.material = canvas.material.clone();
    this.addTrigger(easel, -4, -8, 1, (entity) => {
      entity.done = true;
      canvas.material.color.setHex(0xffe3ec);
      canvas.material.emissive = new THREE.Color(0xffb6d9);
      canvas.material.emissiveIntensity = 0.3;
      this.particles.sparkleBurst(easel.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xffb6d9);
      this.say([{ speaker: 'Mochi', text: "That's a beautiful picture..." }]);
    });
  }
}
