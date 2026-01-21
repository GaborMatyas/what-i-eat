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
import { Apple, BookOpen, Calendar, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const user = await requireAuth();

  // Get counts
  const [ingredientCount, recipeCount, dayPlanCount] = await Promise.all([
    prisma.ingredient.count(),
    prisma.recipe.count(),
    prisma.dayPlan.count(),
  ]);

  // Get recent recipes
  const recentRecipes = await prisma.recipe.findMany({
    take: 5,
    orderBy: { updatedAt: "desc" },
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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name || user.email}!
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your ingredients, recipes, and meal plans
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingredients</CardTitle>
              <Apple className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ingredientCount}</div>
              <p className="text-xs text-muted-foreground">
                Total ingredients in database
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recipes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recipeCount}</div>
              <p className="text-xs text-muted-foreground">
                Total recipes created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Day Plans</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dayPlanCount}</div>
              <p className="text-xs text-muted-foreground">
                Meal plans ready to use
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/ingredients">
                <Button className="w-full justify-start" variant="outline">
                  <Apple className="mr-2 h-4 w-4" />
                  Add New Ingredient
                </Button>
              </Link>
              <Link href="/recipes">
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create Recipe
                </Button>
              </Link>
              <Link href="/day-plans">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Plan Your Day
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Recipes</CardTitle>
              <CardDescription>Your recently updated recipes</CardDescription>
            </CardHeader>
            <CardContent>
              {recentRecipes.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No recipes yet. Create your first one!
                </p>
              ) : (
                <div className="space-y-2">
                  {recentRecipes.map((recipe: any) => (
                    <Link
                      key={recipe.id}
                      href={`/recipes/${recipe.id}`}
                      className="block p-3 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{recipe.name}</p>
                          <p className="text-xs text-gray-500">
                            {recipe.ingredients.length} ingredient
                            {recipe.ingredients.length !== 1 ? "s" : ""}
                            {recipe.cookedWeight &&
                              ` • ${recipe.cookedWeight}g cooked`}
                          </p>
                        </div>
                        <UtensilsCrossed className="h-4 w-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        {ingredientCount === 0 && recipeCount === 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>🎉 Getting Started</CardTitle>
              <CardDescription>
                Welcome to What I Eat! Here&apos;s how to begin:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>1. Add Ingredients:</strong> Start by adding your base
                ingredients with their nutritional values (per 100g).
              </p>
              <p>
                <strong>2. Create Recipes:</strong> Combine ingredients to
                create recipes. You can specify raw weights and cooked weights.
              </p>
              <p>
                <strong>3. Build Meal Plans:</strong> Create day plans with your
                favorite recipes and portion sizes.
              </p>
              <p className="pt-2">
                <Link href="/ingredients">
                  <Button>Add Your First Ingredient</Button>
                </Link>
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
