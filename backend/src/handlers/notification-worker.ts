import { SQSEvent, SQSBatchResponse, SQSBatchItemFailure } from 'aws-lambda';
import { getItem, putItem } from '../utils/dynamodb-client';
import {
  sendEmail,
  sendSMS,
  SQSNotificationMessage,
  NotificationEvent,
} from '../utils/notification-service';

/**
 * SQS Worker Lambda — processes notification messages with retry support.
 * Uses partial batch failure reporting so only failed messages get retried.
 * After 3 failures, messages go to the Dead Letter Queue.
 */
export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      const message: SQSNotificationMessage = JSON.parse(record.body);
      const notifEvent = message.event;

      const attemptNumber = parseInt(
        record.attributes?.ApproximateReceiveCount || '1',
        10
      );

      console.log(
        `Processing notification [${message.messageId}]: ` +
        `type=${notifEvent.type}, user=${notifEvent.userId}, attempt=${attemptNumber}`
      );

      // 1. Read user preferences
      let userEmail = notifEvent.email;
      let phoneNumber: string | undefined;
      let emailEnabled = true;
      let smsEnabled = false;

      const userProfile = await getItem(`USER#${notifEvent.userId}`, 'PROFILE');
      if (userProfile?.Data) {
        userEmail = userEmail || userProfile.Data.email;
        phoneNumber = userProfile.Data.phoneNumber;
        const prefs = userProfile.Data.preferences?.notifications;
        if (prefs) {
          emailEnabled = prefs.email !== false;
          smsEnabled = prefs.sms === true;
        }
      }

      // 2. Send via channels
      let emailStatus: 'sent' | 'skipped' | 'error' = 'skipped';
      let smsStatus: 'sent' | 'skipped' | 'error' = 'skipped';
      let errorMessage: string | undefined;

      if (emailEnabled && userEmail) {
        try {
          await sendEmail(notifEvent, userEmail);
          emailStatus = 'sent';
        } catch (err: any) {
          emailStatus = 'error';
          errorMessage = err.message;
          console.error(`Email failed [${message.messageId}]:`, err.message);
        }
      }

      if (smsEnabled && phoneNumber) {
        try {
          await sendSMS(notifEvent, phoneNumber);
          smsStatus = 'sent';
        } catch (err: any) {
          smsStatus = 'error';
          errorMessage = (errorMessage ? errorMessage + '; ' : '') + err.message;
          console.error(`SMS failed [${message.messageId}]:`, err.message);
        }
      }

      // 3. Determine overall status
      const hasError = emailStatus === 'error' || smsStatus === 'error';
      const hasSent = emailStatus === 'sent' || smsStatus === 'sent';
      let status: 'SENT' | 'PARTIAL' | 'FAILED';

      if (hasError && !hasSent) {
        status = 'FAILED';
      } else if (hasError && hasSent) {
        status = 'PARTIAL';
      } else {
        status = 'SENT';
      }

      // 4. Log to DynamoDB
      const now = new Date().toISOString();
      const ttl = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60; // 90 days

      await putItem({
        PK: `NOTIFICATION#${notifEvent.userId}`,
        SK: `TIMESTAMP#${now}#${message.messageId}`,
        EntityType: 'NotificationLog',
        GSI1PK: `NOTIF_STATUS#${status}`,
        GSI1SK: `TIMESTAMP#${now}`,
        Data: {
          messageId: message.messageId,
          type: notifEvent.type,
          channels: { email: emailEnabled && !!userEmail, sms: smsEnabled && !!phoneNumber },
          status,
          emailStatus,
          smsStatus,
          errorMessage,
          enqueuedAt: message.enqueuedAt,
          processedAt: now,
          attemptNumber,
        },
        TTL: ttl,
      });

      // 5. Only retry if ALL channels failed
      if (status === 'FAILED') {
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }

      console.log(
        `Notification processed [${message.messageId}]: status=${status}, ` +
        `email=${emailStatus}, sms=${smsStatus}`
      );
    } catch (err: any) {
      console.error(`Unexpected error processing SQS record ${record.messageId}:`, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}
