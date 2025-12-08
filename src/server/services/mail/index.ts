/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Resend } from "resend";
import { env } from "~/env";

/**
 * Resend client instance configured with API key from environment
 */
const resend = new Resend(env.RESEND_API_KEY);

/**
 * Email recipient configuration
 */
export interface EmailRecipient {
  /**
   * Email address
   */
  email: string;
  /**
   * Optional recipient name
   */
  name?: string;
}

/**
 * Options for sending an email
 */
export interface SendMailOptions {
  /**
   * Recipient email address or recipient object
   */
  to: string | EmailRecipient | Array<string | EmailRecipient>;
  /**
   * Email subject line
   */
  subject: string;
  /**
   * Email body in HTML format
   */
  html?: string;
  /**
   * Email body in plain text format
   */
  text?: string;
  /**
   * Optional custom from address (must be verified in Resend)
   * @default env.RESEND_FROM_EMAIL
   */
  from?: string;
  /**
   * Optional reply-to address
   */
  replyTo?: string;
  /**
   * Optional CC recipients
   */
  cc?: string | EmailRecipient | Array<string | EmailRecipient>;
  /**
   * Optional BCC recipients
   */
  bcc?: string | EmailRecipient | Array<string | EmailRecipient>;
}

/**
 * Response from sending an email
 */
export interface SendMailResponse {
  /**
   * Unique ID of the sent email
   */
  id: string;
}

/**
 * Format recipient for Resend API
 */
function formatRecipient(recipient: string | EmailRecipient): string {
  if (typeof recipient === "string") {
    return recipient;
  }
  return recipient.name
    ? `${recipient.name} <${recipient.email}>`
    : recipient.email;
}

/**
 * Format recipients array for Resend API
 */
function formatRecipients(
  recipients: string | EmailRecipient | Array<string | EmailRecipient>,
): string | string[] {
  if (Array.isArray(recipients)) {
    return recipients.map(formatRecipient);
  }
  return formatRecipient(recipients);
}

/**
 * Send an email using Resend
 *
 * @param options - Email configuration options
 * @returns Response object with email ID
 *
 * @example
 * ```ts
 * // Simple text email
 * await sendMail({
 *   to: "user@example.com",
 *   subject: "Welcome!",
 *   text: "Thanks for signing up!"
 * });
 * ```
 *
 * @example
 * ```ts
 * // HTML email with custom from
 * await sendMail({
 *   to: { email: "user@example.com", name: "John Doe" },
 *   subject: "Welcome to Nordlicht",
 *   html: "<h1>Welcome!</h1><p>Thanks for joining us.</p>",
 *   from: "hello@yourdomain.com",
 *   replyTo: "support@yourdomain.com"
 * });
 * ```
 *
 * @example
 * ```ts
 * // Multiple recipients with CC
 * await sendMail({
 *   to: ["user1@example.com", "user2@example.com"],
 *   subject: "Team Update",
 *   text: "Here's the latest update...",
 *   cc: "manager@example.com"
 * });
 * ```
 */
export async function sendMail(
  options: SendMailOptions,
): Promise<SendMailResponse> {
  const { to, subject, html, text, from, replyTo, cc, bcc } = options;

  if (!html && !text) {
    throw new Error("Either html or text content must be provided");
  }

  const fromAddress = from ?? env.RESEND_FROM_EMAIL;
  const fromName = env.RESEND_FROM_NAME;
  const fromFormatted = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

  // Build email payload - using Record to satisfy Resend's complex union types
  const emailPayload: Record<string, unknown> = {
    from: fromFormatted,
    to: formatRecipients(to),
    subject,
  };

  if (html) emailPayload.html = html;
  if (text) emailPayload.text = text;
  if (replyTo) emailPayload.reply_to = replyTo;
  if (cc) emailPayload.cc = formatRecipients(cc);
  if (bcc) emailPayload.bcc = formatRecipients(bcc);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await resend.emails.send(emailPayload as any);

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error("No email ID returned from Resend");
  }

  return { id: data.id };
}
