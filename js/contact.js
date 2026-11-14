/* NRI International contact page. Inquiry submissions use Supabase when configured. */
(function () {
  'use strict';

  window.NRI_BOOT.ready(function () {
    var D = window.NRIINT_DATA || {};
    var contact = D.contact || {};
    var form = document.getElementById('contact-form');
    if (!form) return;

    var emailTo = contact.email || 'info@nriint.com';

    /* Render CMS-controlled contact info into [data-nri] hooks */
    function put(id, v) {
      var el = document.getElementById(id);
      if (el && v) el.textContent = v;
    }
    put('ci-address', contact.address);
    put('ci-email', contact.email);
    put('ci-hours', contact.hours);
    var mailEl = document.getElementById('ci-email-link');
    if (mailEl && contact.email) mailEl.href = 'mailto:' + contact.email;
    var phone = String(contact.mobile || '').trim();
    var phoneCard = document.getElementById('ci-phone-card');
    if (phoneCard && phone) {
      phoneCard.hidden = false;
      document.getElementById('ci-phone').textContent = phone;
      document.getElementById('ci-phone-link').href = 'tel:' + phone.replace(/[^\d+]/g, '');
    }

    var qr = document.getElementById('contact-qr');
    if (qr) {
      function escapeVCard(value) {
        return String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n')
          .replace(/,/g, '\\,').replace(/;/g, '\\;');
      }
      var vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:NRI International Ltd',
        'ORG:NRI International Ltd',
        phone ? 'TEL;TYPE=WORK,VOICE:' + escapeVCard(phone) : '',
        contact.email ? 'EMAIL;TYPE=WORK:' + escapeVCard(contact.email) : '',
        contact.address ? 'ADR;TYPE=WORK:;;' + escapeVCard(contact.address) + ';;;;' : '',
        contact.hours ? 'NOTE:Business hours: ' + escapeVCard(contact.hours) : '',
        'URL:https://nriint.com',
        'END:VCARD'
      ].filter(Boolean).join('\r\n');
      import('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm')
        .then(function (module) {
          var qrCode = module.default || module;
          return qrCode.toCanvas(vcard, {
            width: 180,
            margin: 2,
            errorCorrectionLevel: 'M',
            color: { dark: '#071120', light: '#ffffff' }
          });
        })
        .then(function (canvas) { qr.replaceChildren(canvas); })
        .catch(function (error) {
          console.error('Contact QR code could not be generated:', error);
          qr.closest('.contact-qr-card').hidden = true;
        });
    }

    /* Pre-fill subject when arriving from product pages */
    var preSubject = new URLSearchParams(window.location.search).get('subject');
    var subjectInput = document.getElementById('f-subject');
    if (preSubject && subjectInput && !subjectInput.value) {
      subjectInput.value = preSubject;
    }

    function setInvalid(id, bad) {
      var field = document.getElementById(id).closest('.field');
      if (field) field.classList.toggle('invalid', bad);
      return !bad;
    }

    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = document.getElementById('f-name').value.trim();
      var email = document.getElementById('f-email').value.trim();
      var subject = subjectInput.value.trim();
      var message = document.getElementById('f-message').value.trim();
      var company = document.getElementById('f-company').value.trim(); // honeypot

      var ok = true;
      ok = setInvalid('f-name', name.length < 2) && ok;
      ok = setInvalid('f-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
      ok = setInvalid('f-subject', subject.length < 3) && ok;
      ok = setInvalid('f-message', message.length < 10) && ok;

      var note = document.getElementById('form-ok');
      if (!ok) { note.classList.remove('show'); return; }

      if (company) {
        // Honeypot filled — silently drop (bots only)
        form.reset();
        return;
      }

      /* ── LIVE MODE: save the inquiry through Supabase ───────── */
      if (window.NRI_BOOT.isConfigured() || window.NRI_BOOT.isSupabaseConfigured()) {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.label = submitBtn.textContent; submitBtn.textContent = 'SENDING…'; }
        window.NRI_BOOT.post({
          action: 'inquiry.create',
          name: name, email: email, subject: subject, message: message,
          source: 'contact page', company: company
        }, function (res) {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.label || submitBtn.textContent; }
          if (res && res.ok) {
            form.reset();
            note.innerHTML = 'Thank you, ' + name.replace(/[<>&]/g, '') + '. Your message has been received — ' +
              'our team will review your inquiry and reply to <strong>' + email.replace(/[<>&]/g, '') + '</strong> shortly.';
            note.classList.add('show');
          } else {
            note.innerHTML = 'Sorry — the message could not be delivered right now. Please email us directly at ' +
              '<a href="mailto:' + emailTo + '"><strong>' + emailTo + '</strong></a>.';
            note.classList.add('show');
          }
        });
        return;
      }

      /* ── OFFLINE MODE: mailto fallback ─────────────────────── */
      var body =
        'Name: ' + name + '\r\n' +
        'Email: ' + email + '\r\n\r\n' +
        message + '\r\n\r\n' +
        '— Sent from nriint.com (static site contact form)';

      var mailto = 'mailto:' + emailTo +
        '?subject=' + encodeURIComponent(subject + ' — ' + name) +
        '&body=' + encodeURIComponent(body);

      window.location.href = mailto;

      note.innerHTML = 'Thank you, ' + name.replace(/[<>&]/g, '') + '. Your email app should now open with the message ready to send to <strong>' + emailTo + '</strong>. If nothing opens, copy the address and write to us directly.';
      note.classList.add('show');
    });
  });
})();
