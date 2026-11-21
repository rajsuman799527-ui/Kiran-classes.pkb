// Kiran Classes backend. Cloudflare Pages Function: /api/*
// Bindings/Env: DB (D1), AGORA_APP_ID, AGORA_APP_CERTIFICATE, BREVO_API_KEY, BREVO_SENDER, TEACHER_PASSCODE

const E = new TextEncoder();
const J = (o, s = 200) => Response.json(o, { status: s });
const now = () => Math.floor(Date.now() / 1000);
const hex = (u) => [...u].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha = async (s) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', E.encode(s))));
const rnd = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));

/* ---- Agora token (AccessToken2) ---- */
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
const u16 = (n) => new Uint8Array([n & 255, (n >> 8) & 255]);
const u32 = (n) => new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
const ps = (s) => { const b = typeof s === 'string' ? E.encode(s) : s; return cat(u16(b.length), b); };
async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}
async function agoraToken(appId, cert, channel, uid, expire, privs) {
  const ts = now(), salt = Math.floor(Math.random() * 0xffffffff);
  let sg = await hmac(u32(ts), E.encode(cert));
  sg = await hmac(u32(salt), sg);
  const svc = cat(u16(1), u16(privs.length), ...privs.map((p) => cat(u16(p), u32(expire))), ps(channel), ps(uid));
  const info = cat(ps(appId), u32(ts), u32(expire), u32(salt), u16(1), svc);
  const content = cat(ps(await hmac(sg, info)), info);
  const cs = new CompressionStream('deflate'), w = cs.writable.getWriter();
  w.write(content); w.close();
  const z = new Uint8Array(await new Response(cs.readable).arrayBuffer());
  let bin = ''; z.forEach((b) => (bin += String.fromCharCode(b)));
  return '007' + btoa(bin);
}

/* ---- main ---- */
export async function onRequest({ request, env, params }) {
  const db = env.DB;
  if (!db) return J({ error: 'Database (DB) jodi nahi gayi hai.' }, 500);
  const method = request.method;
  const [a, b, c] = params.path || [];
  const url = new URL(request.url);
  let body = {};
  if (method !== 'GET') { try { body = await request.json(); } catch (e) {} }
  const Q = (sql, ...v) => db.prepare(sql).bind(...v);
  const bearer = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  const ckm = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)kc_tok=([0-9a-f]+)/);
  const cookie = (t, age) => 'kc_tok=' + t + '; Path=/; Max-Age=' + age + '; Secure; SameSite=Lax; HttpOnly';

  try {
    /* ----- signup / login by email code (Brevo) ----- */
    if (a === 'otp' && b === 'send' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return J({ error: 'Sahi email likho.' }, 400);
      const user = await Q('SELECT name FROM users WHERE email=?', email).first();
      const name = user ? user.name : String(body.name || '').trim().slice(0, 30);
      if (name.length < 2) return J({ error: 'Naam kam se kam 2 akshar ka likho.' }, 400);
      const old = await Q('SELECT sent FROM otps WHERE email=?', email).first();
      if (old && now() - old.sent < 45) return J({ error: 'Thoda ruko, 45 second baad dobara code mangao.' }, 429);
      const code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
      await Q('INSERT OR REPLACE INTO otps(email,code_hash,name,expires,tries,sent) VALUES(?,?,?,?,0,?)',
        email, await sha(email + ':' + code + ':' + env.BREVO_API_KEY), name, now() + 600, now()).run();
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Kiran Classes', email: env.BREVO_SENDER },
          to: [{ email, name }],
          subject: 'Kiran Classes: aapka verification code ' + code,
          htmlContent: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #E4EAF6;border-radius:16px"><h2 style="color:#1D4ED8;margin:0 0 6px">Kiran Classes</h2><p style="color:#0B1736">Namaste ${name.replace(/[<>&]/g, '')}, aapka verification code:</p><p style="font-size:34px;font-weight:800;letter-spacing:8px;color:#0A1F5C;margin:14px 0">${code}</p><p style="color:#62708F;font-size:13px">Ye code 10 minute tak chalega. Kisi ko mat batana.</p></div>`
        })
      });
      if (!res.ok) return J({ error: 'Email nahi bhej paye. Thodi der baad try karo.' }, 502);
      return J({ ok: true });
    }
    if (a === 'otp' && b === 'verify' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const code = String(body.code || '').trim();
      const row = await Q('SELECT * FROM otps WHERE email=?', email).first();
      if (!row || row.expires < now() || row.tries >= 5) return J({ error: 'Code purana ho gaya. Naya code mangao.' }, 400);
      if (row.code_hash !== await sha(email + ':' + code + ':' + env.BREVO_API_KEY)) {
        await Q('UPDATE otps SET tries=tries+1 WHERE email=?', email).run();
        return J({ error: 'Code galat hai.' }, 400);
      }
      await Q('DELETE FROM otps WHERE email=?', email).run();
      let user = await Q('SELECT * FROM users WHERE email=?', email).first();
      if (!user) {
        await Q('INSERT INTO users(email,name,role,created_at) VALUES(?,?,?,?)', email, row.name, 'student', now()).run();
        user = await Q('SELECT * FROM users WHERE email=?', email).first();
      }
      const token = rnd(32);
      await Q('INSERT INTO sessions(token_hash,user_id,expires) VALUES(?,?,?)', await sha(token), user.id, now() + 180 * 86400).run();
      return new Response(JSON.stringify({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }), { headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie(token, 180 * 86400) } });
    }

    if (a === 'logout' && method === 'POST') {
      for (const t of [bearer, ckm && ckm[1]]) if (t) await Q('DELETE FROM sessions WHERE token_hash=?', await sha(t)).run();
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie('', 0) } });
    }

    /* ----- everything below needs login ----- */
    const findUser = async (t) => (t ? await Q('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?', await sha(t), now()).first() : null);
    const u = (await findUser(bearer)) || (ckm ? await findUser(ckm[1]) : null);
    if (!u) return J({ error: 'Pehle login karo.' }, 401);
    const teacher = u.role === 'teacher';
    const needTeacher = () => J({ error: 'Ye sirf teachers ke liye hai.' }, 403);
    const access = async (classId) => {
      const cl = await Q('SELECT * FROM classes WHERE id=?', Number(classId)).first();
      if (!cl) return null;
      if (teacher) return cl;
      const en = await Q('SELECT 1 x FROM enrollments WHERE user_id=? AND course_id=?', u.id, cl.course_id).first();
      return en ? cl : null;
    };

    if (a === 'me') return J({ user: { id: u.id, name: u.name, email: u.email, role: u.role } });

    if (a === 'teacher' && b === 'unlock' && method === 'POST') {
      if (!env.TEACHER_PASSCODE || String(body.code || '') !== env.TEACHER_PASSCODE) return J({ error: 'Teaching code galat hai.' }, 403);
      await Q("UPDATE users SET role='teacher' WHERE id=?", u.id).run();
      return J({ ok: true });
    }

    if (a === 'courses' && !b && method === 'GET') {
      const { results } = await Q('SELECT c.id,c.title,c.description,c.thumb,(SELECT COUNT(*) FROM classes WHERE course_id=c.id) n,(SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id AND e.user_id=?) enrolled FROM courses c ORDER BY c.id DESC', u.id).all();
      return J({ courses: results });
    }
    if (a === 'courses' && !b && method === 'POST') {
      if (!teacher) return needTeacher();
      const t = String(body.title || '').trim().slice(0, 80);
      if (t.length < 3) return J({ error: 'Batch ka naam kam se kam 3 akshar ka likho.' }, 400);
      await Q('INSERT INTO courses(title,description,thumb,created_at) VALUES(?,?,?,?)', t, String(body.description || '').trim().slice(0, 300), String(body.thumb || '').slice(0, 200000), now()).run();
      return J({ ok: true });
    }
    if (a === 'courses' && c === 'enroll' && method === 'POST') {
      const co = await Q('SELECT id FROM courses WHERE id=?', Number(b)).first();
      if (!co) return J({ error: 'Batch nahi mila.' }, 404);
      await Q('INSERT OR IGNORE INTO enrollments(user_id,course_id) VALUES(?,?)', u.id, co.id).run();
      return J({ ok: true });
    }
    if (a === 'courses' && c === 'delete' && method === 'POST') {
      if (!teacher) return needTeacher();
      const id = Number(b);
      const co = await Q('SELECT id FROM courses WHERE id=?', id).first();
      if (!co) return J({ error: 'Batch not found.' }, 404);
      await db.batch([
        Q('DELETE FROM pdf_parts WHERE chapter_id IN (SELECT id FROM chapters WHERE course_id=?)', id),
        Q('DELETE FROM attempts WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id=?)', id),
        Q('DELETE FROM quizzes WHERE course_id=?', id),
        Q('DELETE FROM chapters WHERE course_id=?', id),
        Q('DELETE FROM messages WHERE class_id IN (SELECT id FROM classes WHERE course_id=?)', id),
        Q('DELETE FROM attendance WHERE class_id IN (SELECT id FROM classes WHERE course_id=?)', id),
        Q('DELETE FROM classes WHERE course_id=?', id),
        Q('DELETE FROM enrollments WHERE course_id=?', id),
        Q('DELETE FROM sections WHERE course_id=?', id),
        Q('DELETE FROM subjects WHERE course_id=?', id),
        Q('DELETE FROM courses WHERE id=?', id),
      ]);
      return J({ ok: true });
    }
    if (a === 'courses' && c === 'classes' && method === 'GET') {
      if (!teacher) {
        const en = await Q('SELECT 1 x FROM enrollments WHERE user_id=? AND course_id=?', u.id, Number(b)).first();
        if (!en) return J({ error: 'Pehle ye batch lo.' }, 403);
      }
      const { results } = await Q("SELECT id,title,status,thumb,scheduled_at,subject,COALESCE(visibility,'private') visibility,video_url FROM classes WHERE course_id=? ORDER BY COALESCE(scheduled_at,created_at) DESC", Number(b)).all();
      return J({ classes: results.map((k) => ({ ...k, video_url: teacher || k.status === 'ended' ? k.video_url : null })) });
    }

    if (a === 'console' && method === 'GET') {
      if (!teacher) return needTeacher();
      const { results } = await Q('SELECT c.id,c.title,c.description,c.thumb,(SELECT COUNT(*) FROM classes WHERE course_id=c.id) nc,(SELECT COUNT(*) FROM chapters WHERE course_id=c.id) nch,(SELECT COUNT(*) FROM quizzes WHERE course_id=c.id) nq,(SELECT COUNT(*) FROM enrollments WHERE course_id=c.id) ns FROM courses c ORDER BY c.id DESC').all();
      return J({ courses: results });
    }
    if (a === 'classes' && !b && method === 'POST') {
      if (!teacher) return needTeacher();
      const t = String(body.title || '').trim().slice(0, 80);
      const co = await Q('SELECT id FROM courses WHERE id=?', Number(body.course_id)).first();
      if (!co || t.length < 3) return J({ error: 'Class ka naam kam se kam 3 akshar ka likho.' }, 400);
      await Q('INSERT INTO classes(course_id,title,status,thumb,scheduled_at,subject,created_at) VALUES(?,?,?,?,?,?,?)', co.id, t, 'scheduled', String(body.thumb || '').slice(0, 200000), Number(body.scheduled_at) || null, String(body.subject || '').trim().slice(0, 40) || null, now()).run();
      return J({ ok: true });
    }
    if (a === 'classes' && c === 'status' && method === 'POST') {
      if (!teacher) return needTeacher();
      const st = body.status === 'live' ? 'live' : 'ended';
      await Q('UPDATE classes SET status=? WHERE id=?', st, Number(b)).run();
      return J({ ok: true });
    }

    if (a === 'classes' && c === 'subject' && method === 'POST') {
      if (!teacher) return needTeacher();
      await Q('UPDATE classes SET subject=? WHERE id=?', String(body.subject || '').trim().slice(0, 40) || null, Number(b)).run();
      return J({ ok: true });
    }
    if (a === 'classes' && c === 'visibility' && method === 'POST') {
      if (!teacher) return needTeacher();
      await Q('UPDATE classes SET visibility=? WHERE id=?', body.visibility === 'public' ? 'public' : 'private', Number(b)).run();
      return J({ ok: true });
    }
    if (a === 'classes' && c === 'video' && method === 'POST') {
      if (!teacher) return needTeacher();
      const vu = String(body.url || '').trim().slice(0, 500);
      if (vu && !/^https:\/\//i.test(vu)) return J({ error: 'Video link must start with https://' }, 400);
      await Q('UPDATE classes SET video_url=? WHERE id=?', vu || null, Number(b)).run();
      return J({ ok: true });
    }
    if (a === 'classes' && c === 'delete' && method === 'POST') {
      if (!teacher) return needTeacher();
      const id = Number(b);
      await db.batch([
        Q('DELETE FROM messages WHERE class_id=?', id),
        Q('DELETE FROM attendance WHERE class_id=?', id),
        Q('DELETE FROM classes WHERE id=?', id),
      ]);
      return J({ ok: true });
    }
    if (a === 'public' && b === 'recordings' && method === 'GET') {
      const { results } = await Q("SELECT cl.id,cl.title,cl.thumb,cl.scheduled_at,cl.video_url,c.title course FROM classes cl JOIN courses c ON c.id=cl.course_id WHERE cl.visibility='public' AND cl.status='ended' AND cl.video_url IS NOT NULL AND cl.video_url!='' ORDER BY cl.id DESC LIMIT 50").all();
      return J({ recordings: results });
    }

    /* ----- chapters, PDFs, quizzes, students, leaderboard ----- */
    const ownsCourse = async (cid) => teacher || !!(await Q('SELECT 1 x FROM enrollments WHERE user_id=? AND course_id=?', u.id, Number(cid)).first());
    const STAT = "SELECT u.id,u.name,u.email,u.created_at,(SELECT COUNT(*) FROM enrollments e WHERE e.user_id=u.id) batches,(SELECT COUNT(*) FROM attendance a WHERE a.user_id=u.id) attended,(SELECT COUNT(*) FROM attempts t WHERE t.user_id=u.id) quizzes,COALESCE((SELECT SUM(correct) FROM attempts t WHERE t.user_id=u.id),0) correct,COALESCE((SELECT SUM(total) FROM attempts t WHERE t.user_id=u.id),0) total FROM users u WHERE u.role='student'";
    // XP: 10 per class attended + per quiz (best attempt): 5 per correct + 10 completion + 10 if perfect
    const qxpOf = (b, tt) => b * 5 + 10 + (tt > 0 && b === tt ? 10 : 0);
    const myQx = async (uid) => {
      const { results } = await Q('SELECT MAX(correct) b,MAX(total) tt FROM attempts WHERE user_id=? GROUP BY quiz_id', uid).all();
      return results.reduce((s, r) => s + qxpOf(r.b, r.tt), 0);
    };
    const board = async () => {
      const { results } = await Q(STAT).all();
      const { results: bs } = await Q('SELECT user_id,MAX(correct) b,MAX(total) tt FROM attempts GROUP BY user_id,quiz_id').all();
      const qx = {}; bs.forEach((r) => { qx[r.user_id] = (qx[r.user_id] || 0) + qxpOf(r.b, r.tt); });
      return results.map((x) => ({ id: x.id, name: x.name, attended: x.attended, quizzes: x.quizzes, accuracy: x.total ? Math.round(100 * x.correct / x.total) : 0, points: x.attended * 10 + (qx[x.id] || 0) }))
        .sort((p, q) => q.points - p.points || q.accuracy - p.accuracy || p.id - q.id).map((x, i) => ({ ...x, rank: i + 1 }));
    };
    if (a === 'students' && b && method === 'GET') {
      if (!teacher) return needTeacher();
      const sid = Number(b);
      const s = await Q(STAT + ' AND u.id=?', sid).first();
      if (!s) return J({ error: 'Student not found.' }, 404);
      const bd = await board(); const mr = bd.find((x) => x.id === sid);
      const { results: bn } = await Q('SELECT c.title FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=?', sid).all();
      const { results: attempts } = await Q('SELECT t.correct,t.total,t.created_at,q.title,ch.subject FROM attempts t JOIN quizzes q ON q.id=t.quiz_id JOIN chapters ch ON ch.id=q.chapter_id WHERE t.user_id=? ORDER BY t.id DESC LIMIT 30', sid).all();
      const { results: subjects } = await Q('SELECT ch.subject,SUM(t.correct) c,SUM(t.total) tt,COUNT(*) n FROM attempts t JOIN quizzes q ON q.id=t.quiz_id JOIN chapters ch ON ch.id=q.chapter_id WHERE t.user_id=? GROUP BY ch.subject', sid).all();
      const { results: classes } = await Q('SELECT cl.title,a.joined_at FROM attendance a JOIN classes cl ON cl.id=a.class_id WHERE a.user_id=? ORDER BY a.joined_at DESC LIMIT 20', sid).all();
      return J({ student: s, rank: mr ? mr.rank : 0, points: mr ? mr.points : 0, total_students: bd.length, batch_names: bn.map((x) => x.title), attempts, subjects, classes });
    }
    if (a === 'students' && method === 'GET') {
      if (!teacher) return needTeacher();
      const { results } = await Q(STAT + ' ORDER BY u.id DESC').all();
      return J({ students: results });
    }
    if (a === 'leaderboard' && method === 'GET') {
      const bd = await board();
      return J({ leaderboard: bd.slice(0, 50), me: u.id, meRow: bd.find((x) => x.id === u.id) || null, total: bd.length });
    }
    if (a === 'sections' && !b && method === 'GET') {
      const cid = Number(url.searchParams.get('course_id'));
      if (!(await ownsCourse(cid))) return J({ error: 'Not allowed.' }, 403);
      const { results } = await Q('SELECT id,subject,name FROM sections WHERE course_id=? ORDER BY id', cid).all();
      return J({ sections: results });
    }
    if (a === 'sections' && !b && method === 'POST') {
      if (!teacher) return needTeacher();
      const nm = String(body.name || '').trim().slice(0, 40), sb = String(body.subject || '').trim().slice(0, 40);
      const co = await Q('SELECT id FROM courses WHERE id=?', Number(body.course_id)).first();
      if (!co || nm.length < 2 || !sb) return J({ error: 'Enter a section name.' }, 400);
      await Q('INSERT OR IGNORE INTO sections(course_id,subject,name,created_at) VALUES(?,?,?,?)', co.id, sb, nm, now()).run();
      return J({ ok: true });
    }
    if (a === 'sections' && c === 'delete' && method === 'POST') {
      if (!teacher) return needTeacher();
      const sc = await Q('SELECT * FROM sections WHERE id=?', Number(b)).first();
      if (!sc) return J({ error: 'Section not found.' }, 404);
      await db.batch([Q('UPDATE chapters SET section=NULL WHERE course_id=? AND subject=? AND section=?', sc.course_id, sc.subject, sc.name), Q('DELETE FROM sections WHERE id=?', sc.id)]);
      return J({ ok: true });
    }
    if (a === 'quizzes' && !b && method === 'GET' && url.searchParams.get('all')) {
      const where = teacher ? '' : ' WHERE q.course_id IN (SELECT course_id FROM enrollments WHERE user_id=?)';
      const { results } = await Q("SELECT q.id,q.title,q.questions,ch.title AS chapter,ch.subject,ch.section,c.title AS course,(SELECT correct||'/'||total FROM attempts t WHERE t.quiz_id=q.id AND t.user_id=? ORDER BY t.id DESC LIMIT 1) AS last,(SELECT MAX(correct) FROM attempts t WHERE t.quiz_id=q.id AND t.user_id=?) AS best FROM quizzes q JOIN chapters ch ON ch.id=q.chapter_id JOIN courses c ON c.id=q.course_id" + where + ' ORDER BY ch.subject,q.id DESC', ...(teacher ? [u.id, u.id] : [u.id, u.id, u.id])).all();
      return J({ quizzes: results.map((x) => ({ id: x.id, title: x.title, chapter: x.chapter, subject: x.subject, section: x.section, course: x.course, n: JSON.parse(x.questions).length, last: x.last, best: x.best })) });
    }
    if (a === 'subjects' && !b && method === 'GET') {
      const cid = Number(url.searchParams.get('course_id'));
      if (!(await ownsCourse(cid))) return J({ error: 'Not allowed.' }, 403);
      if (teacher) await Q("INSERT OR IGNORE INTO subjects(course_id,name,created_at) SELECT DISTINCT course_id,subject,? FROM chapters WHERE course_id=? AND subject IS NOT NULL AND subject!=''", now(), cid).run();
      const { results } = await Q('SELECT id,name FROM subjects WHERE course_id=? ORDER BY id', cid).all();
      return J({ subjects: results });
    }
    if (a === 'subjects' && !b && method === 'POST') {
      if (!teacher) return needTeacher();
      const nm = String(body.name || '').trim().slice(0, 40);
      const co = await Q('SELECT id FROM courses WHERE id=?', Number(body.course_id)).first();
      if (!co || nm.length < 2) return J({ error: 'Enter a subject name.' }, 400);
      await Q('INSERT OR IGNORE INTO subjects(course_id,name,created_at) VALUES(?,?,?)', co.id, nm, now()).run();
      return J({ ok: true });
    }
    if (a === 'subjects' && c === 'delete' && method === 'POST') {
      if (!teacher) return needTeacher();
      const sb = await Q('SELECT * FROM subjects WHERE id=?', Number(b)).first();
      if (!sb) return J({ error: 'Subject not found.' }, 404);
      const W = '(SELECT id FROM chapters WHERE course_id=? AND subject=?)';
      await db.batch([
        Q('DELETE FROM pdf_parts WHERE chapter_id IN ' + W, sb.course_id, sb.name),
        Q('DELETE FROM attempts WHERE quiz_id IN (SELECT id FROM quizzes WHERE chapter_id IN ' + W + ')', sb.course_id, sb.name),
        Q('DELETE FROM quizzes WHERE chapter_id IN ' + W, sb.course_id, sb.name),
        Q('DELETE FROM chapters WHERE course_id=? AND subject=?', sb.course_id, sb.name),
        Q('DELETE FROM sections WHERE course_id=? AND subject=?', sb.course_id, sb.name),
        Q('DELETE FROM subjects WHERE id=?', sb.id),
      ]);
      return J({ ok: true });
    }
    if (a === 'chapters' && c === 'rename' && method === 'POST') {
      if (!teacher) return needTeacher();
      const t = String(body.title || '').trim().slice(0, 100);
      if (t.length < 2) return J({ error: 'Enter a title.' }, 400);
      await Q('UPDATE chapters SET title=? WHERE id=?', t, Number(b)).run();
      return J({ ok: true });
    }
    if (a === 'chapters' && c === 'delete' && method === 'POST') {
      if (!teacher) return needTeacher();
      const id = Number(b);
      await db.batch([
        Q('UPDATE chapters SET ref_id=NULL WHERE ref_id=?', id),
        Q('DELETE FROM pdf_parts WHERE chapter_id=?', id),
        Q('DELETE FROM attempts WHERE quiz_id IN (SELECT id FROM quizzes WHERE chapter_id=?)', id),
        Q('DELETE FROM quizzes WHERE chapter_id=?', id),
        Q('DELETE FROM chapters WHERE id=?', id),
      ]);
      return J({ ok: true });
    }
    if (a === 'chapters' && !b && method === 'GET') {
      const w = [], v = [], cid = url.searchParams.get('course_id');
      if (cid) { w.push('ch.course_id=?'); v.push(Number(cid)); }
      const kd = url.searchParams.get('kind');
      if (kd) { w.push("COALESCE(ch.kind,'chapter')=?"); v.push(kd === 'note' ? 'note' : 'chapter'); }
      if (!teacher) { w.push('ch.course_id IN (SELECT course_id FROM enrollments WHERE user_id=?)'); v.push(u.id); }
      const { results } = await Q('SELECT ch.id,ch.course_id,ch.subject,ch.section,ch.ref_id,ch.title,COALESCE(ch.kind,\'chapter\') AS kind,(ch.pdf_key IS NOT NULL) AS has_pdf,(SELECT COUNT(*) FROM quizzes q WHERE q.chapter_id=ch.id) AS quizzes,c.title AS course FROM chapters ch JOIN courses c ON c.id=ch.course_id' + (w.length ? ' WHERE ' + w.join(' AND ') : '') + ' ORDER BY ch.subject, ch.section, ch.id', ...v).all();
      return J({ chapters: results });
    }
    if (a === 'chapters' && !b && method === 'POST') {
      if (!teacher) return needTeacher();
      const t = String(body.title || '').trim().slice(0, 100), sub = String(body.subject || 'General').trim().slice(0, 40) || 'General';
      const co = await Q('SELECT id FROM courses WHERE id=?', Number(body.course_id)).first();
      if (!co || t.length < 2) return J({ error: 'Enter a chapter title.' }, 400);
      const sec = String(body.section || '').trim().slice(0, 40) || null, ref = Number(body.ref_id) || null;
      const ins = await Q('INSERT INTO chapters(course_id,subject,section,ref_id,title,kind,created_at) VALUES(?,?,?,?,?,?,?)', co.id, sub, sec, ref, t, body.kind === 'note' ? 'note' : 'chapter', now()).run();
      if (sec) await Q('INSERT OR IGNORE INTO sections(course_id,subject,name,created_at) VALUES(?,?,?,?)', co.id, sub, sec, now()).run();
      await Q('INSERT OR IGNORE INTO subjects(course_id,name,created_at) VALUES(?,?,?)', co.id, sub, now()).run();
      return J({ ok: true, id: ins.meta.last_row_id });
    }
    if (a === 'chapters' && c === 'pdf') {
      const ch = await Q('SELECT * FROM chapters WHERE id=?', Number(b)).first();
      if (!ch || !(await ownsCourse(ch.course_id))) return J({ error: 'Not allowed.' }, 403);
      if (method === 'POST') {
        if (!teacher) return needTeacher();
        const i = Number(url.searchParams.get('i')), n = Number(url.searchParams.get('n')), d = String(body.data || '');
        if (!(i >= 0 && n > 0 && n <= 20 && i < n) || !d || d.length > 1100000) return J({ error: 'PDF must be under 14 MB.' }, 400);
        if (i === 0) { await Q('DELETE FROM pdf_parts WHERE chapter_id=?', ch.id).run(); await Q('UPDATE chapters SET pdf_key=NULL WHERE id=?', ch.id).run(); }
        await Q('INSERT OR REPLACE INTO pdf_parts(chapter_id,idx,data) VALUES(?,?,?)', ch.id, i, d).run();
        if (i === n - 1) await Q("UPDATE chapters SET pdf_key='d1' WHERE id=?", ch.id).run();
        return J({ ok: true });
      }
      const { results } = await Q('SELECT data FROM pdf_parts WHERE chapter_id=? ORDER BY idx', ch.id).all();
      if (!ch.pdf_key || !results.length) return J({ error: 'No PDF yet.' }, 404);
      return J({ parts: results.map((x) => x.data) });
    }
    if (a === 'quiz' && b === 'generate' && method === 'POST') {
      if (!teacher) return needTeacher();
      if (!env.AI) return J({ error: 'AI jodi nahi hai. Cloudflare > Pages project > Settings > Bindings > Add > Workers AI, variable name AI likho, Save karke Retry deployment karo.' }, 500);
      const avoid = (Array.isArray(body.avoid) ? body.avoid : []).slice(0, 40).map((x) => String(x).slice(0, 100));
      const text = String(body.text || '').slice(0, 6000), n = Math.min(10, Math.max(1, Number(body.count) || 5));
      if (text.length < 80) return J({ error: 'Not enough text to make questions.' }, 400);
      const strip = (o) => String(o).replace(/^\s*[A-Da-d][\).:]\s+/, '').trim();
      const norm = (x) => {
        if (!x || typeof x !== 'object') return null;
        const q = x.q || x.question;
        let opts = x.options || x.choices;
        if (opts && !Array.isArray(opts) && typeof opts === 'object') opts = Object.values(opts);
        if (typeof q !== 'string' || !Array.isArray(opts) || opts.length < 4) return null;
        opts = opts.slice(0, 4).map((o) => strip(o).slice(0, 200));
        let ans = x.answer ?? x.correct_answer ?? x.correctAnswer ?? x.correct;
        if (typeof ans === 'string') {
          const t = ans.trim();
          if (/^[A-D][\).:]?$/i.test(t)) ans = 'abcd'.indexOf(t[0].toLowerCase());
          else if (/^\d$/.test(t)) ans = parseInt(t, 10);
          else ans = opts.findIndex((o) => o.toLowerCase() === strip(t).toLowerCase());
        }
        if (!Number.isInteger(ans) || ans < 0 || ans > 3) return null;
        return { q: q.slice(0, 400), options: opts, answer: ans, explanation: String(x.explanation || '').slice(0, 300) };
      };
      let raw = '';
      const parseQs = (r) => {
        let v = r && r.response !== undefined ? r.response : (r && r.choices && r.choices[0] && r.choices[0].message ? r.choices[0].message.content : r);
        if (v && typeof v === 'object') v = JSON.stringify(v);
        raw = String(v || '');
        let arr = [];
        try { const m = raw.match(/\[[\s\S]*\]/); arr = JSON.parse(m ? m[0] : '[]'); } catch (e) { arr = []; }
        let out = Array.isArray(arr) ? arr.map(norm).filter(Boolean) : [];
        if (!out.length) {
          for (const m of raw.matchAll(/\{[^{}]*\}/g)) { try { const o = norm(JSON.parse(m[0])); if (o) out.push(o); } catch (e) {} }
        }
        return out;
      };
      let qs = [], lastErr = '';
      const models = [env.AI_MODEL, '@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/meta/llama-3.1-8b-instruct-fp8', '@cf/meta/llama-3.2-3b-instruct'].filter(Boolean);
      for (const model of models) {
        if (qs.length) break;
        try {
          const r = await env.AI.run(model, { max_tokens: 4096, temperature: 0.8, messages: [
            { role: 'system', content: 'You write exam multiple choice questions. Reply with ONLY a JSON array. No markdown, no commentary.' },
            { role: 'user', content: 'Text:\n' + text + '\n\nFrom the text above write ' + n + ' multiple choice questions. Variation #' + Math.floor(Math.random() * 1e6) + ': cover DIFFERENT facts and concepts each time.' + (avoid.length ? ' These questions already exist, do NOT repeat or reword them, ask about other points instead: ' + JSON.stringify(avoid) + '.' : '') + ' Write the questions, options and explanations in the SAME language as the text (Hindi text must give Hindi questions in Devanagari). Each item must be {"q":"question","options":["opt A","opt B","opt C","opt D"],"answer":0,"explanation":"one short line"} where answer is the index 0-3 of the correct option. Reply with only the JSON array.' }] });
          qs = parseQs(r);
        } catch (e) { lastErr = String(model).split('/').pop() + ': ' + (e && e.message ? e.message : String(e)); }
      }
      if (!qs.length && !lastErr) return J({ error: 'AI reply not usable: ' + (raw.slice(0, 160) || '(empty)') }, 502);
      if (!qs.length && lastErr) return J({ error: /neuron|allocation|quota|limit|4006/i.test(lastErr) ? 'AI ki aaj ki free limit khatam ho gayi. Kal dobara try karo ya Cloudflare mein Workers AI ka plan badlo.' : 'AI error: ' + lastErr }, 502);
      return J({ questions: qs });
    }
    if (a === 'quiz' && b === 'fix' && method === 'POST') {
      if (!teacher) return needTeacher();
      if (!env.AI) return J({ error: 'Workers AI is not connected.' }, 500);
      const items = (Array.isArray(body.questions) ? body.questions : []).slice(0, 10).map((x) => ({ q: String(x.q || '').slice(0, 400), options: (Array.isArray(x.options) ? x.options : []).slice(0, 4).map((o) => String(o).slice(0, 200)), explanation: String(x.explanation || '').slice(0, 300) }));
      if (!items.length) return J({ error: 'No questions.' }, 400);
      const models = [env.AI_MODEL, '@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/meta/llama-3.1-8b-instruct-fp8', '@cf/meta/llama-3.2-3b-instruct'].filter(Boolean);
      let fixed = null, lastErr = '';
      for (const model of models) {
        if (fixed) break;
        try {
          const r = await env.AI.run(model, { max_tokens: 4096, temperature: 0.1, messages: [
            { role: 'system', content: 'You are a careful Hindi and English proofreader for exam questions. Reply with ONLY a JSON array. No markdown, no commentary.' },
            { role: 'user', content: 'Proofread this JSON array of MCQs. Fix spelling mistakes, wrong or missing matras, wrong characters, broken words and grammar in the q, options and explanation text. Keep the same language and script (Devanagari stays Devanagari). Do NOT change the meaning, numbers, names, or the order of options. If a text is already correct, return it unchanged. Return a JSON array with exactly ' + items.length + ' items in the same order, each shaped {"q":"...","options":["...","...","...","..."],"explanation":"..."}.\\n\\n' + JSON.stringify(items) }] });
          let v = r && r.response !== undefined ? r.response : (r && r.choices && r.choices[0] && r.choices[0].message ? r.choices[0].message.content : r);
          if (v && typeof v === 'object') v = JSON.stringify(v);
          const m = String(v || '').match(/\[[\s\S]*\]/);
          const arr = JSON.parse(m ? m[0] : '[]');
          if (Array.isArray(arr) && arr.length === items.length && arr.every((x, i) => x && typeof x.q === 'string' && Array.isArray(x.options) && x.options.length === items[i].options.length)) {
            fixed = arr.map((x, i) => ({ q: x.q.trim().slice(0, 400) || items[i].q, options: x.options.map((o, k) => String(o).trim().slice(0, 200) || items[i].options[k]), explanation: String(x.explanation == null ? items[i].explanation : x.explanation).trim().slice(0, 300) }));
          }
        } catch (e) { lastErr = e && e.message ? e.message : String(e); }
      }
      if (!fixed) return J({ error: 'AI could not check this batch. ' + lastErr }, 502);
      return J({ questions: fixed });
    }
    if (a === 'quizzes' && !b && method === 'POST') {
      if (!teacher) return needTeacher();
      const ch = await Q('SELECT * FROM chapters WHERE id=?', Number(body.chapter_id)).first();
      const qs = Array.isArray(body.questions) ? body.questions.slice(0, 100) : [];
      if (!ch || !qs.length) return J({ error: 'Add at least one question.' }, 400);
      await Q('INSERT INTO quizzes(chapter_id,course_id,title,questions,created_at) VALUES(?,?,?,?,?)', ch.id, ch.course_id, String(body.title || ch.title + ' Quiz').slice(0, 100), JSON.stringify(qs), now()).run();
      return J({ ok: true });
    }
    if (a === 'quizzes' && !b && method === 'GET' && url.searchParams.get('course_id')) {
      const cid = Number(url.searchParams.get('course_id'));
      if (!(await ownsCourse(cid))) return J({ error: 'Not allowed.' }, 403);
      const { results } = await Q("SELECT q.id,q.title,q.questions,ch.title AS chapter,ch.subject,(SELECT correct||'/'||total FROM attempts t WHERE t.quiz_id=q.id AND t.user_id=? ORDER BY t.id DESC LIMIT 1) AS last FROM quizzes q JOIN chapters ch ON ch.id=q.chapter_id WHERE q.course_id=? ORDER BY ch.subject,q.id DESC", u.id, cid).all();
      return J({ quizzes: results.map((x) => ({ id: x.id, title: x.title, chapter: x.chapter, subject: x.subject, n: JSON.parse(x.questions).length, last: x.last })) });
    }
    if (a === 'quizzes' && c === 'delete' && method === 'POST') {
      if (!teacher) return needTeacher();
      await db.batch([Q('DELETE FROM attempts WHERE quiz_id=?', Number(b)), Q('DELETE FROM quizzes WHERE id=?', Number(b))]);
      return J({ ok: true });
    }
    if (a === 'quizzes' && !b && method === 'GET') {
      const ch = await Q('SELECT course_id FROM chapters WHERE id=?', Number(url.searchParams.get('chapter_id'))).first();
      if (!ch || !(await ownsCourse(ch.course_id))) return J({ error: 'Not allowed.' }, 403);
      const { results } = await Q('SELECT q.id,q.title,q.questions,(SELECT correct||\'/\'||total FROM attempts t WHERE t.quiz_id=q.id AND t.user_id=? ORDER BY t.id DESC LIMIT 1) AS last FROM quizzes q WHERE q.chapter_id=? ORDER BY q.id DESC', u.id, Number(url.searchParams.get('chapter_id'))).all();
      return J({ quizzes: results.map((x) => ({ id: x.id, title: x.title, n: JSON.parse(x.questions).length, last: x.last })) });
    }
    if (a === 'quizzes' && b && !c && method === 'GET') {
      const q = await Q('SELECT * FROM quizzes WHERE id=?', Number(b)).first();
      if (!q || !(await ownsCourse(q.course_id))) return J({ error: 'Not allowed.' }, 403);
      const qs = JSON.parse(q.questions);
      return J({ id: q.id, title: q.title, questions: qs.map((x) => ({ q: x.q, options: x.options })) });
    }
    if (a === 'quizzes' && c === 'submit' && method === 'POST') {
      const q = await Q('SELECT * FROM quizzes WHERE id=?', Number(b)).first();
      if (!q || !(await ownsCourse(q.course_id))) return J({ error: 'Not allowed.' }, 403);
      const qs = JSON.parse(q.questions), ans = Array.isArray(body.answers) ? body.answers : [];
      const review = qs.map((x, i) => ({ answer: x.answer, explanation: x.explanation || '', mine: Number.isInteger(ans[i]) ? ans[i] : -1 }));
      const correct = review.filter((x) => x.mine === x.answer).length;
      let xp = 0, rank = null, students = 0, first = true, prevBest = null;
      if (!teacher) {
        const pb = await Q('SELECT MAX(correct) b,COUNT(*) n FROM attempts WHERE quiz_id=? AND user_id=?', q.id, u.id).first();
        first = !pb || !pb.n; prevBest = first ? null : pb.b;
        const before = await myQx(u.id);
        await Q('INSERT INTO attempts(quiz_id,user_id,correct,total,created_at) VALUES(?,?,?,?,?)', q.id, u.id, correct, qs.length, now()).run();
        xp = (await myQx(u.id)) - before;
        const bd = await board(); students = bd.length; const mr = bd.find((x) => x.id === u.id); rank = mr ? mr.rank : null;
      }
      return J({ correct, total: qs.length, review, xp, first, prevBest, rank, students });
    }
    if (a === 'token' && method === 'POST') {
      const cl = await access(body.class_id);
      if (!cl) return J({ error: 'Is class mein aapko jaane ki permission nahi hai.' }, 403);
      if (cl.status !== 'live') return J({ error: 'Ye class abhi live nahi hai.' }, 400);
      if (!teacher) await Q('INSERT OR IGNORE INTO attendance(class_id,user_id,joined_at) VALUES(?,?,?)', cl.id, u.id, now()).run();
      const uid = (teacher ? 1000000000 : 2000000000) + Math.floor(Math.random() * 99999999); // har join ka alag uid, UID_CONFLICT nahi aayega
      const token = await agoraToken(env.AGORA_APP_ID, env.AGORA_APP_CERTIFICATE, 'kc' + cl.id, String(uid), 4 * 3600, teacher ? [1, 2, 3, 4] : [1]);
      return J({ appId: env.AGORA_APP_ID, token, channel: 'kc' + cl.id, uid });
    }

    if (a === 'chat' && method === 'GET') {
      const cl = await access(url.searchParams.get('class_id'));
      if (!cl) return J({ error: 'Permission nahi hai.' }, 403);
      const { results } = await Q('SELECT id,name,role,body FROM messages WHERE class_id=? AND id>? ORDER BY id LIMIT 100', cl.id, Number(url.searchParams.get('after') || 0)).all();
      return J({ messages: results, status: cl.status });
    }
    if (a === 'chat' && method === 'POST') {
      const cl = await access(body.class_id);
      const txt = String(body.body || '').trim().slice(0, 300);
      if (!cl || cl.status !== 'live') return J({ error: 'Class live nahi hai.' }, 403);
      if (!txt) return J({ error: 'Khali message nahi bhej sakte.' }, 400);
      await Q('INSERT INTO messages(class_id,user_id,name,role,body,created_at) VALUES(?,?,?,?,?,?)', cl.id, u.id, u.name, u.role, txt, now()).run();
      return J({ ok: true });
    }
    return J({ error: 'Not found' }, 404);
  } catch (e) {
    return J({ error: 'Server error: ' + (e && e.message ? e.message : e) }, 500);
  }
}
