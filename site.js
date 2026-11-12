// Two small touches, both quiet: the nav lifts into a glass pill once you scroll, and sections
// rise into place once as they come into view. Without JavaScript everything simply shows.
document.documentElement.classList.add('js');

const nav = document.getElementById('nav');
const lift = () => nav.classList.toggle('lifted', window.scrollY > 24);
lift();
window.addEventListener('scroll', lift, { passive: true });

// The hero's floating cards arrive one after another.
document.querySelectorAll('.hero .float').forEach((el, i) => el.style.setProperty('--d', `${250 + i * 140}ms`));

const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!still && 'IntersectionObserver' in window) {
  const groups = [...document.querySelectorAll('.bento, .small-grid')];
  const items = [...document.querySelectorAll('.bento-wrap h2, .screens h2, .screens .tabs, .smalls h2, .faq, .end')];
  // Cards in a grid stagger a little, left to right.
  groups.forEach((g) => [...g.children].forEach((c, i) => { c.style.setProperty('--d', `${(i % 3) * 70}ms`); items.push(c); }));
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      seen.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach((el) => { el.classList.add('rise'); seen.observe(el); });
}

// The waving Hedge watches the cursor (or a finger, while it's down). Each pupil heads for the
// pointer within its own eye: a near pointer moves it a little, a far one to the rim. With Reduce
// Motion he keeps the eyes he was drawn with.
const hedge = document.querySelector('.hero-hedge');
if (hedge && !still) {
  const eyes = [...hedge.querySelectorAll('.pupil')].map((el) => {
    const [cx, cy, mx, my] = el.dataset.eye.split(' ').map(Number);
    const [rx, ry] = el.dataset.rest.split(' ').map(Number);
    return { el, cx, cy, mx, my, rx, ry, x: 0, y: 0, tx: 0, ty: 0 };
  });
  let pointer = null;
  let frame = 0;
  let last = 0;
  let rest;

  const aim = () => {
    const box = hedge.getBoundingClientRect();
    const scale = box.width / 360;
    for (const e of eyes) {
      if (!pointer) { e.tx = 0; e.ty = 0; continue; }
      const dx = pointer.x - (box.left + e.cx * scale);
      const dy = pointer.y - (box.top + e.cy * scale);
      const d = Math.hypot(dx, dy) || 1;
      const reach = 1 - Math.exp(-d / 90);
      e.tx = e.cx + (dx / d) * e.mx * reach - e.rx;
      e.ty = e.cy + (dy / d) * e.my * reach - e.ry;
    }
    if (!frame) { last = performance.now(); frame = requestAnimationFrame(step); }
  };

  const step = (now) => {
    const k = 1 - Math.exp(-(now - last) / 70);
    last = now;
    let moving = false;
    for (const e of eyes) {
      e.x += (e.tx - e.x) * k;
      e.y += (e.ty - e.y) * k;
      if (Math.abs(e.tx - e.x) > 0.02 || Math.abs(e.ty - e.y) > 0.02) moving = true;
      e.el.setAttribute('transform', `translate(${e.x.toFixed(2)} ${e.y.toFixed(2)})`);
    }
    frame = moving ? requestAnimationFrame(step) : 0;
  };

  window.addEventListener('pointermove', (ev) => {
    if (ev.pointerType === 'touch' && !ev.isPrimary) return;
    clearTimeout(rest);
    pointer = { x: ev.clientX, y: ev.clientY };
    aim();
  }, { passive: true });
  window.addEventListener('pointerdown', (ev) => { clearTimeout(rest); pointer = { x: ev.clientX, y: ev.clientY }; aim(); }, { passive: true });
  // A finger lifts, or the mouse leaves the window: after a beat he looks back at you.
  const goHome = (delay) => { clearTimeout(rest); rest = setTimeout(() => { pointer = null; aim(); }, delay); };
  window.addEventListener('pointerup', (ev) => { if (ev.pointerType !== 'mouse') goHome(1200); }, { passive: true });
  window.addEventListener('pointercancel', () => goHome(1200), { passive: true });
  document.documentElement.addEventListener('mouseleave', () => goHome(300));
  window.addEventListener('scroll', () => { if (pointer) aim(); }, { passive: true });
}

// The screens: a tab shows its panel and hides the others. Arrow keys move along the tabs, and a link to
// a panel's id (#after-you-pay) opens that one.
const tabs = [...document.querySelectorAll('.screens .tab')];
if (tabs.length) {
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const show = (i, focus) => {
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => { p.classList.toggle('on', k === i); p.classList.remove('swap'); });
    void panels[i].offsetWidth; // restart the fade for a panel shown again
    panels[i].classList.add('swap');
    const row = tabs[i].parentElement;
    if (row.scrollWidth > row.clientWidth) row.scrollTo({ left: tabs[i].offsetLeft - row.offsetLeft - 20, behavior: still ? 'auto' : 'smooth' });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, k) => {
    t.addEventListener('click', () => show(k));
    t.addEventListener('keydown', (e) => {
      const to = { ArrowRight: k + 1, ArrowLeft: k - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      show((to + tabs.length) % tabs.length, true);
    });
  });
  const fromHash = panels.findIndex((p) => '#' + p.id === location.hash);
  if (fromHash > 0) show(fromHash);
  // Hidden panels' screenshots wait for display; fetch them once the section is near, so a tap shows them at once
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      document.querySelectorAll('.screens img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
      near.disconnect();
    }, { rootMargin: '800px 0px' });
    near.observe(document.querySelector('.screens'));
  }
}

// The app clips play only while on screen (and never with Reduce Motion, which keeps the poster).
const clips = document.querySelectorAll('video.clip');
if (!still && 'IntersectionObserver' in window) {
  const watch = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.play().catch(() => {});
      else e.target.pause();
    }
  }, { threshold: 0.35 });
  clips.forEach((v) => watch.observe(v));
}

// The coin stack at the page's left edge: a coin drops on for each stretch you read. Hidden below 1320px (site.css).
const stack = document.querySelector('.stack');
if (stack) {
  const N = 14;
  const coins = Array.from({ length: N }, (_, i) => {
    const c = document.createElement('i');
    c.className = 'sc';
    c.style.setProperty('--i', i);
    stack.appendChild(c);
    return c;
  });
  let queued = false;
  const fill = () => {
    queued = false;
    const room = document.documentElement.scrollHeight - innerHeight;
    const p = room > 0 ? Math.min(1, Math.max(0, scrollY / room)) : 0;
    const on = 2 + Math.round(p * (N - 2));
    coins.forEach((c, i) => c.classList.toggle('on', i < on));
  };
  fill();
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(fill); } }, { passive: true });
  addEventListener('resize', fill, { passive: true });
}

// The big name in the footer pops up letter by letter the first time it comes into view.
const mark = document.querySelector('.wordmark');
if (mark) {
  if (still || !('IntersectionObserver' in window)) mark.classList.add('pop');
  else {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      mark.classList.add('pop');
      io.disconnect();
    }, { threshold: 0.1 });
    io.observe(mark);
  }
}
