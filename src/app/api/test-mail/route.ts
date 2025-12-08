import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "~/server/services/mail";

/**
 * Test API route for Resend mail service
 *
 * GET /api/test-mail?to=email@example.com - Send a test email
 *
 * IMPORTANT: This is a test endpoint. In production, you should:
 * 1. Add authentication/authorization
 * 2. Rate limiting
 * 3. Use POST instead of GET
 * 4. Validate email addresses
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const toEmail = searchParams.get("to");

    if (!toEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing 'to' parameter. Usage: /api/test-mail?to=email@example.com",
        },
        { status: 400 },
      );
    }

    const result = await sendMail({
      to: toEmail,
      subject: "Test Email from Nordlicht",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your Nordlicht application.</p>
        <p>If you're seeing this, your email service is working correctly!</p>
        <hr />
        <p><small>Sent at ${new Date().toISOString()}</small></p>
      `,
      text: `
Test Email

This is a test email from your Nordlicht application.
If you're seeing this, your email service is working correctly!

Sent at ${new Date().toISOString()}
      `,
    });

    return NextResponse.json({
      success: true,
      data: {
        emailId: result.id,
        to: toEmail,
        message: "Email sent successfully",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Mail service test error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
