"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const ingredientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  protein: z.coerce.number().min(0, "Protein must be a positive number"),
  fat: z.coerce.number().min(0, "Fat must be a positive number"),
  carbs: z.coerce.number().min(0, "Carbs must be a positive number"),
  kcal: z.coerce.number().min(0, "Calories must be a positive number"),
});

export async function createIngredient(formData: FormData) {
  await requireAuth();

  const data = {
    name: formData.get("name") as string,
    protein: formData.get("protein") as string,
    fat: formData.get("fat") as string,
    carbs: formData.get("carbs") as string,
    kcal: formData.get("kcal") as string,
  };

  const result = ingredientSchema.safeParse(data);

  if (!result.success) {
    return {
      error: result.error.issues[0].message,
    };
  }

  try {
    await prisma.ingredient.create({
      data: {
        name: result.data.name,
        protein: result.data.protein,
        fat: result.data.fat,
        carbs: result.data.carbs,
        kcal: result.data.kcal,
      },
    });

    revalidatePath("/ingredients");
    redirect("/ingredients");
  } catch (error: unknown) {
    if ((error as any).code === "P2002") {
      return {
        error: "An ingredient with this name already exists",
      };
    }
    return {
      error: "Failed to create ingredient",
    };
  }
}

export async function updateIngredient(id: string, formData: FormData) {
  await requireAuth();

  const data = {
    name: formData.get("name") as string,
    protein: formData.get("protein") as string,
    fat: formData.get("fat") as string,
    carbs: formData.get("carbs") as string,
    kcal: formData.get("kcal") as string,
  };

  const result = ingredientSchema.safeParse(data);

  if (!result.success) {
    return {
      error: result.error.issues[0].message,
    };
  }

  try {
    await prisma.ingredient.update({
      where: { id },
      data: {
        name: result.data.name,
        protein: result.data.protein,
        fat: result.data.fat,
        carbs: result.data.carbs,
        kcal: result.data.kcal,
      },
    });

    revalidatePath("/ingredients");
    revalidatePath(`/ingredients/${id}`);
    redirect("/ingredients");
  } catch (error: unknown) {
    if ((error as any).code === "P2002") {
      return {
        error: "An ingredient with this name already exists",
      };
    }
    return {
      error: "Failed to update ingredient",
    };
  }
}

export async function deleteIngredient(id: string) {
  await requireAuth();

  try {
    await prisma.ingredient.delete({
      where: { id },
    });

    revalidatePath("/ingredients");
  } catch (error: unknown) {
    if ((error as any).code === "P2003") {
      return {
        error: "Cannot delete ingredient that is used in recipes",
      };
    }
    return {
      error: "Failed to delete ingredient",
    };
  }
}
