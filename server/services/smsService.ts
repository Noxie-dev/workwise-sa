type SmsMessage = {
  to: string;
  body: string;
  category?: 'job_alert' | 'application' | 'system';
};

type SmsDeliveryResult = {
  delivered: boolean;
  provider: string;
  status: 'sent' | 'skipped' | 'not_configured';
};

class SmsService {
  private readonly provider = process.env.SMS_PROVIDER || 'stub';

  isConfigured() {
    return Boolean(process.env.SMS_PROVIDER && process.env.SMS_API_KEY);
  }

  async send(message: SmsMessage): Promise<SmsDeliveryResult> {
    if (!this.isConfigured()) {
      return {
        delivered: false,
        provider: this.provider,
        status: 'not_configured',
      };
    }

    console.log('SMS delivery scaffold invoked', {
      provider: this.provider,
      to: message.to,
      category: message.category ?? 'system',
    });

    return {
      delivered: false,
      provider: this.provider,
      status: 'skipped',
    };
  }
}

export const smsService = new SmsService();
export type { SmsMessage, SmsDeliveryResult };
