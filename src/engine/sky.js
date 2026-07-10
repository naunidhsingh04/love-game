import * as THREE from 'three';

const SKY_VERT = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = `
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform vec3 sunColor;
  uniform vec3 sunDirection;
  uniform float exponent;
  varying vec3 vWorldPosition;
  void main() {
    float h = normalize(vWorldPosition).y;
    vec3 sky = mix(horizonColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));
    float sunAmount = max(dot(normalize(vWorldPosition), normalize(sunDirection)), 0.0);
    vec3 glow = sunColor * pow(sunAmount, 24.0) * 0.9;
    vec3 disc = sunColor * smoothstep(0.9985, 0.9997, sunAmount) * 2.0;
    gl_FragColor = vec4(sky + glow + disc, 1.0);
  }
`;

export function createSkyDome() {
  const geo = new THREE.SphereGeometry(140, 24, 16);
  const uniforms = {
    topColor: { value: new THREE.Color(0x5fb8ff) },
    horizonColor: { value: new THREE.Color(0xbfe8ff) },
    sunColor: { value: new THREE.Color(0xfff1d0) },
    sunDirection: { value: new THREE.Vector3(0, 1, 0) },
    exponent: { value: 0.55 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, fog: false, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -1000;
  return { mesh, uniforms };
}

function makeStarTexture() {
  const size = 32;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

export function createStarfield(count = 260) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.85 + 0.05); // upper hemisphere-biased
    const r = 130;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.6, map: makeStarTexture(), transparent: true, opacity: 0,
    depthWrite: false, fog: false, sizeAttenuation: false,
  });
  const points = new THREE.Points(geo, mat);
  points.renderOrder = -999;
  return points;
}

export function createMoon() {
  const geo = new THREE.SphereGeometry(2.2, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color: 0xf3f2ff, fog: false, transparent: true, opacity: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -998;
  return mesh;
}
