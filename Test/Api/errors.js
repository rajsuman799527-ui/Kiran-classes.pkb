/* errors.js - Kiran Classes on-screen error reporter (sirf errors dikhane ke liye).
   Is file ko index.html ke <head> mein sabse pehle lagao:  <script src="errors.js"></script>
   Ye app ka koi kaam nahi badalti. Bas jab kuch toote to screen par bata deti hai ki kyun. */
(function () {
  'use strict';
  if (window.__kcErr) return;
  var LOG = [], MAX = 40, bar = null, dot = null, dismissed = false, realFetch = window.fetch;
  window.__kcErr = { log: LOG };

  var HINTS = {
    api404html: 'Server (Cloudflare Function) mila hi nahi. GitHub mein functions/api/[[path]].js ka naam aur jagah check karo, aur Cloudflare > Deployments mein latest build Success hai ya nahi dekho.',
    api404json: 'Ye route backend mein nahi hai. index.html aur functions/api/[[path]].js ek hi version ki honi chahiye. Dono dobara replace karo.',
    htmlOk: '/api par code ki jagah website ka page aa raha hai. Matlab Functions chal nahi rahe (deploy fail ya galat folder).',
    html5xx: 'Cloudflare ne error page diya (Worker crash ya CPU limit). Cloudflare > kiran-classes-pkb > Functions > Real-time logs dekho.',
    server: 'Server ke andar error aaya. Neeche ka message padho. "no such column / no such table" ho to D1 mein migration line chalani hai.',
    net: 'Internet ya server band hai. Wifi/data check karo aur dobara try karo.',
    limit: 'Bahut jaldi requests gayi. Thodi der ruko.',
    js: 'App ke code mein error aaya. Ye details copy karke bhejo.',
    res: 'Ek zaroori file load nahi hui (internet ya CDN dikkat). Page reload karo.'
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function hm() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2); }

  function push(kind, title, detail, hint, quiet) {
    var e = { t: hm(), kind: kind, title: title, detail: String(detail || '').slice(0, 600), hint: hint || '' };
    LOG.push(e); if (LOG.length > MAX) LOG.shift();
    if (!quiet) { dismissed = false; render(); }
    else if (dot) render();
  }

  /* ---------- UI ---------- */
  function mount() {
    if (bar) return;
    bar = document.createElement('div');
    bar.id = 'kcErrBar';
    bar.setAttribute('style', 'position:fixed;left:0;right:0;top:0;z-index:2147483000;display:none;background:#B42318;color:#fff;font:13px/1.35 system-ui,Arial,sans-serif;padding:calc(10px + env(safe-area-inset-top)) 12px 10px;box-shadow:0 10px 30px rgba(0,0,0,.35);max-height:70vh;overflow:auto');
    dot = document.createElement('button');
    dot.textContent = '!';
    dot.setAttribute('aria-label', 'Show errors');
    dot.setAttribute('style', 'position:fixed;left:10px;bottom:90px;z-index:2147483000;display:none;width:38px;height:38px;border-radius:50%;background:#B42318;color:#fff;font:800 20px system-ui;border:2px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.4)');
    dot.onclick = function () { dismissed = false; render(true); };
    (document.body || document.documentElement).appendChild(bar);
    (document.body || document.documentElement).appendChild(dot);
  }
  function btn(label, fn) {
    var b = document.createElement('button');
    b.textContent = label;
    b.setAttribute('style', 'background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.55);border-radius:10px;padding:7px 12px;margin:8px 8px 0 0;font:700 13px system-ui');
    b.onclick = fn; return b;
  }
  var open = false, diag = '';
  function render(forceOpen) {
    if (!document.body) { document.addEventListener('DOMContentLoaded', function () { render(forceOpen); }); return; }
    mount();
    if (!LOG.length) { bar.style.display = 'none'; dot.style.display = 'none'; return; }
    if (dismissed) { bar.style.display = 'none'; dot.style.display = 'block'; return; }
    dot.style.display = 'none'; bar.style.display = 'block';
    var last = LOG[LOG.length - 1];
    bar.innerHTML = '<div style="font-weight:800;font-size:14px">App error: ' + esc(last.title) + '</div>' +
      (last.hint ? '<div style="margin-top:4px;opacity:.95">' + esc(last.hint) + '</div>' : '') +
      (last.detail ? '<div style="margin-top:4px;font:12px/1.3 ui-monospace,monospace;opacity:.9;word-break:break-all">' + esc(last.detail.slice(0, 220)) + '</div>' : '');
    var row = document.createElement('div');
    row.appendChild(btn(open ? 'Hide details' : 'Details', function () { open = !open; render(); }));
    row.appendChild(btn('Check system', runDiag));
    row.appendChild(btn('Copy', copyReport));
    row.appendChild(btn('Close', function () { dismissed = true; render(); }));
    bar.appendChild(row);
    if (diag) { var d = document.createElement('div'); d.setAttribute('style', 'margin-top:10px;background:rgba(0,0,0,.28);border-radius:10px;padding:10px;font:12.5px/1.45 system-ui;white-space:pre-wrap'); d.textContent = diag; bar.appendChild(d); }
    if (open) { var p = document.createElement('pre'); p.setAttribute('style', 'margin:10px 0 0;background:rgba(0,0,0,.28);border-radius:10px;padding:10px;font:11.5px/1.4 ui-monospace,monospace;white-space:pre-wrap;word-break:break-all'); p.textContent = report(); bar.appendChild(p); }
  }
  function report() {
    var s = ['Kiran Classes error report', 'Time: ' + new Date().toString(), 'Page: ' + location.href, 'Browser: ' + navigator.userAgent.slice(0, 120), 'Online: ' + navigator.onLine, ''];
    LOG.slice(-12).forEach(function (e) { s.push('[' + e.t + '] ' + e.kind.toUpperCase() + ': ' + e.title + (e.detail ? '\n    ' + e.detail : '')); });
    if (diag) s.push('', 'System check:', diag);
    return s.join('\n');
  }
  function copyReport() {
    var txt = report();
    function fb() { var t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove(); }
    try { navigator.clipboard.writeText(txt).catch(fb); } catch (e) { fb(); }
    push('info', 'Report copy ho gayi. Ab chat mein paste karo.', '', '', true);
    var last = bar.firstChild; if (last) last.textContent = 'Report copy ho gayi. Ab chat mein paste kar do.';
  }

  /* ---------- system check ---------- */
  function line(ok, text) { return (ok === true ? 'OK   ' : ok === false ? 'FAIL ' : 'WARN ') + text; }
  function runDiag() {
    diag = 'Check chal raha hai...'; render();
    var out = [];
    out.push(line(navigator.onLine, 'Internet: ' + (navigator.onLine ? 'online' : 'OFFLINE')));
    var host = location.host;
    out.push(line(/^kiran-classes-pkb\.pages\.dev$/.test(host) ? true : null, 'Address: ' + host + (/^kiran-classes-pkb\.pages\.dev$/.test(host) ? '' : '  (asli address kiran-classes-pkb.pages.dev hai, alag address par login alag hota hai)')));
    try { localStorage.setItem('kcprobe', '1'); localStorage.removeItem('kcprobe'); out.push(line(true, 'Phone storage: chal raha hai')); } catch (e) { out.push(line(false, 'Phone storage band hai (login yaad nahi rahega)')); }
    realFetch('/api/health', { cache: 'no-store' }).then(function (r) {
      var ct = r.headers.get('content-type') || '';
      return r.text().then(function (t) {
        if (r.status === 404 && ct.indexOf('json') < 0) { out.push(line(false, '/api/health -> 404. Backend (Functions) chal hi nahi raha. functions/api/[[path]].js deploy nahi hui.')); return; }
        var j = null; try { j = JSON.parse(t); } catch (e) {}
        if (!j) { out.push(line(false, '/api/health -> status ' + r.status + ', JSON nahi mila (' + (ct || 'no type') + '). Backend crash ya purana version.')); return; }
        out.push(line(true, 'Backend chal raha hai'));
        out.push(line(j.db, 'Database (D1): ' + (j.db ? 'connected' : 'ERROR ' + (j.db_error || ''))));
        out.push(line(j.ai ? true : null, 'Workers AI binding: ' + (j.ai ? 'juda hai' : 'nahi juda (Groq/baaki AI se chalega)')));
        var miss = []; Object.keys(j.env || {}).forEach(function (k) { if (!j.env[k]) miss.push(k); });
        out.push(line(miss.length ? null : true, miss.length ? 'Cloudflare variables jo nahi mile: ' + miss.join(', ') : 'Saare Cloudflare variables mile'));
        if (j.missing_tables && j.missing_tables.length) out.push(line(false, 'D1 mein ye tables nahi hain: ' + j.missing_tables.join(', ')));
        if (j.missing_columns && j.missing_columns.length) out.push(line(false, 'D1 mein ye columns nahi hain: ' + j.missing_columns.join(', ')));
        if (j.db && !(j.missing_tables || []).length && !(j.missing_columns || []).length) out.push(line(true, 'D1 tables aur columns sab theek'));
      });
    }).catch(function (e) { out.push(line(false, '/api/health tak pahunch nahi paye: ' + (e && e.message))); })
      .then(function () { return realFetch('/api/me', { cache: 'no-store' }); })
      .then(function (r) { var ct = r.headers.get('content-type') || ''; out.push(line(ct.indexOf('json') > -1 ? true : false, '/api/me -> ' + r.status + (ct.indexOf('json') > -1 ? ' (JSON, theek)' : ' (JSON nahi, galat)'))); })
      .catch(function (e) { out.push(line(false, '/api/me fail: ' + (e && e.message))); })
      .then(function () { diag = out.join('\n'); open = false; render(); });
  }

  /* ---------- catchers ---------- */
  window.addEventListener('error', function (ev) {
    try {
      var t = ev.target;
      if (t && t !== window && (t.tagName === 'SCRIPT' || t.tagName === 'LINK')) {
        push('resource', 'File load nahi hui', (t.src || t.href || ''), HINTS.res); return;
      }
      if (t && t !== window) return; /* images etc: chup raho */
      push('js', ev.message || 'JavaScript error', (ev.filename || '').split('/').pop() + ':' + (ev.lineno || '?') + ':' + (ev.colno || '?'), HINTS.js);
    } catch (e) {}
  }, true);
  window.addEventListener('unhandledrejection', function (ev) {
    try {
      var m = ev.reason && ev.reason.message ? ev.reason.message : String(ev.reason);
      if (m === 'Something went wrong' || m === 'Failed to fetch') return; /* api wrapper pehle hi bata chuka */
      push('promise', m, '', HINTS.js);
    } catch (e) {}
  });

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var p = realFetch.apply(this, arguments);
    if (url.indexOf('/api/') < 0 || url.indexOf('/api/health') > -1) return p;
    var method = (init && init.method) || (input && input.method) || 'GET';
    var path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    p.then(function (res) {
      try {
        var ct = res.headers.get('content-type') || '', st = res.status, isJson = ct.indexOf('json') > -1;
        if (res.ok && isJson) return;
        res.clone().text().then(function (txt) {
          var snip = txt.replace(/\s+/g, ' ').slice(0, 240), title = method + ' ' + path + ' -> ' + st, hint = '', quiet = false;
          if (st === 401 && isJson) return;
          if (res.ok && !isJson) hint = HINTS.htmlOk;
          else if (st === 404 && !isJson) hint = HINTS.api404html;
          else if (st >= 500 && !isJson) hint = HINTS.html5xx;
          else if (st === 429) { hint = HINTS.limit; quiet = true; }
          else if (isJson && st >= 500) { var j = {}; try { j = JSON.parse(txt); } catch (e) {} title += ': ' + (j.error || 'server error'); hint = HINTS.server; snip = ''; }
          else if (isJson && st === 404) hint = HINTS.api404json;
          else if (isJson) { push('api', title, snip, '', true); return; } /* normal 4xx: app khud dikhata hai */
          else hint = 'Server ka jawab samajh nahi aaya.';
          push('api', title, snip, hint, quiet);
        }).catch(function () {});
      } catch (e) {}
    }, function (err) {
      push('api', method + ' ' + path + ' -> network error', err && err.message, HINTS.net);
    });
    return p;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
