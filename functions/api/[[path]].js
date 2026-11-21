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
      await Q('INSERT INTO sessions(token_hash,user_id,expires) VALUES(?,?,?)', await sha(token), user.id, now() + 30 * 86400).run();
      return J({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }

    /* ----- everything below needs login ----- */
    const tk = (request.headers.get('Authorization') || '').replace('Bearer ', '');
    const u = tk ? await Q('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?', await sha(tk), now()).first() : null;
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
      const { results } = await Q("SELECT id,title,status,thumb,scheduled_at,COALESCE(visibility,'private') visibility,video_url FROM classes WHERE course_id=? ORDER BY COALESCE(scheduled_at,created_at) DESC", Number(b)).all();
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
      await Q('INSERT INTO classes(course_id,title,status,thumb,scheduled_at,created_at) VALUES(?,?,?,?,?,?)', co.id, t, 'scheduled', String(body.thumb || '').slice(0, 200000), Number(body.scheduled_at) || null, now()).run();
      return J({ ok: true });
    }
    if (a === 'classes' && c === 'status' && method === 'POST') {
      if (!teacher) return needTeacher();
      const st = body.status === 'live' ? 'live' : 'ended';
      await Q('UPDATE classes SET status=? WHERE id=?', st, Number(b)).run();
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
      const { results } = await Q('SELECT ch.id,ch.course_id,ch.subject,ch.title,COALESCE(ch.kind,'chapter') AS kind,(ch.pdf_key IS NOT NULL) AS has_pdf,(SELECT COUNT(*) FROM quizzes q WHERE q.chapter_id=ch.id) AS quizzes,c.title AS course FROM chapters ch JOIN courses c ON c.id=ch.course_id' + (w.length ? ' WHERE ' + w.join(' AND ') : '') + ' ORDER BY ch.subject, ch.id', ...v).all();
      return J({ chapters: results });
    }
    if (a === 'chapters' && !b && method === 'POST') {
      if (!teacher) return needTeacher();
      const t = String(body.title || '').trim().slice(0, 100), sub = String(body.subject || 'General').trim().slice(0, 40) || 'General';
      const co = await Q('SELECT id FROM courses WHERE id=?', Number(body.course_id)).first();
      if (!co || t.length < 2) return J({ error: 'Enter a chapter title.' }, 400);
      const ins = await Q('INSERT INTO chapters(course_id,subject,title,kind,created_at) VALUES(?,?,?,?,?)', co.id, sub, t, body.kind === 'note' ? 'note' : 'chapter', now()).run();
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
      if (!env.AI) return J({ error: 'Workers AI (AI) is not connected.' }, 500);
      const text = String(body.text || '').slice(0, 6000), n = Math.min(10, Math.max(1, Number(body.count) || 5));
      if (text.length < 80) return J({ error: 'Not enough text to make questions.' }, 400);
      const r = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { max_tokens: 2800, messages: [
        { role: 'system', content: 'You write exam multiple choice questions. Reply with ONLY a JSON array. No markdown, no commentary.' },
        { role: 'user', content: 'From the text below write ' + n + ' multiple choice questions in English. Each item must be {"q":"question","options":["opt A","opt B","opt C","opt D"],"answer":0,"explanation":"one short line"} where answer is the index 0-3 of the correct option. Text:\n' + text }] });
      let arr = [];
      try { const m = String(r.response || '').match(/\[[\s\S]*\]/); arr = JSON.parse(m ? m[0] : '[]'); } catch (e) {}
      const qs = arr.filter((x) => x && typeof x.q === 'string' && Array.isArray(x.options) && x.options.length === 4 && Number.isInteger(x.answer) && x.answer >= 0 && x.answer < 4)
        .map((x) => ({ q: x.q.slice(0, 400), options: x.options.map((o) => String(o).slice(0, 200)), answer: x.answer, explanation: String(x.explanation || '').slice(0, 300) }));
      return J({ questions: qs });
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
      if (!teacher) await Q('INSERT INTO attempts(quiz_id,user_id,correct,total,created_at) VALUES(?,?,?,?,?)', q.id, u.id, correct, qs.length, now()).run();
      return J({ correct, total: qs.length, review });
    }
    const STAT = "SELECT u.id,u.name,u.email,(SELECT COUNT(*) FROM enrollments e WHERE e.user_id=u.id) batches,(SELECT COUNT(*) FROM attendance a WHERE a.user_id=u.id) attended,(SELECT COUNT(*) FROM attempts t WHERE t.user_id=u.id) quizzes,COALESCE((SELECT SUM(correct) FROM attempts t WHERE t.user_id=u.id),0) correct,COALESCE((SELECT SUM(total) FROM attempts t WHERE t.user_id=u.id),0) total FROM users u WHERE u.role='student'";
    if (a === 'students' && method === 'GET') {
      if (!teacher) return needTeacher();
      const { results } = await Q(STAT + ' ORDER BY u.id DESC').all();
      return J({ students: results });
    }
    if (a === 'leaderboard' && method === 'GET') {
      const { results } = await Q(STAT).all();
      const list = results.map((x) => ({ id: x.id, name: x.name, attended: x.attended, quizzes: x.quizzes, accuracy: x.total ? Math.round(100 * x.correct / x.total) : 0, points: x.attended * 10 + x.correct * 5 }))
        .sort((p, q) => q.points - p.points || q.accuracy - p.accuracy).slice(0, 50);
      return J({ leaderboard: list, me: u.id });
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
