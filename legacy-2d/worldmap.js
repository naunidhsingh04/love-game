/* ==========================================
   Cozy Animated World Map System
   ========================================== */

import { Assets, PALETTE } from './assets.js';
import { Particles } from './particles.js';
import { Cam } from './camera.js';
import { Audio } from './audio.js';

// Map Dimensions
export const MAP_WIDTH = 1400;
export const MAP_HEIGHT = 1000;

class WorldMap {
  constructor() {
    this.nodes = [];
    this.activeNodeIndex = 0;
    this.completedCount = 0;
    
    // Traversal animation variables
    this.isTransitioning = false;
    this.transitionTime = 0;
    this.transitionDuration = 1800; // ms
    this.startNode = null;
    this.endNode = null;
    this.mochiX = 0;
    this.mochiY = 0;
    this.mochiHopY = 0;

    this.windmills = [
      { x: 120, y: 580 },
      { x: 740, y: 720 }
    ];

    this.clouds = [
      { x: 100, y: 150, size: 40, speed: 0.15 },
      { x: 600, y: 80, size: 55, speed: 0.12 },
      { x: 1100, y: 200, size: 35, speed: 0.18 },
      { x: 300, y: 350, size: 45, speed: 0.1 }
    ];
  }

  init(completedCount = 0) {
    this.completedCount = completedCount;
    this.activeNodeIndex = completedCount;

    // Define all 15 Level Nodes on the map coordinate space
    this.nodes = [
      { id: 1,  name: "Blossom Meadow",     x: 180,  y: 650, theme: "First Impressions & New Beginnings", color: PALETTE['pink'] },
      { id: 2,  name: "River of Wishes",    x: 320,  y: 580, theme: "Dreams & Promises",                  color: PALETTE['blue'] },
      { id: 3,  name: "Whispering Forest",  x: 480,  y: 520, theme: "Quiet Feelings",                      color: PALETTE['dark_green'] },
      { id: 4,  name: "Bloom Garden",       x: 640,  y: 480, theme: "Growing Together",                  color: PALETTE['green'] },
      { id: 5,  name: "Cozy Castle",        x: 800,  y: 520, theme: "Feeling at Home",                   color: PALETTE['grey'] },
      { id: 6,  name: "Melody Village",     x: 960,  y: 600, theme: "The Songs That Stay With Us",         color: PALETTE['yellow'] },
      { id: 7,  name: "Snowflake Village",  x: 1100, y: 680, theme: "Warmth During Cold Days",             color: PALETTE['white'] },
      { id: 8,  name: "Star Observatory",   x: 1180, y: 460, theme: "Dreams Bigger Than The Sky",         color: PALETTE['purple'] },
      { id: 9,  name: "Color Workshop",     x: 1040, y: 340, theme: "Bringing Color Back",                 color: PALETTE['peach'] },
      { id: 10, name: "Courage Mountain",   x: 880,  y: 260, theme: "Supporting Each Other",               color: '#cfd8dc' },
      { id: 11, name: "Festival of Smiles", x: 700,  y: 220, theme: "Happiness Is Better When Shared",     color: PALETTE['rose'] },
      { id: 12, name: "Dream Islands",      x: 520,  y: 180, theme: "Every Dream Begins Somewhere",       color: '#b3e5fc' },
      { id: 13, name: "Memory Grove",       x: 340,  y: 220, theme: "Looking Back Without Letting Go",     color: '#d7ccc8' },
      { id: 14, name: "Heart Kingdom",      x: 200,  y: 340, theme: "Every Memory Leads Home",             color: '#ff8a80' },
      { id: 15, name: "Final Garden",       x: 380,  y: 380, theme: "Home",                                color: '#f8bbd0' }
    ];

    // Position Mochi on active node
    const activeNode = this.nodes[Math.min(this.activeNodeIndex, this.nodes.length - 1)];
    this.mochiX = activeNode.x;
    this.mochiY = activeNode.y;
  }

  // Animate transition from one level to the next
  startHopTransition(fromIdx, toIdx, onFinish) {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    this.transitionTime = 0;
    this.startNode = this.nodes[fromIdx];
    this.endNode = this.nodes[toIdx];
    
    this.completedCount = Math.max(this.completedCount, toIdx);
    this.activeNodeIndex = toIdx;

    Audio.playChime(); // Play transition sound

    this.onTransitionEnd = onFinish;
  }

  update(dt = 16, time = 0) {
    // Drifting clouds update
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * dt * 0.05;
      if (cloud.x > MAP_WIDTH + 100) {
        cloud.x = -150;
      }
    }

    // Traversal animation logic
    if (this.isTransitioning) {
      this.transitionTime += dt;
      let progress = this.transitionTime / this.transitionDuration;
      if (progress >= 1.0) {
        progress = 1.0;
        this.isTransitioning = false;
        this.mochiX = this.endNode.x;
        this.mochiY = this.endNode.y;
        this.mochiHopY = 0;
        if (this.onTransitionEnd) {
          this.onTransitionEnd();
        }
      } else {
        // Linear interpolate main position
        this.mochiX = this.startNode.x + (this.endNode.x - this.startNode.x) * progress;
        this.mochiY = this.startNode.y + (this.endNode.y - this.startNode.y) * progress;
        
        // Parabolic hopping heights
        const hopCount = 3;
        this.mochiHopY = -Math.abs(Math.sin(progress * Math.PI * hopCount)) * 32;

        // Spawn footprint sparkles
        if (this.transitionTime % 80 < 16) {
          Particles.spawnSparkles(this.mochiX, this.mochiY + 8, 2, PALETTE['yellow']);
        }
      }

    }

    // Fit the entire map on screen dynamically (every frame)
    const zoom = Math.min(Cam.width / MAP_WIDTH, Cam.height / MAP_HEIGHT);
    Cam.setZoom(zoom);
    Cam.setTarget(MAP_WIDTH / 2, MAP_HEIGHT / 2);
  }

  draw(ctx, time = 0) {
    // 1. Draw the high-resolution, realistic world map background!
    const bgImg = Assets.images['world_map_bg'];
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.drawImage(bgImg, 0, 0, MAP_WIDTH, MAP_HEIGHT);
    } else {
      // Fallback plain green
      ctx.fillStyle = '#66bb6a';
      ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    }

    // Draw flowing river (River of wishes crossing map)
    ctx.fillStyle = PALETTE['blue'];
    ctx.beginPath();
    ctx.moveTo(0, 750);
    ctx.bezierCurveTo(400, 680, 800, 850, MAP_WIDTH, 780);
    ctx.lineTo(MAP_WIDTH, 840);
    ctx.bezierCurveTo(800, 910, 400, 740, 0, 810);
    ctx.closePath();
    ctx.fill();

    // Renders river waves
    ctx.strokeStyle = '#e0f7fa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 780 + Math.sin(time * 0.002) * 5);
    ctx.bezierCurveTo(400, 710 + Math.sin(time * 0.002 + 1) * 5, 800, 880 + Math.sin(time * 0.002 + 2) * 5, MAP_WIDTH, 810 + Math.sin(time * 0.002 + 3) * 5);
    ctx.stroke();

    // Draw Forest cluster (top right)
    for (let i = 0; i < 15; i++) {
      const tx = 400 + (i % 5) * 40 + Math.sin(i) * 10;
      const ty = 420 + Math.floor(i / 5) * 35;
      Assets.drawTree(ctx, 'green', tx, ty, 32, 48, time);
    }

    // Draw Cozy Castle surroundings
    ctx.fillStyle = PALETTE['grey'];
    ctx.fillRect(780, 420, 48, 48); // Simple castle stub base
    ctx.fillStyle = PALETTE['rose'];
    ctx.beginPath();
    ctx.moveTo(775, 420);
    ctx.lineTo(804, 395);
    ctx.lineTo(833, 420);
    ctx.closePath();
    ctx.fill();

    // Draw snowy zone (bottom right)
    ctx.fillStyle = '#f5f5f5'; // snow floor
    ctx.beginPath();
    ctx.arc(1100, 700, 160, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      Assets.drawTree(ctx, 'snowflake', 1020 + i * 25, 620 + Math.sin(i)*15, 24, 36, time);
    }

    // Draw Floating Dream Islands (top left)
    ctx.fillStyle = '#b3e5fc';
    ctx.beginPath();
    ctx.arc(520, 150, 60, 0, Math.PI * 2);
    ctx.arc(460, 190, 40, 0, Math.PI * 2);
    ctx.fill();

    // Draw Mountain graphics (top right)
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.moveTo(820, 300);
    ctx.lineTo(880, 180);
    ctx.lineTo(940, 300);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff'; // mountain snow caps
    ctx.beginPath();
    ctx.moveTo(860, 220);
    ctx.lineTo(880, 180);
    ctx.lineTo(900, 220);
    ctx.closePath();
    ctx.fill();

    // Draw Windmills
    for (const wm of this.windmills) {
      Assets.drawWindmill(ctx, wm.x, wm.y, 48, 48, time);
    }

    // Draw the Central MEMORY TREE (Core of the game)
    const treeX = 350;
    const treeY = 320;
    let treeType = 'gray';
    if (this.completedCount >= 14) {
      treeType = 'blooming';
    } else if (this.completedCount >= 5) {
      // Partially restoring leaves
      treeType = 'cherry';
    }
    Assets.drawTree(ctx, treeType, treeX, treeY, 64, 96, time);

    // Draw Flowers around Memory Tree (Hidden detail: 1 flower for each completed level)
    for (let i = 0; i < this.completedCount; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const fx = treeX + 32 + Math.cos(angle) * 45 - 4;
      const fy = treeY + 80 + Math.sin(angle) * 20 - 4;
      const type = ['flower_red', 'flower_blue', 'flower_yellow'][i % 3];
      Assets.draw(ctx, type, fx, fy, 8, 8);
    }

    // Draw paths between nodes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    for (let i = 0; i < this.nodes.length - 1; i++) {
      if (i === 0) {
        ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
      }
      ctx.lineTo(this.nodes[i + 1].x, this.nodes[i + 1].y);
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Draw Level Nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const isCompleted = i < this.completedCount;
      const isActive = i === this.activeNodeIndex;
      
      // Node circle
      ctx.fillStyle = isCompleted ? node.color : '#90a4ae';
      ctx.lineWidth = isActive ? 4 : 2;
      ctx.strokeStyle = isActive ? PALETTE['rose'] : '#ffffff';
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, isActive ? 15 : 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#2b2730';
      ctx.font = 'bold 10px Quicksand';
      ctx.textAlign = 'center';
      ctx.fillText(node.id, node.x, node.y + 3);

      // Level name label tags
      if (isActive || isCompleted) {
        ctx.fillStyle = 'rgba(43, 39, 48, 0.75)';
        ctx.fillRect(node.x - 45, node.y - 30, 90, 14);
        ctx.fillStyle = '#ffffff';
        ctx.font = '7px Quicksand';
        ctx.fillText(node.name, node.x, node.y - 21);
      }
    }

    // Draw Mochi Bunny moving on the map
    const walkFrame = Math.floor((time / 150) % 2);
    let mochiSprite = 'mochi_down_0';
    if (this.isTransitioning) {
      // Determine walking direction sprite
      const dx = this.endNode.x - this.startNode.x;
      const dy = this.endNode.y - this.startNode.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        mochiSprite = dx > 0 ? `mochi_right_${walkFrame}` : `mochi_left_${walkFrame}`;
      } else {
        mochiSprite = dy > 0 ? `mochi_down_${walkFrame}` : 'mochi_up_0';
      }
    } else {
      mochiSprite = 'mochi_down_0';
    }

    // Draw Mochi centered
    Assets.draw(ctx, mochiSprite, this.mochiX - 16, this.mochiY - 24 + this.mochiHopY, 32, 32);
    // Draw shadow underneath
    ctx.fillStyle = PALETTE['shadow'];
    ctx.beginPath();
    ctx.ellipse(this.mochiX, this.mochiY + 4, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw clouds drifting overhead
    for (const cloud of this.clouds) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.6, cloud.y - cloud.size * 0.2, cloud.size * 0.8, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 1.2, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export const WorldMapScreen = new WorldMap();
export default WorldMapScreen;
