import * as THREE from 'three';

// Cinematic pastel lighting rig: warm key sun, cool sky fill, soft shadows, gentle fog for depth.
export function setupLighting(scene, { skyColor = 0xbfe3ff, groundColor = 0xffd9ec, sunColor = 0xfff1d0 } = {}) {
  const hemi = new THREE.HemisphereLight(skyColor, groundColor, 1.1);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(sunColor, 2.4);
  sun.position.set(18, 26, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  sun.shadow.camera.left = -35;
  sun.shadow.camera.right = 35;
  sun.shadow.camera.top = 35;
  sun.shadow.camera.bottom = -35;
  sun.shadow.bias = -0.0015;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  scene.add(sun);
  scene.add(sun.target);

  const fill = new THREE.DirectionalLight(0xffc2e0, 0.35);
  fill.position.set(-14, 10, -10);
  scene.add(fill);

  return { hemi, sun, fill };
}

export function initFog(scene, color = 0xd8ecff, near = 22, far = 70) {
  scene.fog = new THREE.Fog(color, near, far);
  return scene.fog;
}

/** Mutates the existing fog's near/far distances without touching its color (DayNightCycle owns color). */
export function setFogRange(scene, near, far) {
  if (scene.fog) {
    scene.fog.near = near;
    scene.fog.far = far;
  }
}
