import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { createGroundPatch, createCherryTree, createFlower, createGrassField } from '../engine/props.js';
import { createMushroom, createBell, createStarPickup, createLantern, createDreamBubble, createKeepsakeChest, createPaintBucket } from '../engine/themeProps.js';

export class FinalGardenLevel extends BaseLevel {
  constructor(scene, particles, collision, hud) {
    super(scene, particles, collision, hud);
    this.arrivalLines = [
      { speaker: 'Mochi', text: "We've come so far..." },
      { speaker: 'Mochi', text: 'There is only one memory left.' },
    ];
    this.completionLines = [
      { speaker: 'Mochi', text: 'Do you know why the world chose you?' },
      { speaker: 'Mochi', text: 'Because every place you visited...' },
      { speaker: 'Mochi', text: '...was carrying a memory.' },
      { speaker: 'Mochi', text: 'Not just any memory.' },
      { speaker: 'Mochi', text: '...A memory of someone who loves you.' },
      { speaker: 'Mochi', text: 'Thank you...' },
      { speaker: 'Mochi', text: 'For helping me tell this story.' },
      { speaker: 'Mochi', text: 'Every memory...' },
      { speaker: 'Mochi', text: '...every little adventure...' },
      { speaker: 'Mochi', text: '...was leading here.' },
    ];
  }

  buildTasks() {
    return [{ key: 'memories', label: 'Walk the Path of Memories', current: 0, target: 12 }];
  }

  buildScene() {
    const ground = createGroundPatch(50, 0xbfe8a0);
    this.group.add(ground);

    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const t = createCherryTree(0xffb6d9);
      t.position.set(Math.cos(ang) * (20 + this.rand() * 3), 0, Math.sin(ang) * (20 + this.rand() * 3));
      t.scale.setScalar(1 + this.rand() * 0.3);
      this.group.add(t);
      this.collision.add(t.position.x, t.position.z, 0.6);
    }

    const grass = createGrassField({ minX: -23, maxX: 23, minZ: -23, maxZ: 23 }, 2400, 0x8fdc8a, [{ x: 0, z: -16, radius: 3 }]);
    this.group.add(grass);
    this.animated.push((dt, t) => grass.userData.update(t));
    this.particles.addSakuraField({ minX: -22, maxX: 22, minZ: -22, maxZ: 22, minY: 0, maxY: 9 }, 42);

    this._spawnMemoryTree();
    this._spawnMilestones();
  }

  _spawnMemoryTree() {
    const tree = createCherryTree(0xffb6d9);
    tree.scale.setScalar(2.2);
    tree.position.set(0, 0, -16);
    this.group.add(tree);
    this.collision.add(0, -16, 1.6);
    this.memoryTree = tree;
  }

  _spawnMilestones() {
    // A little of everything the journey passed through, laid along the final walk.
    const makers = [
      () => createFlower(0),
      () => { const b = new THREE.Group(); const h = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 4), new THREE.MeshStandardMaterial({ color: 0xfff8f0 })); h.rotation.x = Math.PI / 2; h.rotation.z = Math.PI / 4; b.add(h); return b; },
      () => createMushroom(true),
      () => createBell(),
      () => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff })); return s; },
      () => createStarPickup(),
      () => createPaintBucket(0x7fd8e8),
      () => createFlower(4),
      () => createLantern(true),
      () => createDreamBubble(),
      () => createLantern(true),
      () => createKeepsakeChest(),
    ];
    const path = [];
    for (let i = 0; i < makers.length; i++) {
      const a = (i / makers.length) * Math.PI * 1.4 - Math.PI * 0.7;
      const r = 16 - i * 1.1;
      path.push([Math.sin(a) * r, Math.cos(a) * r - 4]);
    }
    makers.forEach((make, i) => {
      const item = make();
      const [x, z] = path[i];
      item.position.set(x, 0, z);
      item.scale.multiplyScalar(1.2);
      this.group.add(item);
      this.animated.push((dt, t) => { item.rotation.y += dt * 0.6; item.position.y = Math.abs(Math.sin(t * 1.5 + i)) * 0.06; });
      this.addAutoPickup(item, x, z, 0.6, () => {
        this.group.remove(item);
        this.particles.sparkleBurst(item.position, 0xffe6f0);
        this.chime();
        this.bumpTask('memories');
      });
    });
  }
}
