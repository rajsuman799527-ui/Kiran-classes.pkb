-- Kiran Classes: poora database schema (Cloudflare D1)
-- NAYA database: ye poori file ek baar chala do.
-- PURANA database: sirf neeche "LIVE OBJECTIVES" wali 2 tables chalao.

CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student', created_at INTEGER);
CREATE TABLE IF NOT EXISTS otps(email TEXT PRIMARY KEY, code_hash TEXT, name TEXT, expires INTEGER, tries INTEGER DEFAULT 0, sent INTEGER);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER, expires INTEGER);
CREATE TABLE IF NOT EXISTS courses(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, thumb TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS enrollments(user_id INTEGER, course_id INTEGER, PRIMARY KEY(user_id, course_id));
CREATE TABLE IF NOT EXISTS classes(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, title TEXT NOT NULL, status TEXT DEFAULT 'scheduled', thumb TEXT, scheduled_at INTEGER, subject TEXT, visibility TEXT DEFAULT 'private', video_url TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, class_id INTEGER, user_id INTEGER, name TEXT, role TEXT, body TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS chapters(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, subject TEXT, section TEXT, ref_id INTEGER, title TEXT NOT NULL, kind TEXT DEFAULT 'chapter', pdf_key TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS quizzes(id INTEGER PRIMARY KEY AUTOINCREMENT, chapter_id INTEGER, course_id INTEGER, title TEXT, questions TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS attempts(id INTEGER PRIMARY KEY AUTOINCREMENT, quiz_id INTEGER, user_id INTEGER, correct INTEGER, total INTEGER, created_at INTEGER);
CREATE TABLE IF NOT EXISTS attendance(class_id INTEGER, user_id INTEGER, joined_at INTEGER, PRIMARY KEY(class_id, user_id));
CREATE TABLE IF NOT EXISTS pdf_parts(chapter_id INTEGER, idx INTEGER, data TEXT, PRIMARY KEY(chapter_id, idx));
CREATE TABLE IF NOT EXISTS subjects(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, name TEXT, created_at INTEGER, UNIQUE(course_id, name));
CREATE TABLE IF NOT EXISTS sections(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, subject TEXT NOT NULL, name TEXT NOT NULL, created_at INTEGER, UNIQUE(course_id, subject, name));
CREATE TABLE IF NOT EXISTS dm(id INTEGER PRIMARY KEY AUTOINCREMENT, from_id INTEGER, to_id INTEGER, body TEXT, created_at INTEGER, read_at INTEGER);
CREATE TABLE IF NOT EXISTS dm_typing(user_id INTEGER, to_id INTEGER, at INTEGER, PRIMARY KEY(user_id, to_id));
CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS ai_usage(user_id INTEGER, day TEXT, n INTEGER DEFAULT 0, PRIMARY KEY(user_id, day));
CREATE TABLE IF NOT EXISTS rec_uploads(class_id INTEGER, key TEXT PRIMARY KEY, upload_id TEXT, created_at INTEGER, done INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS rec_parts(key TEXT, n INTEGER, etag TEXT, PRIMARY KEY(key, n));

-- ===== LIVE OBJECTIVES (naya) =====
CREATE TABLE IF NOT EXISTS live_quiz(class_id INTEGER PRIMARY KEY, questions TEXT, secs INTEGER DEFAULT 10, status TEXT DEFAULT 'off', started_at INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS live_answers(class_id INTEGER, run INTEGER, idx INTEGER, user_id INTEGER, name TEXT, choice INTEGER, correct INTEGER, xp INTEGER, at INTEGER, PRIMARY KEY(class_id, run, idx, user_id));
CREATE INDEX IF NOT EXISTS live_answers_user ON live_answers(user_id);

-- Agar purana DB hai aur ye columns nahi hain to ek-ek baar chalao:
-- ALTER TABLE courses ADD COLUMN thumb TEXT;
-- ALTER TABLE classes ADD COLUMN thumb TEXT;
-- ALTER TABLE classes ADD COLUMN scheduled_at INTEGER;
-- ALTER TABLE classes ADD COLUMN subject TEXT;
-- ALTER TABLE classes ADD COLUMN visibility TEXT DEFAULT 'private';
-- ALTER TABLE classes ADD COLUMN video_url TEXT;
-- ALTER TABLE chapters ADD COLUMN kind TEXT DEFAULT 'chapter';
-- ALTER TABLE chapters ADD COLUMN section TEXT;
-- ALTER TABLE chapters ADD COLUMN ref_id INTEGER;
CREATE TABLE IF NOT EXISTS timetables(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER NOT NULL, title TEXT, image TEXT, created_at INTEGER);
