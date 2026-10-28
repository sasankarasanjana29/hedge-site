// The playable hero: a small working Pouch. Everything happens on this page; nothing is sent.
// Safe today follows the app (lib/finance summary): the month's money less bills and savings,
// shared over the days left, counting today. Hedge reacts as reactTo in app/new.tsx does.

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// A sensible starting month for each currency, so the first number on screen means something.
const START = {
  'Rs': { pay: 120000, bills: 45000 },
  '₹': { pay: 60000, bills: 22000 },
  '$': { pay: 4000, bills: 1600 },
  '€': { pay: 3200, bills: 1300 },
  '£': { pay: 2800, bills: 1200 },
};

/** The visitor's likely currency, from their language setting. */
function guessCurrency() {
  const l = (navigator.language || 'en').toLowerCase();
  if (l.endsWith('-lk') || l.startsWith('si') || l.startsWith('ta')) return 'Rs';
  if (l.endsWith('-in') || l.startsWith('hi') || l.startsWith('bn')) return '₹';
  if (l.endsWith('-gb')) return '£';
  if (/^(de|fr|es|it|nl|pt-pt|fi|el|ga)/.test(l) || /-(de|fr|es|it|nl|at|be|ie|fi|pt)$/.test(l)) return '€';
  if (l.startsWith('en')) return '$';
  return 'Rs';
}

const state = { cur: guessCurrency(), save: 0.2, field: 'pay', step: 'month', spend: 0 };
Object.assign(state, START[state.cur]);

const fmt = (n) => `${state.cur} ${Math.max(0, Math.round(n)).toLocaleString()}`;

/** Days left this month, counting today, by the visitor's own calendar. */
function daysLeft() {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return last - now.getDate() + 1;
}

function safeToday() {
  const free = state.pay - state.bills - state.pay * state.save;
  return Math.max(0, Math.floor(free / daysLeft()));
}

/** Hedge's picture and line for a spend, exactly as the app chooses them. */
function react(amount, safe) {
  if (amount <= 0) return { pose: 'wave', label: 'How much was it?' };
  // Never a scold: a big spend still gets a thumbs up, because logging it is the win.
  if (safe <= 0 || amount > safe) return { pose: 'thumbsUp', label: 'Good call logging it.' };
  if (amount > safe / 2) return { pose: 'wave', label: "Most of today's safe amount." };
  return { pose: 'thumbsUp', label: 'Fits easily.' };
}

function setHedge(img, pose) {
  const src = `assets/hedge-${pose}.png`;
  if (!img.src.endsWith(src)) img.src = src;
  img.classList.remove('hop');
  void img.offsetWidth;
  img.classList.add('hop');
  setTimeout(() => img.classList.remove('hop'), 260);
}

function render() {
  $$('[data-show="pay"]').forEach((e) => (e.textContent = fmt(state.pay)));
  $$('[data-show="bills"]').forEach((e) => (e.textContent = fmt(state.bills)));
  $$('.line[data-field]').forEach((b) => b.classList.toggle('on', b.dataset.field === state.field && state.step === 'month'));
  $$('.chips button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.save) === state.save)));
  $$('.cur button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cur === state.cur)));

  const safe = safeToday();
  const left = daysLeft();
  $('#safe').textContent = fmt(safe);
  $('#days').textContent = left === 1 ? 'Last day of the month' : `${left} days left this month`;
  $('#hedge-month').src = `assets/hedge-${safe > 0 ? 'thumbsUp' : 'hold'}.png`;

  $('#spend').textContent = fmt(state.spend);
  const r = react(state.spend, safe);
  $('#react').textContent = r.label;
  const share = safe > 0 ? Math.min(1, state.spend / safe) : state.spend > 0 ? 1 : 0;
  $('#meter-fill').style.width = `${share * 100}%`;
  $('#meter-mark').style.left = `${share * 100}%`;

  // What today's spend does to tomorrow: the rest of the month shared over the days after today.
  const t = $('#tomorrow');
  if (state.spend <= 0) t.textContent = `Today's safe amount is ${fmt(safe)}. Type a spend to see where it lands.`;
  else if (left <= 1) t.textContent = 'A new month starts tomorrow, with a fresh number.';
  else {
    const restOfMonth = safe * left - state.spend;
    const tomorrow = Math.max(0, Math.floor(restOfMonth / (left - 1)));
    t.textContent = tomorrow >= safe
      ? `Spend that and tomorrow's number grows to ${fmt(tomorrow)}.`
      : `Spend that and tomorrow's number is ${fmt(tomorrow)}. Pouch just shares the rest of the month again.`;
  }
}

/** One key: digits append, 00 adds two zeros, back removes the last digit. Amounts stay sensible. */
function press(key) {
  const name = state.step === 'spend' ? 'spend' : state.field;
  let s = String(state[name] || 0);
  if (key === 'back') s = s.slice(0, -1) || '0';
  else s = s === '0' ? key.replace(/^0+/, '') || '0' : s + key;
  const n = Math.min(Number(s) || 0, 99999999);
  const before = name === 'spend' ? react(state.spend, safeToday()).pose : null;
  state[name] = n;
  render();
  if (name === 'spend') {
    const after = react(state.spend, safeToday()).pose;
    if (after !== before || state.spend === n) setHedge($('#hedge-spend'), after);
  }
}

function setStep(step) {
  state.step = step;
  $$('.seg button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.step === step)));
  $('#step-month').hidden = step !== 'month';
  $('#step-spend').hidden = step !== 'spend';
  render();
}

$$('.keys button').forEach((b) => b.addEventListener('click', () => press(b.dataset.key)));
$$('.line[data-field]').forEach((b) => b.addEventListener('click', () => { state.field = b.dataset.field; render(); }));
$$('.chips button').forEach((b) => b.addEventListener('click', () => { state.save = Number(b.dataset.save); render(); setHedge($('#hedge-month'), 'thumbsUp'); }));
$$('.seg button').forEach((b) => b.addEventListener('click', () => setStep(b.dataset.step)));
$$('.cur button').forEach((b) => b.addEventListener('click', () => {
  state.cur = b.dataset.cur;
  Object.assign(state, START[state.cur], { spend: 0 });
  render();
}));

// A physical keyboard works too: digits, Backspace, and Tab between the two steps.
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (/^[0-9]$/.test(e.key)) { press(e.key); e.preventDefault(); }
  else if (e.key === 'Backspace') { press('back'); e.preventDefault(); }
});

render();
