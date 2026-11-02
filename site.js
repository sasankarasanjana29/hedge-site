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
  const items = [...document.querySelectorAll('.bento-wrap h2, .ex, .smalls h2, .faq, .end')];
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
