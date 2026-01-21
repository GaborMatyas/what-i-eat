"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const recipeIngredientSchema = z.object({
  ingredientId: z.string().min(1, "Ingredient is required"),
  weight: z.coerce.number().min(0.1, "Weight must be greater than 0"),
});

const recipeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  cookedWeight: z.coerce.number().min(0).optional().nullable(),
  ingredients: z
    .array(recipeIngredientSchema)
    .min(1, "At least one ingredient is required"),
});

export async function createRecipe(formData: FormData) {
  await requireAuth();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const cookedWeight = formData.get("cookedWeight") as string;

  // Parse ingredients from form data
  const ingredients: { ingredientId: string; weight: number }[] = [];
  let index = 0;

  while (formData.has(`ingredients[${index}][ingredientId]`)) {
    const ingredientId = formData.get(
      `ingredients[${index}][ingredientId]`,
    ) as string;
    const weight = formData.get(`ingredients[${index}][weight]`) as string;

    if (ingredientId && weight) {
      ingredients.push({ ingredientId, weight: parseFloat(weight) });
    }
    index++;
  }

  const data = {
    name,
    description: description || undefined,
    cookedWeight: cookedWeight ? parseFloat(cookedWeight) : null,
    ingredients,
  };

  const result = recipeSchema.safeParse(data);

  if (!result.success) {
    return {
      error: result.error.issues[0].message,
    };
  }

  try {
    await prisma.recipe.create({
      data: {
        name: result.data.name,
        description: result.data.description,
        cookedWeight: result.data.cookedWeight,
        ingredients: {
          create: result.data.ingredients.map((ing) => ({
            ingredientId: ing.ingredientId,
            weight: ing.weight,
          })),
        },
      },
    });

    revalidatePath("/recipes");
    redirect("/recipes");
  } catch (error: unknown) {
    if ((error as any).code === "P2002") {
      return {
        error: "A recipe with this name already exists",
      };
    }
    return {
      error: "Failed to create recipe",
    };
  }
}

export async function updateRecipe(id: string, formData: FormData) {
  await requireAuth();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const cookedWeight = formData.get("cookedWeight") as string;

  // Parse ingredients from form data
  const ingredients: { ingredientId: string; weight: number }[] = [];
  let index = 0;

  while (formData.has(`ingredients[${index}][ingredientId]`)) {
    const ingredientId = formData.get(
      `ingredients[${index}][ingredientId]`,
    ) as string;
    const weight = formData.get(`ingredients[${index}][weight]`) as string;

    if (ingredientId && weight) {
      ingredients.push({ ingredientId, weight: parseFloat(weight) });
    }
    index++;
  }

  const data = {
    name,
    description: description || undefined,
    cookedWeight: cookedWeight ? parseFloat(cookedWeight) : null,
    ingredients,
  };

  const result = recipeSchema.safeParse(data);

  if (!result.success) {
    return {
      error: result.error.issues[0].message,
    };
  }

  try {
    // Delete existing ingredients and create new ones (simpler than updating)
    await prisma.recipe.update({
      where: { id },
      data: {
        name: result.data.name,
        description: result.data.description,
        cookedWeight: result.data.cookedWeight,
        ingredients: {
          deleteMany: {},
          create: result.data.ingredients.map((ing) => ({
            ingredientId: ing.ingredientId,
            weight: ing.weight,
          })),
        },
      },
    });

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${id}`);
    redirect("/recipes");
  } catch (error: unknown) {
    if ((error as any).code === "P2002") {
      return {
        error: "A recipe with this name already exists",
      };
    }
    return {
      error: "Failed to update recipe",
    };
  }
}

export async function deleteRecipe(id: string) {
  await requireAuth();

  try {
    await prisma.recipe.delete({
      where: { id },
    });

    revalidatePath("/recipes");
  } catch (error: unknown) {
    if ((error as any).code === "P2003") {
      return {
        error: "Cannot delete recipe that is used in day plans",
      };
    }
    return {
      error: "Failed to delete recipe",
    };
  }
}

export async function updateRecipeCookedWeight(
  id: string,
  cookedWeight: number,
) {
  await requireAuth();

  try {
    await prisma.recipe.update({
      where: { id },
      data: { cookedWeight },
    });

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${id}`);

    return { success: true };
  } catch {
    return {
      error: "Failed to update cooked weight",
    };
  }
}

// Calculate recipe macros (raw weight basis)
export async function getRecipeMacros(recipeId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  if (!recipe) {
    return null;
  }

  let totalRawWeight = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalKcal = 0;

  recipe.ingredients.forEach((recipeIngredient: any) => {
    const weight = recipeIngredient.weight;
    const ingredient = recipeIngredient.ingredient;

    totalRawWeight += weight;
    totalProtein += (ingredient.protein / 100) * weight;
    totalFat += (ingredient.fat / 100) * weight;
    totalCarbs += (ingredient.carbs / 100) * weight;
    totalKcal += (ingredient.kcal / 100) * weight;
  });

  return {
    recipe,
    totalRawWeight,
    cookedWeight: recipe.cookedWeight,
    protein: totalProtein,
    fat: totalFat,
    carbs: totalCarbs,
    kcal: totalKcal,
    // Per 100g of cooked weight (if cooked weight is provided)
    per100gCooked: recipe.cookedWeight
      ? {
          protein: (totalProtein / recipe.cookedWeight) * 100,
          fat: (totalFat / recipe.cookedWeight) * 100,
          carbs: (totalCarbs / recipe.cookedWeight) * 100,
          kcal: (totalKcal / recipe.cookedWeight) * 100,
        }
      : null,
    // Per 100g of raw weight
    per100gRaw: {
      protein: (totalProtein / totalRawWeight) * 100,
      fat: (totalFat / totalRawWeight) * 100,
      carbs: (totalCarbs / totalRawWeight) * 100,
      kcal: (totalKcal / totalRawWeight) * 100,
    },
  };
}
