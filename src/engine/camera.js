import * as THREE from 'three';

const _desiredPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _offset = new THREE.Vector3();

/**
 * Unified camera controller: smooth third-person chase during exploration,
 * scripted spline flythroughs for arrival cutscenes, and a static/dolly mode for the world map.
 */
export class GameCamera {
  constructor(aspect) {
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 200);
    this.mode = 'chase';

    // Chase settings: behind + above the target, looking slightly down at it.
    this.followDistance = 7.5;
    this.followHeight = 4.2;
    this.lookHeight = 1.4;
    this.posLerp = 4.5;
    this.lookLerp = 6;
    this._smoothYaw = 0;

    this._currentLook = new THREE.Vector3();
    this._hasLook = false;

    // Path playback state (for cutscenes)
    this._path = null;
  }

  setAspect(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /** Slow cinematic orbit around a fixed point — used for the live start-screen backdrop. */
  startOrbit(center, radius = 15, height = 8, angularSpeed = 0.05) {
    this.mode = 'orbit';
    this._orbit = {
      center: new THREE.Vector3(...center),
      radius, height, angularSpeed,
      angle: Math.random() * Math.PI * 2,
    };
  }

  snapTo(position, lookAt) {
    this.camera.position.copy(position);
    this._currentLook.copy(lookAt);
    this._hasLook = true;
    this.camera.lookAt(lookAt);
  }

  /** Scripted flythrough: array of {pos:[x,y,z], look:[x,y,z]} keyframes played over `duration` seconds. */
  playPath(keyframes, duration, onComplete) {
    this.mode = 'path';
    this._path = {
      curve: new THREE.CatmullRomCurve3(keyframes.map((k) => new THREE.Vector3(...k.pos))),
      lookCurve: new THREE.CatmullRomCurve3(keyframes.map((k) => new THREE.Vector3(...k.look))),
      t: 0,
      duration,
      onComplete,
    };
  }

  update(dt, target) {
    if (this.mode === 'path' && this._path) {
      const p = this._path;
      p.t += dt / p.duration;
      const clamped = Math.min(p.t, 1);
      const pos = p.curve.getPoint(clamped);
      const look = p.lookCurve.getPoint(clamped);
      this.camera.position.copy(pos);
      this.camera.lookAt(look);
      if (p.t >= 1) {
        this._path = null;
        this.mode = 'chase';
        if (p.onComplete) p.onComplete();
      }
      return;
    }

    if (this.mode === 'map') return; // driven externally by worldmap dolly

    if (this.mode === 'orbit' && this._orbit) {
      const o = this._orbit;
      o.angle += dt * o.angularSpeed;
      const x = o.center.x + Math.cos(o.angle) * o.radius;
      const z = o.center.z + Math.sin(o.angle) * o.radius;
      this.camera.position.set(x, o.center.y + o.height, z);
      this.camera.lookAt(o.center);
      return;
    }

    if (this.mode === 'chase' && target) {
      // Smoothly rotate the follow-offset toward the target's facing so the camera
      // trails behind naturally instead of snapping.
      let diff = target.yaw - this._smoothYaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this._smoothYaw += diff * Math.min(1, dt * 3.2);

      _offset.set(
        -Math.sin(this._smoothYaw) * this.followDistance,
        this.followHeight,
        -Math.cos(this._smoothYaw) * this.followDistance
      );
      _desiredPos.copy(target.position).add(_offset);

      const posT = 1 - Math.exp(-this.posLerp * dt);
      this.camera.position.lerp(_desiredPos, posT);

      _lookTarget.copy(target.position);
      _lookTarget.y += this.lookHeight;
      if (!this._hasLook) {
        this._currentLook.copy(_lookTarget);
        this._hasLook = true;
      }
      const lookT = 1 - Math.exp(-this.lookLerp * dt);
      this._currentLook.lerp(_lookTarget, lookT);
      this.camera.lookAt(this._currentLook);
    }
  }
}
