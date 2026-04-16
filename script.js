/* ═══════════════════════════════════════════
   3MD — Interactions & Animations
   ═══════════════════════════════════════════ */

// ─── TYPED EFFECT ───
const words = ['digital experiences.', 'web apps.', 'software.', 'mobile apps.', 'clean interfaces.', 'fast APIs.', 'your next idea.'];
let wordIdx = 0, charIdx = 0, deleting = false;
const typedEl = document.getElementById('typed');

function type() {
  const current = words[wordIdx];
  typedEl.textContent = current.substring(0, charIdx);

  if (!deleting) {
    charIdx++;
    if (charIdx > current.length) {
      setTimeout(() => { deleting = true; type(); }, 2000);
      return;
    }
  } else {
    charIdx--;
    if (charIdx === 0) {
      deleting = false;
      wordIdx = (wordIdx + 1) % words.length;
    }
  }
  setTimeout(type, deleting ? 30 : 80);
}
type();

// ─── NAV SCROLL ───
const nav = document.getElementById('nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 50);
}, { passive: true });

// ─── MOBILE MENU ───
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// ─── SCROLL REVEAL ───
const reveals = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => revealObserver.observe(el));

// ─── HERO GRID CANVAS ───
const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
let animFrame;

function resizeCanvas() {
  canvas.width = canvas.offsetWidth * devicePixelRatio;
  canvas.height = canvas.offsetHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let mouse = { x: -1000, y: -1000 };
document.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

function drawGrid(time) {
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  ctx.clearRect(0, 0, w, h);

  const gap = 60;
  const dotSize = 1;
  const accentR = 232, accentG = 135, accentB = 61;

  for (let x = gap; x < w; x += gap) {
    for (let y = gap; y < h; y += gap) {
      const dx = mouse.x - x;
      const dy = mouse.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 200;

      let alpha = 0.15;
      let size = dotSize;

      if (dist < maxDist) {
        const t = 1 - dist / maxDist;
        alpha = 0.15 + t * 0.6;
        size = dotSize + t * 2;
        ctx.fillStyle = `rgba(${accentR},${accentG},${accentB},${alpha})`;
      } else {
        // subtle wave
        const wave = Math.sin(time * 0.001 + x * 0.01 + y * 0.01) * 0.05;
        alpha = 0.1 + wave;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      }

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  animFrame = requestAnimationFrame(drawGrid);
}

// Only run canvas animation on non-mobile for performance
if (window.innerWidth > 768) {
  requestAnimationFrame(drawGrid);
} else {
  // Static simple grid for mobile
  function drawStaticGrid() {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    const gap = 50;
    for (let x = gap; x < w; x += gap) {
      for (let y = gap; y < h; y += gap) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  drawStaticGrid();
  window.addEventListener('resize', drawStaticGrid);
}

// ─── CONTACT FORM ───
const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'Sending...';
  statusEl.textContent = '';
  statusEl.className = 'form__status';

  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
    });

    const data = await res.json();

    if (data.success) {
      statusEl.textContent = 'Message sent! We\'ll be in touch soon.';
      statusEl.classList.add('form__status--success');
      form.reset();
    } else {
      throw new Error(data.message || 'Something went wrong');
    }
  } catch (err) {
    statusEl.textContent = err.message || 'Failed to send. Please try again.';
    statusEl.classList.add('form__status--error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = 'Send message';
  }
});

// ─── SMOOTH ANCHOR SCROLL (fallback) ───
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
