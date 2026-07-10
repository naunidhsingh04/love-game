import * as THREE from 'three';

function sh(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }

export function createCat(color = 0xf3c99b) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x3a2a2a, roughness: 0.4 });
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat);
  body.scale.set(1.3, 0.85, 1);
  body.position.y = 0.16;
  root.add(sh(body));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mat);
  head.position.set(0, 0.24, 0.16);
  root.add(sh(head));
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.08, 6), mat);
    ear.position.set(side * 0.07, 0.32, 0.16);
    root.add(sh(ear));
  }
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.28, 3, 6), mat);
  tail.position.set(0, 0.18, -0.22);
  tail.rotation.x = -0.6;
  root.add(sh(tail));
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), darkMat);
    eye.position.set(side * 0.05, 0.25, 0.25);
    root.add(eye);
  }
  root.userData.tail = tail;
  root.userData.update = (dt, t) => { tail.rotation.z = Math.sin(t * 3) * 0.3; };
  return root;
}

export function createChick() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffe066, roughness: 0.6 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xff9f45, roughness: 0.5 });
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mat);
  body.position.y = 0.11;
  root.add(sh(body));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat);
  head.position.set(0, 0.2, 0.06);
  root.add(sh(head));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.05, 6), beakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.2, 0.13);
  root.add(beak);
  root.userData.update = (dt, t) => { root.position.y = Math.abs(Math.sin(t * 6)) * 0.05; };
  return root;
}

export function createDuckling() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xfff2a8, roughness: 0.6 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xff9f45, roughness: 0.5 });
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat);
  body.scale.set(1.1, 0.9, 1.3);
  body.position.y = 0.13;
  root.add(sh(body));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat);
  head.position.set(0, 0.24, 0.12);
  root.add(sh(head));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 6), beakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.23, 0.21);
  root.add(beak);
  return root;
}
