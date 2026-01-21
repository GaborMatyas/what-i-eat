import { Navigation } from "@/components/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecipeForm } from "@/components/recipe-form";
import { notFound } from "next/navigation";

export default async function EditRecipePage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth();

  const recipe = await prisma.recipe.findUnique({
    where: { id: params.id },
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  if (!recipe) {
    notFound();
  }

  // Get all available ingredients
  const availableIngredients = await prisma.ingredient.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Recipe</h1>
          <p className="text-gray-600 mt-1">
            Update ingredients and weights for {recipe.name}
          </p>
        </div>

        <div className="max-w-3xl">
          <RecipeForm
            mode="edit"
            recipe={{
              id: recipe.id,
              name: recipe.name,
              description: recipe.description,
              cookedWeight: recipe.cookedWeight,
              ingredients: recipe.ingredients.map((ri) => ({
                ingredientId: ri.ingredientId,
                weight: ri.weight,
              })),
            }}
            availableIngredients={availableIngredients}
          />
        </div>
      </main>
    </div>
  );
}
