import { Navigation } from "@/components/navigation";
import { requireAuth } from "@/lib/auth";
import { IngredientForm } from "@/components/ingredient-form";

export default async function NewIngredientPage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Ingredient</h1>
          <p className="text-gray-600 mt-1">
            Add a new ingredient to your database
          </p>
        </div>

        <div className="max-w-2xl">
          <IngredientForm mode="create" />
        </div>
      </main>
    </div>
  );
}
