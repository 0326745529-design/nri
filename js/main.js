/* ═══════════════════════════════════════════════════════════════
   NRI International — shared behaviour (static site)
   Header, mobile nav, cinematic intro, scroll reveals, vCard.
   Works offline from file:// — no fetch, no server required.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var D = window.NRIINT_DATA || {};
  var contact = D.contact || {};
  var footer = D.footer || {};

  /* ── Header: solid on scroll ─────────────────────────────── */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('solid', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Mobile nav ──────────────────────────────────────────── */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) nav.classList.remove('open');
    });
  }

  /* ── Scroll-pinned cinematic intro ───────────────────────── */
  var intro = document.getElementById('intro');

  function finishIntro() {
    if (intro) intro.classList.add('done');
    if (header) {
      header.classList.remove('intro-light');
      header.classList.add('ready');
    }
  }

  if (intro) {
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
      finishIntro();
    } else {
      gsap.registerPlugin(ScrollTrigger);
      var curtain = intro.querySelector('.intro-curtain');
      var fillMark = intro.querySelector('.intro-mark-fill');
      var outlineMark = intro.querySelector('.intro-mark-outline');
      var maskEl = intro.querySelector('.intro-mask');
      var headline = intro.querySelector('.intro-headline');
      var meta = intro.querySelector('.intro-meta');
      if (header) header.classList.add('intro-light', 'ready');

      gsap.set(curtain, { yPercent: 100, willChange: 'transform' });
      gsap.set(outlineMark, { autoAlpha: 0 });
      gsap.set(headline, { autoAlpha: 0, y: 40 });

      gsap.timeline({
        scrollTrigger: {
          trigger: intro,
          start: 'top top',
          end: function () { return '+=' + Math.round(window.innerHeight * 1.5); },
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (header && self.progress <= 0.001) gsap.set(header, { autoAlpha: 1, y: 0 });
          }
        }
      })
        .fromTo(header, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -12, ease: 'none', duration: 0.16 }, 0)
        .fromTo(maskEl, { backgroundPosition: '18% 60%' }, { backgroundPosition: '82% 40%', ease: 'none', duration: 0.6 }, 0)
        .to(meta, { autoAlpha: 0, ease: 'none', duration: 0.12 }, 0)
        .to(fillMark, { scale: 1.06, ease: 'none', duration: 0.6 }, 0)
        .to(curtain, { yPercent: 0, ease: 'none', duration: 0.74 }, 0.14)
        .to(fillMark, { autoAlpha: 0, ease: 'none', duration: 0.22 }, 0.46)
        .to(outlineMark, { autoAlpha: 1, ease: 'none', duration: 0.22 }, 0.46)
        .to(headline, { autoAlpha: 1, y: 0, ease: 'none', duration: 0.2 }, 0.74);

      if (header) {
        ScrollTrigger.create({
          trigger: '#hero',
          start: 'top top',
          onEnter: function () {
            header.classList.remove('intro-light');
            gsap.to(header, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out', overwrite: true });
          },
          onLeaveBack: function () {
            header.classList.add('intro-light');
            gsap.set(header, { autoAlpha: 0, y: -12 });
          }
        });
      }

      window.addEventListener('load', function () {
        ScrollTrigger.refresh();
      });
    }
  } else if (header) {
    header.classList.add('ready');
  }

  /* ── Scroll reveals ──────────────────────────────────────── */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (revealEls.length && 'IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── Footer year ─────────────────────────────────────────── */
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ── vCard download (offline, data URI) ──────────────────── */
  var vcardBtn = document.getElementById('vcard-btn');
  if (vcardBtn) {
    vcardBtn.addEventListener('click', function () {
      // Read contact details at click time so CMS-updated values apply
      var c = (window.NRIINT_DATA || {}).contact || contact || {};
      var vcf = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:NRI International',
        'ORG:NRI International (NRIINT)',
        'TEL;TYPE=WORK,VOICE:' + (c.mobile || c.telephone || ''),
        'EMAIL;TYPE=WORK:' + (c.email || 'info@nriint.com'),
        'ADR;TYPE=WORK:;;' + (c.address || '') + ';;;;',
        'URL:https://nriint.com',
        'NOTE:' + (c.hours || ''),
        'END:VCARD'
      ].join('\r\n');
      var a = document.createElement('a');
      a.href = 'data:text/vcard;charset=utf-8,' + encodeURIComponent(vcf);
      a.download = 'NRI-International.vcf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  /* ── Icons ───────────────────────────────────────────────── */
  function renderIcons() {
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderIcons);
  } else {
    renderIcons();
  }
  // Re-render after dynamic sections populate
  document.addEventListener('nriint:content-rendered', renderIcons);

  /* ── Discreet admin entry (footer lock icon) ─────────────── */
  var fbInner = document.querySelector('.site-footer .footer-bottom .inner');
  if (fbInner && !document.getElementById('admin-link')) {
    var a = document.createElement('a');
    a.id = 'admin-link';
    a.href = 'admin.html';
    a.title = 'Admin';
    a.setAttribute('aria-label', 'Admin');
    a.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    fbInner.appendChild(a);
  }
})();
