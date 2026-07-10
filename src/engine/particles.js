import * as THREE from 'three';

const _dummy = new THREE.Object3D();

/** Continuous ambient emitter (falling sakura petals, drifting fireflies) using an InstancedMesh pool. */
class AmbientEmitter {
  constructor(scene, { geometry, material, count, area, kind }) {
    this.kind = kind;
    this.area = area;
    this.mesh = new THREE.InstancedMesh(geometry, material, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);

    this.state = [];
    for (let i = 0; i < count; i++) this.state.push(this._spawn());
  }

  _spawn(recycleHigh = false) {
    const a = this.area;
    const x = a.minX + Math.random() * (a.maxX - a.minX);
    const z = a.minZ + Math.random() * (a.maxZ - a.minZ);
    if (this.kind === 'petal') {
      return {
        x, z,
        y: recycleHigh ? a.maxY : a.minY + Math.random() * (a.maxY - a.minY),
        speed: 0.5 + Math.random() * 0.5,
        sway: 0.6 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 1.5,
        scale: 0.6 + Math.random() * 0.5,
      };
    }
    // firefly
    return {
      x, z,
      y: a.minY + Math.random() * (a.maxY - a.minY),
      baseY: 0,
      speed: 0.3 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      radius: 0.6 + Math.random() * 1.2,
      cx: x, cz: z,
      scale: 0.7 + Math.random() * 0.6,
    };
  }

  update(dt, t) {
    for (let i = 0; i < this.state.length; i++) {
      const s = this.state[i];
      if (this.kind === 'petal') {
        s.y -= s.speed * dt;
        s.x += Math.sin(t * s.sway + s.phase) * dt * 0.4;
        s.rot += s.rotSpeed * dt;
        if (s.y < this.area.minY) Object.assign(s, this._spawn(true));
        _dummy.position.set(s.x, s.y, s.z);
        _dummy.rotation.set(s.rot, s.rot * 0.6, t * 0.3 + s.phase);
        _dummy.scale.setScalar(s.scale);
      } else {
        const ang = t * s.speed + s.phase;
        s.x = s.cx + Math.cos(ang) * s.radius;
        s.z = s.cz + Math.sin(ang) * s.radius;
        const y = s.y + Math.sin(t * 1.4 + s.phase) * 0.4;
        _dummy.position.set(s.x, y, s.z);
        _dummy.rotation.set(0, 0, 0);
        const pulse = 0.7 + Math.sin(t * 3 + s.phase) * 0.3;
        _dummy.scale.setScalar(s.scale * pulse);
      }
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(scene) {
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

/** One-shot burst effects (sparkles on pickup, rising hearts on memory restore). */
class Burst {
  constructor(scene, position, { color, count, spread, rise, life, geometry }) {
    this.life = life;
    this.age = 0;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    scene.add(this.group);
    this.parts = [];
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, roughness: 0.3 });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geometry, mat);
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * spread;
      m.position.set(Math.cos(ang) * r, Math.random() * 0.3, Math.sin(ang) * r);
      this.group.add(m);
      this.parts.push({ mesh: m, vy: rise * (0.6 + Math.random() * 0.8), spin: (Math.random() - 0.5) * 4 });
    }
  }

  update(dt) {
    this.age += dt;
    const t = this.age / this.life;
    for (const p of this.parts) {
      p.mesh.position.y += p.vy * dt;
      p.mesh.rotation.y += p.spin * dt;
      p.mesh.scale.setScalar(Math.max(0, 1 - t));
    }
    return this.age < this.life;
  }

  dispose(scene) {
    scene.remove(this.group);
    this.group.traverse((o) => { if (o.isMesh) o.material.dispose(); });
  }
}

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.emitters = [];
    this.bursts = [];
    this.t = 0;
  }

  addSakuraField(area, count = 40) {
    const geo = new THREE.PlaneGeometry(0.14, 0.14);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffc4dd, roughness: 0.6, side: THREE.DoubleSide, transparent: true, opacity: 0.95,
    });
    const e = new AmbientEmitter(this.scene, { geometry: geo, material: mat, count, area, kind: 'petal' });
    this.emitters.push(e);
    return e;
  }

  addFireflyField(area, count = 14) {
    const geo = new THREE.SphereGeometry(0.06, 6, 6);
    const mat = new THREE.MeshStandardMaterial({ color: 0xfff2a8, emissive: 0xffe066, emissiveIntensity: 2, roughness: 0.4 });
    const e = new AmbientEmitter(this.scene, { geometry: geo, material: mat, count, area, kind: 'firefly' });
    this.emitters.push(e);
    return e;
  }

  sparkleBurst(position, color = 0xffe066) {
    const geo = new THREE.OctahedronGeometry(0.08, 0);
    this.bursts.push(new Burst(this.scene, position, { color, count: 10, spread: 0.3, rise: 1.4, life: 0.7, geometry: geo }));
  }

  heartBurst(position, color = 0xff4d94) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.15);
    shape.bezierCurveTo(0, 0.2, -0.08, 0.28, -0.14, 0.2);
    shape.bezierCurveTo(-0.22, 0.1, -0.1, -0.05, 0, -0.15);
    shape.bezierCurveTo(0.1, -0.05, 0.22, 0.1, 0.14, 0.2);
    shape.bezierCurveTo(0.08, 0.28, 0, 0.2, 0, 0.15);
    const geo = new THREE.ShapeGeometry(shape);
    this.bursts.push(new Burst(this.scene, position, { color, count: 8, spread: 0.4, rise: 1.8, life: 1.6, geometry: geo }));
  }

  update(dt) {
    this.t += dt;
    for (const e of this.emitters) e.update(dt, this.t);
    this.bursts = this.bursts.filter((b) => {
      const alive = b.update(dt);
      if (!alive) b.dispose(this.scene);
      return alive;
    });
  }
}
