import * as THREE from 'three';

const skin = new THREE.MeshStandardMaterial({ color: 0xffe0c2, roughness: 0.6 });
const hair = new THREE.MeshStandardMaterial({ color: 0x4a3527, roughness: 0.45 });
const dress = new THREE.MeshStandardMaterial({ color: 0xff8fab, roughness: 0.55 });
const dressTrim = new THREE.MeshStandardMaterial({ color: 0xfff1e6, roughness: 0.6 });
const blushMat = new THREE.MeshStandardMaterial({ color: 0xff9db3, roughness: 0.8, transparent: true, opacity: 0.85 });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x2a1f2e, roughness: 0.3 });

function sh(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }

export function createGirlCharacter() {
  const root = new THREE.Group();

  const hip = new THREE.Group();
  hip.position.y = 0.62;
  root.add(hip);

  // Dress (torso) — cone-ish via cylinder tapering for a skirt silhouette
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.32, 0.55, 10), dress);
  torso.position.y = 0.28;
  hip.add(sh(torso));
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 6, 16), dressTrim);
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.02;
  hip.add(sh(trim));

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.72;
  hip.add(headGroup);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), skin);
  headGroup.add(sh(head));

  // Hair: back mass + two buns + bangs
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.255, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65), hair);
  hairBack.position.y = 0.03;
  headGroup.add(sh(hairBack));
  const bangs = new THREE.Mesh(new THREE.SphereGeometry(0.245, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.32), hair);
  bangs.position.y = 0.05;
  bangs.position.z = 0.02;
  headGroup.add(sh(bangs));
  for (const side of [-1, 1]) {
    const bun = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), hair);
    bun.position.set(side * 0.26, 0.08, -0.02);
    headGroup.add(sh(bun));
    const strand = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.22, 3, 6), hair);
    strand.position.set(side * 0.27, -0.12, -0.03);
    headGroup.add(sh(strand));
  }

  // Face
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeMat);
    eye.position.set(side * 0.09, 0.0, 0.225);
    headGroup.add(eye);
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.04, 10), blushMat);
    blush.position.set(side * 0.15, -0.06, 0.2);
    blush.lookAt(blush.position.clone().add(new THREE.Vector3(side * 0.3, -0.1, 1)));
    headGroup.add(blush);
  }

  // Arms
  const arms = [];
  for (const side of [-1, 1]) {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.19, 0.5, 0);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.28, 3, 6), skin);
    arm.position.y = -0.16;
    armPivot.add(sh(arm));
    hip.add(armPivot);
    arms.push(armPivot);
  }

  // Legs
  const legs = [];
  for (const side of [-1, 1]) {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.1, 0.02, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.3, 3, 6), skin);
    leg.position.y = -0.15;
    legPivot.add(sh(leg));
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), dressTrim);
    shoe.position.y = -0.32;
    shoe.scale.set(1, 0.7, 1.3);
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
