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
