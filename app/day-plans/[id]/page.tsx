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
import { Calendar, Edit, UtensilsCrossed } from "lucide-react";

export default async function DayPlanDetailPage({
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
          recipe: {
            include: {
              ingredients: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
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

  // Calculate total macros and individual meal macros
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalKcal = 0;

  const mealsWithMacros = dayPlan.meals.map((meal) => {
    // Calculate recipe totals
    let recipeTotalRawWeight = 0;
    let recipeProtein = 0;
    let recipeFat = 0;
    let recipeCarbs = 0;
    let recipeKcal = 0;

    meal.recipe.ingredients.forEach((recipeIngredient) => {
      const weight = recipeIngredient.weight;
      const ingredient = recipeIngredient.ingredient;

      recipeTotalRawWeight += weight;
      recipeProtein += (ingredient.protein / 100) * weight;
      recipeFat += (ingredient.fat / 100) * weight;
      recipeCarbs += (ingredient.carbs / 100) * weight;
      recipeKcal += (ingredient.kcal / 100) * weight;
    });

    // Calculate portion macros based on cooked weight or raw weight
    const baseWeight = meal.recipe.cookedWeight || recipeTotalRawWeight;
    const portionRatio = meal.portionSize / baseWeight;

    const mealProtein = recipeProtein * portionRatio;
    const mealFat = recipeFat * portionRatio;
    const mealCarbs = recipeCarbs * portionRatio;
    const mealKcal = recipeKcal * portionRatio;

    totalProtein += mealProtein;
    totalFat += mealFat;
    totalCarbs += mealCarbs;
    totalKcal += mealKcal;

    return {
      ...meal,
      macros: {
        protein: mealProtein,
        fat: mealFat,
        carbs: mealCarbs,
        kcal: mealKcal,
      },
      recipeInfo: {
        totalRawWeight: recipeTotalRawWeight,
        cookedWeight: meal.recipe.cookedWeight,
        baseWeight,
        portionPercentage: (portionRatio * 100).toFixed(1),
      },
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              {dayPlan.name}
            </h1>
            {dayPlan.description && (
              <p className="text-gray-600 mt-1">{dayPlan.description}</p>
            )}
          </div>
          <Link href={`/day-plans/${dayPlan.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Plan
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          {/* Total Daily Macros */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl">Total Daily Macros</CardTitle>
              <CardDescription>
                Complete nutritional breakdown for this day plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-blue-600 mb-2">Protein</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {totalProtein.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">grams</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-amber-600 mb-2">Fat</p>
                  <p className="text-3xl font-bold text-amber-900">
                    {totalFat.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">grams</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-green-600 mb-2">Carbs</p>
                  <p className="text-3xl font-bold text-green-900">
                    {totalCarbs.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">grams</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-red-600 mb-2">Calories</p>
                  <p className="text-3xl font-bold text-red-900">
                    {totalKcal.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">kcal</p>
                </div>
              </div>

              {/* Macro Percentages */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Macro Distribution
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-blue-600">Protein</span>
                      <span className="font-semibold">
                        {(
                          (totalProtein * 4 / totalKcal) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${
                            (totalProtein * 4 / totalKcal) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-amber-600">Fat</span>
                      <span className="font-semibold">
                        {((totalFat * 9 / totalKcal) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{
                          width: `${(totalFat * 9 / totalKcal) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-green-600">Carbs</span>
                      <span className="font-semibold">
                        {(
                          (totalCarbs * 4 / totalKcal) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${
                            (totalCarbs * 4 / totalKcal) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meals Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Meals ({mealsWithMacros.length})</CardTitle>
              <CardDescription>
                Individual meal breakdown with portion calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mealsWithMacros.map((meal, index) => (
                  <div
                    key={meal.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Meal {index + 1}</Badge>
                          <UtensilsCrossed className="h-4 w-4 text-gray-400" />
                        </div>
                        <Link
                          href={`/recipes/${meal.recipe.id}`}
                          className="text-lg font-semibold hover:text-blue-600 mt-1 block"
                        >
                          {meal.recipe.name}
                        </Link>
                        {meal.recipe.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {meal.recipe.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Portion Information */}
                    <div className="mb-3 p-3 bg-white rounded border border-gray-200">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Your Portion</p>
                          <p className="font-bold text-lg">
                            {meal.portionSize.toFixed(0)}g
                          </p>
                          <p className="text-xs text-gray-500">
                            {meal.recipeInfo.cookedWeight
                              ? "cooked"
                              : "raw"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Recipe Total</p>
                          <p className="font-bold text-lg">
                            {meal.recipeInfo.baseWeight.toFixed(0)}g
                          </p>
                          <p className="text-xs text-gray-500">
                            {meal.recipeInfo.cookedWeight
                              ? `cooked (${meal.recipeInfo.totalRawWeight.toFixed(
                                  0
                                )}g raw)`
                              : "raw"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Portion</p>
                          <p className="font-bold text-lg">
                            {meal.recipeInfo.portionPercentage}%
                          </p>
                          <p className="text-xs text-gray-500">of recipe</p>
                        </div>
                      </div>
                    </div>

                    {/* Meal Macros */}
                    <Separator className="my-3" />
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-xs text-blue-600">Protein</p>
                        <p className="font-bold text-blue-900">
                          {meal.macros.protein.toFixed(1)}g
                        </p>
                      </div>
                      <div className="bg-amber-50 p-2 rounded">
                        <p className="text-xs text-amber-600">Fat</p>
                        <p className="font-bold text-amber-900">
                          {meal.macros.fat.toFixed(1)}g
                        </p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-xs text-green-600">Carbs</p>
                        <p className="font-bold text-green-900">
                          {meal.macros.carbs.toFixed(1)}g
                        </p>
                      </div>
                      <div className="bg-red-50 p-2 rounded">
                        <p className="text-xs text-red-600">Calories</p>
                        <p className="font-bold text-red-900">
                          {meal.macros.kcal.toFixed(0)} kcal
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
