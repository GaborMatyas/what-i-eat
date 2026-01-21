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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Search, Calendar, Copy } from "lucide-react";
import { DeleteDayPlanButton } from "@/components/delete-day-plan-button";
import { DuplicateDayPlanButton } from "@/components/duplicate-day-plan-button";

export default async function DayPlansPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  await requireAuth();

  const search = searchParams.search || "";

  const dayPlans = await prisma.dayPlan.findMany({
    where: search
      ? {
          name: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {},
    orderBy: {
      name: "asc",
    },
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
      },
    },
  });

  // Calculate macros for each day plan
  const dayPlansWithMacros = dayPlans.map((dayPlan) => {
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let totalKcal = 0;

    dayPlan.meals.forEach((meal) => {
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

      totalProtein += recipeProtein * portionRatio;
      totalFat += recipeFat * portionRatio;
      totalCarbs += recipeCarbs * portionRatio;
      totalKcal += recipeKcal * portionRatio;
    });

    return {
      ...dayPlan,
      totalProtein,
      totalFat,
      totalCarbs,
      totalKcal,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Day Plans</h1>
            <p className="text-gray-600 mt-1">
              Manage your meal plans with calculated macros
            </p>
          </div>
          <Link href="/day-plans/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Day Plan
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Day Plans</CardTitle>
            <CardDescription>
              Named meal plans with recipes and portion sizes
            </CardDescription>
            <div className="pt-4">
              <form action="/day-plans" method="get" className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    name="search"
                    placeholder="Search day plans..."
                    defaultValue={search}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="outline">
                  Search
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            {dayPlansWithMacros.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {search
                    ? "No day plans found matching your search."
                    : "No day plans yet. Create your first one!"}
                </p>
                <Link href="/day-plans/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Day Plan
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dayPlansWithMacros.map((dayPlan) => (
                  <Card
                    key={dayPlan.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link href={`/day-plans/${dayPlan.id}`}>
                            <CardTitle className="hover:text-blue-600 cursor-pointer">
                              {dayPlan.name}
                            </CardTitle>
                          </Link>
                          {dayPlan.description && (
                            <CardDescription className="mt-1">
                              {dayPlan.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="pt-2">
                        <Badge variant="secondary">
                          {dayPlan.meals.length}{" "}
                          {dayPlan.meals.length === 1 ? "meal" : "meals"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Macro Summary */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="text-xs text-blue-600">Protein</p>
                            <p className="font-bold text-blue-900">
                              {dayPlan.totalProtein.toFixed(1)}g
                            </p>
                          </div>
                          <div className="bg-amber-50 p-2 rounded">
                            <p className="text-xs text-amber-600">Fat</p>
                            <p className="font-bold text-amber-900">
                              {dayPlan.totalFat.toFixed(1)}g
                            </p>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-xs text-green-600">Carbs</p>
                            <p className="font-bold text-green-900">
                              {dayPlan.totalCarbs.toFixed(1)}g
                            </p>
                          </div>
                          <div className="bg-red-50 p-2 rounded">
                            <p className="text-xs text-red-600">Calories</p>
                            <p className="font-bold text-red-900">
                              {dayPlan.totalKcal.toFixed(0)} kcal
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Link
                            href={`/day-plans/${dayPlan.id}`}
                            className="flex-1"
                          >
                            <Button variant="outline" size="sm" className="w-full">
                              View
                            </Button>
                          </Link>
                          <Link href={`/day-plans/${dayPlan.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <DuplicateDayPlanButton
                            id={dayPlan.id}
                            name={dayPlan.name}
                          />
                          <DeleteDayPlanButton
                            id={dayPlan.id}
                            name={dayPlan.name}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
