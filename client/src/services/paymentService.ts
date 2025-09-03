/**
 * Payment Service for WorkWise SA
 * Handles Stripe payment processing and API integration
 */

import { enhancedApiClient } from '@/lib/apiClient';
import { 
  CreatePaymentIntentRequest, 
  CreatePaymentIntentResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
  PaymentResult,
  PaymentError
} from '@/types/payment';

/**
 * Payment Service Class
 * Handles all payment-related API calls
 */
class PaymentService {
  private baseUrl = '/api/payments';

  /**
   * Create a payment intent on the server
   */
  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<CreatePaymentIntentResponse> {
    try {
      const [data, error] = await enhancedApiClient.post<CreatePaymentIntentResponse>(
        `${this.baseUrl}/create-intent`,
        request
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No payment intent data received');
      }

      return data;
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      throw new Error(error.message || 'Failed to create payment intent');
    }
  }

  /**
   * Confirm a payment on the server
   */
  async confirmPayment(request: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> {
    try {
      const [data, error] = await enhancedApiClient.post<ConfirmPaymentResponse>(
        `${this.baseUrl}/confirm`,
        request
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No payment confirmation data received');
      }

      return data;
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      throw new Error(error.message || 'Failed to confirm payment');
    }
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const [data, error] = await enhancedApiClient.get<any[]>(
        `${this.baseUrl}/history/${userId}`
      );

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      throw new Error(error.message || 'Failed to fetch payment history');
    }
  }

  /**
   * Get payment details by ID
   */
  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const [data, error] = await enhancedApiClient.get<any>(
        `${this.baseUrl}/${paymentId}`
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Payment not found');
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching payment details:', error);
      throw new Error(error.message || 'Failed to fetch payment details');
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<any> {
    try {
      const [data, error] = await enhancedApiClient.post<any>(
        `${this.baseUrl}/${paymentId}/refund`,
        {
          amount,
          reason
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      throw new Error(error.message || 'Failed to refund payment');
    }
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(customerData: {
    email: string;
    name: string;
    phone?: string;
    address?: any;
  }): Promise<any> {
    try {
      const [data, error] = await enhancedApiClient.post<any>(
        `${this.baseUrl}/customers`,
        customerData
      );

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error('Error creating customer:', error);
      throw new Error(error.message || 'Failed to create customer');
    }
  }

  /**
   * Save payment method for future use
   */
  async savePaymentMethod(customerId: string, paymentMethodId: string): Promise<any> {
    try {
      const [data, error] = await enhancedApiClient.post<any>(
        `${this.baseUrl}/customers/${customerId}/payment-methods`,
        { paymentMethodId }
      );

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error('Error saving payment method:', error);
      throw new Error(error.message || 'Failed to save payment method');
    }
  }

  /**
   * Get saved payment methods for a customer
   */
  async getPaymentMethods(customerId: string): Promise<any[]> {
    try {
      const [data, error] = await enhancedApiClient.get<any[]>(
        `${this.baseUrl}/customers/${customerId}/payment-methods`
      );

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      throw new Error(error.message || 'Failed to fetch payment methods');
    }
  }

  /**
   * Delete a saved payment method
   */
  async deletePaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    try {
      const [, error] = await enhancedApiClient.delete(
        `${this.baseUrl}/customers/${customerId}/payment-methods/${paymentMethodId}`
      );

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      throw new Error(error.message || 'Failed to delete payment method');
    }
  }

  /**
   * Validate South African postal code
   */
  validatePostalCode(postalCode: string): boolean {
    const saPostalCodeRegex = /^\d{4}$/;
    return saPostalCodeRegex.test(postalCode);
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: string = 'ZAR'): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  }

  /**
   * Calculate tax for South African transactions
   */
  calculateTax(amount: number, taxRate: number = 0.15): { tax: number; total: number } {
    const tax = Math.round(amount * taxRate);
    const total = amount + tax;
    return { tax, total };
  }
}

// Export a singleton instance
export const paymentService = new PaymentService();
export default paymentService;