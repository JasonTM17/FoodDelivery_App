CREATE TABLE IF NOT EXISTS user_fcm_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(500) NOT NULL UNIQUE,
  device_id  VARCHAR(200),
  is_stale   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user_stale
  ON user_fcm_tokens (user_id, is_stale);

CREATE TABLE IF NOT EXISTS notification_settings (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  channels   TEXT[]      NOT NULL DEFAULT '{}',
  enabled    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_notification_settings_user_event UNIQUE (user_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user
  ON notification_settings (user_id);
