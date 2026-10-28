// The nav lifts into a glass pill once the page has scrolled. That's the only script.
const nav = document.getElementById('nav');
const lift = () => nav.classList.toggle('lifted', window.scrollY > 24);
lift();
window.addEventListener('scroll', lift, { passive: true });
