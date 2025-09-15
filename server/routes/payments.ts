import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/enhanced-auth';
import { validate } from '../middleware/validation';
import { storage } from '../storage';
import { Errors } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../../shared/auth-types';

// Mock Stripe for compilation - would need actual Stripe package
const stripe = {
  paymentIntents: {
    create: async (params: any) => ({ id: 'pi_mock', client_secret: 'pi_mock_secret' }),
    retrieve: async (id: string) => ({ id, status: 'succeeded' }),
    update: async (id: string, params: any) => ({ id, ...params })
  },
  customers: {
    create: async (params: any) => ({ id: 'cus_mock' }),
    retrieve: async (id: string) => ({ id, email: 'user@example.com' }),
    update: async (id: string, params: any) => ({ id, ...params })
  },
  subscriptions: {
    create: async (params: any) => ({ id: 'sub_mock', status: 'active' }),
    retrieve: async (id: string) => ({ id, status: 'active' }),
    update: async (id: string, params: any) => ({ id, ...params }),
    cancel: async (id: string) => ({ id, status: 'canceled' })
  },
  paymentMethods: {
    create: async (params: any) => ({ id: 'pm_mock' }),
    retrieve: async (id: string) => ({ id, type: 'card' }),
    attach: async (id: string, params: any) => ({ id }),
    detach: async (id: string) => ({ id })
  },
  webhooks: {
    constructEvent: (payload: any, signature: string, secret: string) => ({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_mock', payment_intent: 'pi_mock' } }
    })
  }
};

const router = Router();

// Validation schemas
const createPaymentIntentSchema = z.object({
  body: z.object({
    amount: z.number().min(100), // Minimum R1.00
    currency: z.enum(['ZAR', 'USD', 'EUR']).default('ZAR'),
    description: z.string().optional(),
    metadata: z.record(z.string(), z.string()).optional(),
  })
});

const createSubscriptionSchema = z.object({
  body: z.object({
    planId: z.string(),
    paymentMethodId: z.string(),
    billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
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
    country: z.string().length(2).default('ZA'),
    isDefault: z.boolean().default(false),
  })
});

// Payment Intent Routes
router.post('/create-payment-intent', 
  authenticate,
  validate(createPaymentIntentSchema),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { amount, currency, description, metadata } = req.body;
      const userId = parseInt(req.user?.id || '0', 10);
      
      // Get or create Stripe customer
      let customer = await storage.getStripeCustomer(userId);
      if (!customer) {
        const user = req.user!;
        customer = await stripe.customers.create({
          email: user.email,
          name: user.name || user.displayName
        });
        
        // Save customer to database
        await storage.createPayment({
          userId,
          stripePaymentIntentId: '',
          amount,
          currency,
          status: 'pending'
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
router.get('/subscription-plans', 
  authenticate,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.user?.id || '0', 10);
      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription) {
        return res.json({ subscription: null });
      }

      res.json({ subscription });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/create-subscription', 
  authenticate,
  validate(createSubscriptionSchema),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { planId, paymentMethodId, billingCycle } = req.body;
      const user = req.user!;
      const userId = parseInt(user.id || '0', 10);

      // Get subscription plan
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        throw Errors.notFound('Subscription plan not found');
      }

      // Get or create Stripe customer
      let customer = await storage.getStripeCustomer(userId);
      if (!customer) {
        customer = await stripe.customers.create({
          email: user.email,
          name: user.name || user.displayName
        });
      }

      const stripeCustomerId = customer.id;
      
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

      // Determine price based on billing cycle
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

      // Create subscription in database
      const subscriptionData = await storage.createSubscription({
        userId,
        planId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status
      });

      // Create job credits allocation
      await storage.createJobCredits({
        userId,
        creditsTotal: plan.jobCreditsMonthly,
        creditsRemaining: plan.jobCreditsMonthly,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });

      res.json({
        subscription: subscriptionData,
        clientSecret: 'pi_mock_secret',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Payment Methods Routes
router.get('/payment-methods', 
  authenticate,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.user?.id || '0', 10);
      const paymentMethods = await storage.getUserPaymentMethods(userId);
      res.json({ paymentMethods });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/payment-methods', 
  authenticate,
  validate(addPaymentMethodSchema),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { paymentMethodId, setAsDefault } = req.body;
      const userId = parseInt(req.user?.id || '0', 10);

      const stripeCustomerId = req.user!.stripeCustomerId;
      if (!stripeCustomerId) {
        throw Errors.validation('No Stripe customer found');
      }

      // Attach payment method to customer
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      // Store payment method in database
      const paymentMethodData = await storage.createPaymentMethod({
        userId,
        stripePaymentMethodId: paymentMethod.id,
        type: req.body.type,
        isDefault: false
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

      res.json({ success: true, paymentMethod: paymentMethodData });
    } catch (error) {
      next(error);
    }
  }
);

// Billing Routes
router.get('/invoices', 
  authenticate,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.user?.id || '0', 10);
      const { page = 1, limit = 10 } = req.query;
      
      const invoices = await storage.getUserInvoices(userId, {
        page: Number(page),
        limit: Number(limit),
      });

      res.json(invoices);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/billing-addresses', 
  authenticate,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.user?.id || '0', 10);
      const addresses = await storage.getUserBillingAddresses(userId);
      res.json({ addresses });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/billing-addresses', 
  authenticate,
  validate(createBillingAddressSchema),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.user?.id || '0', 10);
      const addressData = req.body;

      const address = await storage.createBillingAddress({
        userId,
        ...req.body
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

// Job Credits Routes
router.get('/job-credits', 
  authenticate,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.user?.id || '0', 10);
      const credits = await storage.getUserJobCredits(userId);
      res.json({ credits });
    } catch (error) {
      next(error);
    }
  }
);

// Webhook endpoint for Stripe events
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await storage.updatePaymentByStripeId(event.data.object.id, {
          status: 'completed'
        });
        break;
      case 'invoice.payment_succeeded':
        await storage.updateInvoiceByStripeId(event.data.object.payment_intent || event.data.object.id, {
          status: 'paid'
        });
        break;
      case 'customer.subscription.updated':
        await storage.updateSubscriptionByStripeId(event.data.object.id, {
          status: 'active'
        });
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
