-- Migration 0010: Phase 1 monetization foundation
-- Adds provider-neutral billing, entitlement configuration, AI usage audit, promotion, and Pro waitlist tables.

ALTER TABLE users ADD COLUMN referred_by_user_id INTEGER;

CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  billing_interval TEXT NOT NULL DEFAULT 'month',
  entitlements JSON,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  provider TEXT NOT NULL DEFAULT 'payfast',
  provider_subscription_id TEXT,
  provider_token TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start DATETIME,
  current_period_end DATETIME,
  grace_period_ends_at DATETIME,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  cancelled_at DATETIME,
  expired_at DATETIME,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES billing_plans(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS billing_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id INTEGER,
  subscription_id INTEGER,
  provider TEXT NOT NULL DEFAULT 'payfast',
  provider_payment_id TEXT,
  merchant_reference TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_type TEXT NOT NULL DEFAULT 'subscription',
  checkout_url TEXT,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES billing_plans(id) ON DELETE SET NULL,
  FOREIGN KEY (subscription_id) REFERENCES billing_subscriptions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL DEFAULT 'payfast',
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSON,
  verified INTEGER NOT NULL DEFAULT 0,
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (provider, event_id)
);

CREATE TABLE IF NOT EXISTS ai_usage_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  document_type TEXT NOT NULL,
  job_id INTEGER,
  model TEXT,
  tokens INTEGER NOT NULL DEFAULT 0,
  cost_estimate_cents INTEGER NOT NULL DEFAULT 0,
  generation_time_ms INTEGER NOT NULL DEFAULT 0,
  success INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'started',
  idempotency_key TEXT NOT NULL,
  error_message TEXT,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  UNIQUE (user_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS ai_generated_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  usage_event_id INTEGER,
  document_type TEXT NOT NULL,
  job_id INTEGER,
  title TEXT,
  content JSON NOT NULL,
  model TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (usage_event_id) REFERENCES ai_usage_events(id) ON DELETE SET NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS candidate_promotion_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  boost_score INTEGER NOT NULL DEFAULT 0,
  visibility_multiplier INTEGER NOT NULL DEFAULT 100,
  profile_strength INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pro_interest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'plus_page',
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_user_status ON billing_subscriptions(user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_subscriptions_provider_subscription ON billing_subscriptions(provider, provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_user_created ON billing_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_provider_payment ON billing_transactions(provider, provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_document ON ai_usage_events(user_id, document_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_events_user_idempotency ON ai_usage_events(user_id, idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pro_interest_email ON pro_interest(email);

INSERT OR IGNORE INTO system_config (key, value, description) VALUES
('ENABLE_PLUS_SUBSCRIPTIONS', 'true', 'Allows WorkWise Plus subscription features to be evaluated.'),
('ENABLE_AI_CV', 'true', 'Allows authenticated AI CV generation.'),
('ENABLE_AI_COVER_LETTER', 'true', 'Allows authenticated AI cover-letter generation.'),
('ENABLE_PAYFAST', 'true', 'Allows PayFast checkout creation and ITN processing.'),
('ENABLE_AD_SUPPRESSION', 'true', 'Allows entitlements to suppress ads for paid users.');

INSERT OR IGNORE INTO billing_plans (code, display_name, description, price_cents, currency, billing_interval, entitlements, is_active, sort_order) VALUES
('free', 'Free', 'Core job search with limited AI generations and ads.', 0, 'ZAR', 'month', '{"freeCvGenerations":3,"freeCoverLetterGenerations":3,"adsEnabled":true,"candidatePromotionLite":false}', 1, 1),
('workwise_plus', 'WorkWise Plus', 'Unlimited AI CV and cover-letter generation, no ads, and Candidate Promotion Lite.', 4900, 'ZAR', 'month', '{"unlimitedAiCv":true,"unlimitedAiCoverLetters":true,"adsEnabled":false,"candidatePromotionLite":true}', 1, 2);
