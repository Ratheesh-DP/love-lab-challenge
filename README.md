# Love Lab Challenge - A Dating App with AI-Powered Matching

A gamified dating application where users engage in a 60-day challenge to find meaningful connections. The app features AI-driven profile analysis, a points-based engagement system, and real-time interaction matching.

**Live Demo:** [View Project](#) | **Repository:** [GitHub](https://github.com/Ratheesh-DP/love-lab-challenge)

---

## 📋 Problem Statement

Traditional dating apps lack engagement depth and personalization. Users swipe endlessly without meaningful interactions, and there's no incentive for authentic connections. This project addresses:

- **Engagement Paradox**: Users need motivation to have quality interactions, not just profiles
- **Personalization Gap**: Most apps show matches based on basic filters, not compatibility
- **Monetization Alignment**: Create a sustainable model where premium features genuinely enhance user experience
- **Data Insights**: Track user behavior to improve matching over time

---

## 💡 Solution Overview

**Love Lab Challenge** combines gamification, AI intelligence, and real-time interactions:

1. **Gamified Engagement**: Users earn and spend "points" for actions (likes, messages, profile boosts)
2. **AI-Powered Profiles**: OpenAI analyzes bios and generates personality insights
3. **Smart Matching**: Match scoring algorithm considers interests, vibe compatibility, and distance
4. **In-App Store**: Premium point bundles purchased via UPI with server-side validation
5. **Admin Dashboard**: Moderators review purchases and manage user data
6. **Real-Time Interactions**: Instant notifications and live feed updates

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) - UI library for component-based architecture
- **Router**: [TanStack Router 1.170](https://tanstack.com/router) - Type-safe client-side routing
- **Full-Stack Meta-Framework**: [TanStack Start 1.168](https://tanstack.com/start) - Server functions & streaming SSR
- **State Management**: [TanStack React Query 5.101](https://tanstack.com/query) - Server state, caching, and synchronization
- **UI Components**: [Radix UI](https://radix-ui.com/) - Accessible, composable primitives
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [Tailwind Merge](https://github.com/dcastil/tailwind-merge) - Utility-first styling
- **Forms**: [React Hook Form 7.71](https://react-hook-form.com/) + [Zod 4.6](https://zod.dev/) - Type-safe form validation
- **Charts & Visualization**: [Recharts 2.15](https://recharts.org/) - Data visualization for stats
- **Notifications**: [Sonner 2.0](https://sonner.emilkowal.ski/) - Toast notifications
- **Icons**: [Lucide React 0.575](https://lucide.dev/) - SVG icon library
- **Date Handling**: [date-fns 4.1](https://date-fns.org/) - Utility functions for date manipulation
- **Carousel**: [Embla Carousel React 8.6](https://www.emblacarousel.com/) - Touch-friendly carousel component
- **Auth UI**: [@lovable.dev/cloud-auth-js 1.1](https://lovable.dev/) - Cloud authentication (removed in favor of custom flow)

### Backend & Server
- **API Framework**: [Nitro 3.0](https://nitro.unjs.io/) - Lightweight Node.js server via TanStack Start
- **Validation**: [Zod 4.6](https://zod.dev/) - Runtime type validation
- **Drizzle ORM 0.45**: TypeScript-first ORM for database queries
  - Type-safe query builders
  - Auto-generated migrations with [drizzle-kit 0.31](https://orm.drizzle.team/kit-docs)
  - Full control over SQL

### Database
- **PostgreSQL** (via Supabase) - Relational database
- **Supabase JS Client 2.117** - SDK for auth, database, and real-time features
- **Tables**:
  - `user_state`: Stores user profiles, points balance, and dater state (JSON blob per user)
  - `purchase_requests`: Payment records for audit trail
  - `reports`: Moderator-reviewed user reports
  - Profile data: interests, bio, generated personality insights

### AI & LLMs
- **OpenAI API via @ai-sdk/openai 4.0**: Claude/GPT model access
- **Vercel AI SDK 7.0**: Unified LLM interface for streaming and completions
- **Use Case**: Analyze user bios → generate 5-word personality tags + short personality snippet

### Build & Development
- **Build Tool**: [Vite 8.1.5](https://vitejs.dev/) - Lightning-fast bundler with HMR
- **TypeScript 5.8**: Full type safety across the stack
- **ESLint 9.32** + **Prettier 3.7**: Code quality and formatting
- **Testing**: [Vitest 4.1](https://vitest.dev/) - Unit and component tests
- **Vite Plugins**:
  - [@tailwindcss/vite 4.2](https://tailwindcss.com/) - Tailwind CSS engine integration
  - [@tanstack/router-plugin 1.168](https://tanstack.com/router) - Auto-generate route tree
  - [vite-tsconfig-paths 6.0](https://www.npmjs.com/package/vite-tsconfig-paths) - TypeScript path aliases

### Payment & Monetization
- **UPI (Unified Payments Interface)**: India-native digital payment system
- **Payment Flow**:
  1. User selects a point bundle in `/store`
  2. Client generates UPI deep link with merchant ID + amount
  3. User confirms payment in their bank app
  4. User submits transaction ID (UTR) to the app
  5. **Server-side validation**: Purchase webhook or manual verification adds points to `user_state`
  6. **Why server-side?** Client-written points can be faked; we validate on trusted backend

### Authentication & Security
- Supabase Auth (PostgreSQL with RLS policies)
- Row-Level Security (RLS) on `purchase_requests` table
- Only approved bundles allowed (validated in insert policy)

---

## 🏗️ Architecture & Key Design Decisions

### State Management Strategy

**Why this approach?**

```plaintext
┌─────────────────────────────────────────────────────┐
│              User State (JSON Blob)                 │
├─────────────────────────────────────────────────────┤
│ • Profile data (interests, bio, photos)             │
│ • Points balance (client-editable for UI)           │
│ • Dater state (preferences, viewed profiles, etc.)  │
│ • Persists to PostgreSQL `user_state` table         │
│ • Syncs across devices                              │
└─────────────────────────────────────────────────────┘
                         ↓
              TanStack React Query
              (cache, sync, refetch)
                         ↓
┌─────────────────────────────────────────────────────┐
│         Server-Side Validation Layer                │
├─────────────────────────────────────────────────────┤
│ • Purchase webhook verification (Stripe, UPI)       │
│ • Points credit only after payment confirmed        │
│ • Reports table for audit trail                     │
│ • Admin moderation & fraud prevention               │
└─────────────────────────────────────────────────────┘
```

**Rationale**:
- **Points in client state**: Fast UI updates without server round-trips
- **Points validated server-side before claiming**: Prevents fake purchases
- **Separate reports table**: Moderators review without touching primary state
- **JSON blob per user**: Cross-device persistence with minimal schema changes

### API Design (Server Functions)

Using TanStack Start's server functions instead of REST:

```typescript
// src/server/createServerFn.ts
export const claimPurchases = createServerFn('GET /api/claim-purchases', async () => {
  const user = await supabase.auth.getUser();
  const { data: approved } = await supabase
    .from('purchase_requests')
    .select('points')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .eq('claimed', false);
  
  // Update user_state with verified points
  // Return count of points added
});
```

**Benefits**:
- Type-safe: TypeScript validates client ↔ server contracts
- No REST boilerplate: Just async functions
- Streaming SSR: Initial HTML includes data
- RPC-style: Call server functions like local code

### Database Schema Highlights

```sql
-- user_state: Stores profile, points, and dater state as JSON
CREATE TABLE user_state (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users,
  profile JSONB NOT NULL, -- { interests: [], bio: "", photos: [] }
  points INTEGER NOT NULL DEFAULT 0,
  dater_state JSONB NOT NULL, -- { viewed: [], liked: [], matches: [] }
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- purchase_requests: Server-validated payment records
CREATE TABLE purchase_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  bundle_id TEXT NOT NULL CHECK (bundle_id IN ('spark', 'flame', 'wildfire')),
  points INTEGER NOT NULL,
  amount_inr NUMERIC NOT NULL,
  reference TEXT NOT NULL UNIQUE, -- UPI transaction ID (UTR)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📂 Project Structure

```
love-lab-challenge/
├── src/
│   ├── routes/                    # File-based routing (TanStack Router)
│   │   ├── __root.tsx            # App shell, wraps all pages
│   │   ├── index.tsx             # Home / landing
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   └── signup.tsx
│   │   ├── profile.tsx           # User profile & bio editor
│   │   ├── explore.tsx           # Swipe/match interface
│   │   ├── matches.tsx           # List of matches & conversations
│   │   ├── store.tsx             # Point bundles & purchases (UPI)
│   │   ├── wallet.tsx            # Points balance & transaction history
│   │   └── admin/
│   │       ├── dashboard.tsx     # Moderation & purchase review
│   │       └── reports.tsx       # User reports & flagged accounts
│   │
│   ├── components/
│   │   ├── AppShell.tsx          # Navigation wrapper
│   │   ├── ProfileCard.tsx       # Swipeable match card
│   │   ├── MatchScore.tsx        # Compatibility percentage
│   │   └── [...other components]
│   │
│   ├── lib/
│   │   ├── store.ts             # React Query hooks, state sync logic
│   │   ├── matching.ts          # Match scoring algorithm
│   │   └── types.ts             # TypeScript interfaces
│   │
│   ├── server/
│   │   ├── createServerFn.ts    # Server-side purchase verification
│   │   └── ai.ts                # OpenAI integration for profile analysis
│   │
│   └── integrations/
│       └── supabase/
│           └── client.ts        # Supabase JS client singleton
│
├── vite.config.ts               # Vite + TailwindCSS + Router plugin config
├── tsconfig.json                # TypeScript strict mode
├── package.json                 # Dependencies & scripts
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (or use [nvm](https://github.com/nvm-sh/nvm))
- **npm 9+**
- **PostgreSQL** (local or Supabase account)
- **Supabase Project** (create free at [supabase.com](https://supabase.com))
- **OpenAI API Key** (for profile AI analysis)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Ratheesh-DP/love-lab-challenge.git
cd love-lab-challenge

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create a .env.local file:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-...
UPI_MERCHANT_ID=your-upi-id

# 4. Set up database
# Option A: Use Supabase migrations
npm run db:migrate

# Option B: Manual setup - run SQL scripts in Supabase dashboard
# See docs/schema.sql

# 5. Start dev server
npm run dev
# Visit http://localhost:5173
```

### Available Scripts

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # Build for production
npm run build:dev    # Build in development mode (source maps)
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run test         # Run Vitest once
npm run test:watch   # Run Vitest in watch mode
```

---

## 🎯 Key Features & Implementation

### 1. **Gamified Engagement System**
- Users earn/spend points for profile interactions
- Three point bundle tiers: Spark (100 pts), Flame (300 pts), Wildfire (750 pts)
- Points stored in client state, validated server-side before spending

### 2. **AI-Powered Profile Analysis**
```typescript
// Analyze bio with OpenAI
const { text: personality } = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: `Analyze this dating profile bio and provide:
    1. Five personality tags (e.g., "adventurous", "introverted")
    2. A 1-sentence personality summary
    Bio: ${userBio}`,
});
// Result stored in user_state.profile.personality_tags
```

### 3. **Smart Matching Algorithm**
```typescript
function calculateMatchScore(user1, user2) {
  // Factors:
  // - Interest overlap (Jaccard similarity)
  // - Distance penalty (lat/long based)
  // - Vibe compatibility (personality tag similarity)
  // - Engagement history (mutual likes boost score)
  // Returns: 0-100 score
}
```

### 4. **UPI Payment Integration**
- Generate UPI deep link: `upi://pay?pa=merchant-id&am=amount&tn=description`
- User confirms payment in their bank app
- Submit transaction ID (UTR) to verify payment
- Server validates and credits points
- Audit trail in `purchase_requests` table

### 5. **Admin Dashboard**
- View pending purchases awaiting verification
- Approve/reject payments with notes
- Monitor user reports and flag suspicious accounts
- Real-time stats on engagement & revenue

---

## 🧠 What I Learned

### Technical Learnings

1. **Full-Stack TypeScript Architecture**
   - Type safety across browser ↔ server boundary
   - Server functions are cleaner than REST for type-driven APIs
   - TanStack Router's type-safe route definitions prevent navigation bugs

2. **Drizzle ORM & Migrations**
   - Writing SQL-like queries with TypeScript types saves debugging time
   - Auto-migrations keep schema in version control
   - Query builder types catch errors at dev time, not runtime

3. **State Management with React Query**
   - Separate "client state" (UI) from "server state" (database)
   - Mutations with optimistic updates feel instant to users
   - Background refetching keeps data fresh without page reloads

4. **Real-Time Features**
   - Supabase realtime subscriptions notify all connected clients
   - WebSocket-based, scales better than polling
   - RLS policies ensure users can't subscribe to private data

5. **Payment Processing**
   - Never trust client-side point balances; validate server-side
   - UPI is India's fastest growing payment method, low friction
   - Idempotency keys prevent double-crediting on retries

6. **Radix UI Accessibility**
   - Unstyled components force thoughtful component design
   - Built-in ARIA labels and keyboard navigation
   - Composable API makes custom designs easier than base HTML

### Design & Product Learnings

1. **Gamification Mechanics**
   - Variable reward schedules increase engagement (not just predictable rewards)
   - Scarcity (limited points) drives purchases
   - Progress bars + milestones keep users coming back

2. **Data Privacy & Security**
   - RLS policies in PostgreSQL enforce auth at the database layer
   - Sensitive data (payment info) should never live in JSON blobs
   - Audit trails (reports table) help with regulatory compliance

3. **Monetization**
   - Premium features should enhance core experience, not gate it
   - Multiple price tiers convert different user segments
   - Transparent pricing + clear value proposition increase conversion

4. **Cross-Device Persistence**
   - JSON blobs in a single row is simpler than normalizing everything
   - Trade-off: less queryable, but faster for mobile apps
   - Sync logic can be simple: "overwrite my entire state from server"

---

## 📊 Performance Optimizations

- **Lazy Code Splitting**: Routes loaded on-demand via TanStack Router
- **Query Caching**: React Query deduplicates identical requests
- **Optimistic Updates**: UI updates before server confirms (with rollback)
- **Tailwind PurgeCSS**: Only shipped styles used in the app
- **Image Optimization**: Avatar images lazy-loaded, SVG icons avoid HTTP requests

---

## 🔐 Security Considerations

- **RLS Policies**: PostgreSQL row-level security on all tables
- **Server-Side Validation**: All purchases verified before points credited
- **Auth State**: Supabase handles session tokens, refresh logic
- **HTTPS Only**: Environment variables stored securely
- **Rate Limiting**: Planned — prevent abuse on purchase requests

---

## 🐛 Known Limitations & Future Work

### Current Limitations
- [ ] Payment verification is manual (needs webhook automation)
- [ ] No real-time chat (yet; Supabase realtime ready)
- [ ] Match algorithm is basic (could add ML ranking)
- [ ] Mobile responsiveness in progress

### Roadmap
- [ ] Webhook integration with Stripe/Razorpay for auto-payment verification
- [ ] Push notifications for matches & messages
- [ ] Premium membership tiers
- [ ] Machine learning match ranking (collaborative filtering)
- [ ] Video profiles & verification badges
- [ ] In-app messaging with typing indicators

---

## 🤝 Contributing

Pull requests are welcome! For major changes:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is open source under the MIT License — see `LICENSE` file for details.

---

## 📞 Contact & Support

- **Email**: d.p.ratheesh007@gmail.com
- **GitHub**: [@Ratheesh-DP](https://github.com/Ratheesh-DP)
- **Issues**: [GitHub Issues](https://github.com/Ratheesh-DP/love-lab-challenge/issues)

---

## 🎓 Learn More

- [TanStack Start Docs](https://tanstack.com/start/latest)
- [Drizzle ORM Guide](https://orm.drizzle.team/)
- [Supabase Database Setup](https://supabase.com/docs/guides/database)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Built with ❤️ by Ratheesh D P**
