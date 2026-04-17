// AxTrader Academy Feature Module
// Renders trading courses (ICT, SMC, GWP, Advanced)

import { store } from '../store.js';

const ACAD_CONTENT = 'academy-courses-content';
const ACAD_TABS = 'academy-courses-tabs';
const ACAD_PROGRESS_TEXT = 'academy-progress-text';
const ACAD_PROGRESS_FILL = 'academy-progress-fill';

// Course catalog
const COURSES = [
  { id: 'ict-basics', title: 'ICT Fundamentals', track: 'ict', level: 'free', desc: 'Smart Money Concepts — Order Blocks, FVG, Market Structure.', lessons: 8 },
  { id: 'ict-killzone', title: 'Killzone Trading', track: 'ict', level: 'free', desc: 'London & NY session timing — optimal entry windows.', lessons: 6 },
  { id: 'ict-mms', title: 'Market Maker Models', track: 'ict', level: 'premium', desc: 'AMD patterns, accumulation, manipulation, distribution.', lessons: 5 },
  { id: 'smc-basics', title: 'SMC Foundations', track: 'smc', level: 'free', desc: 'Liquidity, BOS, CHoCH — identifying institutional flow.', lessons: 7 },
  { id: 'smc-advanced', title: 'Advanced SMC', track: 'smc', level: 'premium', desc: 'Premium & discount zones, inducement, mitigation blocks.', lessons: 5 },
  { id: 'gwp-five', title: '5-Pillar GWP Method', track: 'gwp', level: 'free', desc: 'Ghost Wick Detection → Liquidity Trap → MSB → Order Block → Kelly.', lessons: 10 },
  { id: 'gwp-sweeps', title: 'Liquidity Sweeps', track: 'gwp', level: 'free', desc: 'Identifying stop hunts and reversal setups.', lessons: 5 },
  { id: 'adv-avwap', title: 'AVWAP Mastery', track: 'advanced', level: 'premium', desc: 'Anchored VWAP for institutional-grade entries.', lessons: 4 },
  { id: 'adv-liquidity', title: 'Liquidity Trap Alerts', track: 'advanced', level: 'premium', desc: 'Detecting real-time sweep-and-reverse patterns.', lessons: 3 },
];

export function initAcademy() {
  renderCourses('ict');
  updateProgress();
}

export function renderCourses(track = 'ict') {
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
          ${isPremium ? '⭐' : course.track === 'ict' ? '📘' : course.track === 'smc' ? '📗' : course.track === 'gwp' ? '💡' : '🚀'}
        </div>
        <div class="course-meta">
          <h4>${course.title}</h4>
          <p>${course.lessons} lessons</p>
        </div>
      </div>
      <span class="course-badge ${course.level}">${course.level === 'premium' ? '⭐ PREMIUM BOOK' : 'FREE'}</span>
      <div class="course-body">${course.desc}</div>
      ${isLocked ? `<button class="course-expand-btn" style="color:var(--premium);border-color:var(--premium)" onclick="window.openUpgrade && openUpgrade()">Unlock — $12.99/mo</button>` :
        completed ? '<div class="course-content open"><p style="color:var(--green);font-weight:700;font-size:.82rem">Completed</p></div>' :
        `<div class="course-content" id="content-${course.id}">
          <p style="color:var(--text2);font-size:.82rem;margin-bottom:12px">Full course content loads when opened. Each module includes examples, charts, and practice setups.</p>
        </div>
        <button class="course-expand-btn" onclick="toggleCourse(this)">Start Lesson</button>`
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

// Expose for inline handlers
window.switchAcademyTab = switchAcademyTab;
window.toggleCourse = toggleCourse;
