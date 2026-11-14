/* NRIINT — new-visitor alert.
   Once per browser session the site asks the chat-api Edge Function to send the visitor's
   IP, location and ISP to Telegram. The IP lookup and the Telegram message both happen
   server-side, so no token ever reaches the browser. */
(function () {
  'use strict';

  var CFG = window.NRI_CONFIG || {};
  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) return;

  var SESSION_FLAG = 'nriint-visitor-notified';
  var SEEN_FLAG = 'nriint-visitor-seen';
  var returning = false;

  try {
    if (sessionStorage.getItem(SESSION_FLAG)) return;   // already reported this visit
    sessionStorage.setItem(SESSION_FLAG, '1');
  } catch (e) { /* storage blocked: fall through, server rate-limit still applies */ }
  try {
    returning = !!localStorage.getItem(SEEN_FLAG);
    localStorage.setItem(SEEN_FLAG, String(Date.now()));
  } catch (e) { /* ignore */ }

  var url = String(CFG.SUPABASE_URL).replace(/\/+$/, '') + '/functions/v1/chat-api';
  try {
    fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'apikey': CFG.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + CFG.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        action: 'newvisitor',
        page: location.pathname,
        returning: returning
      })
    }).catch(function () { /* the alert is best-effort; never affect the page */ });
  } catch (e) { /* ignore */ }
})();
