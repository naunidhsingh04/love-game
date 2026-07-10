const KEY_LEVEL = 'lovequest_lvl';
const KEY_MEMS = 'lovequest_mems';

export const Save = {
  getUnlockedLevel() {
    const v = parseInt(localStorage.getItem(KEY_LEVEL) || '1', 10);
    return Number.isFinite(v) && v >= 1 ? v : 1;
  },
  setUnlockedLevel(n) {
    const cur = this.getUnlockedLevel();
    if (n > cur) localStorage.setItem(KEY_LEVEL, String(n));
  },
  getMemories() {
    try {
      return JSON.parse(localStorage.getItem(KEY_MEMS) || '{}');
    } catch {
      return {};
    }
  },
  setMemoryFound(levelId) {
    const mems = this.getMemories();
    mems[levelId] = true;
    localStorage.setItem(KEY_MEMS, JSON.stringify(mems));
  },
  reset() {
    localStorage.removeItem(KEY_LEVEL);
    localStorage.removeItem(KEY_MEMS);
  },
};

export default Save;
