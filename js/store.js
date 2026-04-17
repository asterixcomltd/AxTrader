// AxTrader State Store — singleton with observer pattern
// Replaces the scattered appState + signalsData + livePriceMap from the monolith

const STORAGE_KEYS = {
  user: 'ax_user',
  plan: 'axtrader_plan',
  avatar: 'axtrader_avatar',
  archive: 'axtrader_archive',
  archiveSeen: 'axtrader_archive_seen',
  notifState: 'axtrader_notif_state',
  notifPermission: 'axtrader_notif_permission',
  progress: 'axtrader_course_progress',
  referrals: 'axtrader_referral_code',
};

class Store {
  constructor() {
    this._state = {
      user: null,
      isPremium: false,
      premiumCode: null,
      signals: [],
      livePrices: {},
      news: [],
      archive: [],
      currentLang: 'en',
      avatarDataURL: null,
      courseProgress: {},
      referralCode: null,
      loading: { signals: false, news: false, prices: false },
      lastSignalUpdate: null,
      isLiveSignal: false,
      signalCount: 0,
      currentTab: { academy: 'ict', news: 'ALL' },
    };
    this._listeners = {}; // section -> callbacks[]
    this._loadPersisted();
  }

  // ── Persistent load ───────────────────────────────────────────────
  _loadPersisted() {
    try {
      const user = localStorage.getItem(STORAGE_KEYS.user);
      if (user) { this._state.user = JSON.parse(user); }

      const plan = localStorage.getItem(STORAGE_KEYS.plan);
      if (plan) {
        const p = JSON.parse(plan);
        this._state.isPremium = p === 'premium';
        this._state.premiumCode = p.premiumCode || null;
      }

      const avatar = localStorage.getItem(STORAGE_KEYS.avatar);
      if (avatar) { this._state.avatarDataURL = avatar; }

      const archive = localStorage.getItem(STORAGE_KEYS.archive);
      if (archive) { this._state.archive = JSON.parse(archive); }

      const progress = localStorage.getItem(STORAGE_KEYS.progress);
      if (progress) { this._state.courseProgress = JSON.parse(progress); }

      const referral = localStorage.getItem(STORAGE_KEYS.referrals);
      if (referral) { this._state.referralCode = referral; }
    } catch {}
  }

  // ── Getters ─────────────────────────────────────────────────────────
  get(key) {
    return key ? this._state[key] : { ...this._state };
  }

  get user() { return this._state.user; }
  get isPremium() { return this._state.isPremium; }
  get signals() { return this._state.signals; }
  get archive() { return this._state.archive; }
  get livePrices() { return this._state.livePrices; }

  // ── Setters with notifications ────────────────────────────────────
  _notify(section) {
    const cbs = this._listeners[section] || [];
    cbs.forEach(cb => { try { cb(this._state); } catch {} });
  }

  set(key, value) {
    this._state[key] = value;
    this._notify(key);
    this._notify('*');
  }

  setPartial(partial) {
    Object.assign(this._state, partial);
    Object.keys(partial).forEach(k => { this._notify(k); });
    this._notify('*');
  }

  // ── Auth ────────────────────────────────────────────────────────────
  setUser(user) {
    this._state.user = user;
    try { localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user)); } catch {}
    this._notify('user');
    this._notify('*');
  }

  clearUser() {
    this._state.user = null;
    this._state.isPremium = false;
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.plan);
    this._notify('user');
    this._notify('*');
  }

  // ── Plan ────────────────────────────────────────────────────────────
  setPremium(code) {
    this._state.isPremium = true;
    this._state.premiumCode = code;
    try { localStorage.setItem(STORAGE_KEYS.plan, JSON.stringify({ type: 'premium', premiumCode: code })); } catch {}
    this._notify('user');
    this._notify('*');
  }

  // ── Signals ─────────────────────────────────────────────────────────
  setSignals(signals) {
    this._state.signals = signals;
    this._state.lastSignalUpdate = Date.now();
    this._state.isLiveSignal = true;
    this._state.signalCount = signals.length;
    this._notify('signals');
    this._notify('*');
  }

  setPrices(prices) {
    this._state.livePrices = prices;
    this._notify('livePrices');
    this._notify('*');
  }

  // ── Archive ─────────────────────────────────────────────────────────
  addSignalToArchive(signal) {
    if (!signal.ts) return;
    const id = `${signal.pair}_${signal.ts}`;
    try {
      const seen = JSON.parse(localStorage.getItem(STORAGE_KEYS.archiveSeen) || '{}');
      if (seen[id]) return;
      seen[id] = true;
      localStorage.setItem(STORAGE_KEYS.archiveSeen, JSON.stringify(seen));
    } catch {}

    const entry = {
      id, pair: signal.pair, dir: signal.dir, entry: signal.entry,
      sl: signal.sl, tp1: signal.tp1, tp2: signal.tp2 || signal.tp,
      tp3: signal.tp3, score: signal.score, tf: signal.tf,
      bot: signal.bot, grade: signal.grade, rr: signal.rr,
      ts: signal.ts, expiresAt: signal.expiresAt, archivedAt: Date.now(),
      outcome: 'Active', premium: signal.premium, event: signal.event || '',
      hasOB: signal.hasOB, hasFVG: signal.hasFVG, hasSweep: signal.hasSweep,
      confirmations: signal.confirmations || 0,
    };
    this._state.archive.unshift(entry);
    if (this._state.archive.length > 50) this._state.archive.splice(50);
    try { localStorage.setItem(STORAGE_KEYS.archive, JSON.stringify(this._state.archive)); } catch {}
    this._notify('archive');
  }

  // ── Course Progress ─────────────────────────────────────────────────
  markCourseCompleted(courseKey) {
    if (!this._state.courseProgress[courseKey]) {
      this._state.courseProgress[courseKey] = { completed: true, date: Date.now() };
      try { localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(this._state.courseProgress)); } catch {}
      this._notify('courseProgress');
    }
  }

  // ── Observer ─────────────────────────────────────────────────────────
  subscribe(section, callback) {
    if (!this._listeners[section]) this._listeners[section] = [];
    this._listeners[section].push(callback);
    return () => {
      this._listeners[section] = this._listeners[section].filter(cb => cb !== callback);
    };
  }
}

// Singleton instance
export const store = new Store();
export default store;
