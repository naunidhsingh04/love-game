import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createFlower, createRock, createGrassField } from '../engine/props.js';
import { createRopeBridgeSegment, createWoodenSign, createGoat, createBeacon } from '../engine/themeProps.js';

export class CourageMountainLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [
      { speaker: 'Mochi', text: 'Some paths look scary...' },
      { speaker: 'Mochi', text: '...until someone walks beside you.' },
    ];
    this.completionLines = [
      { speaker: 'Mochi', text: 'Half the journey is complete.' },
      { speaker: 'Mochi', text: 'But I think the best memories are still waiting.' },
    ];
  }

  buildTasks() {
    return [
      { key: 'bridges', label: 'Repair the Rope Bridges', current: 0, target: 2 },
      { key: 'flowers', label: 'Plant Mountain Flowers', current: 0, target: 5 },
      { key: 'goats', label: 'Help the Mountain Goats', current: 0, target: 3 },
      { key: 'beacon', label: 'Light the Summit Beacon', current: 0, target: 1 },
    ];
  }

  buildScene() {
    const ground = createGroundPatch(46, 0x9fae8a);
    this.group.add(ground);

    // Distant mountain silhouette for atmosphere.
    const peak = new THREE.Mesh(new THREE.ConeGeometry(14, 16, 8), new THREE.MeshStandardMaterial({ color: 0x8a8a9e, roughness: 0.9 }));
    peak.position.set(0, 6, -30);
    this.group.add(peak);

    for (let i = 0; i < 12; i++) {
      const rock = createRock(0.9 + this.rand() * 0.9);
      rock.position.set((this.rand() - 0.5) * 32, 0, (this.rand() - 0.5) * 32);
      this.group.add(rock);
      this.collision.add(rock.position.x, rock.position.z, 0.5);
    }

    const grass = createGrassField({ minX: -20, maxX: 20, minZ: -20, maxZ: 20 }, 1400, 0x8faa6a, []);
    this.group.add(grass);
    this.animated.push((dt, t) => grass.userData.update(t));

    this._spawnBridges();
    this._spawnFlowers();
    this._spawnGoats();
    this._spawnBeacon();
    this._spawnSummitSign();
  }

  _spawnBridges() {
    const spots = [-8, 8];
    spots.forEach((x) => {
      const group = new THREE.Group();
      for (let i = -3; i <= 3; i++) {
        const plank = createRopeBridgeSegment();
        plank.rotation.y = Math.PI / 2;
        plank.position.set(0, 0, i * 0.35);
        group.add(plank);
      }
      group.position.set(x, 0.1, 6);
      this.group.add(group);
      this.addTrigger(group, x, 6, 1.3, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(group.position, 0xffe066);
        this.pop();
        this.bumpTask('bridges');
      });
    });
  }

  _spawnFlowers() {
    const spots = [[-4, -4], [4, -4], [-6, 2], [6, 2], [0, -8]];
    spots.forEach(([x, z]) => {
      const flower = createFlower();
      flower.scale.setScalar(0.01);
      flower.position.set(x, 0, z);
      this.group.add(flower);
      this.addTrigger(flower, x, z, 0.6, (entity) => {
        entity.done = true;
        flower.scale.setScalar(1);
        this.particles.sparkleBurst(flower.position, 0xff8fab);
        this.pop();
        this.bumpTask('flowers');
      });
    });
  }

  _spawnGoats() {
    const spots = [[-10, -8], [10, -8], [0, 14]];
    spots.forEach(([x, z]) => {
      const goat = createGoat();
      goat.position.set(x, 0, z);
      this.group.add(goat);
      this.addTrigger(goat, x, z, 0.8, (entity) => {
        entity.done = true;
        this.particles.sparkleBurst(goat.position, 0xffe066);
        this.pop();
        this.bumpTask('goats');
      });
    });
  }

  _spawnBeacon() {
    const beacon = createBeacon();
    beacon.position.set(0, 0, -20);
    beacon.traverse((o) => { if (o.isMesh && o.material.emissive) { o.material = o.material.clone(); o.material.emissiveIntensity = 0; } });
    const light = beacon.children.find((c) => c.isLight);
    if (light) light.intensity = 0;
    this.group.add(beacon);
    this.collision.add(0, -20, 0.8);
    this.addTrigger(beacon, 0, -20, 1.6, (entity) => {
      entity.done = true;
      beacon.traverse((o) => { if (o.isMesh && o.material.emissive) o.material.emissiveIntensity = 1.5; });
      if (light) light.intensity = 1.2;
      this.particles.sparkleBurst(beacon.position.clone().add(new THREE.Vector3(0, 1.6, 0)), 0xff8f3a);
      this.chime();
      this.bumpTask('beacon');
    });
  }

  _spawnSummitSign() {
    const sign = createWoodenSign();
    sign.position.set(2, 0, -19);
    this.group.add(sign);
    this.addTrigger(sign, 2, -19, 1, (entity) => {
      entity.done = true;
      this.say([
        { speaker: 'Letter', text: 'Wish you were here...' },
        { speaker: 'Letter', text: '...Oh wait, you are.' },
        { speaker: 'Mochi', text: 'I like whoever wrote that.' },
      ]);
    });
  }
}
