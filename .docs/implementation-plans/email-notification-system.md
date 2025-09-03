# Email Notification System Implementation

## Overview
Implement a comprehensive email notification system using SendGrid for transactional emails and automated workflows.

## Backend Implementation

### 1. Email Service Setup
```typescript
// server/services/emailService.ts
import sgMail from '@sendgrid/mail';
import { secretManager } from './secretManager';

// Initialize SendGrid
const initializeSendGrid = async () => {
  const apiKey = await secretManager.getSecret('SENDGRID_API_KEY');
  sgMail.setApiKey(apiKey);
};

// Email templates
export enum EmailTemplates {
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'email-verification',
  PASSWORD_RESET = 'password-reset',
  JOB_APPLICATION_RECEIVED = 'job-application-received',
  JOB_APPLICATION_STATUS = 'job-application-status',
  NEW_JOB_MATCH = 'new-job-match',
  INTERVIEW_INVITATION = 'interview-invitation',
  EMPLOYER_NEW_APPLICATION = 'employer-new-application',
  SUBSCRIPTION_CONFIRMATION = 'subscription-confirmation',
  PAYMENT_RECEIPT = 'payment-receipt',
  WEEKLY_JOB_DIGEST = 'weekly-job-digest',
}

interface EmailData {
  to: string | string[];
  from?: string;
  subject: string;
  template: EmailTemplates;
  templateData: Record<string, any>;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
  }>;
}

export class EmailService {
  private static instance: EmailService;
  private fromEmail: string;
  
  constructor() {
    this.fromEmail = 'no-reply@workwise-sa.co.za';
    initializeSendGrid();
  }
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }
  
  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      const template = await this.getEmailTemplate(emailData.template, emailData.templateData);
      
      const msg = {
        to: emailData.to,
        from: emailData.from || this.fromEmail,
        subject: emailData.subject,
        html: template.html,
        text: template.text,
        attachments: emailData.attachments,
      };
      
      await sgMail.send(msg);
      console.log(`Email sent successfully to ${emailData.to}`);
      
      // Log email for tracking
      await this.logEmail(emailData);
      
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
  
  async sendBulkEmail(emails: EmailData[]): Promise<void> {
    try {
      const messages = await Promise.all(
        emails.map(async (emailData) => {
          const template = await this.getEmailTemplate(emailData.template, emailData.templateData);
          return {
            to: emailData.to,
            from: emailData.from || this.fromEmail,
            subject: emailData.subject,
            html: template.html,
            text: template.text,
            attachments: emailData.attachments,
          };
        })
      );
      
      await sgMail.send(messages);
      console.log(`Bulk email sent to ${emails.length} recipients`);
      
    } catch (error) {
      console.error('Error sending bulk email:', error);
      throw error;
    }
  }
  
  private async getEmailTemplate(template: EmailTemplates, data: Record<string, any>) {
    // Load and compile email templates
    const templates = {
      [EmailTemplates.WELCOME]: {
        html: this.compileWelcomeTemplate(data),
        text: `Welcome to WorkWise SA, ${data.firstName}! Your account has been created successfully.`
      },
      [EmailTemplates.JOB_APPLICATION_RECEIVED]: {
        html: this.compileJobApplicationTemplate(data),
        text: `Thank you for applying to ${data.jobTitle} at ${data.companyName}. We'll review your application and get back to you soon.`
      },
      [EmailTemplates.NEW_JOB_MATCH]: {
        html: this.compileJobMatchTemplate(data),
        text: `New job match found: ${data.jobTitle} at ${data.companyName}. Apply now!`
      },
      // Add more templates...
    };
    
    return templates[template] || { html: '', text: '' };
  }
  
  private compileWelcomeTemplate(data: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to WorkWise SA</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f8f9fa; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3182ce; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to WorkWise SA!</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.firstName},</h2>
              <p>Thank you for joining WorkWise SA, South Africa's premier job platform.</p>
              <p>Your account has been created successfully. You can now:</p>
              <ul>
                <li>Search and apply for jobs</li>
                <li>Build your professional CV</li>
                <li>Set up job alerts</li>
                <li>Connect with potential employers</li>
              </ul>
              <p>Ready to get started?</p>
              <a href="${data.loginUrl}" class="button">Complete Your Profile</a>
            </div>
            <div class="footer">
              <p>Best regards,<br>The WorkWise SA Team</p>
              <p>If you have any questions, reply to this email or contact us at support@workwise-sa.co.za</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  
  private async logEmail(emailData: EmailData): Promise<void> {
    // Log email to database for tracking and analytics
    await db.insert(emailLogs).values({
      recipient: Array.isArray(emailData.to) ? emailData.to.join(',') : emailData.to,
      subject: emailData.subject,
      template: emailData.template,
      status: 'sent',
      sentAt: new Date(),
    });
  }
}
```

### 2. Database Schema for Email Tracking
```sql
-- Email logs table
CREATE TABLE email_logs (
  id SERIAL PRIMARY KEY,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  template VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, failed
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  failed_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email preferences table
CREATE TABLE email_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  job_alerts BOOLEAN DEFAULT true,
  application_updates BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT true,
  new_features BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Job alerts table
CREATE TABLE job_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  keywords TEXT,
  location VARCHAR(200),
  category_id INTEGER REFERENCES categories(id),
  salary_min INTEGER,
  salary_max INTEGER,
  employment_type VARCHAR(50),
  remote_only BOOLEAN DEFAULT false,
  frequency VARCHAR(20) DEFAULT 'daily', -- immediate, daily, weekly
  is_active BOOLEAN DEFAULT true,
  last_sent TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Email Queue System
```typescript
// server/services/emailQueue.ts
import { Queue } from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const emailQueue = new Queue('email', { redis });

// Email job types
export enum EmailJobTypes {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled',
  BULK = 'bulk',
  DIGEST = 'digest',
}

export class EmailQueueService {
  static async addEmailJob(
    type: EmailJobTypes,
    emailData: EmailData,
    options: { delay?: number; repeat?: any } = {}
  ) {
    return emailQueue.add(type, emailData, {
      delay: options.delay,
      repeat: options.repeat,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
  
  static async addBulkEmailJob(emails: EmailData[], options = {}) {
    return emailQueue.add(EmailJobTypes.BULK, { emails }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      ...options,
    });
  }
  
  // Process email jobs
  static init() {
    emailQueue.process(EmailJobTypes.IMMEDIATE, async (job) => {
      const emailService = EmailService.getInstance();
      await emailService.sendEmail(job.data);
    });
    
    emailQueue.process(EmailJobTypes.BULK, async (job) => {
      const emailService = EmailService.getInstance();
      await emailService.sendBulkEmail(job.data.emails);
    });
    
    emailQueue.process(EmailJobTypes.DIGEST, async (job) => {
      await this.processWeeklyDigest(job.data);
    });
  }
  
  private static async processWeeklyDigest(data: any) {
    // Get users who want weekly digest
    const users = await db.select()
      .from(users)
      .innerJoin(emailPreferences, eq(users.id, emailPreferences.userId))
      .where(eq(emailPreferences.weeklyDigest, true));
    
    for (const user of users) {
      // Get personalized job recommendations
      const recommendedJobs = await getJobRecommendations(user.id, 5);
      
      const emailData: EmailData = {
        to: user.email,
        subject: 'Your Weekly Job Digest - WorkWise SA',
        template: EmailTemplates.WEEKLY_JOB_DIGEST,
        templateData: {
          firstName: user.firstName,
          jobs: recommendedJobs,
          unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?token=${user.unsubscribeToken}`,
        },
      };
      
      await EmailQueueService.addEmailJob(EmailJobTypes.IMMEDIATE, emailData);
    }
  }
}
```

### 4. API Routes for Email Management
```typescript
// server/routes/email.ts
app.post('/api/email/send', async (req, res, next) => {
  try {
    const { to, template, templateData, subject } = req.body;
    
    const emailData: EmailData = {
      to,
      subject,
      template,
      templateData,
    };
    
    await EmailQueueService.addEmailJob(EmailJobTypes.IMMEDIATE, emailData);
    
    res.json({ success: true, message: 'Email queued for sending' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/email/preferences/:userId', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const preferences = await db.select()
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, userId))
      .limit(1);
    
    res.json(preferences[0] || {});
  } catch (error) {
    next(error);
  }
});

app.put('/api/email/preferences/:userId', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const { jobAlerts, applicationUpdates, marketingEmails, weeklyDigest, newFeatures } = req.body;
    
    await db.update(emailPreferences)
      .set({
        jobAlerts,
        applicationUpdates,
        marketingEmails,
        weeklyDigest,
        newFeatures,
        updatedAt: new Date(),
      })
      .where(eq(emailPreferences.userId, userId));
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Webhook for SendGrid events
app.post('/api/email/webhook', async (req, res) => {
  try {
    const events = req.body;
    
    for (const event of events) {
      await updateEmailStatus(event);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

async function updateEmailStatus(event: any) {
  const updates: any = {};
  
  switch (event.event) {
    case 'delivered':
      updates.status = 'delivered';
      updates.deliveredAt = new Date(event.timestamp * 1000);
      break;
    case 'open':
      updates.openedAt = new Date(event.timestamp * 1000);
      break;
    case 'click':
      updates.clickedAt = new Date(event.timestamp * 1000);
      break;
    case 'bounce':
    case 'dropped':
      updates.status = 'failed';
      updates.failedReason = event.reason;
      break;
  }
  
  if (Object.keys(updates).length > 0) {
    await db.update(emailLogs)
      .set(updates)
      .where(eq(emailLogs.recipient, event.email));
  }
}
```

## Frontend Implementation

### 1. Email Preferences Component
```typescript
// client/src/components/settings/EmailPreferences.tsx
export const EmailPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    jobAlerts: true,
    applicationUpdates: true,
    marketingEmails: false,
    weeklyDigest: true,
    newFeatures: true,
  });
  
  const { data: currentPreferences } = useQuery({
    queryKey: ['emailPreferences', user?.id],
    queryFn: () => fetchEmailPreferences(user?.id),
    enabled: !!user?.id,
  });
  
  const updatePreferencesMutation = useMutation({
    mutationFn: (prefs: typeof preferences) => updateEmailPreferences(user?.id, prefs),
    onSuccess: () => {
      toast({ title: 'Preferences updated successfully' });
    },
  });
  
  useEffect(() => {
    if (currentPreferences) {
      setPreferences(currentPreferences);
    }
  }, [currentPreferences]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Preferences</CardTitle>
        <CardDescription>
          Choose which emails you'd like to receive from WorkWise SA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Job Alerts</Label>
            <p className="text-sm text-gray-500">
              Get notified when jobs matching your criteria are posted
            </p>
          </div>
          <Switch
            checked={preferences.jobAlerts}
            onCheckedChange={(checked) =>
              setPreferences(prev => ({ ...prev, jobAlerts: checked }))
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label>Application Updates</Label>
            <p className="text-sm text-gray-500">
              Receive updates on your job applications
            </p>
          </div>
          <Switch
            checked={preferences.applicationUpdates}
            onCheckedChange={(checked) =>
              setPreferences(prev => ({ ...prev, applicationUpdates: checked }))
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label>Weekly Job Digest</Label>
            <p className="text-sm text-gray-500">
              Get a weekly summary of recommended jobs
            </p>
          </div>
          <Switch
            checked={preferences.weeklyDigest}
            onCheckedChange={(checked) =>
              setPreferences(prev => ({ ...prev, weeklyDigest: checked }))
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label>Marketing Emails</Label>
            <p className="text-sm text-gray-500">
              Receive updates about new features and promotions
            </p>
          </div>
          <Switch
            checked={preferences.marketingEmails}
            onCheckedChange={(checked) =>
              setPreferences(prev => ({ ...prev, marketingEmails: checked }))
            }
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => updatePreferencesMutation.mutate(preferences)}
          disabled={updatePreferencesMutation.isLoading}
        >
          {updatePreferencesMutation.isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardFooter>
    </Card>
  );
};
```

## Environment Variables
```env
# Add to .env
SENDGRID_API_KEY=SG.xxx
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5174
```

## Implementation Timeline
- **Days 1-3**: Email service setup and templates
- **Days 4-6**: Queue system and webhook handling
- **Days 7-8**: Frontend preferences and testing
- **Days 9-11**: Job alerts and digest systems
