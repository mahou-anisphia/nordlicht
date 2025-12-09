import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const goalRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        goalText: z.string().min(1, "Goal text is required"),
        targetDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goal.create({
        data: {
          goalText: input.goalText,
          targetDate: input.targetDate,
          userId: ctx.session.user.id,
        },
      });
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.goal.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const goal = await ctx.db.goal.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      return goal;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goal.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
    }),
});