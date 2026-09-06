/* ==========================================================================
   NEIGE ACADEMY — interactions
   Vanilla JS, zéro dépendance. Tout le scroll passe par une seule boucle rAF.
   ========================================================================== */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp  = (a, b, t) => a + (b - a) * t;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE    = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ------------------------------------------------------------------ *
 * 1. Découpage typographique (caractères / lignes / mots)
 * ------------------------------------------------------------------ */
function splitChars() {
  $$('[data-split]').forEach((el, wi) => {
    const txt = el.textContent;
    el.textContent = '';
    [...txt].forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c === ' ' ? ' ' : c;
      s.style.setProperty('--dl', `${wi * 0.07 + i * 0.028 + 0.15}s`);
      el.appendChild(s);
    });
  });
}

function splitLines() {
  $$('[data-split-lines]').forEach(el => {
    const html = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = html
      .map((part, i) => `<span class="ln"><i style="--dl:${i * 0.09}s">${part.trim()}</i></span>`)
      .join('');
  });
}

function splitWords() {
  const el = $('[data-scrolltext]');
  if (!el) return null;
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(w => `<span class="wd">${w}</span>`).join(' ');
  return $$('.wd', el);
}

/* ------------------------------------------------------------------ *
 * 2. Preloader
 * ------------------------------------------------------------------ */
function boot() {
  const loader = $('#loader'), bar = $('#loaderBar'), pct = $('#loaderPct');
  const DUR = 1400;                 // durée nominale de la barre
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    bar.style.width = '100%';
    pct.textContent = '100';
    loader.classList.add('is-done');
    document.body.classList.add('is-ready');
  };

  if (REDUCED) { finish(); return; }

  const t0 = performance.now();
  const tick = now => {
    const p = clamp((now - t0) / DUR);
    const v = (1 - Math.pow(1 - p, 3)) * 100;
    bar.style.width = v + '%';
    pct.textContent = String(Math.round(v)).padStart(2, '0');
    if (p < 1) requestAnimationFrame(tick);
    else setTimeout(finish, 220);
  };
  requestAnimationFrame(tick);

  // Filet de sécurité : rAF est suspendu dans un onglet en arrière-plan,
  // setTimeout non. Le site ne doit jamais rester bloqué sur l'écran de chargement.
  setTimeout(finish, DUR + 900);
  addEventListener('pagehide', finish);
}

/* ------------------------------------------------------------------ *
 * 3. Apparitions au scroll
 * ------------------------------------------------------------------ */
function observeReveals() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('on');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

  $$('.reveal, [data-split-lines], .cell, .coach, .acc__item, .sec-sub, .eyebrow')
    .filter(el => !el.closest('.hero'))
    .forEach(el => io.observe(el));

  // Décalage en cascade dans les grilles
  $$('.bento .cell').forEach((el, i) => el.style.transitionDelay = `${i * 0.06}s`);
  $$('.coach').forEach((el, i) => el.style.transitionDelay = `${i * 0.07}s`);
  $$('.acc__item').forEach((el, i) => el.style.transitionDelay = `${i * 0.05}s`);
}

/* ------------------------------------------------------------------ *
 * 4. Compteurs
 * ------------------------------------------------------------------ */
function counters() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const to = +el.dataset.to, sfx = el.dataset.suffix || '';
      const dur = 1500, t0 = performance.now();
      const run = now => {
        const p = clamp((now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(to * eased) + (p === 1 ? sfx : '');
        if (p < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('.count').forEach(el => io.observe(el));
}

/* ------------------------------------------------------------------ *
 * 5. Navigation
 * ------------------------------------------------------------------ */
function nav() {
  const bar = $('#nav'), burger = $('#burger'), menu = $('#menu');
  let last = 0;

  const onScroll = y => {
    bar.classList.toggle('is-stuck', y > 40);
    bar.classList.toggle('is-hidden', y > last && y > 400 && !menu.classList.contains('is-open'));
    last = y;
  };

  const close = () => {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  };

  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  });

  $$('[data-nav]').forEach(a => a.addEventListener('click', close));
  addEventListener('keydown', e => e.key === 'Escape' && close());

  // Lien actif
  const links = $$('.nav__links a');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id]').forEach(s => spy.observe(s));

  return onScroll;
}

/* ------------------------------------------------------------------ *
 * 6. Curseur personnalisé + aimantation
 * ------------------------------------------------------------------ */
function cursor() {
  if (!FINE || REDUCED) return;
  const el = $('#cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  const loop = () => {
    rx = lerp(rx, mx, 0.16); ry = lerp(ry, my, 0.16);
    dot.style.transform  = `translate(${mx}px,${my}px)`;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(loop);
  };
  loop();

  $$('a, button, summary, [data-tilt]').forEach(t => {
    t.addEventListener('pointerenter', () => el.classList.add('is-hot'));
    t.addEventListener('pointerleave', () => el.classList.remove('is-hot'));
  });

  // Boutons aimantés
  $$('[data-magnetic]').forEach(t => {
    t.addEventListener('pointermove', e => {
      const r = t.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.28;
      const y = (e.clientY - r.top - r.height / 2) * 0.38;
      t.style.transform = `translate(${x}px,${y}px)`;
    });
    t.addEventListener('pointerleave', () => {
      t.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1)';
      t.style.transform = '';
      setTimeout(() => t.style.transition = '', 620);
    });
    t.addEventListener('pointerenter', () => t.style.transition = '');
  });
}

/* ------------------------------------------------------------------ *
 * 7. Spotlight + inclinaison des cartes
 * ------------------------------------------------------------------ */
function cards() {
  if (!FINE || REDUCED) return;
  $$('[data-spot]').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`);
      c.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
  $$('[data-tilt]').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      c.style.transform = `perspective(1000px) rotateX(${-py * 3.4}deg) rotateY(${px * 3.4}deg) translateZ(0)`;
    });
    c.addEventListener('pointerleave', () => c.style.transform = '');
  });
}

/* ------------------------------------------------------------------ *
 * 8. Accordéon FAQ (hauteur animée)
 * ------------------------------------------------------------------ */
function accordion() {
  $$('.acc__item').forEach(item => {
    const body = $('.acc__body', item);
    body.style.height = item.open ? 'auto' : '0px';
    body.style.transition = 'height .55s cubic-bezier(.22,1,.36,1)';

    $('summary', item).addEventListener('click', e => {
      e.preventDefault();
      const opening = !item.open;

      // Un seul panneau ouvert à la fois
      $$('.acc__item[open]').forEach(other => {
        if (other === item) return;
        const ob = $('.acc__body', other);
        ob.style.height = ob.scrollHeight + 'px';
        requestAnimationFrame(() => { ob.style.height = '0px'; });
        ob.addEventListener('transitionend', () => { other.open = false; }, { once: true });
      });

      if (opening) {
        item.open = true;
        const h = body.scrollHeight;
        body.style.height = '0px';
        requestAnimationFrame(() => { body.style.height = h + 'px'; });
        body.addEventListener('transitionend', () => { body.style.height = 'auto'; }, { once: true });
      } else {
        body.style.height = body.scrollHeight + 'px';
        requestAnimationFrame(() => { body.style.height = '0px'; });
        body.addEventListener('transitionend', () => { item.open = false; }, { once: true });
      }
    });
  });
}

/* ------------------------------------------------------------------ *
 * 9. Neige (canvas)
 * ------------------------------------------------------------------ */
function snow() {
  const cv = $('#snow');
  if (REDUCED) { cv.style.display = 'none'; return; }
  const ctx = cv.getContext('2d');
  let w, h, dpr, flakes = [], mouse = { x: -999, y: -999 }, scrollY = 0;

  const build = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.width = innerWidth * dpr;
    h = cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px';
    cv.style.height = innerHeight + 'px';
    const density = innerWidth < 700 ? 42 : 110;
    flakes = Array.from({ length: density }, () => spawn(true));
  };

  const spawn = init => ({
    x: Math.random() * w,
    y: init ? Math.random() * h : -20 * dpr,
    z: Math.random() * 0.8 + 0.2,                 // profondeur
    r: (Math.random() * 1.7 + 0.5) * dpr,
    sp: (Math.random() * 0.5 + 0.22) * dpr,
    dr: Math.random() * Math.PI * 2,              // phase d'oscillation
    ds: Math.random() * 0.014 + 0.004,
    a: Math.random() * 0.5 + 0.2
  });

  addEventListener('resize', build);
  addEventListener('pointermove', e => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; }, { passive: true });
  addEventListener('scroll', () => { scrollY = scrollY * 0.6 + (window.scrollY - scrollY) * 0.02; }, { passive: true });

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const f of flakes) {
      f.dr += f.ds;
      f.y += f.sp * (0.35 + f.z);
      f.x += Math.sin(f.dr) * 0.55 * dpr * f.z;

      // léger évitement du curseur
      const dx = f.x - mouse.x, dy = f.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      const R = 130 * dpr;
      if (d2 < R * R) {
        const d = Math.sqrt(d2) || 1;
        const push = (1 - d / R) * 2.4 * dpr;
        f.x += (dx / d) * push;
        f.y += (dy / d) * push;
      }

      if (f.y > h + 12 * dpr) Object.assign(f, spawn(false), { x: Math.random() * w });
      if (f.x < -20 * dpr) f.x = w + 10 * dpr;
      if (f.x > w + 20 * dpr) f.x = -10 * dpr;

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * (0.5 + f.z), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(219,240,255,${f.a * (0.35 + f.z * 0.65)})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  };

  build();
  draw();
}

/* ------------------------------------------------------------------ *
 * 10. Boucle de scroll : progression, manifeste, parcours, échelle
 * ------------------------------------------------------------------ */
function scrollEngine(onNavScroll, words) {
  const prog     = $('#scrollProgress');
  const journey  = $('.journey');
  const track    = $('#journeyTrack');
  const jBar     = $('#journeyBar');
  const manifest = $('.manifesto');
  const ladder   = $('[data-ladder]');
  const heroMark = $('.hero__mark');

  let curX = 0, tgtX = 0, ticking = false;

  const ladderIO = new IntersectionObserver(e => {
    if (e[0].isIntersecting) { ladder.classList.add('on'); ladderIO.disconnect(); }
  }, { threshold: 0.25 });
  if (ladder) ladderIO.observe(ladder);

  const measure = () => {
    const y = window.scrollY;
    const vh = innerHeight;

    onNavScroll(y);
    prog.style.width = (y / (document.documentElement.scrollHeight - vh) * 100) + '%';

    // Parallaxe légère du flocon du hero
    if (heroMark && y < vh) heroMark.style.translate = `0 ${y * 0.16}px`;

    // Manifeste : révélation mot à mot
    if (words && manifest && !REDUCED) {
      const r = manifest.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh));
      const n = Math.round(p * 1.35 * words.length);
      words.forEach((wd, i) => wd.classList.toggle('on', i < n));
    }

    // Parcours : défilement horizontal épinglé
    if (journey && track && innerWidth > 900) {
      const r = journey.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh));
      const dist = track.scrollWidth - innerWidth + 40;
      tgtX = -p * Math.max(dist, 0);
      jBar.style.width = (p * 100) + '%';
    } else if (track) {
      tgtX = 0; curX = 0; track.style.transform = '';
    }

    ticking = false;
  };

  const render = () => {
    if (track && innerWidth > 900) {
      curX = lerp(curX, tgtX, REDUCED ? 1 : 0.11);
      track.style.transform = `translate3d(${curX.toFixed(2)}px,0,0)`;
    }
    requestAnimationFrame(render);
  };

  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(measure); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  measure();
  render();
}

/* ------------------------------------------------------------------ *
 * Démarrage
 * ------------------------------------------------------------------ */
splitChars();
splitLines();
const words = splitWords();
boot();
observeReveals();
counters();
cursor();
cards();
accordion();
snow();
scrollEngine(nav(), words);
$('#year').textContent = new Date().getFullYear();

// Ancres douces avec compensation de la barre fixe
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    const t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    const top = t.getBoundingClientRect().top + window.scrollY - (id === '#top' ? 0 : 10);
    scrollTo({ top, behavior: REDUCED ? 'auto' : 'smooth' });
  });
});
})();
