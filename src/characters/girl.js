import * as THREE from 'three';

const skin = new THREE.MeshPhysicalMaterial({ color: 0xffe0c2, roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.6 });
const hair = new THREE.MeshPhysicalMaterial({ color: 0x4a3527, roughness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.3 });
const dress = new THREE.MeshStandardMaterial({ color: 0xff8fab, roughness: 0.5, flatShading: false });
const dressTrim = new THREE.MeshStandardMaterial({ color: 0xfff1e6, roughness: 0.55, flatShading: false });
const blushMat = new THREE.MeshStandardMaterial({ color: 0xff9db3, roughness: 0.8, transparent: true, opacity: 0.8 });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x2a1f2e, roughness: 0.25 });
const eyeShineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.2 });
const browMat = new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.5 });
const mouthMat = new THREE.MeshStandardMaterial({ color: 0xcc5f6e, roughness: 0.5 });

function sh(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }

let _skirtGeo = null;
function getSkirtGeometry() {
  if (_skirtGeo) return _skirtGeo;
  const pts = [
    new THREE.Vector2(0.005, 0.0),
    new THREE.Vector2(0.33, 0.02),
    new THREE.Vector2(0.315, 0.12),
    new THREE.Vector2(0.255, 0.24),
    new THREE.Vector2(0.195, 0.34),
    new THREE.Vector2(0.165, 0.42),
  ];
  _skirtGeo = new THREE.LatheGeometry(pts, 20);
  return _skirtGeo;
}

export function createGirlCharacter() {
  const root = new THREE.Group();

  const hip = new THREE.Group();
  hip.position.y = 0.62;
  root.add(hip);

  // Flared skirt via a lathe-revolved bell profile, plus a fitted bodice — reads far more
  // like real cloth than a straight tapered cylinder.
  const skirt = new THREE.Mesh(getSkirtGeometry(), dress);
  hip.add(sh(skirt));
  const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.17, 0.22, 16), dress);
  bodice.position.y = 0.52;
  hip.add(sh(bodice));
  const waistband = new THREE.Mesh(new THREE.TorusGeometry(0.166, 0.02, 8, 20), dressTrim);
  waistband.rotation.x = Math.PI / 2;
  waistband.position.y = 0.42;
  hip.add(sh(waistband));
  const hemTrim = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.018, 6, 24), dressTrim);
  hemTrim.rotation.x = Math.PI / 2;
  hemTrim.position.y = 0.02;
  hip.add(sh(hemTrim));

  // Neck bridges head to bodice smoothly.
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10), skin);
  neck.position.y = 0.66;
  hip.add(sh(neck));

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.76;
  hip.add(headGroup);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), skin);
  headGroup.add(sh(head));

  // Hair: back mass + two buns + bangs + a center part
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.256, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), hair);
  hairBack.position.y = 0.03;
  headGroup.add(sh(hairBack));
  const bangsL = new THREE.Mesh(new THREE.SphereGeometry(0.246, 12, 8, 0, Math.PI, 0, Math.PI * 0.34), hair);
  bangsL.position.set(0, 0.05, 0.02);
  bangsL.rotation.y = Math.PI * 0.08;
  headGroup.add(sh(bangsL));
  const bangsR = new THREE.Mesh(new THREE.SphereGeometry(0.246, 12, 8, 0, Math.PI, 0, Math.PI * 0.34), hair);
  bangsR.position.set(0, 0.05, 0.02);
  bangsR.rotation.y = Math.PI * 1.08;
  headGroup.add(sh(bangsR));
  for (const side of [-1, 1]) {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), hair);
    bun.position.set(side * 0.26, 0.08, -0.02);
    headGroup.add(sh(bun));
    const strand = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.24, 4, 8), hair);
    strand.position.set(side * 0.27, -0.13, -0.03);
    strand.rotation.z = side * 0.06;
    headGroup.add(sh(strand));
  }

  // Face — brows + sparkly eyes + a soft mouth read much more "alive" than flat dots.
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), eyeMat);
    eye.position.set(side * 0.09, 0.0, 0.226);
    headGroup.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), eyeShineMat);
    shine.position.set(side * 0.09 + 0.012, 0.014, 0.245);
    headGroup.add(shine);
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.06, 2, 4), browMat);
    brow.position.set(side * 0.09, 0.065, 0.21);
    brow.rotation.z = side * 0.25;
    headGroup.add(brow);
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.04, 10), blushMat);
    blush.position.set(side * 0.15, -0.06, 0.2);
    blush.lookAt(blush.position.clone().add(new THREE.Vector3(side * 0.3, -0.1, 1)));
    headGroup.add(blush);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 10, Math.PI), mouthMat);
  mouth.position.set(0, -0.09, 0.215);
  mouth.rotation.x = Math.PI;
  headGroup.add(mouth);

  // Arms
  const arms = [];
  for (const side of [-1, 1]) {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.19, 0.52, 0);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.26, 4, 8), skin);
    arm.position.y = -0.15;
    armPivot.add(sh(arm));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), skin);
    hand.position.y = -0.29;
    armPivot.add(sh(hand));
    hip.add(armPivot);
    arms.push(armPivot);
  }

  // Legs
  const legs = [];
  for (const side of [-1, 1]) {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.1, 0.0, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.26, 4, 8), skin);
    leg.position.y = -0.13;
    legPivot.add(sh(leg));
    const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.05, 3, 8), dressTrim);
    shoe.rotation.z = Math.PI / 2;
    shoe.position.set(0, -0.28, 0.025);
    legPivot.add(sh(shoe));
    hip.add(legPivot);
    legs.push(legPivot);
  }

  root.userData.parts = { hip, headGroup, arms, legs };

  let walkT = 0;
  let idleT = Math.random() * 10;

  function update(dt, moving) {
    idleT += dt;
    if (moving) {
      walkT += dt * 8;
      const swing = Math.sin(walkT) * 0.55;
      arms[0].rotation.x = swing;
      arms[1].rotation.x = -swing;
      legs[0].rotation.x = -swing * 0.8;
      legs[1].rotation.x = swing * 0.8;
      hip.position.y = 0.62 + Math.abs(Math.sin(walkT)) * 0.05;
      headGroup.rotation.z = Math.sin(walkT * 0.5) * 0.04;
    } else {
      walkT *= 0.9;
      arms[0].rotation.x *= 0.85;
      arms[1].rotation.x *= 0.85;
      legs[0].rotation.x *= 0.85;
      legs[1].rotation.x *= 0.85;
      hip.position.y = 0.62 + Math.sin(idleT * 1.6) * 0.012;
      headGroup.rotation.z = Math.sin(idleT * 0.8) * 0.02;
    }
  }

  return { root, update };
}
