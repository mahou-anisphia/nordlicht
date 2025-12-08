import { NextRequest, NextResponse } from "next/server";
import { prompt } from "~/server/services/anthorpic";

/**
 * Test API route for Anthropic AI service
 *
 * GET /api/test-ai - Test with default prompt
 * GET /api/test-ai?message=your+message - Test with custom message
 * GET /api/test-ai?message=your+message&model=sonnet - Test with Sonnet model
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userMessage =
      searchParams.get("message") ?? "What is TypeScript in one sentence?";
    const useModel = searchParams.get("model");

    // Determine which model to use
    const modelOptions =
      useModel === "sonnet"
        ? { model: process.env.CLAUDE_SONNET_MODEL }
        : {};

    const response = await prompt(userMessage, modelOptions);

    return NextResponse.json({
      success: true,
      data: {
        prompt: userMessage,
        response,
        model: useModel === "sonnet" ? "Sonnet" : "Haiku (default)",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI service test error:", error);
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
