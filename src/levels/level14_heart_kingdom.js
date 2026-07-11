import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createFlower, createGrassField, createCherryTree } from '../engine/props.js';
import { createGoldenGate, createBanner, createCake, createFountain, createCastleTower } from '../engine/themeProps.js';
import { createCat, createChick } from '../characters/critters.js';

export class HeartKingdomLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [
      { speaker: 'Everyone', text: 'Welcome back!' },
      { speaker: 'Mochi', text: 'Looks like everyone was waiting for you.' },
    ];
    this.completionLines = [
      { speaker: 'Mochi', text: 'The fourteenth memory joins the others.' },
      { speaker: 'Mochi', text: 'One branch still remains empty...' },
    ];
  }

  buildTasks() {
    return [
      { key: 'banners', label: 'Decorate the Kingdom', current: 0, target: 5 },
      { key: 'cake', label: 'Bake the Celebration Cake', current: 0, target: 1 },
      { key: 'fountain', label: 'Restore the Fountain', current: 0, target: 1 },
      { key: 'flowers', label: 'Plant the Final Flowers', current: 0, target: 5 },
    ];
  }

  buildScene() {
    const ground = createGroundPatch(46, 0xffd6e6);
    this.group.add(ground);

    const gate = createGoldenGate(4.5);
    gate.position.set(0, 0, 14);
    this.group.add(gate);

    const tower = createCastleTower(7);
    tower.position.set(0, 0, -14);
    this.group.add(tower);
    this.collision.add(0, -14, 2.4);

    const fountain = createFountain();
    fountain.position.set(0, 0, 0);
    this.group.add(fountain);
    this.collision.add(0, 0, 1.4);

    for (let i = 0; i < 8; i++) {
      const t = createCherryTree(0xffb6d9);
      const ang = (i / 8) * Math.PI * 2;
      t.position.set(Math.cos(ang) * 19, 0, Math.sin(ang) * 19);
      this.group.add(t);
      this.collision.add(t.position.x, t.position.z, 0.6);
    }

    // Familiar faces from earlier levels, returned to celebrate.
    const cat = createCat();
    cat.position.set(-4, 0, 4);
    this.group.add(cat);
    this.animated.push((dt, t) => cat.userData.update(dt, t));
    const chick = createChick();
    chick.position.set(4, 0, 4);
    this.group.add(chick);
    this.animated.push((dt, t) => chick.userData.update(dt, t));

    const grass = createGrassField({ minX: -21, maxX: 21, minZ: -21, maxZ: 21 }, 2200, 0xffc2dd, [{ x: 0, z: 0, radius: 2 }, { x: 0, z: -14, radius: 3 }]);
    this.group.add(grass);
    this.animated.push((dt, t) => grass.userData.update(t));
    this.particles.addSakuraField({ minX: -19, maxX: 19, minZ: -19, maxZ: 19, minY: 0, maxY: 9 }, 34);

    this._spawnBanners();
    this._spawnCake();
    this._spawnFountainTask(fountain);
    this._spawnFlowers();
    this._spawnMoonTelescope();
  }

  _spawnBanners() {
    const spots = [[-8, 8], [8, 8], [-8, -8], [8, -8], [0, 10]];
    spots.forEach(([x, z]) => {
      const banner = createBanner([0xff8fab, 0xffd166, 0x7fd8e8, 0xa78bfa][Math.floor(this.rand() * 4)]);
      banner.traverse((o) => { if (o.isMesh) o.material.opacity = 0.15; if (o.isMesh) o.material.transparent = true; });
      banner.position.set(x, 1.5, z);
      this.group.add(banner);
      this.addTrigger(banner, x, z, 0.9, (entity) => {
        entity.done = true;
        banner.traverse((o) => { if (o.isMesh) o.material.opacity = 1; });
        this.particles.sparkleBurst(banner.position, 0xffd166);
        this.pop();
        this.bumpTask('banners');
      });
    });
  }

  _spawnCake() {
    const cake = createCake(4);
    cake.position.set(-3, 0, -6);
    this.group.add(cake);
    this.addTrigger(cake, -3, -6, 1, (entity) => {
      entity.done = true;
      this.particles.sparkleBurst(cake.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xffd166);
      this.chime();
      this.bumpTask('cake');
    });
  }

  _spawnFountainTask(fountain) {
    this.addTrigger(fountain, 0, 0, 1.8, (entity) => {
      entity.done = true;
      this.particles.sparkleBurst(new THREE.Vector3(0, 1, 0), 0x9fd6e8);
      this.chime();
      this.bumpTask('fountain');
    });
  }

  _spawnFlowers() {
    const spots = [[-6, 4], [6, 4], [-10, -2], [10, -2], [0, 6]];
    spots.forEach(([x, z]) => {
      const flower = createFlower();
      flower.position.set(x, 0, z);
      this.group.add(flower);
      this.addAutoPickup(flower, x, z, 0.4, () => {
        this.group.remove(flower);
        this.particles.sparkleBurst(flower.position, 0xffb6d9);
        this.pop();
        this.bumpTask('flowers');
      });
    });
  }

  _spawnMoonTelescope() {
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.5 }));
    scope.rotation.z = Math.PI / 3;
    scope.position.set(2, 3.6, -14.6);
    this.group.add(scope);
    this.addTrigger(scope, 2, -14, 1.4, (entity) => {
      entity.done = true;
      this.particles.heartBurst(scope.position, 0xffe066);
      this.say([{ speaker: 'Letter', text: 'Some hearts always find each other.' }]);
    });
  }
}
