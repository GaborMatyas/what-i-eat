import { Navigation } from "@/components/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DayPlanForm } from "@/components/day-plan-form";

export default async function NewDayPlanPage() {
  await requireAuth();

  // Get all recipes with their ingredients for the form
  const recipes = await prisma.recipe.findMany({
    orderBy: { name: "asc" },
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  if (recipes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Day Plan</h1>
            <p className="text-gray-600 mt-1">
              Create a meal plan for the day
            </p>
          </div>

          <div className="max-w-2xl">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-900 mb-2">
                No Recipes Available
              </h3>
              <p className="text-yellow-800 mb-4">
                You need to create recipes before you can create day plans.
              </p>
              <a
                href="/recipes/new"
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Create Recipes
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Day Plan</h1>
          <p className="text-gray-600 mt-1">
            Select recipes and specify portion sizes for each meal
          </p>
        </div>

        <div className="max-w-3xl">
          <DayPlanForm mode="create" availableRecipes={recipes} />
        </div>
      </main>
    </div>
  );
}
