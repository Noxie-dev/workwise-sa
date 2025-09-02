# Payment Integration Implementation Plan

## Overview
Implement Stripe payment system for employer subscriptions and job posting fees.

## Technical Requirements

### Backend Implementation
1. **Stripe Configuration**
   ```typescript
   // server/services/payment.ts
   import Stripe from 'stripe';
   
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
     apiVersion: '2023-10-16',
   });
   
   export const createPaymentIntent = async (amount: number, currency = 'zar') => {
     return await stripe.paymentIntents.create({
       amount: amount * 100, // Convert to cents
       currency,
       automatic_payment_methods: {
         enabled: true,
       },
     });
   };
   ```

2. **Database Schema Updates**
   ```sql
   -- Add to migrations
   CREATE TABLE subscriptions (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES users(id),
     stripe_subscription_id VARCHAR(255) UNIQUE,
     plan_type VARCHAR(50) NOT NULL,
     status VARCHAR(50) NOT NULL,
     current_period_start TIMESTAMP,
     current_period_end TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   
   CREATE TABLE payments (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES users(id),
     stripe_payment_intent_id VARCHAR(255) UNIQUE,
     amount DECIMAL(10,2) NOT NULL,
     currency VARCHAR(3) DEFAULT 'ZAR',
     status VARCHAR(50) NOT NULL,
     description TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **API Endpoints**
   ```typescript
   // server/routes/payment.ts
   app.post('/api/payments/create-intent', async (req, res) => {
     const { amount, description } = req.body;
     const paymentIntent = await createPaymentIntent(amount);
     res.json({ clientSecret: paymentIntent.client_secret });
   });
   
   app.post('/api/subscriptions/create', async (req, res) => {
     const { priceId, customerId } = req.body;
     const subscription = await stripe.subscriptions.create({
       customer: customerId,
       items: [{ price: priceId }],
       payment_behavior: 'default_incomplete',
       expand: ['latest_invoice.payment_intent'],
     });
     res.json(subscription);
   });
   ```

### Frontend Implementation
1. **Payment Components**
   ```typescript
   // client/src/components/payment/PaymentForm.tsx
   import { loadStripe } from '@stripe/stripe-js';
   import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
   
   const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY!);
   
   export const PaymentForm = ({ amount, onSuccess }) => {
     const stripe = useStripe();
     const elements = useElements();
     
     const handleSubmit = async (event) => {
       event.preventDefault();
       
       const { clientSecret } = await fetch('/api/payments/create-intent', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ amount }),
       }).then(r => r.json());
       
       const result = await stripe.confirmCardPayment(clientSecret, {
         payment_method: {
           card: elements.getElement(CardElement),
         }
       });
       
       if (result.error) {
         console.error(result.error);
       } else {
         onSuccess(result.paymentIntent);
       }
     };
     
     return (
       <form onSubmit={handleSubmit}>
         <CardElement />
         <button type="submit" disabled={!stripe}>Pay</button>
       </form>
     );
   };
   ```

2. **Subscription Management**
   ```typescript
   // client/src/pages/employers/SubscriptionPlan.tsx
   export const SubscriptionPlan = () => {
     const plans = [
       { id: 'basic', name: 'Basic', price: 299, features: ['5 job posts', 'Basic support'] },
       { id: 'pro', name: 'Professional', price: 599, features: ['25 job posts', 'Priority support', 'Analytics'] },
       { id: 'enterprise', name: 'Enterprise', price: 1299, features: ['Unlimited posts', 'Dedicated support', 'Custom branding'] }
     ];
     
     return (
       <div className="grid md:grid-cols-3 gap-6">
         {plans.map(plan => (
           <PlanCard key={plan.id} plan={plan} />
         ))}
       </div>
     );
   };
   ```

## Environment Variables
```env
# Add to .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Add to client/.env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Testing Strategy
1. Use Stripe test cards for development
2. Implement webhook testing with Stripe CLI
3. Test subscription lifecycle (create, update, cancel)
4. Test payment failure scenarios

## Timeline
- Week 1: Backend payment infrastructure
- Week 2: Frontend payment components and integration
