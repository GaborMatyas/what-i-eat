# What I Eat 🍽️

A personal food tracking and meal planning application for managing ingredients, recipes, meals, and day plans with detailed nutritional information.

## Features

- 🥗 **Ingredients Database**: Store ingredients with nutritional values (protein, fat, carbs, calories per 100g)
- 📖 **Recipe Management**: Create recipes from ingredients with raw and cooked weight tracking
- 🍴 **Meal Planning**: Build meals from recipes with custom portion sizes
- 📅 **Day Plans**: Create named meal plans (e.g., "High Protein Day", "Waffle + Chicken + Potato")
- 🔐 **Secure Authentication**: Session-based authentication with bcrypt password hashing
- 📊 **Macro Calculations**: Automatic calculation of macros based on cooked vs raw weight ratios

## Tech Stack

- **Framework**: Next.js 16.1.4 (App Router, TypeScript, Turbopack)
- **Database**: PostgreSQL (Neon) with Prisma ORM 7.3.0
- **Database Adapter**: Native PostgreSQL adapter (`@prisma/adapter-pg` + `pg`)
- **Authentication**: Session-based with bcrypt password hashing
- **UI**: Tailwind CSS v4 + shadcn/ui components
- **Deployment**: Vercel (frontend) + Neon (database)

## Getting Started

### Prerequisites

- **Node.js 24.13.0+** (required for Prisma 7)
- PostgreSQL database (Neon recommended)

### Installation

1. **Clone the repository:**
```bash
cd what-i-eat
```

2. **Ensure you have Node.js 24+:**
```bash
# If using nvm:
nvm install --lts
nvm use --lts

# Set as default (optional):
nvm alias default 24
```

3. **Install dependencies:**
```bash
npm install
```

4. **Set up your database:**

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

**For Neon (Recommended - Free 3GB):**
- Sign up at https://neon.tech
- Create a new project
- Copy the connection string to `DATABASE_URL`
- ⚠️ **Note**: If your connection string includes `channel_binding=require`, it will work fine with our setup

**For Supabase:**
- Sign up at https://supabase.com
- Create a new project
- Go to Settings > Database and copy the connection string

5. **Push the database schema:**
```bash
npm run db:push
```

6. **Create your user account:**
```bash
npm run create-user
```

Follow the prompts to create your account:
- Email
- Name (optional)
- Password (min 6 characters)
- Confirm password

7. **Run the development server:**
```bash
npm run dev
```

8. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000) and log in with your credentials!

## Available Scripts

- `npm run dev` - Start development server (with Turbopack)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema to database
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:generate` - Generate Prisma Client
- `npm run create-user` - Create a new user account (terminal script)

## Important Notes

### Prisma 7 + Database Adapters

This project uses Prisma 7, which requires database adapters. We use the native PostgreSQL adapter (`@prisma/adapter-pg`) instead of the Neon serverless adapter due to a known bug in Prisma 7.3.0 with `@prisma/adapter-neon`.

**Why `pg` instead of `@neondatabase/serverless`?**
- The Neon serverless adapter has a bug in Prisma 7 where connection strings aren't properly passed
- See: https://github.com/prisma/prisma/issues/27417
- The native `pg` driver works perfectly with Neon's PostgreSQL database

### Node.js Version

Prisma 7 requires Node.js 20.19+, 22.12+, or 24.0+. We recommend using Node.js 24 LTS.

## Database Schema

### User & Session
Authentication models:
- **User**: Email, hashed password, name
- **Session**: Session ID, user reference, expiration

### Ingredient
Stores base nutritional information per 100g:
- Name (unique)
- Protein (g)
- Fat (g)
- Carbs (g)
- Calories (kcal)

### Recipe
Collection of ingredients with optional cooked weight:
- Name (unique)
- Description
- Cooked weight (optional)
- Ingredients list with raw weights

### RecipeIngredient
Junction table linking recipes to ingredients:
- Recipe reference
- Ingredient reference
- Weight (grams of raw ingredient)

### Meal
A recipe portion within a day plan:
- Recipe reference
- Portion size (grams of cooked/prepared food)
- Day plan reference
- Order (meal sequence in the day)

### DayPlan
Named meal plan containing multiple meals:
- Name (unique, e.g., "High Protein Day")
- Description
- Meals list

## How Macro Calculations Work

The app correctly handles the difference between raw and cooked weights:

### The Logic

1. **Raw Ingredients**: You add ingredients with nutritional values per 100g (raw state)
2. **Recipe Creation**: You specify the raw weight of each ingredient in the recipe
3. **Cooked Weight**: After cooking, you update the recipe with the total cooked weight
4. **Portion Calculation**: When creating a meal, you specify how many grams of cooked food to eat
5. **Macro Calculation**: The app calculates the percentage of the total recipe you're eating

### Example Scenario

**Creating the Recipe:**
- 300g raw chicken breast
- 200g raw rice
- **Total raw weight**: 500g

**After Cooking:**
- Rice absorbed water → **Total cooked weight**: 700g

**Your Meal:**
- You eat 350g of the cooked dish
- That's 350g ÷ 700g = **50% of the recipe**

**Macros Calculated:**
- 50% of 300g chicken nutrition
- 50% of 200g rice nutrition
- **Result**: Accurate macros for your 350g portion

### Why This Works

The key insight is that **cooking doesn't change the total macros** - it only changes the weight:
- **Weight Loss** (grilling meat/fish): More concentrated macros per gram of cooked food
- **Weight Gain** (boiling rice/pasta): More diluted macros per gram of cooked food

The app always calculates based on the original raw ingredient macros, then adjusts for the portion size relative to the total recipe.

## Deployment

### Free Deployment: Vercel + Neon

**Step 1: Database (Neon - Free 3GB)**

1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string (including any parameters like `channel_binding=require`)
4. Save it - you'll need it for Vercel

**Step 2: Code (GitHub)**

1. Push your code to GitHub
2. Make sure `.env` is in `.gitignore` (it already is)

**Step 3: Frontend (Vercel - Free for Hobby)**

1. Sign up at https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variable:
   - Key: `DATABASE_URL`
   - Value: Your Neon connection string
5. Deploy!

**Step 4: Create User in Production**

After deployment, create your user:
- Option A: Run `npm run create-user` locally with production DATABASE_URL in `.env`
- Option B: Use Prisma Studio: `npm run db:studio` (connect to production DB)

### Environment Variables

```env
# Required
DATABASE_URL="postgresql://..."

# Optional (auto-set by Vercel)
NODE_ENV="production"
```

## Project Structure

```
what-i-eat/
├── app/
│   ├── actions/              # Server actions
│   │   ├── auth.ts          # Login/logout
│   │   ├── ingredients.ts   # Ingredient CRUD
│   │   ├── recipes.ts       # Recipe CRUD + macro calculations
│   │   └── day-plans.ts     # Day plan CRUD + macro calculations
│   ├── ingredients/          # Ingredients pages (list, new, edit)
│   ├── recipes/              # Recipes pages (list, new, edit, detail)
│   ├── day-plans/            # Day plans pages (list, new, edit, detail)
│   ├── login/                # Login page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Dashboard
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── navigation.tsx        # Main navigation bar
│   ├── ingredient-form.tsx   # Ingredient create/edit form
│   ├── recipe-form.tsx       # Recipe create/edit form with dynamic ingredients
│   ├── day-plan-form.tsx     # Day plan create/edit form with meals
│   ├── update-cooked-weight-form.tsx  # Quick cooked weight update
│   ├── delete-*-button.tsx   # Delete confirmation dialogs
│   └── duplicate-day-plan-button.tsx  # Duplicate day plan feature
├── lib/
│   ├── auth.ts              # Authentication utilities & session management
│   ├── prisma.ts            # Prisma client with pg adapter
│   └── utils.ts             # Utility functions (cn, etc.)
├── prisma/
│   └── schema.prisma        # Database schema (Prisma 7 format)
├── scripts/
│   └── create-user.ts       # CLI user creation script
├── middleware.ts            # Route protection
├── prisma.config.ts         # Prisma 7 configuration
└── .env                     # Environment variables (not in git)
```

## Implemented Features

### ✅ Fully Functional

1. **Authentication**
   - Login with email/password
   - Secure session management
   - Route protection
   - Terminal user creation script

2. **Ingredients Management**
   - List all ingredients with search
   - Add new ingredients (name, protein, fat, carbs, kcal per 100g)
   - Edit existing ingredients
   - Delete ingredients (protected if used in recipes)
   - Shows usage count

3. **Recipes Management**
   - List all recipes with calculated macros
   - Create recipes with multiple ingredients and raw weights
   - Edit recipes (update ingredients, weights, description)
   - Delete recipes (protected if used in day plans)
   - Set/update cooked weight after cooking
   - View detailed recipe page with:
     - Ingredient list with weights
     - Total macros (for entire recipe)
     - Per 100g macros (cooked or raw)
     - Weight change percentage
     - Usage in day plans

4. **Day Plans Management**
   - List all day plans with total macros
   - Create named day plans with multiple meals
   - Edit day plans (update meals and portions)
   - Delete day plans
   - Duplicate day plans
   - View detailed day plan with:
     - Total daily macros
     - Macro distribution chart
     - Meal-by-meal breakdown
     - Portion calculations
     - Weight and percentage info

5. **Dashboard**
   - Statistics cards (ingredients, recipes, day plans count)
   - Quick action buttons
   - Recent recipes list
   - Getting started guide for new users

## Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ HTTP-only session cookies
- ✅ CSRF protection via SameSite cookies
- ✅ Secure session storage in database
- ✅ Route protection with middleware
- ✅ Server-side authentication checks
- ✅ Environment variable protection
- ✅ No sensitive data in client-side code

## Troubleshooting

### "No database host or connection string was set"

This error occurs with the Neon serverless adapter in Prisma 7. The app uses the native `pg` adapter instead, which works correctly.

### "PrismaClient needs to be constructed with options"

Make sure you're using Node.js 24+ and have regenerated the Prisma client:
```bash
npm run db:generate
```

### Hydration Errors

These should not occur. If you see them, make sure:
1. The database connection is working (`lib/prisma.ts` uses `pg` adapter)
2. You've restarted the dev server after making changes

### ESM/Module Errors

Ensure you're using Node.js 24+ (Prisma 7 requirement):
```bash
node --version  # Should be v24.x.x or higher
```

## Known Issues

- ⚠️ Prisma 7.3.0 has a bug with `@prisma/adapter-neon` (GitHub issue #27417)
  - **Workaround**: We use `@prisma/adapter-pg` with native `pg` driver
  - This works perfectly with Neon's PostgreSQL database
  
- ⚠️ Next.js 16 shows a middleware deprecation warning
  - This is informational only and doesn't affect functionality
  - The middleware works correctly for route protection

## Future Enhancements

- [ ] Recipe search and filtering with advanced options
- [ ] Nutritional goals and daily tracking
- [ ] Progress charts and statistics
- [ ] Export day plans as PDF
- [ ] Mobile app (React Native)
- [ ] Recipe photos and gallery
- [ ] Meal prep scheduling and calendar
- [ ] Shopping list generation
- [ ] Barcode scanning for packaged foods
- [ ] Recipe sharing (optional multi-user)

## Contributing

This is a personal project, but feel free to fork and modify for your own use!

## License

MIT License - Feel free to use this for your own personal meal tracking.

## Support

For issues or questions:
- Check the Troubleshooting section above
- Review the GitHub issue tracker
- Open a new issue with detailed information

---

**Built with ❤️ for personal nutrition tracking**