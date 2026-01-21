import { Navigation } from "@/components/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DayPlanForm } from "@/components/day-plan-form";
import { notFound } from "next/navigation";

export default async function EditDayPlanPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth();

  const dayPlan = await prisma.dayPlan.findUnique({
    where: { id: params.id },
    include: {
      meals: {
        include: {
          recipe: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!dayPlan) {
    notFound();
  }

  // Get all available recipes with their ingredients
  const availableRecipes = await prisma.recipe.findMany({
    orderBy: { name: "asc" },
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Day Plan</h1>
          <p className="text-gray-600 mt-1">
            Update meals and portions for {dayPlan.name}
          </p>
        </div>

        <div className="max-w-3xl">
          <DayPlanForm
            mode="edit"
            dayPlan={{
              id: dayPlan.id,
              name: dayPlan.name,
              description: dayPlan.description,
              meals: dayPlan.meals.map((meal) => ({
                recipeId: meal.recipeId,
                portionSize: meal.portionSize,
              })),
            }}
            availableRecipes={availableRecipes}
          />
        </div>
      </main>
    </div>
  );
}
