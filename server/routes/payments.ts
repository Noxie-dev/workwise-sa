import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { storage } from '../storage';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { secretManager } from '../services/secretManager';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Validation schemas
const createPaymentIntentSchema = z.object({
  body: z.object({
    amount: z.number().min(100), // Minimum R1.00
    currency: z.enum(['ZAR', 'USD', 'EUR']).prefault('ZAR'),
    description: z.string().optional(),
    metadata: z.record(z.string(), z.string()).optional(),
  })
});

const createSubscriptionSchema = z.object({
  body: z.object({
    planId: z.string(),
    paymentMethodId: z.string(),
    billingCycle: z.enum(['monthly', 'yearly']).prefault('monthly'),
  })
});

const updateSubscriptionSchema = z.object({
  body: z.object({
    planId: z.string().optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
  })
});

const addPaymentMethodSchema = z.object({
  body: z.object({
    paymentMethodId: z.string(),
    setAsDefault: z.boolean().prefault(false),
  })
});

const createBillingAddressSchema = z.object({
  body: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().min(1),
    country: z.string().length(2).prefault('ZA'),
    isDefault: z.boolean().prefault(false),
  })
});

// Payment Intent Routes
router.post('/payment-intents', 
  authenticate,
  validate(createPaymentIntentSchema),
  async (req, res, next) => {
    try {
      const { amount, currency, description, metadata } = req.body;
      const userId = req.user.id;

      // Get or create Stripe customer
      let customer = await storage.getStripeCustomer(userId);
      if (!customer) {
        const user = await storage.getUser(userId);
        customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: userId.toString() },
        });
        
        await storage.updateUser(userId, { 
          stripeCustomerId: customer.id 
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: currency.toLowerCase(),
        customer: customer.id,
        description,
        metadata: {
          userId: userId.toString(),
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Store payment record
      await storage.createPayment({
        userId,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        currency,
        status: 'pending',
        description,
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Subscription Routes
router.get('/subscriptions', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subscription = await storage.getUserSubscription(userId);
    
    if (!subscription) {
      return res.json({ subscription: null });
    }

    res.json({ subscription });
  } catch (error) {
    next(error);
  }
});

router.post('/subscriptions',
  authenticate,
  validate(createSubscriptionSchema),
  async (req, res, next) => {
    try {
      const { planId, paymentMethodId, billingCycle } = req.body;
      const userId = req.user.id;

      // Get subscription plan
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        throw Errors.notFound('Subscription plan not found');
      }

      // Get or create Stripe customer
      let stripeCustomerId = req.user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.name,
          metadata: { userId: userId.toString() },
        });
        
        stripeCustomerId = customer.id;
        await storage.updateUser(userId, { 
          stripeCustomerId: customer.id 
        });
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      // Set as default payment method
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const priceId = billingCycle === 'yearly' 
        ? plan.stripePriceIdYearly 
        : plan.stripePriceIdMonthly;

      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Store subscription in database
      await storage.createSubscription({
        userId,
        stripeSubscriptionId: subscription.id,
        planType: plan.name,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });

      // Create job credits allocation
      await storage.createJobCredits({
        userId,
        creditsTotal: plan.jobCreditsMonthly,
        creditsRemaining: plan.jobCreditsMonthly,
        expiresAt: new Date(subscription.current_period_end * 1000),
      });

      res.json({
        subscription,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/subscriptions/:subscriptionId',
  authenticate,
  validate(updateSubscriptionSchema),
  async (req, res, next) => {
    try {
      const { subscriptionId } = req.params;
      const { planId, cancelAtPeriodEnd } = req.body;
      const userId = req.user.id;

      // Verify ownership
      const userSubscription = await storage.getUserSubscription(userId);
      if (!userSubscription || userSubscription.stripeSubscriptionId !== subscriptionId) {
        throw Errors.forbidden('Subscription not found or access denied');
      }

      let updateData: any = {};

      if (planId) {
        const plan = await storage.getSubscriptionPlan(planId);
        if (!plan) {
          throw Errors.notFound('Subscription plan not found');
        }

        // Update subscription plan
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await stripe.subscriptions.update(subscriptionId, {
          items: [{
            id: subscription.items.data[0].id,
            price: plan.stripePriceIdMonthly, // You may want to preserve billing cycle
          }],
          proration_behavior: 'create_prorations',
        });

        updateData.planType = plan.name;
      }

      if (typeof cancelAtPeriodEnd === 'boolean') {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: cancelAtPeriodEnd,
        });

        updateData.cancelAtPeriodEnd = cancelAtPeriodEnd;
        if (cancelAtPeriodEnd) {
          updateData.canceledAt = new Date();
        }
      }

      // Update database
      await storage.updateSubscription(userSubscription.id, updateData);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Payment Methods Routes
router.get('/payment-methods', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const paymentMethods = await storage.getUserPaymentMethods(userId);
    res.json({ paymentMethods });
  } catch (error) {
    next(error);
  }
});

router.post('/payment-methods',
  authenticate,
  validate(addPaymentMethodSchema),
  async (req, res, next) => {
    try {
      const { paymentMethodId, setAsDefault } = req.body;
      const userId = req.user.id;

      const stripeCustomerId = req.user.stripeCustomerId;
      if (!stripeCustomerId) {
        throw Errors.validation('No Stripe customer found');
      }

      // Attach payment method to customer
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      // Store in database
      await storage.createPaymentMethod({
        userId,
        stripePaymentMethodId: paymentMethodId,
        type: paymentMethod.type,
        cardBrand: paymentMethod.card?.brand,
        cardLast4: paymentMethod.card?.last4,
        cardExpMonth: paymentMethod.card?.exp_month,
        cardExpYear: paymentMethod.card?.exp_year,
        isDefault: setAsDefault,
      });

      if (setAsDefault) {
        // Set as default payment method
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });

        // Update other payment methods to not be default
        await storage.updateUserPaymentMethodsDefault(userId, paymentMethodId);
      }

      res.json({ success: true, paymentMethod });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/payment-methods/:paymentMethodId',
  authenticate,
  async (req, res, next) => {
    try {
      const { paymentMethodId } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const paymentMethod = await storage.getPaymentMethod(paymentMethodId);
      if (!paymentMethod || paymentMethod.userId !== userId) {
        throw Errors.forbidden('Payment method not found or access denied');
      }

      // Detach from Stripe
      await stripe.paymentMethods.detach(paymentMethodId);

      // Remove from database
      await storage.deletePaymentMethod(paymentMethodId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Billing Routes
router.get('/billing/invoices', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    const invoices = await storage.getUserInvoices(userId, {
      page: Number(page),
      limit: Number(limit),
    });

    res.json(invoices);
  } catch (error) {
    next(error);
  }
});

router.get('/billing/addresses', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addresses = await storage.getUserBillingAddresses(userId);
    res.json({ addresses });
  } catch (error) {
    next(error);
  }
});

router.post('/billing/addresses',
  authenticate,
  validate(createBillingAddressSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const addressData = req.body;

      const address = await storage.createBillingAddress({
        userId,
        ...addressData,
      });

      if (addressData.isDefault) {
        await storage.updateUserBillingAddressesDefault(userId, address.id);
      }

      res.json({ address });
    } catch (error) {
      next(error);
    }
  }
);

// Subscription Plans Routes
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await storage.getSubscriptionPlans();
    res.json({ plans });
  } catch (error) {
    next(error);
  }
});

// Job Credits Routes
router.get('/credits', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const credits = await storage.getUserJobCredits(userId);
    res.json({ credits });
  } catch (error) {
    next(error);
  }
});

// Webhook endpoint for Stripe events
router.post('/webhooks/stripe', async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = await secretManager.getSecret('STRIPE_WEBHOOK_SECRET');

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

// Webhook handlers
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  await storage.updatePaymentByStripeId(paymentIntent.id, {
    status: 'succeeded',
    updatedAt: new Date(),
  });
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  await storage.updatePaymentByStripeId(paymentIntent.id, {
    status: 'failed',
    failureReason: paymentIntent.last_payment_error?.message,
    updatedAt: new Date(),
  });
}

async function handleSubscriptionUpdated(subscription: any) {
  await storage.updateSubscriptionByStripeId(subscription.id, {
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: new Date(),
  });
}

async function handleSubscriptionDeleted(subscription: any) {
  await storage.updateSubscriptionByStripeId(subscription.id, {
    status: 'canceled',
    canceledAt: new Date(),
    updatedAt: new Date(),
  });
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  // Update invoice status and create payment record
  await storage.updateInvoiceByStripeId(invoice.id, {
    status: 'paid',
    amountPaid: invoice.amount_paid / 100,
    paidAt: new Date(),
    updatedAt: new Date(),
  });
}

async function handleInvoicePaymentFailed(invoice: any) {
  await storage.updateInvoiceByStripeId(invoice.id, {
    status: 'payment_failed',
    updatedAt: new Date(),
  });
}

export default router;
