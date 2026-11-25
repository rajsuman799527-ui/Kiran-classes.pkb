/* badges.js - Awards, XP rank badges and "days with us" shields. Alag file: index.html mein sirf <script src="badges.js"></script> chahiye.
   Settings: neeche TIERS (XP limits) aur DAYS (din wale milestones) badal sakte ho. */
(function(){
/* ---- Rank badges drawn in code (SVG). Reference: winged hexagon medals ---- */
var BP=[
 {L:'IV',r:['#ffd3a6','#eba070','#b8683a','#7d3f20'],f:['#6a3822','#3b1b0e'],t:['#ffd9b4','#e79a63'],w:['#ffd7b0','#e09a66','#a65e33'],glow:'#ff9a5c'},
 {L:'IV',r:['#fbfcff','#cfd2e2','#9296ad','#626479'],f:['#5c5d68','#2f3038'],t:['#ffffff','#c5c8d9'],w:['#ffffff','#c9ccdc','#8a8ea6'],glow:'#c9d0ff'},
 {L:'IV',r:['#fff4ae','#ffcf45','#dc9211','#a5620a'],f:['#97620f','#5e3908'],t:['#ffefb0','#f0b63a'],w:['#fff1b0','#ffc83a','#d88d10'],glow:'#ffc94a'},
 {L:'IV',r:['#f0f7ff','#b4ccf7','#7396e2','#4a6bb8'],f:['#7595d6','#3f5aa3'],t:['#ffffff','#c9dbff'],w:['#f2f8ff','#b4ccf7','#7396e2'],glow:'#7fb0ff'},
 {L:'V',r:['#f5f6ff','#cfd5f0','#939cca','#656fa8'],f:['#6d55ff','#3118b8'],t:['#ffffff','#d9d4ff'],w:['#f6f7ff','#cdd3ee','#8f98c6'],glow:'#8f7bff',spk:1},
 {L:'V',r:['#f5f6ff','#cfd5f0','#939cca','#656fa8'],f:['#9a52ff','#4b16b0'],t:['#ffffff','#e6d4ff'],w:['#f6f7ff','#cdd3ee','#8f98c6'],glow:'#b36bff',spk:1,ring:'#f4b73a',top:['#f2a8ff','#b04bff']},
 {gem:{hi:'#ff9cf6',mid:'#e24cf0',lo:'#b21fcb',deep:'#7b0f96',core:['#ffd1fb','#e24cf0']},r:['#fff0a4','#ffc93f','#dd9412','#a5620a'],f:['#6b1385','#3b0850'],w:['#fff0a4','#ffc93f','#dd9412'],wc:'#d33ae6',glow:'#e04dff',top:['#ffb3f8','#c93cdb']},
 {gem:{hi:'#ff8a8a',mid:'#f0303c',lo:'#c50f26',deep:'#8f0618',core:['#ffd0d0','#ff3b45']},r:['#fff0a4','#ffc93f','#dd9412','#a5620a'],f:['#7a0b18','#3e0309'],w:['#fff0a4','#ffc93f','#dd9412'],wc:'#e5253a',glow:'#ff4a4a',top:['#ffb0b0','#ee2b3a'],crown:1}
];
function badgeSVG(t){
 var P=BP[t],cx=262,cy=200,defs='',s='',k=0;
 function f(n){return Math.round(n*10)/10}
 function hex(R,c){var a=[];for(var i=0;i<6;i++){var q=(-90+60*i)*Math.PI/180;a.push([c[0]+R*Math.cos(q),c[1]+R*Math.sin(q)])}return a}
 function pts(a){return a.map(function(p){return f(p[0])+','+f(p[1])}).join(' ')}
 function poly(a,fill,ex){return '<polygon points="'+pts(a)+'" fill="'+fill+'"'+(ex||'')+'/>'}
 function mir(a){return a.map(function(p){return [2*cx-p[0],p[1]]})}
 function both(a,fill,ex){return poly(a,fill,ex)+poly(mir(a),fill,ex)}
 function lg(st,x1,y1,x2,y2){var id='g'+(++k);defs+='<linearGradient id="'+id+'" gradientUnits="userSpaceOnUse" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'">'+st.map(function(c,i){return '<stop offset="'+(i/(st.length-1))+'" stop-color="'+c+'"/>'}).join('')+'</linearGradient>';return 'url(#'+id+')'}
 function rg(st,x,y,r){var id='g'+(++k);defs+='<radialGradient id="'+id+'" gradientUnits="userSpaceOnUse" cx="'+x+'" cy="'+y+'" r="'+r+'">'+st.map(function(c,i){return '<stop offset="'+(i/(st.length-1))+'" stop-color="'+c+'"/>'}).join('')+'</radialGradient>';return 'url(#'+id+')'}
 var R=P.r,oy=P.crown?0:0;
 /* crown + fins (legend) drawn first so the medal sits on top */
 if(P.crown){
  s+=both([[150,92],[206,126],[214,168],[170,150],[128,118]],lg([R[0],R[2]],150,92,214,168));
  s+=both([[196,28],[236,92],[222,130],[190,96],[176,52]],lg([R[0],R[2]],196,28,236,130));
  s+=both([[112,150],[160,150],[168,190],[118,176]],lg([R[1],R[3]],112,150,168,190));
  s+=poly([[262,-30],[300,52],[262,104],[224,52]],lg([R[0],R[2]],224,-30,300,104));
  s+=poly([[262,-30],[300,52],[262,104]],R[2],' opacity=".55"');
  s+=both([[140,318],[206,340],[214,396],[170,376]],lg([R[1],R[3]],140,318,214,396));
 }
 /* wings */
 [[132,484],[188,458],[244,428]].forEach(function(w,i){var y=w[0],x=w[1];
  var top=[[372,y+8],[x,y-14],[x+6,y+16],[372,y+38]],bot=[[372,y+38],[x+6,y+16],[x-1,y+40],[372,y+60]];
  s+=both(top,lg([P.w[0],P.w[1]],372,y-14,x,y+38));
  s+=both(bot,lg([P.w[1],P.w[2]],372,y+38,x,y+60));
  if(P.wc)s+=both([[380,y+14],[x-12,y-2],[x-7,y+14],[380,y+32]],P.wc,' opacity=".92"');
  s+=both([[372,y+8],[x,y-14],[x-2,y-10],[372,y+11]],'#fff',' opacity=".55"');
 });
 var o=hex(145,[cx,cy]),n=hex(102,[cx,cy]);
 /* top spikes (tiers 4-5) */
 if(P.spk){s+=both([[346,98],[384,44],[398,110]],lg([R[0],R[2]],346,44,398,110));s+=both([[322,84],[340,50],[356,92]],lg([R[0],R[2]],322,50,356,92))}
 /* rim facets */
 var ec=[R[1],R[2],R[3],R[2],R[1],R[0]];
 for(var i=0;i<6;i++){var j=(i+1)%6;s+=poly([o[i],o[j],n[j],n[i]],ec[i],' stroke="'+ec[i]+'" stroke-width=".8" stroke-linejoin="round"')}
 s+='<polyline points="'+pts([o[5],o[0],o[1]])+'" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="3" stroke-linejoin="round"/>';
 s+='<polyline points="'+pts([o[4],o[5]])+'" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2.5"/>';
 s+='<polyline points="'+pts([o[1],o[2],o[3],o[4]])+'" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="2.5" stroke-linejoin="round"/>';
 for(i=0;i<6;i++){s+='<line x1="'+f(o[i][0])+'" y1="'+f(o[i][1])+'" x2="'+f(n[i][0])+'" y2="'+f(n[i][1])+'" stroke="#fff" stroke-opacity=".35" stroke-width="1.6"/>'}
 /* gold ring (tier 5) */
 if(P.ring){var rr=hex(108,[cx,cy]);s+='<polygon points="'+pts(rr)+'" fill="none" stroke="'+P.ring+'" stroke-width="6" stroke-linejoin="miter"/><polygon points="'+pts(rr)+'" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.4" transform="translate(0 -2)"/>'}
 /* ears */
 var ear=[[330,92],[404,118],[392,176],[352,152]];
 s+=both([[330,92],[404,118],[366,140]],lg([R[0],R[1]],330,92,404,118));
 s+=both([[404,118],[392,176],[366,140]],lg([R[2],R[3]],404,118,392,176));
 s+=both([[330,92],[366,140],[352,152]],R[1]);
 /* face */
 var cp='<clipPath id="fc"><polygon points="'+pts(n)+'"/></clipPath>';defs+=cp;
 s+=poly(n,lg(P.f,cx,98,cx,302));
 if(P.gem){
  var G=P.gem,g=hex(90,[cx,cy]),h=hex(52,[cx,cy]),gc=[G.mid,G.lo,G.deep,G.lo,G.mid,G.hi];
  s+=poly(g,G.deep);
  for(i=0;i<6;i++){j=(i+1)%6;s+=poly([g[i],g[j],h[j],h[i]],gc[i],' stroke="'+gc[i]+'" stroke-width=".8"')}
  for(i=0;i<6;i++){s+='<line x1="'+f(g[i][0])+'" y1="'+f(g[i][1])+'" x2="'+f(h[i][0])+'" y2="'+f(h[i][1])+'" stroke="#fff" stroke-opacity=".3" stroke-width="1.4"/>'}
  s+=poly(h,rg([G.core[0],G.core[1],G.lo],cx-14,cy-16,86));
  s+=poly([h[5],h[0],[cx,cy-8],[cx-30,cy+10]],'#fff',' opacity=".38"');
  s+='<polyline points="'+pts([g[5],g[0],g[1]])+'" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>';
 }else{
  s+='<g clip-path="url(#fc)">'+poly(hex(300,[cx,cy-40]).slice(0,1).concat([[cx-110,cy-6],[cx+110,cy-6]]),'#fff',' opacity=".07"')+'<polygon points="'+pts(n)+'" fill="none" stroke="#000" stroke-opacity=".38" stroke-width="12"/><ellipse cx="'+cx+'" cy="'+(cy+8)+'" rx="70" ry="64" fill="'+rg(['#fff','#fff'].map(function(c,i){return i?'#ffffff00':'#ffffff3a'}),cx,cy+8,72)+'"/></g>';
  var tf=lg(P.t,cx,150,cx,250);
  if(P.L==='V'){
   s+='<text x="'+cx+'" y="248" text-anchor="middle" font-family="Georgia,\'Times New Roman\',\'Noto Serif\',serif" font-weight="700" font-size="112" fill="#000" fill-opacity=".35" transform="translate(2 4)">V</text>';
   s+='<text x="'+cx+'" y="248" text-anchor="middle" font-family="Georgia,\'Times New Roman\',\'Noto Serif\',serif" font-weight="700" font-size="112" fill="'+tf+'" stroke="#fff" stroke-opacity=".5" stroke-width="1">V</text>';
  }else{
   s+='<text x="'+cx+'" y="244" text-anchor="middle" font-family="Georgia,\'Times New Roman\',\'Noto Serif\',serif" font-weight="700" font-size="104" fill="#000" fill-opacity=".35" transform="translate(2 4)">IV</text>';
   s+='<text x="'+cx+'" y="244" text-anchor="middle" font-family="Georgia,\'Times New Roman\',\'Noto Serif\',serif" font-weight="700" font-size="104" fill="'+tf+'" stroke="#fff" stroke-opacity=".45" stroke-width="1">IV</text>';
  }
 }
 /* top gem (tiers 5-7) */
 if(P.top){var tg=[[cx,22],[cx+24,52],[cx,84],[cx-24,52]];
  s+=poly([[cx,12],[cx+32,52],[cx,94],[cx-32,52]],lg([R[0],R[3]],cx-32,12,cx+32,94));
  s+=poly(tg,lg(P.top,cx-24,22,cx+24,84));s+=poly([tg[0],tg[1],[cx,52]],'#fff',' opacity=".35"');s+=poly([tg[3],tg[0],[cx,52]],'#fff',' opacity=".2"')}
 /* bottom diamond */
 var dc=[cx,338],dd=[[cx,290],[cx+40,dc[1]],[cx,388],[cx-40,dc[1]]];
 s+=poly(dd,lg([R[0],R[3]],cx-40,290,cx+40,388));
 s+=poly([dd[0],dd[1],[cx,dc[1]+6]],R[1]);s+=poly([dd[3],dd[0],[cx,dc[1]+6]],R[0]);s+=poly([dd[1],dd[2],[cx,dc[1]+6]],R[3]);s+=poly([dd[2],dd[3],[cx,dc[1]+6]],R[2]);
 if(P.gem||P.top){var bg=P.gem?P.gem:{};var gq=P.top||['#fff','#fff'];var d2=[[cx,306],[cx+22,dc[1]],[cx,370],[cx-22,dc[1]]];s+=poly(d2,lg(gq,cx-22,306,cx+22,370));s+=poly([d2[0],d2[1],[cx,dc[1]]],'#fff',' opacity=".3"')}
 else{s+=poly([[cx,312],[cx+14,dc[1]+4],[cx,362],[cx-14,dc[1]+4]],R[1],' opacity=".7"');s+=poly([[cx,312],[cx-14,dc[1]+4],[cx,dc[1]+4]],'#fff',' opacity=".45"')}
 s+='<polyline points="'+pts([dd[3],dd[0],dd[1]])+'" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linejoin="round"/>';
 var vb=P.crown?'0 -34 520 470':P.top?'20 0 480 400':'20 30 480 370';
 var q=vb.split(' ');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+vb+'" width="'+q[2]*2+'" height="'+q[3]*2+'"><defs>'+defs+'</defs>'+s+'</svg>';
}

var IMG=[],HD=[];for(var bi=0;bi<8;bi++){IMG[bi]=HD[bi]='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(badgeSVG(bi))}
var TIERS=[{xp:0,n:'Starter',g:'#c98a62'},{xp:500,n:'Silver',g:'#b9bccd'},{xp:1000,n:'Gold',g:'#f2b53a'},{xp:1500,n:'Platinum',g:'#9db1ee'},{xp:2500,n:'Amethyst',g:'#8f7bff'},{xp:4000,n:'Sapphire',g:'#b7a4ff'},{xp:6000,n:'Royal',g:'#d86be8'},{xp:10000,n:'Legend',g:'#ff5a5a'}];
var DAYS=[3,7,15,30,60,100,150,200,365];
var PAL=[['#43d0ff','#1479ff','#2fe6b8'],['#c59bff','#6a3df0','#ff7ad9'],['#ffd96e','#e08400','#fff3bf'],['#ff9a78','#d31c46','#ffd36b'],['#63f0ab','#0c9a69','#a3ecff'],['#a8e2ff','#3f6dff','#ffffff']];
var KB=window.KB={TIERS:TIERS,DAYS:DAYS,imgs:IMG},uid=0,last=0,busy=false,qq=[],open=false;
KB.tier=function(xp){xp=+xp||0;var t=0;for(var i=0;i<TIERS.length;i++)if(xp>=TIERS[i].xp)t=i;return t};
function E(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
var css=document.createElement('style');css.textContent=
'.kb-b{position:relative;display:inline-block;flex:none;vertical-align:middle;filter:drop-shadow(0 3px 7px var(--g,rgba(0,0,0,.35)))}.kb-b img{width:100%;height:100%;object-fit:contain;display:block}'+
'.kb-s i{position:absolute;inset:0;pointer-events:none;-webkit-mask:var(--m) center/contain no-repeat;mask:var(--m) center/contain no-repeat;background:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.9) 50%,transparent 58%) 100% 0/300% 100% no-repeat;animation:kbsh 3.2s ease-in-out infinite}'+
'@keyframes kbsh{0%{background-position:100% 0}55%,100%{background-position:0 0}}'+
'.kb-l{filter:none}.kb-l img{filter:grayscale(1) brightness(.55);opacity:.6}'+
'.kb-ov{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 26px) 26px calc(env(safe-area-inset-bottom,0px) + 22px);color:#fff;font-family:Poppins,Manrope,system-ui,sans-serif;background:#000;overflow:hidden;animation:kbfi .35s ease}'+
'@keyframes kbfi{from{opacity:0}to{opacity:1}}'+
'.kb-bg{position:absolute;inset:0;background:radial-gradient(70% 38% at 50% -6%,rgba(40,130,255,.75),rgba(10,60,160,.35) 55%,transparent 75%),radial-gradient(40% 34% at 18% -4%,rgba(30,110,255,.5),transparent 70%),radial-gradient(40% 34% at 84% -4%,rgba(30,110,255,.45),transparent 70%),linear-gradient(#06214d,#02060f 45%,#000)}'+
'.kb-bg:after{content:"";position:absolute;left:50%;bottom:24%;width:90%;height:90px;transform:translateX(-50%);background:radial-gradient(closest-side,rgba(70,160,255,.28),transparent);filter:blur(6px)}'+
'.kb-ov>*{position:relative}.kb-ov>.kb-bg,.kb-ov>.kb-cf{position:absolute}.kb-cf{inset:0;pointer-events:none}'+
'.kb-cf s{position:absolute;display:block;opacity:0;animation:kbcf var(--d,6s) ease-in-out var(--l,0s) infinite}'+
'@keyframes kbcf{0%{opacity:0;transform:translateY(14px) rotate(0)}20%{opacity:1}80%{opacity:.9}100%{opacity:0;transform:translateY(-26px) rotate(90deg)}}'+
'.kb-x{position:absolute!important;top:calc(env(safe-area-inset-top,0px) + 22px);right:22px;width:34px;height:34px;color:#fff;font-size:30px;line-height:30px;background:none;border:0;z-index:3}'+
'.kb-hd small{display:block;font-size:15px;letter-spacing:.04em;font-weight:500;margin-bottom:6px}.kb-hd h1{margin:0;font-size:clamp(30px,9.6vw,46px);line-height:1.02;font-weight:800;text-transform:uppercase;animation:kbup .6s ease both}.kb-hd p{margin:14px 0 0;font-size:17px;color:#aab4c8;font-weight:500}'+
'@keyframes kbup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}'+
'.kb-md{flex:1;display:grid;place-items:center;min-height:0}.kb-bdg{width:min(68vw,300px);animation:kbpop .9s cubic-bezier(.2,1.3,.4,1) both,kbfl 4s ease-in-out .9s infinite}.kb-bdg .kb-b,.kb-bdg svg{width:100%;height:auto;aspect-ratio:1;display:block}.kb-bdg .kb-b{filter:drop-shadow(0 10px 26px var(--g))}'+
'@keyframes kbpop{from{opacity:0;transform:scale(.45) rotate(-12deg)}to{opacity:1;transform:none}}@keyframes kbfl{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}'+
'.kb-cap{margin:0 0 20px;text-align:center;font-size:clamp(16px,4.6vw,20px);line-height:1.35;color:#c9d0de;font-weight:400;padding:0 8px}'+
'.kb-bt button{display:block;width:100%;height:56px;border-radius:99px;border:0;font:700 clamp(17px,4.8vw,20px) Poppins,Manrope,system-ui,sans-serif;margin-top:12px}.kb-bt .w{background:#fff;color:#000}.kb-bt .g{background:#4a4a4c;color:#fff}'+
'.kbg{margin:14px 16px 0;padding:16px;background:#fff;border:1px solid #EEF2FC;border-radius:22px;box-shadow:0 16px 34px -22px rgba(16,54,159,.45)}.kbg h4{margin:0 0 4px;font-size:18px;color:var(--nv,#0A1F5C)}.kbg>small{display:block;color:var(--bs,#6B7280);margin-bottom:12px}'+
'.kbg .gr{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.kbg .tl{text-decoration:none;border-radius:16px;background:linear-gradient(160deg,#141a33,#05070f);padding:10px 2px 8px;text-align:center;color:#fff;border:0;min-width:0}.kbg .tl b{display:block;font-size:11.5px;margin-top:4px}.kbg .tl small{display:block;font-size:10.5px;color:#9aa6c4}.kbg .tl.kcur{box-shadow:0 0 0 2px #FBBF24}'+
'.kbg .ds{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 6px}.kbg .dd{flex:none;width:74px;text-align:center;border:0;border-radius:16px;background:linear-gradient(160deg,#141a33,#05070f);padding:8px 4px;color:#fff}.kbg .dd small{display:block;font-size:10.5px;color:#9aa6c4;margin-top:2px}.kbg .dd.lk svg{filter:grayscale(1) brightness(.5);opacity:.6}';
document.head.appendChild(css);

KB.chip=function(xp,size,o){o=o||{};var t=o.tier!=null?o.tier:KB.tier(xp),w=E('span','kb-b'+(o.shine?' kb-s':'')+(o.locked?' kb-l':''));
 w.style.width=w.style.height=size+'px';var src=size>64?HD[t]:IMG[t];w.style.setProperty('--m','url("'+src+'")');w.style.setProperty('--g',TIERS[t].g+'99');
 var im=new Image();im.src=src;im.alt=TIERS[t].n+' badge';im.draggable=false;w.appendChild(im);if(o.shine)w.appendChild(E('i'));w.title=TIERS[t].n;return w};

/* "X days with us" shield (SVG, premium look: bezel + glossy face + stripes + moving shine) */
KB.shield=function(n,idx,noAnim){var P=PAL[idx%PAL.length],k=++uid,s=String(n),fs=s.length<2?112:s.length<3?92:72;
 var sh='M30 34Q30 20 46 20H194Q210 20 210 34V140C210 200 166 244 120 256C74 244 30 200 30 140Z',tr='translate(120 138) scale(.9) translate(-120 -138)';
 return '<svg viewBox="0 0 240 280" xmlns="http://www.w3.org/2000/svg"><defs>'+
 '<linearGradient id="a'+k+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#9aa7bd"/><stop offset=".55" stop-color="#f4f7fc"/><stop offset=".8" stop-color="#7f8ca6"/><stop offset="1" stop-color="#d8dfec"/></linearGradient>'+
 '<linearGradient id="f'+k+'" x1=".1" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="'+P[0]+'"/><stop offset="1" stop-color="'+P[1]+'"/></linearGradient>'+
 '<linearGradient id="s'+k+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+P[2]+'"/><stop offset="1" stop-color="'+P[0]+'"/></linearGradient>'+
 '<linearGradient id="m'+k+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6fb"/><stop offset="1" stop-color="#8b93aa"/></linearGradient>'+
 '<linearGradient id="g'+k+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'+
 '<linearGradient id="w'+k+'" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'+
 '<clipPath id="c'+k+'"><path d="'+sh+'"/></clipPath><clipPath id="i'+k+'"><path d="'+sh+'" transform="'+tr+'"/></clipPath></defs>'+
 '<path d="'+sh+'" fill="url(#a'+k+')"/><path d="'+sh+'" transform="'+tr+'" fill="url(#f'+k+')" stroke="#ffffff55" stroke-width="1.2"/>'+
 '<g clip-path="url(#i'+k+')"><path d="M236 52L50 262" stroke="url(#s'+k+')" stroke-width="30"/><path d="M262 108L110 280" stroke="url(#m'+k+')" stroke-width="24"/><path d="M270 160L160 290" stroke="url(#m'+k+')" stroke-width="20"/>'+
 '<ellipse cx="100" cy="52" rx="96" ry="42" fill="url(#g'+k+')"/></g>'+
 '<text x="98" y="'+(138+fs*.34)+'" text-anchor="middle" font-family="Poppins,Manrope,Arial,sans-serif" font-weight="800" font-size="'+fs+'" fill="'+P[1]+'" fill-opacity=".35" stroke="#eef4ff" stroke-width="4.5" stroke-linejoin="round">'+s+'</text>'+
 (noAnim?'':'<g clip-path="url(#c'+k+')"><rect x="-90" y="0" width="70" height="290" fill="url(#w'+k+')" transform="skewX(-18)"><animate attributeName="x" values="-110;300" dur="3.2s" repeatCount="indefinite"/></rect></g>'+
 '<g fill="#fff"><path d="M214 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"><animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite"/></path><path d="M22 190l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"><animate attributeName="opacity" values="1;0;1" dur="2.8s" repeatCount="indefinite"/></path></g>')+'</svg>'};

function fmtD(d){return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
function confetti(box){var cl=['#ff5cf0','#ffe45c','#5cf0ff','#7cff9e','#fff'];for(var i=0;i<16;i++){var s=E('s'),sz=3+Math.random()*7,r=Math.random();s.style.cssText='left:'+(6+Math.random()*88)+'%;top:'+(8+Math.random()*80)+'%;width:'+sz+'px;height:'+(r<.4?sz*2.2:sz)+'px;background:'+cl[i%5]+';border-radius:'+(r<.4?'50%':r<.7?'1px':'0')+';--d:'+(4+Math.random()*4)+'s;--l:-'+Math.random()*6+'s;'+(r>.7?'transform:rotate(45deg)':'');box.appendChild(s)}}

/* a = {kind:'day',n,idx,date} | {kind:'xp',tier,xp,date}  */
KB.award=function(a,done){
 var ov=E('div','kb-ov'),day=a.kind==='day',title,cap,badge;
 if(day){title=a.n+' DAY'+(a.n>1?'S':'')+'<br>WITH US';cap='You earned this by: joining us for '+a.n+' day'+(a.n>1?'s':'');var w=E('div');w.innerHTML=KB.shield(a.n,a.idx);badge=w}
 else{var T=TIERS[a.tier];title=T.xp+' XP<br>UNLOCKED';cap='You earned this by: reaching '+T.xp+' XP and getting the '+T.n+' rank';badge=KB.chip(0,300,{tier:a.tier,shine:true});badge.style.width='100%';badge.style.height='auto'}
 ov.innerHTML='<div class="kb-bg"></div><div class="kb-cf"></div><button class="kb-x" aria-label="Close">\u00d7</button><div class="kb-hd"><small>AWARDS</small><h1>'+title+'</h1><p></p></div><div class="kb-md"><div class="kb-bdg"></div></div><p class="kb-cap"></p><div class="kb-bt"><button class="w">Check Reward</button><button class="g">Share</button></div>';
 ov.querySelector('p').textContent=(day?'':TIERS[a.tier].n+'  \u2022  ')+fmtD(a.date||new Date());ov.querySelector('.kb-cap').textContent=cap;ov.querySelector('.kb-bdg').appendChild(badge);confetti(ov.querySelector('.kb-cf'));
 function close(){ov.style.transition='opacity .25s';ov.style.opacity=0;setTimeout(function(){ov.remove();open=false;if(done)done()},250)}
 ov.querySelector('.kb-x').onclick=close;ov.querySelector('.w').onclick=function(){close();setTimeout(function(){if(KB.onCheck)KB.onCheck()},300)};
 ov.querySelector('.g').onclick=function(){KB.share(a,cap)};
 document.body.appendChild(ov);open=true};

/* Share: picture of the award card (if phone allows) else text */
KB.share=function(a,cap){var day=a.kind==='day',brand=(KB.brand&&KB.brand())||'our app',txt=(day?'I completed '+a.n+' day'+(a.n>1?'s':'')+' with '+brand+'!':'I reached '+TIERS[a.tier].xp+' XP ('+TIERS[a.tier].n+' rank) on '+brand+'!')+' \ud83c\udfc6';
 function fallback(){try{if(navigator.share)return navigator.share({text:txt}).catch(function(){});if(navigator.clipboard){navigator.clipboard.writeText(txt);toastMsg('Copied. Now paste it anywhere')}}catch(e){}}
 function toastMsg(m){if(window.toast)window.toast(m)}
 var src=day?'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(KB.shield(a.n,a.idx,true).replace('<svg ','<svg width="560" height="653" ')):HD[a.tier],im=new Image();
 im.onload=function(){try{var W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d'),g=x.createRadialGradient(W/2,-60,40,W/2,0,H*.8);g.addColorStop(0,'#2b84ff');g.addColorStop(.45,'#06214d');g.addColorStop(1,'#000');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle='#fff';x.font='500 34px sans-serif';x.fillText('AWARDS',90,130);x.font='800 92px sans-serif';
  var l=(day?[a.n+' DAY'+(a.n>1?'S':''),'WITH US']:[TIERS[a.tier].xp+' XP','UNLOCKED']);x.fillText(l[0],90,240);x.fillText(l[1],90,340);
  x.fillStyle='#aab4c8';x.font='500 36px sans-serif';x.fillText(fmtD(a.date||new Date()),90,410);
  var bw=day?560:600,bh=day?653:600;var ar=(im.naturalWidth||im.width)/(im.naturalHeight||im.height)||1;if(!day){bw=640;bh=bw/ar;if(bh>640){bh=640;bw=bh*ar}}x.drawImage(im,(W-bw)/2,day?500:520+(640-bh)/2,bw,bh);
  x.fillStyle='#c9d0de';x.font='400 36px sans-serif';x.textAlign='center';x.fillText(cap.length>48?cap.slice(0,48):cap,W/2,1250);x.font='700 40px sans-serif';x.fillStyle='#fff';x.fillText(brand,W/2,1315);
  c.toBlob(function(b){try{var f=new File([b],'award.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f],text:txt}).catch(function(){});else fallback()}catch(e){fallback()}},'image/png')}catch(e){fallback()}};
 im.onerror=fallback;im.src=src};

function next(){if(open||!qq.length)return;var a=qq.shift();KB.award(a,function(){setTimeout(next,200)})}
KB.init=function(o){KB.api=o.api;KB.me=o.me;KB.brand=o.brand;KB.onCheck=o.onCheck;KB.st=o.store||{get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}}};
/* Naye awards check karo (3 / 7 / 15 days, XP rank up). Server se /xp leta hai. */
KB.check=function(force){var me=KB.me;if(!KB.api||!me||me.role==='teacher'||busy)return Promise.resolve();if(!force&&Date.now()-last<60000)return Promise.resolve();busy=true;last=Date.now();
 return KB.api('/xp').then(function(d){if(d.teacher)return;KB.xp=d.xp;KB.joined=d.joined;var id=me.id,days=Math.floor((Date.now()/1000-d.joined)/86400),hi=0,hiI=-1;
  DAYS.forEach(function(n,i){if(days>=n){hi=n;hiI=i}});var sd=+KB.st.get('kbd_'+id)||0;if(hi&&hi>sd){KB.st.set('kbd_'+id,String(hi));qq.push({kind:'day',n:hi,idx:hiI,date:new Date((d.joined+hi*86400)*1000)})}
  var t=KB.tier(d.xp),sx=+KB.st.get('kbx_'+id)||0;if(t>sx){KB.st.set('kbx_'+id,String(t));if(t>0)qq.push({kind:'xp',tier:t,xp:d.xp,date:new Date()})}
  document.dispatchEvent(new CustomEvent('kb-xp',{detail:d}));next()}).catch(function(){}).then(function(){busy=false})};

/* Profile: saare badges (rank badges + day shields) */
KB.gallery=function(host,xp,joined){var t=KB.tier(xp),c=E('div','kbg');c.appendChild(E('h4','','My badges'));c.appendChild(E('small','','Rank badges: earn XP from quizzes, classes and Live Objectives'));var g=E('div','gr');
 TIERS.forEach(function(T,i){var b=E('button','tl'+(i===t?' kcur':'')),lk=i>t;b.appendChild(KB.chip(0,58,{tier:i,locked:lk,shine:i===t}));b.appendChild(E('b','',T.n));b.appendChild(E('small','',i?T.xp+' XP':'Start'));if(!lk&&i>0)b.onclick=function(){KB.award({kind:'xp',tier:i,xp:T.xp,date:new Date()})};g.appendChild(b)});c.appendChild(g);
 var days=joined?Math.floor((Date.now()/1000-joined)/86400):0,h=E('h4','','Days with us');h.style.marginTop='16px';c.appendChild(h);var ds=E('div','ds');
 DAYS.forEach(function(n,i){var lk=days<n,b=E('button','dd'+(lk?' lk':''));b.innerHTML=KB.shield(n,i,true).replace('<svg ','<svg width="58" height="68" ');b.appendChild(E('small','',n+' days'));if(!lk)b.onclick=function(){KB.award({kind:'day',n:n,idx:i,date:new Date((joined+n*86400)*1000)})};ds.appendChild(b)});c.appendChild(ds);host.appendChild(c)};
})();
