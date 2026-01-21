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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Search, ChefHat } from "lucide-react";
import { DeleteRecipeButton } from "@/components/delete-recipe-button";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  await requireAuth();

  const search = searchParams.search || "";

  const recipes = await prisma.recipe.findMany({
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
      ingredients: {
        include: {
          ingredient: true,
        },
      },
      _count: {
        select: {
          meals: true,
        },
      },
    },
  });

  // Calculate macros for each recipe
  const recipesWithMacros = recipes.map((recipe) => {
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

    return {
      ...recipe,
      totalRawWeight,
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
            <h1 className="text-3xl font-bold text-gray-900">Recipes</h1>
            <p className="text-gray-600 mt-1">
              Manage your recipes with ingredients and cooked weights
            </p>
          </div>
          <Link href="/recipes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Recipe
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Recipes</CardTitle>
            <CardDescription>
              Create recipes from ingredients and track cooked weights
            </CardDescription>
            <div className="pt-4">
              <form action="/recipes" method="get" className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    name="search"
                    placeholder="Search recipes..."
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
            {recipesWithMacros.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {search
                    ? "No recipes found matching your search."
                    : "No recipes yet. Create your first one!"}
                </p>
                <Link href="/recipes/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Recipe
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Raw Weight</TableHead>
                      <TableHead className="text-right">Cooked Weight</TableHead>
                      <TableHead className="text-right">Protein</TableHead>
                      <TableHead className="text-right">Fat</TableHead>
                      <TableHead className="text-right">Carbs</TableHead>
                      <TableHead className="text-right">Calories</TableHead>
                      <TableHead className="text-center">Used In</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipesWithMacros.map((recipe) => (
                      <TableRow key={recipe.id}>
                        <TableCell>
                          <Link
                            href={`/recipes/${recipe.id}`}
                            className="font-medium hover:underline"
                          >
                            {recipe.name}
                          </Link>
                          {recipe.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {recipe.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {recipe.totalRawWeight.toFixed(0)}g
                        </TableCell>
                        <TableCell className="text-right">
                          {recipe.cookedWeight ? (
                            <span className="font-medium">
                              {recipe.cookedWeight.toFixed(0)}g
                            </span>
                          ) : (
                            <Link href={`/recipes/${recipe.id}`}>
                              <Button variant="ghost" size="sm">
                                Set
                              </Button>
                            </Link>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {recipe.totalProtein.toFixed(1)}g
                        </TableCell>
                        <TableCell className="text-right">
                          {recipe.totalFat.toFixed(1)}g
                        </TableCell>
                        <TableCell className="text-right">
                          {recipe.totalCarbs.toFixed(1)}g
                        </TableCell>
                        <TableCell className="text-right">
                          {recipe.totalKcal.toFixed(0)} kcal
                        </TableCell>
                        <TableCell className="text-center">
                          {recipe._count.meals > 0 ? (
                            <Badge variant="secondary">
                              {recipe._count.meals}{" "}
                              {recipe._count.meals === 1 ? "meal" : "meals"}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Not used
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/recipes/${recipe.id}/edit`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                            <DeleteRecipeButton
                              id={recipe.id}
                              name={recipe.name}
                              isUsed={recipe._count.meals > 0}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
