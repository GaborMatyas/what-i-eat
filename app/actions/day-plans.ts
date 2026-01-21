"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const mealSchema = z.object({
  recipeId: z.string().min(1, "Recipe is required"),
  portionSize: z.coerce
    .number()
    .min(0.1, "Portion size must be greater than 0"),
});

const dayPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  meals: z.array(mealSchema).min(1, "At least one meal is required"),
});

export async function createDayPlan(formData: FormData) {
  await requireAuth();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  // Parse meals from form data
  const meals: { recipeId: string; portionSize: number }[] = [];
  let index = 0;

  while (formData.has(`meals[${index}][recipeId]`)) {
    const recipeId = formData.get(`meals[${index}][recipeId]`) as string;
    const portionSize = formData.get(`meals[${index}][portionSize]`) as string;

    if (recipeId && portionSize) {
      meals.push({ recipeId, portionSize: parseFloat(portionSize) });
    }
    index++;
  }

  const data = {
    name,
    description: description || undefined,
    meals,
  };

  const result = dayPlanSchema.safeParse(data);

  if (!result.success) {
    return {
      error: result.error.issues[0].message,
    };
  }

  try {
    await prisma.dayPlan.create({
      data: {
        name: result.data.name,
        description: result.data.description,
        meals: {
          create: result.data.meals.map((meal, index) => ({
            recipeId: meal.recipeId,
            portionSize: meal.portionSize,
            order: index,
          })),
        },
      },
    });

    revalidatePath("/day-plans");
    redirect("/day-plans");
  } catch (error: unknown) {
    if ((error as any).code === "P2002") {
      return {
        error: "A day plan with this name already exists",
      };
    }
    return {
      error: "Failed to create day plan",
    };
  }
}

export async function updateDayPlan(id: string, formData: FormData) {
  await requireAuth();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  // Parse meals from form data
  const meals: { recipeId: string; portionSize: number }[] = [];
  let index = 0;

  while (formData.has(`meals[${index}][recipeId]`)) {
    const recipeId = formData.get(`meals[${index}][recipeId]`) as string;
    const portionSize = formData.get(`meals[${index}][portionSize]`) as string;

    if (recipeId && portionSize) {
      meals.push({ recipeId, portionSize: parseFloat(portionSize) });
    }
    index++;
  }

  const data = {
    name,
    description: description || undefined,
    meals,
  };

  const result = dayPlanSchema.safeParse(data);

  if (!result.success) {
    return {
      error: result.error.issues[0].message,
    };
  }

  try {
    // Delete existing meals and create new ones (simpler than updating)
    await prisma.dayPlan.update({
      where: { id },
      data: {
        name: result.data.name,
        description: result.data.description,
        meals: {
          deleteMany: {},
          create: result.data.meals.map((meal, index) => ({
            recipeId: meal.recipeId,
            portionSize: meal.portionSize,
            order: index,
          })),
        },
      },
    });

    revalidatePath("/day-plans");
    revalidatePath(`/day-plans/${id}`);
    redirect("/day-plans");
  } catch (error: unknown) {
    if ((error as any).code === "P2002") {
      return {
        error: "A day plan with this name already exists",
      };
    }
    return {
      error: "Failed to update day plan",
    };
  }
}

export async function deleteDayPlan(id: string) {
  await requireAuth();

  try {
    await prisma.dayPlan.delete({
      where: { id },
    });

    revalidatePath("/day-plans");
  } catch {
    return {
      error: "Failed to delete day plan",
    };
  }
}

export async function duplicateDayPlan(id: string) {
  await requireAuth();

  try {
    const dayPlan = await prisma.dayPlan.findUnique({
      where: { id },
      include: {
        meals: true,
      },
    });

    if (!dayPlan) {
      return {
        error: "Day plan not found",
      };
    }

    await prisma.dayPlan.create({
      data: {
        name: `${dayPlan.name} (Copy)`,
        description: dayPlan.description,
        meals: {
          create: dayPlan.meals.map((meal) => ({
            recipeId: meal.recipeId,
            portionSize: meal.portionSize,
            order: meal.order,
          })),
        },
      },
    });

    revalidatePath("/day-plans");
    redirect("/day-plans");
  } catch {
    return {
      error: "Failed to duplicate day plan",
    };
  }
}

// Calculate day plan total macros
export async function getDayPlanMacros(dayPlanId: string) {
  const dayPlan = await prisma.dayPlan.findUnique({
    where: { id: dayPlanId },
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
    return null;
  }

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

    meal.recipe.ingredients.forEach((recipeIngredient: any) => {
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
      },
    };
  });

  return {
    dayPlan,
    meals: mealsWithMacros,
    totals: {
      protein: totalProtein,
      fat: totalFat,
      carbs: totalCarbs,
      kcal: totalKcal,
    },
  };
}
