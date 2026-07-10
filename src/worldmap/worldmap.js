import * as THREE from 'three';
import { LEVEL_DATA } from '../levels/levelData.js';
import { createCherryTree, createCloudPuff, createGroundPatch } from '../engine/props.js';
import { createMochi } from '../characters/mochi.js';
import { Audio } from '../systems/audio.js';

const _v = new THREE.Vector3();

export class WorldMap {
  constructor(scene, uiRoot) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    this.nodeMeshes = [];
    this.clouds = [];
    this.mochi = null;
    this.t = 0;
    this.hop = null; // {from, to, t, duration}

    this._buildStatic();
    this._buildLabels(uiRoot);
  }

  _buildStatic() {
    const ground = createGroundPatch(70, 0xbfe8c9);
    ground.position.y = -0.05;
    this.group.add(ground);

    // Memory Tree hub, planted at the geometric center of the story path so it reads as
    // the heart of the map rather than crowding any one node.
    this.tree = createCherryTree(0x9a9a9a);
    this.tree.position.set(-4, 0, 3);
    this.tree.scale.setScalar(1.15);
    this.tree.userData.baseColor = new THREE.Color(0x9a9a9a);
    this.tree.userData.bloomColor = new THREE.Color(0xffb6d9);
    this.group.add(this.tree);

    for (let i = 0; i < 8; i++) {
      const c = createCloudPuff();
      c.position.set((Math.random() - 0.5) * 64, 18 + Math.random() * 6, (Math.random() - 0.5) * 64);
      c.scale.setScalar(0.5 + Math.random() * 0.35);
      this.group.add(c);
      this.clouds.push({ mesh: c, speed: 0.3 + Math.random() * 0.4 });
    }

    // Dashed path connecting nodes in story order
    const pts = LEVEL_DATA.map((l) => new THREE.Vector3(l.mapPos[0], 0.05, l.mapPos[2]));
    const pathGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const pathMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.6, gapSize: 0.4, opacity: 0.8, transparent: true });
    const line = new THREE.Line(pathGeo, pathMat);
    line.computeLineDistances();
    this.group.add(line);

    // Nodes
    for (const level of LEVEL_DATA) {
      const node = new THREE.Group();
      node.position.set(level.mapPos[0], 0, level.mapPos[2]);

      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.6, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: 0xfff1e6, roughness: 0.7 })
      );
      pedestal.position.y = 0.15;
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      node.add(pedestal);

      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 16, 14),
        new THREE.MeshStandardMaterial({ color: level.accent, emissive: level.accent, emissiveIntensity: 0.4, roughness: 0.4 })
      );
      orb.position.y = 0.65;
      orb.castShadow = true;
      node.add(orb);

      const light = new THREE.PointLight(level.accent, 0.6, 4, 2);
      light.position.y = 0.7;
      node.add(light);

      this.group.add(node);
      this.nodeMeshes.push({ id: level.id, node, orb, light, level, unlocked: false, bobPhase: Math.random() * Math.PI * 2 });
    }

    // Mochi hop figure
    const m = createMochi();
    m.root.scale.setScalar(1.3);
    this.mochi = m;
    this.group.add(m.root);
  }

  _buildLabels(uiRoot) {
    this.labelsRoot = document.createElement('div');
    this.labelsRoot.className = 'map-labels';
    this.labelsRoot.style.display = 'none';
    uiRoot.appendChild(this.labelsRoot);
    this.labels = this.nodeMeshes.map((n) => {
      const el = document.createElement('div');
      el.className = 'map-node-label';
      el.innerHTML = `<span class="map-node-num">${n.id}</span><span class="map-node-name">${n.level.name}</span>`;
      el.addEventListener('click', () => this.onNodeClick && this.onNodeClick(n.id));
      this.labelsRoot.appendChild(el);
      return { el, node: n };
    });
  }

  setUnlocked(unlockedUpTo) {
    for (const n of this.nodeMeshes) {
      n.unlocked = n.id <= unlockedUpTo;
      n.orb.material.emissiveIntensity = n.unlocked ? 0.9 : 0.15;
      n.orb.material.color.set(n.unlocked ? n.level.accent : 0x9aa0aa);
      n.orb.material.emissive.set(n.unlocked ? n.level.accent : 0x444444);
      n.light.intensity = n.unlocked ? 0.9 : 0.15;
      const label = this.labels.find((l) => l.node === n).el;
      label.classList.toggle('locked', !n.unlocked);
      label.classList.toggle('current', n.id === unlockedUpTo);
    }
    const current = this.nodeMeshes.find((n) => n.id === unlockedUpTo);
    if (current) {
      this.mochi.root.position.set(current.level.mapPos[0], 0, current.level.mapPos[2] + 1.1);
    }
    this.currentId = unlockedUpTo;

    // The Memory Tree slowly regains color as more memories are restored.
    const bloomPct = Math.max(0, unlockedUpTo - 1) / (this.nodeMeshes.length - 1);
    this.tree.traverse((o) => {
      if (o.isMesh && o.material.color && o !== this.tree.children[0]) {
        o.material.color.copy(this.tree.userData.baseColor).lerp(this.tree.userData.bloomColor, bloomPct);
      }
    });
  }

  show(camera) {
    this.group.visible = true;
    this.labelsRoot.style.display = 'block';
    this.camera = camera;
    this._frameCamera(camera);
  }

  hide() {
    this.group.visible = false;
    this.labelsRoot.style.display = 'none';
  }

  _frameCamera(camera) {
    camera.mode = 'map';
    camera.camera.position.set(-2, 34, 30);
    camera.camera.lookAt(-2, 0, 3);
  }

  startHop(fromId, toId, onFinish) {
    const from = this.nodeMeshes.find((n) => n.id === fromId);
    const to = this.nodeMeshes.find((n) => n.id === toId);
    if (!from || !to) { if (onFinish) onFinish(); return; }
    Audio.playPop();
    this.hop = {
      from: new THREE.Vector3(from.level.mapPos[0], 0, from.level.mapPos[2] + 1.1),
      to: new THREE.Vector3(to.level.mapPos[0], 0, to.level.mapPos[2] + 1.1),
      t: 0,
      duration: 1.8,
      onFinish,
    };
  }

  update(dt, renderer) {
    this.t += dt;
    for (const c of this.clouds) {
      c.mesh.position.x += c.speed * dt;
      if (c.mesh.position.x > 35) c.mesh.position.x = -35;
    }
    for (const n of this.nodeMeshes) {
      if (!n.unlocked) continue;
      n.node.position.y = Math.sin(this.t * 1.5 + n.bobPhase) * 0.06;
    }

    if (this.hop) {
      const h = this.hop;
      h.t += dt;
      const pct = Math.min(h.t / h.duration, 1);
      _v.lerpVectors(h.from, h.to, pct);
      const hopArc = Math.sin(pct * Math.PI * 3) ** 2 * 0.6 * (1 - pct * 0.3);
      this.mochi.root.position.set(_v.x, hopArc, _v.z);
      this.mochi.update(dt, true);
      if (pct >= 1) {
        const cb = h.onFinish;
        this.hop = null;
        if (cb) cb();
      }
    } else {
      this.mochi.update(dt, false);
    }

    if (this.camera && this.group.visible) this._updateLabels();
  }

  _updateLabels() {
    for (const { el, node } of this.labels) {
      _v.set(node.node.position.x, 0.9, node.node.position.z);
      _v.project(this.camera.camera);
      const visible = _v.z < 1;
      el.style.display = visible ? 'flex' : 'none';
      if (visible) {
        const x = (_v.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-_v.y * 0.5 + 0.5) * window.innerHeight;
        el.style.transform = `translate(${x}px, ${y}px)`;
      }
    }
  }
}
