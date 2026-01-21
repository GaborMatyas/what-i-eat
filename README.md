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

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Session-based with iron-session and bcrypt
- **UI**: Tailwind CSS + shadcn/ui components
- **Deployment**: Vercel (frontend) + Neon/Supabase (database)

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ or 24.0+
- PostgreSQL database (local or cloud)

### Installation

1. Clone the repository:
```bash
cd what-i-eat
```

2. Install dependencies:
```bash
npm install
```

3. Set up your database:

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/what-i-eat"
```

For **Neon** (recommended for free hosting):
- Sign up at https://neon.tech
- Create a new project
- Copy the connection string to `DATABASE_URL`

For **Supabase**:
- Sign up at https://supabase.com
- Create a new project
- Go to Settings > Database and copy the connection string

4. Push the database schema:
```bash
npm run db:push
```

5. Create your user account:
```bash
npm run create-user
```

Follow the prompts to create your account with email and password.

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) and log in!

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema to database
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:generate` - Generate Prisma Client
- `npm run create-user` - Create a new user account

## Database Schema

### Ingredient
Stores base nutritional information per 100g:
- Name
- Protein (g)
- Fat (g)
- Carbs (g)
- Calories (kcal)

### Recipe
Collection of ingredients with optional cooked weight:
- Name
- Description
- Cooked weight (optional)
- List of ingredients with raw weights

### Meal
A recipe with a specific portion size:
- Recipe reference
- Portion size (grams of cooked/prepared food)
- Day plan reference

### DayPlan
Named meal plan containing multiple meals:
- Name (e.g., "High Protein Day")
- Description
- List of meals

## How Macro Calculations Work

The app handles the difference between raw and cooked weights:

1. **Raw Ingredients**: You add ingredients with their nutritional values per 100g (raw)
2. **Recipe Creation**: You specify how many grams of each raw ingredient goes into a recipe
3. **Cooked Weight**: After cooking, you enter the total cooked weight
4. **Portion Calculation**: When you eat, you specify how many grams of the cooked food you consume

**Example:**
- Recipe: 300g raw chicken + 200g raw rice = 500g total raw weight
- After cooking: 700g cooked weight (rice absorbed water)
- You eat: 350g of cooked food = 50% of the recipe
- Macros calculated: 50% of (300g chicken + 200g rice) nutritional values

## Deployment

### Free Deployment Options

#### Option 1: Vercel + Neon (Recommended)

**Database (Neon):**
1. Sign up at https://neon.tech (free tier: 3GB storage)
2. Create a new project
3. Copy the connection string

**Frontend (Vercel):**
1. Push your code to GitHub
2. Sign up at https://vercel.com
3. Import your GitHub repository
4. Add environment variable: `DATABASE_URL` with your Neon connection string
5. Deploy!

#### Option 2: Vercel + Supabase

**Database (Supabase):**
1. Sign up at https://supabase.com (free tier: 500MB)
2. Create a new project
3. Go to Settings > Database and copy the connection string

**Frontend (Vercel):**
Same as above, but use Supabase connection string

### Environment Variables for Production

```env
DATABASE_URL="your_database_connection_string"
NODE_ENV="production"
```

### Creating User in Production

After deploying, you can create users by:

1. SSH into your hosting environment (if available)
2. Run: `npm run create-user`

Alternatively, you can temporarily add a registration page or use a database GUI like Prisma Studio locally with production connection.

## Project Structure

```
what-i-eat/
├── app/
│   ├── actions/          # Server actions (auth, ingredients, recipes, etc.)
│   ├── ingredients/      # Ingredients pages
│   ├── recipes/          # Recipes pages (to be implemented)
│   ├── meals/            # Meals pages (to be implemented)
│   ├── day-plans/        # Day plans pages (to be implemented)
│   ├── login/            # Login page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── navigation.tsx    # Main navigation
│   └── ...               # Other components
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
├── scripts/
│   └── create-user.ts    # User creation script
└── middleware.ts         # Route protection
```

## Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ HTTP-only session cookies
- ✅ CSRF protection via SameSite cookies
- ✅ Route protection with middleware
- ✅ Server-side authentication checks
- ✅ No password exposure in client-side code

## Future Enhancements

- [ ] Recipe search and filtering
- [ ] Meal plan duplication
- [ ] Export day plans as PDF
- [ ] Nutritional goals tracking
- [ ] Mobile-responsive design improvements
- [ ] Recipe photos
- [ ] Meal prep scheduling

## License

This is a personal project. Feel free to fork and modify for your own use.

## Support

For issues or questions, please open an issue on GitHub.