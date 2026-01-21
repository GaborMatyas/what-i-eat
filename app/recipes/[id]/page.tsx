import { Navigation } from "@/components/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChefHat, Edit, Scale } from "lucide-react";
import { UpdateCookedWeightForm } from "@/components/update-cooked-weight-form";

export default async function RecipeDetailPage({
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
      meals: {
        include: {
          dayPlan: true,
        },
      },
    },
  });

  if (!recipe) {
    notFound();
  }

  // Calculate macros
  let totalRawWeight = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalKcal = 0;

  recipe.ingredients.forEach((recipeIngredient) => {
    const weight = recipeIngredient.weight;
    const ingredient = recipeIngredient.ingredient;

    totalRawWeight += weight;
    totalProtein += (ingredient.protein / 100) * weight;
    totalFat += (ingredient.fat / 100) * weight;
    totalCarbs += (ingredient.carbs / 100) * weight;
    totalKcal += (ingredient.kcal / 100) * weight;
  });

  // Calculate per 100g (cooked if available, otherwise raw)
  const per100g = recipe.cookedWeight
    ? {
        protein: (totalProtein / recipe.cookedWeight) * 100,
        fat: (totalFat / recipe.cookedWeight) * 100,
        carbs: (totalCarbs / recipe.cookedWeight) * 100,
        kcal: (totalKcal / recipe.cookedWeight) * 100,
      }
    : {
        protein: (totalProtein / totalRawWeight) * 100,
        fat: (totalFat / totalRawWeight) * 100,
        carbs: (totalCarbs / totalRawWeight) * 100,
        kcal: (totalKcal / totalRawWeight) * 100,
      };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ChefHat className="h-8 w-8" />
              {recipe.name}
            </h1>
            {recipe.description && (
              <p className="text-gray-600 mt-1">{recipe.description}</p>
            )}
          </div>
          <Link href={`/recipes/${recipe.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Recipe
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients (Raw)</CardTitle>
              <CardDescription>
                Raw weights of ingredients in this recipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recipe.ingredients.map((recipeIngredient) => (
                  <div
                    key={recipeIngredient.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                  >
                    <span className="font-medium">
                      {recipeIngredient.ingredient.name}
                    </span>
                    <Badge variant="secondary">
                      {recipeIngredient.weight.toFixed(0)}g
                    </Badge>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between items-center font-semibold">
                <span>Total Raw Weight</span>
                <span className="text-lg">{totalRawWeight.toFixed(0)}g</span>
              </div>
            </CardContent>
          </Card>

          {/* Cooked Weight */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Cooked Weight
              </CardTitle>
              <CardDescription>
                Enter the total weight after cooking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recipe.cookedWeight ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 mb-2">
                      Current cooked weight:
                    </p>
                    <p className="text-3xl font-bold text-green-900">
                      {recipe.cookedWeight.toFixed(0)}g
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Weight change:</strong>{" "}
                      {recipe.cookedWeight > totalRawWeight ? (
                        <span className="text-blue-600">
                          +
                          {(
                            ((recipe.cookedWeight - totalRawWeight) /
                              totalRawWeight) *
                            100
                          ).toFixed(1)}
                          % (absorbed liquid)
                        </span>
                      ) : (
                        <span className="text-orange-600">
                          -
                          {(
                            ((totalRawWeight - recipe.cookedWeight) /
                              totalRawWeight) *
                            100
                          ).toFixed(1)}
                          % (lost moisture)
                        </span>
                      )}
                    </p>
                  </div>
                  <UpdateCookedWeightForm
                    recipeId={recipe.id}
                    currentWeight={recipe.cookedWeight}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      No cooked weight set yet. After cooking, weigh the entire
                      dish and enter it below.
                    </p>
                  </div>
                  <UpdateCookedWeightForm recipeId={recipe.id} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Macros */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Nutritional Information (Total Recipe)</CardTitle>
              <CardDescription>
                Total macros for the entire recipe (all ingredients combined)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Weight</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recipe.cookedWeight
                      ? recipe.cookedWeight.toFixed(0)
                      : totalRawWeight.toFixed(0)}
                    g
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {recipe.cookedWeight ? "cooked" : "raw"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Protein</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalProtein.toFixed(1)}g
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Fat</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {totalFat.toFixed(1)}g
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Carbs</p>
                  <p className="text-2xl font-bold text-green-600">
                    {totalCarbs.toFixed(1)}g
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Calories</p>
                  <p className="text-2xl font-bold text-red-600">
                    {totalKcal.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">kcal</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per 100g */}
          <Card className="md:col-span-2 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>Per 100g</CardTitle>
              <CardDescription>
                Nutritional values per 100g of{" "}
                {recipe.cookedWeight ? "cooked" : "raw"} food
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-700 mb-2">Protein</p>
                  <p className="text-xl font-bold text-blue-700">
                    {per100g.protein.toFixed(1)}g
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 mb-2">Fat</p>
                  <p className="text-xl font-bold text-amber-700">
                    {per100g.fat.toFixed(1)}g
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 mb-2">Carbs</p>
                  <p className="text-xl font-bold text-green-700">
                    {per100g.carbs.toFixed(1)}g
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 mb-2">Calories</p>
                  <p className="text-xl font-bold text-red-700">
                    {per100g.kcal.toFixed(0)} kcal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage */}
          {recipe.meals.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Used in Day Plans</CardTitle>
                <CardDescription>
                  This recipe is used in the following day plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recipe.meals.map((meal) => (
                    <Link
                      key={meal.id}
                      href={`/day-plans/${meal.dayPlan.id}`}
                      className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{meal.dayPlan.name}</span>
                        <Badge variant="secondary">
                          {meal.portionSize.toFixed(0)}g portion
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
