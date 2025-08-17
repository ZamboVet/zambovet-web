# ZamboVet - Veterinary Management System

A comprehensive web-based veterinary management system built with Next.js 15, React 18, TypeScript, and Supabase.

## Features

### For Pet Owners
- 🐾 **Pet Management**: Add, update, and manage pet profiles
- 📅 **Appointment Booking**: Schedule appointments with veterinarians
- 🏥 **Clinic Discovery**: Find nearby veterinary clinics
- 📱 **Real-time Notifications**: Get updates on appointment status
- 👤 **Profile Management**: Manage personal and emergency contact information

### For Veterinarians
- 👨‍⚕️ **Dashboard**: Comprehensive veterinarian dashboard
- 📋 **Appointment Management**: Accept, decline, and manage appointments
- 🏥 **Clinic Profile**: Manage clinic information and operating hours
- 📊 **Patient Records**: Access patient history and medical records
- ✅ **Status Updates**: Update appointment status in real-time

### For Administrators
- 🔧 **User Management**: Create and manage veterinarian accounts
- 📊 **System Overview**: Monitor system usage and statistics
- 🏥 **Clinic Management**: Oversee clinic registrations and data

## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Email**: NodeMailer with Gmail
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ZamboVet/zambovet-web.git
cd zambovet-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GMAIL_APP_PASSWORD=your_gmail_app_password
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Pet owner dashboard
│   ├── veterinarian/      # Veterinarian dashboard
│   ├── login/             # Login page
│   └── signup/            # Registration page
├── components/            # Reusable UI components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
└── pages/                 # Additional pages
```

## Key Features Implementation

### Authentication & Authorization
- Multi-role authentication system (Pet Owner, Veterinarian, Admin)
- Protected routes with middleware
- Session management with Supabase Auth

### Real-time Updates
- Live appointment status updates
- Real-time notifications
- Instant dashboard updates

### Responsive Design
- Mobile-first approach
- Tailwind CSS for consistent styling
- Dark/light mode support

### Security
- Input sanitization and validation
- Rate limiting on API endpoints
- Secure environment variable handling
- Protected API routes

## Live Demo

🌐 **[Visit ZamboVet Live Application](https://zambovet-web.vercel.app)**

## Quick Start

### For Pet Owners:
1. **Sign up** for a new account
2. **Add your pets** to your profile
3. **Find nearby clinics** and veterinarians
4. **Book appointments** with ease
5. **Get real-time updates** on appointment status

### For Veterinarians:
1. **Contact admin** to create your veterinarian account
2. **Set up your clinic** information
3. **Manage appointments** and patient records
4. **Update appointment status** in real-time

### For Administrators:
1. **Create veterinarian accounts** through the admin panel
2. **Monitor system usage** and manage users
3. **Oversee clinic registrations** and data

---

Built with ❤️ for the Zamboanga veterinary community.
