const RESOURCE_ICONS = { flowers: '🌸', gems: '💎', coins: '🪙' };

export class Hud {
  constructor(uiRoot) {
    this.uiRoot = uiRoot;
    this.resources = { flowers: 0, gems: 0, coins: 0 };
    this._mount();
  }

  _mount() {
    this.topBar = document.createElement('div');
    this.topBar.className = 'hud-topbar hidden';
    this.topBar.innerHTML = `
      <div class="hud-player">
        <div class="hud-avatar">🎀</div>
        <div class="hud-player-info">
          <div class="hud-level-badge">Lv <span class="hud-level-num">1</span></div>
          <div class="hud-bar hud-bar-love"><div class="hud-bar-fill" style="width:0%"></div></div>
          <div class="hud-bar hud-bar-energy"><div class="hud-bar-fill" style="width:100%"></div></div>
        </div>
      </div>
      <div class="hud-resources">
        <div class="hud-chip" data-res="flowers"><span>🌸</span><span class="hud-chip-val">0</span></div>
        <div class="hud-chip" data-res="gems"><span>💎</span><span class="hud-chip-val">0</span></div>
        <div class="hud-chip" data-res="coins"><span>🪙</span><span class="hud-chip-val">0</span></div>
      </div>
    `;
    this.uiRoot.appendChild(this.topBar);

    this.questPanel = document.createElement('div');
    this.questPanel.className = 'quest-panel hidden';
    this.questPanel.innerHTML = `<div class="quest-panel-title">Current Quest</div><div class="quest-list"></div>`;
    this.uiRoot.appendChild(this.questPanel);
    this.questList = this.questPanel.querySelector('.quest-list');

    this.levelTitleCard = document.createElement('div');
    this.levelTitleCard.className = 'level-title-card hidden';
    this.uiRoot.appendChild(this.levelTitleCard);

    this.notifRoot = document.createElement('div');
    this.notifRoot.className = 'notif-root';
    this.uiRoot.appendChild(this.notifRoot);

    this.interactPrompt = document.createElement('div');
    this.interactPrompt.className = 'interact-prompt hidden';
    this.interactPrompt.textContent = 'Press E to interact';
    this.uiRoot.appendChild(this.interactPrompt);

    this.loadingScreen = document.createElement('div');
    this.loadingScreen.className = 'loading-screen hidden';
    this.loadingScreen.innerHTML = `
      <div class="loading-tree">🌳</div>
      <div class="loading-title">Love Quest: The Lost Memories</div>
      <div class="loading-bar"><div class="loading-bar-fill"></div></div>
      <div class="loading-pct">Loading... 0%</div>
    `;
    this.uiRoot.appendChild(this.loadingScreen);
  }

  showLevelTitle(name, theme) {
    this.levelTitleCard.innerHTML = `<div class="level-title-name">${name}</div><div class="level-title-theme">${theme}</div>`;
    this.levelTitleCard.classList.remove('hidden');
    this.levelTitleCard.classList.add('show');
    setTimeout(() => {
      this.levelTitleCard.classList.remove('show');
      setTimeout(() => this.levelTitleCard.classList.add('hidden'), 600);
    }, 2600);
  }

  showGameplayUI() {
    this.topBar.classList.remove('hidden');
    this.questPanel.classList.remove('hidden');
  }

  hideGameplayUI() {
    this.topBar.classList.add('hidden');
    this.questPanel.classList.add('hidden');
    this.interactPrompt.classList.add('hidden');
  }

  updateTasks(tasks) {
    this.questList.innerHTML = tasks.map((t) => {
      const done = t.current >= t.target;
      return `<div class="quest-item ${done ? 'done' : ''}">
        <span class="quest-check">${done ? '✔' : ''}</span>
        <span class="quest-label">${t.label}</span>
        <span class="quest-progress">(${Math.min(t.current, t.target)}/${t.target})</span>
      </div>`;
    }).join('');

    const totalCurrent = tasks.reduce((s, t) => s + Math.min(t.current, t.target), 0);
    const totalTarget = tasks.reduce((s, t) => s + t.target, 0);
    const pct = totalTarget ? Math.round((totalCurrent / totalTarget) * 100) : 0;
    this.topBar.querySelector('.hud-bar-love .hud-bar-fill').style.width = pct + '%';
  }

  bumpResource(key, amount) {
    this.resources[key] = (this.resources[key] || 0) + amount;
    const chip = this.topBar.querySelector(`.hud-chip[data-res="${key}"] .hud-chip-val`);
    if (chip) chip.textContent = this.resources[key];
    if (key === 'flowers') this.notify('Item Obtained!', `${RESOURCE_ICONS.flowers} Pink Flower x1`, '🌸');
  }

  setLevelBadge(n) {
    this.topBar.querySelector('.hud-level-num').textContent = n;
  }

  showInteractPrompt(show) {
    this.interactPrompt.classList.toggle('hidden', !show);
  }

  notify(title, subtitle, icon = '✨') {
    const card = document.createElement('div');
    card.className = 'notif-card';
    card.innerHTML = `<div class="notif-icon">${icon}</div><div class="notif-text"><div class="notif-title">${title}</div><div class="notif-subtitle">${subtitle}</div></div>`;
    this.notifRoot.appendChild(card);
    requestAnimationFrame(() => card.classList.add('show'));
    setTimeout(() => {
      card.classList.remove('show');
      setTimeout(() => card.remove(), 500);
    }, 2400);
  }

  memoryRestoredNotif() {
    this.notify('NEW MEMORY!', 'A memory has been restored.', '💗');
  }

  setLoading(pct, visible) {
    this.loadingScreen.classList.toggle('hidden', !visible);
    this.loadingScreen.querySelector('.loading-bar-fill').style.width = pct + '%';
    this.loadingScreen.querySelector('.loading-pct').textContent = `Loading... ${Math.round(pct)}%`;
  }
}
