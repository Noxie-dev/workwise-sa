-- Migration 0011: Retire legacy Stripe billing scaffold
-- The canonical Phase 1 monetization model is provider-neutral and lives in the
-- billing_* tables introduced by 0010.

DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS job_credits;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS billing_addresses;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS subscription_plans;

DROP INDEX IF EXISTS idx_users_stripe_customer_id;
DROP INDEX IF EXISTS idx_users_subscription_status;

ALTER TABLE users DROP COLUMN user_type;
ALTER TABLE users DROP COLUMN subscription_status;
ALTER TABLE users DROP COLUMN stripe_customer_id;
ALTER TABLE users DROP COLUMN trial_ends_at;
ALTER TABLE users DROP COLUMN billing_cycle_anchor;
