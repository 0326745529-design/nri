/* ═══════════════════════════════════════════════════════════════
   NRI International — catalog page (static site)
   Category filters + live search over the embedded product data.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Render embedded product data, or wait for the optional Supabase catalog. */
  window.NRI_BOOT.ready(function () {

  var D = window.NRIINT_DATA || {};
  var products = (D.products || []).filter(function (p) { return p && p.name; });
  var grid = document.getElementById('catalog-grid');
  var filterBar = document.getElementById('filter-bar');
  var search = document.getElementById('catalog-search');
  if (grid && window.NRI_BOOT.dbFailed()) {
    grid.innerHTML = window.NRI_BOOT.errorHtml();
    if (filterBar) filterBar.innerHTML = '';
    if (search) { search.disabled = true; search.style.display = 'none'; }
    return;
  }
  if (!grid || !products.length) return;

  var activeCat = 'all';
  var query = '';

  var categories = ['all'].concat(
    products
      .map(function (p) { return p.category || 'Accessories'; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; })
  );

  filterBar.innerHTML = categories.map(function (c, i) {
    return '<button class="chip' + (i === 0 ? ' active' : '') + '" data-cat="' + c + '">' +
      (c === 'all' ? 'All products' : c) + '</button>';
  }).join('');

  filterBar.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cat]');
    if (!btn) return;
    activeCat = btn.getAttribute('data-cat');
    filterBar.querySelectorAll('.chip').forEach(function (ch) {
      ch.classList.toggle('active', ch === btn);
    });
    render();
  });

  if (search) {
    search.addEventListener('input', function () {
      query = search.value.trim().toLowerCase();
      render();
    });
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function fact(p, re) {
    var hit = (p.specs || []).filter(function (s) { return re.test(s && s.label || ''); })[0];
    return hit ? String(hit.value) : '';
  }
  function card(p) {
    var moq = fact(p, /moq|minimum/i), lead = fact(p, /lead/i);
    var meta = (moq ? '<li><b>MOQ</b> ' + esc(moq) + '</li>' : '') + (lead ? '<li><b>Lead time</b> ' + esc(lead) + '</li>' : '');
    return (
      '<article class="product-card">' +
        '<a class="thumb" href="product.html?slug=' + encodeURIComponent(p.slug) + '" tabindex="-1" aria-hidden="true">' +
          '<img src="' + esc(window.NRI_BOOT.image(p.image) || 'images/products/woven-labels.webp') + '" alt="' + esc(p.name) + ' — NRI International" loading="lazy">' +
          '<span class="cat-chip">' + esc(p.category || 'Accessories') + '</span>' +
        '</a>' +
        '<div class="body">' +
          '<h3>' + esc(p.name) + '</h3>' +
          '<p>' + esc(p.tagline) + '</p>' +
          (meta ? '<ul class="card-meta">' + meta + '</ul>' : '') +
          '<a class="link" href="product.html?slug=' + encodeURIComponent(p.slug) + '">View details <i data-lucide="arrow-up-right"></i></a>' +
        '</div>' +
      '</article>'
    );
  }

  function render() {
    var list = products.filter(function (p) {
      var catOk = activeCat === 'all' || (p.category || 'Accessories') === activeCat;
      var q = (p.name + ' ' + p.tagline + ' ' + (p.description || '')).toLowerCase();
      return catOk && (!query || q.indexOf(query) !== -1);
    });
    grid.innerHTML = list.length
      ? list.map(card).join('')
      : '<p class="empty-note">No products match your search. Try a different term or category.</p>';
    document.dispatchEvent(new CustomEvent('nriint:content-rendered'));
  }

  render();
  });
})();
