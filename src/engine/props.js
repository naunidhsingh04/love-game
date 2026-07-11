import * as THREE from 'three';

let _grassTexCache = null;
function getGrassTexture(baseHex) {
  const key = baseHex.toString(16);
  if (_grassTexCache && _grassTexCache.key === key) return _grassTexCache.tex;

  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const base = new THREE.Color(baseHex);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  const light = base.clone().offsetHSL(0, 0, 0.06);
  const dark = base.clone().offsetHSL(0, 0.03, -0.07);
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const l = 3 + Math.random() * 5;
    const ang = Math.random() * Math.PI * 2;
    ctx.strokeStyle = `#${(Math.random() > 0.5 ? light : dark).getHexString()}`;
    ctx.globalAlpha = 0.25 + Math.random() * 0.35;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * l, y - Math.abs(Math.sin(ang) * l));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  _grassTexCache = { key, tex };
  return tex;
}

let _barkTex = null;
function getBarkTexture() {
  if (_barkTex) return _barkTex;
  const size = 128;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6b4a34';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const w = 2 + Math.random() * 5;
    const shade = Math.random() > 0.5 ? 'rgba(40,25,18,0.35)' : 'rgba(140,100,70,0.3)';
    ctx.strokeStyle = shade;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + (Math.random() - 0.5) * 20, size * 0.4, x + (Math.random() - 0.5) * 20, size * 0.7, x + (Math.random() - 0.5) * 12, size);
    ctx.stroke();
  }
  _barkTex = new THREE.CanvasTexture(c);
  _barkTex.wrapS = _barkTex.wrapT = THREE.RepeatWrapping;
  _barkTex.repeat.set(1, 3);
  _barkTex.colorSpace = THREE.SRGBColorSpace;
  return _barkTex;
}

// A small library of stylized, low-poly-but-PBR-shaded props shared across every level.
// Flat-shaded foliage/faceted geometry for a "gem cut" cozy look, smooth-shaded rounded props
// for softness, all using MeshStandardMaterial so the bloom/HDRI lighting rig reads as cinematic
// rather than flat/cartoonish.

const _mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.03, flatShading: true, ...opts });

const _matSmooth = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05, flatShading: false, ...opts });

function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createGroundPatch(size = 60, color = 0x8fd694) {
  const geo = new THREE.PlaneGeometry(size, size, 48, 48);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const h = Math.sin(x * 0.15) * 0.18 + Math.cos(y * 0.18) * 0.15 + (Math.random() - 0.5) * 0.05;
    pos.setZ(i, h);
  }
  geo.computeVertexNormals();
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (size / 4), uv.getY(i) * (size / 4));
  const mat = new THREE.MeshStandardMaterial({ map: getGrassTexture(color), roughness: 0.92, metalness: 0.02 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

const _dummyMat4 = new THREE.Object3D();

/**
 * Real instanced grass blades (not just a texture) scattered across `area`, swaying in a
 * wind shader injected into MeshStandardMaterial via onBeforeCompile — keeps full PBR
 * lighting/shadow-receiving while adding the vertex animation. `exclude` is a list of
 * {x,z,radius} circles (ponds, paths, buildings) blades shouldn't spawn inside.
 */
export function createGrassField(area, count = 2500, color = 0x5aa04a, exclude = []) {
  const bladeGeo = new THREE.PlaneGeometry(0.07, 0.42, 1, 3);
  bladeGeo.translate(0, 0.21, 0);
  const pos = bladeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / 0.42;
    pos.setX(i, pos.getX(i) * (1 - t * 0.85));
  }
  bladeGeo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75, side: THREE.DoubleSide, flatShading: false });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    mat.userData.shader = shader;
    shader.vertexShader =
      'uniform float uTime;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float windPhase = instanceMatrix[3].x * 2.1 + instanceMatrix[3].z * 1.7;
        float sway = sin(uTime * 1.6 + windPhase) * 0.09 * position.y;
        transformed.x += sway;
        transformed.z += sway * 0.4;`
      );
  };

  const mesh = new THREE.InstancedMesh(bladeGeo, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;

  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < count * 4) {
    attempts++;
    const x = area.minX + Math.random() * (area.maxX - area.minX);
    const z = area.minZ + Math.random() * (area.maxZ - area.minZ);
    let blocked = false;
    for (const ex of exclude) {
      if (Math.hypot(x - ex.x, z - ex.z) < ex.radius) { blocked = true; break; }
    }
    if (blocked) continue;
    _dummyMat4.position.set(x, 0, z);
    _dummyMat4.rotation.set(0, Math.random() * Math.PI * 2, 0);
    const s = 0.7 + Math.random() * 0.7;
    _dummyMat4.scale.set(s, s * (0.8 + Math.random() * 0.5), s);
    _dummyMat4.updateMatrix();
    mesh.setMatrixAt(placed, _dummyMat4.matrix);
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;

  mesh.userData.update = (t) => {
    if (mat.userData.shader) mat.userData.shader.uniforms.uTime.value = t;
  };
  return mesh;
}

export function createDirtPath(points, width = 2.4, color = 0xe7c9a0) {
  // points: array of [x,z] describing a path centerline
  const shape = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[i + 1];
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz) || 1;
    const nx = (-dz / len) * (width / 2);
    const nz = (dx / len) * (width / 2);
    shape.push([x1 + nx, z1 + nz], [x1 - nx, z1 - nz], [x2 + nx, z2 + nz], [x2 - nx, z2 - nz]);
  }
  const geo = new THREE.BufferGeometry();
  const verts = [];
  const uvs = [];
  for (let i = 0; i < points.length - 1; i++) {
    const base = i * 4;
    const a = shape[base], b = shape[base + 1], c = shape[base + 2], d = shape[base + 3];
    verts.push(a[0], 0.02, a[1], b[0], 0.02, b[1], c[0], 0.02, c[1]);
    verts.push(b[0], 0.02, b[1], d[0], 0.02, d[1], c[0], 0.02, c[1]);
    uvs.push(0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, _matSmooth(color, { roughness: 0.95 }));
  mesh.receiveShadow = true;
  return mesh;
}

export function createCherryTree(bloomColor = 0xffb6d9) {
  const group = new THREE.Group();
  const trunkH = 2.6 + Math.random() * 0.6;

  // A gently curved trunk (lathe-style stacked cylinders with slight lean) reads far more
  // organic than a single straight cone, and the canvas bark texture breaks up the flat color.
  const barkMat = new THREE.MeshStandardMaterial({ map: getBarkTexture(), roughness: 0.95, metalness: 0.02 });
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3((Math.random() - 0.5) * 0.25, trunkH * 0.5, (Math.random() - 0.5) * 0.25),
    new THREE.Vector3((Math.random() - 0.5) * 0.4, trunkH, (Math.random() - 0.5) * 0.4),
  ]);
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 8, 0.2, 7, false);
  const trunk = new THREE.Mesh(trunkGeo, barkMat);
  group.add(shadowed(trunk));
  const topPos = trunkCurve.getPoint(1);

  // Two-tone rounded foliage: a cluster of overlapping mid-poly spheres (not flat-shaded
  // icosahedra) in slightly varied color/size gives a much softer, fuller canopy silhouette.
  const foliageBase = new THREE.Color(bloomColor);
  const foliageDeep = foliageBase.clone().offsetHSL(0, 0.05, -0.1);
  const clusterCount = 7 + Math.floor(Math.random() * 4);
  for (let i = 0; i < clusterCount; i++) {
    const s = 0.75 + Math.random() * 0.65;
    const geo = new THREE.SphereGeometry(s, 8, 7);
    const tint = foliageBase.clone().lerp(foliageDeep, Math.random() * 0.7);
    const mesh = new THREE.Mesh(geo, _mat(tint.getHex(), { roughness: 0.8, flatShading: false }));
    const angle = (i / clusterCount) * Math.PI * 2 + Math.random() * 0.6;
    const r = 0.5 + Math.random() * 0.55;
    mesh.position.set(
      topPos.x + Math.cos(angle) * r,
      topPos.y + 0.3 + Math.random() * 0.9,
      topPos.z + Math.sin(angle) * r
    );
    mesh.scale.y *= 0.85;
    group.add(shadowed(mesh));
  }
  // A crowning cluster to round out the top silhouette.
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.95 + Math.random() * 0.3, 10, 8), _mat(foliageBase.getHex(), { roughness: 0.8, flatShading: false }));
  crown.position.set(topPos.x, topPos.y + 1.1, topPos.z);
  group.add(shadowed(crown));

  return group;
}

const FLOWER_COLORS = [0xff6fa5, 0xffd166, 0xffffff, 0xc792ea, 0xff9770];

let _petalGeo = null;
function getPetalGeometry() {
  if (_petalGeo) return _petalGeo;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.045, 0.015, 0.055, 0.08, 0, 0.13);
  shape.bezierCurveTo(-0.055, 0.08, -0.045, 0.015, 0, 0);
  _petalGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 2, curveSegments: 6 });
  _petalGeo.translate(0, 0, -0.004);
  return _petalGeo;
}

export function createFlower(colorIndex = null, glow = false) {
  const group = new THREE.Group();
  const color = FLOWER_COLORS[colorIndex ?? Math.floor(Math.random() * FLOWER_COLORS.length)];
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.35, 5), _mat(0x4c8c4a, { flatShading: false }));
  stem.position.y = 0.175;
  group.add(stem);
  // A couple of small leaves along the stem add life beyond a bare pole.
  for (const ly of [0.1, 0.2]) {
    const leaf = new THREE.Mesh(getPetalGeometry(), _mat(0x5aa04f, { flatShading: false }));
    leaf.scale.set(0.9, 1.3, 0.5);
    leaf.rotation.set(Math.PI / 2.3, Math.random() * Math.PI * 2, 0);
    leaf.position.set(0, ly, 0);
    group.add(leaf);
  }

  const petalMat = glow
    ? new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, roughness: 0.4, flatShading: false })
    : _matSmooth(color, { roughness: 0.5 });

  const petalCount = 6;
  const petalGeo = getPetalGeometry();
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.set(0, 0.37, 0);
    petal.rotation.x = Math.PI * 0.42;
    petal.rotation.z = angle;
    group.add(petal);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 7), _matSmooth(0xffd166, { roughness: 0.6 }));
  center.position.y = 0.37;
  group.add(center);

  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  if (glow) {
    const light = new THREE.PointLight(color, 1.4, 2.5, 2);
    light.position.y = 0.4;
    group.add(light);
  }
  return group;
}

export function createBench() {
  const group = new THREE.Group();
  const woodMat = _matSmooth(0xb98452, { roughness: 0.7 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.5), woodMat);
  seat.position.y = 0.5;
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.08), woodMat);
  back.position.set(0, 0.75, -0.21);
  group.add(shadowed(seat), shadowed(back));
  for (const sx of [-0.6, 0.6]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.45), woodMat);
    leg.position.set(sx, 0.25, 0);
    group.add(shadowed(leg));
  }
  return group;
}

export function createWindmill() {
  const group = new THREE.Group();
  const bodyMat = _matSmooth(0xfff2e0, { roughness: 0.6 });
  const roofMat = _mat(0xe0607a);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 4.2, 10), bodyMat);
  body.position.y = 2.1;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.4, 10), roofMat);
  roof.position.y = 4.9;
  group.add(shadowed(body), shadowed(roof));

  const bladeHub = new THREE.Group();
  bladeHub.position.set(0, 3.6, 1.15);
  const hubMat = _mat(0x6b4a3a);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), hubMat);
  bladeHub.add(hub);
  const bladeMat = _matSmooth(0xfff7ea, { roughness: 0.55, side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.7, 0.04), bladeMat);
    blade.position.y = 0.85;
    const pivot = new THREE.Group();
    pivot.rotation.z = (i / 4) * Math.PI * 2;
    pivot.add(blade);
    bladeHub.add(pivot);
  }
  group.add(bladeHub);
  group.userData.spin = (dt) => { bladeHub.rotation.z += dt * 0.6; };
  return group;
}

export function createPond(radius = 4) {
  // A plain transparent+shiny material reads as "water" at a fraction of the cost of
  // MeshPhysicalMaterial's transmission (which forces an extra offscreen render pass —
  // one of the most expensive features in three.js, especially rough on mobile/integrated GPUs).
  const geo = new THREE.CircleGeometry(radius, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x6fd0e6,
    roughness: 0.2,
    metalness: 0.15,
    transparent: true,
    opacity: 0.88,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.03;
  mesh.receiveShadow = true;
  mesh.userData.baseGeo = geo;
  mesh.userData.basePositions = geo.attributes.position.array.slice();
  mesh.userData.ripple = (t) => {
    const pos = mesh.geometry.attributes.position;
    const base = mesh.userData.basePositions;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const h = Math.sin(x * 1.3 + t * 1.4) * 0.03 + Math.cos(y * 1.1 + t * 1.1) * 0.03;
      pos.setZ(i, h);
    }
    pos.needsUpdate = true;
  };
  return mesh;
}

export function createFencePost() {
  const group = new THREE.Group();
  const mat = _matSmooth(0xe8dcc8, { roughness: 0.75 });
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), mat);
  post.position.y = 0.35;
  group.add(shadowed(post));
  return group;
}

export function createRock(scale = 1) {
  const geo = new THREE.DodecahedronGeometry(0.3 * scale, 0);
  const mesh = new THREE.Mesh(geo, _mat(0xb9b0c0, { roughness: 0.95 }));
  mesh.rotation.set(Math.random(), Math.random(), Math.random());
  return shadowed(mesh);
}

export function createCloudPuff() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.95 });
  const blobCount = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < blobCount; i++) {
    const s = 0.8 + Math.random() * 0.9;
    const m = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 8), mat);
    m.position.set((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 1.2);
    group.add(m);
  }
  return group;
}

export function createMailbox() {
  const group = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), _matSmooth(0x8a5a3b));
  post.position.y = 0.45;
  const box = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.28, 4, 8), _mat(0xff8fab));
  box.rotation.z = Math.PI / 2;
  box.position.y = 0.95;
  group.add(shadowed(post), shadowed(box));
  return group;
}
