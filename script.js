/* ═══════════════════════════════════════════
   3MD — Interactions v2
   ═══════════════════════════════════════════ */

// ─── SCROLL REVEAL (IntersectionObserver) ───
const revealEls = document.querySelectorAll('.anim-reveal, .anim-line');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = parseInt(entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('visible'), delay);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// Force-trigger hero animations on load (above the fold — observer may miss them)
window.addEventListener('load', () => {
  document.querySelectorAll('.hero .anim-reveal, .hero .anim-line').forEach(el => {
    const delay = parseInt(el.dataset.delay || 0);
    setTimeout(() => el.classList.add('visible'), delay + 200);
  });
});

// ─── NAV ───
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 60);
}, { passive: true });

// ─── MOBILE MENU ───
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

function toggleMenu(open) {
  const isOpen = typeof open === 'boolean' ? open : !mobileMenu.classList.contains('open');
  burger.classList.toggle('open', isOpen);
  mobileMenu.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

burger.addEventListener('click', () => toggleMenu());

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => toggleMenu(false));
});

// ─── SMOOTH ANCHOR SCROLL ───
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ─── HERO DOT GRID ───
const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = canvas.offsetWidth * devicePixelRatio;
  canvas.height = canvas.offsetHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let mouse = { x: -1000, y: -1000 };
window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

function drawGrid(time) {
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  ctx.clearRect(0, 0, w, h);

  const gap = 50;
  const maxDist = 240;

  for (let x = gap; x < w; x += gap) {
    for (let y = gap; y < h; y += gap) {
      const dx = mouse.x - x;
      const dy = mouse.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < maxDist) {
        const t = 1 - dist / maxDist;
        const eased = t * t;

        // Push dots away from cursor
        const pushX = dist > 0 ? (dx / dist) * eased * -5 : 0;
        const pushY = dist > 0 ? (dy / dist) * eased * -5 : 0;
        const cx = x + pushX;
        const cy = y + pushY;

        // Glow halo
        const haloSize = 3 + eased * 10;
        const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloSize);
        haloGrad.addColorStop(0, `rgba(232,135,61,${0.25 * eased})`);
        haloGrad.addColorStop(1, 'rgba(232,135,61,0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, haloSize, 0, Math.PI * 2);
        ctx.fill();

        // Solid dot
        const alpha = 0.3 + eased * 0.7;
        const size = 1.4 + eased * 3;
        ctx.fillStyle = `rgba(244,180,120,${alpha})`;
        ctx.beginPath();
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const wave = Math.sin(time * 0.0008 + x * 0.015 + y * 0.01) * 0.05;
        const alpha = 0.12 + wave;
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, alpha)})`;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  requestAnimationFrame(drawGrid);
}

if (window.innerWidth > 768) {
  requestAnimationFrame(drawGrid);
} else {
  // Simple static grid for mobile
  (function staticGrid() {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    for (let x = 40; x < w; x += 40) {
      for (let y = 40; y < h; y += 40) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.arc(x, y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  })();
}

// ─── BENTO CARD GLOW + TILT ───
document.querySelectorAll('[data-tilt]').forEach(card => {
  const glow = card.querySelector('.bento__glow');

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Tilt
    const rotateX = ((y - cy) / cy) * -4;
    const rotateY = ((x - cx) / cx) * 4;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

    // Glow follow
    if (glow) {
      glow.style.left = x + 'px';
      glow.style.top = y + 'px';
    }
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
  });
});

// ─── MAGNETIC BUTTONS ───
document.querySelectorAll('.btn--magnetic').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0, 0)';
  });
});

// ─── INFINITE MARQUEE ───
function initMarquees() {
  document.querySelectorAll('.marquee').forEach(marquee => {
    const track = marquee.querySelector('.marquee__track');
    const speed = marquee.dataset.speed || 'medium';
    const reverse = marquee.dataset.direction === 'reverse';

    // Clone items to fill width
    const items = track.innerHTML;
    track.innerHTML = items + items + items;

    const speeds = { fast: 0.6, medium: 0.4, slow: 0.25 };
    const pxPerFrame = speeds[speed] || 0.4;
    let pos = 0;

    // Get width of one set of items
    const singleWidth = track.scrollWidth / 3;

    function animate() {
      pos += reverse ? pxPerFrame : -pxPerFrame;

      // Reset seamlessly
      if (!reverse && pos <= -singleWidth) pos += singleWidth;
      if (reverse && pos >= 0) pos -= singleWidth;

      track.style.transform = `translateX(${pos}px)`;
      requestAnimationFrame(animate);
    }

    if (!reverse) pos = 0; else pos = -singleWidth;
    requestAnimationFrame(animate);
  });
}
initMarquees();

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
      statusEl.textContent = 'Message sent — we\'ll be in touch soon.';
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
