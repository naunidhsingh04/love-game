import { Audio } from './audio.js';

const SPEAKER_ICON = {
  Mochi: '🐰',
  Letter: '💌',
  'Mother Chick': '🐤',
  Queen: '👑',
  Owl: '🦉',
  Tree: '🌳',
  Everyone: '💞',
};

export class DialogueManager {
  constructor() {
    this.root = null;
    this.nameEl = null;
    this.textEl = null;
    this.iconEl = null;
    this.hintEl = null;

    this.queue = [];
    this.current = null;
    this.typing = false;
    this.charIndex = 0;
    this.typewriterSpeed = 26;
    this.timer = null;
    this.onComplete = null;
    this.advanceLock = false;
    this.isOpen = false;

    this._boundAdvance = this.next.bind(this);
  }

  mount(uiRoot) {
    this.root = document.createElement('div');
    this.root.className = 'dialogue-box hidden';
    this.root.innerHTML = `
      <div class="dialogue-portrait"><span class="dialogue-icon">🐰</span></div>
      <div class="dialogue-body">
        <div class="dialogue-name"></div>
        <div class="dialogue-text"></div>
        <div class="dialogue-hint">tap to continue ▾</div>
      </div>
    `;
    uiRoot.appendChild(this.root);
    this.nameEl = this.root.querySelector('.dialogue-name');
    this.textEl = this.root.querySelector('.dialogue-text');
    this.iconEl = this.root.querySelector('.dialogue-icon');
    this.hintEl = this.root.querySelector('.dialogue-hint');

    this.root.addEventListener('click', this._boundAdvance);
    window.addEventListener('keydown', (e) => {
      if (this.isOpen && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        this.next();
      }
    });
  }

  startSequence(lines, onComplete) {
    this.queue = [...lines];
    this.onComplete = onComplete || null;
    this.isOpen = true;
    this.root.classList.remove('hidden');
    this.advanceLock = true;
    setTimeout(() => { this.advanceLock = false; }, 350);
    this._showNext();
  }

  _showNext() {
    if (this.queue.length === 0) {
      this.close();
      return;
    }
    this.current = this.queue.shift();
    this.nameEl.textContent = this.current.speaker || '';
    this.iconEl.textContent = SPEAKER_ICON[this.current.speaker] || '💬';
    this.textEl.textContent = '';
    this.hintEl.style.opacity = '0';
    this._type(this.current.text);
  }

  _type(text) {
    this.typing = true;
    this.charIndex = 0;
    clearTimeout(this.timer);
    const step = () => {
      if (this.charIndex >= text.length) {
        this.typing = false;
        this.hintEl.style.opacity = '1';
        return;
      }
      this.textEl.textContent += text[this.charIndex];
      this.charIndex++;
      if (this.charIndex % 2 === 0) Audio.playTypewriter();
      this.timer = setTimeout(step, this.typewriterSpeed);
    };
    step();
  }

  finishTyping() {
    clearTimeout(this.timer);
    this.textEl.textContent = this.current.text;
    this.typing = false;
    this.hintEl.style.opacity = '1';
    Audio.playPop();
  }

  next() {
    if (!this.isOpen || this.advanceLock) return;
    if (this.typing) {
      this.finishTyping();
      return;
    }
    this._showNext();
  }

  close() {
    this.isOpen = false;
    this.root.classList.add('hidden');
    const cb = this.onComplete;
    this.onComplete = null;
    if (cb) cb();
  }
}

export const Dialogue = new DialogueManager();
export default Dialogue;
