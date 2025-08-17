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

## API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Appointment Management
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/[id]` - Update appointment
- `PATCH /api/appointments/[id]/status` - Update appointment status

### Pet Management
- `GET /api/pets` - List pets
- `POST /api/pets` - Add pet
- `PUT /api/pets/[id]` - Update pet
- `DELETE /api/pets/[id]` - Remove pet

### Clinic Management
- `GET /api/clinics` - List clinics
- `GET /api/veterinarian/clinic` - Get veterinarian's clinic
- `PUT /api/veterinarian/clinic` - Update clinic information

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## Database Schema

The application uses Supabase with the following main tables:
- `profiles` - User profiles and roles
- `pet_owner_profiles` - Pet owner specific information
- `veterinarians` - Veterinarian profiles and credentials
- `clinics` - Veterinary clinic information
- `patients` - Pet/patient records
- `appointments` - Appointment scheduling and management
- `notifications` - User notifications

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `GMAIL_APP_PASSWORD` | Gmail app password for notifications | Optional |

## Support

For support, email vetzambo@gmail.com or create an issue in this repository.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for the Zamboanga veterinary community.
