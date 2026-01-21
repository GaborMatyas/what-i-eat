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
import { Plus, Search } from "lucide-react";
import { DeleteIngredientButton } from "@/components/delete-ingredient-button";

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  await requireAuth();

  const search = searchParams.search || "";

  const ingredients = await prisma.ingredient.findMany({
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
      _count: {
        select: {
          recipeIngredients: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ingredients</h1>
            <p className="text-gray-600 mt-1">
              Manage your ingredient database with nutritional information
            </p>
          </div>
          <Link href="/ingredients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Ingredient
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Ingredients</CardTitle>
            <CardDescription>
              Nutritional values are per 100g of raw ingredient
            </CardDescription>
            <div className="pt-4">
              <form action="/ingredients" method="get" className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    name="search"
                    placeholder="Search ingredients..."
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
            {ingredients.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {search
                    ? "No ingredients found matching your search."
                    : "No ingredients yet. Add your first one!"}
                </p>
                <Link href="/ingredients/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Ingredient
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Protein (g)</TableHead>
                      <TableHead className="text-right">Fat (g)</TableHead>
                      <TableHead className="text-right">Carbs (g)</TableHead>
                      <TableHead className="text-right">Calories</TableHead>
                      <TableHead className="text-center">Used In</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredients.map((ingredient) => (
                      <TableRow key={ingredient.id}>
                        <TableCell className="font-medium">
                          {ingredient.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {ingredient.protein.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {ingredient.fat.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {ingredient.carbs.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {ingredient.kcal.toFixed(0)} kcal
                        </TableCell>
                        <TableCell className="text-center">
                          {ingredient._count.recipeIngredients > 0 ? (
                            <Badge variant="secondary">
                              {ingredient._count.recipeIngredients}{" "}
                              {ingredient._count.recipeIngredients === 1
                                ? "recipe"
                                : "recipes"}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Not used
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/ingredients/${ingredient.id}/edit`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                            <DeleteIngredientButton
                              id={ingredient.id}
                              name={ingredient.name}
                              isUsed={
                                ingredient._count.recipeIngredients > 0
                              }
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
