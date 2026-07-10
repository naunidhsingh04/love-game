/* ==========================================
   Cozy Typewriter Dialogue Manager
   ========================================== */

import { Audio } from './audio.js';
import { Assets } from './assets.js';

class DialogueManager {
  constructor() {
    this.box = null;
    this.nameEl = null;
    this.textEl = null;
    this.portraitCanvas = null;
    this.portraitCtx = null;
    
    this.queue = [];
    this.current = null;
    
    // Typewriter state
    this.isTyping = false;
    this.typewriterIndex = 0;
    this.typewriterTimer = null;
    this.typewriterSpeed = 30; // ms per character
    
    // Safety lock to prevent accidental skips (cooldown in ms)
    this.advanceLock = false;
    this.lockDuration = 400; // time before dialogue can be clicked
    this.startTime = 0;

    this.onSequenceComplete = null;
  }

  init() {
    this.box = document.getElementById('dialogue-box');
    this.nameEl = document.getElementById('speaker-name');
    this.textEl = document.getElementById('dialogue-text');
    this.portraitCanvas = document.getElementById('portraitCanvas');
    if (this.portraitCanvas) {
      this.portraitCtx = this.portraitCanvas.getContext('2d');
    }
  }

  // Start a sequence of dialogues
  startSequence(dialogues, onComplete = null) {
    this.queue = [...dialogues];
    this.onSequenceComplete = onComplete;
    this.box.classList.remove('hidden');
    this.next();
  }

  // Advance sequence
  next() {
    if (this.isTyping) {
      // Force finish typing
      this.finishTyping();
      return;
    }

    if (this.advanceLock) return; // Locked

    if (this.queue.length === 0) {
      this.close();
      if (this.onSequenceComplete) {
        this.onSequenceComplete();
        this.onSequenceComplete = null;
      }
      return;
    }

    this.current = this.queue.shift();
    this.nameEl.textContent = this.current.speaker;
    this.textEl.textContent = '';
    
    this.isTyping = true;
    this.typewriterIndex = 0;
    
    this.startTime = Date.now();
    this.advanceLock = true;
    setTimeout(() => {
      this.advanceLock = false;
    }, this.lockDuration);

    // Draw speaker portrait
    this.drawPortrait(this.current.speaker, this.current.expression || 'idle');

    // Start typing loop
    this.type();
  }

  type() {
    if (!this.isTyping || !this.current) return;

    if (this.typewriterIndex < this.current.text.length) {
      const char = this.current.text[this.typewriterIndex];
      this.textEl.textContent += char;
      this.typewriterIndex++;

      // Play soft typewriter sound
      if (this.typewriterIndex % 2 === 0) {
        Audio.playTypewriter();
      }

      this.typewriterTimer = setTimeout(() => this.type(), this.typewriterSpeed);
    } else {
      this.isTyping = false;
    }
  }

  finishTyping() {
    if (this.typewriterTimer) clearTimeout(this.typewriterTimer);
    this.textEl.textContent = this.current.text;
    this.isTyping = false;
    Audio.playPop(); // small feedback click
  }

  drawPortrait(speaker, expression) {
    if (!this.portraitCtx || !this.portraitCanvas) return;
    
    const ctx = this.portraitCtx;
    ctx.clearRect(0, 0, this.portraitCanvas.width, this.portraitCanvas.height);
    ctx.imageSmoothingEnabled = false;

    let spriteName = 'mochi_down_0';
    if (speaker === 'Mochi') {
      if (expression === 'happy') spriteName = 'mochi_blush';
      else if (expression === 'sad' || expression === 'crying') spriteName = 'mochi_cry';
      else if (expression === 'embarrassed') spriteName = 'mochi_embarrassed';
      else if (expression === 'sleeping') spriteName = 'mochi_sleeping';
      else spriteName = 'mochi_down_0';
    } else if (speaker.toLowerCase().includes('girlfriend') || speaker.toLowerCase().includes('partner') || speaker.toLowerCase().includes('you')) {
      spriteName = 'player_gf';
    } else {
      // General NPC portrait (we can map specific NPCs if needed)
      if (expression === 'happy') spriteName = 'cat_happy';
      else if (speaker.includes('Cat')) spriteName = 'cat_sleep';
      else if (speaker.includes('Chick')) spriteName = 'chick';
      else if (speaker.includes('Duck')) spriteName = 'mama_duck';
      else if (speaker.includes('Owl')) spriteName = 'owl';
      else if (speaker.includes('Hedgehog')) spriteName = 'hedgehog';
      else if (speaker.includes('Queen') || speaker.includes('Princess')) spriteName = 'player_gf';
      else spriteName = 'cloud_spirit';
    }

    // Render large centered portrait
    const pSize = 64;
    Assets.draw(ctx, spriteName, 0, 0, pSize, pSize);
  }

  isActive() {
    return !this.box.classList.contains('hidden');
  }

  close() {
    this.box.classList.add('hidden');
    this.current = null;
    this.queue = [];
  }
}

export const Dialogue = new DialogueManager();
export default Dialogue;
