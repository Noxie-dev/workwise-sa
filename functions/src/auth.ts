/**
 * Firebase Functions for Authentication
 * Handles 2FA with Twilio Verify and WhatsApp integration
 */

import { onRequest } from 'firebase-functions/v2/https';
import { onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
// import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { Twilio } from 'twilio';

// Initialize Firebase Admin
initializeApp();

// Define secrets
const twilioAccountSid = defineSecret('TWILIO_ACCOUNT_SID');
const twilioAuthToken = defineSecret('TWILIO_AUTH_TOKEN');
const twilioVerifyServiceSid = defineSecret('TWILIO_VERIFY_SERVICE_SID');

// Initialize Twilio client
const getTwilioClient = () => {
  return new Twilio(twilioAccountSid.value(), twilioAuthToken.value());
};

// Initialize Firestore
const db = getFirestore();

/**
 * Send 2FA verification code via WhatsApp
 */
export const sendTwoFactorCode = onCall(
  {
    secrets: [twilioAccountSid, twilioAuthToken, twilioVerifyServiceSid],
    cors: true,
  },
  async (request) => {
    try {
      const { phoneNumber, userId } = request.data;
      
      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }

      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Initialize Twilio client
      const client = getTwilioClient();

      // Send verification code via WhatsApp
      const verification = await client.verify.v2
        .services(twilioVerifyServiceSid.value())
        .verifications
        .create({
          to: phoneNumber,
          channel: 'whatsapp',
          locale: 'en'
        });

      // Log the verification attempt
      await db.collection('verification_logs').add({
        userId: userId || 'anonymous',
        phoneNumber: phoneNumber,
        verificationSid: verification.sid,
        status: verification.status,
        channel: verification.channel,
        createdAt: new Date(),
        ipAddress: request.rawRequest.ip,
        userAgent: request.rawRequest.headers['user-agent']
      });

      return {
        success: true,
        message: 'Verification code sent successfully',
        verificationSid: verification.sid,
        status: verification.status
      };

    } catch (error: any) {
      console.error('Send 2FA code error:', error);
      
      // Log the error
      await db.collection('error_logs').add({
        function: 'sendTwoFactorCode',
        error: error.message,
        stack: error.stack,
        timestamp: new Date(),
        data: request.data
      });

      return {
        success: false,
        message: error.message || 'Failed to send verification code',
        error: error.message
      };
    }
  }
);

/**
 * Verify 2FA code
 */
export const verifyTwoFactorCode = onCall(
  {
    secrets: [twilioAccountSid, twilioAuthToken, twilioVerifyServiceSid],
    cors: true,
  },
  async (request) => {
    try {
      const { phoneNumber, code } = request.data;
      
      if (!phoneNumber || !code) {
        throw new Error('Phone number and code are required');
      }

      // Validate code format
      const codeRegex = /^\d{6}$/;
      if (!codeRegex.test(code)) {
        throw new Error('Invalid code format');
      }

      // Initialize Twilio client
      const client = getTwilioClient();

      // Verify the code
      const verificationCheck = await client.verify.v2
        .services(twilioVerifyServiceSid.value())
        .verificationChecks
        .create({
          to: phoneNumber,
          code: code
        });

      // Log the verification attempt
      await db.collection('verification_logs').add({
        phoneNumber: phoneNumber,
        verificationSid: verificationCheck.sid,
        status: verificationCheck.status,
        valid: verificationCheck.valid,
        createdAt: new Date(),
        ipAddress: request.rawRequest.ip,
        userAgent: request.rawRequest.headers['user-agent']
      });

      if (verificationCheck.status === 'approved' && verificationCheck.valid) {
        // Update user's 2FA status if user is authenticated
        if (request.auth?.uid) {
          await db.collection('users').doc(request.auth.uid).update({
            twoFactorVerified: true,
            twoFactorVerifiedAt: new Date(),
            lastTwoFactorPhone: phoneNumber
          });
        }

        return {
          success: true,
          message: 'Verification successful',
          verified: true,
          status: verificationCheck.status
        };
      } else {
        return {
          success: false,
          message: 'Invalid verification code',
          verified: false,
          status: verificationCheck.status
        };
      }

    } catch (error: any) {
      console.error('Verify 2FA code error:', error);
      
      // Log the error
      await db.collection('error_logs').add({
        function: 'verifyTwoFactorCode',
        error: error.message,
        stack: error.stack,
        timestamp: new Date(),
        data: request.data
      });

      return {
        success: false,
        message: error.message || 'Failed to verify code',
        verified: false,
        error: error.message
      };
    }
  }
);

/**
 * Enable 2FA for user
 */
export const enableTwoFactor = onCall(
  {
    cors: true,
  },
  async (request) => {
    try {
      if (!request.auth?.uid) {
        throw new Error('User must be authenticated');
      }

      const { phoneNumber } = request.data;
      
      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }

      // Update user document
      await db.collection('users').doc(request.auth.uid).update({
        twoFactorEnabled: true,
        twoFactorMethod: 'whatsapp',
        twoFactorPhone: phoneNumber,
        twoFactorEnabledAt: new Date()
      });

      return {
        success: true,
        message: 'Two-factor authentication enabled successfully'
      };

    } catch (error: any) {
      console.error('Enable 2FA error:', error);
      
      return {
        success: false,
        message: error.message || 'Failed to enable 2FA',
        error: error.message
      };
    }
  }
);

/**
 * Disable 2FA for user
 */
export const disableTwoFactor = onCall(
  {
    cors: true,
  },
  async (request) => {
    try {
      if (!request.auth?.uid) {
        throw new Error('User must be authenticated');
      }

      // Update user document
      await db.collection('users').doc(request.auth.uid).update({
        twoFactorEnabled: false,
        twoFactorMethod: null,
        twoFactorPhone: null,
        twoFactorDisabledAt: new Date()
      });

      return {
        success: true,
        message: 'Two-factor authentication disabled successfully'
      };

    } catch (error: any) {
      console.error('Disable 2FA error:', error);
      
      return {
        success: false,
        message: error.message || 'Failed to disable 2FA',
        error: error.message
      };
    }
  }
);

/**
 * Get user security settings
 */
export const getSecuritySettings = onCall(
  {
    cors: true,
  },
  async (request) => {
    try {
      if (!request.auth?.uid) {
        throw new Error('User must be authenticated');
      }

      const userDoc = await db.collection('users').doc(request.auth.uid).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      
      return {
        success: true,
        data: {
          twoFactorEnabled: userData?.twoFactorEnabled || false,
          twoFactorMethod: userData?.twoFactorMethod || 'whatsapp',
          twoFactorPhone: userData?.twoFactorPhone || null,
          loginNotifications: userData?.loginNotifications || true,
          suspiciousActivityAlerts: userData?.suspiciousActivityAlerts || true,
          trustedDevices: userData?.trustedDevices || [],
          backupCodes: userData?.backupCodes || []
        }
      };

    } catch (error: any) {
      console.error('Get security settings error:', error);
      
      return {
        success: false,
        message: error.message || 'Failed to get security settings',
        error: error.message
      };
    }
  }
);

/**
 * Update user security settings
 */
export const updateSecuritySettings = onCall(
  {
    cors: true,
  },
  async (request) => {
    try {
      if (!request.auth?.uid) {
        throw new Error('User must be authenticated');
      }

      const { settings } = request.data;
      
      if (!settings) {
        throw new Error('Settings are required');
      }

      // Update user document
      await db.collection('users').doc(request.auth.uid).update({
        ...settings,
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Security settings updated successfully'
      };

    } catch (error: any) {
      console.error('Update security settings error:', error);
      
      return {
        success: false,
        message: error.message || 'Failed to update security settings',
        error: error.message
      };
    }
  }
);

/**
 * HTTP endpoint for webhook (if needed)
 */
export const twilioWebhook = onRequest(
  {
    secrets: [twilioAccountSid, twilioAuthToken],
    cors: true,
  },
  async (req, res) => {
    try {
      // Handle Twilio webhook events
      const { MessageStatus, MessageSid, To, From } = req.body;
      
      // Log webhook event
      await db.collection('webhook_logs').add({
        messageStatus: MessageStatus,
        messageSid: MessageSid,
        to: To,
        from: From,
        timestamp: new Date(),
        rawData: req.body
      });

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Error');
    }
  }
);