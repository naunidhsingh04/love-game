import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createCherryTree, createGrassField, createBench, createFencePost } from '../engine/props.js';
import { createCastleTower, createLantern, createCupcake, createMouseCritter, createTeacup } from '../engine/themeProps.js';

export class CozyCastleLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [
      { speaker: 'Mochi', text: "Home isn't a place." },
      { speaker: 'Mochi', text: "It's the people waiting inside." },
    ];
    this.completionLines = [
      { speaker: 'Queen', text: 'May every home be filled with laughter.' },
      { speaker: 'Mochi', text: 'Five memories restored...' },
      { speaker: 'Mochi', text: "We're only getting started." },
    ];
  }

  buildTasks() {
    return [
      { key: 'cupcakes', label: 'Bake Cupcakes', current: 0, target: 5 },
      { key: 'lanterns', label: 'Light the Lanterns', current: 0, target: 6 },
      { key: 'mice', label: 'Help the Castle Mice', current: 0, target: 3 },
      { key: 'tea', label: 'Prepare Tea for the Queen', current: 0, target: 1 },
    ];
  }

  buildScene() {
    const ground = createGroundPatch(46, 0xbfe8a0);
    this.group.add(ground);

    const tower = createCastleTower(6);
    tower.position.set(0, 0, -10);
    this.group.add(tower);
    this.collision.add(0, -10, 2.2);

    for (let i = 0; i < 8; i++) {
      const t = createCherryTree(0xffc2dd);
      const ang = (i / 8) * Math.PI * 2;
      t.position.set(Math.cos(ang) * 18, 0, Math.sin(ang) * 18 + 2);
      this.group.add(t);
      this.collision.add(t.position.x, t.position.z, 0.6);
    }
    for (let i = -3; i <= 3; i++) {
      const post = createFencePost();
      post.position.set(i * 1.5, 0, 4);
      this.group.add(post);
    }
    const bench = createBench();
    bench.position.set(5, 0, 6);
    bench.rotation.y = -0.5;
    this.group.add(bench);
    this.collision.add(5, 6, 0.9);

    const grass = createGrassField({ minX: -21, maxX: 21, minZ: -21, maxZ: 18 }, 2200, 0x9fdc8a, [{ x: 0, z: -10, radius: 3 }]);
    this.group.add(grass);
    this.animated.push((dt, t) => grass.userData.update(t));
    this.particles.addSakuraField({ minX: -19, maxX: 19, minZ: -19, maxZ: 16, minY: 0, maxY: 8 }, 26);

    this._spawnCupcakes();
    this._spawnLanterns();
    this._spawnMice();
    this._spawnTeaTable();
    this._spawnHiddenRoom();
  }

  _spawnCupcakes() {
    const spots = [[-4, -2], [-2, 0], [0, -2], [2, 0], [4, -2]];
    spots.forEach(([x, z]) => {
      const cupcake = createCupcake();
      cupcake.position.set(x, 0.5, z);
      this.group.add(cupcake);
      this.addTrigger(cupcake, x, z, 0.6, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(cupcake.position, 0xffb6d9);
        this.chime();
        const c = this.bumpTask('cupcakes');
        if (c === 5) this.say([{ speaker: 'Mochi', text: 'That smells amazing.' }]);
      });
    });
  }

  _spawnLanterns() {
    const spots = [[-8, -4], [8, -4], [-8, -14], [8, -14], [-4, -18], [4, -18]];
    spots.forEach(([x, z]) => {
      const lantern = createLantern(false);
      lantern.position.set(x, 0, z);
      lantern.traverse((o) => { if (o.isMesh && o.material.emissive) o.material.emissiveIntensity = 0; });
      this.group.add(lantern);
      this.addTrigger(lantern, x, z, 0.8, (entity) => {
        entity.done = true;
        lantern.traverse((o) => { if (o.isMesh) o.material.color.setHex(0xffd166); });
        const l = new THREE.PointLight(0xffd166, 0.8, 2.5, 2);
        l.position.set(x, 0.5, z);
        this.group.add(l);
        this.particles.sparkleBurst(new THREE.Vector3(x, 0.5, z), 0xffd166);
        this.pop();
        this.bumpTask('lanterns');
      });
    });
  }

  _spawnMice() {
    const spots = [[-6, -8], [6, -8], [0, -6]];
    spots.forEach(([x, z]) => {
      const mouse = createMouseCritter();
      mouse.position.set(x, 0, z);
      this.group.add(mouse);
      this.addTrigger(mouse, x, z, 0.6, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(mouse.position, 0xfff2a8);
        this.pop();
        this.bumpTask('mice');
      });
    });
  }

  _spawnTeaTable() {
    const table = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0xfff1e6 }));
    top.position.y = 0.5;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x8a5a3b }));
    leg.position.y = 0.25;
    table.add(top, leg);
    const cup = createTeacup();
    cup.position.set(0.15, 0.53, 0);
    table.add(cup);
    table.position.set(-2, 0, -10);
    table.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.group.add(table);
    this.collision.add(-2, -10, 0.6);

    this.addTrigger(table, -2, -10, 1, (entity) => {
      entity.done = true;
      this.particles.sparkleBurst(table.position.clone().add(new THREE.Vector3(0, 0.6, 0)), 0xffd166);
      this.chime();
      this.bumpTask('tea');
      this.say([{ speaker: 'Letter', text: 'Save me one cupcake? ❤' }]);
    });
  }

  _spawnHiddenRoom() {
    const room = new THREE.Group();
    const table = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.4), new THREE.MeshStandardMaterial({ color: 0xb98452 }));
    table.position.y = 0.18;
    room.add(table);
    const cup1 = createTeacup(); cup1.position.set(-0.1, 0.36, 0.05); room.add(cup1);
    const cup2 = createTeacup(); cup2.position.set(0.1, 0.36, -0.05); room.add(cup2);
    room.position.set(9, 0, -16);
    room.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.group.add(room);

    this.addTrigger(room, 9, -16, 1.2, (entity) => {
      entity.done = true;
      this.say([
        { speaker: 'Mochi', text: 'I think someone hoped you’d find this.' },
        { speaker: 'Letter', text: 'Everything tastes sweeter when it’s shared.' },
      ]);
    });
  }
}
