// AxTrader Academy Feature Module
// Renders trading courses — Core Method + System Mechanics.
//
// IMPORTANT: every course below teaches ONLY what scripts/signal_bot.py
// (the bot that actually generates the signals on this app) implements.
// Nothing here should ever describe a concept the bot doesn't use —
// if you add a new confluence factor to the bot, add its lesson here;
// if you remove one from the bot, remove its lesson here too. Keeping
// these in lockstep is the whole point: members should be able to read
// a signal's reasons and understand exactly why it fired, in the exact
// terms the bot itself uses (see js/features/signals.js "reasons" tags
// like "CHoCH ↺", "BOS →", "OB", "FVG", "GWP" for how these connect).

import { store } from '../store.js';

const ACAD_CONTENT = 'academy-courses-content';
const ACAD_TABS = 'academy-courses-tabs';
const ACAD_PROGRESS_TEXT = 'academy-progress-text';
const ACAD_PROGRESS_FILL = 'academy-progress-fill';

// Course catalog — 2 tracks, both mapped 1:1 to scripts/signal_bot.py.
// "core"   = the 5 confluence components a signal is built from.
// "system" = how those 5 get combined, filtered, and timed into a fire.
const COURSES = [
  {
    id: 'core-structure', title: 'Market Structure', track: 'core', level: 'free',
    desc: 'Swing highs/lows and how the bot reads HH/HL vs LH/LL trend structure.',
    lessons: 3,
    content: `
      <p><strong>What the bot does:</strong> every scan starts by finding swing points — a candle whose high/low is more extreme than the candles on both sides of it (a 3-bar pivot). Nothing lagging, no moving average — just price.</p>
      <p><strong>Reading structure:</strong> a sequence of rising swing highs and rising swing lows (HH/HL) is bullish structure. Falling swing highs and falling swing lows (LH/LL) is bearish structure. This is the frame everything else gets judged against.</p>
      <p><strong>Why it matters:</strong> the bot never trades structure on its own — it's the reference point BOS/CHoCH (next lesson) is measured from.</p>`,
  },
  {
    id: 'core-boschoch', title: 'BOS & CHoCH', track: 'core', level: 'free',
    desc: 'Break of Structure (continuation) vs Change of Character (reversal) — the directional trigger.',
    lessons: 3,
    content: `
      <p><strong>BOS (Break of Structure):</strong> price closes beyond the last swing high/low IN the direction of the existing trend. This confirms the trend is continuing — tagged <code>BOS →</code> in a signal's reasons.</p>
      <p><strong>CHoCH (Change of Character):</strong> price closes beyond the last swing AGAINST the existing trend — the first sign of a reversal. Tagged <code>CHoCH ↺</code>. Because a reversal is a stronger claim than a continuation, the bot requires CHoCH signals to clear a higher confluence bar (2+ confirmations) before firing — BOS only needs 1.</p>
      <p><strong>Why it matters:</strong> this is the directional trigger. No BOS or CHoCH event, no signal — everything after this is about quality-checking that direction, not creating a new one.</p>`,
  },
  {
    id: 'core-ob', title: 'Order Blocks', track: 'core', level: 'free',
    desc: 'The last opposing candle before an impulse move — where institutional orders likely originated.',
    lessons: 2,
    content: `
      <p><strong>Bullish Order Block:</strong> the last bearish (red) candle immediately before a bullish impulse that produced BOS/CHoCH.</p>
      <p><strong>Bearish Order Block:</strong> the last bullish (green) candle immediately before a bearish impulse.</p>
      <p><strong>Why it matters:</strong> the idea is that a large order was placed at that candle, causing the reversal that followed — so if price returns to that zone, it's a place the same interest may show up again. It's one of the confluence checks the bot scores toward a signal firing.</p>`,
  },
  {
    id: 'core-fvg', title: 'Fair Value Gaps', track: 'core', level: 'free',
    desc: 'The 3-candle price imbalance that price tends to return to fill.',
    lessons: 2,
    content: `
      <p><strong>What it is:</strong> a 3-candle pattern where candle 1's high/low doesn't overlap with candle 3's low/high — leaving a gap in traded price. That gap is an "imbalance" between buyers and sellers.</p>
      <p><strong>Why it matters:</strong> imbalances tend to get revisited before a move continues. It's a second, independent confluence check alongside Order Blocks — the bot doesn't require both, but signals scoring more of the 5 components are weighted higher quality.</p>`,
  },
  {
    id: 'core-gwp', title: 'Ghost Wick Sweeps', track: 'core', level: 'free',
    desc: 'The signature GWP component — equal highs/lows swept by a wick, then rejected.',
    lessons: 3,
    content: `
      <p><strong>Equal highs/lows:</strong> the bot first looks for 2+ swing highs (or lows) within ~0.3% of each other — a "liquidity pool" resting just beyond them (stops tend to cluster there).</p>
      <p><strong>The sweep:</strong> a candle's wick pushes through that equal level, then closes back on the other side — a rejection. That combination (wick through + close back) is a true "Ghost Wick": the pool was swept, not broken.</p>
      <p><strong>Why it matters:</strong> this is the confluence factor unique to GWP versus generic ICT/SMC — it's the strongest single tell in the bot's scoring that a stop-hunt just happened and a reversal is likely, not just a possible one.</p>`,
  },
  {
    id: 'sys-bias', title: 'Daily Bias & Kill Zone', track: 'system', level: 'premium',
    desc: 'How daily structure filters trade direction, and why forex only fires in specific session windows.',
    lessons: 2,
    content: `
      <p><strong>Daily bias:</strong> computed once per symbol per scan from the daily timeframe's OWN swing structure (same HH/HL vs LH/LL logic as the main lesson, just on the daily chart) — never from an EMA. A signal that fires WITH daily bias scores higher; a signal directly AGAINST daily bias is penalized in scoring, not auto-rejected.</p>
      <p><strong>Kill Zone:</strong> for 1H forex pairs only, the bot only allows a fire inside London (02:00–06:00 UTC) or New York (13:00–17:00 UTC) sessions — the windows with the deepest real liquidity. Crypto (4H) and stocks aren't restricted this way since they don't share forex's session-driven liquidity pattern.</p>`,
  },
  {
    id: 'sys-scoring', title: 'Scoring, ATR & Signal Lifecycle', track: 'system', level: 'premium',
    desc: 'How the 5 components above combine into a score, why ATR is never a signal, and how a signal expires.',
    lessons: 3,
    content: `
      <p><strong>Scoring:</strong> CHoCH events start at a higher base score than BOS (reversals are a stronger claim, so they're held to it). Every additional confluence — Order Block, FVG, Ghost Wick sweep, daily-bias agreement — adds to that score. A signal needs at least 1 real confluence to fire at all; CHoCH-based signals need 2+.</p>
      <p><strong>ATR's actual job:</strong> Average True Range never decides IF a signal fires — it's used purely as a ruler, afterward, to place the stop-loss and take-profit distance proportionally to that symbol's current volatility. This is a deliberate v3 design choice: ATR as a filter is lagging (it reacts to past volatility); ATR as a ruler just measures distance.</p>
      <p><strong>Expiry:</strong> every signal carries a shelf life — 4h for 1H setups, 16h for 4H setups, 78h for 1D — after which it's no longer considered fresh, regardless of whether price ever reached entry.</p>`,
  },
];

export function initAcademy() {
  renderCourses('core');
  updateProgress();
}

export function renderCourses(track = 'core') {
  const container = document.getElementById(ACAD_CONTENT);
  if (!container) return;

  const filtered = COURSES.filter(c => c.track === track);
  container.innerHTML = filtered.map(c => buildCourseCard(c)).join('');
}

function buildCourseCard(course) {
  const progress = store.get('courseProgress');
  const completed = !!progress[course.id];
  const isPremium = course.level === 'premium';
  const isLocked = isPremium && !store.get('isPremium');

  return `
    <div class="course-card ${isPremium ? 'premium' : ''}" data-course-id="${course.id}">
      <div class="course-header">
        <div class="course-icon ${course.track}">
          ${isPremium ? '⭐' : course.track === 'core' ? '💡' : '🚀'}
        </div>
        <div class="course-meta">
          <h4>${course.title}</h4>
          <p>${course.lessons} lessons</p>
        </div>
      </div>
      <span class="course-badge ${course.level}">${course.level === 'premium' ? '⭐ PREMIUM BOOK' : 'FREE'}</span>
      <div class="course-body">${course.desc}</div>
      ${isLocked ? `<button class="course-expand-btn" style="color:var(--premium);border-color:var(--premium)" onclick="window.openUpgrade && openUpgrade()">Unlock — $12.99/mo</button>` :
        `<div class="course-content" id="content-${course.id}">
          ${course.content || '<p style="color:var(--text2);font-size:.82rem">Lesson content coming soon.</p>'}
          ${completed ? '<p style="color:var(--green);font-weight:700;font-size:.82rem;margin-top:10px">✓ Completed</p>' : `<button class="course-expand-btn" style="margin-top:10px" onclick="completeCourse('${course.id}')">Mark Complete</button>`}
        </div>
        <button class="course-expand-btn" onclick="toggleCourse(this)">${completed ? 'Review Lesson' : 'Start Lesson'}</button>`
      }
    </div>`;
}

function updateProgress() {
  const progress = store.get('courseProgress');
  const total = COURSES.length;
  const completed = Object.keys(progress).filter(k => progress[k]?.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const textEl = document.getElementById(ACAD_PROGRESS_TEXT);
  const fillEl = document.getElementById(ACAD_PROGRESS_FILL);
  if (textEl) textEl.textContent = `${completed} / ${total} completed`;
  if (fillEl) fillEl.style.width = `${pct}%`;
}

export function switchAcademyTab(track) {
  renderCourses(track);
  // Update tab active state
  document.querySelectorAll('.course-tab').forEach(t => t.classList.remove('active'));
  const tabEl = document.querySelector(`[data-track="${track}"]`);
  if (tabEl) tabEl.classList.add('active');
}

export function toggleCourse(btn) {
  const card = btn.closest('.course-card');
  if (!card) return;
  const content = card.querySelector('.course-content');
  if (!content) return;

  if (content.classList.contains('open')) {
    content.classList.remove('open');
    btn.textContent = 'Show More';
  } else {
    content.classList.add('open');
    btn.textContent = 'Show Less';
  }
}

export function completeCourse(courseId) {
  store.markCourseCompleted(courseId);
  const track = COURSES.find(c => c.id === courseId)?.track || 'core';
  renderCourses(track);
  updateProgress();
}

// Expose for inline handlers
window.switchAcademyTab = switchAcademyTab;
window.toggleCourse = toggleCourse;
window.completeCourse = completeCourse;
