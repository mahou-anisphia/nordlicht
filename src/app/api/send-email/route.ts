import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const SendEmailSchema = z.object({
  goalId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body = await request.json();
    const { goalId } = SendEmailSchema.parse(body);

    // Create tRPC context and caller
    const ctx = await createTRPCContext({
      headers: request.headers,
    });

    // Create the tRPC caller
    const caller = createCaller(ctx);

    // Call the tRPC email procedure
    const result = await caller.email.sendGoalEmail({ goalId });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error sending email:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "An unknown error occurred",
      },
      { status: 500 },
    );
  }
}
