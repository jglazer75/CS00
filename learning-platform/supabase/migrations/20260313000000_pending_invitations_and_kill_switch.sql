-- pending_invitations: stores invite tokens for new users not yet in the system
CREATE TABLE IF NOT EXISTS pending_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  module_id text NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days'
);

CREATE INDEX IF NOT EXISTS pending_invitations_email_idx ON pending_invitations(email);
CREATE INDEX IF NOT EXISTS pending_invitations_token_idx ON pending_invitations(token);

-- RLS: only service role can read/write (all access via API routes using service key)
ALTER TABLE pending_invitations ENABLE ROW LEVEL SECURITY;

-- kill switch: module owner can allow fully unauthenticated read access
ALTER TABLE modules ADD COLUMN IF NOT EXISTS allow_unauthenticated boolean NOT NULL DEFAULT false;
