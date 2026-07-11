import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createBench } from '../engine/props.js';
import { createCloudPlatform, createDreamBubble, createRainbowArc } from '../engine/themeProps.js';

export class DreamIslandsLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [
      { speaker: 'Mochi', text: "Dreams don't always have to make sense." },
      { speaker: 'Mochi', text: '...they just have to make you smile.' },
    ];
  }

  buildTasks() {
    return [
      { key: 'bubbles', label: 'Collect Dream Bubbles', current: 0, target: 6 },
      { key: 'spirits', label: 'Wake the Cloud Spirits', current: 0, target: 3 },
      { key: 'bridges', label: 'Rebuild Rainbow Bridges', current: 0, target: 2 },
      { key: 'feathers', label: 'Catch Floating Feathers', current: 0, target: 4 },
    ];
  }

  buildScene() {
    const ground = createGroundPatch(46, 0xdcecff);
    this.group.add(ground);

    for (let i = 0; i < 16; i++) {
      const cp = createCloudPlatform(1 + this.rand() * 1.2);
      cp.position.set((this.rand() - 0.5) * 34, 2 + this.rand() * 5, (this.rand() - 0.5) * 34);
      this.group.add(cp);
      this.animated.push((dt, t) => { cp.position.y += Math.sin(t * 0.6 + i) * 0.002; });
    }
    const bench = createBench();
    bench.traverse((o) => { if (o.isMesh) o.material.color.offsetHSL(0, 0, 0.1); });
    bench.position.set(0, 0, 6);
    this.group.add(bench);
    this.collision.add(0, 6, 0.9);

    this.particles.addSakuraField({ minX: -19, maxX: 19, minZ: -19, maxZ: 19, minY: 1, maxY: 9 }, 30);

    this._spawnBubbles();
    this._spawnSpirits();
    this._spawnBridges();
    this._spawnFeathers();
    this._spawnSpecialBubble();
  }

  _spawnBubbles() {
    const positions = [];
    let attempts = 0;
    while (positions.length < 6 && attempts < 300) {
      attempts++;
      const x = (this.rand() - 0.5) * 32;
      const z = (this.rand() - 0.5) * 32;
      let ok = true;
      for (const p of positions) if (Math.hypot(p[0] - x, p[1] - z) < 3) { ok = false; break; }
      if (ok) positions.push([x, z]);
    }
    positions.forEach(([x, z]) => {
      const bubble = createDreamBubble();
      bubble.position.set(x, 1, z);
      this.group.add(bubble);
      this.animated.push((dt, t) => { bubble.position.y = 1 + Math.sin(t * 1.5 + x) * 0.2; });
      this.addAutoPickup(bubble, x, z, 0.5, () => {
        this.group.remove(bubble);
        this.particles.sparkleBurst(bubble.position, 0xbfe3ff);
        this.chime();
        this.bumpTask('bubbles');
      });
    });
  }

  _spawnSpirits() {
    const spots = [[-8, -6], [8, -6], [0, -12]];
    spots.forEach(([x, z]) => {
      const spirit = createDreamBubble();
      spirit.scale.setScalar(1.6);
      spirit.position.set(x, 1.2, z);
      this.group.add(spirit);
      this.addTrigger(spirit, x, z, 0.9, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(spirit.position, 0xffffff);
        this.pop();
        this.bumpTask('spirits');
      });
    });
  }

  _spawnBridges() {
    const spots = [[-4, 12], [4, 12]];
    spots.forEach(([x, z]) => {
      const bridge = createRainbowArc();
      bridge.scale.setScalar(0.3);
      bridge.traverse((o) => { if (o.isMesh) o.material.opacity = 0.2; });
      bridge.position.set(x, 0, z);
      this.group.add(bridge);
      this.addTrigger(bridge, x, z, 1.2, (entity) => {
        entity.done = true;
        bridge.traverse((o) => { if (o.isMesh) o.material.opacity = 0.85; });
        this.particles.sparkleBurst(bridge.position, 0xffd166);
        this.chime();
        this.bumpTask('bridges');
      });
    });
  }

  _spawnFeathers() {
    const spots = [[-10, 4], [10, 4], [-6, -14], [6, -14]];
    spots.forEach(([x, z], i) => {
      const feather = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
      feather.position.set(x, 1.4, z);
      this.group.add(feather);
      this.animated.push((dt, t) => { feather.position.y = 1.4 + Math.sin(t * 1.8 + i) * 0.3; feather.rotation.z = Math.sin(t + i) * 0.6; });
      this.addAutoPickup(feather, x, z, 0.6, () => {
        this.group.remove(feather);
        this.particles.sparkleBurst(feather.position, 0xffffff);
        this.pop();
        this.bumpTask('feathers');
      });
    });
  }

  _spawnSpecialBubble() {
    const bubble = createDreamBubble();
    bubble.scale.setScalar(2.2);
    bubble.position.set(0, 1.6, -18);
    this.group.add(bubble);
    this.animated.push((dt, t) => { bubble.position.y = 1.6 + Math.sin(t) * 0.15; });
    this.addTrigger(bubble, 0, -18, 1.4, (entity) => {
      entity.done = true;
      this.particles.heartBurst(bubble.position, 0xffb6d9);
      const start = performance.now();
      this.animated.push((dt) => {
        const p = Math.min((performance.now() - start) / 4000, 1);
        bubble.position.y = 1.6 + p * 3;
        bubble.traverse((o) => { if (o.isMesh) o.material.opacity = 0.5 * (1 - p); });
      });
      this.say([{ speaker: 'Mochi', text: "Some moments don't need words." }]);
    });
  }
}
