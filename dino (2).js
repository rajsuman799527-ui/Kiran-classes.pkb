/* dino.js - app ka mascot (chashme wala dino) - ab tumhari di hui animation (dino.webp, transparent) chalti hai.
   dino.js aur dino.webp dono index.html ke saath ek hi folder me rakho. index.html me <body> ke turant baad: <script src="dino.js"></script>
   DINO.el(size) / DINO.head(size) / DINO.splash() / DINO.ready() / DINO.pick()  (purane naam wahi hain, bas animation naya hai) */
(function () {
  var base = 'dino.webp';
  try {
    var sc = document.currentScript || (function () { var a = document.getElementsByTagName('script'); return a[a.length - 1]; })();
    if (sc && sc.src) base = sc.src.replace(/dino\.js(\?.*)?$/, 'dino.webp');
  } catch (e) {}
  var ASPECT = 333 / 320;       // frame height / width
  function pick() { return 'wave'; }
  function img(cls) {
    var i = document.createElement('img');
    i.src = base; i.alt = 'Mascot'; i.draggable = false; i.decoding = 'async';
    if (cls) i.className = cls;
    return i;
  }
  function el(size, cls, o) {
    var d = document.createElement('span');
    d.className = 'dno' + (cls ? ' ' + cls : '');
    var i = img();
    if (size) { i.style.width = size + 'px'; i.style.height = Math.round(size * ASPECT) + 'px'; }
    d.appendChild(i);
    return d;
  }
  // gol chehra (avatar / toast / top bar) - animation ka sirf chehra wala hissa dikhta hai
  function head(size, o) {
    var d = document.createElement('span');
    d.className = 'dno dno-h';
    d.style.cssText = 'width:' + size + 'px;height:' + size + 'px';
    var i = img('dno-hi');
    i.style.width = Math.round(size * 1.7) + 'px'; i.style.height = Math.round(size * 1.7 * ASPECT) + 'px';
    i.style.left = Math.round(-size * 0.36) + 'px'; i.style.top = Math.round(size * 0.1) + 'px';
    d.appendChild(i);
    return d;
  }

  var css = document.createElement('style');
  css.textContent =
    '.dno{display:inline-block;line-height:0;flex:none;vertical-align:middle;max-width:100%}.dno img{display:block;max-width:100%;height:auto;-webkit-user-drag:none;user-select:none;pointer-events:none}' +
    '.dno-h{position:relative;border-radius:50%;background:#FFE9CC;overflow:hidden;display:inline-block}.dno-h img.dno-hi{position:absolute;max-width:none}' +
    '.dno-in{animation:dvIn .8s cubic-bezier(.2,1.2,.4,1) both}' +
    '@keyframes dvIn{0%{opacity:0;transform:translateY(40px) scale(.7)}60%{opacity:1;transform:translateY(-8px) scale(1.04)}100%{opacity:1;transform:none}}' +
    '.empty .dno{margin-bottom:10px;animation:dvIn .7s cubic-bezier(.2,1.2,.4,1) both}' +
    '.pt.dnp{display:flex;align-items:center;justify-content:space-between;gap:6px}.pt .dnp-t{min-width:0}.pt .dno{animation:dvIn .8s cubic-bezier(.2,1.2,.4,1) both}' +
    '.dnl{display:flex;flex-direction:column;align-items:center;gap:12px}.dnb{width:132px;height:7px;border-radius:9px;background:#F3E3CC;overflow:hidden}' +
    '.dnb span{display:block;height:100%;width:42%;border-radius:9px;background:linear-gradient(90deg,#F39C32,#E2621A);animation:dnrun 1.15s ease-in-out infinite}' +
    '@keyframes dnrun{0%{transform:translateX(-105%)}100%{transform:translateX(250%)}}' +
    /* splash */
    '#dnSplash{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(75% 55% at 50% 40%,#FFFFFF,#FFF1DD 62%,#FFE2BD);font-family:Manrope,system-ui,sans-serif;clip-path:circle(150% at 50% 40%);overflow:hidden}' +
    '#dnSplash.out{clip-path:circle(0% at 50% 40%);transition:clip-path .85s cubic-bezier(.7,0,.25,1)}' +
    '#dnSplash .dn-orb{position:absolute;border-radius:50%;opacity:.55;filter:blur(2px);animation:dnorb 6s ease-in-out infinite}' +
    '@keyframes dnorb{50%{transform:translateY(-22px) scale(1.08)}}' +
    '#dnSplash .dn-hero{position:relative;width:min(70vw,320px);animation:dnhero 1s cubic-bezier(.2,1.25,.35,1) both}#dnSplash .dn-hero img{width:100%;height:auto}' +
    '#dnSplash .dn-hero:before{content:"";position:absolute;left:50%;top:46%;width:125%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,201,120,.55),rgba(255,201,120,0) 65%);z-index:-1;animation:dnglow 2.4s ease-in-out infinite}' +
    '@keyframes dnglow{50%{transform:translate(-50%,-50%) scale(1.12);opacity:.8}}' +
    '@keyframes dnhero{0%{opacity:0;transform:translateY(60px) scale(.6) rotate(-6deg)}100%{opacity:1;transform:none}}' +
    '#dnSplash .dn-hello{margin-top:6px;font-weight:800;font-size:26px;color:#2B3A78;letter-spacing:-.01em;animation:dnhi .6s .8s ease both}' +
    '#dnSplash .dn-tag{margin-top:6px;font-weight:600;font-size:14px;color:#8A7A6A;animation:dnhi .6s 1s ease both;text-align:center;padding:0 28px}' +
    '@keyframes dnhi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
    '#dnSplash .dn-bar{position:absolute;left:34px;right:34px;bottom:calc(40px + env(safe-area-inset-bottom,0px));height:10px;border-radius:9px;background:#F2DEC3;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.08);animation:dnhi .5s .5s ease both}' +
    '#dnSplash .dn-bar i{display:block;height:100%;width:0;border-radius:9px;background:linear-gradient(90deg,#F7B24A,#F39C32 55%,#E2621A);transition:width .5s cubic-bezier(.3,.7,.3,1);position:relative;overflow:hidden}' +
    '#dnSplash .dn-bar i:after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.6) 50%,transparent 70%);transform:translateX(-100%);animation:dnshine 1.2s infinite}' +
    '@keyframes dnshine{to{transform:translateX(100%)}}' +
    '#dnSplash.out .dn-hello,#dnSplash.out .dn-tag,#dnSplash.out .dn-bar{opacity:0;transition:opacity .25s}' +
    '#dnSplash.pop .dn-hero{animation:dnpop .6s cubic-bezier(.3,1.5,.5,1) both}@keyframes dnpop{0%{transform:none}45%{transform:translateY(-26px) scale(1.06)}100%{transform:none}}' +
    /* app khulne ka animation */
    'body.dn-go .screen.on{animation:dnApp .8s .18s cubic-bezier(.2,.9,.25,1) backwards}' +
    '@keyframes dnApp{from{opacity:0;transform:translateY(22px) scale(.97)}to{opacity:1;transform:none}}' +
    'body.dn-go .screen.on #view>*{animation:dnrise .6s cubic-bezier(.2,.9,.25,1) backwards}' +
    'body.dn-go .screen.on #view>*:nth-child(1){animation-delay:.3s}body.dn-go .screen.on #view>*:nth-child(2){animation-delay:.4s}body.dn-go .screen.on #view>*:nth-child(3){animation-delay:.5s}body.dn-go .screen.on #view>*:nth-child(4){animation-delay:.6s}body.dn-go .screen.on #view>*:nth-child(n+5){animation-delay:.7s}' +
    '@keyframes dnrise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}' +
    '.mw button.dnm{background:#FFE9CC;box-shadow:0 16px 30px -10px rgba(226,98,26,.5);animation:dnfloat 2.6s ease-in-out infinite}.mw button .dno-h{width:100%;height:100%}@keyframes dnfloat{50%{transform:translateY(-5px)}}' +
    '@media(prefers-reduced-motion:reduce){#dnSplash *{animation-duration:.01s!important}#dnSplash.out{transition-duration:.01s}}';
  document.head.appendChild(css);

  /* ---- splash: dino aata hai aur haath hilata hai, line bharti hai; ready hone par app khulta hai ---- */
  var S = { el: null, bar: null, img: null, t0: Date.now(), done: false, p: 0, tm: null, want: false };
  function splash() {
    if (S.el || !document.body) return;
    var s = document.createElement('div');
    s.id = 'dnSplash';
    s.innerHTML = '<i class="dn-orb" style="width:140px;height:140px;left:-40px;top:12%;background:#FFD9A0"></i><i class="dn-orb" style="width:90px;height:90px;right:-20px;top:30%;background:#FFC7B0;animation-delay:-2s"></i><i class="dn-orb" style="width:120px;height:120px;right:12%;bottom:18%;background:#FFE7B8;animation-delay:-4s"></i>' +
      '<div class="dn-hero"></div><div class="dn-hello">Namaste!</div><div class="dn-tag">Padho chahe kahin se, manzil milegi yahin se...</div><div class="dn-bar"><i></i></div>';
    S.img = img(); s.querySelector('.dn-hero').appendChild(S.img);
    document.body.appendChild(s);
    S.el = s; S.bar = s.querySelector('.dn-bar i');
    var step = function () {
      if (S.done) return;
      var e = Date.now() - S.t0;
      S.p = Math.min(92, 92 * (1 - Math.exp(-e / 900)));
      S.bar.style.width = S.p + '%';
      S.tm = setTimeout(step, 120);
    };
    step();
    setTimeout(function () { finish(true); }, 9000); // failsafe
  }
  function finish(force) {
    if (S.done || !S.el) return;
    if (!force && S.img && !S.img.complete) { S.img.addEventListener('load', function () { setTimeout(finish, 900); }); S.img.addEventListener('error', function () { finish(true); }); return; }
    S.done = true; clearTimeout(S.tm);
    S.bar.style.width = '100%';
    setTimeout(function () {
      S.el.classList.add('pop');
      setTimeout(function () {
        document.body.classList.add('dn-go');
        S.el.classList.add('out');
        setTimeout(function () { if (S.el && S.el.parentNode) S.el.parentNode.removeChild(S.el); setTimeout(function () { document.body.classList.remove('dn-go'); }, 1600); }, 900);
      }, 600);
    }, 450);
  }
  function ready() {
    var wait = Math.max(0, 2600 - (Date.now() - S.t0)); // dino ko kam se kam thoda hilne do
    setTimeout(finish, wait);
  }

  // browser tab icon
  try {
    var l = document.querySelector('link[rel="icon"]') || document.createElement('link');
    l.rel = 'icon'; l.type = 'image/png';
    l.href = 'data:image/png;base64,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';
    if (!l.parentNode) document.head.appendChild(l);
  } catch (e) {}

  window.DINO = { el: function (n, c, o) { return el(n, c, o); }, head: head, splash: splash, ready: ready, pick: pick };
  if (document.body) splash(); else document.addEventListener('DOMContentLoaded', splash);
})();
