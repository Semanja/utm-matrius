-- Компании (Matrius, Zerocoder)
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Сайты → теги (utm_campaign)
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  url TEXT NOT NULL,
  tag TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(company_id, url)
);

-- Каналы по веткам мастера
-- branch: 'announce' | 'smm' | 'guide' | 'ads'
-- group_name: для anonse — платформа (email/tg-bot/...); для ads — имя человека или 'other'
CREATE TABLE IF NOT EXISTS channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  branch TEXT NOT NULL,
  group_name TEXT,
  display_name TEXT NOT NULL,
  utm_source TEXT NOT NULL,
  utm_medium TEXT,
  needs_url_slug INTEGER DEFAULT 0,
  needs_manual_medium INTEGER DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Места размещения (для ветки Гайд)
CREATE TABLE IF NOT EXISTS placements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  value TEXT NOT NULL,
  display_name TEXT,
  deleted_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(company_id, value)
);

-- Журнал изменений + откат
-- action: 'create' | 'update' | 'delete' | 'restore'
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Админы (один пока, схема готова под несколько)
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
