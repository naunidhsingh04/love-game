import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createCherryTree, createBench, createRock, createGrassField, createFencePost } from '../engine/props.js';
import { createDuckling } from '../characters/critters.js';

export class RiverOfWishesLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [
      { speaker: 'Mochi', text: 'Every wish starts somewhere.' },
      { speaker: 'Mochi', text: "Maybe we'll find one meant for you." },
    ];
  }

  buildTasks() {
    return [
      { key: 'bridges', label: 'Repair the Bridges', current: 0, target: 2 },
      { key: 'ducklings', label: 'Help the Ducklings', current: 0, target: 3 },
      { key: 'boats', label: 'Decorate Paper Boats', current: 0, target: 4 },
      { key: 'fish', label: 'Feed the Fish', current: 0, target: 5 },
    ];
  }

  buildScene() {
    const ground = createGroundPatch(50, 0x9fdccb);
    this.group.add(ground);

    const riverMat = new THREE.MeshStandardMaterial({ color: 0x6fc8e6, roughness: 0.2, metalness: 0.15, transparent: true, opacity: 0.88 });
    const river = new THREE.Mesh(new THREE.PlaneGeometry(9, 46, 20, 20), riverMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, 0.03, 0);
    river.userData.basePositions = river.geometry.attributes.position.array.slice();
    river.userData.ripple = (t) => {
      const pos = river.geometry.attributes.position;
      const base = river.userData.basePositions;
      for (let i = 0; i < pos.count; i++) {
        pos.setZ(i, Math.sin(base[i * 3] * 1.1 + t * 1.3) * 0.04 + Math.cos(base[i * 3 + 1] * 0.7 + t) * 0.03);
      }
      pos.needsUpdate = true;
    };
    this.group.add(river);
    this.animated.push((dt, t) => river.userData.ripple(t));

    for (let side of [-1, 1]) {
      for (let i = -3; i <= 3; i++) {
        const t = createCherryTree(0x9fe0d6);
        t.position.set(side * (7 + this.rand() * 4), 0, i * 6 + this.rand() * 2);
        t.scale.setScalar(0.85 + this.rand() * 0.3);
        this.group.add(t);
        this.collision.add(t.position.x, t.position.z, 0.6);
      }
    }

    const bench = createBench();
    bench.position.set(-6, 0, 12);
    bench.rotation.y = 0.6;
    this.group.add(bench);
    this.collision.add(-6, 12, 0.9);

    for (let i = 0; i < 5; i++) {
      const rock = createRock(0.7 + this.rand() * 0.5);
      rock.position.set((this.rand() - 0.5) * 4.5, 0, (this.rand() - 0.5) * 40);
      this.group.add(rock);
    }

    const grass = createGrassField({ minX: -20, maxX: 20, minZ: -22, maxZ: 22 }, 2200, 0x6bc99a, [{ x: 0, z: 0, radius: 5 }]);
    this.group.add(grass);
    this.animated.push((dt, t) => grass.userData.update(t));

    this._spawnBridges();
    this._spawnDucklings();
    this._spawnBoats();
    this._spawnFish();
    this._spawnWishBottle();

    this.particles.addSakuraField({ minX: -18, maxX: 18, minZ: -20, maxZ: 20, minY: 0, maxY: 8 }, 24);
  }

  _spawnBridges() {
    const spots = [-12, 10];
    spots.forEach((z, idx) => {
      const group = new THREE.Group();
      const plankMat = new THREE.MeshStandardMaterial({ color: 0x8a6a55, roughness: 0.8 });
      for (let i = -3; i <= 3; i++) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 8.5), plankMat);
        plank.position.set(i * 0.55, 0.05, 0);
        plank.rotation.z = 0.03 * (idx === 0 ? 1 : -1);
        group.add(plank);
      }
      group.position.set(0, 0, z);
      group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      this.group.add(group);
      this.addTrigger(group, 0, z, 1.4, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(new THREE.Vector3(0, 0.4, z), 0xffe066);
        this.pop();
        this.bumpTask('bridges');
        this.say([{ speaker: 'Mochi', text: 'One less wobble to worry about!' }]);
      });
    });
  }

  _spawnDucklings() {
    const spots = [[3, -6], [-3, 4], [4, 15]];
    spots.forEach(([x, z]) => {
      const duck = createDuckling();
      duck.position.set(x, 0.3, z);
      this.group.add(duck);
      this.animated.push((dt, t) => { duck.position.y = 0.3 + Math.sin(t * 3 + x) * 0.03; });
      this.addTrigger(duck, x, z, 0.8, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(duck.position, 0xfff2a8);
        this.pop();
        const c = this.bumpTask('ducklings');
        this.say([{ speaker: 'Mochi', text: c < 3 ? 'Reunited with mama duck!' : 'All the ducklings are safe now.' }]);
      });
    });
  }

  _spawnBoats() {
    const spots = [[-2, -16], [2, -2], [-2, 8], [2, 18]];
    spots.forEach(([x, z]) => {
      const boat = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), new THREE.MeshStandardMaterial({ color: 0xfff8f0, roughness: 0.7 }));
      hull.rotation.x = Math.PI / 2;
      hull.rotation.z = Math.PI / 4;
      hull.position.y = 0.05;
      boat.add(hull);
      boat.position.set(x, 0.03, z);
      this.group.add(boat);
      this.animated.push((dt, t) => { boat.position.x = x + Math.sin(t * 0.5 + z) * 0.3; boat.rotation.y = t * 0.3; });
      this.addTrigger(boat, x, z, 0.9, (entity) => {
        entity.done = true;
        hull.material.color.setHex([0xff8fab, 0xffd166, 0xa78bfa, 0x7fd8e8][Math.floor(this.rand() * 4)]);
        this.particles.sparkleBurst(boat.position, 0xffb6d9);
        this.pop();
        this.bumpTask('boats');
        this.say([{ speaker: 'Mochi', text: 'A little glowing lantern for its journey.' }]);
      });
    });
  }

  _spawnFish() {
    const spots = [[-3, -18], [3, -10], [-3, 0], [3, 10], [-3, 20]];
    spots.forEach(([x, z]) => {
      const marker = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), new THREE.MeshStandardMaterial({ color: 0xffd166, transparent: true, opacity: 0.7 }));
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(x, 0.06, z);
      this.group.add(marker);
      this.addTrigger(marker, x, z, 0.9, (entity) => {
        entity.done = true;
        this.group.remove(marker);
        this.particles.sparkleBurst(new THREE.Vector3(x, 0.2, z), 0x7fd8e8);
        this.chime();
        this.bumpTask('fish');
      });
    });
  }

  _spawnWishBottle() {
    const bottle = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.14, 4, 8), new THREE.MeshStandardMaterial({ color: 0x9be8ff, transparent: true, opacity: 0.65, roughness: 0.15, emissive: 0x9be8ff, emissiveIntensity: 0.3 }));
    glass.position.y = 0.15;
    bottle.add(glass);
    bottle.position.set(-8, 0, -20);
    bottle.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.group.add(bottle);
    const light = new THREE.PointLight(0x9be8ff, 0.8, 2, 2);
    light.position.set(-8, 0.4, -20);
    this.group.add(light);

    this.addTrigger(bottle, -8, -20, 1, (entity) => {
      entity.done = true;
      this.particles.sparkleBurst(bottle.position, 0x9be8ff);
      this.say([
        { speaker: 'Mochi', text: '...Whoever wrote this must be smiling.' },
        { speaker: 'Letter', text: 'My favorite wish already came true.' },
      ]);
    });
  }
}
