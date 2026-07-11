import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createGrassField, createBench } from '../engine/props.js';
import { createFestivalTent, createPlushie, createBalloon, createLantern, createCake } from '../engine/themeProps.js';
import { createChick } from '../characters/critters.js';

export class FestivalOfSmilesLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [
      { speaker: 'Mochi', text: "I... wasn't even playing." },
      { speaker: 'Mochi', text: '...but I guess I\'ll take it!' },
    ];
  }

  buildTasks() {
    return [
      { key: 'games', label: 'Win Carnival Games', current: 0, target: 3 },
      { key: 'children', label: 'Help Children Find Parents', current: 0, target: 3 },
      { key: 'lanterns', label: 'Decorate Lantern Street', current: 0, target: 5 },
      { key: 'cake', label: 'Finish the Festival Cake', current: 0, target: 1 },
    ];
  }

  buildScene() {
    const ground = createGroundPatch(46, 0xffe0ec);
    this.group.add(ground);

    const tentSpots = [[-8, -4, 0xff6fa5], [8, -4, 0x7fd8e8], [0, -10, 0xffd166]];
    tentSpots.forEach(([x, z, c]) => {
      const tent = createFestivalTent(c);
      tent.position.set(x, 0, z);
      this.group.add(tent);
      this.collision.add(x, z, 0.9);
    });

    for (let i = 0; i < 6; i++) {
      const b = createBalloon([0xff6b6b, 0xffd166, 0x7fd8e8, 0xa78bfa][i % 4]);
      b.position.set((this.rand() - 0.5) * 30, 0, (this.rand() - 0.5) * 30);
      this.group.add(b);
      this.animated.push((dt, t) => { b.position.y = Math.sin(t + i) * 0.1; });
    }
    const bench = createBench();
    bench.position.set(-4, 0, 8);
    this.group.add(bench);
    this.collision.add(-4, 8, 0.9);

    const grass = createGrassField({ minX: -21, maxX: 21, minZ: -21, maxZ: 21 }, 1600, 0xffc2dd, [{ x: -8, z: -4, radius: 1.3 }, { x: 8, z: -4, radius: 1.3 }, { x: 0, z: -10, radius: 1.3 }]);
    this.group.add(grass);
    this.animated.push((dt, t) => grass.userData.update(t));
    this.particles.addSakuraField({ minX: -19, maxX: 19, minZ: -19, maxZ: 19, minY: 0, maxY: 8 }, 26);

    this._spawnGames();
    this._spawnChildren();
    this._spawnLanternStreet();
    this._spawnCake();
    this._spawnPlushShop();
  }

  _spawnGames() {
    const spots = [[-8, -2], [8, -2], [0, -8]];
    spots.forEach(([x, z]) => {
      const marker = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 16), new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.4 }));
      marker.rotation.x = Math.PI / 2;
      marker.position.set(x, 0.4, z);
      this.group.add(marker);
      this.addTrigger(marker, x, z, 0.9, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(marker.position, 0xffe066);
        this.chime();
        this.bumpTask('games');
      });
    });
  }

  _spawnChildren() {
    const spots = [[-3, 2], [3, 2], [0, 6]];
    spots.forEach(([x, z]) => {
      const child = createChick();
      child.scale.setScalar(1.6);
      child.position.set(x, 0, z);
      this.group.add(child);
      this.animated.push((dt, t) => child.userData.update(dt, t + x));
      this.addTrigger(child, x, z, 0.7, (entity) => {
        entity.done = true;
        this.particles.heartBurst(child.position, 0xff8fab);
        this.pop();
        this.bumpTask('children');
      });
    });
  }

  _spawnLanternStreet() {
    const spots = [[-12, 4], [-6, 6], [0, 8], [6, 6], [12, 4]];
    spots.forEach(([x, z]) => {
      const lantern = createLantern(false);
      lantern.traverse((o) => { if (o.isMesh && o.material.emissive) { o.material = o.material.clone(); o.material.emissiveIntensity = 0; } });
      lantern.position.set(x, 0, z);
      this.group.add(lantern);
      this.addTrigger(lantern, x, z, 0.8, (entity) => {
        entity.done = true;
        lantern.traverse((o) => { if (o.isMesh) o.material.emissiveIntensity = 1.3; });
        this.particles.sparkleBurst(lantern.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xffd166);
        this.pop();
        this.bumpTask('lanterns');
      });
    });
  }

  _spawnCake() {
    const cake = createCake();
    cake.position.set(-2, 0, -6);
    this.group.add(cake);
    this.addTrigger(cake, -2, -6, 1, (entity) => {
      entity.done = true;
      this.particles.sparkleBurst(cake.position.clone().add(new THREE.Vector3(0, 0.4, 0)), 0xffd166);
      this.chime();
      this.bumpTask('cake');
    });
  }

  _spawnPlushShop() {
    const plush = createPlushie();
    plush.scale.setScalar(1.4);
    plush.position.set(10, 0, 10);
    this.group.add(plush);
    this.addTrigger(plush, 10, 10, 0.9, (entity) => {
      entity.done = true;
      this.particles.heartBurst(plush.position.clone().add(new THREE.Vector3(0, 0.3, 0)), 0xff8fab);
      this.say([{ speaker: 'Letter', text: 'I hope this little bunny reminds you that someone is always cheering for you.' }, { speaker: 'Mochi', text: "I'd keep this forever." }]);
    });
  }
}
