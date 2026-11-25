/* dino.js - app ka mascot (chashme wala dino). Alag file: index.html mein <body> ke turant baad <script src="dino.js"></script> chahiye.
   DINO.svg(o) / DINO.el(size) / DINO.head(size) / DINO.splash() / DINO.ready()
   Sab animation SVG ke andar hi hai (haath hilana, palak jhapakna, upar-neeche jhoomna). */
(function () {
  var uid = 0;
  var P = '#F39C32', D = '#E2621A', B = '#F5C65E', PU = '#652F5C', N = '#2B3A78';

  function svg(o) {
    o = o || {};
    var k = ++uid, still = o.still === true, head = o.view === 'head';
    var vb = head ? '310 50 540 440' : '262 48 700 730';
    var sz = o.size ? ' width="' + o.size + '" height="' + Math.round(o.size * (head ? 440 / 540 : 730 / 700)) + '"' : '';
    var SP = ' calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"';
    // animateTransform helper (returns '' when still)
    function rot(vals, dur, begin) {
      if (still) return '';
      return '<animateTransform attributeName="transform" type="rotate" values="' + vals + '" dur="' + dur + '" repeatCount="indefinite"' + SP + (begin ? ' begin="' + begin + '"' : '') + '/>';
    }
    function mv(vals, dur) {
      if (still) return '';
      return '<animateTransform attributeName="transform" type="translate" values="' + vals + '" dur="' + dur + '" repeatCount="indefinite"' + SP + '/>';
    }
    function blink(max) {
      if (still) return '';
      return '<animate attributeName="height" values="0;0;' + max + ';0;0" keyTimes="0;.9;.94;.98;1" dur="4.2s" repeatCount="indefinite"/>';
    }
    var s = '';
    s += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '"' + sz + ' role="img" aria-label="Mascot">';
    s += '<defs><clipPath id="dl' + k + '"><circle cx="466" cy="200" r="46"/></clipPath><clipPath id="dr' + k + '"><circle cx="645" cy="240" r="58"/></clipPath></defs>';
    // shadow
    s += '<ellipse cx="625" cy="712" rx="262" ry="55" fill="#DEDFE9">' + (still ? '' : '<animate attributeName="rx" values="262;250;262" dur="2.2s" repeatCount="indefinite"' + SP + '/>') + '</ellipse>';
    s += '<g>' + mv('0 0;0 -7;0 0', '2.2s');
    // spikes (behind)
    s += '<g fill="' + PU + '">' +
      '<path d="M533 112C540 85 575 64 617 66C612 95 580 115 533 112Z"/>' +
      '<path d="M637 108C655 80 705 62 742 68C740 105 695 128 637 108Z"/>' +
      '<path d="M718 148C745 140 790 142 806 148C800 185 770 212 735 215C735 190 722 170 718 148Z"/>' +
      '<path d="M760 262C780 252 805 252 816 258C813 285 797 310 770 320C770 300 762 282 760 262Z"/>' +
      '<path d="M776 345C790 338 805 340 812 345C808 358 795 368 780 368Z"/>' +
      '<path d="M825 497C832 482 850 478 858 482C858 495 845 503 825 500Z"/>' +
      '<path d="M876 500C878 488 888 485 896 488C895 498 888 503 876 502Z"/></g>';
    // torso, tail and back leg
    s += '<path d="M452 420L760 400C790 440 780 520 700 540L640 610L470 600Z" fill="' + P + '"/>';
    s += '<path d="M630 530C650 500 720 495 790 500L915 495C880 540 830 590 790 620L785 700C760 705 700 710 650 726C662 690 642 650 626 600C620 570 622 545 630 530Z" fill="' + P + '"/>';
    // front leg (darker)
    s += '<path d="M468 585L605 640L598 690C560 700 520 705 466 718C482 680 470 640 468 585Z" fill="' + D + '"/>';
    // belly + dots
    s += '<path d="M450 520C455 465 520 440 590 445C650 455 672 490 666 520C650 580 640 625 600 645C540 652 480 610 450 520Z" fill="' + B + '"/>';
    s += '<g fill="#F8DFA0"><circle cx="545" cy="572" r="22"/><circle cx="567" cy="537" r="13"/><circle cx="537" cy="522" r="8"/><circle cx="513" cy="548" r="5"/></g>';
    // left arm (viewer's left)
    s += '<g>' + rot('3 470 490;-5 470 490;3 470 490', '2.4s') +
      '<path d="M470 468L380 470C360 470 350 480 350 495L350 520C380 560 430 572 470 566Z" fill="' + D + '"/>' +
      '<g stroke="' + D + '" stroke-width="15" stroke-linecap="round" fill="none"><path d="M322 480L292 447"/><path d="M312 490L284 480"/><path d="M312 502L284 514"/><path d="M322 514L300 545"/><path d="M345 466L334 428"/></g>' +
      '<circle cx="338" cy="494" r="36" fill="' + D + '"/><circle cx="348" cy="498" r="13" fill="#F3A33E"/></g>';
    // right arm (waving)
    s += '<g>' + rot('-5 715 480;13 715 480;-5 715 480', '1.15s') +
      '<path d="M690 470C735 440 785 405 815 362L852 392C822 438 782 482 735 505Z" fill="' + P + '"/>' +
      '<g>' + rot('-9 870 380;9 870 380;-9 870 380', '.58s') +
      '<g stroke="' + P + '" stroke-width="17" stroke-linecap="round" fill="none"><path d="M880 370L936 386"/><path d="M882 364L928 348"/><path d="M880 358L902 320"/><path d="M870 354L866 316"/><path d="M858 368L822 338"/></g>' +
      '<ellipse cx="878" cy="378" rx="44" ry="38" transform="rotate(-30 878 378)" fill="' + P + '"/><circle cx="848" cy="390" r="14" fill="#E5731C"/></g></g>';
    // head
    s += '<path d="M325 285C325 190 410 135 520 118C610 104 700 125 740 175C775 225 770 300 785 350C770 400 700 435 560 438C440 440 340 410 325 285Z" fill="' + P + '"/>';
    // eyes
    s += '<circle cx="459" cy="196" r="85" fill="#F8B263" opacity=".55"/><circle cx="667" cy="243" r="95" fill="#F8B263" opacity=".55"/>';
    s += '<g clip-path="url(#dl' + k + ')"><circle cx="466" cy="200" r="46" fill="#fff"/><circle cx="472" cy="207" r="13" fill="#1F2A55"/>' +
      '<ellipse cx="462" cy="244" rx="56" ry="26" fill="#F5A24A" opacity=".55"/><rect x="410" y="154" width="112" height="0" fill="#F6A95B">' + blink(92) + '</rect></g>';
    s += '<g clip-path="url(#dr' + k + ')"><circle cx="645" cy="240" r="58" fill="#fff"/><circle cx="648" cy="240" r="15" fill="#1F2A55"/>' +
      '<ellipse cx="640" cy="290" rx="68" ry="32" fill="#F5A24A" opacity=".55"/><rect x="580" y="182" width="130" height="0" fill="#F6A95B">' + blink(116) + '</rect></g>';
    // cheeks
    s += '<circle cx="440" cy="300" r="28" fill="#E6764F" opacity=".9"/><circle cx="623" cy="335" r="28" fill="#E6764F" opacity=".9"/>';
    // glasses
    s += '<g fill="none" stroke="' + N + '" stroke-width="7" stroke-linecap="round"><circle cx="459" cy="196" r="85"/><circle cx="667" cy="243" r="95"/><path d="M544 215L572 225"/><path d="M342 127L378 160"/><path d="M762 232L842 230"/></g>';
    // smile
    s += '<path d="M509 282C510 312 545 330 568 296" fill="none" stroke="' + N + '" stroke-width="5.5" stroke-linecap="round"/>';
    s += '</g></svg>';
    return s;
  }

  function el(size, cls, o) {
    var d = document.createElement('span');
    d.className = 'dn' + (cls ? ' ' + cls : '');
    o = o || {}; o.size = size;
    d.innerHTML = svg(o);
    return d;
  }
  // round head badge (chat avatar etc.)
  function head(size) {
    var d = document.createElement('span');
    d.className = 'dn dn-h';
    d.style.cssText = 'width:' + size + 'px;height:' + size + 'px';
    d.innerHTML = svg({ view: 'head', still: true });
    return d;
  }

  var css = document.createElement('style');
  css.textContent =
    '.dn{display:inline-block;line-height:0;flex:none;vertical-align:middle}.dn svg{display:block;max-width:100%;height:auto;overflow:visible}' +
    '.dn-h{border-radius:50%;background:#FFE9CC;overflow:hidden;display:inline-grid;place-items:center}.dn-h svg{width:100%;height:100%;overflow:hidden}' +
    '.empty .dn{margin-bottom:10px;animation:dnin .6s cubic-bezier(.2,1.3,.4,1) both}' +
    '@keyframes dnin{from{opacity:0;transform:translateY(16px) scale(.85)}to{opacity:1;transform:none}}' +
    '.pt.dnp{display:flex;align-items:center;justify-content:space-between;gap:6px}.pt .dnp-t{min-width:0}.pt .dn{animation:dnin .7s cubic-bezier(.2,1.3,.4,1) both}' +
    '.dnl{display:flex;flex-direction:column;align-items:center;gap:12px}.dnb{width:132px;height:7px;border-radius:9px;background:#F3E3CC;overflow:hidden}' +
    '.dnb span{display:block;height:100%;width:42%;border-radius:9px;background:linear-gradient(90deg,#F39C32,#E2621A);animation:dnrun 1.15s ease-in-out infinite}' +
    '@keyframes dnrun{0%{transform:translateX(-105%)}100%{transform:translateX(250%)}}' +
    /* splash */
    '#dnSplash{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(80% 55% at 50% 38%,#FFFFFF,#F3F3F8 70%);transition:opacity .45s ease,transform .45s ease;font-family:Manrope,system-ui,sans-serif}' +
    '#dnSplash.out{opacity:0;transform:scale(1.04);pointer-events:none}' +
    '#dnSplash .dn-hero{width:min(74vw,330px);animation:dnhero .9s cubic-bezier(.2,1.25,.35,1) both}' +
    '#dnSplash.out .dn-hero{transform:scale(.9);transition:transform .45s}' +
    '@keyframes dnhero{0%{opacity:0;transform:translateY(46px) scale(.78)}100%{opacity:1;transform:none}}' +
    '#dnSplash .dn-hello{margin-top:6px;font-weight:800;font-size:22px;color:#2B3A78;letter-spacing:-.01em;animation:dnhi .6s .7s ease both}' +
    '#dnSplash .dn-tag{margin-top:6px;font-weight:600;font-size:14px;color:#8A90B0;animation:dnhi .6s .9s ease both;text-align:center;padding:0 28px}' +
    '@keyframes dnhi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
    '#dnSplash .dn-bar{position:absolute;left:28px;right:28px;bottom:calc(38px + env(safe-area-inset-bottom,0px));height:9px;border-radius:9px;background:#EADFCF;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.06)}' +
    '#dnSplash .dn-bar i{display:block;height:100%;width:0;border-radius:9px;background:linear-gradient(90deg,#F7B24A,#F39C32 55%,#E2621A);transition:width .5s cubic-bezier(.3,.7,.3,1);position:relative;overflow:hidden}' +
    '#dnSplash .dn-bar i:after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-100%);animation:dnshine 1.2s infinite}' +
    '@keyframes dnshine{to{transform:translateX(100%)}}' +
    '@media(prefers-reduced-motion:reduce){#dnSplash *{animation-duration:.01s!important}}';
  document.head.appendChild(css);

  /* ---- splash: dino aata hai, haath hilata hai, neeche loading line bharti hai, phir app khulta hai ---- */
  var S = { el: null, bar: null, t0: Date.now(), ready: false, done: false, p: 0, tm: null };
  function splash() {
    if (S.el || !document.body) return;
    var s = document.createElement('div');
    s.id = 'dnSplash';
    s.innerHTML = '<div class="dn-hero"></div><div class="dn-hello">Namaste!</div><div class="dn-tag">Padho chahe kahin se, manzil milegi yahin se...</div><div class="dn-bar"><i></i></div>';
    s.querySelector('.dn-hero').appendChild(el(0, '', {}));
    var sv = s.querySelector('.dn-hero svg'); sv.removeAttribute('width'); sv.removeAttribute('height'); sv.style.width = '100%';
    document.body.appendChild(s);
    S.el = s; S.bar = s.querySelector('.dn-bar i');
    // line dheere dheere bharti hai (92% tak), baaki app ready hone par
    var step = function () {
      if (S.done) return;
      var e = Date.now() - S.t0;
      S.p = Math.min(92, 92 * (1 - Math.exp(-e / 900)));
      S.bar.style.width = S.p + '%';
      S.tm = setTimeout(step, 120);
    };
    step();
    setTimeout(function () { finish(); }, 8000); // failsafe
  }
  function finish() {
    if (S.done || !S.el) return;
    S.done = true; clearTimeout(S.tm);
    S.bar.style.width = '100%';
    setTimeout(function () {
      S.el.classList.add('out');
      setTimeout(function () { if (S.el && S.el.parentNode) S.el.parentNode.removeChild(S.el); }, 520);
    }, 650);
  }
  function ready() {
    S.ready = true;
    var wait = Math.max(0, 2400 - (Date.now() - S.t0)); // dino ko kam se kam thoda hilne do
    setTimeout(finish, wait);
  }

  // browser tab icon
  try {
    var l = document.querySelector('link[rel="icon"]') || document.createElement('link');
    l.rel = 'icon'; l.type = 'image/svg+xml';
    l.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg({ view: 'head', still: true }).replace('<svg ', '<svg width="128" height="104" '));
    if (!l.parentNode) document.head.appendChild(l);
  } catch (e) {}

  window.DINO = { svg: svg, el: function (n, c) { return el(n, c); }, head: head, splash: splash, ready: ready };
  if (document.body) splash(); else document.addEventListener('DOMContentLoaded', splash);
})();
(function(){var c=document.createElement('style');c.textContent='html.night .dn svg{filter:invert(1) hue-rotate(180deg)}.mw button.dnm{background:#FFE9CC;box-shadow:0 16px 30px -10px rgba(226,98,26,.5);animation:dnfloat 2.6s ease-in-out infinite}.mw button .dn-h{width:100%;height:100%}@keyframes dnfloat{50%{transform:translateY(-5px)}}';document.head.appendChild(c)})();
