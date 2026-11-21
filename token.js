// Cloudflare Pages Function: /api/token?channel=class1&uid=1234567
// Agora AccessToken2 (007) banata hai. Env vars: 262e2535d7c440988d6b4b4532194c56, 8063a4634d6e40ddbe362c797a72dd21

const enc = new TextEncoder();
const concat = (...a) => {
  const out = new Uint8Array(a.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of a) { out.set(x, o); o += x.length; }
  return out;
};
const u16 = (n) => new Uint8Array([n & 255, (n >> 8) & 255]);
const u32 = (n) => new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
const pstr = (s) => { const b = typeof s === 'string' ? enc.encode(s) : s; return concat(u16(b.length), b); };

async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}

async function buildToken(appId, cert, channel, uid, expireSec) {
  const issueTs = Math.floor(Date.now() / 1000);
  const salt = Math.floor(Math.random() * 0xffffffff);

  let signing = await hmac(u32(issueTs), enc.encode(cert));
  signing = await hmac(u32(salt), signing);

  // RTC service: join(1), publish audio(2), video(3), data(4)
  const privileges = [1, 2, 3, 4];
  const service = concat(
    u16(1),
    u16(privileges.length),
    ...privileges.map((p) => concat(u16(p), u32(expireSec))),
    pstr(channel),
    pstr(uid)
  );

  const info = concat(pstr(appId), u32(issueTs), u32(expireSec), u32(salt), u16(1), service);
  const signature = await hmac(signing, info);
  const content = concat(pstr(signature), info);

  const cs = new CompressionStream('deflate');
  const w = cs.writable.getWriter();
  w.write(content);
  w.close();
  const zipped = new Uint8Array(await new Response(cs.readable).arrayBuffer());

  let bin = '';
  zipped.forEach((b) => (bin += String.fromCharCode(b)));
  return '007' + btoa(bin);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const channel = url.searchParams.get('channel') || '';
  const uid = url.searchParams.get('uid') || '';

  if (!/^[A-Za-z0-9_-]{1,64}$/.test(channel) || !/^\d{1,10}$/.test(uid)) {
    return Response.json({ error: 'Invalid channel or uid' }, { status: 400 });
  }
  if (!env.AGORA_APP_ID || !env.AGORA_APP_CERTIFICATE) {
    return Response.json({ error: 'Server keys missing (AGORA_APP_ID / AGORA_APP_CERTIFICATE)' }, { status: 500 });
  }

  const token = await buildToken(env.AGORA_APP_ID, env.AGORA_APP_CERTIFICATE, channel, uid, 3600 * 3);
  return Response.json({ appId: env.AGORA_APP_ID, token, channel, uid });
}
