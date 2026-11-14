/* Supabase public-data boot layer. Telegram chat uses the Edge Functions API. */
(function () {
  'use strict';

  var CFG = window.NRI_CONFIG || {};
  var SB = null;
  var state = { ready: false, live: false, dbFailed: false, fns: [], error: null };

  function flush() {
    if (state.ready) return;
    state.ready = true;
    /* No live database data (not configured, unreachable, error, or empty) -> flag it so
       the pages show "Contact Developer · Error 404" instead of built-in sample content. */
    if (!state.live) state.dbFailed = true;
    var pending = state.fns.splice(0);
    pending.forEach(function (fn) { fn(state.live); });
  }

  if (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase && window.supabase.createClient) {
    SB = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    window.NRI_SUPABASE = SB;
  }

  window.NRI_BOOT = {
    ready: function (fn) {
      if (state.ready) fn(state.live);
      else state.fns.push(fn);
    },
    isConfigured: function () { return false; },
    isSupabaseConfigured: function () { return !!SB; },
    supabase: function () { return SB; },
    isLive: function () { return state.live; },
    dbFailed: function () { return !!state.dbFailed; },
    errorHtml: function () {
      return '<div class="db-error" role="alert">' +
        '<p class="db-error-code">Error 404</p>' +
        '<h2 class="db-error-title">Contact Developer</h2>' +
        '<p class="db-error-text">We could not load this content right now.</p>' +
        '</div>';
    },
    post: function (payload, cb) {
      if (SB && payload && payload.action === 'inquiry.create') {
        var q = payload.inquiry || payload;
        SB.from('inquiries')
          .insert({
            name: q.name,
            email: q.email,
            phone: q.phone || '',
            subject: q.subject || '',
            message: q.message
          })
          .then(function (result) {
            // No .select(): visitors may insert inquiries but must not read them back (RLS).
            if (cb) cb(result.error
              ? { ok: false, error: result.error.message }
              : { ok: true });
          })
          .catch(function (error) {
            if (cb) cb({ ok: false, error: String(error.message || error) });
          });
        return;
      }
      if (cb) cb({ ok: false, error: 'This endpoint is not configured.' });
    },
    get: function (_params, cb) {
      if (cb) cb({ ok: false, error: 'This endpoint is not configured.' });
    },
    image: function (src) {
      var value = String(src || '').trim();
      var match = value.match(/drive\.google\.com\/file\/d\/([^/&#?]+)/) ||
        value.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
      if (match && /drive\.google\.com/.test(value)) {
        return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w1200';
      }
      return value;
    },
    state: state
  };

  if (!SB) {
    flush();
    return;
  }

  var safetyTimer = setTimeout(flush, 4500);

  /* Delivery / lead time is fixed site-wide at 7 – 10 days — applied to every
     product (embedded or Supabase-managed) so the catalog always shows it. */
  var LEAD_TIME = '7 – 10 days';
  function enforceLeadTime(product) {
    if (!product || !Array.isArray(product.specs)) return;
    var spec = product.specs.filter(function (s) { return s && /lead\s*time/i.test(String(s.label)); })[0];
    if (spec) spec.value = LEAD_TIME;
    else product.specs.push({ label: 'Lead Time', value: LEAD_TIME });
  }

  /* Saved detail-page text (Admin → Products → Detail page) may still carry an
     older lead-time range — rewrite every "X – Y day(s)" mention that sits in a
     lead-time sentence so the site always states 7 – 10 days. */
  function syncLeadText(value) {
    if (Array.isArray(value)) return value.map(syncLeadText);
    if (value && typeof value === 'object') {
      Object.keys(value).forEach(function (k) { value[k] = syncLeadText(value[k]); });
      return value;
    }
    if (typeof value !== 'string' || !/lead/i.test(value)) return value;
    return value
      /* "12 – 20 day lead time" (range before the words) */
      .replace(/(\d+)\s*[–—-]\s*(\d+)\s+(days?)\s+lead\s*time/gi, function (m, a, b, unit) { return '7 – 10 ' + unit + ' lead time'; })
      /* "Lead time 12 – 20 days" (range after the words) */
      .replace(/\b(lead\s*time\b[^.!?]{0,32}?)\b\d+\s*[–—-]\s*\d+\s+(days?)\b/gi, function (m, p1, unit) { return p1 + '7 – 10 ' + unit; })
      /* "lead time of 12 days" / "Lead time: 18 days" (single value) */
      .replace(/\b(lead\s*time\b(?:\s*(?:of|:|is|about)\s*)?)\d+\s+(days?)\b/gi, function (m, p1, unit) { return p1 + '7 – 10 ' + unit; });
  }

  /* Legal company name is "NRI International Ltd". Text saved in the database (products,
     about/contact/chat content, bios…) may still say "NRI International" — rewrite it on load.
     URLs / file paths are left untouched. */
  function syncCompanyName(value) {
    if (Array.isArray(value)) return value.map(syncCompanyName);
    if (value && typeof value === 'object') {
      Object.keys(value).forEach(function (k) { value[k] = syncCompanyName(value[k]); });
      return value;
    }
    if (typeof value !== 'string' || /^\s*(https?:|data:|\/|\.{0,2}\/|images\/)/i.test(value)) return value;
    return value
      .replace(/NRI International(?! Ltd)/g, 'NRI International Ltd')
      .replace(/NRI INTERNATIONAL(?! LTD)/g, 'NRI INTERNATIONAL LTD');
  }

  var productsReq = SB.from('products')
    .select('id,name,slug,category,tagline,description,image,machine,specs,sort')
    .eq('is_published', true)
    .order('sort', { ascending: true })
    .then(function (result) {
      if (result.error) {
        state.error = result.error.message;
        console.error('Unable to load published products from Supabase:', result.error.message);
      } else if (Array.isArray(result.data) && result.data.length) {
        result.data.forEach(enforceLeadTime);
        syncCompanyName(result.data);
        window.NRIINT_DATA = window.NRIINT_DATA || {};
        window.NRIINT_DATA.products = result.data;
        state.live = true;
      }
    })
    .catch(function (error) {
      state.error = String(error.message || error);
      console.error('Unable to load published products from Supabase:', error);
    });

  // Editable website content (Admin → Website content). Failure is harmless.
  var contentReq = SB.from('site_content')
    .select('section,payload')
    .in('section', ['contact', 'chat', 'about', 'media', 'productpages'])
    .then(function (result) {
      if (result.error || !Array.isArray(result.data)) return;
      var site = { contact: {}, chat: {}, about: { directors: [], certificates: [] }, media: {}, productpages: {} };
      result.data.forEach(function (row) { site[row.section] = row.payload || {}; });
      site.productPages = (site.productpages && site.productpages.pages) || {};
      syncLeadText(site.productPages);
      syncCompanyName(site);
      window.NRI_SITE = site;
      window.NRIINT_DATA = window.NRIINT_DATA || {};
      var contact = window.NRIINT_DATA.contact = window.NRIINT_DATA.contact || {};
      ['email', 'address', 'hours', 'mobile'].forEach(function (key) {
        if (site.contact[key]) contact[key] = site.contact[key];
      });
    })
    .catch(function () { /* keep built-in content */ });

  Promise.all([productsReq, contentReq]).then(function () {
    clearTimeout(safetyTimer);
    flush();
  });
})();
