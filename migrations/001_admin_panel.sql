-- ═══════════════════════════════════════════════════════════
-- Waptrix Admin Panel — DB Migration
-- Run this in your Supabase SQL editor
-- ═══════════════════════════════════════════════════════════

-- 1. Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'support'
                CHECK (role IN ('super_admin','admin','support','finance','operations')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Admin audit logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email  TEXT,
  action       TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    TEXT,
  details      JSONB DEFAULT '{}',
  old_values   JSONB,
  new_values   JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL,
  user_email   TEXT NOT NULL,
  user_name    TEXT,
  subject      TEXT NOT NULL,
  description  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','in_progress','resolved','closed')),
  priority     TEXT NOT NULL DEFAULT 'medium'
               CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to  UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  admin_id   UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  is_admin   BOOLEAN NOT NULL DEFAULT true,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Platform notifications
CREATE TABLE IF NOT EXISTS platform_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  target      TEXT NOT NULL DEFAULT 'all' CHECK (target IN ('all','user')),
  tenant_id   UUID,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','warning','success','error')),
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Add user_status column to auth.users profiles if not exists
-- (We'll use a separate table for admin-managed user status)
CREATE TABLE IF NOT EXISTS user_status (
  user_id    UUID PRIMARY KEY,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deactivated')),
  reason     TEXT,
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Plans table (if not exists)
CREATE TABLE IF NOT EXISTS plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly  NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_quarterly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly   NUMERIC(10,2) NOT NULL DEFAULT 0,
  features    JSONB DEFAULT '[]',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id   ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);

-- ═══════════════════════════════════════════════════════════
-- IMPORTANT: Create your first super admin account
-- Replace the hash below — generate it with:
--   node -e "const b=require('bcryptjs');console.log(b.hashSync('YourPassword123!',12))"
-- ═══════════════════════════════════════════════════════════
-- INSERT INTO admin_users (email, password_hash, name, role)
-- VALUES ('tahur@crawlerstechnologies.com', '$2a$12$REPLACE_WITH_REAL_HASH', 'Mohammed', 'super_admin');
