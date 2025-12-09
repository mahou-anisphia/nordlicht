import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import { differenceInDays } from "date-fns";

const anthropic = new Anthropic({
  apiKey: env.CLAUDE_API,
});

const resend = new Resend(env.RESEND_API_KEY);

export const emailRouter = createTRPCRouter({
  sendGoalEmail: publicProcedure
    .input(
      z.object({
        goalId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch the goal with user information
      const goal = await ctx.db.goal.findFirst({
        where: {
          id: input.goalId,
        },
        include: {
          user: true,
        },
      });

      if (!goal) {
        throw new Error("Goal not found");
      }

      // Calculate days remaining
      const daysRemaining = differenceInDays(goal.targetDate, new Date());

      // Generate email content using Anthropic
      const message = await anthropic.messages.create({
        model: env.CLAUDE_HAIKU_MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are a motivational coach. Generate an encouraging and personalized email for a user working towards their goal.

Goal: ${goal.goalText}
Days remaining: ${daysRemaining} days
Target date: ${goal.targetDate.toLocaleDateString()}

The email should:
- Be encouraging and motivational
- Acknowledge the time remaining
- Provide actionable advice or tips
- Be concise (2-3 short paragraphs)
- Have a warm, supportive tone
- End with encouragement

Generate ONLY the email body content (no subject line, no salutation, just the content).`,
          },
        ],
      });

      // Extract the generated text
      const emailContent =
        message.content[0]?.type === "text" ? message.content[0].text : "";
      if (!goal.user.email) {
        return {
          success: false,
          message: "The user has no registered email",
        };
      }
      // Send email via Resend
      const emailResult = await resend.emails.send({
        from: env.RESEND_FROM_NAME
          ? `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`
          : env.RESEND_FROM_EMAIL,
        to: goal.user.email,
        subject: `Your Goal Progress: ${goal.goalText.substring(0, 50)}${goal.goalText.length > 50 ? "..." : ""}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Hi ${goal.user.name ?? "there"}!</h2>
            <div style="color: #555; line-height: 1.6;">
              ${emailContent
                .split("\n")
                .map((para) => `<p>${para}</p>`)
                .join("")}
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px;">
              <p>Goal: ${goal.goalText}</p>
              <p>Target Date: ${goal.targetDate.toLocaleDateString()}</p>
              <p>Days Remaining: ${daysRemaining}</p>
            </div>
          </div>
        `,
      });

      return {
        success: true,
        emailId: emailResult.data?.id,
        daysRemaining,
      };
    }),
});
