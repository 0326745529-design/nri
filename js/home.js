/* ═══════════════════════════════════════════════════════════════
   NRI International — home page (static site)
   EXPERIENCE 02: pinned horizontal product showcase driven by
   vertical scroll. Travel distance is computed from the real
   track width on every refresh (never hardcoded). Desktop hover
   flips the card in 3D (front = product, back = machine line);
   touch uses tap-to-flip. The flip is a pure-CSS transform
   animation — GPU-composited, no loading cost, no lag.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Render embedded product data, or wait for the optional Supabase catalog. */
  window.NRI_BOOT.ready(function () {

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var D = window.NRIINT_DATA || {};
  var products = (D.products || []).filter(function (p) { return p && p.name; });

  /* ── Render showcase cards from embedded data ────────────── */
  var track = document.getElementById('showcase-track');

  /* Database unreachable / no data: show the error instead of sample products. */
  if (window.NRI_BOOT.dbFailed() && track) {
    products = [];
    var showcase = document.getElementById('showcase');
    if (showcase) showcase.classList.add('db-failed');
    track.innerHTML = window.NRI_BOOT.errorHtml();
  }
  if (track && products.length) {
    var html = products.map(function (p) {
      var machine = p.machine
        ? '<div class="machine-reveal" data-machine="' + p.slug + '" aria-hidden="true">' +
            '<img src="' + window.NRI_BOOT.image(p.machine) + '" alt="Manufacturing machine producing ' + p.name + '" loading="lazy">' +
            '<div class="machine-shade"></div>' +
            '<div class="machine-badge"><i data-lucide="cog"></i><span>Manufacturing line</span></div>' +
          '</div>'
        : '';
      var tapBtn = p.machine
        ? '<button class="btn btn-ghost btn-sm tap-reveal" data-tap="' + p.slug + '" aria-expanded="false">SHOW MACHINE</button>'
        : '';
      return (
        '<article class="showcase-card" data-slug="' + p.slug + '">' +
          '<div class="flip-scene">' +
            '<img class="product-img" src="' + (window.NRI_BOOT.image(p.image) || 'images/products/woven-labels.webp') + '" alt="' + p.name + ' — garment accessories by NRI International Ltd" loading="lazy">' +
            machine +
          '</div>' +
          '<div class="shade"></div>' +
          '<div class="showcase-footer">' +
            '<p class="kicker kicker-brand cat">' + (p.category || 'Accessories') + '</p>' +
            '<h3>' + p.name + '</h3>' +
            '<p class="tagline">' + p.tagline + '</p>' +
            '<div class="row">' +
              '<a class="btn btn-primary btn-sm" href="product.html?slug=' + p.slug + '">VIEW DETAILS <i data-lucide="arrow-up-right"></i></a>' +
              tapBtn +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    /* Insert cards before the closing "end" panel */
    var endPanel = track.querySelector('.showcase-end');
    endPanel.insertAdjacentHTML('beforebegin', html);

    /* Tap-to-flip (touch devices) */
    track.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tap]');
      if (!btn) return;
      var layer = track.querySelector('[data-machine="' + btn.getAttribute('data-tap') + '"]');
      if (!layer) return;
      var scene = layer.closest('.flip-scene') || layer;
      var on = scene.classList.toggle('revealed');
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      btn.textContent = on ? 'SHOW PRODUCT' : 'SHOW MACHINE';
    });

    document.dispatchEvent(new CustomEvent('nriint:content-rendered'));
  }

  /* ── GSAP: hero parallax + pinned horizontal travel ──────── */
  function setup() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    if (reduceMotion) return; // static page, no scrubbing

    /* Hero parallax */
    var bg = document.querySelector('.hero-bg');
    if (bg) {
      gsap.to(bg, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    /* Hero lines entrance after the intro releases the page */
    var lines = document.querySelectorAll('[data-hero-line]');
    if (lines.length) {
      gsap.from(lines, {
        yPercent: 110,
        duration: 1.05,
        stagger: 0.11,
        ease: 'power4.out',
        delay: 0.1,
        scrollTrigger: { trigger: '#hero', start: 'top 80%', once: true }
      });
    }

    /* Horizontal showcase */
    var section = document.getElementById('showcase');
    if (section && track && products.length) {
      var getDistance = function () {
        return Math.max(0, track.scrollWidth - window.innerWidth);
      };
      gsap.to(track, {
        x: function () { return -getDistance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: function () { return '+=' + getDistance(); },
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
    }

    ScrollTrigger.refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
  });
})();
