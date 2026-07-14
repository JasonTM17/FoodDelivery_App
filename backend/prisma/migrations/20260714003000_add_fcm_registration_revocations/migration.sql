ALTER TABLE user_fcm_tokens
  ADD COLUMN registration_id VARCHAR(64);

CREATE TABLE fcm_token_revocations (
  registration_id VARCHAR(64) PRIMARY KEY,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX fcm_token_revocations_expires_at_idx
  ON fcm_token_revocations (expires_at);
