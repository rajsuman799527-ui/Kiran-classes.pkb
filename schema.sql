-- Study app: poora database schema (Cloudflare D1)  |  naya DB: ye poori file ek baar chala do.
-- PURANA DB (jo already chal raha hai): kuch chalane ki zaroorat NAHI. Server naye columns, tables aur indexes khud bana leta hai.

CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student', created_at INTEGER, org_id INTEGER DEFAULT 1, phone TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE TABLE IF NOT EXISTS otps(email TEXT PRIMARY KEY, code_hash TEXT, name TEXT, expires INTEGER, tries INTEGER DEFAULT 0, sent INTEGER, phone TEXT);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER, expires INTEGER, tv INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS courses(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, thumb TEXT, thumb_s TEXT, created_at INTEGER, org_id INTEGER DEFAULT 1, price INTEGER, old_price INTEGER, badge TEXT, lang TEXT, duration TEXT, rating TEXT, reg_start TEXT, class_start TEXT, details TEXT);
CREATE TABLE IF NOT EXISTS enrollments(user_id INTEGER, course_id INTEGER, PRIMARY KEY(user_id, course_id));
CREATE TABLE IF NOT EXISTS enroll_requests(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER NOT NULL, user_id INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER, UNIQUE(course_id,user_id));
CREATE TABLE IF NOT EXISTS classes(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, title TEXT NOT NULL, status TEXT DEFAULT 'scheduled', thumb TEXT, scheduled_at INTEGER, subject TEXT, section TEXT, visibility TEXT DEFAULT 'private', video_url TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, class_id INTEGER, user_id INTEGER, name TEXT, role TEXT, body TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS chapters(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, subject TEXT, section TEXT, ref_id INTEGER, title TEXT NOT NULL, kind TEXT DEFAULT 'chapter', pdf_key TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS pdf_parts(chapter_id INTEGER, idx INTEGER, data TEXT, PRIMARY KEY(chapter_id, idx));
CREATE TABLE IF NOT EXISTS subjects(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, name TEXT, created_at INTEGER, UNIQUE(course_id, name));
CREATE TABLE IF NOT EXISTS sections(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, subject TEXT NOT NULL, name TEXT NOT NULL, created_at INTEGER, UNIQUE(course_id, subject, name));
CREATE TABLE IF NOT EXISTS quizzes(id INTEGER PRIMARY KEY AUTOINCREMENT, chapter_id INTEGER, course_id INTEGER, title TEXT, questions TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS attempts(id INTEGER PRIMARY KEY AUTOINCREMENT, quiz_id INTEGER, user_id INTEGER, correct INTEGER, total INTEGER, created_at INTEGER);
CREATE TABLE IF NOT EXISTS attendance(class_id INTEGER, user_id INTEGER, joined_at INTEGER, PRIMARY KEY(class_id, user_id));
CREATE TABLE IF NOT EXISTS class_sessions(id INTEGER PRIMARY KEY AUTOINCREMENT, class_id INTEGER NOT NULL, user_id INTEGER NOT NULL, name TEXT, joined_at INTEGER, last_seen INTEGER, left_at INTEGER);
CREATE TABLE IF NOT EXISTS hands(class_id INTEGER NOT NULL, user_id INTEGER NOT NULL, name TEXT, status TEXT NOT NULL DEFAULT 'up', muted INTEGER DEFAULT 0, at INTEGER, PRIMARY KEY(class_id,user_id));
CREATE TABLE IF NOT EXISTS timetables(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER NOT NULL, title TEXT, image TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS dm(id INTEGER PRIMARY KEY AUTOINCREMENT, from_id INTEGER, to_id INTEGER, body TEXT, created_at INTEGER, read_at INTEGER);
CREATE TABLE IF NOT EXISTS dm_typing(user_id INTEGER, to_id INTEGER, at INTEGER, PRIMARY KEY(user_id, to_id));
CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS ai_usage(user_id INTEGER, day TEXT, n INTEGER DEFAULT 0, PRIMARY KEY(user_id, day));
CREATE TABLE IF NOT EXISTS rec_uploads(class_id INTEGER, key TEXT PRIMARY KEY, upload_id TEXT, created_at INTEGER, done INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS rec_parts(key TEXT, n INTEGER, etag TEXT, PRIMARY KEY(key, n));
CREATE TABLE IF NOT EXISTS rc_codes(code_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, class_id INTEGER NOT NULL, exp INTEGER NOT NULL, claimed_at INTEGER);
CREATE TABLE IF NOT EXISTS teacher_otps(user_id INTEGER PRIMARY KEY, code_hash TEXT, expires INTEGER, tries INTEGER DEFAULT 0, sent INTEGER);
CREATE TABLE IF NOT EXISTS unlock_tries(user_id INTEGER PRIMARY KEY, n INTEGER DEFAULT 0, since INTEGER);
CREATE TABLE IF NOT EXISTS rate_limits(k TEXT PRIMARY KEY, n INTEGER, since INTEGER);

-- Live Objectives
CREATE TABLE IF NOT EXISTS class_objs(class_id INTEGER PRIMARY KEY, secs INTEGER DEFAULT 20, questions TEXT, updated_at INTEGER);
CREATE TABLE IF NOT EXISTS live_state(class_id INTEGER PRIMARY KEY, run INTEGER DEFAULT 0, status TEXT DEFAULT 'off', secs INTEGER, n INTEGER, started_ms INTEGER);
CREATE TABLE IF NOT EXISTS live_ans(class_id INTEGER, run INTEGER, idx INTEGER, user_id INTEGER, choice INTEGER, correct INTEGER, ms INTEGER, xp INTEGER, award INTEGER, PRIMARY KEY(class_id, run, idx, user_id));

-- Auto quiz
CREATE TABLE IF NOT EXISTS chapter_text(chapter_id INTEGER PRIMARY KEY, txt TEXT, updated INTEGER);
CREATE TABLE IF NOT EXISTS autoquiz(chapter_id INTEGER PRIMARY KEY, tries INTEGER DEFAULT 0, last INTEGER, note TEXT);
CREATE TABLE IF NOT EXISTS aq_draft(chapter_id INTEGER PRIMARY KEY, qs TEXT, calls INTEGER DEFAULT 0);

-- Indexes (speed)
CREATE INDEX IF NOT EXISTS ix_enr_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS ix_cls_course ON classes(course_id);
CREATE INDEX IF NOT EXISTS ix_chap_course ON chapters(course_id, subject);
CREATE INDEX IF NOT EXISTS ix_quiz_chapter ON quizzes(chapter_id);
CREATE INDEX IF NOT EXISTS ix_quiz_course ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS ix_att_user ON attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS ix_att_quiz ON attempts(quiz_id);
CREATE INDEX IF NOT EXISTS ix_attend_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS ix_msg_class ON messages(class_id, id);
CREATE INDEX IF NOT EXISTS ix_msg_user ON messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS ix_dm_pair ON dm(from_id, to_id, id);
CREATE INDEX IF NOT EXISTS ix_dm_to ON dm(to_id, read_at);
CREATE INDEX IF NOT EXISTS ix_sess_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS ix_sess_exp ON sessions(expires);
CREATE INDEX IF NOT EXISTS ix_req_course ON enroll_requests(course_id);
CREATE INDEX IF NOT EXISTS ix_req_user ON enroll_requests(user_id);
CREATE INDEX IF NOT EXISTS ix_tt_course ON timetables(course_id);
CREATE INDEX IF NOT EXISTS ix_users_role ON users(role);
CREATE INDEX IF NOT EXISTS ix_courses_org ON courses(org_id);
CREATE INDEX IF NOT EXISTS ix_rec_class ON rec_uploads(class_id);
CREATE INDEX IF NOT EXISTS ix_cs_cls ON class_sessions(class_id, user_id);
CREATE INDEX IF NOT EXISTS ix_lans_user ON live_ans(user_id);
CREATE INDEX IF NOT EXISTS ix_lans_cls ON live_ans(class_id, run);
