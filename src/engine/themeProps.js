import * as THREE from 'three';

const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.03, ...opts });
const glowMat = (color, intensity = 1) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4 });
function sh(m) { m.castShadow = true; m.receiveShadow = true; return m; }
function grp(...meshes) { const g = new THREE.Group(); meshes.forEach((m) => g.add(sh(m))); return g; }

// ---------- Whispering Forest ----------
export function createMushroom(glow = false) {
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.14, 8), mat(0xfff1e6));
  stem.position.y = 0.07;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
    glow ? glowMat(0x9be8ff, 1.1) : mat(0xe8607a));
  cap.position.y = 0.14;
  const g = grp(stem, cap);
  if (glow) { const l = new THREE.PointLight(0x9be8ff, 1.1, 2, 2); l.position.y = 0.2; g.add(l); }
  return g;
}
export function createOwl() {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat(0x8a6a4a));
  body.scale.set(1, 1.2, 0.9);
  body.position.y = 0.14;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.08, 10), mat(0xe8d9c2));
  face.position.set(0, 0.18, 0.12);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 6), mat(0xffb340));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.15, 0.16);
  return grp(body, face, beak);
}
export function createHedgehog() {
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.2, 8), mat(0x7a5a45, { flatShading: true }));
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.1;
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0xd9b896));
  face.position.set(0, 0.1, 0.12);
  return grp(body, face);
}

// ---------- Bloom Garden ----------
export function createFountain() {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.4, 16), mat(0xe8dcc8));
  base.position.y = 0.2;
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.3, 16), mat(0x9fd6e8, { transparent: true, opacity: 0.75, roughness: 0.2 }));
  basin.position.y = 0.42;
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1, 8), mat(0xfff1e6));
  pillar.position.y = 0.9;
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(0xff8fab));
  top.position.y = 1.45;
  return grp(base, basin, pillar, top);
}
export function createBee() {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0xffd166));
  const wing = new THREE.Mesh(new THREE.CircleGeometry(0.05, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
  wing.position.y = 0.04;
  wing.rotation.x = Math.PI / 2;
  return grp(body, wing);
}
export function createGiantSunflower() {
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.6, 8), mat(0x4c8c4a));
  stem.position.y = 0.8;
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(0x8a5a3b));
  center.position.y = 1.7;
  const petalMat = mat(0xffd166, { flatShading: false });
  const g = grp(stem, center);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), petalMat);
    petal.scale.set(1, 0.4, 2);
    petal.position.set(Math.cos(a) * 0.4, 1.7, Math.sin(a) * 0.4);
    petal.lookAt(0, 1.7, 0);
    g.add(sh(petal));
  }
  g.scale.setScalar(0.05);
  return g;
}
export function createRainbowArc() {
  const colors = [0xff6b6b, 0xffb347, 0xffe066, 0x8fd694, 0x7fd8e8, 0xa78bfa];
  const g = new THREE.Group();
  colors.forEach((c, i) => {
    const r = 3 + i * 0.18;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(r, 0.08, 8, 32, Math.PI), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, transparent: true, opacity: 0.85 }));
    g.add(arc);
  });
  return g;
}

// ---------- Cozy Castle ----------
export function createLantern(lit = true) {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), mat(0x6b4a3a));
  post.position.y = 0.25;
  const cage = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), lit ? glowMat(0xffd166, 1.2) : mat(0x8a8a8a));
  cage.position.y = 0.52;
  const g = grp(post, cage);
  if (lit) { const l = new THREE.PointLight(0xffd166, 0.8, 2.5, 2); l.position.y = 0.52; g.add(l); }
  return g;
}
export function createCupcake() {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.08, 10), mat(0xe8b899));
  base.position.y = 0.04;
  const icing = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), mat(0xffb6d9));
  icing.position.y = 0.1;
  const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), mat(0xe8405a));
  cherry.position.y = 0.16;
  return grp(base, icing, cherry);
}
export function createTeacup() {
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.06, 12), mat(0xfff8f0));
  cup.position.y = 0.03;
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.015, 16), mat(0xfff1e6));
  return grp(cup, saucer);
}
export function createMouseCritter() {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(0xc9b8a8));
  body.position.y = 0.07;
  const ear1 = new THREE.Mesh(new THREE.CircleGeometry(0.03, 8), mat(0xffc2cf));
  ear1.position.set(-0.04, 0.12, 0.02);
  const ear2 = ear1.clone();
  ear2.position.x = 0.04;
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.14, 3, 6), mat(0xc9b8a8));
  tail.rotation.x = Math.PI / 2;
  tail.position.set(0, 0.05, -0.1);
  return grp(body, ear1, ear2, tail);
}
export function createCastleTower(h = 5.5) {
  const bodyMat = mat(0xe8e0d8, { roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, h, 12), bodyMat);
  body.position.y = h / 2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.6, 12), mat(0xe0607a));
  roof.position.y = h + 0.7;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), mat(0xff8fab, { side: THREE.DoubleSide }));
  flag.position.set(0.15, h + 1.7, 0);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), mat(0x8a5a3b));
  pole.position.y = h + 1.5;
  return grp(body, roof, flag, pole);
}

// ---------- Melody Village ----------
export function createInstrument(kind = 'piano') {
  const g = new THREE.Group();
  const bodyMat = mat(0x8a5a3b, { roughness: 0.55 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.5), bodyMat);
  body.position.y = 0.25;
  g.add(sh(body));
  const keys = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.15), mat(0xfff8f0));
  keys.position.set(0, 0.42, 0.28);
  g.add(sh(keys));
  return g;
}
export function createBell() {
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 12, 1, true), mat(0xffd166, { metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide }));
  bell.position.y = 0.1;
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat(0xffd166, { metalness: 0.6 }));
  top.position.y = 0.2;
  return grp(bell, top);
}
export function createVillageHouse(roofColor = 0xff8fab) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 1.4), mat(0xfff1e6));
  wall.position.y = 0.65;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1, 4), mat(roofColor));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 1.6;
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.7), mat(0x8a5a3b));
  door.position.set(0, 0.35, 0.71);
  const window = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12), glowMat(0xfff2a8, 0.6));
  window.position.set(0.5, 0.85, 0.71);
  return grp(wall, roof, door, window);
}

// ---------- Snowflake Village ----------
export function createSnowman() {
  const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(0xffffff, { roughness: 0.85 }));
  bottom.position.y = 0.16;
  const mid = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mat(0xffffff, { roughness: 0.85 }));
  mid.position.y = 0.36;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat(0xffffff, { roughness: 0.85 }));
  head.position.y = 0.5;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.06, 6), mat(0xff9f45));
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.5, 0.08);
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 12), mat(0xff4d94));
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 0.42;
  return grp(bottom, mid, head, nose, scarf);
}
export function createFireplaceHut() {
  const hut = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.1, 8), mat(0xfff8f0, { roughness: 0.8 }));
  hut.position.y = 0.55;
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.25, 12), glowMat(0xff9f45, 1.4));
  glow.position.set(0, 0.3, 0.75);
  const light = new THREE.PointLight(0xff9f45, 1, 3, 2);
  light.position.set(0, 0.4, 0.9);
  const g = grp(hut, glow);
  g.add(light);
  return g;
}
export function createMug() {
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.12, 12), mat(0xff8fab));
  cup.position.y = 0.06;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 10), mat(0xff8fab));
  handle.rotation.y = Math.PI / 2;
  handle.position.set(0.09, 0.06, 0);
  const steam = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }));
  steam.position.y = 0.16;
  return grp(cup, handle, steam);
}
export function createPenguin() {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0x2a2a3a));
  body.scale.set(1, 1.3, 0.9);
  body.position.y = 0.14;
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(0xffffff));
  belly.scale.set(0.8, 1.1, 0.6);
  belly.position.set(0, 0.13, 0.06);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 6), mat(0xff9f45));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.16, 0.13);
  return grp(body, belly, beak);
}

// ---------- Star Observatory ----------
export function createTelescope() {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.3, 10), mat(0x6b5a8a));
  base.position.y = 0.15;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), mat(0xc9b8e8, { metalness: 0.4 }));
  arm.rotation.z = Math.PI / 4;
  arm.position.set(0.1, 0.55, 0);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.7, 10), mat(0x3a2a5e, { metalness: 0.3 }));
  tube.rotation.z = Math.PI / 3.2;
  tube.position.set(0.32, 0.85, 0);
  return grp(base, arm, tube);
}
export function createObservatoryDome() {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 2, 16), mat(0xe8e0f0));
  base.position.y = 1;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(0x6b5a8a, { metalness: 0.3, roughness: 0.4 }));
  dome.position.y = 2;
  return grp(base, dome);
}
export function createStarPickup() {
  const geo = new THREE.OctahedronGeometry(0.12, 0);
  const m = new THREE.Mesh(geo, glowMat(0xfff2a8, 1.3));
  const l = new THREE.PointLight(0xfff2a8, 0.9, 2, 2);
  const g = grp(m);
  g.add(l);
  return g;
}

// ---------- Color Workshop ----------
export function createEasel() {
  const canvas = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), mat(0xffffff, { side: THREE.DoubleSide }));
  canvas.position.y = 0.55;
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), mat(0x8a5a3b));
  legL.position.set(-0.25, 0.35, 0.1);
  legL.rotation.z = 0.2;
  const legR = legL.clone();
  legR.position.x = 0.25;
  legR.rotation.z = -0.2;
  return grp(canvas, legL, legR);
}
export function createPaintBucket(color = 0xff6b6b) {
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.12, 10), mat(0xc9b8a8));
  bucket.position.y = 0.06;
  const paint = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 10), glowMat(color, 0.5));
  paint.position.y = 0.11;
  return grp(bucket, paint);
}

// ---------- Courage Mountain ----------
export function createRopeBridgeSegment() {
  const plank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.25), mat(0x8a5a3b));
  return grp(plank);
}
export function createWoodenSign() {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 6), mat(0x6b4a3a));
  post.position.y = 0.35;
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.04), mat(0xd9b896));
  board.position.y = 0.65;
  return grp(post, board);
}
export function createGoat() {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat(0xe8e0d0));
  body.scale.set(1.3, 1, 1);
  body.position.y = 0.22;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat(0xe8e0d0));
  head.position.set(0, 0.28, 0.16);
  const horn1 = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.08, 6), mat(0x8a7a6a));
  horn1.position.set(-0.04, 0.35, 0.14);
  const horn2 = horn1.clone();
  horn2.position.x = 0.04;
  return grp(body, head, horn1, horn2);
}
export function createBeacon() {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.4, 10), mat(0x8a5a3b));
  post.position.y = 0.7;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(0x6b4a3a));
  bowl.position.y = 1.4;
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 8), glowMat(0xff8f3a, 1.5));
  flame.position.y = 1.55;
  const light = new THREE.PointLight(0xff8f3a, 1.2, 4, 2);
  light.position.y = 1.6;
  const g = grp(post, bowl, flame);
  g.add(light);
  return g;
}

// ---------- Festival of Smiles ----------
export function createFestivalTent(color = 0xff6fa5) {
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.6, 8), mat(color));
  roof.position.y = 1.1;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8), mat(0xfff8f0));
  pole.position.y = 0.6;
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.4), mat(0xfff1e6));
  counter.position.y = 0.25;
  return grp(roof, pole, counter);
}
export function createPlushie() {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mat(0xffd6e6));
  body.position.y = 0.11;
  const ear1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat(0xffd6e6));
  ear1.position.set(-0.06, 0.2, 0);
  const ear2 = ear1.clone();
  ear2.position.x = 0.06;
  return grp(body, ear1, ear2);
}
export function createBalloon(color = 0xff6b6b) {
  const bal = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), glowMat(color, 0.3));
  bal.scale.set(0.9, 1.2, 0.9);
  bal.position.y = 1.4;
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 1.2, 4), mat(0x8a8a8a));
  string.position.y = 0.8;
  return grp(bal, string);
}

// ---------- Dream Islands ----------
export function createCloudPlatform(r = 1.8) {
  const g = new THREE.Group();
  const mat2 = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
  for (let i = 0; i < 6; i++) {
    const s = r * (0.5 + Math.random() * 0.5);
    const m = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), mat2);
    m.position.set((Math.random() - 0.5) * r * 1.3, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * r * 1.3);
    g.add(sh(m));
  }
  return g;
}
export function createDreamBubble() {
  const geo = new THREE.SphereGeometry(0.16, 12, 10);
  const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.5, roughness: 0.1, transmission: 0, metalness: 0 }));
  return grp(m);
}

// ---------- Memory Grove / Heart Kingdom ----------
export function createKeepsakeChest() {
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.2), mat(0x8a5a3b));
  base.position.y = 0.09;
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 8, 1, false, 0, Math.PI), mat(0x6b4a3a));
  lid.rotation.z = Math.PI / 2;
  lid.position.y = 0.18;
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), glowMat(0xff8fab, 1));
  gem.position.set(0, 0.19, 0.1);
  return grp(base, lid, gem);
}
export function createGoldenGate(h = 4) {
  const postMat = mat(0xffd166, { metalness: 0.6, roughness: 0.3 });
  const l = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, h, 10), postMat);
  l.position.set(-1.4, h / 2, 0);
  const r = l.clone(); r.position.x = 1.4;
  const top = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.1, 8, 20, Math.PI), postMat);
  top.position.set(0, h, 0);
  return grp(l, r, top);
}
export function createBanner(color = 0xff8fab) {
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1), mat(color, { side: THREE.DoubleSide }));
  return grp(cloth);
}
export function createThrone() {
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.5), mat(0xffd166, { metalness: 0.4 }));
  seat.position.y = 0.5;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.1), mat(0xffd166, { metalness: 0.4 }));
  back.position.set(0, 0.95, -0.2);
  return grp(seat, back);
}
export function createCake(tiers = 3) {
  const g = new THREE.Group();
  let y = 0;
  for (let i = tiers; i > 0; i--) {
    const r = 0.16 * i / tiers + 0.08;
    const h = 0.16;
    const tier = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, h, 14), mat(0xfff1e6));
    tier.position.y = y + h / 2;
    g.add(sh(tier));
    y += h;
  }
  const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat(0xe8405a));
  cherry.position.y = y + 0.03;
  g.add(sh(cherry));
  return g;
}
