# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

ZamboVet is a comprehensive veterinary management system built with Next.js 15, React 18, TypeScript, and Supabase. It serves three user roles: pet owners, veterinarians, and administrators through different dashboards and workflows.

## Common Development Commands

### Development Workflow
```powershell
# Install dependencies
npm install

# Start development server with Turbopack
npm run dev

# Build production version
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Database Operations
```powershell
# Export database to SQL
node export-db-to-sql.js

# Export specific tables
node export-specific-tables.js

# Test database connection
node test-db.js

# Clear authentication data
node clear-auth-data.js
```

### Testing and Development Scripts
```powershell
# Test dashboard modules
.\test_dashboard_modules.ps1

# Test storage setup
.\test_storage_setup.ps1
```

## High-Level Architecture

### Multi-Role Authentication System
The application implements a sophisticated three-tier authentication system:
- **Pet Owners**: Can book appointments, manage pets, view appointment history
- **Veterinarians**: Can manage appointments, view patient records, update appointment status
- **Administrators**: Can manage veterinarians, oversee system usage, handle clinic registrations

The auth system uses Supabase Auth with custom middleware (`middleware.ts`) for route protection and role-based redirects. The `AuthContext.tsx` provides centralized authentication state management with optimized profile fetching and error handling.

### Database Architecture
Built on Supabase (PostgreSQL) with the following key entity relationships:
- **Profiles** → **Pet Owner Profiles** / **Veterinarians** (role-based profiles)
- **Pet Owners** → **Patients** (pets) → **Appointments**
- **Clinics** → **Veterinarians** → **Appointments**
- **Services** → **Appointments** (appointment types and pricing)

### Application Structure

#### Frontend Architecture
- **App Router** (`src/app/`): Next.js 15 app directory structure
  - Role-specific dashboards: `/dashboard` (pet owners), `/veterinarian` (vets), `/admin`
  - Authentication flows: `/auth`, `/login`, `/signup`
  - API routes: `/api` for backend operations

- **Component Architecture** (`src/components/`):
  - `auth/`: Authentication components including `ProtectedRoute.tsx` for role-based access
  - `dashboard/`: Role-specific dashboard components
  - `appointments/`: Complex multi-step booking system with modular components
  - Reusable UI components throughout

#### Key Business Logic Components

**Appointment System**: Multi-step booking process with:
1. Clinic selection with map integration
2. Veterinarian selection with ratings/experience
3. Service selection (consultation types)
4. Date/time scheduling
5. Pet selection
6. Visit details and confirmation

**Real-time Features**: Uses Supabase Realtime for:
- Live appointment status updates
- Dashboard notifications
- Real-time appointment management for veterinarians

### State Management Patterns
- **Authentication**: Centralized in `AuthContext.tsx` with optimized session handling
- **Component State**: Local useState for form states and UI interactions
- **Database State**: Direct Supabase client calls with error handling patterns
- **Route Protection**: Middleware-based authentication checks

### API Layer
RESTful API design in `src/app/api/`:
- **Authentication endpoints**: Session management, role verification
- **Appointment endpoints**: CRUD operations with status management
- **User management**: Profile operations, role-based access

### Error Handling Strategy
Comprehensive error handling implemented:
- **AuthHelper class** (`src/lib/auth-helper.ts`): Handles auth token refresh errors and session cleanup
- **API error boundaries**: Consistent error responses across endpoints
- **UI feedback**: User-friendly error messages and loading states

## Development Guidelines

### Code Patterns to Follow

#### Authentication Flow
Always use the `useAuth()` hook for authentication state and the `ProtectedRoute` component for route protection:

```typescript
const { user, userProfile, loading } = useAuth();

// For protected pages
<ProtectedRoute requiredRole="pet_owner">
  <YourComponent />
</ProtectedRoute>
```

#### Database Operations
Use the centralized Supabase client from `@/lib/supabase` with proper error handling:

```typescript
try {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('column', value);
  
  if (error) throw error;
  // Handle data
} catch (error) {
  console.error('Operation failed:', error);
  // Handle error appropriately
}
```

#### Role-Based Access
The system uses role-based access control. Always verify user roles before showing sensitive data or allowing operations.

### File Organization Conventions
- **Components**: Group by feature/domain in `src/components/`
- **Pages**: Use Next.js 15 App Router structure in `src/app/`
- **Utils**: Helper functions in `src/lib/` and `src/utils/`
- **Types**: TypeScript interfaces typically co-located with components

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GMAIL_APP_PASSWORD=your_gmail_app_password
```

## Critical Development Notes

### Authentication Edge Cases
The system includes sophisticated error handling for Supabase auth refresh token issues. The `AuthHelper` class handles token cleanup and user session management - don't bypass this system.

### Database Row Level Security (RLS)
The application relies heavily on Supabase RLS policies. When adding new tables or modifying existing ones, ensure proper RLS policies are in place for each user role.

### Real-time Subscriptions
When working with real-time features, always clean up subscriptions in useEffect cleanup functions to prevent memory leaks.

### Performance Considerations
- The AuthContext implements optimized profile fetching with configurable retries
- Large components use dynamic imports (e.g., map components) to reduce bundle size
- Database queries are optimized with joins to reduce round trips

### Multi-Step Form Pattern
The appointment booking system uses a sophisticated multi-step form pattern. When extending or modifying, maintain the step validation pattern and mobile responsiveness considerations.

## Development Roadmap Context

The project is approximately 60% complete according to `DEVELOPMENT_ROADMAP.md`. Key missing features include:
- Payment processing system (Phase 1 priority)
- Medical records management (Phase 1 priority)
- Advanced features like reviews, analytics (later phases)

When implementing new features, reference the roadmap for architectural decisions and priority order.