import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as readline from "readline";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env file explicitly
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function createUser() {
  let prisma: PrismaClient | null = null;
  let pool: pg.Pool | null = null;

  try {
    console.log("\n=== Create New User ===\n");

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      console.error("❌ DATABASE_URL is not set in .env file");
      process.exit(1);
    }

    // Initialize Prisma with native PostgreSQL adapter
    pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });

    const email = await question("Email: ");
    if (!email || !email.includes("@")) {
      console.error("❌ Invalid email address");
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error("❌ User with this email already exists");
      process.exit(1);
    }

    const name = await question("Name (optional): ");
    const password = await question("Password: ");

    if (!password || password.length < 6) {
      console.error("❌ Password must be at least 6 characters long");
      process.exit(1);
    }

    const confirmPassword = await question("Confirm password: ");

    if (password !== confirmPassword) {
      console.error("❌ Passwords do not match");
      process.exit(1);
    }

    // Hash password
    console.log("\n⏳ Creating user...");
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
      },
    });

    console.log("\n✅ User created successfully!");
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || "N/A"}`);
    console.log(`   ID: ${user.id}`);
    console.log("\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error creating user:", error);
    process.exit(1);
  } finally {
    rl.close();
    if (prisma) {
      await prisma.$disconnect();
    }
    if (pool) {
      await pool.end();
    }
  }
}

createUser();
