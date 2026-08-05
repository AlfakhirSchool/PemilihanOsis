-- Drop CT101-backed NIS identity entirely, replace with anonymous single-use voting codes.

CREATE TABLE voting_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES election_periods(id),
  code VARCHAR(16) NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(election_id, code)
);

ALTER TABLE votes RENAME COLUMN nis TO code;
ALTER TABLE votes ALTER COLUMN code TYPE VARCHAR(16);
ALTER TABLE votes DROP CONSTRAINT votes_election_id_nis_key;
ALTER TABLE votes ADD CONSTRAINT votes_election_id_code_key UNIQUE (election_id, code);
