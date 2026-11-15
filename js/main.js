/* Rihla Hajj & Umrah — progressive enhancement only; every page works without this file.
   Animation lives in motion.js; this file handles navigation, prices, tabs, forms and the hero video. */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const WA = '442079460321';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);
  const store = {
    get: (k, s = localStorage) => { try { return s.getItem(k); } catch { return null; } },
    set: (k, v, s = localStorage) => { try { s.setItem(k, v); } catch { /* storage unavailable */ } },
  };
  const setVal = (sel, v) => {
    const el = $(sel);
    if (!el || v == null || v === '') return;
    if (el.tagName === 'SELECT') {
      const opt = [...el.options].find((o) => o.value === v || o.text === v);
      if (opt) el.value = opt.value;
    } else el.value = v;
  };

  /* toast */
  const toast = $('#toast');
  let toastTimer;
  const say = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3400);
  };

  /* header state */
  const header = $('.site-header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* mobile navigation */
  const toggle = $('.nav-toggle');
  const nav = $('#main-nav');
  if (toggle && nav) {
    const setNav = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setNav(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
    });
    matchMedia('(min-width: 1280px)').addEventListener('change', () => setNav(false));
  }

  /* currency switcher — fixed demo rates, rounded to the nearest 10 */
  const RATES = { USD: 1, GBP: 0.79, EUR: 0.92, CAD: 1.37, AUD: 1.52 };
  const prices = $$('[data-price-usd]');
  const setCurrency = (cur) => {
    const nf = new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 });
    prices.forEach((el) => { el.textContent = nf.format(Math.round((+el.dataset.priceUsd * RATES[cur]) / 10) * 10); });
    store.set('rihla-currency', cur);
  };
  const curBox = $('.currency');
  const curSel = $('#currency');
  if (curBox && curSel) {
    curBox.hidden = false;
    const saved = store.get('rihla-currency');
    if (saved && RATES[saved] && saved !== 'USD') { curSel.value = saved; setCurrency(saved); }
    curSel.addEventListener('change', () => {
      setCurrency(curSel.value);
      say(`Prices shown in ${curSel.value} — indicative demo rates`);
    });
  }

  /* package tabs (all panels stay visible without JS) */
  const tablist = $('.tabs');
  if (tablist) {
    const tabs = $$('[role="tab"]', tablist);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const selectTab = (i, focus) => {
      tabs.forEach((t, j) => {
        const on = i === j;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
      document.dispatchEvent(new CustomEvent('rihla:tabchange', { detail: { panel: panels[i] } }));
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => selectTab(i));
      t.addEventListener('keydown', (e) => {
        const last = tabs.length - 1;
        const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
        if (next !== undefined) { e.preventDefault(); selectTab(next, true); }
      });
    });
    tablist.hidden = false;
    // open the tab named in the URL: #panel-ramadan or ?type=ramadan
    const wanted = location.hash.replace('#panel-', '') || params.get('type');
    const start = Math.max(0, panels.findIndex((p) => p.dataset.panel === wanted));
    selectTab(start);
    if (location.hash.startsWith('#panel-')) $('#packages')?.scrollIntoView();
  }

  /* trip finder (home) → the matching package page, carrying the trip details */
  const finder = $('#finder');
  if (finder) {
    finder.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(finder);
      const type = d.get('type');
      const q = new URLSearchParams({ city: d.get('city'), month: d.get('month'), travellers: Math.max(1, +d.get('travellers') || 1), type });
      location.href = type === 'hajj' ? `/hajj-packages/?${q}#hajj-packages` : `/umrah-packages/?${q}#panel-${type}`;
    });
  }

  /* arriving from the finder: remember the trip and confirm it on the page */
  if (params.get('city')) {
    const trip = { city: params.get('city'), month: params.get('month'), travellers: params.get('travellers'), type: params.get('type') };
    store.set('rihla-trip', JSON.stringify(trip), sessionStorage);
    const label = { umrah: 'Umrah', ramadan: 'Ramadan', hajj: 'Hajj 2027' }[trip.type] || 'Umrah';
    const pax = +trip.travellers || 1;
    say(`Showing ${label} packages for ${pax} ${pax === 1 ? 'traveller' : 'travellers'} from ${trip.city}`);
  }

  /* contact page: pre-fill the quote form from the package link and the saved trip */
  const enquiry = $('#enquiry');
  if (enquiry) {
    let trip = {};
    try { trip = JSON.parse(store.get('rihla-trip', sessionStorage) || '{}'); } catch { /* ignore */ }
    const country = (city = '') => (/LHR|MAN|BHX/.test(city) ? 'United Kingdom'
      : /JFK|IAD|ORD|IAH/.test(city) ? 'United States'
      : /YYZ/.test(city) ? 'Canada'
      : /SYD|MEL/.test(city) ? 'Australia'
      : /CDG/.test(city) ? 'France'
      : /AMS/.test(city) ? 'Netherlands' : '');
    const pkgName = params.get('package');
    const pkgOption = (name = '') => (/Hajj/.test(name) ? 'Hajj 2027' : /Ramadan|Last Ten/.test(name) ? 'Ramadan Umrah'
      : /Private|family/i.test(name) ? 'Private / family' : /Essentials|Signature|Elite/.test(name) ? name.replace(/^(Winter|New Year|Spring|Easter Break|Winter Family|Madinah-first) /, '') : name);
    setVal('#e-package', pkgOption(pkgName || ({ hajj: 'Hajj 2027', ramadan: 'Ramadan Umrah' }[trip.type])));
    setVal('#e-month', trip.month);
    setVal('#e-pax', trip.travellers);
    setVal('#e-country', country(trip.city));
    const msg = $('#e-msg');
    if (msg && pkgName && !msg.value) msg.value = `I'm interested in the ${pkgName} package.`;

    /* "Enquire" on a card on the same page pre-selects it */
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-package]');
      if (!btn || btn.getAttribute('href') !== '#enquire') return;
      const name = btn.dataset.package;
      setVal('#e-package', pkgOption(name));
      if (msg && !msg.value) msg.value = `I'm interested in the ${name} package.`;
    });

    /* enquiry → WhatsApp or email with a ready-written message */
    enquiry.addEventListener('submit', (e) => {
      e.preventDefault();
      const via = (e.submitter && e.submitter.dataset.via) || 'whatsapp';
      const d = Object.fromEntries(new FormData(enquiry));
      const text = [
        "Assalamu alaikum, I'd like a quote from Rihla.",
        `Name: ${d.name}`,
        `Email: ${d.email}`,
        d.phone && `Phone / WhatsApp: ${d.phone}`,
        `Departing from: ${d.country}`,
        `Package: ${d.package}`,
        `Month: ${d.month}`,
        `Travellers: ${d.travellers}`,
        d.message && `Notes: ${d.message}`,
      ].filter(Boolean).join('\n');
      if (via === 'email') {
        location.href = `mailto:hello@rihlahajj.com?subject=${encodeURIComponent(`Quote request — ${d.package}`)}&body=${encodeURIComponent(text)}`;
      } else {
        window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      }
      say('JazakAllahu khayran — your message is ready to send.');
    });
  }

  /* newsletter (demo — nothing is sent) */
  const nl = $('#newsletter');
  if (nl) {
    nl.addEventListener('submit', (e) => {
      e.preventDefault();
      $('.nl-msg', nl).textContent = "JazakAllahu khayran — you're on the list. (Demo: no email was sent.)";
      nl.reset();
    });
  }

  /* hero video: skip on data saver, pause off-screen, accessible pause/play (WCAG 2.2.2) */
  const video = $('.hero-video');
  const vToggle = $('.video-toggle');
  if (video) {
    const conn = navigator.connection;
    if (reduce || conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || '')) {
      video.pause();
      $$('source', video).forEach((s) => s.remove());
      video.removeAttribute('src');
      video.load();
    } else {
      let userPaused = false;
      const setBtn = (paused) => {
        if (!vToggle) return;
        vToggle.classList.toggle('is-paused', paused);
        vToggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
      };
      video.addEventListener('playing', () => {
        video.dataset.playing = '';
        if (vToggle) vToggle.hidden = false;
        // motion.js fades the video in; if the module could not load, show it after a moment
        setTimeout(() => { if (!document.documentElement.classList.contains('m-ready')) video.style.opacity = '1'; }, 1500);
      }, { once: true });
      vToggle?.addEventListener('click', () => {
        userPaused = !video.paused;
        if (userPaused) video.pause(); else video.play().catch(() => {});
        setBtn(userPaused);
      });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([en]) => {
          if (en.isIntersecting) { if (!userPaused) video.play().catch(() => {}); } else video.pause();
        }, { threshold: 0.05 }).observe(video.closest('.hero') || video);
      }
      video.play().catch(() => {});
    }
  }

  /* footer year */
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
