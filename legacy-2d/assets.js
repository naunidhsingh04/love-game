/* ==========================================
   Realistic HD Art & Image Asset Loader
   ========================================== */

export const PALETTE = {
  'white': '#ffffff',
  'black': '#1c1921',
  'pink': '#ff4081',
  'light_pink': '#ff80ab',
  'rose': '#e91e63',
  'peach': '#ffe0b2',
  'yellow': '#ffd600',
  'gold': '#ffa000',
  'green': '#4caf50',
  'dark_green': '#2e7d32',
  'blue': '#00b0ff',
  'cyan': '#00e5ff',
  'purple': '#7c4dff',
  'brown': '#5d4037',
  'grey': '#78909c',
  'light_grey': '#cfd8dc',
  'shadow': 'rgba(0, 0, 0, 0.18)'
};

class ArtAssetManager {
  constructor() {
    this.images = {};
    this.loadImages();
  }

  init() {
    // API compatibility
  }

  loadImages() {
    const list = {
      'mochi_bunny': 'assets/mochi_bunny.png?v=6',
      'meadow_bg': 'assets/meadow_bg.png?v=6',
      'forest_bg': 'assets/forest_bg.png?v=6',
      'snow_bg': 'assets/snow_bg.png?v=6',
      'star_bg': 'assets/star_bg.png?v=6',
      'world_map_bg': 'assets/world_map_bg.png?v=6'
    };

    for (const [name, src] of Object.entries(list)) {
      const img = new Image();
      img.src = src;
      this.images[name] = img;
    }
  }

  // Safe draw round rect fallback for browser compatibility
  safeRoundRect(ctx, x, y, w, h, r, fill = true, stroke = false) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      // Manual path fallback if roundRect is not supported
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h - r);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // Draw sprite entry point
  draw(ctx, spriteName, dx, dy, dw, dh, flipHorizontal = false) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;

    if (flipHorizontal) {
      ctx.translate(dx + dw / 2, dy + dh / 2);
      ctx.scale(-1, 1);
      ctx.translate(-(dx + dw / 2), -(dy + dh / 2));
    }

    if (spriteName.startsWith('mochi_')) {
      this.drawMochi(ctx, spriteName, dx, dy, dw, dh);
    } else if (spriteName === 'player_gf') {
      this.drawGF(ctx, dx, dy, dw, dh);
    } else if (spriteName.startsWith('tile_')) {
      this.drawTile(ctx, spriteName, dx, dy, dw, dh);
    } else if (spriteName.startsWith('flower_') || spriteName === 'glowing_flower') {
      this.drawFlower(ctx, spriteName, dx, dy, dw, dh);
    } else if (spriteName === 'mushroom') {
      this.drawMushroom(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'wish_bottle') {
      this.drawWishBottle(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'paper_boat') {
      this.drawPaperBoat(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'star') {
      this.drawStar(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'cupcake') {
      this.drawCupcake(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'teacup') {
      this.drawTeacup(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'lantern') {
      this.drawLantern(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'butterfly') {
      this.drawButterfly(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'bench') {
      this.drawBench(ctx, dx, dy, dw, dh);
    } else if (spriteName.startsWith('cat_')) {
      this.drawCat(ctx, spriteName, dx, dy, dw, dh);
    } else if (spriteName === 'chick' || spriteName === 'duckling') {
      this.drawChick(ctx, spriteName, dx, dy, dw, dh);
    } else if (spriteName === 'mama_duck') {
      this.drawMamaDuck(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'owl') {
      this.drawOwl(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'hedgehog') {
      this.drawHedgehog(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'mouse') {
      this.drawMouse(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'mountain_goat') {
      this.drawMountainGoat(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'cloud_spirit') {
      this.drawCloudSpirit(ctx, dx, dy, dw, dh);
    } else if (spriteName === 'penguin') {
      this.drawPenguin(ctx, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = PALETTE['pink'];
      ctx.fillRect(dx, dy, dw, dh);
    }

    ctx.restore();
  }

  // Draw realistic baby Mochi bunny
  drawMochi(ctx, spriteName, x, y, w, h) {
    const img = this.images['mochi_bunny'];
    const cx = x + w / 2;
    const cy = y + h * 0.65;
    const r = w * 0.35;

    // If loaded, draw the high-quality realistic bunny!
    if (img && img.complete && img.naturalWidth > 0) {
      const bob = spriteName.endsWith('_1') ? 4 : 0;
      ctx.save();
      
      // Shadow
      ctx.fillStyle = PALETTE['shadow'];
      ctx.beginPath();
      ctx.ellipse(cx, y + h - 2, r * 1.1, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mirror left movement
      ctx.translate(cx, cy);
      if (spriteName.includes('_left')) {
        ctx.scale(-1, 1);
      }
      
      // Draw fluffy white bunny image centered
      ctx.drawImage(img, -w / 2, -h / 2 - bob, w, h);
      ctx.restore();
      return;
    }

    // High quality vector fallback in case image loads slowly
    ctx.save();
    // shadow
    ctx.fillStyle = PALETTE['shadow'];
    ctx.beginPath();
    ctx.ellipse(cx, y + h - 2, r * 1.1, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body white gradient (fluffy feel)
    const bodyGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.8, '#f5f5f5');
    bodyGrad.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#9e9e9e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw glossy eyes
    ctx.fillStyle = '#0d0d0d';
    ctx.beginPath();
    ctx.arc(cx - r * 0.4, cy - r * 0.15, 4, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.4, cy - r * 0.15, 4, 0, Math.PI * 2);
    ctx.fill();

    // Soft blush cheeks
    ctx.fillStyle = 'rgba(255, 64, 129, 0.4)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.55, cy + r * 0.1, 5, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.55, cy + r * 0.1, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Realistic Chibi Girl
  drawGF(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h * 0.55;

    // Detailed hair shading
    ctx.fillStyle = '#4e342e'; // dark chocolate brown
    ctx.beginPath();
    ctx.arc(cx, cy - 4, w * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Face skin tone
    ctx.fillStyle = '#ffe0b2';
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Large shiny anime eyes
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(cx - w * 0.12, cy - 2, 4.5, 0, Math.PI * 2);
    ctx.arc(cx + w * 0.12, cy - 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - w * 0.12 - 1.5, cy - 3.5, 1.5, 0, Math.PI * 2);
    ctx.arc(cx + w * 0.12 - 1.5, cy - 3.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Dress
    ctx.fillStyle = PALETTE['pink'];
    ctx.beginPath();
    ctx.moveTo(cx, cy + w * 0.22);
    ctx.lineTo(cx - w * 0.25, y + h - 2);
    ctx.lineTo(cx + w * 0.25, y + h - 2);
    ctx.closePath();
    ctx.fill();
  }

  // Draw Scenery Tiles
  drawTile(ctx, spriteName, x, y, w, h) {
    if (spriteName === 'tile_grass') {
      ctx.fillStyle = '#4caf50'; // Vibrant grass
      ctx.fillRect(x, y, w, h);
    } else if (spriteName === 'tile_dirt') {
      ctx.fillStyle = '#795548'; // dirt path
      ctx.fillRect(x, y, w, h);
    } else if (spriteName === 'tile_stone') {
      ctx.fillStyle = '#37474f';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#455a64';
      this.safeRoundRect(ctx, x + 2, y + 2, w - 4, h - 4, 5);
    } else if (spriteName === 'tile_wood') {
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(x, y, w, h);
    } else if (spriteName === 'tile_snow') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
    }
  }

  // Draw Realistic Flowers
  drawFlower(ctx, spriteName, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h / 2;

    // Stem
    ctx.strokeStyle = '#388e3c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, y + h);
    ctx.stroke();

    // Leaves
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy + 6, 6, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    let petalColor = '#ff4081';
    if (spriteName.includes('blue')) petalColor = '#00b0ff';
    else if (spriteName.includes('yellow')) petalColor = '#ffd600';
    else if (spriteName.includes('glowing')) petalColor = '#e0f7fa';

    // Detailed layered petals
    ctx.fillStyle = petalColor;
    const numPetals = 6;
    for (let i = 0; i < numPetals; i++) {
      const angle = (i / numPetals) * Math.PI * 2;
      const px = cx + Math.cos(angle) * (w * 0.22);
      const py = cy + Math.sin(angle) * (w * 0.22);
      ctx.beginPath();
      ctx.arc(px, py, w * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Golden core
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Core detail
    ctx.fillStyle = '#ffb300';
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Realistic Shaded Mushroom
  drawMushroom(ctx, x, y, w, h) {
    const cx = x + w / 2;

    // Stalk
    ctx.fillStyle = '#eceff1';
    ctx.strokeStyle = '#b0bec5';
    ctx.lineWidth = 1.5;
    this.safeRoundRect(ctx, cx - 6, y + h / 2, 12, h / 2, 3, true, true);

    // Red Cap with shading
    const capGrad = ctx.createRadialGradient(cx, y + h * 0.4, 2, cx, y + h * 0.4, w * 0.45);
    capGrad.addColorStop(0, '#ff5252');
    capGrad.addColorStop(0.8, '#ff1744');
    capGrad.addColorStop(1, '#d50000');
    ctx.fillStyle = capGrad;
    
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.45, w * 0.45, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // White polka dots
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 5, y + 10, 3, 0, Math.PI * 2);
    ctx.arc(cx + 6, y + 12, 2.5, 0, Math.PI * 2);
    ctx.arc(cx, y + 6, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Wish Bottle
  drawWishBottle(ctx, x, y, w, h) {
    const cx = x + w / 2;

    // Glass body with radial blue glow
    const bodyGrad = ctx.createRadialGradient(cx, y + h * 0.6, 2, cx, y + h * 0.6, w * 0.5);
    bodyGrad.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
    bodyGrad.addColorStop(0.7, 'rgba(0, 184, 212, 0.25)');
    bodyGrad.addColorStop(1, 'rgba(0, 96, 100, 0.6)');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    this.safeRoundRect(ctx, x + 2, y + h * 0.35, w - 4, h * 0.6, 8, true, true);

    // Cork cap
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(cx - 4, y + 2, 8, 6);
    
    // Inside paper scroll
    ctx.fillStyle = '#ffe082';
    ctx.fillRect(cx - 4, y + h * 0.5, 8, h * 0.25);
  }

  // Draw Paper Boat
  drawPaperBoat(ctx, x, y, w, h) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cfd8dc';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(x + 2, y + h * 0.65);
    ctx.lineTo(x + w * 0.3, y + h * 0.9);
    ctx.lineTo(x + w * 0.7, y + h * 0.9);
    ctx.lineTo(x + w - 2, y + h * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sail
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 4);
    ctx.lineTo(x + w * 0.3, y + h * 0.63);
    ctx.lineTo(x + w * 0.7, y + h * 0.63);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Draw Star Vector
  drawStar(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h / 2;

    // Glowing Star glow background
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, w * 0.8);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#ffd600');
    grad.addColorStop(0.6, 'rgba(255, 214, 0, 0.3)');
    grad.addColorStop(1, 'rgba(255, 214, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Draw shiny 5-point star
    ctx.fillStyle = '#ffd600';
    ctx.beginPath();
    const spikes = 5;
    const rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    for (let i = 0; i < spikes; i++) {
      let tx = cx + Math.cos(rot + i * step * 2) * (w * 0.4);
      let ty = cy + Math.sin(rot + i * step * 2) * (h * 0.4);
      ctx.lineTo(tx, ty);
      tx = cx + Math.cos(rot + (i * 2 + 1) * step) * (w * 0.16);
      ty = cy + Math.sin(rot + (i * 2 + 1) * step) * (h * 0.16);
      ctx.lineTo(tx, ty);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Draw Cupcake
  drawCupcake(ctx, x, y, w, h) {
    const cx = x + w / 2;
    ctx.fillStyle = '#d7ccc8';
    this.safeRoundRect(ctx, cx - w * 0.25, y + h * 0.55, w * 0.5, h * 0.4, 2);

    // Fluffy swirl frosting
    ctx.fillStyle = '#ff4081';
    ctx.beginPath();
    ctx.arc(cx - 5, y + h * 0.45, w * 0.22, 0, Math.PI * 2);
    ctx.arc(cx + 5, y + h * 0.45, w * 0.22, 0, Math.PI * 2);
    ctx.arc(cx, y + h * 0.3, w * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Red cherry
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.2, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Teacup
  drawTeacup(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h * 0.65;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1.5;
    
    // Plate
    ctx.beginPath();
    ctx.ellipse(cx, y + h - 4, w * 0.45, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cup
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.3, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
  }

  // Draw Lantern
  drawLantern(ctx, x, y, w, h) {
    const cx = x + w / 2;
    ctx.fillStyle = '#212121';
    ctx.fillRect(cx - 3, y + h * 0.2, 6, h * 0.8); // Pole

    // Glowing lantern body
    const grad = ctx.createRadialGradient(cx, y + h * 0.35, 2, cx, y + h * 0.35, 18);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#ffd600');
    grad.addColorStop(1, 'rgba(255,214,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.35, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(cx - 7, y + h * 0.25, 14, 16);
  }

  // Draw Butterfly
  drawButterfly(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.fillStyle = '#ff4081';
    ctx.beginPath();
    ctx.ellipse(cx - 6, cy - 3, w * 0.35, h * 0.28, -Math.PI/6, 0, Math.PI * 2);
    ctx.ellipse(cx + 6, cy - 3, w * 0.35, h * 0.28, Math.PI/6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#212121';
    ctx.fillRect(cx - 1, cy - h/2, 2, h);
  }

  // Draw Bench
  drawBench(ctx, x, y, w, h) {
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x + 2, y + 2, w - 4, 6); // back
    ctx.fillRect(x, y + h * 0.4, w, 7); // seat
    ctx.fillStyle = '#212121';
    ctx.fillRect(x + 5, y + h * 0.5, 4, h * 0.5); // legs
    ctx.fillRect(x + w - 9, y + h * 0.5, 4, h * 0.5);
  }

  // Draw Realistic Fluffy Cat
  drawCat(ctx, spriteName, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h * 0.65;
    const r = w * 0.32;

    // Cat body orange fur gradient
    const catGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    catGrad.addColorStop(0, '#ffb74d');
    catGrad.addColorStop(0.7, '#ffa726');
    catGrad.addColorStop(1, '#f57c00');
    ctx.fillStyle = catGrad;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Triangle ears
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 10); ctx.lineTo(cx - 15, cy - 20); ctx.lineTo(cx - 5, cy - 12);
    ctx.moveTo(cx + 10, cy - 10); ctx.lineTo(cx + 15, cy - 20); ctx.lineTo(cx + 5, cy - 12);
    ctx.closePath();
    ctx.fill();

    // Sleeping curved eyes
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 2, 3, 0, Math.PI);
    ctx.moveTo(cx + 8, cy - 2);
    ctx.arc(cx + 5, cy - 2, 3, 0, Math.PI);
    ctx.stroke();
  }

  // Draw Realistic Yellow Chick
  drawChick(ctx, spriteName, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h * 0.65;
    const r = w * 0.35;

    // Soft yellow gradient body
    const chickGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    chickGrad.addColorStop(0, '#fff59d');
    chickGrad.addColorStop(0.8, '#fbc02d');
    chickGrad.addColorStop(1, '#f9a825');
    ctx.fillStyle = chickGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#ff6f00';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy);
    ctx.lineTo(cx - r * 1.1, cy + 2);
    ctx.lineTo(cx - r * 0.6, cy + 4);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 4, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMamaDuck(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h * 0.65;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cfd8dc';
    ctx.lineWidth = 1.5;
    
    // Body
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.38, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Neck / Head
    ctx.beginPath();
    ctx.arc(cx - 10, cy - 18, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Beak
    ctx.fillStyle = '#ffa000';
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 20);
    ctx.lineTo(cx - 28, cy - 18);
    ctx.lineTo(cx - 20, cy - 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(cx - 13, cy - 20, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawOwl(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h * 0.55;

    ctx.fillStyle = '#4e342e';
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Owl face mask
    ctx.fillStyle = '#ffe0b2';
    ctx.beginPath();
    ctx.ellipse(cx - 7, cy - 4, 8, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 7, cy - 4, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glossy eyes
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(cx - 7, cy - 4, 3.5, 0, Math.PI * 2);
    ctx.arc(cx + 7, cy - 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 5, 1, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy - 5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - 4, cy + 6);
    ctx.lineTo(cx + 4, cy + 6);
    ctx.closePath();
    ctx.fill();
  }

  drawHedgehog(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h * 0.65;

    // Spines (Star burst strokes)
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 30; i++) {
      const angle = Math.PI + (i / 30) * Math.PI;
      const len = w * 0.38 + Math.random() * 6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.stroke();
    }

    // Peach snout
    ctx.fillStyle = '#ffe0b2';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, w * 0.28, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(cx + 4, cy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMouse(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h * 0.65;
    ctx.fillStyle = '#90a4ae';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.35, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMountainGoat(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy - 8, w * 0.26, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCloudSpirit(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h * 0.55;
    ctx.fillStyle = 'rgba(224, 247, 250, 0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.arc(cx - 12, cy + 4, 10, 0, Math.PI * 2);
    ctx.arc(cx + 12, cy + 4, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPenguin(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h * 0.65;
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.32, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, w * 0.2, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw organic layered gradient tree vectors (32x48)
  drawTree(ctx, type, dx, dy, dw, dh, time = 0) {
    const windOffset = Math.sin(time * 0.003) * 2.5;

    // Wood trunk with shading
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(dx + dw * 0.42, dy + dh * 0.65, dw * 0.16, dh * 0.35);

    // Leaf colors
    let leafColor1 = '#4caf50';
    let leafColor2 = '#2e7d32';
    
    if (type === 'cherry') {
      leafColor1 = '#ff4081'; // pink
      leafColor2 = '#c2185b'; // dark pink
    } else if (type === 'autumn') {
      leafColor1 = '#ff9100'; // orange
      leafColor2 = '#e65100';
    } else if (type === 'snowflake') {
      leafColor1 = '#ffffff'; // snow white
      leafColor2 = '#b0bec5';
    } else if (type === 'gray') {
      leafColor1 = '#9e9e9e'; // dead memory
      leafColor2 = '#616161';
    } else if (type === 'blooming') {
      leafColor1 = '#ff1744'; // brilliant red bloom
      leafColor2 = '#b71c1c';
    }

    ctx.save();
    ctx.translate(dx + dw / 2, dy + dh * 0.65);
    ctx.rotate(windOffset * 0.012);
    ctx.translate(-(dx + dw / 2), -(dy + dh * 0.65));

    // Foliage layers (curved vector crowns)
    ctx.fillStyle = leafColor2; // Shadow leaves
    ctx.beginPath();
    ctx.arc(dx + dw * 0.3, dy + dh * 0.4, dw * 0.28, 0, Math.PI * 2);
    ctx.arc(dx + dw * 0.7, dy + dh * 0.4, dw * 0.28, 0, Math.PI * 2);
    ctx.arc(dx + dw * 0.5, dy + dh * 0.25, dw * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = leafColor1; // Highlight leaves
    ctx.beginPath();
    ctx.arc(dx + dw * 0.32, dy + dh * 0.36, dw * 0.24, 0, Math.PI * 2);
    ctx.arc(dx + dw * 0.68, dy + dh * 0.36, dw * 0.24, 0, Math.PI * 2);
    ctx.arc(dx + dw * 0.5, dy + dh * 0.22, dw * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw rotating windmill (48x48)
  drawWindmill(ctx, dx, dy, dw, dh, time = 0) {
    const scale = dw / 48;
    const centerX = dx + dw / 2;
    const centerY = dy + dh * 0.45;
    
    // Tower base
    ctx.fillStyle = '#546e7a';
    ctx.beginPath();
    ctx.moveTo(centerX - 10 * scale, dy + dh);
    ctx.lineTo(centerX - 6 * scale, dy + dh * 0.4);
    ctx.lineTo(centerX + 6 * scale, dy + dh * 0.4);
    ctx.lineTo(centerX + 10 * scale, dy + dh);
    ctx.closePath();
    ctx.fill();
    
    // Cap
    ctx.fillStyle = '#ff5252';
    ctx.beginPath();
    ctx.arc(centerX, dy + dh * 0.4, 8 * scale, Math.PI, 0);
    ctx.fill();
    
    // Rotating sails
    const angle = time * 0.001;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#795548';
      ctx.fillRect(-1 * scale, 0, 2 * scale, 18 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1 * scale, 4 * scale, 5 * scale, 12 * scale);
    }
    ctx.restore();
  }

  // Draw flowing water waves
  drawWaterRipple(ctx, dx, dy, dw, dh, time = 0) {
    ctx.fillStyle = '#0288d1'; // deep blue water
    ctx.fillRect(dx, dy, dw, dh);
    
    const offset = Math.floor((time / 180) % w);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dx, dy + offset);
    ctx.lineTo(dx + dw, dy + offset);
    ctx.stroke();
  }
}

// Export single instance
export const Assets = new ArtAssetManager();
export default Assets;
