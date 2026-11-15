/* Rihla Hajj & Umrah — animation layer built on Motion (the vanilla-JS edition of Framer Motion).
   Loaded as a module after main.js. Without it, or with reduced motion, the site is complete and static. */
import { animate, scroll, inView, stagger, hover } from 'https://cdn.jsdelivr.net/npm/motion@14.3.0/+esm';

const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const EASE = [0.2, 0.7, 0.2, 1];
const SPRING = { type: 'spring', stiffness: 320, damping: 26, mass: 0.9 };


/* ---------- helpers ---------- */
function splitWords(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const words = [];
  nodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/([ \t\n\r]+)/).forEach((part) => { // NBSP keeps words together
      if (!part) return;
      if (/^[ \t\n\r]+$/.test(part)) { frag.append(part); return; }
      const outer = document.createElement('span');
      const inner = document.createElement('span');
      outer.className = 'split-w';
      inner.textContent = part;
      outer.append(inner);
      frag.append(outer);
      words.push(inner);
    });
    node.replaceWith(frag);
  });
  return words;
}

const inViewport = (el) => {
  const r = el.getBoundingClientRect();
  return r.top < innerHeight * 0.92 && r.bottom > 0;
};

/* ---------- hero entrance (home hero and inner page heroes) ---------- */
function heroEntrance() {
  const hero = $('.hero, .page-hero');
  if (!hero) { root.classList.remove('m-pending'); return; }
  const items = $$('[data-m-hero]', hero);
  const h1 = $('h1', hero);
  const words = h1 ? splitWords(h1) : [];

  items.forEach((el) => {
    if (el === h1) return;
    Object.assign(el.style, { opacity: '0', transform: 'translateY(26px)', filter: 'blur(8px)' });
  });
  words.forEach((w) => { w.style.transform = 'translateY(110%)'; });
  root.classList.remove('m-pending');

  const media = $('.hero-bg, .page-hero-bg', hero);
  if (media) animate(media, { scale: [1.14, 1.04], opacity: [0.35, 1] }, { duration: 2.4, ease: EASE });

  let t = 0.12;
  items.forEach((el) => {
    if (el === h1) {
      animate(words, { transform: ['translateY(110%)', 'translateY(0%)'] }, { duration: 0.95, ease: EASE, delay: stagger(0.045, { startDelay: t }) });
      t += Math.min(words.length * 0.045, 0.55) + 0.15;
    } else {
      animate(el, { opacity: [0, 1], transform: ['translateY(26px)', 'translateY(0px)'], filter: ['blur(8px)', 'blur(0px)'] }, { duration: 0.9, delay: t, ease: EASE });
      t += 0.12;
    }
  });
}

/* ---------- scroll reveals, batched so items entering together stagger ---------- */
const REVEAL = [
  '.reveal', '.section-head > *', '.faq-side > *', '.story-copy > *', '.offices-copy > *', '.cta-band-copy > *',
  '.answer-copy > *', '.nusuk-copy > .kicker', '.nusuk-copy > h2', '.nusuk-copy > .lede', '.steps-num li', '.itin-copy > .kicker',
  '.itin-copy > h2', '.itin-copy > .lede', '.date-grid li', '.stats li', '.qa', '.checklist li', '.glance', '.answer-card',
  '.table-wrap', '.accredit-list li', '.contact-lines li', '.offices li', '.enquiry', '.services-title', '.reviews-head',
  '.prose > *', '.toc', '.aside-cta', '.map', '.stay-media', '.family-note', '.section-more',
].join(',');
const CLIP = '.masonry figure, .article-media, .stay-media, .glance-media';

function hide(el) {
  if (el.matches('.orn')) { el.style.transform = 'scaleX(0)'; return; }
  if (el.matches(CLIP)) { el.style.clipPath = 'inset(100% 0% 0% 0%)'; return; }
  Object.assign(el.style, { opacity: '0', transform: 'translateY(28px)' });
  if (el.matches('h2')) el.style.filter = 'blur(6px)';
}

function show(el, delay) {
  const opts = { duration: 0.9, delay, ease: EASE };
  if (el.matches('.orn')) return animate(el, { transform: ['scaleX(0)', 'scaleX(1)'] }, { ...opts, duration: 1.1 });
  if (el.matches(CLIP)) {
    const img = $('img', el);
    if (img) animate(img, { transform: ['scale(1.18)', 'scale(1)'] }, { ...opts, duration: 1.4 });
    return animate(el, { clipPath: ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'] }, { ...opts, duration: 1.1 });
  }
  const kf = { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] };
  if (el.matches('h2')) kf.filter = ['blur(6px)', 'blur(0px)'];
  return animate(el, kf, opts).then(() => { el.style.transform = ''; el.style.filter = ''; });
}

function scrollReveals() {
  const targets = [...new Set($$(REVEAL))].filter((el) => !el.closest('.hero, .page-hero') && el.offsetParent !== null && !inViewport(el));
  let batch = [];
  let frame = 0;
  const flush = () => {
    frame = 0;
    batch.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
      .forEach((el, i) => show(el, Math.min(i, 6) * 0.08));
    batch = [];
  };
  targets.forEach((el) => {
    hide(el);
    // a fully clipped element never reports as intersecting, so watch its unclipped parent instead
    const watch = el.matches(CLIP) ? el.parentElement : el;
    const stop = inView(watch, () => {
      stop();
      batch.push(el);
      if (!frame) frame = setTimeout(flush, 16); // not rAF: it stalls in background tabs
    }, { margin: '0px 0px -8% 0px', amount: 0.12 });
  });
}

/* ---------- parallax + scroll progress ---------- */
function parallax() {
  const bar = $('.scroll-progress');
  if (bar) scroll(animate(bar, { transform: ['scaleX(0)', 'scaleX(1)'] }, { ease: 'linear' }));

  const hero = $('.hero');
  if (hero) {
    $$('.hero-media, .hero-video', hero).forEach((el) => {
      scroll(animate(el, { transform: ['translateY(0px)', 'translateY(110px)'] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
    });
    const inner = $('.hero-inner', hero);
    if (inner) scroll(animate(inner, { opacity: [1, 0.15], transform: ['translateY(0px)', 'translateY(-50px)'] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
  }
  const pageHero = $('.page-hero');
  const pageImg = pageHero && $('.page-hero-bg img', pageHero);
  if (pageImg) scroll(animate(pageImg, { transform: ['translateY(0px) scale(1.06)', 'translateY(70px) scale(1.06)'] }, { ease: 'linear' }), { target: pageHero, offset: ['start start', 'end start'] });

  $$('.enquire-bg img, .glance-media img').forEach((img) => {
    const box = img.parentElement;
    scroll(animate(img, { transform: ['translateY(-24px) scale(1.12)', 'translateY(24px) scale(1.12)'] }, { ease: 'linear' }), { target: box, offset: ['start end', 'end start'] });
  });
  $$('.section .pattern').forEach((p) => {
    scroll(animate(p, { transform: ['translateY(-40px)', 'translateY(40px)'] }, { ease: 'linear' }), { target: p.parentElement, offset: ['start end', 'end start'] });
  });
}

/* ---------- count-ups ---------- */
function counters() {
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const dec = +(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || '';
    const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
    if (inViewport(el)) return;
    el.textContent = fmt(0);
    const stop = inView(el, () => {
      stop();
      animate(0, end, { duration: 1.9, ease: EASE, onUpdate: (v) => { el.textContent = fmt(v); } });
    }, { amount: 0.6 });
  });
}

/* ---------- spring lift on cards (mouse and trackpad only) ---------- */
function cardHover() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  hover('.pkg, .dep-card, .quote, .stay, .why-item, .howto li, .article a, .member', (el) => {
    animate(el, { y: -6 }, SPRING);
    return () => animate(el, { y: 0 }, SPRING);
  });
}

/* ---------- package tabs: cards rise in when a tab opens ---------- */
function tabSwitch() {
  document.addEventListener('rihla:tabchange', (e) => {
    const cards = $$('.pkg', e.detail.panel);
    animate(cards, { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0px)'] }, { duration: 0.7, ease: EASE, delay: stagger(0.08) })
      .then(() => cards.forEach((c) => { c.style.transform = ''; }));
  });
}

/* ---------- FAQ: animate the answer open and closed ---------- */
function faqAccordion() {
  $$('details.qa').forEach((d) => {
    const summary = $('summary', d);
    const body = $('.qa-a', d);
    if (!summary || !body) return;
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      if (d.dataset.busy) return;
      d.dataset.busy = '1';
      const done = () => { body.style.height = ''; body.style.opacity = ''; delete d.dataset.busy; };
      if (d.open) {
        animate(body, { height: [`${body.offsetHeight}px`, '0px'], opacity: [1, 0] }, { duration: 0.35, ease: EASE })
          .then(() => { d.open = false; done(); });
      } else {
        d.open = true;
        animate(body, { height: ['0px', `${body.offsetHeight}px`], opacity: [0, 1] }, { duration: 0.45, ease: EASE }).then(done);
      }
    });
  });
}

/* ---------- hero video fades in once it actually plays ---------- */
function heroVideo() {
  const video = $('.hero-video');
  if (!video || !video.querySelector('source')) return;
  const reveal = () => animate(video, { opacity: [0, 1] }, { duration: 1.6, ease: EASE });
  if ('playing' in video.dataset && !video.paused) reveal();
  else video.addEventListener('playing', reveal, { once: true });
}

/* ---------- start ---------- */
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  root.classList.remove('m-pending');
} else {
  root.classList.add('m-ready');
  heroEntrance();
  scrollReveals();
  parallax();
  counters();
  cardHover();
  tabSwitch();
  faqAccordion();
  heroVideo();
}
