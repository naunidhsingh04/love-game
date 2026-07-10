import * as THREE from 'three';

const fur = new THREE.MeshStandardMaterial({ color: 0xfff6ee, roughness: 0.65 });
const furShade = new THREE.MeshStandardMaterial({ color: 0xffe3ea, roughness: 0.7 });
const innerEar = new THREE.MeshStandardMaterial({ color: 0xffb6c9, roughness: 0.6 });
const blushMat = new THREE.MeshStandardMaterial({ color: 0xff9db3, roughness: 0.8, transparent: true, opacity: 0.85 });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x2a1f2e, roughness: 0.2 });

function sh(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }

export function createMochi() {
  const root = new THREE.Group();

  const bob = new THREE.Group();
  bob.position.y = 0.32;
  root.add(bob);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 12), fur);
  body.scale.set(1, 0.85, 1.1);
  bob.add(sh(body));

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.34, 0.16);
  bob.add(headGroup);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), fur);
  headGroup.add(sh(head));

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), furShade);
  muzzle.position.set(0, -0.06, 0.18);
  headGroup.add(sh(muzzle));
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), innerEar);
  nose.position.set(0, -0.02, 0.27);
  headGroup.add(nose);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
    eye.position.set(side * 0.09, 0.03, 0.19);
    headGroup.add(eye);
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.045, 10), blushMat);
    blush.position.set(side * 0.15, -0.03, 0.16);
    blush.lookAt(blush.position.clone().add(new THREE.Vector3(side * 0.3, -0.1, 1)));
    headGroup.add(blush);
  }

  const ears = [];
  for (const side of [-1, 1]) {
    const earPivot = new THREE.Group();
    earPivot.position.set(side * 0.1, 0.16, 0);
    earPivot.rotation.z = side * 0.15;
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.32, 4, 8), fur);
    ear.position.y = 0.2;
    earPivot.add(sh(ear));
    const earInner = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.24, 4, 8), innerEar);
    earInner.position.set(0, 0.19, 0.03);
    earPivot.add(earInner);
    headGroup.add(earPivot);
    ears.push(earPivot);
  }

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), fur);
  tail.position.set(0, 0.05, -0.32);
  bob.add(sh(tail));

  const feet = [];
  for (const [sx, sz] of [[-0.14, 0.12], [0.14, 0.12], [-0.14, -0.12], [0.14, -0.12]]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), fur);
    foot.position.set(sx, -0.22, sz);
    foot.scale.set(1, 0.6, 1.1);
    bob.add(sh(foot));
    feet.push(foot);
  }

  root.userData.parts = { bob, headGroup, ears, feet };

  let hopT = 0;
  let idleT = Math.random() * 10;

  function update(dt, moving) {
    idleT += dt;
    const earWiggle = Math.sin(idleT * 2.2) * 0.06;
    ears[0].rotation.x = earWiggle;
    ears[1].rotation.x = -earWiggle * 0.6;

    if (moving) {
      hopT += dt * 9;
      const hop = Math.abs(Math.sin(hopT));
      bob.position.y = 0.32 + hop * 0.22;
      const squash = 1 - hop * 0.18;
      bob.scale.set(1 + hop * 0.08, squash, 1 + hop * 0.08);
      headGroup.rotation.x = -hop * 0.15;
    } else {
      hopT *= 0.9;
      const breathe = Math.sin(idleT * 1.8) * 0.015;
      bob.position.y = 0.32 + breathe;
      bob.scale.set(1, 1 + breathe * 0.4, 1);
      headGroup.rotation.x *= 0.8;
    }
  }

  return { root, update };
}
