import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createBench, createGrassField } from '../engine/props.js';
import { createObservatoryDome, createTelescope, createStarPickup, createLantern } from '../engine/themeProps.js';

export class StarObservatoryLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [{ speaker: 'Mochi', text: 'Do you think every star remembers someone’s wish?' }];
  }

  buildTasks() {
    return [
      { key: 'stars', label: 'Collect Falling Stars', current: 0, target: 8 },
      { key: 'telescope', label: 'Repair the Telescope', current: 0, target: 1 },
      { key: 'constellation', label: 'Connect the Constellation', current: 0, target: 1 },
      { key: 'lanterns', label: 'Release Floating Lanterns', current: 0, target: 4 },
    ];
  }

  buildScene() {
    const ground = createGroundPatch(46, 0x6b6b9e);
    this.group.add(ground);

    const dome = createObservatoryDome();
    dome.position.set(0, 0, -10);
    this.group.add(dome);
    this.collision.add(0, -10, 1.8);

    const telescope = createTelescope();
    telescope.scale.setScalar(1.6);
    telescope.position.set(4, 2.1, -9);
    this.group.add(telescope);
    telescope.traverse((o) => { if (o.isMesh) o.material = o.material.clone(); });
    this.telescope = telescope;
    this.collision.add(4, -9, 0.6);

    const bench = createBench();
    bench.position.set(-5, 0, 4);
    this.group.add(bench);
    this.collision.add(-5, 4, 0.9);

    const grass = createGrassField({ minX: -21, maxX: 21, minZ: -21, maxZ: 21 }, 1800, 0x4a4a7a, [{ x: 0, z: -10, radius: 2.5 }]);
    this.group.add(grass);
    this.animated.push((dt, t) => grass.userData.update(t));

    this.fireflies = this.particles.addFireflyField({ minX: -18, maxX: 18, minZ: -18, maxZ: 18, minY: 0.4, maxY: 3 }, 22);

    this._spawnStars();
    this._spawnTelescopeTask();
    this._spawnConstellation();
    this._spawnLanterns();
  }

  _spawnStars() {
    const positions = [];
    let attempts = 0;
    while (positions.length < 8 && attempts < 300) {
      attempts++;
      const x = (this.rand() - 0.5) * 32;
      const z = (this.rand() - 0.5) * 32;
      if (Math.hypot(x, z + 10) < 3) continue;
      let ok = true;
      for (const p of positions) if (Math.hypot(p[0] - x, p[1] - z) < 2.5) { ok = false; break; }
      if (ok) positions.push([x, z]);
    }
    positions.forEach(([x, z]) => {
      const star = createStarPickup();
      star.position.set(x, 0.8 + this.rand() * 0.6, z);
      this.group.add(star);
      this.animated.push((dt, t) => { star.rotation.y += dt; star.position.y += Math.sin(t * 2 + x) * 0.002; });
      this.addAutoPickup(star, x, z, 0.5, () => {
        this.group.remove(star);
        this.particles.sparkleBurst(star.position, 0xfff2a8);
        this.chime();
        this.bumpTask('stars');
      });
    });
  }

  _spawnTelescopeTask() {
    this.addTrigger(this.telescope, 4, -9, 1.3, (entity) => {
      entity.done = true;
      this.particles.sparkleBurst(this.telescope.position, 0xc9b8e8);
      this.pop();
      this.bumpTask('telescope');
      this.say([{ speaker: 'Mochi', text: 'Some stars only shine for the right people.' }]);
    });
  }

  _spawnConstellation() {
    const group = new THREE.Group();
    const pts = [[-0.6, 0.3], [-0.2, 0.5], [0.2, 0.5], [0.6, 0.3], [0, -0.2]];
    const mat = new THREE.MeshStandardMaterial({ color: 0xfff2a8, emissive: 0xfff2a8, emissiveIntensity: 0.2 });
    for (const [x, y] of pts) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat);
      s.position.set(x, y, 0);
      group.add(s);
    }
    group.position.set(-8, 3.4, -14);
    this.group.add(group);
    this.addTrigger(group, -8, -14, 1.6, (entity) => {
      entity.done = true;
      mat.emissiveIntensity = 1.4;
      this.particles.heartBurst(group.position, 0xff8fab);
      this.chime();
      this.bumpTask('constellation');
      this.say([{ speaker: 'Mochi', text: 'For three seconds... it looked just like a heart.' }]);
    });
  }

  _spawnLanterns() {
    const spots = [[-10, 6], [10, 6], [-10, -4], [10, -4]];
    spots.forEach(([x, z]) => {
      const lantern = createLantern(true);
      lantern.position.set(x, 0, z);
      this.group.add(lantern);
      this.addTrigger(lantern, x, z, 0.8, (entity) => {
        entity.done = true;
        const start = performance.now();
        this.animated.push((dt) => {
          const p = Math.min((performance.now() - start) / 3000, 1);
          lantern.position.y = p * 4;
          lantern.traverse((o) => { if (o.isMesh) o.material.opacity = 1 - p; });
        });
        lantern.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; } });
        this.particles.sparkleBurst(lantern.position, 0xffd166);
        this.pop();
        this.bumpTask('lanterns');
      });
    });
  }
}
