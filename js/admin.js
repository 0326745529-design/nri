/* NRI International admin dashboard v2 — talks to the Supabase "admin-api" Edge Function. */
(function () {
  'use strict';

  var CFG = window.NRI_CONFIG || {};
  var TOKEN_KEY = CFG.ADMIN_TOKEN_KEY || 'nriint-admin-token';
  var API_URL = String(CFG.SUPABASE_URL || '').replace(/\/+$/, '') + '/functions/v1/admin-api';
  var API_KEY = String(CFG.SUPABASE_ANON_KEY || '');

  function $(id) { return document.getElementById(id); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function icons() { try { if (window.lucide && window.lucide.createIcons) window.lucide.createIcons(); } catch (e) { /* ignore */ } }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function imgUrl(p) { return (window.NRI_BOOT && window.NRI_BOOT.image) ? (window.NRI_BOOT.image(p) || '') : (p || ''); }
  function driveImageUrl(value) {
    try {
      var url = new URL(String(value || '').trim());
      if (url.protocol !== 'https:' || url.hostname !== 'drive.google.com') return '';
      var match = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
      var id = match ? match[1] : url.searchParams.get('id');
      return id && /^[A-Za-z0-9_-]{10,}$/.test(id)
        ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w1200'
        : '';
    } catch (error) {
      return '';
    }
  }

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return String(iso || ''); }
  }
  function ago(iso) {
    var t = Date.parse(iso); if (!t) return '';
    var s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return Math.floor(s / 60) + 'm';
    if (s < 86400) return Math.floor(s / 3600) + 'h';
    if (s < 604800) return Math.floor(s / 86400) + 'd';
    return new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  function initials(name) {
    var p = String(name || '?').trim().split(/\s+/);
    return ((p[0] || '?').charAt(0) + (p[1] ? p[1].charAt(0) : '')).toUpperCase();
  }

  /* ── toast / confirm ─────────────────────────────────────── */
  var toastTimer = null;
  function toast(msg, isErr) {
    var t = $('adm-toast');
    $('adm-toast-msg').textContent = msg;
    t.classList.toggle('err', !!isErr);
    t.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, isErr ? 5200 : 3200);
  }
  function confirmDialog(title, text, yesLabel) {
    return new Promise(function (resolve) {
      $('adm-confirm-title').textContent = title;
      $('adm-confirm-text').textContent = text || '';
      $('adm-confirm-yes').textContent = yesLabel || 'Delete';
      var box = $('adm-confirm');
      box.hidden = false;
      function done(v) { box.hidden = true; $('adm-confirm-yes').onclick = null; $('adm-confirm-no').onclick = null; resolve(v); }
      $('adm-confirm-yes').onclick = function () { done(true); };
      $('adm-confirm-no').onclick = function () { done(false); };
    });
  }

  /* ── state & API ─────────────────────────────────────────── */
  var state = {
    token: '', products: [], inquiries: [], threads: [], activeThread: null, activeMeta: null,
    range: 7, tab: 'dash', canned: [], chatFilter: 'all', inqFilter: 'all', selected: {},
    lastUnreadChats: null, lastUnreadInq: null, sound: lsGet('nriint-admin-sound', '1') === '1',
    stats: null, threadSig: '', msgSig: '', diagRan: false, editingId: null,
    about: { directors: [], certificates: [] }
  };
  function getToken() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setToken(t) { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ } }

  function post(payload, cb) {
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': 'Bearer ' + API_KEY },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().catch(function () { return null; });
    }).then(function (data) {
      if (!data || typeof data.ok !== 'boolean') {
        data = { ok: false, error: (data && (data.message || data.msg)) || 'The admin service did not answer correctly. Check that the admin-api function is deployed with JWT verification OFF.' };
      }
      cb(data);
    }).catch(function () {
      cb({ ok: false, error: 'Could not reach the admin service. Check your internet connection and that the admin-api function is deployed.' });
    });
  }
  function api(action, payload, cb) {
    post(Object.assign({ action: action, token: state.token }, payload || {}), cb || function () {});
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-drive-apply]');
    if (!button) return;
    var input = button.parentElement.querySelector('[data-drive-url]');
    var target = $(button.dataset.driveApply);
    var imageUrl = driveImageUrl(input && input.value);
    if (!imageUrl) {
      toast('Enter a valid Google Drive sharing URL for a file, and allow “Anyone with the link” to view it.', true);
      return;
    }
    target.value = imageUrl;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    input.value = '';
    toast('Google Drive image link added. Check the preview before saving.');
  });
  // Shrinks big photos in the browser (max 1600 px, WebP) so uploads are small and fast.
  function shrinkImage(file, cb) {
    if (file.type === 'image/gif' || !window.createImageBitmap) { cb(file); return; }
    window.createImageBitmap(file).then(function (bmp) {
      var scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      if (scale === 1 && file.size < 400 * 1024) { cb(file); return; }
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
      canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function (blob) { cb(blob && blob.size < file.size ? blob : file); }, 'image/webp', 0.86);
    }).catch(function () { cb(file); });
  }
  function uploadImage(file, done) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      toast('Choose a JPG, PNG, WebP or GIF image.', true);
      done(null);
      return;
    }
    toast('Uploading image…');
    shrinkImage(file, function (ready) {
      if (ready.size > 5 * 1024 * 1024) { toast('Image is still over 5 MB — choose a smaller one.', true); done(null); return; }
      var reader = new FileReader();
      reader.onload = function () {
        var encoded = String(reader.result || '').split(',')[1] || '';
        api('admin.media.upload', { fileName: file.name, mimeType: ready.type || file.type, data: encoded }, function (res) {
          if (!res || !res.ok) { handleErr(res); done(null); return; }
          done(res.data.url);
          toast('Image uploaded.');
        });
      };
      reader.onerror = function () { toast('Could not read the selected image.', true); done(null); };
      reader.readAsDataURL(ready);
    });
  }
  function bindImageUploads(root) {
    qsa('[data-image-target]', root).forEach(function (input) {
      input.addEventListener('change', function () {
        var target = $(input.dataset.imageTarget);
        if (!input.files || !input.files[0] || !target) return;
        input.disabled = true;
        uploadImage(input.files[0], function (url) {
          if (url) {
            target.value = url;
            target.dispatchEvent(new Event('input', { bubbles: true }));
          }
          input.value = '';
          input.disabled = false;
        });
      });
    });
  }
  function notAuth(res) { return /Not authorized/i.test((res && res.error) || ''); }
  function handleErr(res) {
    var msg = (res && res.error) || 'Something went wrong.';
    if (notAuth(res)) {
      setToken(''); state.token = '';
      toast('Session expired — please sign in again.', true);
      setTimeout(function () { location.reload(); }, 1200);
      return;
    }
    toast(msg, true);
  }

  var loginWrap = $('adm-login'), dash = $('adm-dash');
  if (!CFG.SUPABASE_URL || !API_KEY) {
    loginWrap.querySelector('.login-card').innerHTML = '<h1>Setup required</h1><p>Set SUPABASE_URL and SUPABASE_ANON_KEY in js/config.js to enable the admin dashboard.</p>';
    return;
  }

  /* ═══ THEME / SOUND / MOBILE NAV ═══════════════════════════ */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    lsSet('nriint-admin-theme', t);
    $('adm-theme').innerHTML = '<i data-lucide="' + (t === 'dark' ? 'sun' : 'moon') + '"></i><span>' + (t === 'dark' ? 'Light mode' : 'Dark mode') + '</span>';
    icons();
  }
  $('adm-theme').addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
  $('adm-sound').setAttribute('aria-pressed', state.sound ? 'true' : 'false');
  $('adm-sound').addEventListener('click', function () {
    state.sound = !state.sound; lsSet('nriint-admin-sound', state.sound ? '1' : '0');
    $('adm-sound').setAttribute('aria-pressed', state.sound ? 'true' : 'false');
    if (state.sound) ding();
    toast(state.sound ? 'Chat sound on' : 'Chat sound off');
  });
  function ding() {
    var C = window.AudioContext || window.webkitAudioContext; if (!C || !state.sound) return;
    try {
      var c = new C(), o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = 880; g.gain.setValueAtTime(0.001, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, c.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.45);
      c.resume().then(function () { setTimeout(function () { c.close(); }, 700); }).catch(function () {});
    } catch (e) { /* sound is optional */ }
  }
  function openSide(open) { $('adm-side').classList.toggle('open', open); $('adm-scrim').hidden = !open; }
  $('adm-burger').addEventListener('click', function () { openSide(true); });
  $('adm-scrim').addEventListener('click', function () { openSide(false); });

  /* ═══ LOGIN ════════════════════════════════════════════════ */
  $('adm-pass-eye').addEventListener('click', function () {
    var i = $('adm-pass'); i.type = i.type === 'password' ? 'text' : 'password';
  });
  $('adm-login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('adm-login-btn');
    btn.disabled = true; btn.textContent = 'Checking…';
    post({ action: 'admin.login', password: $('adm-pass').value }, function (res) {
      btn.disabled = false; btn.textContent = 'Sign in';
      if (!res || !res.ok) {
        $('adm-login-err').textContent = (res && res.error) || 'Incorrect password — please try again';
        $('adm-login-err').hidden = false;
        return;
      }
      $('adm-login-err').hidden = true;
      setToken(res.data.token);
      enterDash();
    });
  });
  $('adm-logout').addEventListener('click', function () { setToken(''); location.reload(); });

  var entered = false;
  function enterDash() {
    if (entered) return; entered = true;
    state.token = getToken();
    loginWrap.hidden = true;
    dash.hidden = false;
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
    setConn('ok', '● connected');
    var start = (location.hash || '').replace('#', '');
    switchTab(['dash', 'products', 'inquiries', 'chat', 'content', 'certificates', 'settings'].indexOf(start) > -1 ? start : 'dash');
    loadProducts(); loadInquiries(true); loadThreads(true); loadCanned();
    setInterval(background, 12000);
    icons();
  }
  function setConn(cls, text) {
    var c = $('adm-conn'); c.className = 'conn ' + cls; c.textContent = text;
    $('adm-conn-info').textContent = cls === 'ok' ? 'Connected to the Supabase admin-api function.' : 'Backend problem — open Settings → System check.';
  }
  function background() {
    if (document.hidden) return;
    loadInquiries(true); loadThreads(true);
    if (state.tab === 'dash') loadStats();
  }

  /* ═══ NAVIGATION ═══════════════════════════════════════════ */
  var TITLES = { dash: 'Dashboard', products: 'Products', inquiries: 'Inquiries', chat: 'Live chat', content: 'Website content', certificates: 'Company certificates', settings: 'Settings & system' };
  qsa('.nav-item[data-tab]').forEach(function (b) { b.addEventListener('click', function () { switchTab(b.dataset.tab); openSide(false); }); });
  qsa('[data-go]').forEach(function (b) { b.addEventListener('click', function () { switchTab(b.dataset.go); }); });
  function switchTab(name) {
    state.tab = name;
    qsa('.nav-item[data-tab]').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === name); });
    qsa('.pane').forEach(function (p) { p.classList.toggle('active', p.id === 'tab-' + name); });
    $('adm-title').textContent = TITLES[name] || '';
    try { history.replaceState(null, '', '#' + name); } catch (e) { /* ignore */ }
    if (name === 'dash') loadStats();
    if (name === 'products') loadProducts();
    if (name === 'inquiries') loadInquiries();
    if (name === 'chat') { loadThreads(); startThreadPolling(); } else stopThreadPolling();
    if (name === 'content' || name === 'certificates') loadContent();
    if (name === 'settings') { loadTelegram(); loadCanned(true); if (!state.diagRan) { state.diagRan = true; runDiagnostics(); } }
    window.scrollTo(0, 0);
  }
  $('adm-refresh').addEventListener('click', function () {
    var n = state.tab;
    if (n === 'dash') loadStats(); else if (n === 'products') loadProducts(); else if (n === 'inquiries') loadInquiries();
    else if (n === 'chat') { loadThreads(); loadThread(); } else if (n === 'content' || n === 'certificates') loadContent(); else loadTelegram();
    toast('Refreshed');
  });

  function pill(id, count) {
    var el = $(id); if (!el) return;
    el.hidden = !(count > 0); el.textContent = count > 99 ? '99+' : String(count);
  }

  /* ═══ DASHBOARD ════════════════════════════════════════════ */
  qsa('#adm-range button').forEach(function (b) {
    b.addEventListener('click', function () {
      state.range = Number(b.dataset.range);
      qsa('#adm-range button').forEach(function (x) { x.classList.toggle('on', x === b); });
      loadStats();
    });
  });

  function loadStats() {
    api('admin.stats', { range: state.range }, function (res) {
      if (!res || !res.ok) { if (notAuth(res)) handleErr(res); else setConn('bad', '● backend error'); return; }
      setConn('ok', '● connected');
      state.stats = res.data; renderStats(); renderDashLists();
    });
  }
  function renderStats() {
    var d = state.stats; if (!d) return;
    var delta = d.previousViews ? Math.round((d.periodViews - d.previousViews) / d.previousViews * 100) : null;
    var trend = delta === null ? '' : '<em class="trend ' + (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat') + '">' + (delta > 0 ? '+' : '') + delta + '%</em>';
    function card(icon, value, label, cls, extra) {
      return '<div class="stat ' + (cls || '') + '"><div class="stat-top"><span class="stat-ic"><i data-lucide="' + icon + '"></i></span>' + (extra || '') + '</div><b>' + Number(value || 0).toLocaleString() + '</b><span>' + esc(label) + '</span></div>';
    }
    $('adm-stats').innerHTML =
      card('eye', d.periodViews, 'Page views · ' + d.range + ' days', '', trend) +
      card('package', d.publishedProducts, 'Live products (of ' + d.products + ')', 'ok') +
      card('inbox', d.inquiries, 'Total inquiries', 'accent') +
      card('mail-warning', d.unreadInquiries, 'Unread inquiries', d.unreadInquiries > 0 ? 'warn' : '') +
      card('messages-square', d.chatSessions, 'Chat conversations', '') +
      card('message-circle-warning', d.unreadChats, 'Unread chat messages', d.unreadChats > 0 ? 'warn' : '');
    $('adm-chart-sub').textContent = Number(d.periodViews).toLocaleString() + ' views in the last ' + d.range + ' days · ' + Number(d.visits).toLocaleString() + ' all time';
    drawChart(d.days || []);
    barList('adm-toppages', (d.topPages || []).map(function (p) { return { label: p.page, value: p.views }; }), 'No visits recorded yet — they appear as visitors browse the site.');
    barList('adm-countries', (d.countries || []).map(function (c) { return { label: c.country, value: c.chats }; }), 'No chats with location yet.');
    var alerts = [];
    if (d.unreadInquiries > 0) alerts.push('<span>' + d.unreadInquiries + ' new inquir' + (d.unreadInquiries === 1 ? 'y' : 'ies') + '</span><button data-go="inquiries">Open</button>');
    if (d.unreadChats > 0) alerts.push('<span>' + d.unreadChats + ' unread chat message' + (d.unreadChats === 1 ? '' : 's') + '</span><button data-go="chat">Reply</button>');
    var bar = $('adm-alerts'); bar.hidden = !alerts.length; bar.innerHTML = alerts.join('');
    qsa('#adm-alerts [data-go]').forEach(function (b) { b.addEventListener('click', function () { switchTab(b.dataset.go); }); });
    icons();
  }
  function barList(id, rows, emptyText) {
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    $(id).innerHTML = rows.length ? rows.map(function (r) {
      return '<li><div class="row"><span title="' + esc(r.label) + '">' + esc(r.label) + '</span><b>' + r.value + '</b></div><div class="track"><i style="width:' + Math.max(4, Math.round(r.value / max * 100)) + '%"></i></div></li>';
    }).join('') : '<li class="empty">' + esc(emptyText) + '</li>';
  }
  function drawChart(days) {
    if (!days.length) { $('adm-chart').innerHTML = ''; return; }
    var W = 640, H = 230, padL = 30, padB = 26, padT = 12;
    var max = Math.max.apply(null, days.map(function (d) { return d.views; }).concat([4]));
    var step = Math.ceil(max / 4), top = step * 4;
    var bw = (W - padL) / days.length, gap = Math.min(10, bw * 0.28);
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Page views per day">';
    for (var g = 0; g <= 4; g++) {
      var y = padT + (H - padT - padB) * (1 - g / 4);
      svg += '<line class="grid" x1="' + padL + '" x2="' + W + '" y1="' + y + '" y2="' + y + '"/><text x="0" y="' + (y + 4) + '">' + (step * g) + '</text>';
    }
    days.forEach(function (d, i) {
      var h = (H - padT - padB) * d.views / top, x = padL + i * bw + gap / 2, y2 = H - padB - h;
      svg += '<rect class="bar" x="' + x + '" y="' + y2 + '" width="' + Math.max(2, bw - gap) + '" height="' + Math.max(h, d.views ? 2 : 0) + '" rx="4"><title>' + d.day + ': ' + d.views + ' views</title></rect>';
      if (days.length <= 10 || i % 5 === 0 || i === days.length - 1) svg += '<text x="' + (x + (bw - gap) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + String(d.day).slice(5) + '</text>';
    });
    $('adm-chart').innerHTML = svg + '</svg>';
  }
  function renderDashLists() {
    var inq = state.inquiries.slice(0, 5);
    $('adm-latest-inq').innerHTML = inq.length ? inq.map(function (q) {
      return '<div class="mini-item" data-inq-open="' + esc(q.id) + '"><span class="avatar">' + esc(initials(q.name)) + '</span><div><b>' + esc(q.name) + (q.status === 'new' ? ' •' : '') + '</b><small>' + esc(q.subject) + '</small></div><time>' + ago(q.ts) + '</time></div>';
    }).join('') : '<div class="empty">No inquiries yet.</div>';
    var th = state.threads.slice(0, 5);
    $('adm-latest-chat').innerHTML = th.length ? th.map(function (t) {
      return '<div class="mini-item" data-th-open="' + esc(t.sessionId) + '"><span class="avatar">' + esc(initials(t.visitorName)) + '</span><div><b>' + esc(t.ip || t.visitorName) + (t.unread ? ' •' : '') + '</b><small>' + esc(t.last) + '</small></div><time>' + ago(t.lastTs) + '</time></div>';
    }).join('') : '<div class="empty">No conversations yet.</div>';
    qsa('[data-inq-open]').forEach(function (el) { el.addEventListener('click', function () { switchTab('inquiries'); openInquiry(el.dataset.inqOpen); }); });
    qsa('[data-th-open]').forEach(function (el) { el.addEventListener('click', function () { switchTab('chat'); selectThread(el.dataset.thOpen); }); });
  }

  /* ═══ PRODUCTS ═════════════════════════════════════════════ */
  function loadProducts() {
    api('admin.products.list', {}, function (res) {
      if (!res || !res.ok) { handleErr(res); return; }
      state.products = res.data || [];
      renderProducts();
      var local = (window.NRIINT_DATA && window.NRIINT_DATA.products) || [];
      $('adm-import-card').hidden = !(local.length && state.products.length < local.length);
      pill('pill-products', state.products.length);
    });
  }
  function filteredProducts() {
    var q = ($('p-search').value || '').toLowerCase(), cat = $('p-cat').value, st = $('p-status').value;
    return state.products.filter(function (p) {
      if (cat && p.category !== cat) return false;
      if (st === 'live' && !p.is_published) return false;
      if (st === 'hidden' && p.is_published) return false;
      return !q || (p.name + ' ' + p.category + ' ' + p.tagline).toLowerCase().indexOf(q) > -1;
    });
  }
  function renderProducts() {
    var cats = {};
    state.products.forEach(function (p) { if (p.category) cats[p.category] = 1; });
    var current = $('p-cat').value;
    $('p-cat').innerHTML = '<option value="">All categories</option>' + Object.keys(cats).sort().map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
    $('p-cat').value = cats[current] ? current : '';
    $('pf-cat-list').innerHTML = Object.keys(cats).map(function (c) { return '<option value="' + esc(c) + '">'; }).join('');

    var rows = filteredProducts();
    var canReorder = rows.length === state.products.length;
    $('adm-ptable').querySelector('tbody').innerHTML = rows.map(function (p, i) {
      return '<tr>' +
        '<td><div class="order-btns">' +
          '<button data-up="' + esc(p.id) + '" title="Move up"' + (!canReorder || i === 0 ? ' disabled' : '') + '><i data-lucide="chevron-up"></i></button>' +
          '<button data-down="' + esc(p.id) + '" title="Move down"' + (!canReorder || i === rows.length - 1 ? ' disabled' : '') + '><i data-lucide="chevron-down"></i></button></div></td>' +
        '<td><div class="prod"><img src="' + esc(imgUrl(p.image) || 'images/products/woven-labels.webp') + '" alt="" onerror="this.style.opacity=.25"><span><b>' + esc(p.name) + '</b><small>' + esc(p.tagline || '') + '</small></span></div></td>' +
        '<td>' + esc(p.category || '—') + '</td>' +
        '<td><label class="switch" title="' + (p.is_published ? 'Visible' : 'Hidden') + '"><input type="checkbox" data-pub="' + esc(p.id) + '"' + (p.is_published ? ' checked' : '') + '><i></i></label></td>' +
        '<td><div class="row-actions">' +
          '<button class="icon-btn" title="Edit" data-edit="' + esc(p.id) + '"><i data-lucide="pencil"></i></button>' +
          '<button class="icon-btn" title="Duplicate" data-dup="' + esc(p.id) + '"><i data-lucide="copy"></i></button>' +
          '<button class="icon-btn danger" title="Delete" data-del="' + esc(p.id) + '"><i data-lucide="trash-2"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="5" class="empty">No products found.</td></tr>';
    $('p-hint').textContent = state.products.length ? state.products.filter(function (p) { return p.is_published; }).length + ' of ' + state.products.length + ' products are visible on the website. Use the arrows to change the order (when no filter is active).' : '';
    icons();

    qsa('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { openProduct(b.dataset.edit); }); });
    qsa('[data-dup]').forEach(function (b) { b.addEventListener('click', function () {
      api('admin.products.duplicate', { id: b.dataset.dup }, function (res) {
        if (!res || !res.ok) { handleErr(res); return; }
        toast('Duplicated as a hidden product — edit and publish it.'); loadProducts();
      });
    }); });
    qsa('[data-del]').forEach(function (b) { b.addEventListener('click', function () {
      confirmDialog('Delete this product?', 'It disappears from the website immediately. This cannot be undone.').then(function (yes) {
        if (!yes) return;
        api('admin.products.delete', { id: b.dataset.del }, function (res) {
          if (!res || !res.ok) { handleErr(res); return; }
          toast('Product deleted.'); loadProducts();
        });
      });
    }); });
    qsa('[data-pub]').forEach(function (b) { b.addEventListener('change', function () {
      api('admin.products.toggle', { id: b.dataset.pub, published: b.checked }, function (res) {
        if (!res || !res.ok) { handleErr(res); b.checked = !b.checked; return; }
        toast(b.checked ? 'Product is now visible.' : 'Product hidden from the website.'); loadProducts();
      });
    }); });
    function move(id, dir) {
      var ids = state.products.map(function (p) { return p.id; }), i = ids.indexOf(id), j = i + dir;
      if (i < 0 || j < 0 || j >= ids.length) return;
      ids.splice(j, 0, ids.splice(i, 1)[0]);
      api('admin.products.reorder', { ids: ids }, function (res) { if (!res || !res.ok) { handleErr(res); return; } loadProducts(); });
    }
    qsa('[data-up]').forEach(function (b) { b.addEventListener('click', function () { move(b.dataset.up, -1); }); });
    qsa('[data-down]').forEach(function (b) { b.addEventListener('click', function () { move(b.dataset.down, 1); }); });
  }
  ['p-search', 'p-cat', 'p-status'].forEach(function (id) { $(id).addEventListener('input', renderProducts); });

  $('adm-import-btn').addEventListener('click', function () {
    var local = (window.NRIINT_DATA && window.NRIINT_DATA.products) || [];
    if (!local.length) { toast('No website products found to import.', true); return; }
    var btn = $('adm-import-btn'); btn.disabled = true; btn.textContent = 'Importing…';
    api('admin.products.import', { products: local }, function (res) {
      btn.disabled = false; btn.textContent = 'Import website products';
      if (!res || !res.ok) { handleErr(res); return; }
      toast('Imported ' + res.data.imported + ' product(s)' + (res.data.skipped ? ', ' + res.data.skipped + ' already existed.' : '.'));
      loadProducts();
    });
  });

  $('p-export').addEventListener('click', function () {
    downloadCsv('nri-products.csv', [['Name', 'Slug', 'Category', 'Tagline', 'Visible', 'Order', 'Image']].concat(state.products.map(function (p) {
      return [p.name, p.slug, p.category, p.tagline, p.is_published ? 'yes' : 'no', p.sort, p.image];
    })));
  });

  /* product drawer */
  function addSpecRow(label, value) {
    var row = document.createElement('div');
    row.className = 'spec-row';
    row.innerHTML = '<input type="text" class="spec-label" placeholder="Label (e.g., MOQ)" value="' + esc(label || '') + '">' +
      '<input type="text" class="spec-value" placeholder="Value (e.g., 1,000 pcs per design)" value="' + esc(value || '') + '">' +
      '<button type="button" class="icon-btn danger" title="Remove"><i data-lucide="trash-2"></i></button>';
    row.querySelector('button').addEventListener('click', function () { row.remove(); });
    $('pf-specs').appendChild(row); icons();
  }
  $('pf-add-spec').addEventListener('click', function () { addSpecRow('', ''); });
  function updatePreviews() {
    var img = $('pf-image').value.trim(), mach = $('pf-machine').value.trim();
    $('adm-preview-row').hidden = !(img || mach);
    $('adm-preview-img').src = imgUrl(img);
    $('adm-preview-machine').src = imgUrl(mach);
  }
  $('pf-image').addEventListener('input', updatePreviews);
  $('pf-machine').addEventListener('input', updatePreviews);
  bindImageUploads(document);

  function showDrawer(id, on) { $(id).hidden = !on; document.body.style.overflow = on ? 'hidden' : ''; if (on) icons(); }
  qsa('.drawer').forEach(function (d) { qsa('[data-close]', d).forEach(function (b) { b.addEventListener('click', function () { showDrawer(d.id, false); }); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { showDrawer('p-drawer', false); showDrawer('inq-drawer', false); } });

  function openProduct(id) {
    var p = id ? state.products.filter(function (x) { return x.id === id; })[0] : null;
    state.editingId = p ? p.id : null;
    $('adm-pf-title').textContent = p ? 'Edit — ' + p.name : 'Add product';
    $('pf-id').value = p ? p.id : '';
    $('pf-name').value = p ? p.name : ''; $('pf-category').value = p ? (p.category || '') : '';
    $('pf-tagline').value = p ? (p.tagline || '') : ''; $('pf-desc').value = p ? (p.description || '') : '';
    $('pf-image').value = p ? (p.image || '') : ''; $('pf-machine').value = p ? (p.machine || '') : '';
    $('pf-sort').value = p ? p.sort : (state.products.length + 1) * 10;
    $('pf-published').checked = p ? !!p.is_published : true;
    $('pf-specs').innerHTML = '';
    (p ? p.specs || [] : []).forEach(function (s) { addSpecRow(s.label, s.value); });
    updatePreviews(); showDrawer('p-drawer', true);
    loadDetailEditor(p ? p.slug : '');
    setTimeout(function () { $('pf-name').focus(); }, 60);
  }

  /* ── Product "Detail page" editor ─────────────────────────── */
  function lines(v) { return String(v || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean); }
  function addVariantRow(v) {
    v = v || {};
    var row = document.createElement('div');
    row.className = 'about-edit-item pd-variant';
    var id = 'pd-vi-' + Math.random().toString(36).slice(2, 8);
    row.innerHTML = '<button type="button" class="icon-btn danger about-remove" title="Remove" aria-label="Remove type"><i data-lucide="trash-2"></i></button>' +
      '<label class="field"><span>Name</span><input type="text" class="pd-v-name" maxlength="80" value="' + esc(v.name || '') + '" placeholder="e.g., Damask labels"></label>' +
      '<div class="field"><span>Image</span><input type="text" class="pd-v-image" id="' + id + '" value="' + esc(v.image || '') + '" placeholder="images/… (empty = product image)">' +
      '<input type="file" accept="image/*" data-image-target="' + id + '"></div>' +
      '<label class="field"><span>Description</span><textarea class="pd-v-text" rows="2" maxlength="600">' + esc(v.text || '') + '</textarea></label>' +
      '<label class="field"><span>Applications <small class="muted">(one per line)</small></span><textarea class="pd-v-apps" rows="3">' + esc((v.applications || []).join('\n')) + '</textarea></label>' +
      '<label class="field"><span>Key attributes <small class="muted">(one per line)</small></span><textarea class="pd-v-attrs" rows="3">' + esc((v.attributes || []).join('\n')) + '</textarea></label>';
    row.querySelector('button').addEventListener('click', function () { row.remove(); });
    $('pd-variants').appendChild(row); bindImageUploads(row); icons();
  }
  function addPhotoRow(g) {
    g = g || {};
    var row = document.createElement('div');
    row.className = 'about-edit-item pd-photo';
    var id = 'pd-ph-' + Math.random().toString(36).slice(2, 8);
    row.innerHTML = '<button type="button" class="icon-btn danger about-remove" title="Remove" aria-label="Remove photo"><i data-lucide="trash-2"></i></button>' +
      '<div class="field"><span>Photo</span><input type="text" class="pd-p-image" id="' + id + '" value="' + esc(g.image || '') + '" placeholder="images/… or upload below">' +
      '<input type="file" accept="image/*" data-image-target="' + id + '"></div>' +
      '<label class="field"><span>Caption <small class="muted">(optional)</small></span><input type="text" class="pd-p-caption" maxlength="120" value="' + esc(g.caption || '') + '"></label>';
    row.querySelector('button').addEventListener('click', function () { row.remove(); });
    $('pd-gallery').appendChild(row); bindImageUploads(row); icons();
  }
  function addHighlightRow(h) {
    h = h || {};
    var row = document.createElement('div');
    row.className = 'about-edit-item pd-highlight';
    row.innerHTML = '<button type="button" class="icon-btn danger about-remove" title="Remove" aria-label="Remove highlight"><i data-lucide="trash-2"></i></button>' +
      '<label class="field"><span>Title</span><input type="text" class="pd-h-title" maxlength="80" value="' + esc(h.title || '') + '"></label>' +
      '<label class="field"><span>Text</span><textarea class="pd-h-text" rows="2" maxlength="700">' + esc(h.text || '') + '</textarea></label>';
    row.querySelector('button').addEventListener('click', function () { row.remove(); });
    $('pd-highlights').appendChild(row); icons();
  }
  function fillDetailEditor(d) {
    d = d || {};
    $('pd-banner').value = d.banner || ''; $('pd-statement').value = d.statement || '';
    $('pd-gallery').innerHTML = ''; (d.gallery || []).forEach(addPhotoRow);
    $('pd-variants').innerHTML = ''; (d.variants || []).forEach(addVariantRow);
    $('pd-common-title').value = (d.common && d.common.title) || '';
    $('pd-common-items').value = ((d.common && d.common.items) || []).join('\n');
    $('pd-highlights').innerHTML = ''; (d.highlights || []).forEach(addHighlightRow);
    $('pd-stat').value = d.stat || '';
  }
  function loadDetailEditor(slug) {
    state.detailLoaded = false; state.detailDirty = false;
    fillDetailEditor(null);
    $('pd-box').open = false;
    function apply() {
      var saved = state.pages && slug ? state.pages[slug] : null;
      var builtin = slug && window.NRI_PRODUCT_PAGES ? window.NRI_PRODUCT_PAGES[slug] : null;
      fillDetailEditor(saved || builtin || null);
      state.detailLoaded = true;
    }
    if (!slug) { state.detailLoaded = true; return; }
    api('admin.productpages.get', {}, function (res) {
      state.pages = res && res.ok && res.data ? res.data : (state.pages || {});
      apply();
    });
  }
  function readDetailEditor() {
    var variants = qsa('#pd-variants .pd-variant').map(function (row) {
      return {
        name: row.querySelector('.pd-v-name').value.trim(), image: row.querySelector('.pd-v-image').value.trim(),
        text: row.querySelector('.pd-v-text').value.trim(),
        applications: lines(row.querySelector('.pd-v-apps').value), attributes: lines(row.querySelector('.pd-v-attrs').value)
      };
    }).filter(function (v) { return v.name; });
    var gallery = qsa('#pd-gallery .pd-photo').map(function (row) {
      return { image: row.querySelector('.pd-p-image').value.trim(), caption: row.querySelector('.pd-p-caption').value.trim() };
    }).filter(function (g) { return g.image; });
    var highlights = qsa('#pd-highlights .pd-highlight').map(function (row) {
      return { title: row.querySelector('.pd-h-title').value.trim(), text: row.querySelector('.pd-h-text').value.trim() };
    }).filter(function (h) { return h.title || h.text; });
    return {
      banner: $('pd-banner').value.trim(), statement: $('pd-statement').value.trim(), variants: variants, gallery: gallery,
      common: { title: $('pd-common-title').value.trim(), items: lines($('pd-common-items').value) },
      highlights: highlights, stat: $('pd-stat').value.trim()
    };
  }
  $('pd-add-variant').addEventListener('click', function () { if (qsa('#pd-variants .pd-variant').length < 8) addVariantRow({}); });
  $('pd-add-photo').addEventListener('click', function () { if (qsa('#pd-gallery .pd-photo').length < 12) addPhotoRow({}); });
  $('pd-add-highlight').addEventListener('click', function () { if (qsa('#pd-highlights .pd-highlight').length < 3) addHighlightRow({}); });
  bindImageUploads($('pd-box'));

  $('p-add').addEventListener('click', function () { openProduct(null); });

  $('adm-product-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var specs = [];
    qsa('#pf-specs .spec-row').forEach(function (row) {
      var l = row.querySelector('.spec-label').value.trim(), v = row.querySelector('.spec-value').value.trim();
      if (l || v) specs.push({ label: l, value: v });
    });
    var product = {
      id: $('pf-id').value || undefined, name: $('pf-name').value.trim(), category: $('pf-category').value.trim(),
      tagline: $('pf-tagline').value.trim(), description: $('pf-desc').value.trim(), image: $('pf-image').value.trim(),
      machine: $('pf-machine').value.trim(), sort: Number($('pf-sort').value || 99), specs: specs, is_published: $('pf-published').checked
    };
    if (!product.name) { toast('Product name is required.', true); return; }
    var btn = $('pf-save'); btn.disabled = true; btn.textContent = 'Saving…';
    var oldProduct = state.editingId ? state.products.filter(function (x) { return x.id === state.editingId; })[0] : null;
    api('admin.products.save', { product: product }, function (res) {
      if (!res || !res.ok) { btn.disabled = false; btn.textContent = 'Save product'; handleErr(res); return; }
      var done = function (detailError) {
        btn.disabled = false; btn.textContent = 'Save product';
        toast(detailError ? 'Product saved, but the detail page was not: ' + detailError
          : (state.editingId ? 'Product updated — the website is already showing it.' : 'Product added — the website is already showing it.'), !!detailError);
        if (!detailError) showDrawer('p-drawer', false);
        loadProducts();
      };
      if (!state.detailLoaded) { done(''); return; }
      api('admin.productpages.save', { slug: res.data.slug, fromSlug: oldProduct ? oldProduct.slug : '', details: readDetailEditor() }, function (r2) {
        if (r2 && r2.ok) { state.pages = state.pages || {}; state.pages[res.data.slug] = r2.data.details; done(''); }
        else done((r2 && r2.error) || 'unknown error');
      });
    });
  });

  /* ═══ INQUIRIES ════════════════════════════════════════════ */
  function loadInquiries(silent) {
    api('admin.inquiries.list', {}, function (res) {
      if (!res || !res.ok) { if (!silent || notAuth(res)) handleErr(res); return; }
      state.inquiries = res.data || [];
      var unread = state.inquiries.filter(function (q) { return q.status === 'new'; }).length;
      pill('pill-inquiries', unread);
      if (state.lastUnreadInq !== null && unread > state.lastUnreadInq) { ding(); toast('New inquiry received'); }
      state.lastUnreadInq = unread;
      if (state.tab === 'inquiries') renderInquiries();
      if (state.tab === 'dash') renderDashLists();
      updateTitle();
    });
  }
  var INQ_FILTERS = [['all', 'All'], ['new', 'New'], ['read', 'Read'], ['replied', 'Replied'], ['archived', 'Archived']];
  function visibleInquiries() {
    var q = ($('inq-search').value || '').toLowerCase();
    return state.inquiries.filter(function (x) {
      if (state.inqFilter !== 'all' && x.status !== state.inqFilter) return false;
      return !q || (x.name + ' ' + x.email + ' ' + x.subject + ' ' + x.message).toLowerCase().indexOf(q) > -1;
    });
  }
  function renderInquiries() {
    $('inq-chips').innerHTML = INQ_FILTERS.map(function (f) {
      var n = f[0] === 'all' ? state.inquiries.length : state.inquiries.filter(function (x) { return x.status === f[0]; }).length;
      return '<button class="chip' + (state.inqFilter === f[0] ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + '<em>' + n + '</em></button>';
    }).join('');
    qsa('#inq-chips .chip').forEach(function (c) { c.addEventListener('click', function () { state.inqFilter = c.dataset.f; renderInquiries(); }); });
    var rows = visibleInquiries();
    $('adm-inqtable').querySelector('tbody').innerHTML = rows.map(function (q) {
      return '<tr class="clickable' + (q.status === 'new' ? ' unread' : '') + '" data-inq="' + esc(q.id) + '">' +
        '<td><input type="checkbox" data-sel="' + esc(q.id) + '"' + (state.selected[q.id] ? ' checked' : '') + '></td>' +
        '<td><b>' + esc(q.name) + '</b><br><small class="muted">' + esc(q.email) + '</small></td>' +
        '<td>' + esc(q.subject) + '</td><td class="muted">' + fmtDate(q.ts) + '</td>' +
        '<td><span class="badge ' + esc(q.status) + '">' + esc(q.status) + '</span></td></tr>';
    }).join('') || '<tr><td colspan="5" class="empty">No inquiries here.</td></tr>';
    qsa('#adm-inqtable tr[data-inq]').forEach(function (tr) {
      tr.addEventListener('click', function (e) { if (e.target.closest('input')) return; openInquiry(tr.dataset.inq); });
    });
    qsa('[data-sel]').forEach(function (c) { c.addEventListener('change', function () { if (c.checked) state.selected[c.dataset.sel] = 1; else delete state.selected[c.dataset.sel]; updateBulk(); }); });
    $('inq-all').checked = false; updateBulk();
  }
  function updateBulk() {
    var n = Object.keys(state.selected).length;
    $('inq-bulk').hidden = !n; $('inq-bulk-count').textContent = n + ' selected';
  }
  $('inq-all').addEventListener('change', function () {
    var on = this.checked;
    visibleInquiries().forEach(function (q) { if (on) state.selected[q.id] = 1; else delete state.selected[q.id]; });
    qsa('[data-sel]').forEach(function (c) { c.checked = on; }); updateBulk();
  });
  qsa('[data-bulk]').forEach(function (b) {
    b.addEventListener('click', function () {
      var ids = Object.keys(state.selected), op = b.dataset.bulk;
      function run() {
        api('admin.inquiries.bulk', { ids: ids, op: op }, function (res) {
          if (!res || !res.ok) { handleErr(res); return; }
          state.selected = {}; toast('Done.'); loadInquiries();
        });
      }
      if (op === 'delete') confirmDialog('Delete ' + ids.length + ' inquiries?', 'This cannot be undone.').then(function (y) { if (y) run(); }); else run();
    });
  });
  $('inq-search').addEventListener('input', renderInquiries);
  $('inq-export').addEventListener('click', function () {
    downloadCsv('nri-inquiries.csv', [['Received', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Status']].concat(state.inquiries.map(function (q) {
      return [q.ts, q.name, q.email, q.phone, q.subject, q.message, q.status];
    })));
  });

  function setInquiryStatus(id, status, silent) {
    api('admin.inquiries.update', { id: id, status: status }, function (res) {
      if (!res || !res.ok) { handleErr(res); return; }
      if (!silent) toast('Marked ' + status + '.');
      loadInquiries();
    });
  }
  function openInquiry(id) {
    var q = state.inquiries.filter(function (x) { return x.id === id; })[0]; if (!q) return;
    $('adm-inq-view-title').textContent = q.subject;
    $('adm-inq-view-body').innerHTML =
      '<div class="kv"><b>From</b><span>' + esc(q.name) + '</span><b>Email</b><span><a href="mailto:' + esc(q.email) + '">' + esc(q.email) + '</a></span>' +
      (q.phone ? '<b>Phone</b><span>' + esc(q.phone) + '</span>' : '') +
      '<b>Received</b><span>' + fmtDate(q.ts) + '</span><b>Status</b><span><span class="badge ' + esc(q.status) + '">' + esc(q.status) + '</span></span></div>' +
      '<div class="msg-box">' + esc(q.message) + '</div>';
    $('adm-inq-view-foot').innerHTML =
      '<button class="btn btn-danger" id="iv-del"><i data-lucide="trash-2"></i>Delete</button><span class="spacer"></span>' +
      '<button class="btn" id="iv-arch">Archive</button>' +
      '<a class="btn btn-primary" id="iv-reply" href="mailto:' + esc(q.email) + '?subject=' + encodeURIComponent('Re: ' + q.subject) + '"><i data-lucide="reply"></i>Reply by email</a>';
    showDrawer('inq-drawer', true);
    $('iv-reply').addEventListener('click', function () { if (q.status !== 'replied') setInquiryStatus(q.id, 'replied', true); });
    $('iv-arch').addEventListener('click', function () { setInquiryStatus(q.id, 'archived'); showDrawer('inq-drawer', false); });
    $('iv-del').addEventListener('click', function () {
      confirmDialog('Delete this inquiry?', 'This cannot be undone.').then(function (yes) {
        if (!yes) return;
        api('admin.inquiries.delete', { id: q.id }, function (res) {
          if (!res || !res.ok) { handleErr(res); return; }
          showDrawer('inq-drawer', false); toast('Inquiry deleted.'); loadInquiries();
        });
      });
    });
    if (q.status === 'new') setInquiryStatus(q.id, 'read', true);
  }

  /* ═══ CHAT ═════════════════════════════════════════════════ */
  var threadTimer = null;
  function startThreadPolling() {
    stopThreadPolling();
    threadTimer = setInterval(function () { if (!document.hidden) { loadThreads(true); if (state.activeThread) loadThread(true); } }, 2000);
  }
  function stopThreadPolling() { if (threadTimer) { clearInterval(threadTimer); threadTimer = null; } }

  function loadThreads(silent) {
    api('admin.chat.threads', {}, function (res) {
      if (!res || !res.ok) { if (!silent || notAuth(res)) handleErr(res); return; }
      var threads = (res.data && res.data.threads) || [];
      var unreadTotal = threads.reduce(function (a, t) { return a + (t.unread || 0); }, 0);
      if (state.lastUnreadChats !== null && unreadTotal > state.lastUnreadChats) ding();
      state.lastUnreadChats = unreadTotal;
      state.threads = threads;
      pill('pill-chat', threads.filter(function (t) { return t.unread > 0; }).length);
      updateTitle();
      var sig = JSON.stringify(threads.map(function (t) { return [t.sessionId, t.lastTs, t.unread, t.status]; })) + state.chatFilter + state.activeThread;
      if (sig !== state.threadSig) { state.threadSig = sig; renderThreads(); }
      if (state.tab === 'dash') renderDashLists();
    });
  }
  function updateTitle() {
    function n(id) { var el = $(id); return el && !el.hidden ? (parseInt(el.textContent, 10) || 0) : 0; }
    var total = n('pill-chat') + n('pill-inquiries');
    document.title = (total ? '(' + total + ') ' : '') + 'Admin Dashboard — NRI International';
  }
  function renderThreads() {
    var f = state.chatFilter;
    var list = state.threads.filter(function (t) {
      return f === 'all' ? true : f === 'unread' ? t.unread > 0 : t.status === 'resolved';
    });
    $('adm-thread-list').innerHTML = list.map(function (t) {
      return '<button class="thread' + (state.activeThread === t.sessionId ? ' active' : '') + (t.status === 'resolved' ? ' resolved' : '') + '" data-th="' + esc(t.sessionId) + '">' +
        '<span class="avatar">' + esc(initials(t.visitorName)) + '</span><span class="body"><span class="t1"><b>' + esc(t.ip || t.visitorName) + '</b><time>' + ago(t.lastTs) + '</time></span>' +
        '<span class="t2"><span>' + (t.lastRole === 'admin' ? 'You: ' : '') + esc(t.last) + '</span>' + (t.unread ? '<em>' + t.unread + '</em>' : '') + '</span></span></button>';
    }).join('') || '<div class="empty">' + (f === 'unread' ? 'Nothing unread.' : 'No conversations yet. Visitor messages from the website chat appear here.') + '</div>';
    qsa('[data-th]').forEach(function (b) { b.addEventListener('click', function () { selectThread(b.dataset.th); }); });
  }
  qsa('#chat-filter button').forEach(function (b) {
    b.addEventListener('click', function () {
      state.chatFilter = b.dataset.cf; state.threadSig = '';
      qsa('#chat-filter button').forEach(function (x) { x.classList.toggle('on', x === b); });
      renderThreads();
    });
  });
  function selectThread(id) {
    state.activeThread = id; state.threadSig = ''; state.msgSig = '';
    $('chat-wrap').dataset.view = 'pane';
    $('chat-empty').hidden = true; $('chat-open').hidden = false;
    renderThreads(); loadThread(); $('adm-chat-input').focus();
  }
  $('chat-back').addEventListener('click', function () { $('chat-wrap').dataset.view = 'list'; });

  function dayLabel(iso) { return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }); }
  function loadThread(silent) {
    var id = state.activeThread; if (!id) return;
    api('admin.chat.thread', { sessionId: id }, function (res) {
      if (id !== state.activeThread) return;
      if (!res || !res.ok) { if (!silent || notAuth(res)) handleErr(res); return; }
      var v = res.data.visitor || {}, msgs = res.data.messages || [];
      state.activeMeta = v;
      $('chat-name').textContent = (v.ip ? v.ip : v.name) + (v.name && v.ip ? ' · ' + v.name : '');
      $('chat-meta').textContent = [v.place, v.network, 'Page ' + (v.page || '/'), v.startedAt ? 'Started ' + fmtDate(v.startedAt) : ''].filter(Boolean).join(' · ');
      var map = $('chat-map'); map.hidden = !v.map; if (v.map) map.href = v.map;
      var resolved = v.status === 'resolved';
      $('chat-resolve').querySelector('span').textContent = resolved ? 'Reopen' : 'Resolve';
      var sig = id + '|' + msgs.length + '|' + (msgs.length ? msgs[msgs.length - 1].id : '') + '|' + resolved;
      if (sig === state.msgSig) return;
      var box = $('adm-chat-msgs'), nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80 || state.msgSig === '';
      state.msgSig = sig;
      var lastDay = '';
      box.innerHTML = msgs.map(function (m) {
        var d = dayLabel(m.ts), sep = d !== lastDay ? '<div class="day-sep">' + esc(d) + '</div>' : ''; lastDay = d;
        return sep + '<div class="bubble ' + esc(m.role) + '">' + esc(m.text) + '<small>' + (m.role === 'admin' ? 'NRI Team · ' : '') + new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</small></div>';
      }).join('') || '<div class="empty">No messages yet.</div>';
      if (nearBottom) box.scrollTop = box.scrollHeight;
      renderQuick();
      loadThreads(true);
    });
  }
  function renderQuick() {
    $('chat-quick').innerHTML = (state.canned || []).map(function (t, i) { return '<button type="button" data-q="' + i + '" title="' + esc(t) + '">' + esc(t) + '</button>'; }).join('');
    qsa('#chat-quick [data-q]').forEach(function (b) {
      b.addEventListener('click', function () { var i = $('adm-chat-input'); i.value = state.canned[Number(b.dataset.q)]; i.focus(); autoGrow(); });
    });
  }
  function autoGrow() { var t = $('adm-chat-input'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 140) + 'px'; }
  $('adm-chat-input').addEventListener('input', autoGrow);
  $('adm-chat-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      var f = $('adm-chat-form');
      if (f.requestSubmit) f.requestSubmit(); else $('adm-chat-send').click();
    }
  });
  $('adm-chat-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = $('adm-chat-input').value.trim();
    if (!text || !state.activeThread) return;
    var btn = $('adm-chat-send'); btn.disabled = true;
    api('admin.chat.reply', { sessionId: state.activeThread, text: text }, function (res) {
      btn.disabled = false;
      if (!res || !res.ok) { handleErr(res); return; }
      $('adm-chat-input').value = ''; autoGrow(); state.msgSig = '';
      loadThread(); toast('Reply sent — the visitor sees it within seconds.');
    });
  });
  $('chat-resolve').addEventListener('click', function () {
    var resolved = state.activeMeta && state.activeMeta.status === 'resolved';
    api('admin.chat.status', { sessionId: state.activeThread, status: resolved ? 'open' : 'resolved' }, function (res) {
      if (!res || !res.ok) { handleErr(res); return; }
      state.msgSig = ''; state.threadSig = ''; toast(resolved ? 'Conversation reopened.' : 'Marked as resolved.'); loadThread(); loadThreads(true);
    });
  });
  $('chat-delete').addEventListener('click', function () {
    confirmDialog('Delete this conversation?', 'The whole chat history is removed permanently.').then(function (yes) {
      if (!yes) return;
      api('admin.chat.delete', { sessionId: state.activeThread }, function (res) {
        if (!res || !res.ok) { handleErr(res); return; }
        state.activeThread = null; $('chat-open').hidden = true; $('chat-empty').hidden = false; $('chat-wrap').dataset.view = 'list';
        state.threadSig = ''; toast('Conversation deleted.'); loadThreads();
      });
    });
  });

  function loadCanned(fillForm) {
    api('admin.canned.get', {}, function (res) {
      if (!res || !res.ok) { if (fillForm) handleErr(res); return; }
      state.canned = res.data.replies || [];
      if (fillForm) $('qr-text').value = state.canned.join('\n');
      renderQuick();
    });
  }
  $('qr-save').addEventListener('click', function () {
    var list = $('qr-text').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    api('admin.canned.save', { replies: list }, function (res) {
      if (!res || !res.ok) { handleErr(res); return; }
      state.canned = res.data.replies; renderQuick(); toast('Quick replies saved.');
    });
  });

  /* ═══ WEBSITE CONTENT ══════════════════════════════════════ */
  function loadContent() {
    api('admin.content.get', {}, function (res) {
      if (!res || !res.ok) { handleErr(res); return; }
      var c = res.data.contact || {}, ch = res.data.chat || {};
      $('cf-email').value = c.email || ''; $('cf-mobile').value = c.mobile || '';
      $('cf-address').value = c.address || ''; $('cf-hours').value = c.hours || ''; $('cf-welcome').value = ch.welcome || '';
      $('cf-video').value = (res.data.media && res.data.media.facilityVideo) || '';
      var about = res.data.about || {};
      state.about = {
        directors: Array.isArray(about.directors) ? about.directors : [],
        certificates: Array.isArray(about.certificates) ? about.certificates : []
      };
      renderAboutEditors();
      renderCertificateEditors();
    });
  }
  $('content-form').addEventListener('submit', function (e) {
    e.preventDefault();
    api('admin.content.save', {
      contact: { email: $('cf-email').value, mobile: $('cf-mobile').value, address: $('cf-address').value, hours: $('cf-hours').value },
      chat: { welcome: $('cf-welcome').value },
      media: { facilityVideo: $('cf-video').value.trim() }
    }, function (res) {
      if (!res || !res.ok) { handleErr(res); return; }
      toast('Saved — the website shows it on the next page load.');
    });
  });
  function renderAboutEditors() {
    $('about-director-editor').innerHTML = state.about.directors.map(function (director, index) {
      var imageId = 'about-director-image-' + index;
      return '<div class="about-edit-item about-director-row">' +
        '<button type="button" class="icon-btn danger about-remove" data-remove-director="' + index + '" aria-label="Remove director"><i data-lucide="trash-2"></i></button>' +
        '<label class="field"><span>Name</span><input data-about-field="name" maxlength="120" value="' + esc(director.name) + '" required></label>' +
        '<label class="field"><span>Position / title</span><input data-about-field="position" maxlength="120" value="' + esc(director.position) + '"></label>' +
        '<label class="field"><span>Biography</span><textarea data-about-field="biography" maxlength="1200" rows="3">' + esc(director.biography) + '</textarea></label>' +
        '<div class="field"><span>Photo URL, upload or Google Drive</span><input id="' + imageId + '" data-about-field="image" maxlength="500" value="' + esc(director.image) + '">' +
        '<input type="file" accept="image/*" data-image-target="' + imageId + '">' + driveImageField(imageId) + '</div></div>';
    }).join('') || '<p class="muted small">No directors added. The Leadership section will remain hidden.</p>';
    qsa('[data-remove-director]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.about.directors.splice(Number(button.dataset.removeDirector), 1);
        renderAboutEditors();
      });
    });
    bindImageUploads($('about-content-form'));
    icons();
  }
  function renderCertificateEditors() {
    $('about-certificate-editor').innerHTML = state.about.certificates.map(function (certificate, index) {
      var imageId = 'about-certificate-image-' + index;
      return '<div class="about-edit-item about-certificate-row">' +
        '<button type="button" class="icon-btn danger about-remove" data-remove-certificate="' + index + '" aria-label="Remove certificate"><i data-lucide="trash-2"></i></button>' +
        '<label class="field"><span>Certificate name</span><input data-about-field="title" maxlength="120" value="' + esc(certificate.title) + '" required></label>' +
        '<div class="field"><span>Certificate image URL, upload or Google Drive</span><input id="' + imageId + '" data-about-field="image" maxlength="500" value="' + esc(certificate.image) + '" required>' +
        '<input type="file" accept="image/*" data-image-target="' + imageId + '">' + driveImageField(imageId) + '</div>' +
        '<div class="previews certificate-preview-row" hidden><figure><img alt="Certificate preview"><figcaption>Certificate</figcaption></figure></div></div>';
    }).join('') || '<p class="muted small">No certificates added. Nothing will appear on the About page.</p>';
    qsa('.about-certificate-row').forEach(function (row) {
      var imageInput = row.querySelector('[data-about-field="image"]');
      var preview = row.querySelector('.certificate-preview-row');
      var image = preview.querySelector('img');
      function updatePreview() {
        var src = imgUrl(imageInput.value.trim());
        preview.hidden = !src;
        if (src) image.src = src;
        else image.removeAttribute('src');
      }
      imageInput.addEventListener('input', updatePreview);
      updatePreview();
    });
    qsa('[data-remove-certificate]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.about.certificates.splice(Number(button.dataset.removeCertificate), 1);
        renderCertificateEditors();
      });
    });
    bindImageUploads($('certificate-content-form'));
    icons();
  }
  function driveImageField(targetId) {
    return '<div class="drive-url-row"><input type="url" data-drive-url placeholder="Google Drive public share URL">' +
      '<button type="button" class="btn btn-sm" data-drive-apply="' + targetId + '">Use Drive link</button></div>' +
      '<small class="muted">Set access to “Anyone with the link” → Viewer.</small>';
  }
  $('about-add-director').addEventListener('click', function () {
    state.about.directors.push({ name: '', position: '', biography: '', image: '' });
    renderAboutEditors();
  });
  $('about-add-certificate').addEventListener('click', function () {
    state.about.certificates.push({ title: '', image: '' });
    renderCertificateEditors();
  });
  $('about-content-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var directors = qsa('.about-director-row').map(function (row) {
      return {
        name: row.querySelector('[data-about-field="name"]').value,
        position: row.querySelector('[data-about-field="position"]').value,
        biography: row.querySelector('[data-about-field="biography"]').value,
        image: row.querySelector('[data-about-field="image"]').value
      };
    });
    api('admin.content.save', { about: { directors: directors } }, function (res) {
      if (!res || !res.ok) { handleErr(res); return; }
      var about = res.data.about || {};
      state.about.directors = about.directors || [];
      renderAboutEditors();
      toast('Leadership saved.');
    });
  });
  $('certificate-content-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var certificates = qsa('.about-certificate-row').map(function (row) {
      return {
        title: row.querySelector('[data-about-field="title"]').value,
        image: row.querySelector('[data-about-field="image"]').value
      };
    });
    api('admin.content.save', { about: { certificates: certificates } }, function (res) {
      if (!res || !res.ok) { handleErr(res); return; }
      var about = res.data.about || {};
      state.about.certificates = about.certificates || [];
      renderCertificateEditors();
      toast('Company certificates saved.');
    });
  });

  /* ═══ SETTINGS / TELEGRAM / SYSTEM CHECK ═══════════════════ */
  function li(ok, text, small, hint) {
    return '<li class="' + (ok ? 'ok' : 'bad') + '"><span class="dot">' + (ok ? '✓' : '!') + '</span><span>' + esc(text) +
      (small ? '<small>' + esc(small) + '</small>' : '') + (hint ? '<small class="hint">' + esc(hint) + '</small>' : '') + '</span></li>';
  }
  function loadTelegram() {
    api('admin.telegram.status', {}, function (res) {
      if (!res || !res.ok) { handleErr(res); return; }
      var t = res.data;
      var modeOk = t.mode === 'pull' || t.mode === 'webhook';
      var modeText = t.mode === 'webhook' ? 'Webhook connected — Telegram pushes your replies to the website'
        : t.mode === 'pull' ? 'Pull mode — the server fetches your Telegram replies every few seconds (no webhook needed)'
        : t.mode === 'foreign-webhook' ? 'Another webhook is registered on this bot' : 'Not connected';
      $('tg-status').innerHTML =
        li(t.botTokenSet, t.botTokenSet ? 'Bot token is set' + (t.bot ? ' (' + t.bot + ')' : '') : 'TELEGRAM_BOT_TOKEN secret is missing in Supabase') +
        li(t.chatIdSet, t.chatIdSet ? 'Support chat ID is set' : 'TELEGRAM_CHAT_ID secret is missing in Supabase') +
        li(modeOk, modeText, '', modeOk ? '' : 'Press “Use pull mode” (easiest) or “Connect Telegram replies”.') +
        (t.lastError ? li(false, 'Telegram says: ' + t.lastError, '', t.mode === 'webhook' ? 'Turn OFF “Enforce JWT verification” for telegram-webhook in Supabase, or press “Use pull mode”.' : '') : '');
    });
  }
  function tgBtn(id, busy, idle, action, okMsg) {
    $(id).addEventListener('click', function () {
      var b = $(id); b.disabled = true; b.textContent = busy;
      api(action, {}, function (res) {
        b.disabled = false; b.textContent = idle;
        if (!res || !res.ok) { handleErr(res); return; }
        toast(okMsg(res.data || {})); loadTelegram();
      });
    });
  }
  tgBtn('tg-setup', 'Connecting…', 'Connect Telegram replies', 'admin.telegram.setup', function (d) { return d.webhookOk ? '✅ Webhook connected.' : 'Webhook set — press Refresh to confirm.'; });
  tgBtn('tg-disconnect', 'Switching…', 'Use pull mode', 'admin.telegram.disconnect', function () { return '✅ Pull mode on — replies are fetched by the server.'; });
  tgBtn('tg-test', 'Sending…', 'Send test message', 'admin.telegram.test', function () { return '✅ Test message sent — check your Telegram.'; });
  $('tg-refresh').addEventListener('click', loadTelegram);

  function runDiagnostics() {
    var b = $('sys-run'); b.disabled = true;
    $('sys-list').innerHTML = '<li class="muted">Checking…</li>';
    api('admin.diagnostics', {}, function (res) {
      b.disabled = false;
      if (!res || !res.ok) { $('sys-list').innerHTML = li(false, (res && res.error) || 'Check failed'); if (notAuth(res)) handleErr(res); return; }
      var d = res.data;
      $('sys-list').innerHTML = (d.ok ? li(true, 'Everything looks good') : '') +
        (d.checks || []).map(function (c) { return li(c.ok, c.label, c.detail, c.hint); }).join('');
      setConn(d.ok ? 'ok' : 'bad', d.ok ? '● connected' : '● needs attention');
    });
  }
  $('sys-run').addEventListener('click', runDiagnostics);

  $('adm-pass-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var cur = $('pw-cur').value, next = $('pw-new').value, next2 = $('pw-new2').value;
    if (next !== next2) { toast('New passwords do not match.', true); return; }
    api('admin.password.change', { currentPassword: cur, newPassword: next }, function (res) {
      if (!res || !res.ok) { handleErr(res); return; }
      if (res.data && res.data.token) { setToken(res.data.token); state.token = res.data.token; }
      $('pw-cur').value = ''; $('pw-new').value = ''; $('pw-new2').value = '';
      toast('Password updated.');
    });
  });

  /* ═══ CSV ══════════════════════════════════════════════════ */
  function downloadCsv(name, rows) {
    var csv = '﻿' + rows.map(function (r) {
      return r.map(function (c) { c = String(c === undefined || c === null ? '' : c); return /[",\n\r]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(',');
    }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ═══ BOOT ═════════════════════════════════════════════════ */
  icons();
  var saved = lsGet('nriint-admin-theme', 'light');
  document.documentElement.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');
  if (getToken()) {
    state.token = getToken();
    api('admin.stats', { range: 7 }, function (res) {
      if (res && res.ok) enterDash();
      else if (notAuth(res)) { setToken(''); }
      else { var er = $('adm-login-err'); er.textContent = (res && res.error) || 'Backend error'; er.hidden = false; }
    });
  }
})();
