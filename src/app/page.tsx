"use client";

import { useState } from "react";
import { differenceInDays, format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export default function Home() {
  const [goalText, setGoalText] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const utils = api.useUtils();

  const createGoal = api.goal.create.useMutation({
    onSuccess: () => {
      setGoalText("");
      setTargetDate("");
      void utils.goal.getAll.invalidate();
    },
  });

  const { data: goals, isLoading } = api.goal.getAll.useQuery();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalText && targetDate) {
      createGoal.mutate({
        goalText,
        targetDate: new Date(targetDate),
      });
    }
  };

  const deleteGoal = api.goal.delete.useMutation({
    onSuccess: () => {
      void utils.goal.getAll.invalidate();
    },
  });

  const getDaysRemaining = (targetDate: Date) => {
    return differenceInDays(targetDate, new Date());
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">My Goals</h1>
        <p className="text-muted-foreground">
          Track your goals and stay motivated with AI-powered email reminders
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create a New Goal</CardTitle>
          <CardDescription>
            What do you want to achieve? Set a target date and get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goalText">Goal</Label>
              <Input
                id="goalText"
                placeholder="e.g., Complete my first marathon"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={createGoal.isPending}
              className="w-full"
            >
              {createGoal.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your Goals</h2>
        {isLoading && <p className="text-muted-foreground">Loading goals...</p>}

        {!isLoading && goals?.length === 0 && (
          <p className="text-muted-foreground">
            No goals yet. Create your first goal above!
          </p>
        )}

        {goals?.map((goal) => {
          const daysRemaining = getDaysRemaining(goal.targetDate);
          return (
            <Card key={goal.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold">
                      {goal.goalText}
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        Target Date: {format(goal.targetDate, "MMMM d, yyyy")}
                      </p>
                      <p>
                        {daysRemaining > 0 && (
                          <span className="font-medium text-blue-600">
                            {daysRemaining} days remaining
                          </span>
                        )}
                        {daysRemaining === 0 && (
                          <span className="font-medium text-orange-600">
                            Due today!
                          </span>
                        )}
                        {daysRemaining < 0 && (
                          <span className="font-medium text-red-600">
                            {Math.abs(daysRemaining)} days overdue
                          </span>
                        )}
                      </p>
                      <p className="text-xs">
                        Created: {format(goal.createdAt, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteGoal.mutate({ id: goal.id })}
                    disabled={deleteGoal.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
