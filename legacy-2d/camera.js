/* ==========================================
   Cozy Interpolating Camera Engine
   ========================================== */

class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    
    this.width = 800;
    this.height = 600;
    
    this.lerpSpeed = 0.08;
    this.zoomSpeed = 0.05;
    
    // Shake settings
    this.shakeTime = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  setBounds(minX, minY, maxX, maxY) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  clearBounds() {
    this.minX = undefined;
    this.minY = undefined;
    this.maxX = undefined;
    this.maxY = undefined;
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  setZoom(z) {
    this.targetZoom = z;
  }

  instant() {
    this.x = this.targetX;
    this.y = this.targetY;
    this.zoom = this.targetZoom;
  }

  shake(durationMs = 400, intensity = 4) {
    this.shakeDuration = durationMs;
    this.shakeTime = durationMs;
    this.shakeIntensity = intensity;
  }

  update(dt = 16) {
    // Lerp zoom
    this.zoom += (this.targetZoom - this.zoom) * this.zoomSpeed;

    // Lerp camera position
    this.x += (this.targetX - this.x) * this.lerpSpeed;
    this.y += (this.targetY - this.y) * this.lerpSpeed;

    // Apply screen constraints if bounds are set and we are zoomed in
    if (this.minX !== undefined && this.zoom >= 0.8) {
      // Calculate view limits based on zoom
      const halfW = (this.width / 2) / this.zoom;
      const halfH = (this.height / 2) / this.zoom;
      
      if (this.x - halfW < this.minX) this.x = this.minX + halfW;
      if (this.x + halfW > this.maxX) this.x = this.maxX - halfW;
      if (this.y - halfH < this.minY) this.y = this.minY + halfH;
      if (this.y + halfH > this.maxY) this.y = this.maxY - halfH;
    }

    // Process camera shaking
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const progress = this.shakeTime / this.shakeDuration;
      // Damping intensity over time
      const currentIntensity = this.shakeIntensity * progress;
      this.offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      this.offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }

  // Transform rendering context to camera view coordinates
  apply(ctx) {
    ctx.save();
    
    // Scale and center camera on screen
    ctx.translate(this.width / 2 + this.offsetX, this.height / 2 + this.offsetY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  // Restore drawing context to screen space
  restore(ctx) {
    ctx.restore();
  }

  // Helper to convert screen coordinates to game coordinates
  screenToWorld(sx, sy) {
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    const wx = (sx - halfW) / this.zoom + this.x;
    const wy = (sy - halfH) / this.zoom + this.y;
    return { x: wx, y: wy };
  }
}

export const Cam = new Camera();
export default Cam;
