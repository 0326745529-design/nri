/* NRIINT live chat UI. Supabase service credentials and Telegram tokens stay server-side. */
(function () {
  'use strict';

  var CFG = window.NRI_CONFIG || {};
  var API_URL = String(CFG.SUPABASE_URL || '').replace(/\/+$/, '') + '/functions/v1/chat-api';
  var API_KEY = String(CFG.SUPABASE_ANON_KEY || '');
  var API_READY = !!(CFG.SUPABASE_URL && API_KEY);
  var SESSION_KEY = 'nriint-chat-session';
  var TOKEN_KEY = 'nriint-chat-token';
  var SCROLL_KEY = 'nriint-chat-scroll-notified';
  var POLL_OPEN = Number(CFG.CHAT_POLL_OPEN_MS || 3000);
  var POLL_CLOSED = Number(CFG.CHAT_POLL_CLOSED_MS || 25000);

  function api(action, payload) {
    if (!API_READY) return Promise.reject(new Error('Live chat is not configured.'));
    // A hung request must never freeze polling: abort after 20 s.
    var controller = window.AbortController ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 20000) : null;
    return fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Authorization': 'Bearer ' + API_KEY
      },
      body: JSON.stringify(Object.assign({ action: action }, payload || {})),
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (result) {
        if (!response.ok || !result.ok) {
          var error = new Error(result.error || 'Chat request failed.');
          error.status = response.status;
          error.saved = result.saved === true;
          throw error;
        }
        return result.data || {};
      });
    }).finally(function () { if (timer) clearTimeout(timer); });
  }

  function secureToken() {
    var bytes = new Uint8Array(32);
    if (!window.crypto || !window.crypto.getRandomValues) {
      throw new Error('Secure chat sessions are not supported in this browser.');
    }
    window.crypto.getRandomValues(bytes);
    return Array.prototype.map.call(bytes, function (byte) {
      return byte.toString(16).padStart(2, '0');
    }).join('');
  }

  var root = document.createElement('div');
  root.className = 'chatw';
  root.innerHTML =
    '<section class="chatw-window" id="chatw-win" aria-label="Chat with NRI International" hidden>' +
    '  <div class="chatw-head">' +
    '    <div class="chatw-head-identity">' +
    '      <div class="chatw-head-avatar" aria-hidden="true"><img src="images/brand/logo.svg" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.5-.8L4 20l1.8-4.1A7.5 7.5 0 1 1 20 11.5Z"/></svg></div>' +
    '      <div class="chatw-head-brand"><strong>Chat with NRIINT</strong><span><i class="chatw-status-dot"></i>Online · Persistent Session</span><em class="chatw-ip" id="chatw-ip" hidden></em></div>' +
    '    </div>' +
    '    <button class="chatw-close" id="chatw-close" type="button" aria-label="Close chat"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m18 6-12 12M6 6l12 12"/></svg></button>' +
    '  </div>' +
    '  <div class="chatw-body" id="chatw-body" aria-live="polite">' +
    '    <div class="chatw-day-label"><span>NRI INTERNATIONAL · SUPPORT</span></div>' +
    '    <div class="chatw-msg received">Welcome to NRI International. How may we assist you today? Please feel free to share your inquiry, and our team will be delighted to help.</div>' +
    '    <p class="chatw-notice">Your message is sent to our team on Telegram. Your IP address and approximate city are shared with our team so we can reply to you.</p>' +
    '    <div class="chatw-unavailable" id="chatw-unavailable" hidden><span class="chatw-unavailable-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg></span><div><strong>Live chat is getting ready</strong><p>Our team is setting up Telegram support. In the meantime, send us an email.</p><a href="mailto:info@nriint.com">Email NRI International <span aria-hidden="true">→</span></a></div></div>' +
    '  </div>' +
    '  <form class="chatw-form" id="chatw-form">' +
    '    <div class="chatw-input-row">' +
    '      <label class="sr-only" for="chatw-text">Your message</label>' +
    '      <input type="text" id="chatw-text" class="chatw-text" placeholder="Write a message..." maxlength="1500" autocomplete="off" required>' +
    '      <button type="submit" class="chatw-send" aria-label="Send message">' +
    '        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>' +
    '      </button>' +
    '    </div>' +
    '    <div class="chatw-secure-note"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>Secured connection (HTTPS) · IP &amp; city shared with our team</div>' +
    '  </form>' +
    '</section>' +
    '<button class="chatw-fab" id="chatw-fab" type="button" aria-label="Open chat with NRI International" aria-expanded="false">' +
    '  <svg class="ic-chat" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>' +
    '  <svg class="ic-x" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
    '  <span class="chatw-badge" id="chatw-badge" aria-label="1 new welcome message" hidden>1</span>' +
    '</button>';
  document.body.appendChild(root);

  var win = root.querySelector('#chatw-win');
  var body = root.querySelector('#chatw-body');
  var fab = root.querySelector('#chatw-fab');
  var badge = root.querySelector('#chatw-badge');
  var ipLine = root.querySelector('#chatw-ip');
  var form = root.querySelector('#chatw-form');
  var textInput = root.querySelector('#chatw-text');
  var unavailable = root.querySelector('#chatw-unavailable');
  var sessionId = '';
  var visitorToken = '';
  var isOpen = false;
  var unread = 0;
  var pollTimer = null;
  var pollInFlight = false;
  var seenMessages = Object.create(null);

  try {
    sessionId = sessionStorage.getItem(SESSION_KEY) || '';
    visitorToken = sessionStorage.getItem(TOKEN_KEY) || '';
  } catch (error) {
    console.warn('Chat session storage is unavailable:', error.message);
  }

  function ding() {
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      var context = new AudioContextClass();
      var oscillator = context.createOscillator();
      var gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.1, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.4);
      context.resume().then(function () {
        setTimeout(function () { context.close(); }, 600);
      }).catch(function (error) {
        console.info('Notification sound was blocked by the browser:', error.message);
      });
    } catch (error) {
      console.info('Notification sound is unavailable:', error.message);
    }
  }

  function updateBadge() {
    badge.hidden = unread < 1;
    badge.textContent = unread > 9 ? '9+' : String(unread);
    badge.setAttribute('aria-label', unread + ' unread chat message' + (unread === 1 ? '' : 's'));
    fab.classList.toggle('has-unread', unread > 0);
  }

  function appendMessage(message) {
    var bubble = document.createElement('div');
    bubble.className = 'chatw-msg ' + (message.role === 'admin' ? 'received' : 'sent');
    bubble.textContent = message.text;
    if (message.ts) bubble.title = new Date(message.ts).toLocaleString();
    body.appendChild(bubble);
    body.scrollTop = body.scrollHeight;
    return bubble;
  }

  function setError(message) {
    var error = document.createElement('p');
    error.className = 'chatw-err';
    error.textContent = message;
    body.appendChild(error);
    body.scrollTop = body.scrollHeight;
  }

  function showUnavailable() {
    unavailable.hidden = false;
    form.hidden = true;
  }

  function showVisitor(visitor) {
    if (!visitor || !visitor.ip) return;
    var parts = String(visitor.place || '').split(', ');
    var short = parts.length > 2 ? parts[0] + ', ' + parts[parts.length - 1] : parts.join(', ');
    ipLine.textContent = 'IP: ' + visitor.ip + (short ? ' · ' + short : '');
    ipLine.hidden = false;
  }

  if (!API_READY) showUnavailable();

  function updatePolling() {
    if (pollTimer) clearTimeout(pollTimer);
    if (!sessionId || !visitorToken || document.hidden) return;
    pollTimer = setTimeout(poll, isOpen ? POLL_OPEN : POLL_CLOSED);
  }

  function poll() {
    if (pollInFlight || !sessionId || !visitorToken) return;
    pollInFlight = true;
    api('poll', { sessionId: sessionId, visitorToken: visitorToken })
      .then(function (data) {
        showVisitor(data.visitor);
        var messages = data.messages || [];
        messages.forEach(function (message) {
          var id = String(message.id || message.ts || '');
          if (id && seenMessages[id]) return;
          if (id) seenMessages[id] = true;
          if (message.role === 'admin' && !isOpen) {
            unread += 1;
            updateBadge();
            ding();
          }
          appendMessage(message);
        });
      })
      .catch(function (error) {
        console.warn('Unable to check chat replies:', error.message);
        // The chat was deleted/closed on the server: forget it so the next message starts a fresh one.
        if (error.status === 404) resetSession();
      })
      .finally(function () {
        pollInFlight = false;
        updatePolling();
      });
  }

  function resetSession() {
    sessionId = '';
    visitorToken = '';
    if (pollTimer) clearTimeout(pollTimer);
    try { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(TOKEN_KEY); } catch (error) { /* ignore */ }
  }

  // Creates the chat session on the first message (no extra "start" step for the visitor).
  function ensureSession() {
    if (sessionId && visitorToken) return Promise.resolve();
    try {
      if (!visitorToken) {
        visitorToken = secureToken();
        sessionStorage.setItem(TOKEN_KEY, visitorToken);
      }
    } catch (error) {
      return Promise.reject(error);
    }
    return api('start', {
      visitorToken: visitorToken,
      name: '',
      page: window.location.pathname
    }).then(function (data) {
      sessionId = data.sessionId;
      try { sessionStorage.setItem(SESSION_KEY, sessionId); } catch (error) {
        console.warn('Chat session could not be saved:', error.message);
      }
      showVisitor(data.visitor);
    });
  }

  root.querySelector('#chatw-close').addEventListener('click', function () {
    isOpen = false;
    win.hidden = true;
    fab.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
    updatePolling();
  });

  fab.addEventListener('click', function () {
    isOpen = !isOpen;
    win.hidden = !isOpen;
    fab.classList.toggle('open', isOpen);
    fab.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      unread = 0;
      updateBadge();
      updatePolling();
      if (sessionId) poll();
      else if (API_READY) textInput.focus();
      else unavailable.querySelector('a').focus();
    }
  });

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-chat-open]');
    if (trigger) {
      event.preventDefault();
      if (!isOpen) fab.click();
    }
  });

  function deliver(message, retried) {
    return ensureSession().then(function () {
      return api('send', { sessionId: sessionId, visitorToken: visitorToken, message: message });
    }).catch(function (error) {
      if (error.status === 404 && !retried) {
        resetSession();               // stale session → start a new one and try once more
        return deliver(message, true);
      }
      throw error;
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var message = textInput.value.trim();
    if (!message || !API_READY) return;
    var sendButton = form.querySelector('button[type="submit"]');
    var pendingBubble = appendMessage({ role: 'visitor', text: message });
    pendingBubble.classList.add('sending');
    textInput.value = '';
    sendButton.disabled = true;
    deliver(message, false).then(function (data) {
      if (data.messageId) seenMessages[String(data.messageId)] = true;
      pendingBubble.classList.remove('sending');
      if (data.messageId) pendingBubble.title = new Date().toLocaleString();
      updatePolling();
      setTimeout(poll, 1500);         // look for a quick answer right after sending
    }).catch(function (error) {
      console.error('Unable to send visitor chat message:', error.message);
      if (error.saved) {
        pendingBubble.classList.remove('sending');
        pendingBubble.title = 'Saved, but the team could not be notified.';
      } else {
        pendingBubble.remove();
        if (!textInput.value) textInput.value = message;
      }
      setError(error.message || 'Message could not be sent. Please email info@nriint.com.');
    }).finally(function () {
      sendButton.disabled = false;
      textInput.focus();
    });
  });

  // Welcome text can be edited in Admin → Website content.
  if (window.NRI_BOOT && window.NRI_BOOT.ready) {
    window.NRI_BOOT.ready(function () {
      var site = window.NRI_SITE || {};
      var welcome = site.chat && site.chat.welcome;
      var first = body.querySelector('.chatw-msg.received');
      if (welcome && first) first.textContent = welcome;
    });
  }

  // One anonymous page-view per page per browser session (feeds the admin dashboard charts).
  if (API_READY) {
    var viewKey = 'nriint-pv:' + window.location.pathname;
    var counted = false;
    try { counted = sessionStorage.getItem(viewKey) === '1'; } catch (error) { counted = false; }
    if (!counted) {
      api('pageview', { page: window.location.pathname }).then(function () {
        try { sessionStorage.setItem(viewKey, '1'); } catch (error) { /* ignore */ }
      }).catch(function () { /* analytics must never disturb the page */ });
    }
  }

  var scrollNotified = false;
  try { scrollNotified = sessionStorage.getItem(SCROLL_KEY) === '1'; } catch (error) {
    console.warn('Chat notification state could not be read:', error.message);
  }

  function onScroll() {
    if (scrollNotified || window.scrollY < 160) return;
    scrollNotified = true;
    window.removeEventListener('scroll', onScroll);
    unread = 1;
    updateBadge();
    ding();
    try { sessionStorage.setItem(SCROLL_KEY, '1'); } catch (error) {
      console.warn('Chat notification state could not be saved:', error.message);
    }
    if (API_READY) {
      api('visit', { page: window.location.pathname }).catch(function (error) {
        console.warn('Visit notification was not delivered:', error.message);
      });
    }
  }

  if (!scrollNotified) window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', updatePolling);
  window.addEventListener('pagehide', function () {
    if (pollTimer) clearTimeout(pollTimer);
  }, { once: true });

  if (sessionId && visitorToken) {
    updatePolling();
    poll();
  }
})();
