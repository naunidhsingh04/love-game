// Simple 2D (XZ-plane) circle collision — plenty for a cozy walk-around game, no navmesh needed.

export class CollisionWorld {
  constructor(bounds = { minX: -30, maxX: 30, minZ: -30, maxZ: 30 }) {
    this.bounds = bounds;
    this.colliders = []; // { x, z, radius }
  }

  add(x, z, radius) {
    const c = { x, z, radius };
    this.colliders.push(c);
    return c;
  }

  clear() {
    this.colliders.length = 0;
  }

  /** Resolves a moving circle (px,pz,radius) against all static colliders + world bounds, returns corrected {x,z}. */
  resolve(px, pz, radius) {
    let x = px;
    let z = pz;

    for (const c of this.colliders) {
      const dx = x - c.x;
      const dz = z - c.z;
      const minDist = radius + c.radius;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDist * minDist && distSq > 1e-6) {
        const dist = Math.sqrt(distSq);
        const push = (minDist - dist) / dist;
        x += dx * push;
        z += dz * push;
      }
    }

    const b = this.bounds;
    x = Math.min(Math.max(x, b.minX + radius), b.maxX - radius);
    z = Math.min(Math.max(z, b.minZ + radius), b.maxZ - radius);

    return { x, z };
  }

  /** Returns the nearest collider within `range` of (px,pz), or null. Used for interact prompts. */
  nearest(px, pz, range) {
    let best = null;
    let bestDist = range;
    for (const c of this.colliders) {
      const d = Math.hypot(px - c.x, pz - c.z);
      if (d - c.radius < bestDist) {
        bestDist = d - c.radius;
        best = c;
      }
    }
    return best;
  }
}
