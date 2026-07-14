ALTER TABLE fcm_token_revocations
  DROP CONSTRAINT fcm_token_revocations_pkey,
  ADD CONSTRAINT fcm_token_revocations_pkey
    PRIMARY KEY (token, registration_id);
