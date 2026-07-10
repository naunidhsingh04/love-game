import * as THREE from 'three';
import { createSkyDome, createStarfield, createMoon } from './sky.js';

const _c1 = new THREE.Color();
const _c2 = new THREE.Color();

// t: 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1 = midnight (wraps to 0).
const KEYFRAMES = [
  { t: 0.00, sky: 0x0b1030, horizon: 0x2b2f5e, fog: 0x1c1f3f, sun: 0xaec6ff, sunI: 0.16, hemiSky: 0x33407a, hemiGround: 0x14131f, hemiI: 0.32, star: 1.0, exposure: 0.82 },
  { t: 0.20, sky: 0x1c2a5e, horizon: 0x5c4a7a, fog: 0x3a3560, sun: 0xaec6ff, sunI: 0.18, hemiSky: 0x3a4a8a, hemiGround: 0x201a2a, hemiI: 0.38, star: 0.7, exposure: 0.88 },
  { t: 0.27, sky: 0x6f9fdc, horizon: 0xffcf9e, fog: 0xffdcb8, sun: 0xffb37a, sunI: 1.5, hemiSky: 0xffd6c2, hemiGround: 0xffb98f, hemiI: 0.85, star: 0.0, exposure: 1.0 },
  { t: 0.50, sky: 0x5fb8ff, horizon: 0xbfe8ff, fog: 0xd8ecff, sun: 0xfff1d0, sunI: 2.5, hemiSky: 0xbfe3ff, hemiGround: 0xffd9ec, hemiI: 1.1, star: 0.0, exposure: 1.05 },
  { t: 0.71, sky: 0x3a4a8f, horizon: 0xff8f6b, fog: 0xffb199, sun: 0xff7a5c, sunI: 1.3, hemiSky: 0xff9e7a, hemiGround: 0x6a4a6a, hemiI: 0.8, star: 0.15, exposure: 0.94 },
  { t: 0.80, sky: 0x1c2a5e, horizon: 0x5c4a7a, fog: 0x3a3560, sun: 0xaec6ff, sunI: 0.2, hemiSky: 0x3a4a8a, hemiGround: 0x201a2a, hemiI: 0.4, star: 0.75, exposure: 0.86 },
  { t: 1.00, sky: 0x0b1030, horizon: 0x2b2f5e, fog: 0x1c1f3f, sun: 0xaec6ff, sunI: 0.16, hemiSky: 0x33407a, hemiGround: 0x14131f, hemiI: 0.32, star: 1.0, exposure: 0.82 },
];

function sample(t) {
  let a = KEYFRAMES[0];
  let b = KEYFRAMES[KEYFRAMES.length - 1];
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (t >= KEYFRAMES[i].t && t <= KEYFRAMES[i + 1].t) {
      a = KEYFRAMES[i];
      b = KEYFRAMES[i + 1];
      break;
    }
  }
  const span = b.t - a.t || 1;
  const f = (t - a.t) / span;
  return { a, b, f };
}

function lerpColor(target, hexA, hexB, f) {
  _c1.set(hexA);
  _c2.set(hexB);
  target.copy(_c1).lerp(_c2, f);
  return target;
}

export class DayNightCycle {
  /** dayDurationSeconds: real seconds for one full 24h cycle (default 900s = 15 minutes). */
  constructor(scene, { sun, hemi }, renderer, { dayDurationSeconds = 900, startT = 0.3 } = {}) {
    this.scene = scene;
    this.sun = sun;
    this.hemi = hemi;
    this.renderer = renderer;
    this.duration = dayDurationSeconds;
    this.t = startT;

    const sky = createSkyDome();
    this.skyMesh = sky.mesh;
    this.skyUniforms = sky.uniforms;
    scene.add(this.skyMesh);

    this.stars = createStarfield();
    scene.add(this.stars);

    this.moon = createMoon();
    scene.add(this.moon);

    this._sunDir = new THREE.Vector3();
    this._tmpColor = new THREE.Color();
  }

  setTimeOfDay(t) {
    this.t = ((t % 1) + 1) % 1;
  }

  update(dt, center = null) {
    this.t = (this.t + dt / this.duration) % 1;

    const angle = this.t * Math.PI * 2 - Math.PI / 2;
    const height = Math.sin(angle);
    const horiz = Math.cos(angle);
    this._sunDir.set(horiz, height, 0.35).normalize();

    const dist = 60;
    const cx = center ? center.x : 0;
    const cz = center ? center.z : 0;
    this.sun.position.set(cx + this._sunDir.x * dist, this._sunDir.y * dist, cz + this._sunDir.z * dist);
    this.sun.target.position.set(cx, 0, cz);
    this.sun.target.updateMatrixWorld();

    this.moon.position.set(cx - this._sunDir.x * dist, -this._sunDir.y * dist, cz - this._sunDir.z * dist);
    this.moon.visible = -this._sunDir.y > -0.15;

    const { a, b, f } = sample(this.t);

    lerpColor(this.skyUniforms.topColor.value, a.sky, b.sky, f);
    lerpColor(this.skyUniforms.horizonColor.value, a.horizon, b.horizon, f);
    lerpColor(this.skyUniforms.sunColor.value, a.sun, b.sun, f);
    this.skyUniforms.sunDirection.value.copy(this._sunDir);

    if (this.scene.fog) lerpColor(this.scene.fog.color, a.fog, b.fog, f);

    lerpColor(this.sun.color, a.sun, b.sun, f);
    this.sun.intensity = THREE.MathUtils.lerp(a.sunI, b.sunI, f);

    lerpColor(this.hemi.color, a.hemiSky, b.hemiSky, f);
    lerpColor(this.hemi.groundColor, a.hemiGround, b.hemiGround, f);
    this.hemi.intensity = THREE.MathUtils.lerp(a.hemiI, b.hemiI, f);

    this.stars.material.opacity = THREE.MathUtils.lerp(a.star, b.star, f);

    if (this.renderer) this.renderer.toneMappingExposure = THREE.MathUtils.lerp(a.exposure, b.exposure, f);
  }

  isNight() {
    return this.stars.material.opacity > 0.5;
  }
}
