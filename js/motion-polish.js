/* NRIINT motion polish layer — progressive enhancement for the existing static site. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap) return;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  if (ST) gsap.registerPlugin(ST);

  function initIntro() {
    var intro = document.getElementById('intro');
    if (!intro || intro.classList.contains('done')) return;
    var logo = intro.querySelector('.intro-logo');
    var word = intro.querySelector('.intro-word');
    var hint = intro.querySelector('.intro-hint');
    if (!logo) return;
    gsap.set([logo, word], { willChange: 'transform, opacity, filter' });
    gsap.fromTo(logo, { autoAlpha: 0, scale: .88, y: 18, filter: 'blur(8px)' }, {
      autoAlpha: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 1.35,
      ease: 'power3.out', delay: .18, clearProps: 'filter'
    });
    if (word) gsap.fromTo(word, { autoAlpha: 0, y: 12, letterSpacing: '.65em' }, {
      autoAlpha: 1, y: 0, letterSpacing: '.42em', duration: 1, delay: .48, ease: 'power3.out'
    });
    if (hint) gsap.fromTo(hint, { autoAlpha: 0, y: 12 }, {
      autoAlpha: 1, y: 0, duration: .8, delay: .9, ease: 'power2.out'
    });
  }

  function initPageMotion() {
    if (!ST) return;
    var ctx = gsap.context(function () {
      gsap.utils.toArray('.hero-bg img').forEach(function (img) {
        gsap.fromTo(img, { scale: 1.12 }, { scale: 1.025, ease: 'none',
          scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.4 } });
      });
      gsap.utils.toArray('.reveal').forEach(function (el) {
        if (el.classList.contains('in')) return;
        gsap.fromTo(el, { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .95,
          ease: 'power3.out', clearProps: 'transform,opacity,visibility',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      });
      gsap.utils.toArray('.product-card, .showcase-card').forEach(function (card) {
        card.addEventListener('pointerenter', function () {
          gsap.to(card, { y: -5, duration: .38, ease: 'power2.out', overwrite: 'auto' });
        });
        card.addEventListener('pointerleave', function () {
          gsap.to(card, { y: 0, duration: .5, ease: 'power3.out', overwrite: 'auto' });
        });
      });
    });
    window.addEventListener('pagehide', function () { ctx.revert(); }, { once: true });
    window.addEventListener('load', function () { ST.refresh(); }, { once: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { initIntro(); initPageMotion(); });
  else { initIntro(); initPageMotion(); }
})();
