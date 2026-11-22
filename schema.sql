CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student', created_at INTEGER);
CREATE TABLE IF NOT EXISTS otps(email TEXT PRIMARY KEY, code_hash TEXT, name TEXT, expires INTEGER, tries INTEGER DEFAULT 0, sent INTEGER);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER, expires INTEGER);
CREATE TABLE IF NOT EXISTS courses(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS enrollments(user_id INTEGER, course_id INTEGER, PRIMARY KEY(user_id, course_id));
CREATE TABLE IF NOT EXISTS classes(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, title TEXT NOT NULL, status TEXT DEFAULT 'scheduled', created_at INTEGER);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, class_id INTEGER, user_id INTEGER, name TEXT, role TEXT, body TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS chapters(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, subject TEXT, title TEXT NOT NULL, pdf_key TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS quizzes(id INTEGER PRIMARY KEY AUTOINCREMENT, chapter_id INTEGER, course_id INTEGER, title TEXT, questions TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS attempts(id INTEGER PRIMARY KEY AUTOINCREMENT, quiz_id INTEGER, user_id INTEGER, correct INTEGER, total INTEGER, created_at INTEGER);
CREATE TABLE IF NOT EXISTS attendance(class_id INTEGER, user_id INTEGER, joined_at INTEGER, PRIMARY KEY(class_id, user_id));
CREATE TABLE IF NOT EXISTS pdf_parts(chapter_id INTEGER, idx INTEGER, data TEXT, PRIMARY KEY(chapter_id, idx));
CREATE TABLE IF NOT EXISTS subjects(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, name TEXT, created_at INTEGER, UNIQUE(course_id, name));
-- Run once each (existing DB): ALTER TABLE classes ADD COLUMN visibility TEXT DEFAULT 'private';
-- Run once each (existing DB): ALTER TABLE classes ADD COLUMN video_url TEXT;
-- Run once (existing DB): ALTER TABLE chapters ADD COLUMN kind TEXT DEFAULT 'chapter';

CREATE TABLE IF NOT EXISTS sections(id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, subject TEXT NOT NULL, name TEXT NOT NULL, created_at INTEGER, UNIQUE(course_id, subject, name));
-- Run once each (existing DB): ALTER TABLE chapters ADD COLUMN section TEXT;
-- Run once each (existing DB): ALTER TABLE chapters ADD COLUMN ref_id INTEGER;
-- Run once (existing DB): ALTER TABLE classes ADD COLUMN subject TEXT;

CREATE TABLE IF NOT EXISTS dm(id INTEGER PRIMARY KEY AUTOINCREMENT, from_id INTEGER, to_id INTEGER, body TEXT, created_at INTEGER, read_at INTEGER);
CREATE TABLE IF NOT EXISTS dm_typing(user_id INTEGER, to_id INTEGER, at INTEGER, PRIMARY KEY(user_id, to_id));

CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS ai_usage(user_id INTEGER, day TEXT, n INTEGER DEFAULT 0, PRIMARY KEY(user_id, day));
CREATE TABLE IF NOT EXISTS rec_uploads(class_id INTEGER, key TEXT PRIMARY KEY, upload_id TEXT, created_at INTEGER, done INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS rec_parts(key TEXT, n INTEGER, etag TEXT, PRIMARY KEY(key, n));
