import { Navigation } from "@/components/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecipeForm } from "@/components/recipe-form";

export default async function NewRecipePage() {
  await requireAuth();

  // Get all ingredients for the form
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { name: "asc" },
  });

  if (ingredients.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Recipe</h1>
            <p className="text-gray-600 mt-1">
              Create a recipe from your ingredients
            </p>
          </div>

          <div className="max-w-2xl">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-900 mb-2">
                No Ingredients Available
              </h3>
              <p className="text-yellow-800 mb-4">
                You need to add ingredients before you can create recipes.
              </p>
              <a
                href="/ingredients/new"
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Add Ingredients
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
          <h1 className="text-3xl font-bold text-gray-900">Create New Recipe</h1>
          <p className="text-gray-600 mt-1">
            Select ingredients and specify their raw weights
          </p>
        </div>

        <div className="max-w-3xl">
          <RecipeForm mode="create" availableIngredients={ingredients} />
        </div>
      </main>
    </div>
  );
}
