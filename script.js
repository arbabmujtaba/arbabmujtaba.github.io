/* ═══════════════════════════════════════════════════
   ARBAB MUJTABA — PORTFOLIO · script.js
   ═══════════════════════════════════════════════════ */

'use strict';

/* ── 1. YEAR ─────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── 2. MOBILE NAV TOGGLE ────────────────────────── */
const menuToggle = document.getElementById('menu-toggle');
const navList    = document.getElementById('nav-list');

if (menuToggle && navList) {
  menuToggle.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  /* Close on nav link click */
  navList.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navList.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* Close on outside click */
  document.addEventListener('click', e => {
    if (navList.classList.contains('open') &&
        !navList.contains(e.target) &&
        !menuToggle.contains(e.target)) {
      navList.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

/* ── 3. ACTIVE NAV LINK ON SCROLL ───────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-link');

function setActiveLink() {
  let current = '';
  const scrollY = window.scrollY + 120;

  sections.forEach(sec => {
    if (scrollY >= sec.offsetTop) current = sec.id;
  });

  navLinks.forEach(link => {
    link.classList.toggle(
      'active',
      link.getAttribute('href') === '#' + current
    );
  });
}

window.addEventListener('scroll', setActiveLink, { passive: true });
setActiveLink();

/* ── 4. SCROLL REVEAL ───────────────────────────── */
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealEls.forEach(el => revealObserver.observe(el));

/* ── 5. HEADER SHADOW ON SCROLL ─────────────────── */
const header = document.querySelector('.site-header');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* Add .scrolled rule dynamically so no extra CSS file needed */
const scrolledStyle = document.createElement('style');
scrolledStyle.textContent =
  `.site-header.scrolled { box-shadow: 0 4px 32px rgba(0,0,0,.35); }`;
document.head.appendChild(scrolledStyle);

/* ── 6. SERVICE CARD ACTIVE TOGGLE ──────────────── */
const serviceCards = document.querySelectorAll('.service-card');

serviceCards.forEach(card => {
  card.addEventListener('click', () => {
    serviceCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  });
});

/* ── 7. TESTIMONIAL / QUOTE SLIDER ──────────────── */
const quotes = [
  {
    text: 'If you see us, you are not the target.',
    author: 'Arbab Mujtaba',
    role: 'Computer Engineering Student · IET DAVV, Indore'
  },
  {
    text: 'Rays in my life are Hushed.',
    author: 'Arbab Mujtaba',
    role: 'Computer Engineering Student · IET DAVV, Indore'
  }
];

const testimonialText   = document.querySelector('.testimonial-text');
const testimonialAuthor = document.querySelector('.testimonial-author strong');
const testimonialRole   = document.querySelector('.testimonial-role');
const dots              = document.querySelectorAll('.testimonial-dots .dot');

let currentQuote = 0;

function showQuote(index, direction = 1) {
  if (!testimonialText) return;

  /* Fade out */
  testimonialText.style.transition   = 'opacity .35s, transform .35s';
  testimonialText.style.opacity      = '0';
  testimonialText.style.transform    = `translateX(${direction * 24}px)`;

  setTimeout(() => {
    testimonialText.textContent        = quotes[index].text;
    if (testimonialAuthor) testimonialAuthor.textContent = quotes[index].author;
    if (testimonialRole)   testimonialRole.textContent   = quotes[index].role;

    dots.forEach((d, i) => d.classList.toggle('active', i === index));

    /* Fade in from opposite direction */
    testimonialText.style.transform   = `translateX(${-direction * 24}px)`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        testimonialText.style.opacity   = '1';
        testimonialText.style.transform = 'translateX(0)';
      });
    });
  }, 350);
}

/* Dot click */
dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    if (i === currentQuote) return;
    const dir = i > currentQuote ? 1 : -1;
    currentQuote = i;
    showQuote(currentQuote, dir);
  });
});

/* Auto-advance every 5 s */
let quoteTimer = setInterval(() => {
  const dir = 1;
  currentQuote = (currentQuote + 1) % quotes.length;
  showQuote(currentQuote, dir);
}, 5000);

/* Pause auto-advance while user hovers testimonial panel */
const testimonialPanel = document.querySelector('.testimonial-panel');
if (testimonialPanel) {
  testimonialPanel.addEventListener('mouseenter', () => clearInterval(quoteTimer));
  testimonialPanel.addEventListener('mouseleave', () => {
    quoteTimer = setInterval(() => {
      currentQuote = (currentQuote + 1) % quotes.length;
      showQuote(currentQuote, 1);
    }, 5000);
  });
}

/* ── 8. HERO TITLE — STAGGER WORD ANIMATION ─────── */
const heroTitle = document.querySelector('.hero-title');

if (heroTitle) {
  /* Split inner text into word spans, preserve <br> */
  const html = heroTitle.innerHTML;
  const parts = html.split(/(<br\s*\/?>)/gi);
  heroTitle.innerHTML = parts
    .map(p => /^<br/i.test(p) ? p :
      p.split(/(\s+)/).map(w =>
        w.trim() ? `<span class="word" style="display:inline-block;overflow:hidden">
                      <span class="word-inner" style="display:inline-block">${w}</span>
                    </span>` : w
      ).join('')
    ).join('');

  const wordInners = heroTitle.querySelectorAll('.word-inner');
  wordInners.forEach((w, i) => {
    w.style.transform   = 'translateY(110%)';
    w.style.transition  = `transform .7s cubic-bezier(0.22,0.61,0.36,1) ${i * 0.12}s`;
  });

  /* Trigger after a short paint delay */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    wordInners.forEach(w => { w.style.transform = 'translateY(0)'; });
  }));
}

/* ── 9. HERO RIGHT — FADE IN ─────────────────────── */
const heroRight = document.querySelector('.hero-right');
if (heroRight) {
  heroRight.style.opacity   = '0';
  heroRight.style.transform = 'translateY(20px)';
  heroRight.style.transition = 'opacity .8s .5s cubic-bezier(0.22,0.61,0.36,1), transform .8s .5s cubic-bezier(0.22,0.61,0.36,1)';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    heroRight.style.opacity   = '1';
    heroRight.style.transform = 'translateY(0)';
  }));
}

/* ── 10. HERO ACCENT LINE DRAW ───────────────────── */
const accentLine = document.querySelector('.hero-accent-line');
if (accentLine) {
  accentLine.style.width      = '0';
  accentLine.style.transition = 'width .6s .9s cubic-bezier(0.22,0.61,0.36,1)';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    accentLine.style.width = '2.5rem';
  }));
}

/* ── 11. PROJECT TILE — TILT ON HOVER ───────────── */
const projectTiles = document.querySelectorAll('.project-tile, .project-featured');

projectTiles.forEach(tile => {
  tile.addEventListener('mousemove', e => {
    const rect = tile.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    tile.style.transform = `perspective(600px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) scale(1.015)`;
    tile.style.transition = 'transform .1s';
  });
  tile.addEventListener('mouseleave', () => {
    tile.style.transform  = '';
    tile.style.transition = 'transform .5s cubic-bezier(0.22,0.61,0.36,1)';
  });
});

/* ── 12. STAT NUMBERS — COUNT UP ────────────────── */
const statNums = document.querySelectorAll('.stat-num, .stat-block .stat-num');

const countObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    countObserver.unobserve(entry.target);

    const el     = entry.target;
    const raw    = el.textContent.trim();          /* e.g. "2+" or "10+" */
    const suffix = raw.replace(/[0-9]/g, '');      /* "+" */
    const target = parseInt(raw, 10);              /* 2 or 10 */
    const dur    = 900;
    const start  = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / dur, 1);
      /* ease out quart */
      const ease = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.round(ease * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}, { threshold: 0.5 });

statNums.forEach(el => countObserver.observe(el));

/* ── 13. CONTACT FORM — BASIC VALIDATION + SHAKE ── */
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', e => {
    let valid = true;

    contactForm.querySelectorAll('[required]').forEach(field => {
      field.parentElement.classList.remove('error');
      if (!field.value.trim()) {
        field.parentElement.classList.add('error');
        valid = false;
      }
    });

    if (!valid) {
      e.preventDefault();
      /* Shake invalid fields */
      const errorStyle = document.createElement('style');
      errorStyle.textContent = `
        @keyframes shake {
          0%,100%{ transform:translateX(0) }
          20%    { transform:translateX(-6px) }
          40%    { transform:translateX(6px) }
          60%    { transform:translateX(-4px) }
          80%    { transform:translateX(4px) }
        }
        .field.error { animation: shake .4s ease; border-bottom-color: #e05a5a !important; }
      `;
      if (!document.getElementById('shake-style')) {
        errorStyle.id = 'shake-style';
        document.head.appendChild(errorStyle);
      }
    }
  });
}

/* ── 14. SMOOTH ANCHOR SCROLL (with header offset) ─ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80; /* header height */
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ── 15. CURSOR AMBER DOT (desktop only) ─────────── */
if (window.matchMedia('(pointer: fine)').matches) {
  const cursor = document.createElement('div');
  cursor.id = 'cursor-dot';
  Object.assign(cursor.style, {
    position:       'fixed',
    width:          '8px',
    height:         '8px',
    borderRadius:   '50%',
    background:     '#f5a623',
    pointerEvents:  'none',
    zIndex:         '9999',
    transform:      'translate(-50%,-50%)',
    transition:     'transform .15s, width .25s, height .25s, opacity .25s',
    opacity:        '0',
    mixBlendMode:   'difference'
  });
  document.body.appendChild(cursor);

  let cx = 0, cy = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    cursor.style.opacity = '1';
  });

  /* Smooth follow via rAF */
  (function loop() {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
    requestAnimationFrame(loop);
  })();

  /* Grow on interactive elements */
  document.querySelectorAll('a, button, .service-card, .project-tile, .project-featured, .dot').forEach(el => {
    el.addEventListener('mouseenter', () => {
      Object.assign(cursor.style, { width: '28px', height: '28px', opacity: '.5' });
    });
    el.addEventListener('mouseleave', () => {
      Object.assign(cursor.style, { width: '8px', height: '8px', opacity: '1' });
    });
  });
}
