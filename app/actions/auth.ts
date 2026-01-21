"use server";

import { redirect } from "next/navigation";
import { verifyLogin, createSession, deleteSession } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate input
  const result = loginSchema.safeParse({ email, password });

  if (!result.success) {
    return {
      error: result.error.issues[0].message,
    };
  }

  // Verify credentials
  const user = await verifyLogin(email, password);

  if (!user) {
    return {
      error: "Invalid email or password",
    };
  }

  // Create session
  await createSession(user.id);

  // Redirect to home
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
