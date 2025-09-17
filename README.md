# Leadership Enablement System

A comprehensive leadership enablement system for overwhelmed sales representative leaders in structural sales environments. This system provides structured reflection, weekday-specific focus topics, and concrete action guides to serve as an operational leadership assistant.

## Features

- **Role-based Authentication**: Hierarchical roles (Advisor, Sub-Leader, Top-Leader) with Clerk
- **Weekday-specific Workflows**: Monday, Tuesday, Wednesday focus areas with action guides
- **Team Coordination**: Real-time team status and check-in management
- **Executive Dashboard**: Clean, professional interface for leadership tasks
- **GDPR Compliance**: Automatic data deletion after 30 days

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with executive-level design system
- **Authentication**: Clerk with hierarchical roles
- **Database**: Supabase with PostgreSQL
- **Deployment**: Vercel

## Quick Start

### 1. Environment Setup

Copy the environment template and fill in your credentials:

```bash
cp env.example .env.local
```

Fill in the following environment variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Enable Row Level Security (RLS) on all tables
4. Set up the cleanup function for GDPR compliance

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── advisor/           # Advisor dashboard
│   ├── leader/            # Leader dashboard
│   ├── onboarding/        # User onboarding flow
│   └── dashboard/         # Main dashboard redirect
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── action-guide.tsx  # Weekday action guides
│   ├── team-member-card.tsx
│   └── ...
├── lib/                  # Utility functions
│   ├── auth.ts          # Authentication helpers
│   ├── supabase.ts      # Database client
│   ├── action-guides.ts # Weekday content
│   └── utils.ts         # General utilities
└── middleware.ts         # Clerk authentication middleware
```

## User Roles

### Advisor
- Daily check-in and reflection
- Access to weekday-specific guidance
- Personal development tracking

### Sub-Leader
- Team management and coordination
- Advisor check-in oversight
- Action guide execution

### Top-Leader
- Multi-team oversight
- Strategic planning and execution
- Executive dashboard access

## Weekday Workflows

### Monday: Team Alignment
- Morning team check-ins
- Weekly goal setting
- Priority alignment

### Tuesday: Performance Review
- Individual performance discussions
- Coaching conversations
- Development planning

### Wednesday: Strategic Planning
- Mid-week adjustments
- Resource allocation
- Progress tracking

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Ensure all environment variables are set in your Vercel project settings.

## GDPR Compliance

The system automatically deletes user data after 30 days through a scheduled cleanup function. This ensures compliance with GDPR requirements for data retention.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for internal use only.