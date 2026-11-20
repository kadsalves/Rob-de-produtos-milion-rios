CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text NOT NULL,
  plan text NOT NULL DEFAULT 'essencial' CHECK (plan IN ('essencial','prof','vip')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  discount integer NOT NULL CHECK (discount BETWEEN 0 AND 100),
  image_url text,
  destination_url text NOT NULL,
  marketplace text NOT NULL,
  category text NOT NULL,
  demand_level text NOT NULL,
  trending_since timestamptz NOT NULL DEFAULT now(),
  trending_until timestamptz,
  stock_level integer CHECK (stock_level >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS offer_copies (
  id uuid PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES offers(id),
  angle text NOT NULL CHECK (angle IN ('emocional','fomo','barganha','social','cta')),
  copy_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_id, angle),
  UNIQUE (offer_id, id)
);
CREATE TABLE IF NOT EXISTS affiliation_links (
  link_tracking_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  offer_id uuid NOT NULL REFERENCES offers(id),
  scope text NOT NULL,
  real_link text NOT NULL,
  clicks integer NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions integer NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, offer_id, scope),
  UNIQUE (user_id, offer_id, link_tracking_id)
);
CREATE TABLE IF NOT EXISTS user_dispatches (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  offer_id uuid NOT NULL REFERENCES offers(id),
  copy_id uuid NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  channel text NOT NULL CHECK (channel IN ('telegram','whatsapp')),
  link_tracking_id uuid NOT NULL UNIQUE,
  message_id text NOT NULL,
  simulated boolean NOT NULL DEFAULT true,
  investment numeric(12,2) CHECK (investment >= 0),
  commission numeric(12,2) NOT NULL DEFAULT 0 CHECK (commission >= 0),
  FOREIGN KEY (offer_id, copy_id) REFERENCES offer_copies(offer_id, id),
  FOREIGN KEY (user_id, offer_id, link_tracking_id)
    REFERENCES affiliation_links(user_id, offer_id, link_tracking_id)
);
CREATE INDEX IF NOT EXISTS offers_created_idx ON offers(created_at DESC, id);
CREATE INDEX IF NOT EXISTS dispatch_history_idx ON user_dispatches(user_id, sent_at DESC);
