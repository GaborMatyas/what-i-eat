import { Navigation } from "@/components/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IngredientForm } from "@/components/ingredient-form";
import { notFound } from "next/navigation";

export default async function EditIngredientPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth();

  const ingredient = await prisma.ingredient.findUnique({
    where: { id: params.id },
  });

  if (!ingredient) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Ingredient</h1>
          <p className="text-gray-600 mt-1">
            Update nutritional information for {ingredient.name}
          </p>
        </div>

        <div className="max-w-2xl">
          <IngredientForm
            mode="edit"
            ingredient={{
              id: ingredient.id,
              name: ingredient.name,
              protein: ingredient.protein,
              fat: ingredient.fat,
              carbs: ingredient.carbs,
              kcal: ingredient.kcal,
            }}
          />
        </div>
      </main>
    </div>
  );
}
