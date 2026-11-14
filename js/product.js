/* ═══════════════════════════════════════════════════════════════
   NRI International — product detail page (static site)
   Renders ?slug=… with a rich, section-by-section layout:
   hero → quick facts → variants (alternating) → common attributes
   → highlights → stat band → more products.
   Content order of precedence for the detail sections:
     1. what you saved in Admin → Products → "Detail page"  (NRI_SITE.productPages[slug])
     2. built-in defaults in js/product-defaults.js          (NRI_PRODUCT_PAGES[slug])
   Every value is HTML-escaped before it is placed on the page.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  window.NRI_BOOT.ready(function () {

  var D = window.NRIINT_DATA || {};
  var products = (D.products || []).filter(function (p) { return p && p.name; });
  var root = document.getElementById('product-detail');
  if (root && window.NRI_BOOT.dbFailed()) {
    root.innerHTML = window.NRI_BOOT.errorHtml();
    return;
  }
  if (!root || !products.length) return;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function img(src, fallback) {
    var v = window.NRI_BOOT.image(src) || fallback || 'images/products/woven-labels.webp';
    return esc(v);
  }
  function arr(v) { return Array.isArray(v) ? v.filter(function (x) { return x; }) : []; }

  var slug = new URLSearchParams(window.location.search).get('slug') || '';
  var p = products.filter(function (x) { return x.slug === slug; })[0] || products[0];

  var site = window.NRI_SITE || {};
  var saved = (site.productPages && site.productPages[p.slug]) || null;
  var base = (window.NRI_PRODUCT_PAGES && window.NRI_PRODUCT_PAGES[p.slug]) || {};
  var d = saved || base || {};
  var variants = arr(d.variants);
  var common = d.common && arr(d.common.items).length ? d.common : null;
  var highlights = arr(d.highlights).slice(0, 3);

  /* Gallery: product photo + admin/default gallery images + the production-line photo (deduplicated). */
  var gallery = [];
  function addShot(src, caption) {
    if (!src) return;
    var key = String(src);
    if (gallery.some(function (g) { return g.src === key; })) return;
    gallery.push({ src: key, caption: caption || '' });
  }
  addShot(p.image, p.name);
  var galleryList = saved && Object.prototype.hasOwnProperty.call(saved, 'gallery') ? saved.gallery : (base.gallery || d.gallery);
  arr(galleryList).forEach(function (g) { if (g) addShot(typeof g === 'string' ? g : g.image, typeof g === 'string' ? '' : g.caption); });
  addShot(p.machine, 'The production line behind ' + p.name);

  document.title = p.name + ' — NRI International Ltd (NRIINT)';
  var metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', (d.statement || p.tagline || '') + ' ' + p.name + ' supplied and exported by NRI International Ltd, Dhaka, Bangladesh.');

  var specs = arr(p.specs);
  function spec(re) {
    var hit = specs.filter(function (s) { return re.test(s.label || ''); })[0];
    return hit ? hit.value : '';
  }
  var facts = [
    ['MOQ', spec(/moq|minimum/i)],
    ['Lead time', spec(/lead/i)],
    ['Colors', spec(/colou?r/i)]
  ].filter(function (f) { return f[1]; });

  var quote = 'contact.html?subject=' + encodeURIComponent(p.name + ' inquiry');
  var heroImg = d.banner || p.image;

  /* ── Hero ─────────────────────────────────────────────── */
  var html =
    '<div class="pp">' +
    '<nav class="pp-crumbs" aria-label="Breadcrumb">' +
      '<a href="index.html">Home</a><span>/</span>' +
      '<a href="products.html">Products</a><span>/</span>' +
      '<span aria-current="page">' + esc(p.name) + '</span>' +
    '</nav>' +
    '<header class="pp-hero">' +
      '<div class="pp-hero-text">' +
        '<p class="pp-kicker">' + esc(p.category || 'Accessories') + '</p>' +
        '<h1>' + esc(p.name) + '</h1>' +
        '<p class="pp-statement">' + esc(d.statement || p.tagline) + '</p>' +
        '<p class="pp-desc">' + esc(p.description) + '</p>' +
        '<div class="pp-actions">' +
          '<a class="pp-btn pp-btn-primary" href="' + quote + '">Request a quote</a>' +
          '<a class="pp-btn pp-btn-ghost" href="#pp-specs">Specifications</a>' +
        '</div>' +
      '</div>' +
      '<div class="pp-hero-media">' +
        '<img src="' + img(heroImg) + '" alt="' + esc(p.name) + ' — garment accessories by NRI International Ltd">' +
      '</div>' +
    '</header>';

  if (facts.length) {
    html += '<ul class="pp-facts">' + facts.map(function (f) {
      return '<li><span>' + esc(f[0]) + '</span><strong>' + esc(f[1]) + '</strong></li>';
    }).join('') + '</ul>';
  }

  /* ── Variants ─────────────────────────────────────────── */
  if (variants.length) {
    /* Photos are only shown next to a type when one was chosen for it; otherwise the types are
       shown as clean text cards (so a type is never paired with an unrelated picture). */
    var withPhotos = variants.some(function (v) { return v.image; });
    html += '<section class="pp-section"><p class="pp-kicker">Types &amp; options</p>' +
      '<h2>Choose the right ' + esc(p.name.toLowerCase()) + '</h2>' +
      '<div class="pp-variants' + (withPhotos ? '' : ' cards') + '">' +
      variants.map(function (v, i) {
        var apps = arr(v.applications);
        var attrs = arr(v.attributes);
        return '<article class="pp-variant' + (withPhotos ? (i % 2 ? ' flip' : '') : ' card') + '">' +
          (withPhotos ? '<div class="pp-variant-media"><img src="' + img(v.image, p.image) + '" alt="' + esc(v.name) + '" loading="lazy"></div>' : '') +
          '<div class="pp-variant-body">' +
            (withPhotos ? '' : '<span class="pp-num">0' + (i + 1) + '</span>') +
            '<h3>' + esc(v.name) + '</h3>' +
            (v.text ? '<p>' + esc(v.text) + '</p>' : '') +
            (apps.length ? '<h4>Applications</h4><ul class="pp-chips">' + apps.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' : '') +
            (attrs.length ? '<h4>Key attributes</h4><ul class="pp-list">' + attrs.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' : '') +
            '<a class="pp-link" href="' + quote + '">Ask about ' + esc(v.name) + ' &rarr;</a>' +
          '</div>' +
        '</article>';
      }).join('') +
      '</div></section>';
  }

  /* ── Common attributes + specs table ──────────────────── */
  html += '<section class="pp-section pp-two" id="pp-specs">';
  if (common) {
    html += '<div class="pp-card"><h3>' + esc(common.title || 'Applicable to all options') + '</h3><ul class="pp-list">' +
      common.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>';
  }
  if (specs.length) {
    html += '<div class="pp-card"><h3>Specifications</h3><table class="pp-table"><tbody>' +
      specs.map(function (s) { return '<tr><th scope="row">' + esc(s.label) + '</th><td>' + esc(s.value) + '</td></tr>'; }).join('') +
      '</tbody></table></div>';
  }
  html += '</section>';

  /* ── Highlights ───────────────────────────────────────── */
  if (highlights.length) {
    html += '<section class="pp-section"><div class="pp-highlights">' +
      highlights.map(function (h, i) {
        return '<div class="pp-highlight"><span class="pp-num">0' + (i + 1) + '</span><h3>' + esc(h.title) + '</h3><p>' + esc(h.text) + '</p></div>';
      }).join('') + '</div></section>';
  }

  /* ── Stat band ────────────────────────────────────────── */
  if (d.stat) {
    html += '<section class="pp-stat"><p>' + esc(d.stat) + '</p><a class="pp-btn pp-btn-primary" href="' + quote + '">Request a quote</a></section>';
  }

  /* ── Gallery ──────────────────────────────────────────── */
  if (gallery.length > 1) {
    html += '<section class="pp-section"><p class="pp-kicker">Gallery</p><h2>' + esc(p.name) + ' in detail</h2>' +
      '<div class="pp-gallery count-' + Math.min(gallery.length, 6) + '">' + gallery.map(function (g, i) {
        return '<button type="button" class="pp-shot" data-i="' + i + '" aria-label="Open photo ' + (i + 1) + ': ' + esc(g.caption || p.name) + '">' +
          '<img src="' + img(g.src) + '" alt="' + esc(g.caption || p.name) + '" loading="lazy">' +
          (g.caption ? '<span>' + esc(g.caption) + '</span>' : '') + '</button>';
      }).join('') + '</div></section>';
  }

  /* ── Related ──────────────────────────────────────────── */
  var related = products.filter(function (x) { return x.slug !== p.slug && x.category === p.category; }).slice(0, 3);
  if (!related.length) related = products.filter(function (x) { return x.slug !== p.slug; }).slice(0, 3);
  if (related.length) {
    html += '<section class="pp-section"><p class="pp-kicker">Continue exploring</p><h2>More from the line</h2>' +
      '<div class="pp-related">' + related.map(function (r) {
        return '<a class="pp-rcard" href="product.html?slug=' + encodeURIComponent(r.slug) + '">' +
          '<img src="' + img(r.image) + '" alt="' + esc(r.name) + '" loading="lazy">' +
          '<div><h3>' + esc(r.name) + '</h3><p>' + esc(r.tagline) + '</p><span>View details &rarr;</span></div></a>';
      }).join('') + '</div></section>';
  }

  html += '</div>';
  root.innerHTML = html;

  /* Lightbox */
  var box = null, cur = 0;
  function show(i) {
    cur = (i + gallery.length) % gallery.length;
    box.querySelector('img').src = window.NRI_BOOT.image(gallery[cur].src) || gallery[cur].src;
    box.querySelector('img').alt = gallery[cur].caption || p.name;
    box.querySelector('figcaption').textContent = gallery[cur].caption || p.name;
  }
  function close() { if (box) { box.remove(); box = null; document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; } }
  function onKey(e) { if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') show(cur + 1); else if (e.key === 'ArrowLeft') show(cur - 1); }
  function open(i) {
    close();
    box = document.createElement('div'); box.className = 'pp-lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', p.name + ' photo gallery');
    box.innerHTML = '<button type="button" class="pp-lb-close" aria-label="Close">&times;</button><button type="button" class="pp-lb-nav prev" aria-label="Previous photo">&lsaquo;</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="pp-lb-nav next" aria-label="Next photo">&rsaquo;</button>';
    box.addEventListener('click', function (e) {
      if (e.target.closest('.pp-lb-close') || e.target === box) close();
      else if (e.target.closest('.prev')) show(cur - 1);
      else if (e.target.closest('.next')) show(cur + 1);
    });
    document.body.appendChild(box); document.body.style.overflow = 'hidden'; document.addEventListener('keydown', onKey); show(i);
    box.querySelector('.pp-lb-close').focus();
  }
  Array.prototype.forEach.call(root.querySelectorAll('.pp-shot'), function (b) {
    b.addEventListener('click', function () { open(parseInt(b.getAttribute('data-i'), 10) || 0); });
  });

  if (window.lucide && window.lucide.createIcons) { try { window.lucide.createIcons(); } catch (e) {} }
  document.dispatchEvent(new CustomEvent('nriint:content-rendered'));
  });
})();
