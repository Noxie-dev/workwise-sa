import crypto from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import {
  billingPlans,
  billingSubscriptions,
  billingTransactions,
  billingWebhookEvents,
  type BillingPlan,
  type BillingSubscription,
} from '@shared/schema';
import { Errors } from '../middleware/errorHandler';
import { secretManager } from './secretManager';
import { featureFlagService } from './featureFlagService';
import { candidatePromotionService } from './candidatePromotionService';

type PayfastPayload = Record<string, string | undefined>;

const PAYFAST_FIELD_ORDER = [
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'name_first',
  'name_last',
  'email_address',
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
  'subscription_type',
  'billing_date',
  'recurring_amount',
  'frequency',
  'cycles',
  'custom_str1',
  'custom_str2',
  'custom_str3',
  'custom_str4',
  'custom_str5',
  'custom_int1',
  'custom_int2',
  'custom_int3',
  'custom_int4',
  'custom_int5',
  'payment_status',
  'pf_payment_id',
  'token',
];

const col = (column: unknown) => column as any;

function formatRand(cents: number) {
  return (cents / 100).toFixed(2);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizePayload(payload: Record<string, any>): PayfastPayload {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, value == null ? undefined : String(value)])
  );
}

export class BillingService {
  async getPlans() {
    return db
      .select()
      .from(billingPlans)
      .where(eq(col(billingPlans.isActive), true))
      .orderBy(col(billingPlans.sortOrder));
  }

  async getWorkwisePlusPlan(): Promise<BillingPlan> {
    const [plan] = await db
      .select()
      .from(billingPlans)
      .where(eq(col(billingPlans.code), 'workwise_plus'))
      .limit(1);
    if (!plan) {
      throw Errors.notFound('WorkWise Plus plan is not configured');
    }
    return plan;
  }

  async getCurrentSubscription(userId: number): Promise<BillingSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(billingSubscriptions)
      .where(eq(col(billingSubscriptions.userId), userId))
      .orderBy(desc(col(billingSubscriptions.createdAt)))
      .limit(1);

    return subscription;
  }

  async createPayfastCheckout(user: { id: number; email: string; name: string }) {
    if (!(await featureFlagService.isEnabled('ENABLE_PAYFAST'))) {
      throw Errors.forbidden('PayFast checkout is currently disabled');
    }

    const plan = await this.getWorkwisePlusPlan();
    const merchantReference = `ww-plus-${user.id}-${Date.now()}`;
    const actionUrl = await this.getPayfastActionUrl();
    const now = new Date();

    const [transaction] = await db
      .insert(billingTransactions)
      .values({
        userId: user.id,
        planId: plan.id,
        merchantReference,
        amountCents: plan.priceCents,
        currency: plan.currency,
        status: 'pending',
        provider: 'payfast',
        paymentType: 'subscription',
        metadata: {
          planCode: plan.code,
          billingInterval: plan.billingInterval,
        },
      })
      .returning();

    const [firstName, ...lastNameParts] = (user.name || 'WorkWise User').split(' ');
    const fields: PayfastPayload = {
      merchant_id: await this.requireSecret('PAYFAST_MERCHANT_ID'),
      merchant_key: await this.requireSecret('PAYFAST_MERCHANT_KEY'),
      return_url: await this.getUrl('PAYFAST_RETURN_URL', '/billing/success'),
      cancel_url: await this.getUrl('PAYFAST_CANCEL_URL', '/billing/cancelled'),
      notify_url: await this.getUrl('PAYFAST_NOTIFY_URL', '/api/billing/payfast/itn'),
      name_first: firstName || 'WorkWise',
      name_last: lastNameParts.join(' ') || 'User',
      email_address: user.email,
      m_payment_id: merchantReference,
      amount: formatRand(plan.priceCents),
      item_name: plan.displayName,
      item_description: plan.description || 'WorkWise Plus monthly subscription',
      subscription_type: '1',
      billing_date: now.toISOString().slice(0, 10),
      recurring_amount: formatRand(plan.priceCents),
      frequency: '3',
      cycles: '0',
      custom_int1: String(user.id),
      custom_str1: plan.code,
    };

    fields.signature = await this.createSignature(fields, PAYFAST_FIELD_ORDER);

    await db
      .update(billingTransactions)
      .set({
        checkoutUrl: actionUrl,
        metadata: {
          planCode: plan.code,
          billingInterval: plan.billingInterval,
          payfastFields: {
            m_payment_id: merchantReference,
            amount: fields.amount,
            item_name: fields.item_name,
          },
        },
      })
      .where(eq(col(billingTransactions.id), transaction.id));

    return {
      transactionId: transaction.id,
      merchantReference,
      actionUrl,
      fields,
    };
  }

  async handlePayfastItn(rawPayload: Record<string, any>) {
    const payload = normalizePayload(rawPayload);
    const eventId = payload.pf_payment_id || payload.m_payment_id;
    if (!eventId) {
      throw Errors.validation('Missing PayFast event identifier');
    }

    const [existingEvent] = await db
      .select()
      .from(billingWebhookEvents)
      .where(
        and(
          eq(col(billingWebhookEvents.provider), 'payfast'),
          eq(col(billingWebhookEvents.eventId), eventId)
        )
      )
      .limit(1);

    if (existingEvent?.processedAt) {
      return { duplicate: true, processed: true };
    }

    const verified = await this.verifyPayfastPayload(payload);
    const [webhookEvent] = existingEvent
      ? await db
          .update(billingWebhookEvents)
          .set({ payload, verified, eventType: payload.payment_status || 'unknown' })
          .where(eq(col(billingWebhookEvents.id), existingEvent.id))
          .returning()
      : await db
          .insert(billingWebhookEvents)
          .values({
            provider: 'payfast',
            eventId,
            eventType: payload.payment_status || 'unknown',
            payload,
            verified,
          })
          .returning();

    if (!verified) {
      throw Errors.forbidden('Invalid PayFast signature');
    }

    const merchantReference = payload.m_payment_id;
    if (!merchantReference) {
      throw Errors.validation('Missing PayFast merchant reference');
    }

    const [transaction] = await db
      .select()
      .from(billingTransactions)
      .where(eq(col(billingTransactions.merchantReference), merchantReference))
      .limit(1);

    if (!transaction) {
      throw Errors.notFound('Billing transaction not found');
    }

    const isComplete = payload.payment_status === 'COMPLETE';
    if (isComplete) {
      await this.activateSubscription({
        userId: transaction.userId,
        planId: transaction.planId!,
        providerPaymentId: payload.pf_payment_id,
        providerToken: payload.token,
        transactionId: transaction.id,
      });
    } else {
      await this.markPaymentFailed(
        transaction.userId,
        transaction.id,
        payload.payment_status || 'failed'
      );
    }

    await db
      .update(billingWebhookEvents)
      .set({ processedAt: new Date(), verified: true })
      .where(eq(col(billingWebhookEvents.id), webhookEvent.id));

    return { duplicate: false, processed: true };
  }

  async cancelCurrentSubscription(userId: number) {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      throw Errors.notFound('Subscription not found');
    }

    const [updated] = await db
      .update(billingSubscriptions)
      .set({
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(col(billingSubscriptions.id), subscription.id))
      .returning();

    return updated;
  }

  private async activateSubscription({
    userId,
    planId,
    providerPaymentId,
    providerToken,
    transactionId,
  }: {
    userId: number;
    planId: number;
    providerPaymentId?: string;
    providerToken?: string;
    transactionId: number;
  }) {
    const now = new Date();
    const currentPeriodEnd = addMonths(now, 1);
    const existing = await this.getCurrentSubscription(userId);

    let subscription: BillingSubscription;
    if (existing) {
      const [updated] = await db
        .update(billingSubscriptions)
        .set({
          planId,
          provider: 'payfast',
          providerSubscriptionId: providerPaymentId || existing.providerSubscriptionId,
          providerToken: providerToken || existing.providerToken,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd,
          gracePeriodEndsAt: null,
          cancelAtPeriodEnd: false,
          expiredAt: null,
          updatedAt: now,
        })
        .where(eq(col(billingSubscriptions.id), existing.id))
        .returning();
      subscription = updated;
    } else {
      const [created] = await db
        .insert(billingSubscriptions)
        .values({
          userId,
          planId,
          provider: 'payfast',
          providerSubscriptionId: providerPaymentId,
          providerToken,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd,
        })
        .returning();
      subscription = created;
    }

    await db
      .update(billingTransactions)
      .set({
        subscriptionId: subscription.id,
        providerPaymentId,
        status: 'succeeded',
        updatedAt: now,
      })
      .where(eq(col(billingTransactions.id), transactionId));

    await candidatePromotionService.upsertPromotionForUser(userId, true);
    return subscription;
  }

  private async markPaymentFailed(userId: number, transactionId: number, status: string) {
    const now = new Date();
    await db
      .update(billingTransactions)
      .set({
        status: 'failed',
        metadata: { payfastStatus: status },
        updatedAt: now,
      })
      .where(eq(col(billingTransactions.id), transactionId));

    const subscription = await this.getCurrentSubscription(userId);
    if (subscription?.status === 'active') {
      await db
        .update(billingSubscriptions)
        .set({
          status: 'grace_period',
          gracePeriodEndsAt: addDays(now, 7),
          updatedAt: now,
        })
        .where(eq(col(billingSubscriptions.id), subscription.id));
    }
  }

  private async verifyPayfastPayload(payload: PayfastPayload) {
    const expected = payload.signature;
    if (!expected) {
      return false;
    }

    const actual = await this.createSignature(payload);
    return actual === expected;
  }

  private async createSignature(payload: PayfastPayload, orderedKeys?: string[]) {
    const passphrase = await this.optionalSecret('PAYFAST_PASSPHRASE');
    const keys = orderedKeys ?? Object.keys(payload);
    const parts = keys
      .filter(key => key !== 'signature')
      .filter(key => payload[key] !== undefined && payload[key] !== '')
      .map(key => `${key}=${encodeURIComponent(String(payload[key])).replace(/%20/g, '+')}`);

    if (passphrase) {
      parts.push(`passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`);
    }

    return crypto.createHash('md5').update(parts.join('&')).digest('hex');
  }

  private async getPayfastActionUrl() {
    const sandbox = (await this.optionalSecret('PAYFAST_SANDBOX')) !== 'false';
    return sandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';
  }

  private async getUrl(secretKey: string, path: string) {
    const configured = await this.optionalSecret(secretKey);
    if (configured) {
      return configured;
    }

    const renderBaseUrl = process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, '');
    const baseUrl =
      (await this.optionalSecret('PUBLIC_BASE_URL')) || renderBaseUrl || 'http://localhost:3001';
    return `${baseUrl}${path}`;
  }

  private async optionalSecret(key: string) {
    return (await secretManager.getSecret(key)) || process.env[key] || '';
  }

  private async requireSecret(key: string) {
    const value = await this.optionalSecret(key);
    if (!value) {
      throw Errors.validation(`${key} is not configured`);
    }
    return value;
  }
}

export const billingService = new BillingService();
