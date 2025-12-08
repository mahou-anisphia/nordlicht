import Anthropic from "@anthropic-ai/sdk";
import { env } from "~/env";

/**
 * Anthropic client instance configured with API key from environment
 */
const anthropic = new Anthropic({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  apiKey: env.CLAUDE_API,
});

/**
 * Options for the prompt function
 */
export interface PromptOptions {
  /**
   * The model to use for the request
   * @default env.CLAUDE_HAIKU_MODEL
   */
  model?: string;
  /**
   * Maximum number of tokens to generate
   * @default 1024
   */
  maxTokens?: number;
  /**
   * Temperature for randomness (0-1)
   * @default 1
   */
  temperature?: number;
  /**
   * System prompt to guide the model's behavior
   */
  system?: string;
}

/**
 * Send a prompt to Claude and get a response
 *
 * @param userMessage - The user's message/prompt
 * @param options - Optional configuration for the request
 * @returns The text response from Claude
 *
 * @example
 * ```ts
 * const response = await prompt("What is the capital of France?");
 * console.log(response); // "The capital of France is Paris."
 * ```
 *
 * @example
 * ```ts
 * const response = await prompt("Write a haiku about coding", {
 *   model: env.CLAUDE_SONNET_MODEL,
 *   maxTokens: 100,
 *   temperature: 0.7,
 *   system: "You are a creative poet."
 * });
 * ```
 */
export async function prompt(
  userMessage: string,
  options: PromptOptions = {},
): Promise<string> {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    model = env.CLAUDE_HAIKU_MODEL,
    maxTokens = 1024,
    temperature = 1,
    system,
  } = options;

  const message = await anthropic.messages.create({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    model,
    max_tokens: maxTokens,
    temperature,
    ...(system && { system }),
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const content = message.content[0];
  if (content?.type === "text") {
    return content.text;
  }

  throw new Error("Unexpected response format from Claude API");
}
